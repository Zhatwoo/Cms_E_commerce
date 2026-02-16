"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";

type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLE_SIZE = 8;

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

/**
 * Computes the effective zoom factor by comparing rendered size (getBoundingClientRect)
 * to CSS layout size (offsetWidth). Returns 1 if unable to determine.
 */
function getEffectiveZoom(el: HTMLElement): number {
  const ow = (el as HTMLElement).offsetWidth;
  if (!ow) return 1;
  const bw = el.getBoundingClientRect().width;
  const z = bw / ow;
  return z > 0.01 ? z : 1;
}

export const ResizeOverlay = ({ nodeId, dom }: ResizeOverlayProps) => {
  const { actions, query } = useEditor();
  const [dragging, setDragging] = useState<{
    type: "move" | "resize";
    handle?: Handle;
    startX: number;
    startY: number;
    startRect: DOMRect;
    startProps: Record<string, unknown>;
    zoom: number;
  } | null>(null);

  const [rect, setRect] = useState<DOMRect | null>(null);

  // Track DOM position changes
  useEffect(() => {
    if (!dom) return;
    const update = () => setRect(dom.getBoundingClientRect());
    update();
    const observer = new ResizeObserver(update);
    observer.observe(dom);
    // Also update on scroll/resize
    const scrollUpdate = () => requestAnimationFrame(update);
    window.addEventListener("scroll", scrollUpdate, true);
    window.addEventListener("resize", scrollUpdate);
    const interval = setInterval(update, 150);
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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "move" | "resize", handle?: Handle) => {
      e.stopPropagation();
      e.preventDefault();
      const startRect = dom.getBoundingClientRect();
      const startProps = getProps();
      const zoom = getEffectiveZoom(dom);
      setDragging({
        type,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startRect,
        startProps,
        zoom,
      });
    },
    [dom, getProps]
  );

  // Drag handling via document-level listeners
  useEffect(() => {
    if (!dragging) return;

    const zoom = dragging.zoom;

    const handleMouseMove = (e: MouseEvent) => {
      // Raw screen delta → convert to CSS pixels in the zoomed canvas
      const rawDx = e.clientX - dragging.startX;
      const rawDy = e.clientY - dragging.startY;
      const dx = rawDx / zoom;
      const dy = rawDy / zoom;
      const p = dragging.startProps;

      if (dragging.type === "move") {
        const baseMT = typeof p.marginTop === "number" ? p.marginTop : 0;
        const baseML = typeof p.marginLeft === "number" ? p.marginLeft : 0;
        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          props.marginTop = Math.round(baseMT + dy);
          props.marginLeft = Math.round(baseML + dx);
        });
        // Update start for incremental drag feel
        dragging.startX = e.clientX;
        dragging.startY = e.clientY;
        dragging.startProps = {
          ...dragging.startProps,
          marginTop: Math.round(baseMT + dy),
          marginLeft: Math.round(baseML + dx),
        };
      } else if (dragging.type === "resize" && dragging.handle) {
        const h = dragging.handle;
        const startW = dragging.startRect.width / zoom;
        const startH = dragging.startRect.height / zoom;

        let newW = startW;
        let newH = startH;
        let extraMT = 0;
        let extraML = 0;

        if (h.includes("e")) newW = Math.max(20, startW + dx);
        if (h.includes("w")) {
          newW = Math.max(20, startW - dx);
          extraML = dx;
        }
        if (h.includes("s")) newH = Math.max(20, startH + dy);
        if (h.includes("n")) {
          newH = Math.max(20, startH - dy);
          extraMT = dy;
        }

        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          props.width = `${Math.round(newW)}px`;
          props.height = `${Math.round(newH)}px`;
          if (extraMT !== 0) {
            const baseMT = typeof dragging.startProps.marginTop === "number"
              ? (dragging.startProps.marginTop as number)
              : 0;
            props.marginTop = Math.round(baseMT + extraMT);
          }
          if (extraML !== 0) {
            const baseML = typeof dragging.startProps.marginLeft === "number"
              ? (dragging.startProps.marginLeft as number)
              : 0;
            props.marginLeft = Math.round(baseML + extraML);
          }
        });
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.userSelect = "none";
    if (dragging.type === "move") {
      document.body.style.cursor = "grabbing";
    } else if (dragging.handle) {
      document.body.style.cursor = HANDLE_CURSORS[dragging.handle];
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, actions, nodeId]);

  if (!rect) return null;

  const half = HANDLE_SIZE / 2;

  const handles: { key: Handle; style: React.CSSProperties }[] = [
    { key: "nw", style: { left: -half, top: -half } },
    { key: "ne", style: { right: -half, top: -half } },
    { key: "sw", style: { left: -half, bottom: -half } },
    { key: "se", style: { right: -half, bottom: -half } },
    { key: "n", style: { left: "50%", top: -half, transform: "translateX(-50%)" } },
    { key: "s", style: { left: "50%", bottom: -half, transform: "translateX(-50%)" } },
    { key: "w", style: { left: -half, top: "50%", transform: "translateY(-50%)" } },
    { key: "e", style: { right: -half, top: "50%", transform: "translateY(-50%)" } },
  ];

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
        pointerEvents: dragging ? "auto" : "none",
      }}
    >
      {/* Entire border area = grab to move */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "2px solid #3b82f6",
          borderRadius: 2,
          cursor: "grab",
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      />

      {/* Resize handles at corners and edges */}
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
          onMouseDown={(e) => handleMouseDown(e, "resize", h.key)}
        />
      ))}

      {/* Size tooltip while resizing */}
      {dragging?.type === "resize" && (
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
          {Math.round(rect.width / (dragging.zoom || 1))} × {Math.round(rect.height / (dragging.zoom || 1))}
        </div>
      )}
    </div>,
    document.body
  );
};
