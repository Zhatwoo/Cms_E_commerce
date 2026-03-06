"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";

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

function getEffectiveZoom(el: HTMLElement): number {
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

  const rect = el.getBoundingClientRect();
  const sx = el.offsetWidth > 0 ? rect.width / el.offsetWidth : 1;
  const sy = el.offsetHeight > 0 ? rect.height / el.offsetHeight : 1;
  const transformScale = Number.isFinite(sx) && Number.isFinite(sy) ? (sx + sy) / 2 : 1;

  const effective = cssZoom * transformScale;
  return effective > 0.01 ? effective : 1;
}

function getOverlayRect(el: HTMLElement): DOMRect {
  return el.getBoundingClientRect();
}

const SNAP_THRESHOLD = 0;

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
  previousTransition?: string;
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

type GuideLine = { type: "v" | "h"; value: number };
type GuideState = {
  lines: GuideLine[];
  bounds?: { left: number; top: number; right: number; bottom: number };
} | null;

export const ResizeOverlay = ({ nodeId, dom }: ResizeOverlayProps) => {
  const { actions, query } = useEditor();

  const MOVE_TARGET_TYPES = new Set(["Page", "Section", "Container", "Row", "Column", "Button", "Frame"]);

  const dragRef = useRef<DragState | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const processDragRef = useRef<(() => void) | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"move" | "resize" | "rotate" | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [guides, setGuides] = useState<GuideState>(null);
  const [rotateAngle, setRotateAngle] = useState<number | null>(null);
  const [isExternalDragActive, setIsExternalDragActive] = useState(false);

  useEffect(() => {
    const updateExternalDragState = (event?: DragEvent) => {
      const target = event?.target;
      const elementTarget = target instanceof Element ? target : null;
      const fromPanelDrag =
        !!elementTarget?.closest("[data-drag-source='asset']") ||
        !!elementTarget?.closest("[data-drag-source='component']") ||
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
      const offsetMoveTypes = new Set(["Image", "Text", "Icon", "Button", "Circle", "Square", "Triangle"]);
      if (displayName === "Page") return "page-canvas";
      if (displayName && offsetMoveTypes.has(displayName)) return "offset";
      return "margin";
    },
    [query]
  );

  const applyOverlayRect = useCallback((nextRect: DOMRect) => {
    const el = overlayRef.current;
    if (!el) return;
    el.style.left = `${nextRect.left}px`;
    el.style.top = `${nextRect.top}px`;
    el.style.width = `${nextRect.width}px`;
    el.style.height = `${nextRect.height}px`;
  }, []);

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
          return displayName ? MOVE_TARGET_TYPES.has(displayName) : false;
        });

        if (!dropParentId || dropParentId === sourceParentId) return false;

        const dropParent = state.nodes[dropParentId];
        const index = Array.isArray(dropParent?.data?.nodes)
          ? dropParent.data.nodes.length
          : 0;

        actions.move(nodeId, dropParentId, index);
        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          props.marginTop = 0;
          props.marginLeft = 0;
          props.top = "0px";
          props.left = "0px";
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
        previousTransition: type === "move" ? dom.style.transition : undefined,
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

            const selectedIds = selectedToIds(state.events.selected).filter((id) => id !== "ROOT" && !!state.nodes[id]);
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
            const parentDom = parentId ? query.node(parentId).get()?.dom ?? null : null;
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
          const parentId = state.nodes[nodeId]?.data?.parent;
          const parentDom = parentId ? query.node(parentId).get()?.dom ?? null : null;
          if (dragRef.current && parentDom) {
            const parentRect = parentDom.getBoundingClientRect();
            dragRef.current.guideBounds = {
              left: parentRect.left,
              right: parentRect.right,
              top: parentRect.top,
              bottom: parentRect.bottom,
            };
          }
        } catch {
          // ignore
        }
      }

      setIsDragging(true);
      setDragType(type);
      setGuides(null);
      if (type === "rotate") {
        const startRot = typeof startProps.rotation === "number" ? startProps.rotation : 0;
        setRotateAngle(startRot);
      } else {
        setRotateAngle(null);
      }
      document.body.style.userSelect = "none";
      document.body.style.cursor =
        type === "move" ? "grabbing" :
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
          rafRef.current = 0;
          return;
        }

        let nextLeft = d.moveMode === "offset"
          ? parsePxOrAuto(p.left) + dx
          : parsePxOrAuto(p.marginLeft) + dx;
        let nextTop = d.moveMode === "offset"
          ? parsePxOrAuto(p.top) + dy
          : parsePxOrAuto(p.marginTop) + dy;

        d.previewX = (d.previewX ?? 0) + dx;
        d.previewY = (d.previewY ?? 0) + dy;
        dom.style.setProperty("translate", `${d.previewX}px ${d.previewY}px`);
        for (const item of d.moveItems ?? []) {
          item.previewX += dx;
          item.previewY += dy;
          item.dom.style.setProperty("translate", `${item.previewX}px ${item.previewY}px`);
        }

        const deltaPx = d.lastX - d.startX;
        const deltaPy = d.lastY - d.startY;
        if (deltaPx !== 0 || deltaPy !== 0) {
          d.currentRect = new DOMRect(
            d.currentRect.left + deltaPx,
            d.currentRect.top + deltaPy,
            d.currentRect.width,
            d.currentRect.height
          );
          applyOverlayRect(d.currentRect);
        }

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

        if (snapOffsetX !== 0 || snapOffsetY !== 0) {
          d.previewX = (d.previewX ?? 0) + snapOffsetX / zoom;
          d.previewY = (d.previewY ?? 0) + snapOffsetY / zoom;
          dom.style.setProperty("translate", `${d.previewX}px ${d.previewY}px`);
          for (const item of d.moveItems ?? []) {
            item.previewX += snapOffsetX / zoom;
            item.previewY += snapOffsetY / zoom;
            item.dom.style.setProperty("translate", `${item.previewX}px ${item.previewY}px`);
          }
          d.currentRect = new DOMRect(
            d.currentRect.left + snapOffsetX,
            d.currentRect.top + snapOffsetY,
            d.currentRect.width,
            d.currentRect.height
          );
          applyOverlayRect(d.currentRect);
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

        if (
          isNearlyEqual(newW, startW) &&
          isNearlyEqual(newH, startH) &&
          isNearlyEqual(extraMT, 0) &&
          isNearlyEqual(extraML, 0)
        ) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const bMT = typeof d.startProps.marginTop === "number" ? (d.startProps.marginTop as number) : 0;
        const bML = typeof d.startProps.marginLeft === "number" ? (d.startProps.marginLeft as number) : 0;
        const nextMarginTopRaw = extraMT !== 0 ? bMT + extraMT : bMT;
        const nextMarginLeftRaw = extraML !== 0 ? bML + extraML : bML;
        const isMarginFlowResize = (d.moveMode ?? "margin") === "margin";
        const nextMarginTop = isMarginFlowResize ? Math.max(0, nextMarginTopRaw) : nextMarginTopRaw;
        const nextMarginLeft = isMarginFlowResize ? Math.max(0, nextMarginLeftRaw) : nextMarginLeftRaw;

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

        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          props.width = `${newW}px`;
          props.height = `${newH}px`;
          if (extraMT !== 0) {
            props.marginTop = nextMarginTop;
          }
          if (extraML !== 0) {
            props.marginLeft = nextMarginLeft;
          }
        });
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

        const startRot = typeof d.startProps.rotation === "number" ? d.startProps.rotation : 0;
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
  }, [isDragging, actions, nodeId, setGuidesIfChanged, clampResizeToBounds]);

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
        const totalDx = (d.previewX ?? 0) + (d.lastX - d.startX) / d.zoom;
        const totalDy = (d.previewY ?? 0) + (d.lastY - d.startY) / d.zoom;
        const clampedMove = d.type === "move"
          ? clampMoveDeltaToBounds(totalDx, totalDy, d)
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

              if (!item.dom.style.position || item.dom.style.position === "static") {
                item.dom.style.position = "relative";
              }
              item.dom.style.top = `${finalTop}px`;
              item.dom.style.left = `${finalLeft}px`;

              actions.setProp(item.nodeId, (props: Record<string, unknown>) => {
                if (!props.position || props.position === "static") props.position = "relative";
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
          actions.setProp(nodeId, (props: Record<string, unknown>) => {
            props.width = `${Math.round(newW)}px`;
            props.height = `${Math.round(newH)}px`;
            if (extraMT !== 0) {
              const bMT = typeof d.startProps.marginTop === "number" ? d.startProps.marginTop as number : 0;
              const nextMT = (d.moveMode ?? "margin") === "margin" ? Math.max(0, bMT + extraMT) : (bMT + extraMT);
              props.marginTop = Math.round(nextMT);
            }
            if (extraML !== 0) {
              const bML = typeof d.startProps.marginLeft === "number" ? d.startProps.marginLeft as number : 0;
              const nextML = (d.moveMode ?? "margin") === "margin" ? Math.max(0, bML + extraML) : (bML + extraML);
              props.marginLeft = Math.round(nextML);
            }
          });
        } else if (d.type === "rotate") {
          const startRot = typeof d.startProps.rotation === "number" ? d.startProps.rotation : 0;
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
      setGuides(null);
      setRotateAngle(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, actions, nodeId, applyOverlayRect, dom, clampMoveDeltaToBounds, clampResizeToBounds]);

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
  const handles = allHandles;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const currentRotation = (() => {
    const props = getProps();
    return typeof props.rotation === "number" ? props.rotation : 0;
  })();
  const displayAngle = rotateAngle ?? currentRotation;

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      data-panel="resize-overlay"
      style={{
        position: "fixed",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        zIndex: 40,
        pointerEvents: "none",
        willChange: isDragging ? "left, top, width, height" : undefined,
      }}
    >
      {isDragging && dragType === "move" && guides?.bounds && (
        <>
          {guides.lines?.map((line, i) =>
            line.type === "v" ? (
              <div
                key={`v-${i}-${line.value}`}
                style={{
                  position: "fixed",
                  left: line.value,
                  top: guides.bounds!.top,
                  width: 1,
                  height: guides.bounds!.bottom - guides.bounds!.top,
                  backgroundColor: "#38bdf8",
                  boxShadow: "0 0 0 1px rgba(56, 189, 248, 0.3)",
                  pointerEvents: "none",
                  zIndex: 10000,
                }}
              />
            ) : (
              <div
                key={`h-${i}-${line.value}`}
                style={{
                  position: "fixed",
                  top: line.value,
                  left: guides.bounds!.left,
                  height: 1,
                  width: guides.bounds!.right - guides.bounds!.left,
                  backgroundColor: "#38bdf8",
                  boxShadow: "0 0 0 1px rgba(56, 189, 248, 0.3)",
                  pointerEvents: "none",
                  zIndex: 10000,
                }}
              />
            )
          )}
        </>
      )}

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

      {isDragging && dragType === "rotate" && (
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
              width: Math.max(rect.width, rect.height) * 0.65,
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
        {/* Border = grab to move */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "2px solid #3b82f6",
            borderRadius: 2,
            cursor: isExternalDragActive ? "default" : "grab",
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
            cursor: "grab",
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
      </div>

      {/* Size tooltip while resizing */}
      {isDragging && dragType === "resize" && (
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
