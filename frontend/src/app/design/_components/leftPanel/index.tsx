import React, { useState, useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Save,
  Settings,
  FileDown,
  Trash2,
  FileStack,
  Layout,
  Image,
  LayoutTemplate,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Component,
  X,
} from "lucide-react";
import { useDesignProject } from "../../_context/DesignProjectContext";
import { FilesPanel } from "./filesPanel";
import { ComponentsPanel } from "./componentsPanel";
import { AssetsPanel } from "./assetsPanel";
import { TemplatePanel } from "./templatePanel";

import { deleteDraft } from "../../_lib/pageApi";

const STORAGE_KEY_PREFIX = "craftjs_preview_json";
const VIEWPORT_EDGE_PADDING = 100000;
const PAGE_GRID_ORIGIN_X = VIEWPORT_EDGE_PADDING;
const PAGE_GRID_ORIGIN_Y = VIEWPORT_EDGE_PADDING;

const EMPTY_CANVAS_DATA = JSON.stringify({
  ROOT: {
    type: { resolvedName: "Viewport" },
    isCanvas: true,
    props: {},
    displayName: "Viewport",
    custom: {},
    hidden: false,
    nodes: ["page-1"],
    linkedNodes: {},
  },
  "page-1": {
    type: { resolvedName: "Page" },
    isCanvas: true,
    props: {
      pageName: "Page 1",
      pageSlug: "page-0",
      canvasX: PAGE_GRID_ORIGIN_X,
      canvasY: PAGE_GRID_ORIGIN_Y,
      width: "1920px",
      height: "1200px",
      background: "#ffffff",
    },
    displayName: "Page",
    custom: {},
    parent: "ROOT",
    hidden: false,
    nodes: ["container-1"],
    linkedNodes: {},
  },
  "container-1": {
    type: { resolvedName: "Container" },
    isCanvas: true,
    props: { padding: 40, background: "#ffffff" },
    displayName: "Container",
    custom: {},
    parent: "page-1",
    hidden: false,
    nodes: [],
    linkedNodes: {},
  },
});

export type LeftPanelTabId = "files" | "components" | "media";

interface LeftPanelProps {
  onToggle?: () => void;
  activePanel?: LeftPanelTabId;
  setActivePanel?: (tab: LeftPanelTabId) => void;
  /** When false, FilesPanel is not mounted to avoid Craft.js setState-during-render. Set by EditorShell after Frame has committed. */
  frameReady?: boolean;
  width?: number;
}

