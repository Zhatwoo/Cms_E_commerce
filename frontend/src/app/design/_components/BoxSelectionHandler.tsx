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

type SelectableNode = {
  id: string;
  dom: HTMLElement;
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
  const animationFrameRef = useRef<number | null>(null);
  const selectableNodesRef = useRef<SelectableNode[]>([]);
  const highlightedIdsRef = useRef<Set<string>>(new Set());
  const marqueeRectRef = useRef<MarqueeRect | null>(null);

  const clearPreviewHighlights = () => {
    const highlighted = document.querySelectorAll("[data-box-preview-selected='true']");
    highlighted.forEach((el) => {
      const element = el as HTMLElement;
      delete element.dataset.boxPreviewSelected;
      element.classList.remove("component-selected");
    });
    highlightedIdsRef.current.clear();
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
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      dragRef.current = null;
      startedOnEmptyRef.current = false;
      selectableNodesRef.current = [];
      marqueeRectRef.current = null;
      setMarqueeRect(null);
      clearPreviewHighlights();
      delete document.body.dataset[BOX_SELECTING_FLAG];
      delete document.body.dataset[BOX_SELECTING_INTENT_FLAG];
      document.body.style.userSelect = "";
    };

    const buildSelectableNodes = (): SelectableNode[] => {
      try {
        const state = queryRef.current.getState();
        const nodes = state.nodes;
        return Object.keys(nodes).flatMap((id) => {
          if (id === "ROOT" || !nodes[id]) return [];
          const displayName = (nodes[id]?.data?.displayName as string | undefined) ?? "";
          if (displayName === "Viewport" || displayName === "Page" || displayName === "Section") return [];
          try {
            const dom = queryRef.current.node(id).get()?.dom ?? null;
            if (!dom || !dom.isConnected) return [];
            return [{ id, dom }];
          } catch {
            return [];
          }
        });
      } catch {
        return [];
      }
    };

    const getIntersectingNodeIds = (selectionRect: Rect): string[] => {
      const intersecting: string[] = [];
      for (const candidate of selectableNodesRef.current) {
        const rect = candidate.dom.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        if (rectsIntersect(selectionRect, { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom })) {
          intersecting.push(candidate.id);
        }
      }
      return intersecting;
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
      if (target.closest("[data-section-drag-handle='true']")) return;
      const isResizeOverlay = !!target.closest("[data-panel='resize-overlay']");
      if (target.closest("[data-panel]") && !isResizeOverlay) return;
      if (target.closest("[data-resize-handle]")) return;
      if (!target.closest("[data-canvas-container]")) return;
      if (document.body.dataset.spacePan === "true") return;
      if (document.body.dataset.canvasPan === "true") return;
      if (document.body.dataset.colorPickerDragging === "true") return;
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
              displayName === "Section" ||
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
        selectableNodesRef.current = buildSelectableNodes();
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

    const updateMarqueeFrame = () => {
      animationFrameRef.current = null;
      const dragState = dragRef.current;
      if (!dragState || !dragState.active) return;
      if (!startedOnEmptyRef.current) return;

      const distance = Math.hypot(dragState.currentX - dragState.startX, dragState.currentY - dragState.startY);
      if (distance < MARQUEE_THRESHOLD) return;

      document.body.dataset[BOX_SELECTING_FLAG] = "true";
      document.body.style.userSelect = "none";

      const nextRect = {
        left: Math.min(dragState.startX, dragState.currentX),
        top: Math.min(dragState.startY, dragState.currentY),
        width: Math.abs(dragState.currentX - dragState.startX),
        height: Math.abs(dragState.currentY - dragState.startY),
      };

      const previousRect = marqueeRectRef.current;
      marqueeRectRef.current = nextRect;
      if (
        !previousRect ||
        previousRect.left !== nextRect.left ||
        previousRect.top !== nextRect.top ||
        previousRect.width !== nextRect.width ||
        previousRect.height !== nextRect.height
      ) {
        setMarqueeRect(nextRect);
      }

      const selectionRect: Rect = {
        left: nextRect.left,
        top: nextRect.top,
        right: nextRect.left + nextRect.width,
        bottom: nextRect.top + nextRect.height,
      };
      const intersecting = getIntersectingNodeIds(selectionRect);
      const mergedPreview = mergeSelection(dragState.mode, dragState.initialSelection, intersecting);
      const nextHighlighted = new Set(mergedPreview);
      const previousHighlighted = highlightedIdsRef.current;

      for (const nodeId of nextHighlighted) {
        if (previousHighlighted.has(nodeId)) continue;
        try {
          const dom = queryRef.current.node(nodeId).get()?.dom ?? null;
          if (!dom) continue;
          dom.dataset.boxPreviewSelected = "true";
          dom.classList.add("component-selected");
        } catch {
          // ignore
        }
      }

      for (const nodeId of previousHighlighted) {
        if (nextHighlighted.has(nodeId)) continue;
        try {
          const dom = queryRef.current.node(nodeId).get()?.dom ?? null;
          if (!dom) continue;
          delete dom.dataset.boxPreviewSelected;
          dom.classList.remove("component-selected");
        } catch {
          // ignore
        }
      }

      highlightedIdsRef.current = nextHighlighted;
    };

    const scheduleMarqueeUpdate = () => {
      if (animationFrameRef.current !== null) return;
      animationFrameRef.current = window.requestAnimationFrame(updateMarqueeFrame);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dragState = dragRef.current;
      if (!dragState || !dragState.active) return;
      if (!startedOnEmptyRef.current) return;
      if ((e.buttons & 1) === 0) return;

      dragState.currentX = e.clientX;
      dragState.currentY = e.clientY;
      scheduleMarqueeUpdate();
    };

    const handleMouseUp = () => {
      const dragState = dragRef.current;
      const startedOnEmpty = startedOnEmptyRef.current;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (!startedOnEmpty) {
        clearMarqueeState();
        return;
      }
      if (!dragState || !dragState.active) {
        clearMarqueeState();
        return;
      }

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
        clearMarqueeState();
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

      clearMarqueeState();
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
