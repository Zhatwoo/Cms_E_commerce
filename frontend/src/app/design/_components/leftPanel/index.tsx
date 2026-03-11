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
  Image as ImageIcon,
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
import { uploadClientFileWithProgress } from "@/lib/firebaseStorage";

import { deleteDraft } from "../../_lib/pageApi";

const STORAGE_KEY_PREFIX = "craftjs_preview_json";
const MEDIA_LIBRARY_KEY_PREFIX = "craftjs_media_library";
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

type MediaLibraryItem = {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: number;
};

export const LeftPanel = ({ onToggle, activePanel: controlledPanel, setActivePanel: setControlledPanel, frameReady = true, width = 320 }: LeftPanelProps) => {
  const [internalPanel, setInternalPanel] = useState<LeftPanelTabId>("files");
  const activePanel = controlledPanel ?? internalPanel;
  const setActivePanel = setControlledPanel ?? setInternalPanel;
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Delay mounting FilesPanel to avoid "setState during render" warnings
  // caused by Craft.js internal synchronous updates while Frame is rendering.
  const [filesPanelReady, setFilesPanelReady] = useState(false);
  const canMountFilesPanel = frameReady && filesPanelReady;
  const menuRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId") || null;
  const STORAGE_KEY = projectId ? `${STORAGE_KEY_PREFIX}_${projectId}` : STORAGE_KEY_PREFIX;
  const { clientName, websiteName, permission } = useDesignProject();

  const { query, actions } = useEditor();

  const mediaStorageKey = projectId
    ? `${MEDIA_LIBRARY_KEY_PREFIX}_${projectId}`
    : MEDIA_LIBRARY_KEY_PREFIX;

  const persistMediaItems = (items: MediaLibraryItem[]) => {
    if (typeof window === "undefined") return;
    try {
      const serialized = JSON.stringify(items);
      window.localStorage.setItem(mediaStorageKey, serialized);
      window.sessionStorage.setItem(mediaStorageKey, serialized);
    } catch {
      // Ignore quota/storage errors for media library cache.
    }
  };

  const generateNodeId = (existing: Set<string>) => {
    let id = "";
    do {
      id = `node-${Math.random().toString(36).slice(2, 10)}`;
    } while (existing.has(id));
    return id;
  };

  const addMediaToCanvas = (item: MediaLibraryItem) => {
    if (permission === "viewer") return;
    try {
      const raw = query.serialize();
      const parsed = JSON.parse(raw) as Record<string, any>;
      const root = parsed.ROOT as { nodes?: string[] } | undefined;
      const pageId = root?.nodes?.find((id) => parsed[id]?.displayName === "Page") ?? root?.nodes?.[0];
      if (!pageId || !parsed[pageId]) return;

      const existingIds = new Set(Object.keys(parsed));
      const imageNodeId = generateNodeId(existingIds);
      const pageNode = parsed[pageId];
      const pageChildren = Array.isArray(pageNode.nodes) ? pageNode.nodes : [];

      parsed[imageNodeId] = {
        type: { resolvedName: "Image" },
        isCanvas: false,
        props: {
          src: item.url,
          alt: item.name,
          width: "320px",
          height: "220px",
          objectFit: "cover",
          marginTop: 16,
          marginLeft: 16,
        },
        displayName: "Image",
        custom: {},
        parent: pageId,
        hidden: false,
        nodes: [],
        linkedNodes: {},
      };

      pageNode.nodes = [...pageChildren, imageNodeId];
      actions.deserialize(JSON.stringify(parsed));
    } catch {
      // Ignore add-to-canvas failures to avoid breaking panel UX.
    }
  };

  const removeMediaItem = (id: string) => {
    setMediaItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      persistMediaItems(next);
      return next;
    });
  };

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (permission === "viewer") return;

    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      setUploadError("Please select image files only.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    const uploadedItems: MediaLibraryItem[] = [];
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const url = await uploadClientFileWithProgress(file, {
          clientName: clientName ?? undefined,
          websiteName: websiteName ?? undefined,
          projectId: projectId ?? undefined,
          folder: "images",
          onProgress: (percent) => {
            const overall = Math.round(((index + percent / 100) / files.length) * 100);
            setUploadProgress(overall);
          },
        });

        uploadedItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          url,
          mimeType: file.type,
          size: file.size,
          createdAt: Date.now(),
        });
      }

      setMediaItems((prev) => {
        const next = [...uploadedItems, ...prev].slice(0, 200);
        persistMediaItems(next);
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadError(message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => setFilesPanelReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const fromSession = window.sessionStorage.getItem(mediaStorageKey);
      const fromLocal = window.localStorage.getItem(mediaStorageKey);
      const raw = fromSession || fromLocal;
      if (!raw) {
        setMediaItems([]);
        return;
      }
      const parsed = JSON.parse(raw) as MediaLibraryItem[];
      if (Array.isArray(parsed)) {
        setMediaItems(parsed);
      } else {
        setMediaItems([]);
      }
    } catch {
      setMediaItems([]);
    }
  }, [mediaStorageKey]);

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
          {permission !== "viewer" && (
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
          )}
          <button
            type="button"
            onClick={() => setActivePanel("media")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-all duration-200 cursor-pointer ${activePanel === "media"
              ? "text-brand-lighter bg-brand-medium/50 shadow-sm"
              : "text-brand-light hover:text-brand-lighter"}`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>Media</span>
          </button>
        </div>
      </div>

      {/* Panel content: scrollable; Files/Assets/Templates show scrollbar for full layer access */}
      <div className={`editor-panel-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${activePanel === "components" ? "no-scrollbar" : "px-4 pb-4 mt-4"} overscroll-contain`}>
        {activePanel === "files" && (canMountFilesPanel ? <FilesPanel /> : null)}
        {activePanel === "components" && <ComponentsPanel />}
        {activePanel === "media" && (
          <div className="h-full flex flex-col gap-3 p-2">
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUploadFiles(e.target.files)}
            />

            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              disabled={uploading || permission === "viewer"}
              className="w-full px-4 py-2 bg-brand-medium/30 hover:bg-brand-medium/50 disabled:opacity-50 disabled:cursor-not-allowed text-brand-lighter text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border border-white/5"
            >
              {uploading ? `Uploading ${uploadProgress}%` : "Upload Files"}
            </button>

            {uploadError && (
              <p className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                {uploadError}
              </p>
            )}

            {mediaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-medium/20 flex items-center justify-center text-brand-light">
                  <ImageIcon className="w-8 h-8 opacity-50" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-brand-lighter tracking-tight">Media Library</span>
                  <p className="text-[10px] text-brand-light leading-relaxed max-w-[180px] mx-auto opacity-60">
                    Upload images here, then click Add to Canvas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-4">
                {mediaItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-brand-white/5 p-2 flex flex-col gap-2">
                    <div className="aspect-square rounded-md overflow-hidden bg-brand-dark/60 border border-white/5">
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-brand-lighter truncate" title={item.name}>{item.name}</p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => addMediaToCanvas(item)}
                        disabled={permission === "viewer"}
                        className="flex-1 text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-brand-medium/35 hover:bg-brand-medium/55 disabled:opacity-50 disabled:cursor-not-allowed text-brand-lighter"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMediaItem(item.id)}
                        className="text-[9px] px-2 py-1 rounded-md border border-white/10 hover:bg-white/5 text-brand-light"
                        title="Remove from library"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {permission === "viewer" && (
              <p className="text-[10px] text-brand-light/80 text-center">Viewer mode: upload and canvas insert are disabled.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
