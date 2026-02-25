"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import { useCanvasTool } from "./CanvasToolContext";

const MARQUEE_THRESHOLD = 5;

function rectsIntersect(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number }
): boolean {
  return !(a.left > b.right || a.right < b.left || a.top > b.bottom || a.bottom < b.top);
}

/**
 * Figma-style marquee (box) selection: drag on empty canvas to draw a selection rectangle
 * and select all nodes that intersect it. Click (no drag) on empty clears selection.
 */
export const BoxSelectionHandler = () => {
  const { actions, query } = useEditor();
  const activeTool = useCanvasTool();
  const startedOnEmptyRef = useRef(false);
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Cancel marquee when Space is pressed (user wants pan, not box select)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") setMarquee(null);
      if (e.code === "Escape") {
        startedOnEmptyRef.current = false;
        setMarquee(null);
      }
    };

    const handleWindowBlur = () => {
      startedOnEmptyRef.current = false;
      setMarquee(null);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        startedOnEmptyRef.current = false;
        setMarquee(null);
      }
    };

    const handleGlobalMouseUp = () => {
      startedOnEmptyRef.current = false;
      setMarquee(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      startedOnEmptyRef.current = false;
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest("INPUT") || target.closest("TEXTAREA") || target.closest("SELECT") || target.closest("[contenteditable=true]")) return;
      if (target.closest("[data-panel]")) return;
      if (!target.closest("[data-canvas-container]")) return;
      // Space = pan only; Hand tool = pan only; do not start marquee
      if (document.body.dataset.spacePan === "true") return;
      if (document.body.dataset.canvasPan === "true") return;
      if (activeTool === "hand") return;

      const onNode = target.closest("[data-node-id]");
      if (onNode) return;

      startedOnEmptyRef.current = true;

      setMarquee({
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!marquee) return;
      setMarquee((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));
    };

    const handleMouseUp = () => {
      const m = marquee;
      setMarquee(null);

      if (!startedOnEmptyRef.current) return;
      startedOnEmptyRef.current = false;

      if (!m) return;

      const left = Math.min(m.startX, m.currentX);
      const right = Math.max(m.startX, m.currentX);
      const top = Math.min(m.startY, m.currentY);
      const bottom = Math.max(m.startY, m.currentY);
      const width = right - left;
      const height = bottom - top;
      const distance = Math.sqrt((m.currentX - m.startX) ** 2 + (m.currentY - m.startY) ** 2);

      if (distance < MARQUEE_THRESHOLD || width < 3 || height < 3) {
        try {
          actions.selectNode(undefined);
        } catch {
          // ignore
        }
        return;
      }

      const selRect = { left, top, right, bottom };
      const state = query.getState();
      const nodes = state.nodes;
      const ids = Object.keys(nodes).filter((id) => id !== "ROOT" && nodes[id]);
      const intersecting: string[] = [];

      for (const id of ids) {
        try {
          let dom: HTMLElement | null = null;
          try {
            dom = query.node(id).get()?.dom ?? null;
          } catch {
            // skip
          }
          if (!dom) continue;
          const r = dom.getBoundingClientRect();
          if (rectsIntersect(selRect, { left: r.left, top: r.top, right: r.right, bottom: r.bottom })) {
            intersecting.push(id);
          }
        } catch {
          // skip
        }
      }

      try {
        if (intersecting.length === 0) {
          actions.selectNode(undefined);
        } else if (intersecting.length === 1) {
          actions.selectNode(intersecting[0]);
        } else {
          actions.selectNode(intersecting);
        }
      } catch {
        // ignore
      }
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    if (marquee) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [actions, query, marquee, activeTool]);

  // Draw marquee rectangle (viewport coordinates)
  const marqueeEl =
    marquee && typeof document !== "undefined"
      ? ReactDOM.createPortal(
        <div
          data-panel="marquee"
          style={{
            position: "fixed",
            left: Math.min(marquee.startX, marquee.currentX),
            top: Math.min(marquee.startY, marquee.currentY),
            width: Math.abs(marquee.currentX - marquee.startX),
            height: Math.abs(marquee.currentY - marquee.startY),
            border: "2px solid #3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.08)",
            pointerEvents: "none",
            zIndex: 10000,
          }}
        />,
        document.body
      )
      : null;

  return <>{marqueeEl}</>;
};
