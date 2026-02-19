"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import { useTransformMode } from "./TransformModeContext";

type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 24;

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
  let zoom = 1;
  let current: HTMLElement | null = el;
  while (current) {
    const zoomText = window.getComputedStyle(current).zoom;
    const parsed = parseFloat(zoomText);
    if (Number.isFinite(parsed) && parsed > 0) {
      zoom *= parsed;
    }
    current = current.parentElement;
  }
  return zoom > 0.01 ? zoom : 1;
}

function getOverlayRect(el: HTMLElement): DOMRect {
  const bounds = el.getBoundingClientRect();
  const zoom = getEffectiveZoom(el);
  const rawWidth = el.offsetWidth;
  const rawHeight = el.offsetHeight;
  if (!rawWidth || !rawHeight) return bounds;

  const width = rawWidth * zoom;
  const height = rawHeight * zoom;
  const left = bounds.left + (bounds.width - width) / 2;
  const top = bounds.top + (bounds.height - height) / 2;
  return new DOMRect(left, top, width, height);
}

type DragState = {
  type: "move" | "resize" | "rotate";
  handle?: Handle;
  moveMode?: "margin" | "offset";
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startRect: DOMRect;
  currentRect: DOMRect;
  guideBounds?: { left: number; top: number; right: number; bottom: number };
  parentCenterX?: number;
  parentCenterY?: number;
  startProps: Record<string, unknown>;
  zoom: number;
  startAngle?: number;
  lastPointerAngle?: number;
  accumulatedAngleDeg?: number;
  dirty: boolean;
};

