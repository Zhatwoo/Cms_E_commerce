"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { ShoppingBag } from "../../../_assets/Icon/ShoppingBag/ShoppingBag";
import { Home } from "../../../_assets/Icon/Home/Home";
import { Star } from "../../../_assets/Icon/Star/Star";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { useDesignProject } from "../../_context/DesignProjectContext";

export type CategoryTileProps = {
  label?: string;
  imageUrl?: string;
  imageFit?: "cover" | "contain";
  iconType?: "shoppingBag" | "home" | "star";
  iconTheme?: "violet" | "indigo";
  cardWidth?: number;
  cardHeight?: number;
  mediaHeight?: number;
  marginX?: number;
  marginY?: number;
  borderRadius?: number;
  fontSize?: number;
  fontColor?: string;
  cardBgColor?: string;
  mediaBgColor?: string;
  mediaOffsetX?: number;
  mediaOffsetY?: number;
  mediaScale?: number;
};

type StoredLocalCategoryImage = {
  dataUrl: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
};

const LOCAL_CATEGORY_IMAGE_REF_PREFIX = "local-category-image:";

function getLocalCategoryImageStorageKey(projectId: string): string {
  return `craftjs_category_images_${projectId}`;
}

function readStoredLocalCategoryImages(projectId: string): Record<string, StoredLocalCategoryImage> {
  if (typeof window === "undefined") return {};

  const storageKey = getLocalCategoryImageStorageKey(projectId);
  const raw = window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(storageKey);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, StoredLocalCategoryImage>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeStoredLocalCategoryImages(projectId: string, images: Record<string, StoredLocalCategoryImage>): void {
  if (typeof window === "undefined") return;

  try {
    const storageKey = getLocalCategoryImageStorageKey(projectId);
    const serialized = JSON.stringify(images);
    window.localStorage.setItem(storageKey, serialized);
    window.sessionStorage.setItem(storageKey, serialized);
  } catch {
    // Ignore storage quota failures; callers can still fall back to direct data URLs.
  }
}

function addStoredLocalCategoryImage(
  projectId: string,
  dataUrl: string,
  meta: { name: string; mimeType: string; size: number }
): string | null {
  if (!projectId || !dataUrl.startsWith("data:image/")) return null;

  const imageId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const current = readStoredLocalCategoryImages(projectId);
  current[imageId] = {
    dataUrl,
    name: meta.name,
    mimeType: meta.mimeType,
    size: meta.size,
    createdAt: Date.now(),
  };
  writeStoredLocalCategoryImages(projectId, current);
  return `${LOCAL_CATEGORY_IMAGE_REF_PREFIX}${imageId}`;
}

function resolveStoredLocalCategoryImage(projectId: string, value: string): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:image/") || /^https?:\/\//i.test(trimmed) || trimmed.startsWith("blob:")) return trimmed;
  if (!trimmed.startsWith(LOCAL_CATEGORY_IMAGE_REF_PREFIX)) return trimmed;

  const imageId = trimmed.slice(LOCAL_CATEGORY_IMAGE_REF_PREFIX.length);
  const stored = readStoredLocalCategoryImages(projectId);
  return stored[imageId]?.dataUrl || "";
}

const TileIcon = ({ iconType = "shoppingBag" }: { iconType?: CategoryTileProps["iconType"] }) => {
  if (iconType === "home") return <Home size={34} />;
  if (iconType === "star") return <Star size={34} />;
  return <ShoppingBag size={34} />;
};

