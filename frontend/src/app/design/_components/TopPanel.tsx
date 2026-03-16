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
import { getStoredUser, getProjectStorage } from "@/lib/api";
import { DesignTooltip } from "./DesignTooltip";
import { HardDrive } from "lucide-react";

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
  const [selectedUser, setSelectedUser] = useState<{
    displayName: string;
    email: string;
    role: string;
    color: string;
    isSelf?: boolean;
  } | null>(null);

  const sizeDropdownRef = useRef<HTMLDivElement>(null);
  const userModalRef = useRef<HTMLDivElement>(null);
  const collabListRef = useRef<HTMLDivElement>(null);
  const [showCollabList, setShowCollabList] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ bytes: number; readable: string } | null>(null);
  const STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB

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

  // Fetch storage usage (requires auth; skip logging when not authorized)
  const fetchStorageUsage = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await getProjectStorage(projectId);
      if (data.success) {
        setStorageUsage({ bytes: data.storageBytes, readable: data.storageReadable });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("Not authorized") || msg.includes("no token")) {
        return;
      }
      console.error("Failed to fetch storage usage:", error);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStorageUsage();
    // Refresh storage usage every 30 seconds
    const interval = setInterval(fetchStorageUsage, 30000);
    return () => clearInterval(interval);
  }, [fetchStorageUsage]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sizeDropdownRef.current &&
        !sizeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSizeDropdown(false);
      }
      if (
        userModalRef.current &&
        !userModalRef.current.contains(event.target as Node)
      ) {
        setSelectedUser(null);
      }
      if (
        collabListRef.current &&
        !collabListRef.current.contains(event.target as Node)
      ) {
        setShowCollabList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleRotateCanvas = () => {
    if (projectPermission === "viewer") return;
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
    if (projectPermission === "viewer") return;
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

          {/* Project Storage Usage */}
          {storageUsage && (
            <div className="flex flex-col gap-1 min-w-[140px] ml-2 group/storage cursor-help">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <HardDrive className="w-3 h-3 text-white/40 group-hover/storage:text-emerald-400 transition-colors shrink-0" />
                  <span className="text-[10px] font-bold text-white/50 group-hover/storage:text-white/80 transition-colors truncate uppercase tracking-wider">Project Storage</span>
                </div>
                <span className="text-[9px] font-black text-white/30 group-hover/storage:text-white/60 transition-colors tabular-nums shrink-0">{storageUsage.readable} / 1 GB</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                <div
                  className="h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  style={{
                    width: `${Math.min(100, (storageUsage.bytes / STORAGE_LIMIT) * 100)}%`,
                    background: (storageUsage.bytes / STORAGE_LIMIT) > 0.9 
                      ? "linear-gradient(90deg, #ef4444, #f87171)" 
                      : (storageUsage.bytes / STORAGE_LIMIT) > 0.7 
                        ? "linear-gradient(90deg, #f59e0b, #fbbf24)" 
                        : "linear-gradient(90deg, #10b981, #34d399)"
                  }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Right Section - Collaboration + Mobile view toggle + Display size presets */}
        <div className="flex items-center gap-2">
          {/* Collaborator Avatar Stack */}
          <div className="flex items-center relative">
            {/* User Detail Popover */}
            {selectedUser && (
              <div
                ref={userModalRef}
                className="absolute top-full left-0 mt-3 w-64 bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div
                  className="h-1.5 w-full"
                  style={{ background: selectedUser.color }}
                />
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
                      style={{ background: selectedUser.color }}
                    >
                      {selectedUser.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {selectedUser.displayName}
                        {selectedUser.isSelf && <span className="ml-1.5 text-[10px] text-blue-400 font-black uppercase tracking-widest">(You)</span>}
                      </p>
                      <p className="text-[11px] text-white/40 truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Role</span>
                    <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{selectedUser.role}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Self avatar */}
            <button
              onClick={() => setSelectedUser({
                displayName: selfUser?.name || selfUser?.username || "You",
                email: selfUser?.email || "",
                role: projectPermission,
                color: myColor,
                isSelf: true
              })}
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-brand-dark cursor-pointer z-10 hover:scale-105 active:scale-95 transition-all"
              style={{ background: myColor }}
            >
              {selfInitial}
              {/* Online indicator */}
              {/* Online indicator removed as per user request */}
            </button>

            {/* Remote collaborators (max 3 visible) */}
            {collaborators.slice(0, 3).map((collab, i) => (
              <button
                key={collab.socketId}
                onClick={() => setSelectedUser({
                  displayName: collab.displayName,
                  email: collab.email || "No email provided",
                  role: collab.role,
                  color: collab.color
                })}
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-brand-dark -ml-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                style={{ background: collab.color, zIndex: 9 - i }}
              >
                {(collab.displayName || "?").charAt(0).toUpperCase()}
              </button>
            ))}
            {collaborators.length > 3 && (
              <div
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white/70 ring-2 ring-brand-dark -ml-2 bg-brand-medium cursor-default"
                title={`${collaborators.length - 3} more collaborators`}
              >
                +{collaborators.length - 3}
              </div>
            )}

            {/* Dropdown button for all collaborators */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCollabList(!showCollabList);
                setSelectedUser(null);
              }}
              className="ml-2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronDown className={`w-4 h-4 text-white/70 transition-transform duration-200 ${showCollabList ? "rotate-180" : ""}`} />
            </button>

            {showCollabList && (
              <div
                ref={collabListRef}
                className="absolute top-full left-0 mt-3 w-72 bg-[#1a1a2e]/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <span className="text-[11px] uppercase tracking-widest font-black text-white/50">Collaborators</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{collaborators.length + 1} Active</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
                  {/* Self */}
                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedUser({
                        displayName: selfUser?.name || selfUser?.username || "You",
                        email: selfUser?.email || "",
                        role: projectPermission,
                        color: myColor,
                        isSelf: true
                      });
                      setShowCollabList(false);
                    }}
                  >
                    <div className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: myColor }}>
                      {selfInitial}
                      {/* Online indicator removed */}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {selfUser?.name || selfUser?.username || "You"}
                        <span className="ml-1.5 text-[10px] text-blue-400 font-black uppercase tracking-widest">(You)</span>
                      </p>
                      <p className="text-[11px] text-white/40 truncate">{selfUser?.email}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{projectPermission}</span>
                  </div>

                  {/* Others */}
                  {collaborators.map(collab => (
                    <div key={collab.socketId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedUser({
                          displayName: collab.displayName,
                          email: collab.email || "No email provided",
                          role: collab.role,
                          color: collab.color
                        });
                        setShowCollabList(false);
                      }}
                    >
                      <div className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: collab.color }}>
                        {(collab.displayName || "?").charAt(0).toUpperCase()}
                        {/* Online indicator removed */}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{collab.displayName}</p>
                        <p className="text-[11px] text-white/40 truncate">{collab.email}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{collab.role}</span>
                    </div>
                  ))}
                </div>
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
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors border ${showSizeDropdown
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                    : "bg-brand-medium-dark hover:bg-brand-medium border-white/10 text-brand-lighter"
                  }`}
              >
                <MonitorSmartphone className="w-4 h-4" />
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSizeDropdown ? "rotate-180" : "opacity-50"}`} />
              </button>
            </DesignTooltip>

            <div
              className={`absolute top-full right-0 mt-2 w-48 bg-brand-dark/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-[100] transition-all duration-200 ${showSizeDropdown
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
