"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

type DropPoint = {
  clientX: number;
  clientY: number;
  ts: number;
};

const NEW_PAGE_WIDTH = 1920;
const NEW_PAGE_HEIGHT = 1200;
const GENERIC_PAGE_NAME_PATTERN = /^(page name|page|untitled|unnamed|new page|new page component)$/i;

function canonicalResolvedName(rawName: unknown): string {
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name) return "Container";
  const lowered = name.toLowerCase();
  if (lowered === "image") return "Image";
  if (lowered === "text") return "Text";
  if (lowered === "container") return "Container";
  if (lowered === "tabs") return "Tabs";
  if (lowered === "tabcontent" || lowered === "tab content") return "TabContent";
  if (lowered === "page") return "Page";
  if (lowered === "viewport") return "Viewport";
  if (lowered.includes("image")) return "Image";
  if (lowered.includes("text")) return "Text";
  if (lowered.includes("container")) return "Container";
  if (lowered.includes("tabs")) return "Tabs";
  if (lowered.includes("tabcontent")) return "TabContent";
  if (lowered.includes("page")) return "Page";
  if (lowered.includes("viewport")) return "Viewport";
  return name;
}

function sanitizeTreeTypes(tree: Record<string, any>): Record<string, any> {
  Object.keys(tree).forEach((id) => {
    const node = tree[id];
    if (!node || typeof node !== "object") return;
    const currentName = typeof node.type === "string" ? node.type : node?.type?.resolvedName;
    const canonical = canonicalResolvedName(currentName);
    if (typeof node.type === "string") {
      node.type = { resolvedName: canonical };
    } else if (node.type && typeof node.type === "object") {
      node.type.resolvedName = canonical;
    } else {
      node.type = { resolvedName: canonical };
    }
    node.displayName = canonical;
    if (!Array.isArray(node.nodes)) node.nodes = [];
  });
  return tree;
}

function resolveViewportId(nodes: Record<string, any>): string | null {
  const rootNode = nodes?.ROOT;
  if (!rootNode) return null;

  // 1. Direct check: ROOT might be the Viewport itself
  if (rootNode?.data?.displayName === "Viewport") return "ROOT";

  // 2. Structural check: Frame -> Viewport
  const frameRootId = rootNode?.data?.nodes?.[0] ?? null;
  const frameRoot = frameRootId ? nodes?.[frameRootId] : null;

  if (frameRoot?.data?.displayName === "Viewport") return frameRootId;

  const viewportId = frameRoot?.data?.nodes?.[0] ?? null;
  if (viewportId && nodes?.[viewportId]?.data?.displayName === "Viewport") {
    return viewportId;
  }

  // 3. Fallback: Search all nodes
  const fallback = Object.keys(nodes ?? {}).find((id) => nodes?.[id]?.data?.displayName === "Viewport");
  return fallback ?? null;
}

function getEffectiveZoom(el: HTMLElement | null): number {
  if (!el) return 1;
  let cssZoom = 1;
  let current: HTMLElement | null = el;
  while (current) {
    const zoomText = window.getComputedStyle(current).zoom;
    const parsed = parseFloat(zoomText);
    if (Number.isFinite(parsed) && parsed > 0) {
      cssZoom *= parsed;
    }
    current = current.parentElement;
  }

  // 2. Detect transform scale by comparing bounding rect to offset dimensions
  const rect = el.getBoundingClientRect();
  const sx = el.offsetWidth > 0 ? rect.width / el.offsetWidth : 1;
  const sy = el.offsetHeight > 0 ? rect.height / el.offsetHeight : 1;
  // Average x and y scale to handle minor differences
  const transformScale = Number.isFinite(sx) && Number.isFinite(sy) ? (sx + sy) / 2 : 1;

  const effective = cssZoom * transformScale;
  return effective > 0.01 ? effective : 1;
}

/**
 * Try to get the scale value directly from the canvas container's transform style.
 * Returns null if unable to parse.
 */
