"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useEditor } from "@craftjs/core";
import Link from "next/link";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Tablet,
  Laptop,
  Monitor,
  Smartphone,
  ChevronDown,
} from "lucide-react";
import { MIN_SCALE, MAX_SCALE, ZOOM_STEP, ZOOM_PRESETS } from "./zoomConstants";
import { selectedToIds } from "../_lib/canvasActions";
import { useCollaboration } from "../_context/CollaborationContext";
import { useDesignProject } from "../_context/DesignProjectContext";
import { ShareModal } from "./ShareModal";
import { getStoredUser } from "@/lib/api";

export type DevicePreset = {
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
};

const MOBILE_PRESET: DevicePreset = {
  name: "Phone",
  width: 390,
  height: 844,
  icon: <Smartphone className="w-4 h-4" />,
};

const LAPTOP_PRESET: DevicePreset = {
  name: "Laptop",
  width: 1440,
  height: 900,
  icon: <Laptop className="w-4 h-4" />,
};

const DEVICE_PRESETS: DevicePreset[] = [
  MOBILE_PRESET,
  {
    name: "Tablet Portrait",
    width: 768,
    height: 1024,
    icon: <Tablet className="w-4 h-4" />,
  },
  {
    name: "Tablet Landscape",
    width: 1024,
    height: 768,
    icon: <Tablet className="w-4 h-4 rotate-90" />,
  },
  LAPTOP_PRESET,
  {
    name: "Desktop",
    width: 1920,
    height: 1080,
    icon: <Monitor className="w-4 h-4" />,
  },
];

interface TopPanelProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRotateCanvas: () => void;
  activePageId?: string | null;
  onFitToCanvas: () => void;
  canvasWidth?: number;
  canvasHeight?: number;
  onDevicePresetSelect?: (preset: DevicePreset) => void;
  showDualView?: boolean;
  onDualViewToggle?: () => void;
  projectId?: string;
  projectTitle?: string;
}

