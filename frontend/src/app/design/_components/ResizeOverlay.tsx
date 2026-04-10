"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import { useCanvasTool } from "./CanvasToolContext";
import { getSnapGuides, Rect } from "./snapUtils";
import { filterLeafSelectionIds } from "../_lib/canvasActions";

type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 24;
const EPSILON = 0.01;
const MOVE_DRAG_START_THRESHOLD = 2;
const CONTAINER_LIMIT_MARGIN_PX = 0;

const HANDLE_CURSORS: Record<Handle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
};

interface ResizeOverlayProps {
  nodeId: string;
  dom: HTMLElement;
  disableResize?: boolean;
  disableRotate?: boolean;
}

function rectChanged(prev: DOMRect | null, next: DOMRect): boolean {
  if (!prev) return true;
  return (
    Math.abs(prev.left - next.left) > 0.5 ||
    Math.abs(prev.top - next.top) > 0.5 ||
    Math.abs(prev.width - next.width) > 0.5 ||
    Math.abs(prev.height - next.height) > 0.5
  );
}

function getNodeContentHost(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null;
  const shell = element.querySelector(":scope > [data-node-content-shell='true']") as HTMLElement | null;
  const host = shell?.querySelector(":scope > [data-node-content-host='true']") as HTMLElement | null;
  return host ?? element;
}

function getEffectiveZoom(el: HTMLElement): number {
  const cssZoom = getCssZoomOnly(el);
  const ancestorScale = getAncestorTransformScale(el);
  const transformScale = (ancestorScale.x + ancestorScale.y) / 2;
  const effective = cssZoom * (transformScale > 0.01 ? transformScale : 1);
  return effective > 0.01 ? effective : 1;
}

function getCssZoomOnly(el: HTMLElement): number {
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
  return cssZoom > 0.01 ? cssZoom : 1;
}

function getAncestorTransformScale(el: HTMLElement): { x: number; y: number } {
  let scaleX = 1;
  let scaleY = 1;
  let current: HTMLElement | null = el.parentElement;

  while (current) {
    const transform = window.getComputedStyle(current).transform;
    if (transform && transform !== "none") {
      const matrixMatch = transform.match(/^matrix\(([^)]+)\)$/i);
      if (matrixMatch) {
        const parts = matrixMatch[1].split(",").map((v) => Number.parseFloat(v.trim()));
        if (parts.length >= 4) {
          const a = parts[0];
          const b = parts[1];
          const c = parts[2];
          const d = parts[3];
          if ([a, b, c, d].every(Number.isFinite)) {
            const sx = Math.hypot(a, b);
            const sy = Math.hypot(c, d);
            if (sx > 0.01) scaleX *= sx;
            if (sy > 0.01) scaleY *= sy;
          }
        }
      } else {
        const matrix3dMatch = transform.match(/^matrix3d\(([^)]+)\)$/i);
        if (matrix3dMatch) {
          const parts = matrix3dMatch[1].split(",").map((v) => Number.parseFloat(v.trim()));
          if (parts.length >= 16) {
            const sx = Math.hypot(parts[0], parts[1], parts[2]);
            const sy = Math.hypot(parts[4], parts[5], parts[6]);
            if (Number.isFinite(sx) && sx > 0.01) scaleX *= sx;
            if (Number.isFinite(sy) && sy > 0.01) scaleY *= sy;
          }
        }
      }
    }
    current = current.parentElement;
  }

  return { x: scaleX, y: scaleY };
}

function getOverlayFrameRect(el: HTMLElement, boundsRect: DOMRect) {
  const centerX = boundsRect.left + boundsRect.width / 2;
  const centerY = boundsRect.top + boundsRect.height / 2;
  const cssZoom = getCssZoomOnly(el);
  const ancestorScale = getAncestorTransformScale(el);
  const rawWidth = Number.isFinite(el.offsetWidth) ? el.offsetWidth : 0;
  const rawHeight = Number.isFinite(el.offsetHeight) ? el.offsetHeight : 0;
  const frameWidth = Math.max(1, rawWidth * cssZoom * ancestorScale.x);
  const frameHeight = Math.max(1, rawHeight * cssZoom * ancestorScale.y);

  return {
    left: centerX - frameWidth / 2,
    top: centerY - frameHeight / 2,
    width: frameWidth,
    height: frameHeight,
    centerX,
    centerY,
  };
}

function getOverlayRect(el: HTMLElement): DOMRect {
  return el.getBoundingClientRect();
}

const SNAP_THRESHOLD = 5;

type SiblingRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

type DragState = {
  type: "move" | "resize" | "rotate";
  handle?: Handle;
  moveMode?: "margin" | "offset" | "page-canvas";
  disableSnap?: boolean;
  disableClamp?: boolean;
  originX: number;
  originY: number;
  moveStarted?: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startRect: DOMRect;
  currentRect: DOMRect;
  guideBounds?: { left: number; top: number; right: number; bottom: number };
  parentCenterX?: number;
  parentCenterY?: number;
  siblingRects?: SiblingRect[];
  startProps: Record<string, unknown>;
  zoom: number;
  startAngle?: number;
  lastPointerAngle?: number;
  accumulatedAngleDeg?: number;
  previewX?: number;
  previewY?: number;
  moveLastX?: number;
  moveLastY?: number;
  previousTransition?: string;
  previousWillChange?: string;
  dirty: boolean;
  constrainRatio?: boolean;
  resizeFromCenter?: boolean;
  lastAppliedResize?: {
    width: number;
    height: number;
    marginTop: number;
    marginLeft: number;
  };
  moveItems?: {
    nodeId: string;
    dom: HTMLElement;
    startProps: Record<string, unknown>;
    moveMode: "margin" | "offset" | "page-canvas";
    previewX: number;
    previewY: number;
    previousTransition?: string;
  }[];
};

function isNearlyEqual(a: number, b: number, epsilon = EPSILON): boolean {
  return Math.abs(a - b) <= epsilon;
}

function parsePxOrAuto(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    if (value.trim() === "" || value === "auto") return 0;
    const n = parseFloat(value.replace("px", ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parseRotation(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getRotationFromTransformMatrix(transform: string): number | null {
  const raw = transform.trim();
  if (!raw || raw === "none") return null;

  const matrixMatch = raw.match(/^matrix\(([^)]+)\)$/i);
  if (matrixMatch) {
    const parts = matrixMatch[1].split(",").map((v) => Number.parseFloat(v.trim()));
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return (Math.atan2(parts[1], parts[0]) * 180) / Math.PI;
    }
    return null;
  }

  const matrix3dMatch = raw.match(/^matrix3d\(([^)]+)\)$/i);
  if (matrix3dMatch) {
    const parts = matrix3dMatch[1].split(",").map((v) => Number.parseFloat(v.trim()));
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return (Math.atan2(parts[1], parts[0]) * 180) / Math.PI;
    }
  }

  return null;
}

function computeTextFontSizeForResize(
  handle: Handle,
  startW: number,
  startH: number,
  newW: number,
  newH: number,
  startFontSize: number
): number {
  if (!Number.isFinite(startFontSize) || startFontSize <= 0) return startFontSize;

  const safeStartW = Math.max(1, startW);
  const safeStartH = Math.max(1, startH);
  const widthScale = newW / safeStartW;
  const heightScale = newH / safeStartH;

  let scale = 1;
  if (handle === "e" || handle === "w") {
    scale = widthScale;
  } else if (handle === "n" || handle === "s") {
    scale = heightScale;
  } else {
    // Corner resize should feel natural for text scaling.
    scale = (widthScale + heightScale) / 2;
  }

  const scaled = startFontSize * scale;
  return Math.min(320, Math.max(8, scaled));
}

type GuideLine = { type: "v" | "h"; value: number };
type GuideState = {
  lines: GuideLine[];
  bounds?: { left: number; top: number; right: number; bottom: number };
} | null;