function getCanvasContainerScale(): number | null {
  const container = document.querySelector("[data-canvas-container]") as HTMLElement | null;
  if (!container) return null;

  // Search for the first child that has a transform, or the first div if none found
  const innerContent = (container.querySelector("div[style*='transform']") || container.firstElementChild) as HTMLElement | null;
  if (!innerContent) return null;

  const transform = innerContent.style.transform || window.getComputedStyle(innerContent).transform;
  if (!transform || transform === "none") return null;

  if (transform.startsWith("scale(")) {
    const scale = parseFloat(transform.replace("scale(", "").replace(")", ""));
    return Number.isFinite(scale) ? scale : null;
  }
  const scaleMatch = transform.match(/scale\(([^)]+)\)/);
  if (scaleMatch && scaleMatch[1]) {
    const scale = parseFloat(scaleMatch[1]);
    if (Number.isFinite(scale) && scale > 0) {
      return scale;
    }
  }

  // Try matrix parsing as fallback: matrix(a, b, c, d, e, f) where a is scaleX
  const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
  if (matrixMatch && matrixMatch[1]) {
    const values = matrixMatch[1].split(",").map((v) => parseFloat(v.trim()));
    if (values.length >= 4) {
      const scaleX = values[0];
      const scaleY = values[3];
      if (Number.isFinite(scaleX) && Number.isFinite(scaleY) && scaleX > 0 && scaleY > 0) {
        return (scaleX + scaleY) / 2;
      }
    }
  }

  return null;
}
/**
 * Convert drop screen position to canvas coordinates (canvasX, canvasY).
 * Page uses position: absolute with left: canvasX, top: canvasY relative to viewport-desktop.
 * So we measure offset from viewport-desktop's top-left and divide by scale.
 */
function getDropCanvasPoint(drop: { clientX: number; clientY: number }): { x: number; y: number } {
  const desktopRoot = document.querySelector("[data-viewport-desktop]") as HTMLElement | null;
  if (!desktopRoot) {
    console.warn("NewPageDrop: No desktop root found");
    return { x: 30000, y: 30000 };
  }

  const rect = desktopRoot.getBoundingClientRect();
  
  // Try to get scale directly from the transforming ancestor in editorShell
  let effectiveScale = 1;
  const scaledAncestor = desktopRoot.closest("div[style*='scale']") as HTMLElement | null;
  if (scaledAncestor) {
    const transform = scaledAncestor.style.transform;
    const match = transform.match(/scale\(([^)]+)\)/);
    if (match) {
      effectiveScale = parseFloat(match[1]) || 1;
    }
  } else {
    // Fallback to bounding rect vs logical size
    const logicalWidth = desktopRoot.offsetWidth || 1;
    effectiveScale = rect.width / logicalWidth || 1;
  }

  // Safety clamp
  if (effectiveScale < 0.01) effectiveScale = 1;

  const x = (drop.clientX - rect.left) / effectiveScale;
  const y = (drop.clientY - rect.top) / effectiveScale;

  console.log("NewPageDrop Calculation:", {
    clientX: drop.clientX,
    clientY: drop.clientY,
    rectLeft: rect.left,
    rectTop: rect.top,
    scale: effectiveScale,
    resultX: x,
    resultY: y
  });

  return {
    x: Number.isFinite(x) ? Math.round(x) : 0,
    y: Number.isFinite(y) ? Math.round(y) : 0,
  };
}

