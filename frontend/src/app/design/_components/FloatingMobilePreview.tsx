"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useEditor } from "@craftjs/core";
import { X, Smartphone, Move, Minus, ChevronDown } from "lucide-react";
import { serializeCraftToClean } from "../_lib/serializer";
import { WebPreview } from "../_lib/webRenderer";
import { PREVIEW_MOBILE_BREAKPOINT } from "../_lib/viewportConstants";
import type { BuilderDocument } from "../_types/schema";

interface FloatingMobilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PageInfo {
  id: string;
  name: string;
}

const MOBILE_PREVIEW_WIDTH = 390;
const MOBILE_PREVIEW_HEIGHT = 844;

export const FloatingMobilePreview: React.FC<FloatingMobilePreviewProps> = ({
  isOpen,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const { query, pages, selectedPageFromCanvas, nodes } = useEditor((state) => {
    const allNodes = state.nodes ?? {};
    const pageList: PageInfo[] = [];

    Object.entries(allNodes).forEach(([nodeId, node]) => {
      if (node?.data?.displayName === "Page") {
        pageList.push({
          id: nodeId,
          name: (node.data.props as Record<string, unknown>)?.pageName as string || "Untitled Page",
        });
      }
    });

    let detectedPageId: string | null = null;
    const selectedIds = state.events.selected;
    const selectedId = selectedIds instanceof Set
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

  const cleanDoc = useMemo<BuilderDocument | null>(() => {
    try {
      const raw = query.serialize();
      const parsed = serializeCraftToClean(raw);
      return parsed?.pages?.length ? parsed : null;
    } catch {
      return null;
    }
  }, [query, nodes]);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragRafRef = useRef<number>(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showPageDropdown, setShowPageDropdown] = useState(false);

  useEffect(() => {
    if (isOpen && positionRef.current.x === 0 && positionRef.current.y === 0) {
      const initial = {
        x: window.innerWidth - MOBILE_PREVIEW_WIDTH - 80,
        y: 80,
      };
      positionRef.current = initial;
      setPosition(initial);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedPageFromCanvas && pages.find((p) => p.id === selectedPageFromCanvas)) {
      setSelectedPageId(selectedPageFromCanvas);
    }
  }, [isOpen, selectedPageFromCanvas, pages]);

  useEffect(() => {
    if (!isOpen) return;
    if (pages.length > 0 && (!selectedPageId || !pages.find((p) => p.id === selectedPageId))) {
      setSelectedPageId(pages[0].id);
    }
  }, [isOpen, pages, selectedPageId]);

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
        const newX = Math.max(0, Math.min(e.clientX - dragStartRef.current.x, window.innerWidth - MOBILE_PREVIEW_WIDTH - 40));
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
  }, []);

  if (!isOpen) return null;

  const selectedPage = pages.find((p) => p.id === selectedPageId);
  const selectedPageSlug = cleanDoc?.pages.find((p) => p.id === selectedPageId)?.slug
    ?? cleanDoc?.pages[0]?.slug
    ?? undefined;

  return (
    <div
      ref={panelRef}
      className={`fixed z-[100] bg-brand-darker/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl ${isDragging ? "cursor-grabbing" : "transition-[width] duration-200"
        }`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? "auto" : MOBILE_PREVIEW_WIDTH + 24,
        willChange: isDragging ? "left, top" : "auto",
      }}
      onMouseDown={handleMouseDown}
      data-mobile-preview-panel
    >
      <div
        data-drag-handle
        className="flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-grab active:cursor-grabbing"
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
          <div className="px-3 py-2 border-b border-white/10">
            <div className="relative">
              <button
                onClick={() => pages.length > 1 && setShowPageDropdown((v) => !v)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg bg-brand-medium-dark/50 transition-colors text-sm text-brand-lighter ${pages.length > 1 ? "hover:bg-brand-medium/30 cursor-pointer" : "cursor-default"
                  }`}
              >
                <span className="truncate">
                  {pages.length === 0 ? "No pages found" : (selectedPage?.name || "Select Page")}
                </span>
                {pages.length > 1 && (
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPageDropdown ? "rotate-180" : ""}`} />
                )}
              </button>
              {showPageDropdown && pages.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-brand-dark border border-white/10 rounded-lg shadow-lg py-1 z-10 max-h-48 overflow-y-auto">
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setSelectedPageId(page.id);
                        setShowPageDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${page.id === selectedPageId
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
          </div>

          <div className="p-3">
            {!cleanDoc || !selectedPageSlug ? (
              <div
                className="rounded-xl border border-white/10 bg-brand-white/5 flex items-center justify-center text-brand-light/50 text-sm"
                style={{ width: MOBILE_PREVIEW_WIDTH, minHeight: Math.min(MOBILE_PREVIEW_HEIGHT, 640) }}
              >
                {pages.length === 0 ? "Loading pages..." : "Select a page to preview"}
              </div>
            ) : (
              <div
                className="rounded-xl border border-white/10 bg-brand-white/5 overflow-auto"
                style={{
                  width: MOBILE_PREVIEW_WIDTH,
                  minHeight: Math.min(MOBILE_PREVIEW_HEIGHT, 640),
                  maxHeight: "70vh",
                }}
              >
                <div style={{ width: MOBILE_PREVIEW_WIDTH, minHeight: MOBILE_PREVIEW_HEIGHT }}>
                  <WebPreview
                    key={selectedPageSlug}
                    doc={cleanDoc}
                    initialPageSlug={selectedPageSlug}
                    simulatedWidth={MOBILE_PREVIEW_WIDTH}
                    mobileBreakpoint={PREVIEW_MOBILE_BREAKPOINT}
                    builderParityMode={false}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
