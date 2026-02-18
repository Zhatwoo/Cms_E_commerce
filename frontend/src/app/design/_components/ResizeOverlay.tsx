"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import { useTransformMode } from "./TransformModeContext";

type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 24;
const EPSILON = 0.01;

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
  const ow = el.offsetWidth;
  if (!ow) return 1;
  const bw = el.getBoundingClientRect().width;
  const z = bw / ow;
  return z > 0.01 ? z : 1;
}

function isNearlyEqual(a: number, b: number, epsilon = EPSILON): boolean {
  return Math.abs(a - b) < epsilon;
}

function isSameRect(a: DOMRect | null, b: DOMRect): boolean {
  if (!a) return false;
  return (
    isNearlyEqual(a.left, b.left) &&
    isNearlyEqual(a.top, b.top) &&
    isNearlyEqual(a.width, b.width) &&
    isNearlyEqual(a.height, b.height)
  );
}

type DragState = {
  type: "resize" | "rotate";
  handle?: Handle;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startRect: DOMRect;
  currentRect: DOMRect;
  startProps: Record<string, unknown>;
  zoom: number;
  startAngle?: number;
  dirty: boolean;
};

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"resize" | "rotate" | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [guides, setGuides] = useState<GuideState>(null);

  // Track DOM rect
  useEffect(() => {
    if (!dom) return;
    const update = () => {
      const next = dom.getBoundingClientRect();
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
            const parentId = state.nodes[current]?.data?.parent;
            current = parentId ?? null;
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
        });

        return true;
      } catch {
        return false;
      }
    },
    [actions, query, nodeId, MOVE_TARGET_TYPES]
  );

  const startDrag = useCallback(
    (e: React.MouseEvent, type: "resize" | "rotate", handle?: Handle) => {
      e.stopPropagation();
      e.preventDefault();
      const startRect = dom.getBoundingClientRect();
      const startProps = getProps();
      const zoom = getEffectiveZoom(dom);
      const cx = startRect.left + startRect.width / 2;
      const cy = startRect.top + startRect.height / 2;

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
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        startRect,
        currentRect: startRect,
        startProps,
        zoom,
        startAngle: type === "rotate" ? Math.atan2(e.clientY - cy, e.clientX - cx) : undefined,
        dirty: false,
      };
      setIsDragging(true);
      setDragType(type);
      setGuides(null);
      document.body.style.userSelect = "none";
      document.body.style.cursor =
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
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      d.dirty = false;
      const zoom = d.zoom;
      const dx = (d.lastX - d.startX) / zoom;
      const dy = (d.lastY - d.startY) / zoom;

      if (d.type === "resize" && d.handle) {
        const h = d.handle;
        const startW = d.startRect.width / zoom;
        const startH = d.startRect.height / zoom;
        let newW = startW, newH = startH, extraMT = 0, extraML = 0;

        if (h.includes("e")) newW = Math.max(20, startW + dx);
        if (h.includes("w")) { newW = Math.max(20, startW - dx); extraML = dx; }
        if (h.includes("s")) newH = Math.max(20, startH + dy);
        if (h.includes("n")) { newH = Math.max(20, startH - dy); extraMT = dy; }

        if (
          isNearlyEqual(newW, startW) &&
          isNearlyEqual(newH, startH) &&
          isNearlyEqual(extraMT, 0) &&
          isNearlyEqual(extraML, 0)
        ) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

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
        const deltaDeg = ((currentAngle - d.startAngle) * 180) / Math.PI;
        if (isNearlyEqual(deltaDeg, 0)) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        const startRot = typeof d.startProps.rotation === "number" ? d.startProps.rotation : 0;
        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          props.rotation = startRot + deltaDeg;
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isDragging, actions, nodeId, query, setGuidesIfChanged]);

  // Global move/up listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (e.clientX === d.lastX && e.clientY === d.lastY) return;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.dirty = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      const d = dragRef.current;
      if (d) {
        const zoom = d.zoom;
        const dx = (d.lastX - d.startX) / zoom;
        const dy = (d.lastY - d.startY) / zoom;

        if (d.type === "resize" && d.handle) {
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
      setIsDragging(false);
      setDragType(null);
      setGuides(null);
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
      {/* Border outline (move is handled by FigmaStyleDragHandler) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "2px solid #3b82f6",
          borderRadius: 2,
          pointerEvents: "none",
        }}
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