export const LeftPanel = ({ onToggle, activePanel: controlledPanel, setActivePanel: setControlledPanel, frameReady = true, width = 320 }: LeftPanelProps) => {
  const [internalPanel, setInternalPanel] = useState<LeftPanelTabId>("files");
  const activePanel = controlledPanel ?? internalPanel;
  const setActivePanel = setControlledPanel ?? setInternalPanel;
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  // Delay mounting FilesPanel to avoid "setState during render" warnings
  // caused by Craft.js internal synchronous updates while Frame is rendering.
  const [filesPanelReady, setFilesPanelReady] = useState(false);
  const canMountFilesPanel = frameReady && filesPanelReady;
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId") || null;
  const STORAGE_KEY = projectId ? `${STORAGE_KEY_PREFIX}_${projectId}` : STORAGE_KEY_PREFIX;
  const { websiteName, permission } = useDesignProject();

  const { query, actions } = useEditor();

  useEffect(() => {
    const id = requestAnimationFrame(() => setFilesPanelReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  // ── Actions ───────────────────────────────────────────────
  const handleSave = () => {
    try {
      const json = query.serialize();
      sessionStorage.setItem(STORAGE_KEY, json);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1500);
    } catch {
      // storage error
    }
    setMenuOpen(false);
  };

  const handleExportJson = () => {
    try {
      const json = query.serialize();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // serialize error
    }
    setMenuOpen(false);
  };

  const handleClearCanvas = async () => {
    setMenuOpen(false);
    if (!window.confirm("Clear the entire canvas? This cannot be undone.")) return;
    try {
      // Remove project-specific session cache
      if (projectId) {
        sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}_${projectId}`);
        // Also delete from DB
        await deleteDraft(projectId);
      } else {
        // No projectId — clear all craftjs keys from session
        Object.keys(sessionStorage)
          .filter((k) => k.startsWith(STORAGE_KEY_PREFIX))
          .forEach((k) => sessionStorage.removeItem(k));
      }
    } catch {
      // ignore
    }

    try {
      actions.deserialize(EMPTY_CANVAS_DATA);
      if (projectId) {
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}_${projectId}`, EMPTY_CANVAS_DATA);
      }
    } catch {
      // If deserialize fails for any reason, fallback to reload behavior
      window.location.reload();
    }
  };


  return (
    <div
      data-panel="left"
      className="bg-brand-dark flex flex-col h-full border-r border-white/10 overflow-hidden transition-[width] duration-300 ease-out"
      style={{ width: `${width}px` }}
    >
      <div className="flex flex-col gap-4 shrink-0 px-4 pt-4">
        {/* Header + Title + Tabs: fixed at top, do not scroll */}
        <div className="flex flex-col gap-4 shrink-0">
          {/* Left Panel Header */}
          <div className="flex items-start justify-between mb-2 gap-2">
            {/* Project dropdown trigger */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 -ml-2 transition-colors cursor-pointer"
              >
                <h3 className="text-brand-lighter font-bold text-lg truncate max-w-[200px]" title={websiteName ?? "Project Title"}>
                  {websiteName ?? "Project Title"}
                </h3>
                <ChevronDown
                  className={`w-4 h-4 text-brand-light transition-transform duration-200 shrink-0 ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-brand-darker border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-slideDownItem">
                  {permission !== "viewer" && (
                    <>
                      {/* Save */}
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-brand-lighter hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Save className="w-4 h-4 text-brand-light" />
                        Save project
                        <span className="ml-auto text-[10px] text-brand-light/50">Ctrl+S</span>
                      </button>

                      {/* Export JSON */}
                      <button
                        onClick={handleExportJson}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-brand-lighter hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <FileDown className="w-4 h-4 text-brand-light" />
                        Export JSON
                      </button>

                      {/* Divider */}
                      <div className="border-t border-white/5 my-1" />
                    </>
                  )}

                  {/* Project settings (placeholder) */}
                  <button
                    disabled
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-brand-light/30 cursor-not-allowed"
                  >
                    <Settings className="w-4 h-4" />
                    Project settings
                    <span className="ml-auto text-[10px] bg-brand-medium/30 rounded px-1.5 py-0.5">Soon</span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-white/5 my-1" />

                  {permission !== "viewer" && (
                    <>
                      {/* Clear canvas */}
                      <button
                        onClick={handleClearCanvas}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear canvas
                      </button>

                      {/* Divider */}
                      <div className="border-t border-white/5 my-1" />
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-1">
              {/* Close / Exit button */}
              {onToggle && (
                <button
                  type="button"
                  onClick={onToggle}
                  className="p-1 rounded-lg hover:bg-white/5 text-brand-light transition-colors cursor-pointer"
                  aria-label="Close left panel"
                  title="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Save flash indicator */}
              {saveFlash && (
                <span className="text-[10px] text-emerald-400 font-medium animate-pulse">Saved</span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex text-[10px] font-bold uppercase tracking-widest items-stretch justify-center py-2 px-1 border-y border-brand-medium/30 gap-1 min-h-0 bg-brand-dark/20">
          <button
            type="button"
            onClick={() => setActivePanel("files")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-all duration-200 cursor-pointer ${activePanel === "files"
              ? "text-brand-lighter bg-brand-medium/50 shadow-sm"
              : "text-brand-light hover:text-brand-lighter"}`}
          >
            <FileStack className="w-4 h-4 shrink-0" />
            <span>Files</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePanel("components")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-all duration-200 cursor-pointer ${activePanel === "components"
              ? "text-brand-lighter bg-brand-medium/50 shadow-sm"
              : "text-brand-light hover:text-brand-lighter"}`}
          >
            <Component className="w-4 h-4 shrink-0" />
            <span>Components</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePanel("media")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-all duration-200 cursor-pointer ${activePanel === "media"
              ? "text-brand-lighter bg-brand-medium/50 shadow-sm"
              : "text-brand-light hover:text-brand-lighter"}`}
          >
            <Image className="w-4 h-4 shrink-0" />
            <span>Media</span>
          </button>
        </div>
      </div>

      {/* Panel content: scrollable; Files/Assets/Templates show scrollbar for full layer access */}
      <div className={`editor-panel-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${activePanel === "components" ? "no-scrollbar" : "px-4 pb-4 mt-4"} overscroll-contain`}>
        {activePanel === "files" && (canMountFilesPanel ? <FilesPanel /> : null)}
        {activePanel === "components" && <ComponentsPanel />}
        {activePanel === "media" && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-medium/20 flex items-center justify-center text-brand-light">
              <Image className="w-8 h-8 opacity-50" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-brand-lighter tracking-tight">Media Library</span>
              <p className="text-[10px] text-brand-light leading-relaxed max-w-[160px] mx-auto opacity-60">
                Drag and drop your images here to use them in your projects.
              </p>
            </div>
            <button className="mt-4 px-6 py-2 bg-brand-medium/30 hover:bg-brand-medium/50 text-brand-lighter text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border border-white/5">
              Upload Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
