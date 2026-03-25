"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useEditor } from "@craftjs/core";
import { X, Smartphone, Move, Minus, ChevronDown, Edit2, Check } from "lucide-react";
import { serializeCraftToClean } from "../_lib/serializer";
import { WebPreview } from "../_lib/webRenderer";
import { PREVIEW_MOBILE_BREAKPOINT } from "../_lib/viewportConstants";
import type { BuilderDocument } from "../_types/schema";
import { slugFromName } from "../_lib/slug";
import { useDesignProject } from "../_context/DesignProjectContext";

interface FloatingMobilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  activePageId?: string | null;
  onRenamePage?: (pageId: string, newName: string) => void;
}

interface PageInfo {
  id: string;
  name: string;
}

type MobileDevicePreset = {
  id: string;
  name: string;
  width: number;
  height: number;
};

const MOBILE_DEVICE_PRESETS: MobileDevicePreset[] = [
  { id: "iphone-15-pro-max", name: "iPhone 15 Pro Max", width: 430, height: 932 },
  { id: "iphone-15", name: "iPhone 15 / 14", width: 390, height: 844 },
  { id: "iphone-15-pro", name: "iPhone 15 Pro", width: 393, height: 852 },
  { id: "iphone-14-plus", name: "iPhone 14 Plus", width: 428, height: 926 },
  { id: "iphone-13-mini", name: "iPhone 13 mini", width: 375, height: 812 },
  { id: "iphone-12-pro", name: "iPhone 12 / 12 Pro", width: 390, height: 844 },
  { id: "iphone-se", name: "iPhone SE", width: 375, height: 667 },
  { id: "samsung-s24-ultra", name: "Samsung Galaxy S24 Ultra", width: 412, height: 915 },
  { id: "samsung-s24", name: "Samsung Galaxy S24", width: 360, height: 780 },
  { id: "samsung-s23", name: "Samsung Galaxy S23", width: 360, height: 780 },
  { id: "samsung-a54", name: "Samsung Galaxy A54", width: 360, height: 800 },
  { id: "pixel-8-pro", name: "Google Pixel 8 Pro", width: 412, height: 915 },
  { id: "pixel-8", name: "Pixel 8", width: 412, height: 915 },
  { id: "pixel-7a", name: "Google Pixel 7a", width: 412, height: 915 },
  { id: "oneplus-12", name: "OnePlus 12", width: 412, height: 919 },
  { id: "xiaomi-13", name: "Xiaomi 13", width: 393, height: 851 },
  { id: "nothing-phone-2", name: "Nothing Phone (2)", width: 412, height: 915 },
  { id: "galaxy-z-fold", name: "Galaxy Z Fold (cover)", width: 280, height: 653 },
  { id: "galaxy-z-flip", name: "Galaxy Z Flip (cover)", width: 360, height: 748 },
];

const DEFAULT_MOBILE_DEVICE = MOBILE_DEVICE_PRESETS[0];

