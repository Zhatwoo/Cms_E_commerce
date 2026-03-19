import React, { useState, useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Save,
  Settings,
  FileDown,
  Trash2,
  FileStack,
  Layout,
  Image as ImageIcon,
  LayoutTemplate,
  Search,
  Plus,
  Component,
  X,
  Video as VideoIcon,
  Check,
  ListFilter,
  ArrowUpDown,
  Monitor,
  Cloud,
  HardDrive,
  Share2,
  Gamepad2,
  Music,
} from "lucide-react";
import { useDesignProject } from "../../_context/DesignProjectContext";
import { FilesPanel } from "./filesPanel";
import { ComponentsPanel } from "./componentsPanel";
import { AssetsPanel } from "./assetsPanel";
import { TemplatePanel } from "./templatePanel";
import { Image } from "../../_designComponents/Image/Image";
import { Video } from "../../_designComponents/Video/Video";
import { uploadMediaApi } from "@/lib/api";

import { deleteDraft } from "../../_lib/pageApi";
import { type MediaLibraryItem, MEDIA_LIBRARY_KEY_PREFIX, MEDIA_LIBRARY_UPDATED_EVENT, removeFilesFromMediaLibrary } from "../../_lib/mediaActions";

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
  const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
  const [activeMediaCategory, setActiveMediaCategory] = useState<"all" | "images" | "videos" | "documents" | "audio">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
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
  const { clientName, websiteName, permission, updateProjectTitle } = useDesignProject();

  const { query, actions, connectors } = useEditor();

  const mediaStorageKey = projectId
    ? `${MEDIA_LIBRARY_KEY_PREFIX}_${projectId}`
    : MEDIA_LIBRARY_KEY_PREFIX;

  const handleTitleDoubleClick = () => {
    if (permission === "viewer") return;
    setTempTitle(websiteName ?? "Project Title");
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (!isEditingTitle) return;
    const trimmed = tempTitle.trim();
    if (trimmed && trimmed !== websiteName) {
      await updateProjectTitle(trimmed);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

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
      const nodeId = generateNodeId(existingIds);
      const pageNode = parsed[pageId];
      const pageChildren = Array.isArray(pageNode.nodes) ? pageNode.nodes : [];

      const isVideo = item.mimeType.startsWith("video/");

      parsed[nodeId] = {
        type: { resolvedName: isVideo ? "Video" : "Image" },
        isCanvas: false,
        props: {
          src: item.url,
          width: "320px",
          height: "220px",
          objectFit: "cover",
          marginTop: 16,
          marginLeft: 16,
          ...(isVideo ? { controls: true, autoPlay: false, loop: false, muted: false } : { alt: item.name }),
        },
        displayName: isVideo ? "Video" : "Image",
        custom: {},
        parent: pageId,
        hidden: false,
        nodes: [],
        linkedNodes: {},
      };

      pageNode.nodes = [...pageChildren, nodeId];
      actions.deserialize(JSON.stringify(parsed));
    } catch {
      // Ignore add-to-canvas failures to avoid breaking panel UX.
    }
  };

  const handleDeleteSelected = async () => {
    if (!projectId || selectedItems.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} item(s)?`)) return;

    try {
      setUploading(true);
      await removeFilesFromMediaLibrary(projectId, Array.from(selectedItems));
      setSelectedItems(new Set());
    } catch (err: any) {
      setUploadError(err.message || "Failed to delete items");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!projectId) return;
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      setUploading(true);
      await removeFilesFromMediaLibrary(projectId, [id]);
      const next = new Set(selectedItems);
      next.delete(id);
      setSelectedItems(next);
    } catch (err: any) {
      setUploadError(err.message || "Failed to delete item");
    } finally {
      setUploading(false);
    }
  };

  const filteredMedia = mediaItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeMediaCategory === "all") return true;
      if (activeMediaCategory === "images") return item.mimeType.startsWith("image/");
      if (activeMediaCategory === "videos") return item.mimeType.startsWith("video/");
      if (activeMediaCategory === "audio") return item.mimeType.startsWith("audio/");
      if (activeMediaCategory === "documents") return !item.mimeType.startsWith("image/") && !item.mimeType.startsWith("video/") && !item.mimeType.startsWith("audio/");
      return true;
    })
    .sort((a, b) => {
      let res = 0;
      if (sortBy === "name") res = a.name.localeCompare(b.name);
      else res = b.createdAt - a.createdAt;
      return sortOrder === "asc" ? -res : res;
    });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredMedia.map(i => i.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const allSelected = filteredMedia.length > 0 && filteredMedia.every(i => selectedItems.has(i.id));


  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (permission === "viewer") return;
    if (!projectId) {
      setUploadError("No project selected.");
      return;
    }

    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    const uploadedItems: MediaLibraryItem[] = [];
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        let folder: "images" | "videos" | "files" = "images";
        if (file.type.startsWith("video/")) folder = "videos";
        else if (file.type.startsWith("audio/")) folder = "files";
        else if (file.type.startsWith("application/pdf") || file.type.startsWith("text/")) folder = "files";

        const { url } = await uploadMediaApi(projectId, file, {
          folder,
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
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setFilesPanelReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadMediaItems = () => {
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
    };

    loadMediaItems();

    // Listen for external updates (like pasting images)
    window.addEventListener(MEDIA_LIBRARY_UPDATED_EVENT, loadMediaItems);
    return () => window.removeEventListener(MEDIA_LIBRARY_UPDATED_EVENT, loadMediaItems);
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
      className="bg-builder-surface flex flex-col h-full border-r border-builder-border overflow-hidden transition-[width] duration-300 ease-out"
      style={{ width: `${width}px` }}
    >
      <div className="flex flex-col gap-3 shrink-0 px-4 pt-3">
        {/* Header + Title + Tabs: fixed at top, do not scroll */}
        <div className="flex flex-col gap-3 shrink-0">
          {/* Left Panel Header */}
          <div className="flex items-start justify-between mb-1 gap-2">
            {/* Project dropdown trigger */}
            <div className="relative" ref={menuRef}>
              {isEditingTitle ? (
                <div className="flex items-center gap-2 bg-[var(--builder-surface-3)] rounded-lg px-2 py-1 -ml-2 ring-1 ring-blue-500/50">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    className="bg-transparent border-none p-0 m-0 text-builder-text font-bold text-lg focus:outline-none w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  onDoubleClick={handleTitleDoubleClick}
                  className="flex items-center gap-2 hover:bg-[var(--builder-surface-2)] rounded-lg px-2 py-1 -ml-2 transition-colors cursor-pointer"
                >
                  <h3 className="text-builder-text font-bold text-lg truncate max-w-[200px]" title={websiteName ?? "Project Title"}>
                    {websiteName ?? "Project Title"}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-builder-text-muted transition-transform duration-200 shrink-0 ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>
              )}

              {/* Dropdown menu */}
              {menuOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-builder-surface-2 border border-builder-border rounded-xl shadow-2xl py-1 z-50 animate-slideDownItem">
                  {permission !== "viewer" && (
                    <>
                      {/* Save */}
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-builder-text hover:bg-[var(--builder-surface-3)] transition-colors cursor-pointer"
                      >
                        <Save className="w-4 h-4 text-builder-text-muted" />
                        Save project
                        <span className="ml-auto text-[10px] text-builder-text-muted/50">Ctrl+S</span>
                      </button>

                      {/* Export JSON */}
                      <button
                        onClick={handleExportJson}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-builder-text hover:bg-[var(--builder-surface-3)] transition-colors cursor-pointer"
                      >
                        <FileDown className="w-4 h-4 text-builder-text-muted" />
                        Export JSON
                      </button>

                      {/* Divider */}
                      <div className="border-t border-transparent my-1" />
                    </>
                  )}

                  {/* Project settings (placeholder) */}
                  <button
                    disabled
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-builder-text-muted/30 cursor-not-allowed"
                  >
                    <Settings className="w-4 h-4" />
                    Project settings
                    <span className="ml-auto text-[10px] bg-brand-medium/30 rounded px-1.5 py-0.5">Soon</span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-transparent my-1" />

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
                      <div className="border-t border-transparent my-1" />
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
                  className="p-1 rounded-lg hover:bg-[var(--builder-surface-2)] text-builder-text-muted transition-colors cursor-pointer"
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
        <div className="flex text-[10px] font-bold uppercase tracking-widest items-stretch justify-center py-1.5 px-2 gap-1 min-h-0 border-b border-[var(--builder-border)]">
          <button
            type="button"
            onClick={() => setActivePanel("files")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-all duration-200 cursor-pointer ${activePanel === "files"
              ? "text-[var(--builder-accent)] bg-[var(--builder-accent)]/10 shadow-[0_0_8px_var(--builder-accent-glow)]"
              : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"}`}
          >
            <FileStack className="w-4 h-4 shrink-0" />
            <span>Files</span>
          </button>
          {permission !== "viewer" && (
            <button
              type="button"
              onClick={() => setActivePanel("components")}
              className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-all duration-200 cursor-pointer ${activePanel === "components"
                ? "text-[var(--builder-accent)] bg-[var(--builder-accent)]/10 shadow-[0_0_8px_var(--builder-accent-glow)]"
                : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"}`}
            >
              <Component className="w-4 h-4 shrink-0" />
              <span>Components</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActivePanel("media")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-all duration-200 cursor-pointer ${activePanel === "media"
              ? "text-[var(--builder-accent)] bg-[var(--builder-accent)]/10 shadow-[0_0_8px_var(--builder-accent-glow)]"
              : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"}`}
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
          <div className="h-full flex flex-col gap-5 px-3 pb-4 bg-builder-surface">
            {/* Search Bar - Integrated with Brand Theme */}
            <div className="relative group shrink-0 mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--builder-text-faint)] group-focus-within:text-[var(--builder-text)] transition-colors" />
              <input
                type="text"
                placeholder="SEARCH MEDIA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-lg py-2.5 pl-9 pr-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--builder-text)] placeholder:text-[var(--builder-text-faint)] focus:outline-none focus:bg-[var(--builder-surface-3)] focus:border-[var(--builder-border-mid)] transition-all"
              />
            </div>

            {/* Import Media Button (Brand Themed) */}
            <div className="relative flex w-full shrink-0">
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.svg,.pdf,.doc,.docx,.txt"
                multiple
                className="hidden"
                onChange={(e) => handleUploadFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 bg-[var(--builder-purple)] hover:bg-[var(--builder-purple-light)] text-white text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <div className="w-3.5 h-3.5 border-2 border-transparent border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Import media</span>
              </button>
            </div>

            {/* Selection & Toolbar (Minimalist Style) */}
            <div className="flex items-center justify-between py-2 border-b border-[var(--builder-border)] shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (selectedItems.size === mediaItems.length) setSelectedItems(new Set());
                    else setSelectedItems(new Set(mediaItems.map(i => i.id)));
                  }}
                  className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${selectedItems.size > 0 ? "bg-[var(--builder-purple)] border-[var(--builder-purple)]" : "border-[var(--builder-border-mid)] hover:border-[var(--builder-purple)]"
                    }`}
                  title="Select all"
                >
                  {allSelected && <Check className="w-2.5 h-2.5 text-white" />}
                </button>
                {selectedItems.size > 0 && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-builder-text-muted">
                    {selectedItems.size} Selected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {selectedItems.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    disabled={uploading}
                    className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                    title="Delete selected"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Type Filter */}
                <div className="relative">
                  <button
                    onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                    className="p-2 text-[var(--builder-text-faint)] hover:text-[var(--builder-text)] transition-colors"
                  >
                    <ListFilter className="w-4 h-4" />
                  </button>
                  {filterMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-builder-surface-2 border border-builder-border rounded-xl shadow-2xl py-2 z-50 animate-slideDownItem">
                      <div className="px-4 py-1.5 text-[9px] font-black text-[var(--builder-text-faint)] uppercase tracking-widest">Media type</div>
                      {[
                        { id: "all", label: "All" },
                        { id: "videos", label: "Video" },
                        { id: "audio", label: "Audio" },
                        { id: "images", label: "Images" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { setActiveMediaCategory(cat.id as any); setFilterMenuOpen(false); }}
                          className="w-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] flex items-center justify-between transition-colors"
                        >
                          {cat.label}
                          {activeMediaCategory === cat.id && <Check className="w-3 h-3 text-[var(--builder-accent)]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort Toggle */}
                <div className="relative">
                  <button
                    onClick={() => setSortMenuOpen(!sortMenuOpen)}
                    className="p-2 text-[var(--builder-text-faint)] hover:text-[var(--builder-text)] transition-colors"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                  {sortMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-builder-surface-2 border border-builder-border rounded-xl shadow-2xl py-2 z-50 animate-slideDownItem">
                      {[
                        { id: "date", label: "Date added" },
                        { id: "name", label: "Name" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { setSortBy(opt.id as any); setSortMenuOpen(false); }}
                          className="w-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] flex items-center justify-between transition-colors"
                        >
                          {opt.label}
                          {sortBy === opt.id && <Check className="w-3 h-3 text-[var(--builder-accent)]" />}
                        </button>
                      ))}
                      <div className="my-1 border-t border-[var(--builder-border)]" />
                      {[
                        { id: "asc", label: "Ascending" },
                        { id: "desc", label: "Descending" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { setSortOrder(opt.id as any); setSortMenuOpen(false); }}
                          className="w-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] flex items-center justify-between transition-colors"
                        >
                          {opt.label}
                          {sortOrder === opt.id && <Check className="w-3 h-3 text-[var(--builder-accent)]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Media Items Scrollable Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
              {mediaItems
                .filter(item => {
                  const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                  if (!matchesSearch) return false;
                  if (activeMediaCategory === "all") return true;
                  if (activeMediaCategory === "images") return item.mimeType.startsWith("image/");
                  if (activeMediaCategory === "videos") return item.mimeType.startsWith("video/");
                  if (activeMediaCategory === "audio") return item.mimeType.startsWith("audio/");
                  if (activeMediaCategory === "documents") return !item.mimeType.startsWith("image/") && !item.mimeType.startsWith("video/") && !item.mimeType.startsWith("audio/");
                  return true;
                })
                .sort((a, b) => {
                  let res = 0;
                  if (sortBy === "name") res = a.name.localeCompare(b.name);
                  else res = b.createdAt - a.createdAt;
                  return sortOrder === "asc" ? -res : res;
                })
                .length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40 text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--builder-surface-2)] flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-[var(--builder-text-faint)]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--builder-text-faint)]">
                    {searchQuery ? "No matching media" : "No media found"}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pb-20">
                  {mediaItems
                    .filter(item => {
                      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                      if (!matchesSearch) return false;
                      if (activeMediaCategory === "all") return true;
                      if (activeMediaCategory === "images") return item.mimeType.startsWith("image/");
                      if (activeMediaCategory === "videos") return item.mimeType.startsWith("video/");
                      if (activeMediaCategory === "audio") return item.mimeType.startsWith("audio/");
                      if (activeMediaCategory === "documents") return !item.mimeType.startsWith("image/") && !item.mimeType.startsWith("video/") && !item.mimeType.startsWith("audio/");
                      return true;
                    })
                    .sort((a, b) => {
                      let res = 0;
                      if (sortBy === "name") res = a.name.localeCompare(b.name);
                      else res = b.createdAt - a.createdAt;
                      return sortOrder === "asc" ? -res : res;
                    })
                    .map((item) => {
                      return (
                        <div
                          key={item.id}
                          className={`group relative aspect-video rounded-lg overflow-hidden border transition-all duration-300 cursor-move ${selectedItems.has(item.id) ? "border-[var(--builder-purple)] ring-1 ring-[var(--builder-purple)]" : "border-[var(--builder-border)] bg-builder-surface-2"
                            }`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("media-library-url", item.url);
                            e.dataTransfer.setData("media-library-name", item.name);
                            e.dataTransfer.setData("text/plain", item.url);
                          }}
                          onClick={() => {
                            const next = new Set(selectedItems);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            setSelectedItems(next);
                          }}
                          ref={(ref) => {
                            if (ref) {
                              const isVideo = item.mimeType.startsWith("video/");
                              connectors.create(
                                ref,
                                isVideo ? (
                                  <Video
                                    src={item.url}
                                    width="220px"
                                    height="180px"
                                    objectFit="cover"
                                    _isDraggingSource={true}
                                  />
                                ) : (
                                  <Image
                                    src={item.url}
                                    alt={item.name}
                                    width="220px"
                                    height="180px"
                                    objectFit="cover"
                                    _isDraggingSource={true}
                                  />
                                )
                              );
                            }
                          }}
                        >
                          {item.mimeType.startsWith("video/") ? (
                            <div className="w-full h-full relative bg-black/40 overflow-hidden">
                              <video
                                src={`${item.url}#t=0.1`}
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                preload="metadata"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                                <VideoIcon className="w-5 h-5 text-white/50" />
                              </div>
                            </div>
                          ) : item.mimeType.startsWith("audio/") ? (
                            <div className="w-full h-full flex items-center justify-center bg-[var(--builder-surface-3)]">
                              <Music className="w-5 h-5 text-builder-text-muted" />
                            </div>
                          ) : item.mimeType.startsWith("image/") ? (
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileStack className="w-5 h-5 text-[var(--builder-text-faint)]" />
                            </div>
                          )}

                          {/* Selection Checkbox */}
                          <div className={`absolute top-2 left-2 transition-all duration-300 ${selectedItems.has(item.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"}`}>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shadow-lg ${selectedItems.has(item.id) ? "bg-[var(--builder-purple)] border-[var(--builder-purple)]" : "border-white bg-[var(--builder-surface-3)]"
                              }`}>
                              {selectedItems.has(item.id) && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-[var(--builder-surface)]/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addMediaToCanvas(item);
                              }}
                              className="p-2.5 rounded-full bg-[var(--builder-purple)] text-white hover:scale-110 active:scale-95 transition-all shadow-xl"
                              title="Add to canvas"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id);
                              }}
                              className="p-2.5 rounded-full bg-red-500 text-white hover:scale-110 active:scale-95 transition-all shadow-xl"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Info Tag */}
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-[var(--builder-surface)]/80 backdrop-blur-md rounded text-[8px] font-black uppercase tracking-tighter text-[var(--builder-text-faint)]">
                            {Math.round(item.size / 1024)}KB
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>




            {/* Read-only status */}
            {permission === "viewer" && (
              <div className="text-[9px] text-[var(--builder-text-faint)] text-center uppercase tracking-[0.3em] py-2 border-t border-[var(--builder-border)]">
                Viewing mode only
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
