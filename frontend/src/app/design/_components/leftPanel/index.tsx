import React, { useState, useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { useRouter, useSearchParams } from "next/navigation";
import { DesignTooltip } from "../DesignTooltip";
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
  const [internalPanel, setInternalPanel] = useState<LeftPanelTabId>("components");
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
  const [isMediaDropActive, setIsMediaDropActive] = useState(false);

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

  const inferFileExtension = (mimeType: string) => {
    if (mimeType.includes("png")) return "png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
    if (mimeType.includes("webp")) return "webp";
    if (mimeType.includes("gif")) return "gif";
    if (mimeType.includes("svg")) return "svg";
    if (mimeType.includes("avif")) return "avif";
    if (mimeType.includes("mp4")) return "mp4";
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("ogg")) return "ogg";
    return "bin";
  };

  const extractDroppedUrls = (dataTransfer: DataTransfer): string[] => {
    const urls = new Set<string>();

    const uriList = dataTransfer.getData("text/uri-list");
    if (uriList) {
      uriList
        .split("\n")
        .map((entry) => entry.trim())
        .filter((entry) => entry && !entry.startsWith("#"))
        .forEach((entry) => urls.add(entry));
    }

    const plainText = dataTransfer.getData("text/plain");
    if (plainText) {
      const rawTokens = plainText.split(/\s+/).map((entry) => entry.trim());
      rawTokens.forEach((token) => {
        try {
          const parsed = new URL(token);
          if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            urls.add(parsed.toString());
          }
        } catch {
          // Ignore non-url plain text payloads.
        }
      });
    }

    const html = dataTransfer.getData("text/html");
    if (html) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      doc.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src")?.trim();
        if (!src) return;
        try {
          const parsed = new URL(src);
          if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            urls.add(parsed.toString());
          }
        } catch {
          // Ignore invalid image src values.
        }
      });
    }

    return Array.from(urls);
  };

  const toUploadableFile = async (resourceUrl: string): Promise<File | null> => {
    try {
      const response = await fetch(resourceUrl, { mode: "cors" });
      if (!response.ok) return null;

      const mimeType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      const isAllowedType =
        mimeType.startsWith("image/") ||
        mimeType.startsWith("video/") ||
        mimeType.startsWith("audio/");

      if (!isAllowedType) return null;

      const blob = await response.blob();
      const parsedUrl = new URL(resourceUrl);
      const nameFromPath = parsedUrl.pathname.split("/").pop()?.trim();
      const fallbackName = `dropped-${Date.now()}.${inferFileExtension(mimeType)}`;
      const fileName = nameFromPath && nameFromPath.length > 0 ? nameFromPath : fallbackName;

      return new File([blob], fileName, {
        type: mimeType || blob.type || "application/octet-stream",
        lastModified: Date.now(),
      });
    } catch {
      return null;
    }
  };

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


  const uploadFilesFromArray = async (files: File[]) => {
    if (files.length === 0) return;
    if (permission === "viewer") return;
    if (!projectId) {
      setUploadError("No project selected.");
      return;
    }

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

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    await uploadFilesFromArray(Array.from(fileList));
  };

  const handleMediaDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMediaDropActive(false);

    if (uploading || permission === "viewer") return;
    if (e.dataTransfer.types.includes("media-library-url")) return;

    const droppedFiles = Array.from(e.dataTransfer.files || []).filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/") || file.type.startsWith("audio/")
    );

    const droppedUrls = extractDroppedUrls(e.dataTransfer);
    const convertedFiles = await Promise.all(droppedUrls.map((url) => toUploadableFile(url)));
    const remoteFiles = convertedFiles.filter((file): file is File => !!file);
    const filesToUpload = [...droppedFiles, ...remoteFiles];

    if (filesToUpload.length === 0) {
      if (droppedUrls.length > 0) {
        setUploadError("Could not import dropped URL. Some websites block direct image access (CORS).");
      }
      return;
    }

    await uploadFilesFromArray(filesToUpload);
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


  // If the user is a viewer, the Components tab is not available — fall back to Files.
  useEffect(() => {
    if (permission === "viewer" && internalPanel === "components") {
      setInternalPanel("files");
    }
  }, [permission, internalPanel]);

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
                <div className="flex items-center gap-2 bg-builder-surface-3 rounded-lg px-2 py-1 -ml-2 ring-1 ring-blue-500/50">
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
                  className="flex items-center gap-2 hover:bg-builder-surface-2 rounded-lg px-2 py-1 -ml-2 transition-colors cursor-pointer"
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
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-builder-text hover:bg-builder-surface-3 transition-colors cursor-pointer"
                      >
                        <Save className="w-4 h-4 text-builder-text-muted" />
                        Save project
                        <span className="ml-auto text-[10px] text-builder-text-muted/50">Ctrl+S</span>
                      </button>

                      {/* Export JSON */}
                      <button
                        onClick={handleExportJson}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-builder-text hover:bg-builder-surface-3 transition-colors cursor-pointer"
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
                  className="p-1 rounded-lg hover:bg-builder-surface-2 text-builder-text-muted transition-colors cursor-pointer"
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
        <div className="flex text-[10px] font-bold uppercase tracking-widest items-stretch justify-center py-1.5 px-2 gap-1 min-h-0 border-b border-(--builder-border)">
          <div className="flex-1 min-w-0">
            <DesignTooltip content="Layers — view and organize canvas elements" position="bottom">
              <button
                type="button"
                onClick={() => setActivePanel("files")}
                className={`w-full flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-all duration-200 cursor-pointer ${activePanel === "files"
                  ? "text-builder-accent bg-builder-accent/10 shadow-[0_0_8px_var(--builder-accent-glow)]"
                  : "text-builder-text-muted hover:text-builder-text"}`}
              >
                <FileStack className="w-4 h-4 shrink-0" />
                <span>Files</span>
              </button>
            </DesignTooltip>
          </div>
          {permission !== "viewer" && (
            <div className="flex-1 min-w-0">
              <DesignTooltip content="Components — drag building blocks to canvas" position="bottom">
                <button
                  type="button"
                  onClick={() => setActivePanel("components")}
                  className={`w-full flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-all duration-200 cursor-pointer ${activePanel === "components"
                    ? "text-builder-accent bg-builder-accent/10 shadow-[0_0_8px_var(--builder-accent-glow)]"
                    : "text-builder-text-muted hover:text-builder-text"}`}
                >
                  <Component className="w-4 h-4 shrink-0" />
                  <span>Components</span>
                </button>
              </DesignTooltip>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <DesignTooltip content="Media library — manage images and files" position="bottom">
              <button
                type="button"
                onClick={() => setActivePanel("media")}
                className={`w-full flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-all duration-200 cursor-pointer ${activePanel === "media"
                  ? "text-builder-accent bg-builder-accent/10 shadow-[0_0_8px_var(--builder-accent-glow)]"
                  : "text-builder-text-muted hover:text-builder-text"}`}
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span>Media</span>
              </button>
            </DesignTooltip>
          </div>
        </div>
      </div>

      {/* Panel content: scrollable; Files/Assets/Templates show scrollbar for full layer access */}
      <div className={`editor-panel-scroll flex-1 min-h-0 overflow-x-hidden overscroll-contain ${activePanel === "components" ? "overflow-hidden" : "overflow-y-auto px-4 pb-4 mt-4"}`}>
        {activePanel === "files" && (canMountFilesPanel ? <FilesPanel /> : null)}
        {activePanel === "components" && <ComponentsPanel />}
        {activePanel === "media" && (
          <div
            className="h-full flex flex-col gap-5 px-3 pb-4 bg-builder-surface relative"
            onDragOver={(e) => {
              e.preventDefault();
              if (!isMediaDropActive) setIsMediaDropActive(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              if (!isMediaDropActive) setIsMediaDropActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              const nextTarget = e.relatedTarget as Node | null;
              if (!nextTarget || !e.currentTarget.contains(nextTarget)) {
                setIsMediaDropActive(false);
              }
            }}
            onDrop={handleMediaDrop}
          >
            {isMediaDropActive && (
              <div className="absolute inset-2 z-30 border-2 border-dashed border-(--builder-purple) bg-builder-purple/10 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="px-4 py-3 rounded-lg bg-builder-surface/80 border border-(--builder-border) text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-builder-text">Drop to import media</div>
                  <div className="text-[9px] mt-1 text-builder-text-faint">Works with local files and image links dragged from websites</div>
                </div>
              </div>
            )}
            {/* Search Bar - Integrated with Brand Theme */}
            <div className="relative group shrink-0 mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-builder-text-faint group-focus-within:text-builder-text transition-colors" />
              <input
                type="text"
                placeholder="SEARCH MEDIA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-builder-surface-2 border border-(--builder-border) rounded-lg py-2.5 pl-9 pr-4 text-[10px] font-bold uppercase tracking-[0.2em] text-builder-text placeholder:text-builder-text-faint focus:outline-none focus:bg-builder-surface-3 focus:border-(--builder-border-mid) transition-all"
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
              <DesignTooltip content="Upload images, videos, or audio files from your device" position="top">
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 bg-builder-purple hover:bg-builder-purple-light text-white text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-transparent border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Import media</span>
                </button>
              </DesignTooltip>
            </div>

            <div className="text-[9px] uppercase tracking-[0.18em] text-builder-text-faint -mt-2">
              Tip: Drag image files or image links from other websites into this panel.
            </div>

            {/* Selection & Toolbar (Minimalist Style) */}
            <div className="flex items-center justify-between py-2 border-b border-(--builder-border) shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (selectedItems.size === mediaItems.length) setSelectedItems(new Set());
                    else setSelectedItems(new Set(mediaItems.map(i => i.id)));
                  }}
                  className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${selectedItems.size > 0 ? "bg-builder-purple border-(--builder-purple)" : "border-(--builder-border-mid) hover:border-(--builder-purple)"
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
                    className="p-2 text-builder-text-faint hover:text-builder-text transition-colors"
                  >
                    <ListFilter className="w-4 h-4" />
                  </button>
                  {filterMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-builder-surface-2 border border-builder-border rounded-xl shadow-2xl py-2 z-50 animate-slideDownItem">
                      <div className="px-4 py-1.5 text-[9px] font-black text-builder-text-faint uppercase tracking-widest">Media type</div>
                      {[
                        { id: "all", label: "All" },
                        { id: "videos", label: "Video" },
                        { id: "audio", label: "Audio" },
                        { id: "images", label: "Images" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { setActiveMediaCategory(cat.id as any); setFilterMenuOpen(false); }}
                          className="w-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-3 flex items-center justify-between transition-colors"
                        >
                          {cat.label}
                          {activeMediaCategory === cat.id && <Check className="w-3 h-3 text-builder-accent" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort Toggle */}
                <div className="relative">
                  <button
                    onClick={() => setSortMenuOpen(!sortMenuOpen)}
                    className="p-2 text-builder-text-faint hover:text-builder-text transition-colors"
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
                          className="w-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-3 flex items-center justify-between transition-colors"
                        >
                          {opt.label}
                          {sortBy === opt.id && <Check className="w-3 h-3 text-builder-accent" />}
                        </button>
                      ))}
                      <div className="my-1 border-t border-(--builder-border)" />
                      {[
                        { id: "asc", label: "Ascending" },
                        { id: "desc", label: "Descending" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { setSortOrder(opt.id as any); setSortMenuOpen(false); }}
                          className="w-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-3 flex items-center justify-between transition-colors"
                        >
                          {opt.label}
                          {sortOrder === opt.id && <Check className="w-3 h-3 text-builder-accent" />}
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
                  <div className="w-12 h-12 rounded-full bg-builder-surface-2 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-builder-text-faint" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-builder-text-faint">
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
                          className={`group relative aspect-[4/3] rounded-lg overflow-hidden border transition-all duration-300 cursor-move ${selectedItems.has(item.id) ? "border-(--builder-purple) ring-1 ring-(--builder-purple)" : "border-(--builder-border) bg-builder-surface-2"
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
                                    objectFit="contain"
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
                            <div className="w-full h-full flex items-center justify-center bg-builder-surface-3">
                              <Music className="w-5 h-5 text-builder-text-muted" />
                            </div>
                          ) : item.mimeType.startsWith("image/") ? (
                            <img src={item.url} alt={item.name} className="w-full h-full object-contain bg-builder-surface-3 p-1 transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileStack className="w-5 h-5 text-builder-text-faint" />
                            </div>
                          )}

                          {/* Selection Checkbox */}
                          <div className={`absolute top-2 left-2 transition-all duration-300 ${selectedItems.has(item.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"}`}>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shadow-lg ${selectedItems.has(item.id) ? "bg-builder-purple border-(--builder-purple)" : "border-white bg-builder-surface-3"
                              }`}>
                              {selectedItems.has(item.id) && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-builder-surface/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addMediaToCanvas(item);
                              }}
                              className="p-2.5 rounded-full bg-builder-purple text-white hover:scale-110 active:scale-95 transition-all shadow-xl"
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
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-builder-surface/80 backdrop-blur-md rounded text-[8px] font-black uppercase tracking-tighter text-builder-text-faint">
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
              <div className="text-[9px] text-builder-text-faint text-center uppercase tracking-[0.3em] py-2 border-t border-(--builder-border)">
                Viewing mode only
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
