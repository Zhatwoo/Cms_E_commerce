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
 *
 * Uses refs for drag state so mousemove/mouseup listeners are always active.
 */
export const BoxSelectionHandler = () => {
  const { actions, query } = useEditor();
  const activeTool = useCanvasTool();

  // All drag state in refs so listeners never need to be remounted
  const dragRef = useRef<{
    active: boolean;
    startedOnNode: boolean; // true if drag started on a canvas structural node
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

      if (
        target.closest("INPUT") ||
        target.closest("TEXTAREA") ||
        target.closest("SELECT") ||
        target.closest("[contenteditable=true]")
      ) return;
      if (target.closest("[data-panel]")) return;
      if (!target.closest("[data-canvas-container]")) return;
      if (document.body.dataset.spacePan === "true") return;
      if (document.body.dataset.canvasPan === "true") return;
      if (activeToolRef.current === "hand") return;

      const onNode = target.closest("[data-node-id]");
      if (onNode) return;

      startedOnEmptyRef.current = true;

      setMarquee({
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      };

      // Don't preventDefault - allow other handlers to also respond
    };

    const handleMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d || !d.active) return;

      d.currentX = e.clientX;
      d.currentY = e.clientY;

      const distance = Math.sqrt((d.currentX - d.startX) ** 2 + (d.currentY - d.startY) ** 2);
      if (distance < MARQUEE_THRESHOLD) return; // Don't draw until past threshold

      setMarqueeRect({
        left: Math.min(d.startX, d.currentX),
        top: Math.min(d.startY, d.currentY),
        width: Math.abs(d.currentX - d.startX),
        height: Math.abs(d.currentY - d.startY),
      });
    };

    const handleMouseUp = () => {
      const m = marquee;
      setMarquee(null);

      if (!startedOnEmptyRef.current) return;
      startedOnEmptyRef.current = false;

      if (!d || !d.active) return;

      const left = Math.min(d.startX, d.currentX);
      const right = Math.max(d.startX, d.currentX);
      const top = Math.min(d.startY, d.currentY);
      const bottom = Math.max(d.startY, d.currentY);
      const width = right - left;
      const height = bottom - top;
      const distance = Math.sqrt((d.currentX - d.startX) ** 2 + (d.currentY - d.startY) ** 2);

      if (distance < MARQUEE_THRESHOLD || width < 3 || height < 3) {
        // Tiny movement = regular click.
        // If the click started on a canvas structural node, don't clear selection —
        // CanvasSelectionHandler already handled the selection for that click.
        if (!d.startedOnNode) {
          try {
            actionsRef.current.selectNode(undefined);
          } catch {
            // ignore
          }
        }
        return;
      }

      // Find all nodes whose DOM rects intersect the selection
      const selRect = { left, top, right, bottom };
      try {
        const state = queryRef.current.getState();
        const nodes = state.nodes;
        const ids = Object.keys(nodes).filter((id) => id !== "ROOT" && nodes[id]);
        const intersecting: string[] = [];

        for (const id of ids) {
          try {
            const dom = queryRef.current.node(id).get()?.dom ?? null;
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
            actionsRef.current.selectNode(undefined);
          } else if (intersecting.length === 1) {
            actionsRef.current.selectNode(intersecting[0]);
          } else {
            actionsRef.current.selectNode(intersecting);
          }
        } catch {
          // ignore
        }
      } catch {
        // ignore outer
      }
    };

    const handleKeyOrBlur = (e: KeyboardEvent | FocusEvent | Event) => {
      if (e instanceof KeyboardEvent && e.code !== "Space" && e.code !== "Escape") return;
      dragRef.current = null;
      setMarqueeRect(null);
    };

    // Always-active listeners – no conditional registration
    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    window.addEventListener("mouseup", handleMouseUp, true);
    window.addEventListener("blur", handleKeyOrBlur);
    window.addEventListener("keydown", handleKeyOrBlur as EventListener);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { dragRef.current = null; setMarqueeRect(null); }
    });

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("blur", handleKeyOrBlur);
      window.removeEventListener("keydown", handleKeyOrBlur as EventListener);
    };
  }, []); // Empty deps — refs keep everything fresh

  if (!marqueeRect) return null;

  return typeof document !== "undefined"
    ? ReactDOM.createPortal(
      <div
        data-panel="marquee"
        style={{
          position: "fixed",
          left: marqueeRect.left,
          top: marqueeRect.top,
          width: marqueeRect.width,
          height: marqueeRect.height,
          border: "2px solid #3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.08)",
          pointerEvents: "none",
          zIndex: 10000,
          borderRadius: 2,
        }}
      />,
      document.body
    )
    : null;
};