export const FloatingMobilePreview: React.FC<FloatingMobilePreviewProps> = ({
  isOpen,
  onClose,
  activePageId,
  onRenamePage,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { actions } = useEditor();
  const { query, pages, selectedPageFromCanvas, nodes } = useEditor((state) => {
    const allNodes = state.nodes ?? {};
    const pageList: PageInfo[] = [];

    Object.entries(allNodes).forEach(([nodeId, node]) => {
      if (node?.data?.displayName === "Page") {
        pageList.push({
          id: nodeId,
          name: ((node.data.props as Record<string, unknown>)?.pageName as string) || "Untitled Page",
        });
      }
    });

    let detectedPageId: string | null = null;
    const selectedIds = state.events.selected;
    const selectedId =
      selectedIds instanceof Set
        ? selectedIds.values().next().value
        : Array.isArray(selectedIds)
          ? selectedIds[0]
          : null;

    if (selectedId && selectedId !== "ROOT") {
      const selectedNode = allNodes[selectedId];
      if (selectedNode?.data?.displayName === "Page") {
        detectedPageId = selectedId;
      } else if (selectedNode) {
        let currentId: string | null = selectedNode.data?.parent ?? null;
        while (currentId && currentId !== "ROOT") {
          const parentNode = allNodes[currentId];
          if (parentNode?.data?.displayName === "Page") {
            detectedPageId = currentId;
            break;
          }
          currentId = parentNode?.data?.parent ?? null;
        }
      }
    }

    return {
      pages: pageList,
      selectedPageFromCanvas: detectedPageId,
      nodes: allNodes,
    };
  });
  const { permission } = useDesignProject();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragRafRef = useRef<number>(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(DEFAULT_MOBILE_DEVICE.id);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [isRenamingPage, setIsRenamingPage] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const lastGoodDocRef = useRef<BuilderDocument | null>(null);

  const selectedDevice = useMemo(
    () => MOBILE_DEVICE_PRESETS.find((d) => d.id === selectedDeviceId) ?? DEFAULT_MOBILE_DEVICE,
    [selectedDeviceId],
  );

  const previewWidth = selectedDevice.width;
  const previewHeight = selectedDevice.height;

  const liveDoc = useMemo<BuilderDocument | null>(() => {
    try {
      const raw = query.serialize();
      const parsed = serializeCraftToClean(raw);
      if (parsed?.pages?.length) {
        lastGoodDocRef.current = parsed;
        return parsed;
      }
      return lastGoodDocRef.current;
    } catch {
      return lastGoodDocRef.current;
    }
  }, [query, nodes]);

  const previewPages = useMemo<PageInfo[]>(() => {
    if (liveDoc?.pages?.length) {
      return liveDoc.pages.map((page, index) => ({
        id: page.id,
        name: page.name || (page.props?.pageName as string) || `Page ${index + 1}`,
      }));
    }
    return pages;
  }, [liveDoc, pages]);

  useEffect(() => {
    if (isOpen && positionRef.current.x === 0 && positionRef.current.y === 0) {
      const initial = {
        x: window.innerWidth - previewWidth - 80,
        y: 80,
      };
      positionRef.current = initial;
      setPosition(initial);
    }
  }, [isOpen, previewWidth]);

  useEffect(() => {
    if (!isOpen) return;
    if (activePageId && previewPages.find((p) => p.id === activePageId)) {
      setSelectedPageId(activePageId);
      return;
    }
    if (selectedPageFromCanvas && pages.find((p) => p.id === selectedPageFromCanvas)) {
      setSelectedPageId(selectedPageFromCanvas);
    }
  }, [isOpen, activePageId, selectedPageFromCanvas, previewPages, pages]);

  useEffect(() => {
    if (!isOpen) return;
    if (previewPages.length > 0 && (!selectedPageId || !previewPages.find((p) => p.id === selectedPageId))) {
      setSelectedPageId(previewPages[0].id);
    }
  }, [isOpen, previewPages, selectedPageId]);

  useEffect(() => {
    if (!isRenamingPage) {
      const currentName = previewPages.find((page) => page.id === selectedPageId)?.name ?? "";
      setRenameValue(currentName);
    }
  }, [isRenamingPage, previewPages, selectedPageId]);

  useEffect(() => {
    if (!isOpen) return;

    const updateViewportSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, [isOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-drag-handle]")) {
      e.preventDefault();
      isDraggingRef.current = true;
      setIsDragging(true);
      document.body.style.userSelect = "none";
      dragStartRef.current = {
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      };
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);

      dragRafRef.current = requestAnimationFrame(() => {
        const newX = Math.max(
          0,
          Math.min(e.clientX - dragStartRef.current.x, window.innerWidth - previewWidth - 40),
        );
        const newY = Math.max(48, Math.min(e.clientY - dragStartRef.current.y, window.innerHeight - 100));

        positionRef.current = { x: newX, y: newY };
        const el = panelRef.current;
        if (el) {
          el.style.left = `${newX}px`;
          el.style.top = `${newY}px`;
        }
      });
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
      setPosition({ ...positionRef.current });
      setIsDragging(false);
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
    };
  }, [previewWidth]);

  const previewDoc = useMemo<BuilderDocument | null>(() => {
    if (!liveDoc) return null;

    const targetWidth = `${previewWidth}px`;
    const targetHeight = `${previewHeight}px`;

    return {
      ...liveDoc,
      nodes: liveDoc.nodes,
      pages: liveDoc.pages.map((page, index) => {
        const slugFromPage = typeof page.slug === "string" ? page.slug.trim() : "";
        const slugFromProps =
          typeof page.props?.pageSlug === "string" ? page.props.pageSlug.trim() : "";
        const safeSlug = slugFromPage || slugFromProps || `page-${index}`;

        return {
          ...page,
          slug: safeSlug,
          props: {
            ...page.props,
            pageSlug: safeSlug,
            width: targetWidth,
            height: targetHeight,
          },
        };
      }),
    };
  }, [liveDoc, previewWidth, previewHeight]);

  const commitPageRename = useCallback(() => {
    if (!selectedPageId || permission === "viewer") {
      setIsRenamingPage(false);
      return;
    }

    const trimmedName = renameValue.trim() || "Page";
    const slug = slugFromName(trimmedName);
    actions.setProp(selectedPageId, (props: Record<string, unknown>) => {
      props.pageName = trimmedName;
      props.pageSlug = slug;
    });
    onRenamePage?.(selectedPageId, trimmedName);
    setRenameValue(trimmedName);
    setIsRenamingPage(false);
  }, [actions, onRenamePage, permission, renameValue, selectedPageId]);

  if (!isOpen) return null;

  const selectedPage = previewPages.find((p) => p.id === selectedPageId);
  const selectedPageSlug =
    previewDoc?.pages.find((p) => p.id === selectedPageId)?.slug ?? previewDoc?.pages[0]?.slug ?? undefined;
  const hasRenderablePreview = Boolean(previewDoc && previewDoc.pages.length > 0);

  const frameWidth = previewWidth + 20;
  const viewportWidthSafe = viewportSize.width > 0 ? viewportSize.width : previewWidth + 80;
  const viewportHeightSafe = viewportSize.height > 0 ? viewportSize.height : previewHeight + 320;
  const availablePanelWidth = Math.max(320, viewportWidthSafe - 24);
  const panelWidth = isMinimized ? undefined : Math.min(previewWidth + 36, availablePanelWidth);
  const availableFrameWidth = Math.max(220, (panelWidth ?? (previewWidth + 36)) - 16);
  const frameScale = Math.min(1, availableFrameWidth / frameWidth);
  const screenHeight = Math.max(260, Math.min(previewHeight, 620, viewportHeightSafe - 280));

  return (
    <div
      ref={panelRef}
      className={`fixed z-[100] bg-brand-darker/95 backdrop-blur-xl rounded-2xl border border-transparent shadow-2xl ${
        isDragging ? "cursor-grabbing" : "transition-[width] duration-200"
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? "auto" : panelWidth,
        willChange: isDragging ? "left, top" : "auto",
      }}
      onMouseDown={handleMouseDown}
      data-mobile-preview-panel
    >
      <div
        data-drag-handle
        className="flex items-center justify-between px-4 py-3 border-b border-transparent cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-brand-light/50" />
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-brand-lighter">Mobile Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-brand-medium/40 transition-colors text-brand-light hover:text-brand-lighter"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-brand-medium/40 transition-colors text-brand-light hover:text-brand-lighter"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="px-3 py-2 border-b border-transparent">
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <div className="flex items-center gap-2">
                  {isRenamingPage ? (
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitPageRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitPageRename();
                        if (e.key === "Escape") {
                          setRenameValue(selectedPage?.name ?? "");
                          setIsRenamingPage(false);
                        }
                      }}
                      autoFocus
                      className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-brand-medium-dark/50 text-sm text-brand-lighter outline-none border border-blue-400/20"
                      placeholder="Page name"
                    />
                  ) : (
                    <button
                      onClick={() => previewPages.length > 1 && setShowPageDropdown((v) => !v)}
                      className={`min-w-0 flex-1 flex items-center justify-between px-3 py-2 rounded-lg bg-brand-medium-dark/50 transition-colors text-sm text-brand-lighter ${
                        previewPages.length > 1 ? "hover:bg-brand-medium/30 cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <span className="truncate">
                        {previewPages.length === 0 ? "No pages found" : selectedPage?.name || "Select Page"}
                      </span>
                      {previewPages.length > 1 && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${showPageDropdown ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>
                  )}
                  {selectedPage && permission !== "viewer" && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (isRenamingPage) {
                          commitPageRename();
                          return;
                        }
                        setRenameValue(selectedPage.name);
                        setIsRenamingPage(true);
                        setShowPageDropdown(false);
                      }}
                      className="shrink-0 p-2 rounded-lg bg-brand-medium-dark/50 hover:bg-brand-medium/30 text-brand-lighter transition-colors"
                      title={isRenamingPage ? "Save rename" : "Rename page"}
                    >
                      {isRenamingPage ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {showPageDropdown && previewPages.length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-brand-dark border border-transparent rounded-lg shadow-lg py-1 z-10 max-h-48 overflow-y-auto">
                    {previewPages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => {
                          setSelectedPageId(page.id);
                          setShowPageDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          page.id === selectedPageId
                            ? "bg-blue-500/20 text-blue-400"
                            : "text-brand-lighter hover:bg-brand-medium/30"
                        }`}
                      >
                        {page.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowDeviceDropdown((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-brand-medium-dark/50 transition-colors text-sm text-brand-lighter hover:bg-brand-medium/30 cursor-pointer"
                >
                  <span className="truncate">{selectedDevice.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-brand-light/70">
                      {selectedDevice.width}x{selectedDevice.height}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showDeviceDropdown ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>
                {showDeviceDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-brand-dark border border-transparent rounded-lg shadow-lg py-1 z-20 max-h-48 overflow-y-auto">
                    {MOBILE_DEVICE_PRESETS.map((device) => (
                      <button
                        key={device.id}
                        onClick={() => {
                          setSelectedDeviceId(device.id);
                          setShowDeviceDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          device.id === selectedDeviceId
                            ? "bg-blue-500/20 text-blue-400"
                            : "text-brand-lighter hover:bg-brand-medium/30"
                        }`}
                      >
                        <div className="truncate">{device.name}</div>
                        <div className="text-[11px] text-brand-light/70">
                          {device.width}x{device.height}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-2 pb-3 pt-3 flex justify-center">
            <div
              className="flex flex-col items-center rounded-[44px]"
              style={{
                width: frameWidth,
                background: "linear-gradient(160deg,#2c2c2c 0%,#191919 100%)",
                border: "2.5px solid #383838",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.05), 0 32px 80px rgba(0,0,0,0.85), 0 0 0 0.5px rgba(0,0,0,0.95)",
                transform: `scale(${frameScale})`,
                transformOrigin: "top center",
              }}
            >
              <div className="flex flex-col items-center w-full pt-2.5 pb-1">
                <div
                  className="rounded-full flex items-center justify-center gap-2"
                  style={{ width: 114, height: 30, background: "#0c0c0c" }}
                >
                  <div className="rounded-full" style={{ width: 7, height: 7, background: "#252525" }} />
                  <div
                    className="rounded-full"
                    style={{ width: 11, height: 11, background: "#1a1a1a", border: "1.5px solid #2e2e2e" }}
                  />
                </div>
              </div>

              {!hasRenderablePreview || !previewDoc ? (
                <div
                  className="flex items-center justify-center text-neutral-400 text-sm"
                  style={{ width: previewWidth, minHeight: Math.min(300, screenHeight), borderRadius: 20, background: "#ffffff" }}
                >
                  {previewPages.length === 0 ? "Loading pages..." : "Select a page to preview"}
                </div>
              ) : (
                <div
                  style={{
                    width: previewWidth,
                    maxHeight: screenHeight,
                    minHeight: Math.min(previewHeight, 300, screenHeight),
                    borderRadius: 20,
                    overflowY: "auto",
                    overflowX: "hidden",
                    background: "#ffffff",
                  }}
                >
                  <WebPreview
                    key={selectedPageSlug || previewDoc.pages[0]?.slug || "mobile-preview"}
                    doc={previewDoc}
                    initialPageSlug={selectedPageSlug || previewDoc.pages[0]?.slug}
                    onNavigate={(nextPageSlug) => {
                      const nextPage = previewDoc.pages.find((page, index) => {
                        const pageSlug =
                          (typeof page.slug === "string" && page.slug.trim()) ||
                          (typeof page.props?.pageSlug === "string" && page.props.pageSlug.trim()) ||
                          `page-${index}`;
                        return pageSlug === nextPageSlug;
                      });
                      if (nextPage?.id) {
                        setSelectedPageId(nextPage.id);
                        setShowPageDropdown(false);
                      }
                    }}
                    simulatedWidth={previewWidth}
                    mobileBreakpoint={PREVIEW_MOBILE_BREAKPOINT}
                  />
                </div>
              )}

              <div className="flex items-center justify-center w-full py-2.5">
                <div className="rounded-full" style={{ width: 110, height: 4, background: "#383838" }} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