export const NewPageDropPlacementHandler = () => {
  const { actions, query } = useEditor();
  const armedDragRef = useRef(false);
  const movedDuringDragRef = useRef(false);
  const preDropPageIdsRef = useRef<Set<string>>(new Set());
  const lastDropPointRef = useRef<DropPoint | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const previewElRef = useRef<HTMLElement | null>(null);

  const setBodyDragSelectionLock = (locked: boolean) => {
    if (typeof document === "undefined") return;
    document.body.style.userSelect = locked ? "none" : "";
  };

  /**
   * Repositions the page node that CraftJS already created via drag-create.
   * This handler NEVER creates a new page — CraftJS owns creation.
   * Returns true when the new page was found and repositioned (done), false to retry.
   */
  const placeDroppedPage = (): boolean => {
    try {
      const drop = lastDropPointRef.current;
      if (!drop || Date.now() - drop.ts > 2000) {
        lastDropPointRef.current = null;
        return true; // timed out — stop retrying
      }

      const state = query.getState();
      if (!state) {
        lastDropPointRef.current = null;
        return true;
      }
      const nodes = state.nodes ?? {};
      const viewportId = resolveViewportId(nodes);
      const viewportChildren = (viewportId && Array.isArray(nodes[viewportId]?.data?.nodes))
        ? (nodes[viewportId].data.nodes as string[])
        : [];

      // 2. Look for new Pages in the viewport first
      const currentViewportPageIds = viewportChildren.filter((id) => {
        const dname = nodes[id]?.data?.displayName || nodes[id]?.data?.type?.resolvedName;
        return canonicalResolvedName(dname) === "Page";
      });
      const preDrop = preDropPageIdsRef.current;
      let newPageIds = currentViewportPageIds.filter((id) => !preDrop.has(id));

      // 3. Fallback: If no new pages in viewport, check the entire state
      // (Sometimes Craft.js might add it to ROOT or elsewhere temporarily)
      if (newPageIds.length === 0) {
        const allPageIds = Object.keys(nodes).filter((id) => {
          const dname = nodes[id]?.data?.displayName || nodes[id]?.data?.type?.resolvedName;
          return canonicalResolvedName(dname) === "Page";
        });
        newPageIds = allPageIds.filter((id) => !preDrop.has(id));
      }

      if (newPageIds.length === 0) return false;

      const dropPoint = getDropCanvasPoint(drop);

      if (newPageIds.length > 0) {
        const existingPageCount = Math.max(0, currentViewportPageIds.length - newPageIds.length);
        newPageIds.forEach((pageId, index) => {
          // Top-left anchoring for the first page, subsequent pages offset by 36px
          const canvasX = Math.round(dropPoint.x + index * 36);
          const canvasY = Math.round(dropPoint.y + index * 36);
          const nextPageName = `Page ${existingPageCount + index + 1}`;
          const pageProps = nodes[pageId]?.data?.props as Record<string, unknown> | undefined;
          const currentName = typeof pageProps?.pageName === "string" ? pageProps.pageName.trim() : "";
          const shouldAutoName = currentName.length === 0 || GENERIC_PAGE_NAME_PATTERN.test(currentName);

          actions.setProp(pageId, (props: Record<string, unknown>) => {
            props.canvasX = canvasX;
            props.canvasY = canvasY;
            if (shouldAutoName) {
              props.pageName = nextPageName;
              props.pageSlug = `page-${existingPageCount + index}`;
            }
          });
        });

        lastDropPointRef.current = null;
        // Update baseline to include all current pages
        const latestPageIds = Object.keys(nodes).filter((id) => {
          const dname = nodes[id]?.data?.displayName || nodes[id]?.data?.type?.resolvedName;
          return canonicalResolvedName(dname) === "Page";
        });
        preDropPageIdsRef.current = new Set(latestPageIds);
        return true;
      }

      // No new page detected yet. Do not create a fallback page here:
      // Craft may commit the dragged "New Page" asynchronously. We retry placement for a few frames
      // and only create a fallback once (see schedulePlacementRetry → createPageAtDropPoint).
      return false;
    } catch (err) {
      console.error("placeDroppedPage unexpected error:", err);
      lastDropPointRef.current = null;
      return true;
    }
  };

  const schedulePlacementRetry = () => {
    let attempts = 0;
    const maxAttempts = 30;

    const tick = () => {
      attempts += 1;
      const done = placeDroppedPage();
      if (done) return;
      if (attempts >= maxAttempts) {
        lastDropPointRef.current = null;
        return;
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      const isNewPageDragStart = !!target.closest("[data-component-new-page='true']");
      armedDragRef.current = isNewPageDragStart;
      movedDuringDragRef.current = false;

      if (!isNewPageDragStart) return;

      setBodyDragSelectionLock(true);

      const state = query.getState();
      const nodes = state.nodes ?? {};
      const viewportId = resolveViewportId(nodes);
      const viewportChildren = (viewportId && Array.isArray(nodes[viewportId]?.data?.nodes))
        ? (nodes[viewportId].data.nodes as string[])
        : [];
      
      let pageIds = viewportChildren.filter((id) => {
        const dname = nodes[id]?.data?.displayName || nodes[id]?.data?.type?.resolvedName;
        return canonicalResolvedName(dname) === "Page";
      });
      
      // If no viewport found yet, capture ALL pages currently in state as baseline
      if (!viewportId || pageIds.length === 0) {
        pageIds = Object.keys(nodes).filter((id) => {
          const dname = nodes[id]?.data?.displayName || nodes[id]?.data?.type?.resolvedName;
          return canonicalResolvedName(dname) === "Page";
        });
      }

      preDropPageIdsRef.current = new Set(pageIds);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!armedDragRef.current) return;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if ((dx * dx + dy * dy) > 36) {
        movedDuringDragRef.current = true;
      }
    };

    const handleMouseUp = () => {
      if (!armedDragRef.current) return;
      if (!movedDuringDragRef.current) {
        armedDragRef.current = false;
        movedDuringDragRef.current = false;
        lastDropPointRef.current = null;
        setBodyDragSelectionLock(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (!armedDragRef.current) return;
      // Allow dropping the native New Page drag anywhere on the canvas
      if (e.cancelable) {
        e.preventDefault();
      }
      const x = e.clientX || lastPointerRef.current.x;
      const y = e.clientY || lastPointerRef.current.y;
      lastPointerRef.current = { x, y };
      if (!movedDuringDragRef.current) {
        const dx = x - dragStartRef.current.x;
        const dy = y - dragStartRef.current.y;
        if ((dx * dx + dy * dy) > 36) {
          movedDuringDragRef.current = true;
        }
      }
    };

    const handleDrop = (e: DragEvent) => {
      if (!armedDragRef.current || !movedDuringDragRef.current) {
        armedDragRef.current = false;
        movedDuringDragRef.current = false;
        return;
      }

      // Ensure drop is accepted for the New Page native drag
      if (e.cancelable) {
        e.preventDefault();
      }

      const pointer = {
        x: e.clientX || lastPointerRef.current.x,
        y: e.clientY || lastPointerRef.current.y,
      };

      lastDropPointRef.current = {
        clientX: pointer.x,
        clientY: pointer.y,
        ts: Date.now(),
      };

      schedulePlacementRetry();

      armedDragRef.current = false;
      movedDuringDragRef.current = false;
      setBodyDragSelectionLock(false);
    };

    const handleWindowBlur = () => {
      armedDragRef.current = false;
      movedDuringDragRef.current = false;
      lastDropPointRef.current = null;
      setBodyDragSelectionLock(false);
    };

    const handleDragEnd = () => {
      armedDragRef.current = false;
      movedDuringDragRef.current = false;
      setBodyDragSelectionLock(false);
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("dragover", handleDragOver, true);
    document.addEventListener("drop", handleDrop, true);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("dragend", handleDragEnd, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      document.removeEventListener("dragover", handleDragOver, true);
      document.removeEventListener("drop", handleDrop, true);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("dragend", handleDragEnd, true);
      setBodyDragSelectionLock(false);
      const el = previewElRef.current;
      if (el?.parentElement) el.parentElement.removeChild(el);
      previewElRef.current = null;
    };
  }, [query]);

  return null;
};
