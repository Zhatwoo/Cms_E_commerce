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
  Play,
  MonitorSmartphone,
} from "lucide-react";
import { MIN_SCALE, MAX_SCALE, ZOOM_STEP, ZOOM_PRESETS } from "./zoomConstants";
import { selectedToIds } from "../_lib/canvasActions";
import { useCollaboration } from "../_context/CollaborationContext";
import { useDesignProject } from "../_context/DesignProjectContext";
import { ShareModal } from "./ShareModal";
import { getStoredUser } from "@/lib/api";
import { DesignTooltip } from "./DesignTooltip";

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
  activePageId?: string | null;
  onDevicePresetSelect?: (preset: DevicePreset) => void;
  showDualView?: boolean;
  onDualViewToggle?: () => void;
  projectId?: string;
  projectTitle?: string;
  onPreview?: () => void;
  canvasWidth?: number;
  canvasHeight?: number;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  onZoomFit?: () => void;
}

export const TopPanel: React.FC<TopPanelProps> = ({
  activePageId,
  onDevicePresetSelect,
  showDualView = false,
  onDualViewToggle,
  projectId,
  projectTitle,
  onPreview,
  canvasWidth = 1440,
  canvasHeight = 900,
  scale = 1,
  onScaleChange,
  onZoomFit,
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

  // Sync selected preset with current canvas dimensions
  useEffect(() => {
    const matchingPreset = DEVICE_PRESETS.find(
      (p) => p.width === canvasWidth && p.height === canvasHeight
    );
    if (matchingPreset) {
      setSelectedPreset(matchingPreset);
    }
  }, [canvasWidth, canvasHeight]);

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

  const zoomPercentage = 100;
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
          <DesignTooltip content="Back to Dashboard" position="bottom">
            <Link
              href="/m_dashboard"
              className="px-3 py-2 rounded-lg bg-brand-medium-dark hover:bg-brand-medium transition-colors border border-white/10 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-brand-light" />
              <span className="text-xs font-medium text-brand-light">Back</span>
            </Link>
          </DesignTooltip>

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
          <DesignTooltip content={showDualView ? "Hide Device Preview" : "Show Device Preview"} position="bottom">
            <button
              onClick={onDualViewToggle}
              className={`p-2 rounded-lg transition-colors border border-white/10 flex items-center gap-2 ${showDualView
                ? "bg-blue-500/30 text-blue-400 border-blue-400/30"
                : "bg-brand-medium-dark hover:bg-brand-medium text-brand-lighter"
                }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-xs font-medium">Device</span>
            </button>
          </DesignTooltip>

          {/* Device Preset Dropdown (Breakpoint) */}
          <div className="relative" ref={sizeDropdownRef}>
            <DesignTooltip content="Breakpoints" position="bottom">
              <button
                onClick={() => setShowSizeDropdown((prev) => !prev)}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors border ${
                  showSizeDropdown 
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400" 
                    : "bg-brand-medium-dark hover:bg-brand-medium border-white/10 text-brand-lighter"
                }`}
              >
                <MonitorSmartphone className="w-4 h-4" />
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSizeDropdown ? "rotate-180" : "opacity-50"}`} />
              </button>
            </DesignTooltip>

            <div 
              className={`absolute top-full right-0 mt-2 w-48 bg-brand-dark/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-[100] transition-all duration-200 ${
                showSizeDropdown 
                  ? "opacity-100 translate-y-0 pointer-events-auto" 
                  : "opacity-0 translate-y-2 pointer-events-none"
              }`}
            >
              <div className="px-3 py-2 border-b border-white/5 bg-white/5">
                <span className="text-[10px] uppercase tracking-widest font-black text-white/40">Breakpoints</span>
              </div>
              {DEVICE_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handlePresetSelect(preset);
                    setShowSizeDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors hover:bg-white/5 ${selectedPreset?.name === preset.name
                    ? "text-blue-400 font-bold bg-blue-500/10"
                    : "text-white/70"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="opacity-60">{preset.icon}</span>
                    <span>{preset.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-40 tabular-nums text-[10px]">
                    <span>{preset.width}</span>
                    <span className="text-[8px]">×</span>
                    <span>{preset.height}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* Preview Button */}
          <DesignTooltip content="Preview" position="bottom">
            <button
              onClick={onPreview}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:bg-white/10 active:scale-95 text-brand-light group/preview"
            >
              <Play className="w-3.5 h-3.5 fill-current transition-transform group-hover/preview:scale-110" />
            </button>
          </DesignTooltip>
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
