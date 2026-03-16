"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import { useCanvasTool } from "./CanvasToolContext";

const MARQUEE_THRESHOLD = 5;
const BOX_SELECTING_FLAG = "boxSelecting";
const BOX_SELECTING_INTENT_FLAG = "boxSelectingIntent";

type Rect = { left: number; top: number; right: number; bottom: number };

type MarqueeRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type DragState = {
  active: boolean;
  startedOnNode: boolean;
  clearSelectionOnClick: boolean;
  mode: "replace" | "add" | "subtract";
  initialSelection: string[];
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(a.left > b.right || a.right < b.left || a.top > b.bottom || a.bottom < b.top);
}

export const BoxSelectionHandler = () => {
  const { actions, query } = useEditor();
  const { activeTool } = useCanvasTool();

  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);

  const dragRef = useRef<DragState | null>(null);
  const startedOnEmptyRef = useRef(false);
  const actionsRef = useRef(actions);
  const queryRef = useRef(query);
  const activeToolRef = useRef(activeTool);

  const clearPreviewHighlights = () => {
    const highlighted = document.querySelectorAll("[data-box-preview-selected='true']");
    highlighted.forEach((el) => {
      const element = el as HTMLElement;
      delete element.dataset.boxPreviewSelected;
      element.classList.remove("component-selected");
    });
  };

  useEffect(() => {
    actionsRef.current = actions;
    queryRef.current = query;
  }, [actions, query]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    const clearMarqueeState = () => {
      dragRef.current = null;
      startedOnEmptyRef.current = false;
      setMarqueeRect(null);
      clearPreviewHighlights();
      delete document.body.dataset[BOX_SELECTING_FLAG];
      delete document.body.dataset[BOX_SELECTING_INTENT_FLAG];
      document.body.style.userSelect = "";
    };

    const getIntersectingNodeIds = (selectionRect: Rect): string[] => {
      try {
        const state = queryRef.current.getState();
        const nodes = state.nodes;
        const nodeIds = Object.keys(nodes).filter((id) => {
          if (id === "ROOT" || !nodes[id]) return false;
          const displayName = (nodes[id]?.data?.displayName as string | undefined) ?? "";
          if (displayName === "Viewport" || displayName === "Page") return false;
          return true;
        });

        const intersecting: string[] = [];
        for (const nodeId of nodeIds) {
          try {
            const dom = queryRef.current.node(nodeId).get()?.dom ?? null;
            if (!dom) continue;
            const rect = dom.getBoundingClientRect();
            if (rectsIntersect(selectionRect, { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom })) {
              intersecting.push(nodeId);
            }
          } catch {
            // ignore bad node refs
          }
        }
        return intersecting;
      } catch {
        return [];
      }
    };

    const mergeSelection = (
      mode: DragState["mode"],
      initialSelection: string[],
      intersecting: string[]
    ): string[] => {
      const initial = new Set(initialSelection);
      if (mode === "add") {
        return Array.from(new Set([...initialSelection, ...intersecting]));
      }
      if (mode === "subtract") {
        intersecting.forEach((id) => initial.delete(id));
        return Array.from(initial);
      }
      return intersecting;
    };

    const handleMouseDown = (e: MouseEvent) => {
      clearMarqueeState();
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (
        target.closest("INPUT") ||
        target.closest("TEXTAREA") ||
        target.closest("SELECT") ||
        target.closest("[contenteditable=true]")
      ) return;
      const isResizeOverlay = !!target.closest("[data-panel='resize-overlay']");
      if (target.closest("[data-panel]") && !isResizeOverlay) return;
      if (target.closest("[data-resize-handle]")) return;
      if (!target.closest("[data-canvas-container]")) return;
      if (document.body.dataset.spacePan === "true") return;
      if (document.body.dataset.canvasPan === "true") return;
      if (activeToolRef.current === "hand" || activeToolRef.current === "text") return;

      let isEmptyBackground = false;
      let isCanvasSurface = false;
      let clearSelectionOnClick = false;
      let initialSelection: string[] = [];
      let mode: DragState["mode"] = "replace";

      try {
        const state = queryRef.current.getState();
        const currentSelectedRaw = state.events.selected;
        initialSelection = Array.isArray(currentSelectedRaw)
          ? currentSelectedRaw
          : currentSelectedRaw instanceof Set
            ? Array.from(currentSelectedRaw)
            : currentSelectedRaw && typeof currentSelectedRaw === "object"
              ? Object.keys(currentSelectedRaw)
              : [];
      } catch {
        initialSelection = [];
      }

      if (e.altKey) {
        mode = "subtract";
      } else if (e.shiftKey || e.ctrlKey || e.metaKey) {
        mode = "add";
      }

      const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
      if (!nodeEl) {
        isEmptyBackground = true;
        clearSelectionOnClick = true;
      } else {
        const nodeId = nodeEl.getAttribute("data-node-id");
        if (!nodeId || nodeId === "ROOT") {
          isEmptyBackground = true;
          clearSelectionOnClick = true;
        } else {
          try {
            const state = queryRef.current.getState();
            const node = state.nodes[nodeId];
            const displayName = (node?.data?.displayName as string | undefined) ?? "";
            const isCanvasBackground =
              node?.data?.isCanvas === true ||
              displayName === "Page" ||
              displayName === "Viewport" ||
              displayName === "Tab Content";
            if (isCanvasBackground) {
              isEmptyBackground = true;
              isCanvasSurface = true;
              clearSelectionOnClick = false;
            }
          } catch {
             // ignore
          }
        }
      }

      startedOnEmptyRef.current = isEmptyBackground;
      // Only set box-select flags when starting on empty area so FigmaStyleDragHandler
      // can drag nodes (including multi-drag) when starting on a node
      if (startedOnEmptyRef.current) {
        document.body.dataset[BOX_SELECTING_INTENT_FLAG] = "true";
      }
      dragRef.current = {
        active: true,
        startedOnNode: !isEmptyBackground && !isCanvasSurface,
        clearSelectionOnClick,
        mode,
        initialSelection,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dragState = dragRef.current;
      if (!dragState || !dragState.active) return;
      // Only show marquee when started on empty — when started on node, let drag handler work
      if (!startedOnEmptyRef.current) return;

      dragState.currentX = e.clientX;
      dragState.currentY = e.clientY;

      const distance = Math.hypot(dragState.currentX - dragState.startX, dragState.currentY - dragState.startY);
      if (distance < MARQUEE_THRESHOLD) return;

      document.body.dataset[BOX_SELECTING_FLAG] = "true";
      document.body.style.userSelect = "none";

      setMarqueeRect({
        left: Math.min(dragState.startX, dragState.currentX),
        top: Math.min(dragState.startY, dragState.currentY),
        width: Math.abs(dragState.currentX - dragState.startX),
        height: Math.abs(dragState.currentY - dragState.startY),
      });

      const left = Math.min(dragState.startX, dragState.currentX);
      const right = Math.max(dragState.startX, dragState.currentX);
      const top = Math.min(dragState.startY, dragState.currentY);
      const bottom = Math.max(dragState.startY, dragState.currentY);
      const selectionRect: Rect = { left, top, right, bottom };
      const intersecting = getIntersectingNodeIds(selectionRect);
      const mergedPreview = mergeSelection(dragState.mode, dragState.initialSelection, intersecting);
      const nextHighlighted = new Set(mergedPreview);

      for (const nodeId of mergedPreview) {
        try {
          const dom = queryRef.current.node(nodeId).get()?.dom ?? null;
          if (!dom) continue;
          dom.dataset.boxPreviewSelected = "true";
          dom.classList.add("component-selected");
        } catch {
          // ignore
        }
      }

      const currentlyHighlighted = document.querySelectorAll("[data-box-preview-selected='true']");
      currentlyHighlighted.forEach((el) => {
        const element = el as HTMLElement;
        const id = element.getAttribute("data-node-id");
        if (!id || !nextHighlighted.has(id)) {
          delete element.dataset.boxPreviewSelected;
          element.classList.remove("component-selected");
        }
      });
    };

    const handleMouseUp = () => {
      const dragState = dragRef.current;
      const startedOnEmpty = startedOnEmptyRef.current;
      clearMarqueeState();

      if (!startedOnEmpty) return;
      if (!dragState || !dragState.active) return;

      const left = Math.min(dragState.startX, dragState.currentX);
      const right = Math.max(dragState.startX, dragState.currentX);
      const top = Math.min(dragState.startY, dragState.currentY);
      const bottom = Math.max(dragState.startY, dragState.currentY);
      const width = right - left;
      const height = bottom - top;
      const distance = Math.hypot(dragState.currentX - dragState.startX, dragState.currentY - dragState.startY);

      if (distance < MARQUEE_THRESHOLD || width < 3 || height < 3) {
        if (dragState.clearSelectionOnClick && dragState.mode === "replace") {
          try {
            actionsRef.current.selectNode(undefined);
          } catch {
            // ignore
          }
        }
        return;
      }

      const selectionRect: Rect = { left, top, right, bottom };

      try {
        const intersecting = getIntersectingNodeIds(selectionRect);
        const finalIds = mergeSelection(dragState.mode, dragState.initialSelection, intersecting);

        if (finalIds.length === 0) {
          actionsRef.current.selectNode(undefined);
        } else if (finalIds.length === 1) {
          actionsRef.current.selectNode(finalIds[0]);
        } else {
          actionsRef.current.selectNode(finalIds);
        }
      } catch {
        // ignore
      }
    };

    const handleKeyOrBlur = (e: KeyboardEvent | FocusEvent | Event) => {
      if (e instanceof KeyboardEvent && e.code !== "Space" && e.code !== "Escape") return;
      clearMarqueeState();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) clearMarqueeState();
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    window.addEventListener("mouseup", handleMouseUp, true);
    window.addEventListener("blur", handleKeyOrBlur);
    window.addEventListener("keydown", handleKeyOrBlur as EventListener);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("blur", handleKeyOrBlur);
      window.removeEventListener("keydown", handleKeyOrBlur as EventListener);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearMarqueeState();
    };
  }, []);

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
