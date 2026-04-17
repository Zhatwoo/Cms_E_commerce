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
  Sun,
  Moon,
} from "lucide-react";
import { MIN_SCALE, MAX_SCALE, ZOOM_STEP, ZOOM_PRESETS } from "./zoomConstants";
import { selectedToIds } from "../_lib/canvasActions";
import { useCollaboration } from "../_context/CollaborationContext";
import { useDesignProject } from "../_context/DesignProjectContext";
import { ShareModal } from "./ShareModal";
import { getStoredUser, getProjectStorage } from "@/lib/api";
import { DesignTooltip } from "./DesignTooltip";
import { HardDrive } from "lucide-react";

interface TopPanelProps {
  activePageId?: string | null;
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
  isDarkMode?: boolean;
  onThemeToggle?: (e?: React.MouseEvent) => void;
}

type PageSizePreset = {
  label: string;
  width: number;
  height: number;
  icon: React.ReactNode;
};

const PAGE_SIZE_PRESETS: PageSizePreset[] = [
  { label: "Large Desktop", width: 1920, height: 900, icon: <Maximize2 className="w-4 h-4" /> },
  { label: "Desktop", width: 1440, height: 900, icon: <Monitor className="w-4 h-4" /> },
  { label: "Laptop", width: 1366, height: 768, icon: <Laptop className="w-4 h-4" /> },
  { label: "Tablet", width: 834, height: 1112, icon: <Tablet className="w-4 h-4" /> },
  { label: "Mobile", width: 390, height: 844, icon: <Smartphone className="w-4 h-4" /> },
];