export const ResizeOverlay = ({ nodeId, dom, disableResize = false, disableRotate = false }: ResizeOverlayProps) => {
  const { actions, query } = useEditor();

  const SHAPE_DISPLAY_NAMES = new Set([
    "Circle",
    "Square",
    "Triangle",
    "Rectangle",
    "Diamond",
    "Heart",
    "Trapezoid",
    "Pentagon",
    "Hexagon",
    "Heptagon",
    "Octagon",
    "Nonagon",
    "Decagon",
    "Parallelogram",
    "Kite",
  ]);
  const MOVE_TARGET_TYPES = new Set(["Page", "Section", "Container", "Row", "Column", "Button", "Frame", "Tab Content", "TabContent"]);
  const FREEFORM_PARENT_DISPLAY_NAMES = new Set(["Page", "Viewport"]);
  const isSectionNode = (() => {
    try {
      return query.getState().nodes[nodeId]?.data?.displayName === "Section";
    } catch {
      return false;
    }
  })();

  const dragRef = useRef<DragState | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const processDragRef = useRef<(() => void) | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"move" | "resize" | "rotate" | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [guides, setGuides] = useState<GuideState>(null);
  const { setSnapGuides } = useCanvasTool();
  const setSnapGuidesRef = useRef(setSnapGuides);
  useEffect(() => { setSnapGuidesRef.current = setSnapGuides; }, [setSnapGuides]);
  const [rotateAngle, setRotateAngle] = useState<number | null>(null);
  const [isExternalDragActive, setIsExternalDragActive] = useState(false);

  useEffect(() => {
    const updateExternalDragState = (event?: DragEvent) => {
      const target = event?.target;
      const elementTarget = target instanceof Element ? target : null;
      const fromPanelDrag =
        !!elementTarget?.closest("[data-drag-source='asset']") ||
        !!elementTarget?.closest("[data-drag-source='component']") ||
        !!elementTarget?.closest("[data-drag-source='imported']") ||
        !!document.body.dataset.assetDragCategory ||
        !!document.body.dataset.assetDragLabel;

      if (fromPanelDrag) {
        setIsExternalDragActive(true);
      }
    };

    const clearExternalDragState = () => {
      setIsExternalDragActive(false);
    };

    document.addEventListener("dragstart", updateExternalDragState, true);
    document.addEventListener("dragend", clearExternalDragState, true);
    document.addEventListener("drop", clearExternalDragState, true);
    window.addEventListener("blur", clearExternalDragState);

    return () => {
      document.removeEventListener("dragstart", updateExternalDragState, true);
      document.removeEventListener("dragend", clearExternalDragState, true);
      document.removeEventListener("drop", clearExternalDragState, true);
      window.removeEventListener("blur", clearExternalDragState);
    };
  }, []);

  const clampMoveDeltaToBounds = useCallback((dx: number, dy: number, d: DragState) => {
    const bounds = d.guideBounds;
    if (!bounds || !Number.isFinite(d.zoom) || d.zoom <= 0) {
      return { dx, dy };
    }

    const minDx = (bounds.left + CONTAINER_LIMIT_MARGIN_PX - d.startRect.left) / d.zoom;
    const maxDx = (bounds.right - CONTAINER_LIMIT_MARGIN_PX - d.startRect.right) / d.zoom;
    const minDy = (bounds.top + CONTAINER_LIMIT_MARGIN_PX - d.startRect.top) / d.zoom;
    const maxDy = (bounds.bottom - CONTAINER_LIMIT_MARGIN_PX - d.startRect.bottom) / d.zoom;

    return {
      dx: Math.min(maxDx, Math.max(minDx, dx)),
      dy: Math.min(maxDy, Math.max(minDy, dy)),
    };
  }, []);

  const clampResizeToBounds = useCallback(
    (
      handle: Handle,
      d: DragState,
      values: { newW: number; newH: number; extraMT: number; extraML: number }
    ) => {
      const bounds = d.guideBounds;
      if (!bounds || !Number.isFinite(d.zoom) || d.zoom <= 0) return values;

      const startW = d.startRect.width / d.zoom;
      const startH = d.startRect.height / d.zoom;

      let { newW, newH, extraMT, extraML } = values;

      const maxWidthFromRight = (bounds.right - CONTAINER_LIMIT_MARGIN_PX - d.startRect.left) / d.zoom;
      const maxHeightFromBottom = (bounds.bottom - CONTAINER_LIMIT_MARGIN_PX - d.startRect.top) / d.zoom;
      const leftRoom = (d.startRect.left - (bounds.left + CONTAINER_LIMIT_MARGIN_PX)) / d.zoom;
      const topRoom = (d.startRect.top - (bounds.top + CONTAINER_LIMIT_MARGIN_PX)) / d.zoom;

      if (handle.includes("e")) {
        newW = Math.min(newW, Math.max(20, maxWidthFromRight));
      }
      if (handle.includes("s")) {
        newH = Math.min(newH, Math.max(20, maxHeightFromBottom));
      }
      if (handle.includes("w")) {
        const maxWidthFromLeft = startW + Math.max(0, leftRoom);
        newW = Math.min(newW, Math.max(20, maxWidthFromLeft));
        extraML = startW - newW;
      }
      if (handle.includes("n")) {
        const maxHeightFromTop = startH + Math.max(0, topRoom);
        newH = Math.min(newH, Math.max(20, maxHeightFromTop));
        extraMT = startH - newH;
      }

      return { newW, newH, extraMT, extraML };
    },
    []
  );

  const selectedToIds = useCallback((selected: unknown): string[] => {
    if (Array.isArray(selected)) return selected.filter((id): id is string => typeof id === "string");
    if (selected instanceof Set) return Array.from(selected).filter((id): id is string => typeof id === "string");
    if (selected && typeof selected === "object") {
      return Object.keys(selected as Record<string, unknown>);
    }
    return [];
  }, []);

  const getMoveModeForNode = useCallback(
    (id: string, state: ReturnType<typeof query.getState>): "margin" | "offset" | "page-canvas" => {
      const displayName = state.nodes[id]?.data?.displayName as string | undefined;
      const parentId = state.nodes[id]?.data?.parent as string | undefined;
      const parentDisplayName = parentId
        ? (state.nodes[parentId]?.data?.displayName as string | undefined)
        : undefined;
      const props = (state.nodes[id]?.data?.props ?? {}) as Record<string, unknown>;
      const position = String(props.position ?? "static").toLowerCase();
      const isAbsoluteLike = position === "absolute" || position === "fixed";

      const flowLayoutParents = new Set(["Container", "Section", "Row", "Column", "Frame", "TabContent", "Tab Content"]);
      const offsetMoveTypes = new Set(["Image", "Text", "Icon", "Button", "Circle", "Square", "Triangle"]);
      const parentProps = parentId ? (state.nodes[parentId]?.data?.props ?? {}) as Record<string, unknown> : {};
      const parentDisplay = String(parentProps.display ?? "").toLowerCase();
      const parentIsFlexOrGrid = parentDisplay === "flex" || parentDisplay === "grid";
      const parentIsFreeform =
        parentProps.isFreeform === true ||
        (!parentIsFlexOrGrid && !!parentDisplayName && FREEFORM_PARENT_DISPLAY_NAMES.has(parentDisplayName));

      if (displayName === "Text" && !!parentDisplayName && SHAPE_DISPLAY_NAMES.has(parentDisplayName)) {
        return "margin";
      }

      if (displayName === "Page") return "page-canvas";
      if (parentIsFreeform) return "offset";
      if (isAbsoluteLike) return "offset";
      if (parentDisplayName && (flowLayoutParents.has(parentDisplayName) || SHAPE_DISPLAY_NAMES.has(parentDisplayName))) return "margin";
      if (displayName && offsetMoveTypes.has(displayName)) return "offset";
      return "margin";
    },
    [query, SHAPE_DISPLAY_NAMES]
  );

  const applyOverlayRect = useCallback((nextRect: DOMRect) => {
    const el = overlayRef.current;
    if (!el) return;
    const frameRect = getOverlayFrameRect(dom, nextRect);
    el.style.left = `${frameRect.left}px`;
    el.style.top = `${frameRect.top}px`;
    el.style.width = `${frameRect.width}px`;
    el.style.height = `${frameRect.height}px`;
  }, [dom]);

  // Track DOM rect
  useEffect(() => {
    if (!dom) return;
    const update = () => {
      if (dragRef.current?.type === "move") return;
      const next = getOverlayRect(dom);
      setRect((prev) => (rectChanged(prev, next) ? next : prev));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(dom);
    const scrollUpdate = () => requestAnimationFrame(update);
    window.addEventListener("scroll", scrollUpdate, true);
    window.addEventListener("resize", scrollUpdate);
    const interval = setInterval(update, 200);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scrollUpdate, true);
      window.removeEventListener("resize", scrollUpdate);
      clearInterval(interval);
      // Clear guides on unmount to prevent stale markers after deletion/deselection
      setSnapGuidesRef.current([]);
    };
  }, [dom]);

  const getProps = useCallback(() => {
    try {
      const state = query.getState();
      return { ...(state.nodes[nodeId]?.data?.props ?? {}) } as Record<string, unknown>;
    } catch {
      return {} as Record<string, unknown>;
    }
  }, [query, nodeId]);

  const tryMoveIntoDropTarget = useCallback(
    (clientX: number, clientY: number): boolean => {
      try {
        const state = query.getState();
        const node = state.nodes[nodeId];
        if (!node) return false;

        const sourceParentId = node.data.parent;
        if (!sourceParentId) return false;

        const isDescendantOfDraggedNode = (candidateId: string): boolean => {
          let current: string | null = candidateId;
          while (current) {
            if (current === nodeId) return true;
            const parentId: string | null = (state.nodes[current]?.data?.parent as string | undefined) ?? null;
            current = parentId;
          }
          return false;
        };

        const seen = new Set<string>();
        const candidateIds: string[] = [];
        const elements = document.elementsFromPoint(clientX, clientY) as HTMLElement[];

        for (const element of elements) {
          const withNode = element.closest("[data-node-id]") as HTMLElement | null;
          if (!withNode) continue;
          const id = withNode.getAttribute("data-node-id");
          if (!id || seen.has(id)) continue;
          seen.add(id);
          candidateIds.push(id);
        }

        const dropParentId = candidateIds.find((candidateId) => {
          if (candidateId === nodeId) return false;
          if (isDescendantOfDraggedNode(candidateId)) return false;

          const candidate = state.nodes[candidateId];
          const displayName = candidate?.data?.displayName as string | undefined;
          const isCanvas = candidate?.data?.isCanvas ?? MOVE_TARGET_TYPES.has(displayName ?? "");
          if (!isCanvas) return false;
          return displayName ? (MOVE_TARGET_TYPES.has(displayName) || SHAPE_DISPLAY_NAMES.has(displayName)) : false;
        });

        if (!dropParentId || dropParentId === sourceParentId) return false;

        const dropParent = state.nodes[dropParentId];
        const dropParentName = dropParent?.data?.displayName as string | undefined;
        const flowParents = new Set(["Section", "Container", "Row", "Column", "Frame", "Tab Content"]);
        const dropParentProps = (dropParent?.data?.props ?? {}) as Record<string, unknown>;
        const dropParentDisplay = String(dropParentProps.display ?? "").toLowerCase();
        const dropParentIsFlexOrGrid = dropParentDisplay === "flex" || dropParentDisplay === "grid";
        const dropParentIsFreeform = dropParentProps.isFreeform === true;
        const isShapeParent = !!dropParentName && SHAPE_DISPLAY_NAMES.has(dropParentName);
        const isFlowParent = (!!dropParentName && flowParents.has(dropParentName) && dropParentIsFlexOrGrid && !dropParentIsFreeform) || isShapeParent;
        const index = Array.isArray(dropParent?.data?.nodes)
          ? (isFlowParent ? 0 : dropParent.data.nodes.length)
          : 0;

        actions.move(nodeId, dropParentId, index);
        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          props.marginTop = 0;
          props.marginLeft = 0;
          if (isFlowParent) {
            props.position = "relative";
            props.top = "auto";
            props.left = "auto";
            props.right = "auto";
            props.bottom = "auto";
          } else if (dropParentIsFreeform) {
            props.position = "absolute";
            props.top = "0px";
            props.left = "0px";
            props.right = "auto";
            props.bottom = "auto";
          } else {
            props.top = "0px";
            props.left = "0px";
          }
        });

        return true;
      } catch {
        return false;
      }
    },
    [actions, query, nodeId, MOVE_TARGET_TYPES]
  );

  const startDrag = useCallback(
    (e: React.MouseEvent, type: "move" | "resize" | "rotate", handle?: Handle) => {
      e.stopPropagation();
      e.preventDefault();
      const startRect = getOverlayRect(dom);
      const startProps = getProps();
      const zoom = getEffectiveZoom(dom);
      const cx = startRect.left + startRect.width / 2;
      const cy = startRect.top + startRect.height / 2;
      const pointerAngle = Math.atan2(e.clientY - cy, e.clientX - cx);

      // Keep layout containers in normal flow-resize mode.
      // Auto-injecting designWidth/designHeight here can lock them into scale mode,
      // which causes content distortion/overlap when resizing out and back.

      dragRef.current = {
        type,
        handle,
        moveMode: "margin",
        originX: e.clientX,
        originY: e.clientY,
        moveStarted: type !== "move",
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        startRect,
        currentRect: startRect,
        guideBounds: undefined,
        parentCenterX: undefined,
        parentCenterY: undefined,
        siblingRects: undefined,
        startProps,
        zoom,
        startAngle: type === "rotate" ? pointerAngle : undefined,
        lastPointerAngle: type === "rotate" ? pointerAngle : undefined,
        accumulatedAngleDeg: type === "rotate" ? 0 : undefined,
        previewX: type === "move" ? 0 : undefined,
        previewY: type === "move" ? 0 : undefined,
        moveLastX: type === "move" ? e.clientX : undefined,
        moveLastY: type === "move" ? e.clientY : undefined,
        previousTransition: type === "move" ? dom.style.transition : undefined,
        previousWillChange: type === "resize" ? dom.style.willChange : undefined,
        dirty: false,
        constrainRatio: e.shiftKey,
        resizeFromCenter: e.altKey,
        lastAppliedResize: undefined,
        moveItems: undefined,
      };

      if (type === "move") {
        applyOverlayRect(startRect);
      }

      if (type === "move") {
        dom.style.transition = "none";
        dom.style.setProperty("translate", "0px 0px");
        dom.style.willChange = "translate";

        try {
          const state = query.getState();
          let hasPageCanvasMove = false;
          if (dragRef.current) {
            dragRef.current.moveMode = getMoveModeForNode(nodeId, state);

            const selectedIds = filterLeafSelectionIds(
              selectedToIds(state.events.selected).filter((id) => id !== "ROOT" && !!state.nodes[id]),
              state.nodes
            );
            const idsToMove = selectedIds.includes(nodeId) ? selectedIds : [nodeId];
            const moveItems = idsToMove
              .map((id) => {
                try {
                  const itemDom = query.node(id).get()?.dom ?? null;
                  if (!itemDom) return null;
                  return {
                    nodeId: id,
                    dom: itemDom,
                    startProps: { ...(state.nodes[id]?.data?.props ?? {}) } as Record<string, unknown>,
                    moveMode: getMoveModeForNode(id, state),
                    previewX: 0,
                    previewY: 0,
                    previousTransition: itemDom.style.transition,
                  };
                } catch {
                  return null;
                }
              })
              .filter((item): item is NonNullable<typeof item> => !!item);

            dragRef.current.moveItems = moveItems.length > 0 ? moveItems : undefined;

            hasPageCanvasMove =
              dragRef.current.moveMode === "page-canvas" ||
              (dragRef.current.moveItems ?? []).some((item) => item.moveMode === "page-canvas");

            for (const item of dragRef.current.moveItems ?? []) {
              item.dom.style.transition = "none";
              item.dom.style.setProperty("translate", "0px 0px");
              item.dom.style.willChange = "translate";
            }

            if (hasPageCanvasMove) {
              dragRef.current.guideBounds = undefined;
              dragRef.current.parentCenterX = undefined;
              dragRef.current.parentCenterY = undefined;
              dragRef.current.siblingRects = undefined;
            }
          }

          if (!hasPageCanvasMove) {
            const parentId = state.nodes[nodeId]?.data?.parent;
            const parentDom = parentId ? getNodeContentHost(query.node(parentId).get()?.dom ?? null) : null;
            const siblingIds = (state.nodes[parentId ?? ""]?.data?.nodes as string[]) ?? [];
            const siblingRects: SiblingRect[] = [];
            for (const sid of siblingIds) {
              if (sid === nodeId) continue;
              try {
                const el = query.node(sid).get()?.dom;
                if (el) {
                  const r = el.getBoundingClientRect();
                  siblingRects.push({
                    left: r.left,
                    right: r.right,
                    top: r.top,
                    bottom: r.bottom,
                    centerX: r.left + r.width / 2,
                    centerY: r.top + r.height / 2,
                  });
                }
              } catch { /* skip */ }
            }
            if (dragRef.current) {
              dragRef.current.siblingRects = siblingRects;
              if (parentDom) {
                const parentRect = parentDom.getBoundingClientRect();
                dragRef.current.guideBounds = {
                  left: parentRect.left,
                  right: parentRect.right,
                  top: parentRect.top,
                  bottom: parentRect.bottom,
                };
                dragRef.current.parentCenterX = parentRect.left + parentRect.width / 2;
                dragRef.current.parentCenterY = parentRect.top + parentRect.height / 2;
              }
            }
          }
        } catch {
          // ignore guide cache failures
        }
      } else if (type === "resize") {
        try {
          const state = query.getState();
          const nodeDisplayName = state.nodes[nodeId]?.data?.displayName as string | undefined;
          const childCount = (((state.nodes[nodeId] as any)?.data?.nodes as string[] | undefined) ?? []).length;
          const bypassBoundsForResize = nodeDisplayName === "Section" || (nodeDisplayName === "Container" && childCount > 0);
          const parentId = state.nodes[nodeId]?.data?.parent;
          const parentDom = parentId ? getNodeContentHost(query.node(parentId).get()?.dom ?? null) : null;
          if (dragRef.current && parentDom && !bypassBoundsForResize) {
            const parentRect = parentDom.getBoundingClientRect();
            dragRef.current.guideBounds = {
              left: parentRect.left,
              right: parentRect.right,
              top: parentRect.top,
              bottom: parentRect.bottom,
            };
          } else if (dragRef.current) {
            dragRef.current.guideBounds = undefined;
          }

          dom.style.willChange = "width, height, margin-top, margin-left";
        } catch {
          // ignore
        }
      }

      setIsDragging(true);
      setDragType(type);
      setGuides(null);
      if (type === "rotate") {
        const startRot = parseRotation(startProps.rotation);
        setRotateAngle(startRot);
      } else {
        setRotateAngle(null);
      }
      document.body.style.userSelect = "none";
      document.body.style.cursor =
        type === "move" ? "default" :
          type === "rotate" ? "grabbing" :
            handle ? HANDLE_CURSORS[handle] : "default";
    },
    [dom, getProps, query, actions, nodeId, getMoveModeForNode, selectedToIds]
  );

  const setGuidesIfChanged = useCallback((next: GuideState) => {
    setGuides((prev) => {
      if (!prev && !next) return prev;
      if (!prev || !next) return next;
      const prevBounds = prev.bounds;
      const nextBounds = next.bounds;
      const boundsSame = !!prevBounds && !!nextBounds &&
        Math.abs(prevBounds.left - nextBounds.left) < 0.5 &&
        Math.abs(prevBounds.right - nextBounds.right) < 0.5 &&
        Math.abs(prevBounds.top - nextBounds.top) < 0.5 &&
        Math.abs(prevBounds.bottom - nextBounds.bottom) < 0.5;
      if (prev.lines?.length !== next.lines?.length || !boundsSame) return next;
      const same = next.lines!.every((l, i) => {
        const p = prev!.lines![i];
        return p && p.type === l.type && Math.abs(p.value - l.value) < 0.5;
      });
      return same ? prev : next;
    });
  }, []);

  // rAF loop for smooth prop updates
  useEffect(() => {
    if (!isDragging) return;

    const tick = () => {
      const d = dragRef.current;
      if (!d || !d.dirty) {
        rafRef.current = 0;
        return;
      }

      d.dirty = false;
      const zoom = d.zoom;
      const dx = (d.lastX - d.startX) / zoom;
      const dy = (d.lastY - d.startY) / zoom;
      const p = d.startProps;

      if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
        rafRef.current = 0;
        return;
      }

      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
        rafRef.current = 0;
        return;
      }

      if (d.type === "move") {
        if (!d.moveStarted) {
          const totalDxPx = d.lastX - d.originX;
          const totalDyPx = d.lastY - d.originY;
          const distance = Math.hypot(totalDxPx, totalDyPx);
          if (distance < MOVE_DRAG_START_THRESHOLD) {
            rafRef.current = 0;
            return;
          }
          d.moveStarted = true;
          d.startX = d.lastX;
          d.startY = d.lastY;
          d.moveLastX = d.lastX;
          d.moveLastY = d.lastY;
          rafRef.current = 0;
          return;
        }

        const prevMoveX = d.moveLastX ?? d.startX;
        const prevMoveY = d.moveLastY ?? d.startY;
        const stepPxX = d.lastX - prevMoveX;
        const stepPxY = d.lastY - prevMoveY;
        const stepDx = stepPxX / zoom;
        const stepDy = stepPxY / zoom;

        d.moveLastX = d.lastX;
        d.moveLastY = d.lastY;

        let nextLeft = d.moveMode === "offset"
          ? parsePxOrAuto(p.left) + stepDx
          : parsePxOrAuto(p.marginLeft) + stepDx;
        let nextTop = d.moveMode === "offset"
          ? parsePxOrAuto(p.top) + stepDy
          : parsePxOrAuto(p.marginTop) + stepDy;

        d.previewX = (d.previewX ?? 0) + stepDx;
        d.previewY = (d.previewY ?? 0) + stepDy;
        dom.style.setProperty("translate", `${d.previewX}px ${d.previewY}px`);
        for (const item of d.moveItems ?? []) {
          item.previewX += stepDx;
          item.previewY += stepDy;
          item.dom.style.setProperty("translate", `${item.previewX}px ${item.previewY}px`);
        }

        const movedRect = getOverlayRect(dom);
        d.currentRect = movedRect;
        applyOverlayRect(movedRect);

        if (d.disableSnap) {
          setSnapGuidesRef.current([]);
          setGuidesIfChanged(null);
        } else {
          const r = d.currentRect;
          const centerX = r.left + r.width / 2;
          const centerY = r.top + r.height / 2;
          const th = SNAP_THRESHOLD;
          let snapV: number | undefined;
          let snapH: number | undefined;
          if (d.parentCenterX != null && Math.abs(centerX - d.parentCenterX) <= th) snapV = d.parentCenterX;
          if (d.parentCenterY != null && Math.abs(centerY - d.parentCenterY) <= th) snapH = d.parentCenterY;
          for (const s of d.siblingRects ?? []) {
            if (Math.abs(centerX - s.left) <= th || Math.abs(centerX - s.centerX) <= th || Math.abs(centerX - s.right) <= th) {
              const v = Math.abs(centerX - s.left) <= Math.abs(centerX - s.centerX) && Math.abs(centerX - s.left) <= Math.abs(centerX - s.right) ? s.left : Math.abs(centerX - s.centerX) <= Math.abs(centerX - s.right) ? s.centerX : s.right;
              if (snapV === undefined || Math.abs(centerX - v) < Math.abs(centerX - (snapV ?? 0))) snapV = v;
            }
            if (Math.abs(centerY - s.top) <= th || Math.abs(centerY - s.centerY) <= th || Math.abs(centerY - s.bottom) <= th) {
              const h = Math.abs(centerY - s.top) <= Math.abs(centerY - s.centerY) && Math.abs(centerY - s.top) <= Math.abs(centerY - s.bottom) ? s.top : Math.abs(centerY - s.centerY) <= Math.abs(centerY - s.bottom) ? s.centerY : s.bottom;
              if (snapH === undefined || Math.abs(centerY - h) < Math.abs(centerY - (snapH ?? 0))) snapH = h;
            }
          }
          const zoom = d.zoom;
          let snapOffsetX = 0;
          let snapOffsetY = 0;
          if (snapV != null) {
            snapOffsetX = snapV - centerX;
          }
          if (snapH != null) {
            snapOffsetY = snapH - centerY;
          }

          // Use the new snap markers system
          const movingRect: Rect = {
            left: r.left,
            top: r.top,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
            centerX: r.left + r.width / 2,
            centerY: r.top + r.height / 2,
          };

          const otherRects: Rect[] = (d.siblingRects ?? []).map(s => ({
            left: s.left,
            top: s.top,
            right: s.right,
            bottom: s.bottom,
            width: s.right - s.left,
            height: s.bottom - s.top,
            centerX: s.centerX,
            centerY: s.centerY,
          }));
          if (d.guideBounds) {
            otherRects.push({
              left: d.guideBounds.left,
              top: d.guideBounds.top,
              right: d.guideBounds.right,
              bottom: d.guideBounds.bottom,
              width: d.guideBounds.right - d.guideBounds.left,
              height: d.guideBounds.bottom - d.guideBounds.top,
              centerX: (d.guideBounds.left + d.guideBounds.right) / 2,
              centerY: (d.guideBounds.top + d.guideBounds.bottom) / 2,
            });
          }

          const { snappedX, snappedY, guides: snapGuides } = getSnapGuides(movingRect, otherRects, SNAP_THRESHOLD);
          setSnapGuidesRef.current(snapGuides);

          if (snappedX !== null) {
             snapOffsetX = snappedX - movingRect.left;
          }
          if (snappedY !== null) {
             snapOffsetY = snappedY - movingRect.top;
          }

          if (snapOffsetX !== 0 || snapOffsetY !== 0) {
            d.previewX = (d.previewX ?? 0) + snapOffsetX / zoom;
            d.previewY = (d.previewY ?? 0) + snapOffsetY / zoom;
            dom.style.setProperty("translate", `${d.previewX}px ${d.previewY}px`);
            for (const item of d.moveItems ?? []) {
              item.previewX += snapOffsetX / zoom;
              item.previewY += snapOffsetY / zoom;
              item.dom.style.setProperty("translate", `${item.previewX}px ${item.previewY}px`);
            }
            const snappedRect = getOverlayRect(dom);
            d.currentRect = snappedRect;
            applyOverlayRect(snappedRect);
          }

          if (d.guideBounds) {
            const r = d.currentRect;
            const left = r.left;
            const right = r.right;
            const top = r.top;
            const bottom = r.bottom;
            const centerX = r.left + r.width / 2;
            const centerY = r.top + r.height / 2;
            const th = SNAP_THRESHOLD;
            const lines: GuideLine[] = [];

            const snapX = (v: number) => Math.abs(v - centerX) <= th;
            const snapY = (v: number) => Math.abs(v - centerY) <= th;
            const snapLeft = (v: number) => Math.abs(v - left) <= th;
            const snapRight = (v: number) => Math.abs(v - right) <= th;
            const snapTop = (v: number) => Math.abs(v - top) <= th;
            const snapBottom = (v: number) => Math.abs(v - bottom) <= th;

            let snapV: number | undefined;
            let snapH: number | undefined;
            const allRects = [...(d.siblingRects ?? [])];
            if (d.parentCenterX != null && Math.abs(centerX - d.parentCenterX) <= th) {
              snapV = d.parentCenterX;
              if (!lines.some((l) => l.type === "v" && Math.abs(l.value - snapV!) < 0.5)) lines.push({ type: "v", value: d.parentCenterX });
            }
            if (d.parentCenterY != null && Math.abs(centerY - d.parentCenterY) <= th) {
              snapH = d.parentCenterY;
              if (!lines.some((l) => l.type === "h" && Math.abs(l.value - snapH!) < 0.5)) lines.push({ type: "h", value: d.parentCenterY });
            }
            for (const s of allRects) {
              if (snapX(s.left) || snapX(s.centerX) || snapX(s.right)) {
                const v = Math.abs(centerX - s.left) <= Math.abs(centerX - s.centerX) && Math.abs(centerX - s.left) <= Math.abs(centerX - s.right) ? s.left : Math.abs(centerX - s.centerX) <= Math.abs(centerX - s.right) ? s.centerX : s.right;
                if (snapV === undefined || Math.abs(v - centerX) < Math.abs((snapV ?? 0) - centerX)) snapV = v;
              }
              if (snapY(s.top) || snapY(s.centerY) || snapY(s.bottom)) {
                const h = Math.abs(centerY - s.top) <= Math.abs(centerY - s.centerY) && Math.abs(centerY - s.top) <= Math.abs(centerY - s.bottom) ? s.top : Math.abs(centerY - s.centerY) <= Math.abs(centerY - s.bottom) ? s.centerY : s.bottom;
                if (snapH === undefined || Math.abs(h - centerY) < Math.abs((snapH ?? 0) - centerY)) snapH = h;
              }
              if (snapLeft(s.left) && !lines.some((l) => l.type === "v" && Math.abs(l.value - s.left) < 0.5)) lines.push({ type: "v", value: s.left });
              if (snapLeft(s.centerX) && !lines.some((l) => l.type === "v" && Math.abs(l.value - s.centerX) < 0.5)) lines.push({ type: "v", value: s.centerX });
              if (snapLeft(s.right) && !lines.some((l) => l.type === "v" && Math.abs(l.value - s.right) < 0.5)) lines.push({ type: "v", value: s.right });
              if (snapRight(s.left)) lines.push({ type: "v", value: s.left });
              if (snapRight(s.centerX)) lines.push({ type: "v", value: s.centerX });
              if (snapRight(s.right)) lines.push({ type: "v", value: s.right });
              if (snapTop(s.top) && !lines.some((l) => l.type === "h" && Math.abs(l.value - s.top) < 0.5)) lines.push({ type: "h", value: s.top });
              if (snapTop(s.centerY) && !lines.some((l) => l.type === "h" && Math.abs(l.value - s.centerY) < 0.5)) lines.push({ type: "h", value: s.centerY });
              if (snapTop(s.bottom) && !lines.some((l) => l.type === "h" && Math.abs(l.value - s.bottom) < 0.5)) lines.push({ type: "h", value: s.bottom });
              if (snapBottom(s.top)) lines.push({ type: "h", value: s.top });
              if (snapBottom(s.centerY)) lines.push({ type: "h", value: s.centerY });
              if (snapBottom(s.bottom)) lines.push({ type: "h", value: s.bottom });
            }
            const dedupeLines = lines.filter((l, i) => lines.findIndex((x) => x.type === l.type && Math.abs(x.value - l.value) < 0.5) === i);
            if (snapV != null && !dedupeLines.some((l) => l.type === "v" && Math.abs(l.value - snapV!) < 0.5)) dedupeLines.push({ type: "v", value: snapV });
            if (snapH != null && !dedupeLines.some((l) => l.type === "h" && Math.abs(l.value - snapH!) < 0.5)) dedupeLines.push({ type: "h", value: snapH });

            setGuidesIfChanged({
              lines: dedupeLines,
              bounds: d.guideBounds,
            });
          } else {
            setGuidesIfChanged(null);
          }
        }

        d.startX = d.lastX;
        d.startY = d.lastY;
      } else if (d.type === "resize" && d.handle) {
        const h = d.handle;
        const startW = d.startRect.width / zoom;
        const startH = d.startRect.height / zoom;
        const ratio = startW / Math.max(startH, 1);
        let newW = startW, newH = startH, extraMT = 0, extraML = 0;

        if (h.includes("e")) newW = Math.max(20, startW + dx);
        if (h.includes("w")) { newW = Math.max(20, startW - dx); extraML = dx; }
        if (h.includes("s")) newH = Math.max(20, startH + dy);
        if (h.includes("n")) { newH = Math.max(20, startH - dy); extraMT = dy; }

        if (d.constrainRatio && (h.includes("n") || h.includes("s") || h.includes("e") || h.includes("w"))) {
          const isCorner = ["ne", "nw", "se", "sw"].includes(h);
          if (isCorner) {
            const dw = newW - startW;
            const dh = newH - startH;
            if (Math.abs(dw) >= Math.abs(dh)) {
              newH = newW / ratio;
              if (h.includes("n")) extraMT = newH - startH;
              if (h.includes("w")) extraML = (newW - startW);
            } else {
              newW = newH * ratio;
              if (h.includes("w")) extraML = newW - startW;
              if (h.includes("n")) extraMT = newH - startH;
            }
          }
        }
        if (d.resizeFromCenter) {
          const dw = newW - startW;
          const dh = newH - startH;
          if (h.includes("e") || h.includes("w")) extraML = -dw / 2;
          if (h.includes("n") || h.includes("s")) extraMT = -dh / 2;
        }

        ({ newW, newH, extraMT, extraML } = clampResizeToBounds(h, d, { newW, newH, extraMT, extraML }));
        if (isSectionNode) {
          newW = startW;
          extraML = 0;
        }

        if (
          isNearlyEqual(newW, startW) &&
          isNearlyEqual(newH, startH) &&
          isNearlyEqual(extraMT, 0) &&
          isNearlyEqual(extraML, 0)
        ) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const isOffset = (d.moveMode ?? "margin") === "offset";
        const bMT = isOffset ? parsePxOrAuto(d.startProps.top) : (typeof d.startProps.marginTop === "number" ? (d.startProps.marginTop as number) : 0);
        const bML = isOffset ? parsePxOrAuto(d.startProps.left) : (typeof d.startProps.marginLeft === "number" ? (d.startProps.marginLeft as number) : 0);
        const nextMarginTopRaw = extraMT !== 0 ? bMT + extraMT : bMT;
        const nextMarginLeftRaw = extraML !== 0 ? bML + extraML : bML;
        const isMarginFlowResize = (d.moveMode ?? "margin") === "margin";
        const allowNegativeTopDuringResize = h.includes("n");
        const allowNegativeLeftDuringResize = h.includes("w");
        const nextMarginTop = isMarginFlowResize && !allowNegativeTopDuringResize
          ? Math.max(0, nextMarginTopRaw)
          : nextMarginTopRaw;
        const nextMarginLeft = isMarginFlowResize && !allowNegativeLeftDuringResize
          ? Math.max(0, nextMarginLeftRaw)
          : nextMarginLeftRaw;

        const lastResize = d.lastAppliedResize;
        const unchangedFromLast =
          !!lastResize &&
          isNearlyEqual(lastResize.width, newW) &&
          isNearlyEqual(lastResize.height, newH) &&
          isNearlyEqual(lastResize.marginTop, nextMarginTop) &&
          isNearlyEqual(lastResize.marginLeft, nextMarginLeft);

        if (unchangedFromLast) {
          rafRef.current = 0;
          return;
        }

        d.lastAppliedResize = {
          width: newW,
          height: newH,
          marginTop: nextMarginTop,
          marginLeft: nextMarginLeft,
        };

        const currentNode = query.getState().nodes[nodeId];
        const isTextNode = currentNode?.data?.displayName === "Text";
        const isAccordionNode = currentNode?.data?.displayName === "Accordion";
        const startFontSize = parsePxOrAuto(d.startProps.fontSize);
        const nextFontSize = isTextNode
          ? computeTextFontSizeForResize(h, startW, startH, newW, newH, startFontSize)
          : null;

        // Smooth preview: apply direct DOM style during drag, commit once on mouseup.
        if (!isSectionNode) {
          dom.style.width = `${newW}px`;
        }
        if (isTextNode || isAccordionNode) {
          dom.style.height = "auto";
          if (isAccordionNode) {
            dom.style.minHeight = `${Math.round(newH)}px`;
          } else {
            dom.style.removeProperty("min-height");
          }
          dom.style.removeProperty("max-height");
        } else {
          dom.style.height = `${newH}px`;
        }
        if (extraMT !== 0) {
          if ((d.moveMode ?? "margin") === "offset") {
            dom.style.top = `${nextMarginTop}px`;
          } else {
            dom.style.marginTop = `${nextMarginTop}px`;
          }
        }
        if (extraML !== 0) {
          if ((d.moveMode ?? "margin") === "offset") {
            dom.style.left = `${nextMarginLeft}px`;
          } else {
            dom.style.marginLeft = `${nextMarginLeft}px`;
          }
        }
        if (isTextNode && nextFontSize != null) {
          dom.style.fontSize = `${Math.round(nextFontSize * 10) / 10}px`;
        }
      } else if (d.type === "rotate" && d.startAngle != null) {
        const cx = d.startRect.left + d.startRect.width / 2;
        const cy = d.startRect.top + d.startRect.height / 2;
        const currentAngle = Math.atan2(d.lastY - cy, d.lastX - cx);
        const prevAngle = d.lastPointerAngle ?? d.startAngle;
        let deltaRad = currentAngle - prevAngle;
        if (deltaRad > Math.PI) deltaRad -= Math.PI * 2;
        if (deltaRad < -Math.PI) deltaRad += Math.PI * 2;
        const deltaDeg = (deltaRad * 180) / Math.PI;

        // Skip update if rotation change is too small
        if (Math.abs(deltaDeg) < 0.1) {
          rafRef.current = 0;
          return;
        }

        const startRot = parseRotation(d.startProps.rotation);
        const accumulated = (d.accumulatedAngleDeg ?? 0) + deltaDeg;
        d.accumulatedAngleDeg = accumulated;
        d.lastPointerAngle = currentAngle;
        const nextRot = startRot + accumulated;

        // Only update local state for visual feedback during drag
        // Final prop update happens in handleMouseUp
        setRotateAngle((prev) => (prev == null || Math.abs(prev - nextRot) > 0.1 ? nextRot : prev));
      }

      if (d.dirty) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    };

    processDragRef.current = tick;
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      processDragRef.current = null;
    };
  }, [isDragging, actions, nodeId, setGuidesIfChanged, clampResizeToBounds, isSectionNode]);

  // Global move/up listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      d.constrainRatio = e.shiftKey;
      d.resizeFromCenter = e.altKey;
      if (e.clientX === d.lastX && e.clientY === d.lastY) return;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.dirty = true;
      if (!rafRef.current && processDragRef.current) {
        rafRef.current = requestAnimationFrame(processDragRef.current);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const d = dragRef.current;
      if (d) {
        const unprocessedMoveDx = d.type === "move"
          ? (d.lastX - (d.moveLastX ?? d.startX)) / d.zoom
          : 0;
        const unprocessedMoveDy = d.type === "move"
          ? (d.lastY - (d.moveLastY ?? d.startY)) / d.zoom
          : 0;
        const totalDx = (d.previewX ?? 0) + unprocessedMoveDx;
        const totalDy = (d.previewY ?? 0) + unprocessedMoveDy;
        const clampedMove = d.type === "move"
          ? (d.disableClamp ? { dx: totalDx, dy: totalDy } : clampMoveDeltaToBounds(totalDx, totalDy, d))
          : { dx: totalDx, dy: totalDy };

        const clearPreviewStyles = () => {
          for (const item of d.moveItems ?? []) {
            item.dom.style.removeProperty("translate");
            item.dom.style.willChange = "";
          }
          if (!d.moveItems || d.moveItems.length === 0) {
            dom.style.removeProperty("translate");
            dom.style.willChange = "";
          }
        };

        const restoreTransitionLater = () => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              for (const item of d.moveItems ?? []) {
                if (item.previousTransition !== undefined) {
                  item.dom.style.transition = item.previousTransition;
                } else {
                  item.dom.style.transition = "";
                }
              }
              if (!d.moveItems || d.moveItems.length === 0) {
                if (d.previousTransition !== undefined) {
                  dom.style.transition = d.previousTransition;
                } else {
                  dom.style.transition = "";
                }
              }
            });
          });
        };

        const resetPreviewStyles = () => {
          clearPreviewStyles();
          restoreTransitionLater();
        };

        if (d.type === "move") {
          if (!d.moveStarted) {
            resetPreviewStyles();
            dragRef.current = null;
            setIsDragging(false);
            setDragType(null);
            setRotateAngle(null);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            return;
          }

          const moved = (d.moveItems?.length ?? 0) <= 1 ? tryMoveIntoDropTarget(e.clientX, e.clientY) : false;
          if (moved) {
            resetPreviewStyles();
            dragRef.current = null;
            setIsDragging(false);
            setDragType(null);
            setRotateAngle(null);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            return;
          }
        }

        // Round final values
        const zoom = d.zoom;
        const dx = (d.lastX - d.startX) / zoom;
        const dy = (d.lastY - d.startY) / zoom;
        const p = d.startProps;

        if (d.type === "move") {
          const moveItems = d.moveItems && d.moveItems.length > 0
            ? d.moveItems
            : [{ nodeId, dom, startProps: d.startProps, moveMode: d.moveMode ?? "margin", previewX: 0, previewY: 0, previousTransition: d.previousTransition }];

          for (const item of moveItems) {
            const itemProps = item.startProps;

            if (item.moveMode === "page-canvas") {
              const baseCanvasX = typeof itemProps.canvasX === "number" ? itemProps.canvasX : parsePxOrAuto(itemProps.canvasX);
              const baseCanvasY = typeof itemProps.canvasY === "number" ? itemProps.canvasY : parsePxOrAuto(itemProps.canvasY);
              const finalCanvasX = Math.round(baseCanvasX + clampedMove.dx);
              const finalCanvasY = Math.round(baseCanvasY + clampedMove.dy);

              actions.setProp(item.nodeId, (props: Record<string, unknown>) => {
                props.canvasX = finalCanvasX;
                props.canvasY = finalCanvasY;
              });
            } else if (item.moveMode === "offset") {
              const baseTop = parsePxOrAuto(itemProps.top);
              const baseLeft = parsePxOrAuto(itemProps.left);
              const finalTop = baseTop + clampedMove.dy;
              const finalLeft = baseLeft + clampedMove.dx;
              const latestState = query.getState();
              const latestParentId = latestState.nodes[item.nodeId]?.data?.parent as string | undefined;
              const latestParentProps = latestParentId
                ? (latestState.nodes[latestParentId]?.data?.props ?? {}) as Record<string, unknown>
                : {};
              const offsetInsideFreeform = latestParentProps.isFreeform === true;

              item.dom.style.position = offsetInsideFreeform ? "absolute" : ((!item.dom.style.position || item.dom.style.position === "static") ? "relative" : item.dom.style.position);
              item.dom.style.top = `${finalTop}px`;
              item.dom.style.left = `${finalLeft}px`;

              actions.setProp(item.nodeId, (props: Record<string, unknown>) => {
                if (offsetInsideFreeform) {
                  props.position = "absolute";
                } else if (!props.position || props.position === "static") {
                  props.position = "relative";
                }
                props.top = `${finalTop}px`;
                props.left = `${finalLeft}px`;
              });
            } else {
              const baseMT = typeof itemProps.marginTop === "number" ? itemProps.marginTop : 0;
              const baseML = typeof itemProps.marginLeft === "number" ? itemProps.marginLeft : 0;
              const finalMT = baseMT + clampedMove.dy;
              const finalML = baseML + clampedMove.dx;

              item.dom.style.marginTop = `${finalMT}px`;
              item.dom.style.marginLeft = `${finalML}px`;

              actions.setProp(item.nodeId, (props: Record<string, unknown>) => {
                props.marginTop = finalMT;
                props.marginLeft = finalML;
              });
            }
          }

          resetPreviewStyles();
      } else if (d.type === "resize" && d.handle) {
        const h = d.handle;
        const startW = d.startRect.width / zoom;
        const startH = d.startRect.height / zoom;
        const ratio = startW / Math.max(startH, 1);
        let newW = startW, newH = startH, extraMT = 0, extraML = 0;
        if (h.includes("e")) newW = Math.max(20, startW + dx);
        if (h.includes("w")) { newW = Math.max(20, startW - dx); extraML = dx; }
        if (h.includes("s")) newH = Math.max(20, startH + dy);
        if (h.includes("n")) { newH = Math.max(20, startH - dy); extraMT = dy; }
          if (d.constrainRatio && ["ne", "nw", "se", "sw"].includes(h)) {
            const dw = newW - startW, dh = newH - startH;
            if (Math.abs(dw) >= Math.abs(dh)) {
              newH = newW / ratio;
              if (h.includes("n")) extraMT = newH - startH;
              if (h.includes("w")) extraML = newW - startW;
            } else {
              newW = newH * ratio;
              if (h.includes("w")) extraML = newW - startW;
              if (h.includes("n")) extraMT = newH - startH;
            }
          }
        if (d.resizeFromCenter) {
          const dw = newW - startW, dh = newH - startH;
          if (h.includes("e") || h.includes("w")) extraML = -dw / 2;
          if (h.includes("n") || h.includes("s")) extraMT = -dh / 2;
        }
        ({ newW, newH, extraMT, extraML } = clampResizeToBounds(h, d, { newW, newH, extraMT, extraML }));
        if (isSectionNode) {
          newW = startW;
          extraML = 0;
        }

        const currentNode = query.getState().nodes[nodeId];
        const isTextNode = currentNode?.data?.displayName === "Text";
        const isAccordionNode = currentNode?.data?.displayName === "Accordion";
        const isImageNode = currentNode?.data?.displayName === "Image";
        const isSection = currentNode?.data?.displayName === "Section";
        const startFontSize = parsePxOrAuto(d.startProps.fontSize);
        const nextFontSize = isTextNode
          ? computeTextFontSizeForResize(h, startW, startH, newW, newH, startFontSize)
          : null;

        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          if (!isSection) {
            props.width = `${Math.round(newW)}px`;
          }
          if (isTextNode || isAccordionNode) {
            props.height = "auto";
            if (isAccordionNode) {
              props.minHeight = `${Math.round(newH)}px`;
            } else {
              delete props.minHeight;
              }
              delete props.maxHeight;
            } else {
              props.height = `${Math.round(newH)}px`;
            }
            if (isTextNode && nextFontSize != null) {
              props.fontSize = Math.round(nextFontSize * 10) / 10;
            }
            if (extraMT !== 0) {
              const isOffset = (d.moveMode ?? "margin") === "offset";
              if (isOffset) {
                const bTop = parsePxOrAuto(d.startProps.top);
                props.top = `${Math.round(bTop + extraMT)}px`;
              } else {
                const bMT = typeof d.startProps.marginTop === "number" ? d.startProps.marginTop as number : 0;
                const isMarginMove = (d.moveMode ?? "margin") === "margin";
                const allowNegativeTopDuringResize = h.includes("n");
                const nextMT = isMarginMove && !allowNegativeTopDuringResize
                  ? Math.max(0, bMT + extraMT)
                  : (bMT + extraMT);
                props.marginTop = Math.round(nextMT);
              }
            }
            if (extraML !== 0) {
              const isOffset = (d.moveMode ?? "margin") === "offset";
              if (isOffset) {
                const bLeft = parsePxOrAuto(d.startProps.left);
                props.left = `${Math.round(bLeft + extraML)}px`;
              } else {
                const bML = typeof d.startProps.marginLeft === "number" ? d.startProps.marginLeft as number : 0;
                const isMarginMove = (d.moveMode ?? "margin") === "margin";
                const allowNegativeLeftDuringResize = h.includes("w");
                const nextML = isMarginMove && !allowNegativeLeftDuringResize
                  ? Math.max(0, bML + extraML)
                  : (bML + extraML);
                props.marginLeft = Math.round(nextML);
              }
            }
            if (isImageNode) {
              props._autoFitInTabs = false;
            }
          });

        // Resize preview writes inline DOM styles during drag; ensure they do not linger
        // and override committed Craft props (notably Accordion height:auto behavior).
        if (!isSection) {
          dom.style.width = `${Math.round(newW)}px`;
        }
        if (isTextNode || isAccordionNode) {
          dom.style.height = "auto";
          if (isAccordionNode) {
            dom.style.minHeight = `${Math.round(newH)}px`;
          } else {
            dom.style.removeProperty("min-height");
            }
            dom.style.removeProperty("max-height");
          } else {
            dom.style.height = `${Math.round(newH)}px`;
          }
        } else if (d.type === "rotate") {
          const startRot = parseRotation(d.startProps.rotation);
          const finalRot = startRot + (d.accumulatedAngleDeg ?? 0);
          actions.setProp(nodeId, (props: Record<string, unknown>) => {
            props.rotation = Math.round(finalRot * 10) / 10;
          });
        }
      }

      dragRef.current = null;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      const finalRect = getOverlayRect(dom);
      applyOverlayRect(finalRect);
      setRect(finalRect);
      setIsDragging(false);
      setDragType(null);
      setSnapGuidesRef.current([]);
      setRotateAngle(null);
      if (d?.type === "resize") {
        dom.style.willChange = d.previousWillChange ?? "";
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, actions, nodeId, applyOverlayRect, dom, clampMoveDeltaToBounds, clampResizeToBounds, isSectionNode]);

  const locked = query.getState().nodes[nodeId]?.data?.props?.locked === true;
  if (locked) return null;
  if (!rect) return null;

  const half = HANDLE_SIZE / 2;
  const allHandles: { key: Handle; style: React.CSSProperties }[] = [
    { key: "nw", style: { left: -half, top: -half } },
    { key: "ne", style: { right: -half, top: -half } },
    { key: "sw", style: { left: -half, bottom: -half } },
    { key: "se", style: { right: -half, bottom: -half } },
    { key: "n", style: { left: "50%", top: -half, transform: "translateX(-50%)" } },
    { key: "s", style: { left: "50%", bottom: -half, transform: "translateX(-50%)" } },
    { key: "w", style: { left: -half, top: "50%", transform: "translateY(-50%)" } },
    { key: "e", style: { right: -half, top: "50%", transform: "translateY(-50%)" } },
  ];
  const handles = disableResize
    ? []
    : (isSectionNode ? allHandles.filter((h) => h.key === "n" || h.key === "s") : allHandles);
  const frameRect = getOverlayFrameRect(dom, rect);
  const centerX = frameRect.centerX;
  const centerY = frameRect.centerY;
  const currentRotation = (() => {
    const props = getProps();
    const propRotation = parseRotation(props.rotation);
    const hasFlip = props.flipHorizontal === true || props.flipVertical === true;
    if (!hasFlip && Math.abs(propRotation) < 0.01) {
      const domRotation = getRotationFromTransformMatrix(window.getComputedStyle(dom).transform);
      if (domRotation != null && Number.isFinite(domRotation) && Math.abs(domRotation) >= 0.01) {
        return domRotation;
      }
    }
    return propRotation;
  })();
  const displayAngle = rotateAngle ?? currentRotation;

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      data-panel="resize-overlay"
      style={{
        position: "fixed",
        left: frameRect.left,
        top: frameRect.top,
        width: frameRect.width,
        height: frameRect.height,
        zIndex: 40,
        pointerEvents: "none",
        willChange: isDragging ? "left, top, width, height" : undefined,
      }}
    >
      {isDragging && dragRef.current?.guideBounds && (

        <div
          style={{
            position: "fixed",
            left: dragRef.current.guideBounds.left + CONTAINER_LIMIT_MARGIN_PX,
            top: dragRef.current.guideBounds.top + CONTAINER_LIMIT_MARGIN_PX,
            width: Math.max(0, dragRef.current.guideBounds.right - dragRef.current.guideBounds.left - CONTAINER_LIMIT_MARGIN_PX * 2),
            height: Math.max(0, dragRef.current.guideBounds.bottom - dragRef.current.guideBounds.top - CONTAINER_LIMIT_MARGIN_PX * 2),
            border: "1px dashed rgba(59,130,246,0.72)",
            background: "rgba(59,130,246,0.04)",
            pointerEvents: "none",
            zIndex: 9998,
          }}
        />
      )}

      {isDragging && dragType === "rotate" && !disableRotate && (
        <>
          <div
            style={{
              position: "fixed",
              left: centerX,
              top: 0,
              width: 1,
              height: window.innerHeight,
              backgroundColor: "rgba(56, 189, 248, 0.45)",
              pointerEvents: "none",
              zIndex: 10000,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: centerY,
              left: 0,
              height: 1,
              width: window.innerWidth,
              backgroundColor: "rgba(56, 189, 248, 0.45)",
              pointerEvents: "none",
              zIndex: 10000,
            }}
          />
          <div
            style={{
              position: "fixed",
              left: centerX,
              top: centerY,
              width: Math.max(frameRect.width, frameRect.height) * 0.65,
              height: 2,
              backgroundColor: "#38bdf8",
              transformOrigin: "0 50%",
              transform: `rotate(${displayAngle}deg)`,
              pointerEvents: "none",
              zIndex: 10001,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -ROTATION_HANDLE_OFFSET - 24,
              transform: "translateX(-50%)",
              background: "#3b82f6",
              color: "#fff",
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 3,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 10002,
            }}
          >
            {Math.round(displayAngle)}°
          </div>
        </>
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: displayAngle ? `rotate(${displayAngle}deg)` : undefined,
          transformOrigin: "center center",
        }}
      >
        {/* Border = drag to move */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "2px solid #3b82f6",
            borderRadius: 2,
            cursor: "default",
            pointerEvents: isExternalDragActive ? "none" : "auto",
          }}
          onMouseDown={(e) => startDrag(e, "move")}
        />

        {/* Resize handles */}
        {handles.map((h) => (
          <div
            key={h.key}
            data-resize-handle
            style={{
              position: "absolute",
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              backgroundColor: "#ffffff",
              border: "2px solid #3b82f6",
              borderRadius: 2,
              cursor: HANDLE_CURSORS[h.key],
              pointerEvents: isExternalDragActive ? "none" : "auto",
              zIndex: 1,
              ...h.style,
            }}
            onMouseDown={(e) => startDrag(e, "resize", h.key)}
          />
        ))}

        {/* Rotation handle */}
        {!disableRotate && (
          <>
            <div
              data-resize-handle
              style={{
                position: "absolute",
                left: "50%",
                top: -ROTATION_HANDLE_OFFSET,
                transform: "translate(-50%, -50%)",
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "2px solid #3b82f6",
                backgroundColor: "#ffffff",
                cursor: "default",
                pointerEvents: isExternalDragActive ? "none" : "auto",
                zIndex: 2,
              }}
              onMouseDown={(e) => startDrag(e, "rotate")}
              title="Rotate"
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: -ROTATION_HANDLE_OFFSET / 2,
                width: 2,
                height: ROTATION_HANDLE_OFFSET,
                backgroundColor: "#3b82f6",
                transform: "translateX(-50%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          </>
        )}
      </div>

      {/* Size tooltip while resizing */}
      {isDragging && dragType === "resize" && !disableResize && (
        <div
          style={{
            position: "absolute",
            bottom: -24,
            right: 0,
            background: "#3b82f6",
            color: "#fff",
            fontSize: 10,
            padding: "2px 6px",
            borderRadius: 3,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {Math.round(rect.width / (dragRef.current?.zoom || 1))} × {Math.round(rect.height / (dragRef.current?.zoom || 1))}
        </div>
      )}
    </div>,
    document.body
  );
};