export const TopPanel: React.FC<TopPanelProps> = ({
  scale,
  onScaleChange,
  onZoomIn,
  onZoomOut,
  onRotateCanvas,
  activePageId,
  onFitToCanvas,
  canvasWidth = 1440,
  canvasHeight = 900,
  onDevicePresetSelect,
  showDualView = false,
  onDualViewToggle,
  projectId,
  projectTitle,
}) => {
  const { actions, query } = useEditor();
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DevicePreset | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  // Get collaboration state
  const { collaborators, myColor, connected } = useCollaboration();
  const { permission: projectPermission } = useDesignProject();
  let selfUser: { name?: string; username?: string; email?: string } | null = null;
  try { selfUser = getStoredUser(); } catch { }
  const selfInitial = (selfUser?.name || selfUser?.username || selfUser?.email || "?").charAt(0).toUpperCase();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sizeDropdownRef.current &&
        !sizeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSizeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync selected preset with current canvas dimensions
  useEffect(() => {
    const matchingPreset = DEVICE_PRESETS.find(
      (p) => p.width === canvasWidth && p.height === canvasHeight
    );
    if (matchingPreset) {
      setSelectedPreset(matchingPreset);
    }
  }, [canvasWidth, canvasHeight]);

  const handleZoomIn = () => {
    if (onZoomIn) {
      onZoomIn();
      return;
    }
    const safeScale = Number.isFinite(scale) ? scale : 1;
    const newScale = Math.min(safeScale + ZOOM_STEP, MAX_SCALE);
    onScaleChange(newScale);
  };

  const handleZoomOut = () => {
    if (onZoomOut) {
      onZoomOut();
      return;
    }
    const safeScale = Number.isFinite(scale) ? scale : 1;
    const newScale = Math.max(safeScale - ZOOM_STEP, MIN_SCALE);
    onScaleChange(newScale);
  };

  const handleRotateCanvas = () => {
    try {
      const state = query.getState();
      const nodes = state.nodes ?? {};

      const findPageAncestor = (nodeId: string | null | undefined): string | null => {
        if (!nodeId) return null;
        let cursor: string | null = nodeId;
        const seen = new Set<string>();

        while (cursor && !seen.has(cursor)) {
          seen.add(cursor);
          const node = nodes[cursor] as { data?: { displayName?: string; parent?: string }; parent?: string } | undefined;
          if (!node) return null;
          if (node?.data?.displayName === "Page") return cursor;

          const parentId =
            (typeof node?.data?.parent === "string" ? node.data.parent : null) ??
            (typeof node?.parent === "string" ? node.parent : null);
          cursor = parentId;
        }

        return null;
      };

      let targetPageId: string | null = null;

      const selectedIds = selectedToIds(state?.events?.selected);
      for (const id of selectedIds) {
        const pageId = findPageAncestor(id);
        if (pageId) {
          targetPageId = pageId;
          break;
        }
      }

      if (!targetPageId) {
        const activePage = findPageAncestor(activePageId ?? null);
        if (activePage) targetPageId = activePage;
      }

      if (!targetPageId) {
        const firstPageEntry = Object.entries(nodes).find(([, node]: any) => node?.data?.displayName === "Page");
        targetPageId = firstPageEntry ? firstPageEntry[0] : null;
      }

      if (!targetPageId) return;

      actions.setProp(targetPageId, (props: Record<string, unknown>) => {
        const current = typeof props.pageRotation === "number" && Number.isFinite(props.pageRotation)
          ? props.pageRotation
          : 0;
        props.pageRotation = (current + 90) % 360;
      });
    } catch (error) {
      console.error("Failed to rotate active page:", error);
    }

    onRotateCanvas();
  };

  const handlePresetSelect = useCallback((preset: DevicePreset) => {
    setSelectedPreset(preset);

    // Update all Page nodes with the new width
    try {
      const state = query.getState();
      const nodes = state.nodes ?? {};
      const rootNode = nodes["ROOT"];

      if (rootNode && Array.isArray(rootNode.data.nodes)) {
        // Find Viewport node first (ROOT -> Viewport -> Pages)
        const viewportId = rootNode.data.nodes[0];
        const viewportNode = nodes[viewportId];

        if (viewportNode && viewportNode.data.displayName === "Viewport") {
          // Get Page nodes from Viewport
          const pageIds = viewportNode.data.nodes ?? [];
          pageIds.forEach((pageId: string) => {
            const pageNode = nodes[pageId];
            if (pageNode?.data?.displayName === "Page") {
              actions.setProp(pageId, (props: Record<string, unknown>) => {
                props.width = `${preset.width}px`;
                // Only update width when changing device; preserve page height so content doesn't reset
              });
            }
          });
        } else {
          // Fallback: try direct children of ROOT
          rootNode.data.nodes.forEach((pageId: string) => {
            const pageNode = nodes[pageId];
            if (pageNode?.data?.displayName === "Page") {
              actions.setProp(pageId, (props: Record<string, unknown>) => {
                props.width = `${preset.width}px`;
                // Only update width when changing device; preserve page height
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to update Page nodes:", error);
    }

    // Call the parent handler to update canvas state
    onDevicePresetSelect?.(preset);
  }, [actions, query, onDevicePresetSelect]);

  const displayWidth = Math.round(canvasWidth);
  const displayHeight = Math.round(canvasHeight);
  const zoomPercentage = Math.round((Number.isFinite(scale) ? scale : 1) * 100);
  const toolbarTextSmoothingStyle: React.CSSProperties = {
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    textRendering: "optimizeLegibility",
  };

  return (
    <div
      data-panel="top-controls"
      className="absolute top-0 left-0 right-0 z-[9999] bg-brand-dark/90 backdrop-blur-lg border-b border-white/10 pointer-events-auto antialiased"
      style={toolbarTextSmoothingStyle}
    >
      <div className="flex items-center justify-between px-4 py-2 h-12">
        {/* Left Section - Canvas Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/m_dashboard"
            className="px-3 py-2 rounded-lg bg-brand-medium-dark hover:bg-brand-medium transition-colors border border-white/10 inline-flex items-center gap-2"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-brand-light" />
            <span className="text-xs font-medium text-brand-light">Back</span>
          </Link>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-brand-medium-dark hover:bg-brand-medium transition-colors border border-white/10"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-brand-light" />
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-brand-medium-dark hover:bg-brand-medium transition-colors border border-white/10"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-brand-light" />
          </button>

          {/* Rotate Canvas */}
          <button
            onClick={handleRotateCanvas}
            className="p-2 rounded-lg bg-brand-medium-dark hover:bg-brand-medium transition-colors border border-white/10"
            title="Rotate Canvas"
          >
            <RotateCw className="w-4 h-4 text-brand-light" />
          </button>

          {/* Fit to Canvas */}
          <button
            onClick={onFitToCanvas}
            className="p-2 rounded-lg bg-brand-medium-dark hover:bg-brand-medium transition-colors border border-white/10"
            title="Fit to Canvas"
          >
            <Maximize2 className="w-4 h-4 text-brand-light" />
          </button>

          {/* Size Display with Dropdown */}
          <div className="relative" ref={sizeDropdownRef}>
            <button
              onClick={() => setShowSizeDropdown(!showSizeDropdown)}
              className="px-3 py-2 rounded-lg bg-brand-medium-dark hover:bg-brand-medium transition-colors border border-white/10 flex items-center gap-2 text-sm text-brand-light"
            >
              <span>
                {displayWidth}px × {displayHeight}px @ {zoomPercentage}%
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showSizeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-brand-dark border border-white/10 rounded-lg shadow-lg min-w-[200px] py-1 z-50">
                <div className="px-3 py-2 text-xs text-brand-lighter border-b border-white/10">
                  Canvas Size
                </div>
                <div className="px-3 py-2 text-sm text-brand-light">
                  {displayWidth}px × {displayHeight}px
                </div>
                <div className="px-3 py-2 text-xs text-brand-lighter border-t border-white/10">
                  Zoom: {zoomPercentage}%
                </div>
                <div className="px-2 py-2 border-t border-white/10">
                  <div className="px-2 py-1 text-xs text-brand-lighter mb-1">
                    Quick zoom
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ZOOM_PRESETS.map((presetScale) => {
                      const pct = Math.round(presetScale * 100);
                      const isActive =
                        Math.round((Number.isFinite(scale) ? scale : 1) * 100) ===
                        pct;
                      return (
                        <button
                          key={pct}
                          onClick={() => {
                            onScaleChange(presetScale);
                            setShowSizeDropdown(false);
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${isActive
                            ? "bg-brand-medium text-brand-light"
                            : "bg-brand-medium-dark hover:bg-brand-medium text-brand-lighter"
                            }`}
                        >
                          {pct}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Collaboration + Mobile view toggle + Display size presets */}
        <div className="flex items-center gap-2">
          {/* Collaborator Avatar Stack */}
          <div className="flex items-center">
            {/* Self avatar */}
            <div
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-brand-dark cursor-default z-10"
              style={{ background: myColor }}
              title={`You (${projectPermission})`}
            >
              {selfInitial}
              {/* Online indicator */}
              {connected && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-brand-dark" />
              )}
            </div>
            {/* Remote collaborators (max 3 visible) */}
            {collaborators.slice(0, 3).map((collab, i) => (
              <div
                key={collab.socketId}
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-brand-dark -ml-2 cursor-default"
                style={{ background: collab.color, zIndex: 9 - i }}
                title={`${collab.displayName} (${collab.permission})`}
              >
                {(collab.displayName || "?").charAt(0).toUpperCase()}
              </div>
            ))}
            {collaborators.length > 3 && (
              <div
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white/70 ring-2 ring-brand-dark -ml-2 bg-brand-medium cursor-default"
                title={`${collaborators.length - 3} more collaborators`}
              >
                +{collaborators.length - 3}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #6c8fff, #a78bfa)",
              color: "white",
              boxShadow: "0 2px 8px rgba(108,143,255,0.35)",
            }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* Device Preview Toggle Button */}
          <button
            onClick={onDualViewToggle}
            className={`p-2 rounded-lg transition-colors border border-white/10 flex items-center gap-2 ${showDualView
              ? "bg-blue-500/30 text-blue-400 border-blue-400/30"
              : "bg-brand-medium-dark hover:bg-brand-medium text-brand-lighter"
              }`}
            title={showDualView ? "Hide Device Preview" : "Show Device Preview"}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-xs font-medium">Device</span>
          </button>

          {/* Device Preset Buttons */}
          <div className="flex items-center gap-1 bg-brand-medium-dark/50 rounded-lg p-1 border border-white/10">
            {DEVICE_PRESETS.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(preset)}
                className={`p-2 rounded transition-colors ${selectedPreset?.name === preset.name
                  ? "bg-brand-medium text-brand-light"
                  : "hover:bg-brand-medium-dark text-brand-lighter"
                  }`}
                title={preset.name}
              >
                {preset.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {projectId && (
        <ShareModal
          projectId={projectId}
          projectTitle={projectTitle}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          myPermission={projectPermission}
        />
      )}
    </div>
  );
};