function parsePxOrAuto(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    if (value.trim() === "" || value === "auto") return 0;
    const n = parseFloat(value.replace("px", ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

type GuideState = {
  v?: number;
  h?: number;
  bounds?: { left: number; top: number; right: number; bottom: number };
} | null;

export const ResizeOverlay = ({ nodeId, dom }: ResizeOverlayProps) => {
  const { actions, query } = useEditor();
  const { isTransformMode } = useTransformMode();
  const transformMode = isTransformMode(nodeId);

  const MOVE_TARGET_TYPES = new Set(["Page", "Section", "Container", "Row", "Column", "Button"]);

  const dragRef = useRef<DragState | null>(null);
  const rafRef = useRef<number>(0);
  const processDragRef = useRef<(() => void) | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"move" | "resize" | "rotate" | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [guides, setGuides] = useState<GuideState>(null);
  const [rotateAngle, setRotateAngle] = useState<number | null>(null);

  // Track DOM rect
  useEffect(() => {
    if (!dom) return;
    const update = () => {
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
          if (!candidate?.data?.isCanvas) return false;

          const displayName = candidate.data.displayName;
          return MOVE_TARGET_TYPES.has(displayName as string);
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

      if (type === "resize") {
        try {
          const state = query.getState();
          const displayName = state.nodes[nodeId]?.data?.displayName;
          if (["Container", "Section", "Row", "Column"].includes(displayName as string)) {
            const designW = Math.round(startRect.width / zoom);
            const designH = Math.round(startRect.height / zoom);
            actions.setProp(nodeId, (props: Record<string, unknown>) => {
              if (props.designWidth == null) props.designWidth = designW;
              if (props.designHeight == null) props.designHeight = designH;
            });
          }
        } catch { /* ignore */ }
      }

      dragRef.current = {
        type,
        handle,
        moveMode: "margin",
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        startRect,
        currentRect: startRect,
        guideBounds: undefined,
        parentCenterX: undefined,
        parentCenterY: undefined,
        startProps,
        zoom,
        startAngle: type === "rotate" ? pointerAngle : undefined,
        lastPointerAngle: type === "rotate" ? pointerAngle : undefined,
        accumulatedAngleDeg: type === "rotate" ? 0 : undefined,
        dirty: false,
      };

      if (type === "move") {
        try {
          const state = query.getState();
          const displayName = state.nodes[nodeId]?.data?.displayName as string | undefined;
          const offsetMoveTypes = new Set(["Image", "Text", "Icon", "Button", "Circle", "Square", "Triangle"]);
          if (dragRef.current && displayName && offsetMoveTypes.has(displayName)) {
            dragRef.current.moveMode = "offset";
          }

          const parentId = state.nodes[nodeId]?.data?.parent;
          const parentDom = parentId ? query.node(parentId).get()?.dom ?? null : null;
          if (parentDom && dragRef.current) {
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
        } catch {
          // ignore guide cache failures
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
    [dom, getProps, query, actions, nodeId]
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
      if (
        Math.abs((prev.v ?? 0) - (next.v ?? 0)) < 0.5 &&
        Math.abs((prev.h ?? 0) - (next.h ?? 0)) < 0.5 &&
        boundsSame
      ) {
        return prev;
      }
      return next;
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
        if (d.moveMode === "offset") {
          const baseTop = parsePxOrAuto(p.top);
          const baseLeft = parsePxOrAuto(p.left);
          const nextTop = Math.round((baseTop + dy) * 2) / 2;
          const nextLeft = Math.round((baseLeft + dx) * 2) / 2;
          actions.setProp(nodeId, (props: Record<string, unknown>) => {
            const currentTop = parsePxOrAuto(props.top);
            const currentLeft = parsePxOrAuto(props.left);
            if (currentTop === nextTop && currentLeft === nextLeft) return;
            if (!props.position || props.position === "static") props.position = "relative";
            props.top = `${nextTop}px`;
            props.left = `${nextLeft}px`;
          });
          d.startProps = { ...d.startProps, top: `${nextTop}px`, left: `${nextLeft}px` };
        } else {
          const baseMT = typeof p.marginTop === "number" ? p.marginTop : 0;
          const baseML = typeof p.marginLeft === "number" ? p.marginLeft : 0;
          const nextMT = Math.round((baseMT + dy) * 2) / 2;
          const nextML = Math.round((baseML + dx) * 2) / 2;
          actions.setProp(nodeId, (props: Record<string, unknown>) => {
            if (props.marginTop === nextMT && props.marginLeft === nextML) return;
            props.marginTop = nextMT;
            props.marginLeft = nextML;
          });
          d.startProps = { ...d.startProps, marginTop: nextMT, marginLeft: nextML };
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
        }

        if (d.guideBounds && d.parentCenterX != null && d.parentCenterY != null) {
          const childCenterX = d.currentRect.left + d.currentRect.width / 2;
          const childCenterY = d.currentRect.top + d.currentRect.height / 2;
          const threshold = 4;
          const v = Math.abs(childCenterX - d.parentCenterX) <= threshold ? d.parentCenterX : undefined;
          const h = Math.abs(childCenterY - d.parentCenterY) <= threshold ? d.parentCenterY : undefined;

          setGuidesIfChanged({
            v,
            h,
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
        let newW = startW, newH = startH, extraMT = 0, extraML = 0;

        if (h.includes("e")) newW = Math.max(20, startW + dx);
        if (h.includes("w")) { newW = Math.max(20, startW - dx); extraML = dx; }
        if (h.includes("s")) newH = Math.max(20, startH + dy);
        if (h.includes("n")) { newH = Math.max(20, startH - dy); extraMT = dy; }

        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          props.width = `${newW}px`;
          props.height = `${newH}px`;
          if (extraMT !== 0) {
            const bMT = typeof d.startProps.marginTop === "number" ? d.startProps.marginTop as number : 0;
            props.marginTop = bMT + extraMT;
          }
          if (extraML !== 0) {
            const bML = typeof d.startProps.marginLeft === "number" ? d.startProps.marginLeft as number : 0;
            props.marginLeft = bML + extraML;
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
        const startRot = typeof d.startProps.rotation === "number" ? d.startProps.rotation : 0;
        const accumulated = (d.accumulatedAngleDeg ?? 0) + deltaDeg;
        d.accumulatedAngleDeg = accumulated;
        d.lastPointerAngle = currentAngle;
        const nextRot = startRot + accumulated;
        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          props.rotation = nextRot;
        });
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
  }, [isDragging, actions, nodeId, setGuidesIfChanged]);

  // Global move/up listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
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
        if (d.type === "move") {
          const moved = tryMoveIntoDropTarget(e.clientX, e.clientY);
          if (moved) {
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
          if (d.moveMode === "offset") {
            const baseTop = parsePxOrAuto(p.top);
            const baseLeft = parsePxOrAuto(p.left);
            const roundedTop = Math.round(baseTop + dy);
            const roundedLeft = Math.round(baseLeft + dx);
            actions.setProp(nodeId, (props: Record<string, unknown>) => {
              if (!props.position || props.position === "static") props.position = "relative";
              props.top = `${roundedTop}px`;
              props.left = `${roundedLeft}px`;
            });
          } else {
            const baseMT = typeof p.marginTop === "number" ? p.marginTop : 0;
            const baseML = typeof p.marginLeft === "number" ? p.marginLeft : 0;
            actions.setProp(nodeId, (props: Record<string, unknown>) => {
              props.marginTop = Math.round(baseMT + dy);
              props.marginLeft = Math.round(baseML + dx);
            });
          }
        } else if (d.type === "resize" && d.handle) {
          const h = d.handle;
          const startW = d.startRect.width / zoom;
          const startH = d.startRect.height / zoom;
          let newW = startW, newH = startH;
          if (h.includes("e")) newW = Math.max(20, startW + dx);
          if (h.includes("w")) newW = Math.max(20, startW - dx);
          if (h.includes("s")) newH = Math.max(20, startH + dy);
          if (h.includes("n")) newH = Math.max(20, startH - dy);
          actions.setProp(nodeId, (props: Record<string, unknown>) => {
            props.width = `${Math.round(newW)}px`;
            props.height = `${Math.round(newH)}px`;
          });
        } else if (d.type === "rotate") {
          actions.setProp(nodeId, (props: Record<string, unknown>) => {
            props.rotation = Math.round((typeof props.rotation === "number" ? props.rotation : 0) * 10) / 10;
          });
        }
      }

      dragRef.current = null;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
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
  }, [isDragging, actions, nodeId]);

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
  const handles = transformMode
    ? allHandles.filter((h) => ["nw", "ne", "sw", "se"].includes(h.key))
    : allHandles;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const currentRotation = (() => {
    const props = getProps();
    return typeof props.rotation === "number" ? props.rotation : 0;
  })();
  const displayAngle = rotateAngle ?? currentRotation;

  return ReactDOM.createPortal(
    <div
      data-panel="resize-overlay"
      style={{
        position: "fixed",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        zIndex: 9999,
        pointerEvents: isDragging ? "auto" : "none",
        willChange: isDragging ? "left, top, width, height" : undefined,
      }}
    >
      {isDragging && dragType === "move" && guides?.bounds && (
        <>
          {guides.v != null && (
            <div
              style={{
                position: "fixed",
                left: guides.v,
                top: guides.bounds.top,
                width: 1,
                height: guides.bounds.bottom - guides.bounds.top,
                backgroundColor: "#38bdf8",
                boxShadow: "0 0 0 1px rgba(56, 189, 248, 0.3)",
                pointerEvents: "none",
                zIndex: 10000,
              }}
            />
          )}
          {guides.h != null && (
            <div
              style={{
                position: "fixed",
                top: guides.h,
                left: guides.bounds.left,
                height: 1,
                width: guides.bounds.right - guides.bounds.left,
                backgroundColor: "#38bdf8",
                boxShadow: "0 0 0 1px rgba(56, 189, 248, 0.3)",
                pointerEvents: "none",
                zIndex: 10000,
              }}
            />
          )}
        </>
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
            cursor: "grab",
            pointerEvents: "auto",
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
              pointerEvents: "auto",
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
            pointerEvents: "auto",
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