export const CategoryTile = ({
  label = "Category",
  imageUrl = "",
  imageFit = "cover",
  iconType = "shoppingBag",
  iconTheme = "violet",
  cardWidth = 180,
  cardHeight = 170,
  mediaHeight = 120,
  marginX = 0,
  marginY = 0,
  borderRadius = 14,
  fontSize = 12,
  fontColor = "#1f2937",
  cardBgColor = "#ffffff",
  mediaBgColor = "",
  mediaOffsetX = 0,
  mediaOffsetY = 0,
  mediaScale = 1,
}: CategoryTileProps) => {
  const {
    id,
    connectors: { connect, drag },
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
  }));

  const iconThemeClass = iconTheme === "indigo" ? "bg-[#eef2ff] text-[#6366f1]" : "bg-[#f3f4f6] text-[#8b5cf6]";
  const [isFraming, setIsFraming] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const migratedImageRef = useRef<string | null>(null);
  const { projectId } = useDesignProject();

  const tileClassName = `category-tile-${id?.replace(/[^a-zA-Z0-9_-]/g, "") || "default"}`;
  const safeWidth = Math.max(120, Math.min(520, Number(cardWidth) || 180));
  const safeHeight = Math.max(130, Math.min(620, Number(cardHeight) || 170));
  const safeMediaHeight = Math.max(70, Math.min(520, Number(mediaHeight) || 120));
  const safeMarginX = Math.max(0, Math.min(80, Number(marginX) || 0));
  const safeMarginY = Math.max(0, Math.min(80, Number(marginY) || 0));
  const safeRadius = Math.max(0, Math.min(40, Number(borderRadius) || 14));
  const safeFontSize = Math.max(10, Math.min(28, Number(fontSize) || 12));
  const safeScale = Math.max(0.5, Math.min(3, Number(mediaScale) || 1));
  const safeOffsetX = Math.max(-300, Math.min(300, Number(mediaOffsetX) || 0));
  const safeOffsetY = Math.max(-300, Math.min(300, Number(mediaOffsetY) || 0));
  const resolvedImageFit = imageFit === "contain" ? "contain" : "cover";
  const resolvedImageUrl = resolveStoredLocalCategoryImage(projectId || "", imageUrl);

  const looksLikeImageUrl = (value: string) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return false;
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("data:image/") && !trimmed.startsWith("blob:")) return false;
    if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) return true;
    return /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(trimmed);
  };

  const extractDroppedImageUrl = (dataTransfer: DataTransfer | null | undefined): string => {
    if (!dataTransfer) return "";

    const libraryUrl = dataTransfer.getData("media-library-url") || "";
    const canvasUrl = dataTransfer.getData("canvas-image-url") || "";
    const uriList = dataTransfer.getData("text/uri-list") || "";
    const plainText = dataTransfer.getData("text/plain") || "";
    const html = dataTransfer.getData("text/html") || "";

    const htmlMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const htmlUrl = htmlMatch?.[1] || "";

    return [libraryUrl, canvasUrl, uriList, plainText, htmlUrl].find((item) => looksLikeImageUrl(item)) || "";
  };

  const applyImageUrl = (nextUrl: string) => {
    const normalized = String(nextUrl || "").trim();
    if (!normalized) return;
    setProp((props: CategoryTileProps) => {
      props.imageUrl = normalized;
    });
  };

  const applyImageFit = (nextFit: CategoryTileProps["imageFit"]) => {
    setProp((props: CategoryTileProps) => {
      props.imageFit = nextFit;
    });
  };

  const toggleImageFit = () => {
    applyImageFit(resolvedImageFit === "cover" ? "contain" : "cover");
  };

  useEffect(() => {
    if (!isEditingLabel || !labelRef.current) return;
    labelRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(labelRef.current);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [isEditingLabel]);

  const flushLabelText = () => {
    const nextLabel = labelRef.current?.innerText ?? label;
    const normalized = String(nextLabel || "").trim() || "Category";
    setProp((props: CategoryTileProps) => {
      props.label = normalized;
    });
    setIsEditingLabel(false);
  };

  const onMediaPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    const pointX = event.clientX;
    const pointY = event.clientY;
    dragStartRef.current = {
      x: pointX,
      y: pointY,
      ox: safeOffsetX,
      oy: safeOffsetY,
    };
    setIsFraming(true);
  };

  const onMediaPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!isFraming || !dragStartRef.current) return;
    event.stopPropagation();
    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    const nextX = Math.max(-300, Math.min(300, Math.round(dragStartRef.current.ox + dx)));
    const nextY = Math.max(-300, Math.min(300, Math.round(dragStartRef.current.oy + dy)));
    setProp((props: CategoryTileProps) => {
      props.mediaOffsetX = nextX;
      props.mediaOffsetY = nextY;
    }, 100);
  };

  const stopFraming = () => {
    if (!isFraming) return;
    dragStartRef.current = null;
    setIsFraming(false);
  };

  const onDropMediaFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const storedRef = projectId
        ? addStoredLocalCategoryImage(projectId, result, { name: file.name, mimeType: file.type, size: file.size })
        : null;
      applyImageUrl(storedRef || result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!projectId || !imageUrl || !imageUrl.startsWith("data:image/")) return;
    if (migratedImageRef.current === imageUrl) return;

    migratedImageRef.current = imageUrl;
    const storedRef = addStoredLocalCategoryImage(projectId, imageUrl, {
      name: "category-image",
      mimeType: imageUrl.slice(5, imageUrl.indexOf(";")) || "image/*",
      size: imageUrl.length,
    });

    if (storedRef) {
      applyImageUrl(storedRef);
    }
  }, [imageUrl, projectId]);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;

    const onDragEnter = (e: DragEvent) => {
      const types = Array.from(e.dataTransfer?.types || []);
      const isMediaDrag =
        types.includes("media-library-url") ||
        types.includes("canvas-image-url") ||
        types.includes("text/uri-list") ||
        types.includes("text/html") ||
        types.includes("Files") ||
        types.includes("text/plain");
      if (isMediaDrag) {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }
    };

    const onDragOver = (e: DragEvent) => {
      const types = Array.from(e.dataTransfer?.types || []);
      const isMediaDrag =
        types.includes("media-library-url") ||
        types.includes("canvas-image-url") ||
        types.includes("text/uri-list") ||
        types.includes("text/html") ||
        types.includes("Files") ||
        types.includes("text/plain");
      if (isMediaDrag) {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }
    };

    const onDragLeave = () => {
      setIsDraggingOver(false);
    };

    const onDrop = async (e: DragEvent) => {
      const candidateUrl = extractDroppedImageUrl(e.dataTransfer);
      const file = e.dataTransfer?.files?.[0];

      if (candidateUrl || file) {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        if (candidateUrl) {
          applyImageUrl(candidateUrl);
        } else if (file) {
          await onDropMediaFile(file);
        }

        if (typeof window !== "undefined") {
          (window as any).__CRAFT_REPLACE_DRAG = true;
          setTimeout(() => {
            (window as any).__CRAFT_REPLACE_DRAG = false;
          }, 100);
        }
      }
    };

    el.addEventListener("dragenter", onDragEnter, true);
    el.addEventListener("dragover", onDragOver, true);
    el.addEventListener("dragleave", onDragLeave, true);
    el.addEventListener("drop", onDrop, true);

    return () => {
      el.removeEventListener("dragenter", onDragEnter, true);
      el.removeEventListener("dragover", onDragOver, true);
      el.removeEventListener("dragleave", onDragLeave, true);
      el.removeEventListener("drop", onDrop, true);
    };
  }, [setProp, projectId]);

  useEffect(() => {
    if (!contextMenu) return;

    if (contextMenuRef.current) {
      const left = Math.min(contextMenu.x, Math.max(0, window.innerWidth - 180));
      const top = Math.min(contextMenu.y, Math.max(0, window.innerHeight - 120));
      contextMenuRef.current.style.left = `${left}px`;
      contextMenuRef.current.style.top = `${top}px`;
    }

    const closeMenu = () => setContextMenu(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("contextmenu", closeMenu);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("contextmenu", closeMenu);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu]);

  return (
    <>
      <style>{`
        .${tileClassName} {
          width: min(${safeWidth}px, 100%);
          height: ${safeHeight}px;
          margin: ${safeMarginY}px ${safeMarginX}px;
          border-radius: ${safeRadius}px;
          background: ${cardBgColor};
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
        }
        .${tileClassName} .category-media {
          height: ${safeMediaHeight}px;
          background: ${mediaBgColor || "transparent"};
          overflow: hidden;
          cursor: ${resolvedImageUrl ? (isFraming ? "grabbing" : "grab") : "default"};
          user-select: none;
          touch-action: none;
        }
        .${tileClassName} .category-media img,
        .${tileClassName} .category-media .category-icon-wrap {
          transform: translate(${safeOffsetX}px, ${safeOffsetY}px) scale(${safeScale});
          transform-origin: center;
          will-change: transform;
        }
        .${tileClassName} .category-media img {
          object-fit: ${resolvedImageFit};
        }
        .${tileClassName} .category-label {
          font-size: ${safeFontSize}px;
          color: ${fontColor};
          line-height: 1.35;
          min-height: ${Math.max(36, safeHeight - safeMediaHeight)}px;
        }
      `}</style>
      <div
        ref={(ref) => {
          if (ref) connect(drag(ref));
        }}
        className={`${tileClassName}`}
      >
        <div
          ref={mediaRef}
          className={`category-media relative flex w-full items-center justify-center ${mediaBgColor ? "" : iconThemeClass}`}
          onPointerDown={onMediaPointerDown}
          onPointerMove={onMediaPointerMove}
          onPointerUp={stopFraming}
          onPointerLeave={stopFraming}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!resolvedImageUrl) return;
            setContextMenu({ x: event.clientX, y: event.clientY });
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const file = event.dataTransfer.files?.[0];
            if (file) {
              await onDropMediaFile(file);
            }
          }}
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!resolvedImageUrl) return;
            setContextMenu(null);
            toggleImageFit();
          }}
        >
          {isDraggingOver ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-white/90 bg-black/25 text-xs font-semibold text-white">
              Drop image to replace
            </div>
          ) : null}
          {resolvedImageUrl ? (
            <img src={resolvedImageUrl} alt={label} className="h-full w-full" draggable={false} />
          ) : (
            <div className="category-icon-wrap flex items-center justify-center">
              <TileIcon iconType={iconType} />
            </div>
          )}
        </div>
        <div
          ref={labelRef}
          data-inline-text-edit
          contentEditable={isEditingLabel}
          suppressContentEditableWarning
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsEditingLabel(true);
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onBlur={() => {
            if (isEditingLabel) flushLabelText();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              flushLabelText();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              if (labelRef.current) labelRef.current.innerText = label || "Category";
              setIsEditingLabel(false);
            }
          }}
          className={`category-label flex items-center justify-center px-2 py-[10px] text-center font-semibold ${isEditingLabel ? "cursor-text outline-none" : "cursor-text"}`}
        >
          {label}
        </div>
      </div>

      {contextMenu && resolvedImageUrl ? (
        <div
          ref={contextMenuRef}
          className="fixed z-[10000] min-w-[160px] overflow-hidden rounded-xl border border-[var(--builder-border)] bg-[var(--builder-surface-1)] shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs ${resolvedImageFit === "contain" ? "bg-[var(--builder-surface-2)] text-[var(--builder-text)]" : "text-[var(--builder-text)] hover:bg-[var(--builder-surface-2)]"}`}
            onClick={() => {
              applyImageFit("contain");
              setContextMenu(null);
            }}
          >
            <span>Adjust image</span>
            <span className="opacity-60">Show whole</span>
          </button>
          <button
            type="button"
            className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs ${resolvedImageFit === "cover" ? "bg-[var(--builder-surface-2)] text-[var(--builder-text)]" : "text-[var(--builder-text)] hover:bg-[var(--builder-surface-2)]"}`}
            onClick={() => {
              applyImageFit("cover");
              setContextMenu(null);
            }}
          >
            <span>Crop image</span>
            <span className="opacity-60">Fill frame</span>
          </button>
        </div>
      ) : null}
    </>
  );
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function ColorField({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-[var(--builder-text-muted)]">{title}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          title={title}
          aria-label={title}
          value={value || "#ffffff"}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] p-1"
        />
        <input
          title={`${title} hex`}
          aria-label={`${title} hex`}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#RRGGBB"
          className="h-8 flex-1 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
        />
      </div>
    </div>
  );
}

const CategoryTileSettings = () => {
  const {
    label,
    imageUrl,
    imageFit,
    iconType,
    iconTheme,
    cardWidth,
    cardHeight,
    mediaHeight,
    marginX,
    marginY,
    borderRadius,
    fontSize,
    fontColor,
    cardBgColor,
    mediaBgColor,
    mediaOffsetX,
    mediaOffsetY,
    mediaScale,
    actions: { setProp },
  } = useNode((node) => ({
    label: node.data.props.label as string,
    imageUrl: node.data.props.imageUrl as string,
    imageFit: node.data.props.imageFit as CategoryTileProps["imageFit"],
    iconType: node.data.props.iconType as CategoryTileProps["iconType"],
    iconTheme: node.data.props.iconTheme as CategoryTileProps["iconTheme"],
    cardWidth: node.data.props.cardWidth as number,
    cardHeight: node.data.props.cardHeight as number,
    mediaHeight: node.data.props.mediaHeight as number,
    marginX: node.data.props.marginX as number,
    marginY: node.data.props.marginY as number,
    borderRadius: node.data.props.borderRadius as number,
    fontSize: node.data.props.fontSize as number,
    fontColor: node.data.props.fontColor as string,
    cardBgColor: node.data.props.cardBgColor as string,
    mediaBgColor: node.data.props.mediaBgColor as string,
    mediaOffsetX: node.data.props.mediaOffsetX as number,
    mediaOffsetY: node.data.props.mediaOffsetY as number,
    mediaScale: node.data.props.mediaScale as number,
  }));

  const { projectId } = useDesignProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onUploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const storedRef = projectId
        ? addStoredLocalCategoryImage(projectId, result, { name: file.name, mimeType: file.type, size: file.size })
        : null;
      setProp((props: CategoryTileProps) => {
        props.imageUrl = storedRef || result;
      });
      setUploading(false);
    };
    reader.onerror = () => {
      setUploading(false);
    };
    setUploading(true);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Category Card" defaultOpen>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-[var(--builder-text-muted)]">Category Text</label>
          <input
            title="Category text"
            aria-label="Category text"
            value={label || ""}
            onChange={(e) => {
              const value = e.target.value;
              setProp((props: CategoryTileProps) => {
                props.label = value;
              });
            }}
            className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
          />

          <label className="mt-1 text-[11px] text-[var(--builder-text-muted)]">Image URL</label>
          <input
            title="Category image URL"
            aria-label="Category image URL"
            value={imageUrl || ""}
            onChange={(e) => {
              const value = e.target.value;
              setProp((props: CategoryTileProps) => {
                props.imageUrl = value;
              });
            }}
            placeholder="https://..."
            className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            title="Upload category image"
            aria-label="Upload category image"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadFile(file);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-3)] px-3 text-xs text-[var(--builder-text)]"
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
            <button
              type="button"
              onClick={() => {
                setProp((props: CategoryTileProps) => {
                  props.imageUrl = "";
                });
              }}
              className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-3)] px-3 text-xs text-[var(--builder-text)]"
            >
              Use Icon
            </button>
          </div>

          <p className="text-[10px] text-[var(--builder-text-muted)]">
            Tip: Drag image directly on the card to reframe. Double-click the image to toggle fit. Right-click for crop or adjust.
          </p>

          <label className="mt-1 text-[11px] text-[var(--builder-text-muted)]">Default Icon</label>
          <select
            title="Default icon"
            aria-label="Default icon"
            value={iconType || "shoppingBag"}
            onChange={(e) => {
              const value = e.target.value as CategoryTileProps["iconType"];
              setProp((props: CategoryTileProps) => {
                props.iconType = value;
              });
            }}
            className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
          >
            <option value="shoppingBag">Shopping Bag</option>
            <option value="home">Home</option>
            <option value="star">Star</option>
          </select>

          <label className="mt-1 text-[11px] text-[var(--builder-text-muted)]">Icon Theme</label>
          <select
            title="Icon theme"
            aria-label="Icon theme"
            value={iconTheme || "violet"}
            onChange={(e) => {
              const value = e.target.value as CategoryTileProps["iconTheme"];
              setProp((props: CategoryTileProps) => {
                props.iconTheme = value;
              });
            }}
            className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
          >
            <option value="violet">Violet</option>
            <option value="indigo">Indigo</option>
          </select>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[var(--builder-text-muted)]">Width</label>
              <input
                type="number"
                title="Card width"
                aria-label="Card width"
                value={cardWidth ?? 180}
                min={120}
                max={520}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value), 120, 520);
                  setProp((props: CategoryTileProps) => {
                    props.cardWidth = next;
                  });
                }}
                className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[var(--builder-text-muted)]">Height</label>
              <input
                type="number"
                title="Card height"
                aria-label="Card height"
                value={cardHeight ?? 170}
                min={130}
                max={620}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value), 130, 620);
                  setProp((props: CategoryTileProps) => {
                    props.cardHeight = next;
                  });
                }}
                className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[var(--builder-text-muted)]">Image Height</label>
              <input
                type="number"
                title="Image height"
                aria-label="Image height"
                value={mediaHeight ?? 120}
                min={70}
                max={520}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value), 70, 520);
                  setProp((props: CategoryTileProps) => {
                    props.mediaHeight = next;
                  });
                }}
                className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[var(--builder-text-muted)]">Radius</label>
              <input
                type="number"
                title="Corner radius"
                aria-label="Corner radius"
                value={borderRadius ?? 14}
                min={0}
                max={40}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value), 0, 40);
                  setProp((props: CategoryTileProps) => {
                    props.borderRadius = next;
                  });
                }}
                className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[var(--builder-text-muted)]">Margin X</label>
              <input
                type="number"
                title="Horizontal margin"
                aria-label="Horizontal margin"
                value={marginX ?? 0}
                min={0}
                max={80}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value), 0, 80);
                  setProp((props: CategoryTileProps) => {
                    props.marginX = next;
                  });
                }}
                className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[var(--builder-text-muted)]">Margin Y</label>
              <input
                type="number"
                title="Vertical margin"
                aria-label="Vertical margin"
                value={marginY ?? 0}
                min={0}
                max={80}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value), 0, 80);
                  setProp((props: CategoryTileProps) => {
                    props.marginY = next;
                  });
                }}
                className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[var(--builder-text-muted)]">Text Size</label>
              <input
                type="number"
                title="Text size"
                aria-label="Text size"
                value={fontSize ?? 12}
                min={10}
                max={28}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value), 10, 28);
                  setProp((props: CategoryTileProps) => {
                    props.fontSize = next;
                  });
                }}
                className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[var(--builder-text-muted)]">Zoom</label>
              <input
                type="number"
                step="0.1"
                title="Image zoom"
                aria-label="Image zoom"
                value={mediaScale ?? 1}
                min={0.5}
                max={3}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value), 0.5, 3);
                  setProp((props: CategoryTileProps) => {
                    props.mediaScale = next;
                  });
                }}
                className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
              />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[var(--builder-text-muted)]">Image X</label>
              <input
                type="number"
                title="Image X offset"
                aria-label="Image X offset"
                value={mediaOffsetX ?? 0}
                min={-300}
                max={300}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value), -300, 300);
                  setProp((props: CategoryTileProps) => {
                    props.mediaOffsetX = next;
                  });
                }}
                className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[var(--builder-text-muted)]">Image Y</label>
              <input
                type="number"
                title="Image Y offset"
                aria-label="Image Y offset"
                value={mediaOffsetY ?? 0}
                min={-300}
                max={300}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value), -300, 300);
                  setProp((props: CategoryTileProps) => {
                    props.mediaOffsetY = next;
                  });
                }}
                className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
              />
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setProp((props: CategoryTileProps) => {
                  props.mediaOffsetX = 0;
                  props.mediaOffsetY = 0;
                  props.mediaScale = 1;
                });
              }}
              className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-3)] px-3 text-xs text-[var(--builder-text)]"
            >
              Reset Frame
            </button>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2">
            <ColorField
              title="Text Color"
              value={fontColor || "#1f2937"}
              onChange={(next) => {
                setProp((props: CategoryTileProps) => {
                  props.fontColor = next;
                });
              }}
            />
            <ColorField
              title="Card Background"
              value={cardBgColor || "#ffffff"}
              onChange={(next) => {
                setProp((props: CategoryTileProps) => {
                  props.cardBgColor = next;
                });
              }}
            />
            <ColorField
              title="Image Background"
              value={mediaBgColor || (iconTheme === "indigo" ? "#eef2ff" : "#f3f4f6")}
              onChange={(next) => {
                setProp((props: CategoryTileProps) => {
                  props.mediaBgColor = next;
                });
              }}
            />
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <label className="text-[11px] text-[var(--builder-text-muted)]">Image Fit</label>
            <select
              title="Image fit"
              aria-label="Image fit"
              value={imageFit || "cover"}
              onChange={(event) => {
                const value = event.target.value as CategoryTileProps["imageFit"];
                setProp((props: CategoryTileProps) => {
                  props.imageFit = value;
                });
              }}
              className="h-8 rounded border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)]"
            >
              <option value="cover">Crop / Fill</option>
              <option value="contain">Show Whole Image</option>
            </select>
          </div>

          <div
            className="mt-2 rounded border border-dashed border-[var(--builder-border)] bg-[var(--builder-surface-2)] p-2 text-[10px] text-[var(--builder-text-muted)]"
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={async (event) => {
              event.preventDefault();
              event.stopPropagation();
              const candidateUrl = extractDroppedImageUrl(event.dataTransfer);
              const file = event.dataTransfer.files?.[0];
              if (candidateUrl) {
                applyImageUrl(candidateUrl);
              } else if (file) {
                await onUploadFile(file);
              }
            }}
          >
              Drop an image or image link here to replace this card image.
          </div>
        </div>
      </DesignSection>
    </div>
  );
};

CategoryTile.craft = {
  displayName: "Category Tile",
  props: {
    label: "Category",
    imageUrl: "",
    imageFit: "cover",
    iconType: "shoppingBag",
    iconTheme: "violet",
    cardWidth: 180,
    cardHeight: 170,
    mediaHeight: 120,
    marginX: 0,
    marginY: 0,
    borderRadius: 14,
    fontSize: 12,
    fontColor: "#1f2937",
    cardBgColor: "#ffffff",
    mediaBgColor: "",
    mediaOffsetX: 0,
    mediaOffsetY: 0,
    mediaScale: 1,
  },
  related: {
    settings: CategoryTileSettings,
  },
  rules: {
    canDrag: () => true,
  },
  isCanvas: false,
};

export default CategoryTile;