export const TopPanel: React.FC<TopPanelProps> = ({
  activePageId,
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
  isDarkMode = true,
  onThemeToggle,
}) => {
  const { actions, query } = useEditor();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    displayName: string;
    email: string;
    role: string;
    color: string;
    isSelf?: boolean;
  } | null>(null);

  const userModalRef = useRef<HTMLDivElement>(null);
  const collabListRef = useRef<HTMLDivElement>(null);
  const pageSizeMenuRef = useRef<HTMLDivElement>(null);
  const [showCollabList, setShowCollabList] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ bytes: number; readable: string } | null>(null);
  const [storageFetchDisabled, setStorageFetchDisabled] = useState(false);
  const STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB

  // Get collaboration state
  const { collaborators, myColor, connected } = useCollaboration();
  const { permission: projectPermission } = useDesignProject();
  let selfUser: { name?: string; username?: string; email?: string } | null = null;
  try { selfUser = getStoredUser(); } catch { }
  const selfInitial = (selfUser?.name || selfUser?.username || selfUser?.email || "?").charAt(0).toUpperCase();
  const resolveTargetPageId = useCallback((): string | null => {
    try {
      const state = query.getState();
      const nodes = (state?.nodes ?? {}) as Record<string, { data?: { displayName?: string; parent?: string } }>;

      const findPageAncestor = (nodeId: string | null | undefined): string | null => {
        if (!nodeId) return null;
        let cursor: string | null = nodeId;
        const seen = new Set<string>();

        while (cursor && !seen.has(cursor)) {
          seen.add(cursor);
          const node = nodes[cursor];
          if (!node) return null;
          if (node?.data?.displayName === "Page") return cursor;
          cursor = typeof node?.data?.parent === "string" ? node.data.parent : null;
        }

        return null;
      };

      const selectedIds = selectedToIds(state?.events?.selected);
      for (const id of selectedIds) {
        const pageId = findPageAncestor(id);
        if (pageId) return pageId;
      }

      const activePage = findPageAncestor(activePageId ?? null);
      if (activePage) return activePage;

      const firstPageEntry = Object.entries(nodes).find(([, node]) => node?.data?.displayName === "Page");
      return firstPageEntry ? firstPageEntry[0] : null;
    } catch {
      return null;
    }
  }, [activePageId, query]);

  const activePageSize = useEditor((state) => {
    const parseSize = (value: unknown) => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string") {
        const parsed = Number.parseFloat(value.replace(/px$/i, ""));
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const nodes = state.nodes ?? {};

    const findPageAncestorFromState = (nodeId: string | null | undefined): string | null => {
      if (!nodeId) return null;
      let cursor: string | null = nodeId;
      const seen = new Set<string>();

      while (cursor && !seen.has(cursor)) {
        seen.add(cursor);
        const node = nodes[cursor] as { data?: { displayName?: string; parent?: string } } | undefined;
        if (!node) return null;
        if (node?.data?.displayName === "Page") return cursor;
        cursor = typeof node?.data?.parent === "string" ? node.data.parent : null;
      }

      return null;
    };

    let targetPageId: string | null = null;

    const selectedIds = selectedToIds(state?.events?.selected);
    for (const id of selectedIds) {
      const pageId = findPageAncestorFromState(id);
      if (pageId) {
        targetPageId = pageId;
        break;
      }
    }

    if (!targetPageId) {
      targetPageId = findPageAncestorFromState(activePageId ?? null);
    }

    if (!targetPageId) {
      const firstPageEntry = Object.entries(nodes).find(([, node]: any) => node?.data?.displayName === "Page");
      targetPageId = firstPageEntry ? firstPageEntry[0] : null;
    }

    if (!targetPageId) {
      return { width: null as number | null, height: null as number | null };
    }

    const node = nodes[targetPageId] as { data?: { props?: Record<string, unknown> } } | undefined;
    return {
      width: parseSize(node?.data?.props?.width),
      height: parseSize(node?.data?.props?.height),
    };
  });

  // Fetch storage usage (requires auth; skip logging when not authorized)
  const fetchStorageUsage = useCallback(async () => {
    if (!projectId || storageFetchDisabled) return;
    try {
      const data = await getProjectStorage(projectId);
      if (data.success) {
        setStorageUsage({ bytes: data.storageBytes, readable: data.storageReadable });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const normalized = msg.toLowerCase();
      if (
        normalized.includes("not authorized") ||
        normalized.includes("no token") ||
        normalized.includes("backend is unreachable")
      ) {
        return;
      }
      if (normalized.includes("project not found") || normalized.includes("not found")) {
        setStorageUsage(null);
        setStorageFetchDisabled(true);
        return;
      }
      if (normalized.includes("internal server error") || normalized.includes("server error")) {
        setStorageUsage(null);
        setStorageFetchDisabled(true);
        return;
      }
      console.error("Failed to fetch storage usage:", error);
    }
  }, [projectId, storageFetchDisabled]);

  useEffect(() => {
    setStorageFetchDisabled(false);
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
      if (
        pageSizeMenuRef.current &&
        !pageSizeMenuRef.current.contains(event.target as Node)
      ) {
        setShowPageSizeMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyPageSizePreset = (preset: PageSizePreset) => {
    const targetPageId = resolveTargetPageId();
    if (!targetPageId) {
      console.warn("Page size preset skipped: no target page found");
      setShowPageSizeMenu(false);
      return;
    }

    try {
      actions.setProp(targetPageId, (props: Record<string, unknown>) => {
        props.width = `${preset.width}px`;
        props.height = `${preset.height}px`;
      });
    } catch (error) {
      console.error("Failed to apply page size preset:", error);
    }
    setShowPageSizeMenu(false);
  };


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

  const zoomPercentage = 100;
  const toolbarTextSmoothingStyle: React.CSSProperties = {
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    textRendering: "optimizeLegibility",
  };

  return (
    <div
      data-panel="top-controls"
      className="absolute top-0 left-0 right-0 z-[9999] bg-builder-surface/95 backdrop-blur-lg border-b border-builder-border pointer-events-auto antialiased"
      style={toolbarTextSmoothingStyle}
    >
      <div className="flex items-center justify-between px-4 py-2 h-12">
        {/* Left Section - Canvas Controls */}
        <div className="flex items-center gap-3">
          <DesignTooltip content="Back to Dashboard" position="bottom">
            <Link
              href="/m_dashboard"
              className="px-3 py-2 rounded-lg bg-builder-surface-2 hover:bg-builder-surface-3 transition-colors border border-builder-border inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-builder-text-muted" />
              <span className="text-xs font-medium text-builder-text-muted">Back</span>
            </Link>
          </DesignTooltip>

          {/* Project Storage Usage */}
          {storageUsage && (
            <div className="flex flex-col gap-1 min-w-[140px] ml-2 group/storage cursor-help">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <HardDrive className="w-3 h-3 text-[var(--builder-text-faint)] group-hover/storage:text-emerald-400 transition-colors shrink-0" />
                  <span className="text-[10px] font-bold text-[var(--builder-text-faint)] group-hover/storage:text-[var(--builder-text-muted)] transition-colors truncate uppercase tracking-wider">Project Storage</span>
                </div>
                <span className="text-[9px] font-black text-[var(--builder-text-faint)] group-hover/storage:text-[var(--builder-text-muted)] transition-colors tabular-nums shrink-0">{storageUsage.readable} / 1 GB</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--builder-surface-3)] rounded-full overflow-hidden border border-[var(--builder-border)] relative">
                <div
                  className="h-full transition-all duration-1000 ease-out rounded-full"
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
                className="absolute top-full left-0 mt-3 w-64 bg-[var(--builder-surface-2)] backdrop-blur-xl border border-[var(--builder-border)] rounded-2xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
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
                      <p className="text-sm font-bold text-[var(--builder-text)] truncate">
                        {selectedUser.displayName}
                        {selectedUser.isSelf && <span className="ml-1.5 text-[10px] text-blue-400 font-black uppercase tracking-widest">(You)</span>}
                      </p>
                      <p className="text-[11px] text-[var(--builder-text-muted)] truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--builder-surface-3)] border border-[var(--builder-border)]">
                    <span className="text-[10px] text-[var(--builder-text-faint)] font-bold uppercase tracking-widest">Role</span>
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
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--builder-surface)] cursor-pointer z-10 hover:scale-105 active:scale-95 transition-all"
              style={{ background: myColor }}
            >
              {selfInitial}
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
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--builder-surface)] -ml-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                style={{ background: collab.color, zIndex: 9 - i }}
              >
                {(collab.displayName || "?").charAt(0).toUpperCase()}
              </button>
            ))}
            {collaborators.length > 3 && (
              <div
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--builder-text-muted)] ring-2 ring-[var(--builder-surface)] -ml-2 bg-[var(--builder-surface-3)] cursor-default"
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
              className="ml-2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--builder-surface-2)] transition-colors"
            >
              <ChevronDown className={`w-4 h-4 text-[var(--builder-text-muted)] transition-transform duration-200 ${showCollabList ? "rotate-180" : ""}`} />
            </button>

            {showCollabList && (
              <div
                ref={collabListRef}
                className="absolute top-full left-0 mt-3 w-72 bg-[var(--builder-surface-2)] backdrop-blur-xl border border-[var(--builder-border)] rounded-2xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="px-4 py-3 border-b border-[var(--builder-border)] flex items-center justify-between bg-[var(--builder-surface-3)]">
                  <span className="text-[11px] uppercase tracking-widest font-black text-[var(--builder-text-faint)]">Collaborators</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{collaborators.length + 1} Active</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
                  {/* Self */}
                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--builder-surface-3)] transition-colors cursor-pointer"
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--builder-text)] truncate">
                        {selfUser?.name || selfUser?.username || "You"}
                        <span className="ml-1.5 text-[10px] text-blue-400 font-black uppercase tracking-widest">(You)</span>
                      </p>
                      <p className="text-[11px] text-[var(--builder-text-faint)] truncate">{selfUser?.email}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--builder-text-faint)]">{projectPermission}</span>
                  </div>

                  {/* Others */}
                  {collaborators.map(collab => (
                    <div key={collab.socketId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--builder-surface-3)] transition-colors cursor-pointer"
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
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--builder-text)] truncate">{collab.displayName}</p>
                        <p className="text-[11px] text-[var(--builder-text-faint)] truncate">{collab.email}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--builder-text-faint)]">{collab.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-[var(--builder-border-mid)]" />

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
          <div className="w-px h-6 bg-[var(--builder-border-mid)]" />

          {/* Theme Toggle */}
          <DesignTooltip content={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} position="bottom">
            <button
              onClick={(e) => onThemeToggle?.(e)}
              className="p-2 rounded-lg transition-all border border-[var(--builder-border)] bg-[var(--builder-surface-2)] hover:bg-[var(--builder-surface-3)] text-[var(--builder-text-muted)] hover:text-[var(--builder-accent)] active:scale-95"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </DesignTooltip>

          {/* Divider */}
          <div className="w-px h-6 bg-[var(--builder-border-mid)]" />

          {/* Device Preview Toggle Button */}
          <DesignTooltip content={showDualView ? "Hide Device Preview" : "Show Device Preview"} position="bottom">
            <button
              onClick={onDualViewToggle}
              className={`p-2 rounded-lg transition-colors border border-builder-border flex items-center gap-2 ${showDualView
                ? "bg-blue-500/30 text-blue-400 border-blue-400/30"
                : "bg-builder-surface-2 hover:bg-builder-surface-3 text-builder-text"
                }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-xs font-medium">Device</span>
            </button>
          </DesignTooltip>

          {/* Page Size Presets */}
          <div className="relative" ref={pageSizeMenuRef}>
            <DesignTooltip content="Page size presets" position="bottom">
              <button
                type="button"
                onClick={() => setShowPageSizeMenu((v) => !v)}
                className="p-2 rounded-lg transition-colors border border-[var(--builder-border)] bg-[var(--builder-surface-2)] hover:bg-[var(--builder-surface-3)] text-[var(--builder-text-muted)] hover:text-[var(--builder-accent)] active:scale-95 flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {activePageSize.width && activePageSize.height
                    ? `${activePageSize.width}×${activePageSize.height}`
                    : "Page Size"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPageSizeMenu ? "rotate-180" : ""}`} />
              </button>
            </DesignTooltip>

            {showPageSizeMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--builder-border)] bg-[var(--builder-surface-2)] shadow-2xl overflow-hidden z-[1001]">
                {PAGE_SIZE_PRESETS.map((preset) => {
                  const isActive = activePageSize.width === preset.width && activePageSize.height === preset.height;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPageSizePreset(preset)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[var(--builder-surface-3)] ${isActive
                        ? "text-[var(--builder-accent)] bg-[var(--builder-accent)]/10"
                        : "text-[var(--builder-text-muted)]"
                        }`}
                    >
                      <span className="shrink-0">{preset.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[var(--builder-text)]">{preset.label}</div>
                        <div className="text-[10px] text-[var(--builder-text-faint)]">{preset.width} × {preset.height}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-[var(--builder-border-mid)]" />

          {/* Preview Button */}
          <DesignTooltip content="Preview" position="bottom">
            <button
              onClick={onPreview}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:bg-[var(--builder-surface-2)] active:scale-95 text-[var(--builder-text-muted)] group/preview"
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
