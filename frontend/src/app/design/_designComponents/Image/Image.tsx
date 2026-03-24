import React, { useEffect } from "react";
import { Plus } from "lucide-react";
import { useEditor, useNode } from "@craftjs/core";
import { ImageSettings } from "./ImageSettings";
import type { ImageProps } from "../../_types/components";

declare global {
  interface Window {
    __CRAFT_REPLACE_DRAG?: boolean;
  }
}

export const Image = ({
  src,
  alt = "Image",
  objectFit = "cover",
  width = "320px",
  height = "auto",
  borderRadius = 0,
  radiusTopLeft,
  radiusTopRight,
  radiusBottomRight,
  radiusBottomLeft,
  padding = 0,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin = 0,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  opacity = 1,
  boxShadow = "none",
  overflow = "visible",
  cursor = "default",
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  customClassName = "",
  position = "relative",
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  zIndex = 0,
  display = "block",
  editorVisibility = "auto",
  _autoFitInTabs = false,
  _isDraggingSource = false,
}: ImageProps) => {
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { id, connectors: { connect, drag }, parentId } = useNode((node) => ({
    parentId: node.data.parent,
  }));

  const { actions } = useEditor();
  const { parentDisplay, parentDisplayName, parentHeight, isInsideTabsContext } = useEditor((state) => {
    const parentNode = parentId ? state.nodes[parentId] : undefined;
    const parentDisplayValue = parentNode ? String(parentNode.data?.props?.display ?? "") : "";
    const parentDisplayNameValue = parentNode ? String(parentNode.data?.displayName ?? "") : "";
    const parentHeightValue = parentNode ? parentNode.data?.props?.height : undefined;

    let insideTabs = false;
    let cursorId: string | null | undefined = parentId;
    let guard = 0;
    while (cursorId && cursorId !== "ROOT" && guard < 50) {
      guard += 1;
      const currentNode: (typeof state.nodes)[string] | undefined = state.nodes[cursorId];
      if (!currentNode) break;
      const rawName = String(currentNode.data?.displayName ?? "").trim().toLowerCase();
      if (rawName === "tabs" || rawName === "tab content" || rawName === "tabcontent") {
        insideTabs = true;
        break;
      }
      cursorId = currentNode.data?.parent;
    }

    return {
      parentDisplay: parentDisplayValue,
      parentDisplayName: parentDisplayNameValue,
      parentHeight: parentHeightValue,
      isInsideTabsContext: insideTabs,
    };
  });

  // Handle auto-discard if this node was created as a side-effect of a replacement drop
  useEffect(() => {
    if (_isDraggingSource && typeof window !== "undefined" && window.__CRAFT_REPLACE_DRAG) {
      // Use setTimeout to ensure Craft.js has finished processing the node addition 
      // before we try to remove it, avoiding "Node does not exist" invariant errors.
      const timer = setTimeout(() => {
        try {
          actions.delete(id);
        } catch (e) {
          // Ignore if already deleted or doesn't exist
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [_isDraggingSource, id, actions]);

  const shouldFillParent = parentDisplay === "flex" || parentDisplay === "grid";
  const isContainerLikeParent =
    parentDisplayName === "Container" || parentDisplayName === "Section" || parentDisplayName === "Tab Content";
  const isTabsLikeContext =
    isInsideTabsContext || parentDisplayName === "Tabs" || parentDisplayName === "Tab Content" || parentDisplayName === "TabContent";
  const shouldAutoFitToTabs = Boolean(isTabsLikeContext && _autoFitInTabs === true);
  const isAutoHeight = typeof height !== "string" || height.trim().toLowerCase() === "auto";
  const parentHeightText = typeof parentHeight === "string" ? parentHeight.trim().toLowerCase() : "";
  const parentHasExplicitHeight =
    (typeof parentHeight === "number" && Number.isFinite(parentHeight) && parentHeight > 0) ||
    (typeof parentHeight === "string" && parentHeightText !== "" && parentHeightText !== "auto");

  const resolvedWidth = shouldAutoFitToTabs ? "100%" : width;
  const resolvedHeight =
    shouldAutoFitToTabs
      ? "100%"
      :
    isContainerLikeParent && isAutoHeight && parentHasExplicitHeight
      ? "100%"
      : (height ?? "auto");

  const effectiveDisplay =
    editorVisibility === "hide"
      ? "none"
      : editorVisibility === "show" && display === "none"
        ? "block"
        : display;

  // Handle empty or invalid src
  const imageSrc = src && src.trim() !== ""
    ? src
    : "https://placehold.co/600x400?text=Photo";

  // Resolve spacing
  const p = typeof padding === "number" ? padding : 0;
  const pt = paddingTop ?? p;
  const pr = paddingRight ?? p;
  const pb = paddingBottom ?? p;
  const pl = paddingLeft ?? p;

  const m = typeof margin === "number" ? margin : 0;
  const mt = marginTop ?? m;
  const mr = marginRight ?? m;
  const mb = marginBottom ?? m;
  const ml = marginLeft ?? m;

  // Resolve border radius
  const br = borderRadius || 0;
  const rtl = radiusTopLeft ?? br;
  const rtr = radiusTopRight ?? br;
  const rbr = radiusBottomRight ?? br;
  const rbl = radiusBottomLeft ?? br;

  // We use native listeners with capture: true to beat Craft.js event interception.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDragOver = (e: DragEvent) => {
      const types = Array.from(e.dataTransfer?.types || []);
      const isMediaDrag = types.includes("media-library-url") ||
        types.includes("canvas-image-url") ||
        types.some(t => t.toLowerCase().includes("image"));

      if (isMediaDrag) {
        // Claim this event!
        e.preventDefault();
        e.stopPropagation();
        if (!isDraggingOver) setIsDraggingOver(true);
      }
    };

    const onDragEnter = (e: DragEvent) => {
      const types = Array.from(e.dataTransfer?.types || []);
      if (types.includes("media-library-url") || types.includes("canvas-image-url")) {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }
    };

    const onDragLeave = () => {
      setIsDraggingOver(false);
    };

    const onDrop = (e: DragEvent) => {
      const libraryUrl = e.dataTransfer?.getData("media-library-url");
      const canvasUrl = e.dataTransfer?.getData("canvas-image-url");
      const url = libraryUrl || canvasUrl;

      if (url) {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        actions.setProp(id, (props: any) => {
          props.src = url;
          const name = libraryUrl
            ? e.dataTransfer?.getData("media-library-name")
            : e.dataTransfer?.getData("canvas-image-name");
          if (name) props.alt = name;
        });

        // Flag that a replacement happened to discard the incoming new node from Craft.js
        if (typeof window !== "undefined") {
          window.__CRAFT_REPLACE_DRAG = true;
          setTimeout(() => {
            window.__CRAFT_REPLACE_DRAG = false;
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
  }, [id, actions, isDraggingOver]);

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
          (containerRef as any).current = ref;
        }
      }}
      className={`relative group ${customClassName}`}
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        paddingTop: `${pt}px`,
        paddingRight: `${pr}px`,
        paddingBottom: `${pb}px`,
        paddingLeft: `${pl}px`,
        marginTop: `${mt}px`,
        marginRight: `${mr}px`,
        marginBottom: `${mb}px`,
        marginLeft: `${ml}px`,
        position: position as any,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        display: effectiveDisplay,
        overflow,
        cursor,
        transform: [rotation ? `rotate(${rotation}deg)` : null, flipHorizontal ? "scaleX(-1)" : null, flipVertical ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined,
      }}
    >
      <img
        src={imageSrc}
        alt={alt}
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== "https://placehold.co/600x400?text=Image+Not+Found") {
            target.src = "https://placehold.co/600x400?text=Image+Not+Found";
          }
        }}
        style={{
          width: "100%",
          height: resolvedHeight === "auto" ? "auto" : "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          minWidth: 0,
          minHeight: 0,
          flexShrink: 0,
          boxSizing: "border-box",
          objectFit,
          borderTopLeftRadius: `${rtl}px`,
          borderTopRightRadius: `${rtr}px`,
          borderBottomRightRadius: `${rbr}px`,
          borderBottomLeftRadius: `${rbl}px`,
          opacity,
          boxShadow,
          display: "block",
        }}
        className="cursor-pointer pointer-events-none"
      />

      {/* Photo Frame Drop Overlay (Visible when dragging over) */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-[100] bg-brand-medium/50 border-4 border-dashed border-brand-lighter rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-200 pointer-events-none animate-in fade-in zoom-in">
          <div className="w-12 h-12 rounded-full bg-brand-lighter flex items-center justify-center text-brand-dark shadow-2xl animate-pulse">
            <Plus className="w-7 h-7 stroke-[3]" />
          </div>
          <div className="bg-brand-darker px-4 py-2 rounded-full border border-white/20 shadow-xl">
            <span className="text-[11px] text-brand-lighter uppercase tracking-[0.2em] font-black">Replace Content</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const ImageDefaultProps: Partial<ImageProps> = {
  src: "https://placehold.co/600x400/27272a/a1a1aa?text=Image",
  alt: "Image",
  objectFit: "cover",
  width: "320px",
  height: "220px",
  borderRadius: 0,
  padding: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  margin: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  opacity: 1,
  boxShadow: "none",
  _autoFitInTabs: false,
};

Image.craft = {
  displayName: "Image",
  props: ImageDefaultProps,
  related: {
    settings: ImageSettings,
  },
};
