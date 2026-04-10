"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { useCanvasTool } from "./CanvasToolContext";
import { selectedToIds } from "../_lib/canvasActions";

/**
 * Handles multi-selection on the canvas via mousedown on capture phase.
 * - Click: select single node (or clear if clicking empty area)
 * - Ctrl (Win) / Cmd (Mac) + Click: toggle node in selection
 *
 * Uses query.getState() inside the handler to avoid reactive subscriptions
 * that cause "Cannot update component while rendering another" errors.
 */
export const CanvasSelectionHandler = () => {
  const { actions, query } = useEditor();
  const { activeTool } = useCanvasTool();
  const lastSelectedNodeIdRef = useRef<string | null>(null);
  const MULTI_DRAG_LOCK_FLAG = "multiDragLock";

  useEffect(() => {
    if (activeTool !== "hand") return;
    try {
      actions.selectNode(undefined);
      lastSelectedNodeIdRef.current = null;
    } catch {
      // ignore
    }
  }, [activeTool, actions]);

  useEffect(() => {
    const isSideOrToolPanel = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      return Boolean(
        el.closest("[data-panel='left']") ||
          el.closest("[data-panel='right']") ||
          el.closest("[data-panel='configs']") ||
          el.closest("[data-panel='top-controls']") ||
          el.closest("[data-panel='bottom-tools']")
      );
    };

    const findDeepestNodeId = (element: HTMLElement | null): string | null => {
      if (!element) return null;
      const selfId = element.getAttribute("data-node-id");
      if (selfId) return selfId;

      let current: HTMLElement | null = element;
      while (current && current !== document.body) {
        const id = current.getAttribute("data-node-id");
        if (id) return id;
        current = current.parentElement;
      }
      return null;
    };

    const findNodeIdFromPoint = (clientX: number, clientY: number): string | null => {
      try {
        const elements = document.elementsFromPoint(clientX, clientY) as HTMLElement[];
        for (const el of elements) {
          if (!el) continue;
          if (isSideOrToolPanel(el)) continue;
          const nodeEl = el.closest?.("[data-node-id]") as HTMLElement | null;
          const id = nodeEl?.getAttribute?.("data-node-id") ?? null;
          if (id) return id;
        }
      } catch {
        // ignore
      }
      return null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (document.body.dataset[MULTI_DRAG_LOCK_FLAG] === "true") return;

      // When panning is active (Hand tool or Space), do not process selection
      if (document.body.dataset.canvasPan === "true") return;
      if (document.body.dataset.spacePan === "true") return;
      if (activeTool === "hand" || activeTool === "text") return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest("[data-ui='color-picker']")) return;

      // Ignore inputs/textareas/selects/contenteditable
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;

      // Ignore clicks inside actual UI panels (left/right/settings/toolbars).
      // Do NOT ignore canvas overlays (resize-overlay, labels, marquee, etc.) because
      // they sit on top of the canvas and would block selecting inner components.
      if (isSideOrToolPanel(target)) return;

      const onOverlay = Boolean(target.closest("[data-panel='resize-overlay']"));
      const nodeId = onOverlay
        ? findNodeIdFromPoint(e.clientX, e.clientY)
        : findDeepestNodeId(target) ?? findNodeIdFromPoint(e.clientX, e.clientY);
      const isMulti = e.ctrlKey || e.metaKey;
      const isRange = e.shiftKey;

      // Read current state lazily (no reactive subscription)
      const state = query.getState();
      const nodesMap = state.nodes;

      const exists = (id: string) => !!id && id !== "ROOT" && !!nodesMap[id];

      const currentIds = selectedToIds(state.events.selected).filter(exists);

      const safeSelect = (payload?: string | string[] | null) => {
        try {
          if (payload === null || payload === undefined) actions.selectNode(undefined);
          else actions.selectNode(payload);
        } catch {
          try { actions.selectNode(undefined); } catch { /* ignore */ }
        }
      };

      const updateLastSelected = (id: string | null) => {
        lastSelectedNodeIdRef.current = id;
      };

      const finalNodeId = nodeId && exists(nodeId) ? nodeId : null;

      if (finalNodeId && exists(finalNodeId)) {
        const isAlreadySelected = currentIds.includes(finalNodeId);

        if (!isMulti && !isRange && isAlreadySelected) {
          updateLastSelected(finalNodeId);
          return;
        }

        if (isRange) {
          const lastId = lastSelectedNodeIdRef.current && exists(lastSelectedNodeIdRef.current) ? lastSelectedNodeIdRef.current : null;
          if (lastId && lastId !== finalNodeId) {
            const parentId = nodesMap[finalNodeId]?.data?.parent as string | undefined;
            const lastParentId = nodesMap[lastId]?.data?.parent as string | undefined;
            if (parentId && parentId === lastParentId) {
              const siblings = (nodesMap[parentId]?.data?.nodes as string[]) ?? [];
              const idxClick = siblings.indexOf(finalNodeId);
              const idxLast = siblings.indexOf(lastId);
              if (idxClick !== -1 && idxLast !== -1) {
                const min = Math.min(idxClick, idxLast);
                const max = Math.max(idxClick, idxLast);
                const rangeIds = siblings.slice(min, max + 1).filter(exists);
                if (rangeIds.length > 0) {
                  safeSelect(rangeIds.length === 1 ? rangeIds[0] : rangeIds);
                  updateLastSelected(finalNodeId);
                  return;
                }
              }
            }
          }
          // Different parent or no last: replace selection with clicked node
          safeSelect(finalNodeId);
          updateLastSelected(finalNodeId);
          return;
        }
        if (isMulti) {
          const next = new Set(currentIds.filter(exists));
          if (next.has(finalNodeId)) {
            next.delete(finalNodeId);
          } else {
            next.add(finalNodeId);
          }
          const validIds = Array.from(next).filter(exists);
          safeSelect(validIds.length === 0 ? null : validIds.length === 1 ? validIds[0] : validIds);
          updateLastSelected(validIds.length > 0 ? (validIds.includes(finalNodeId) ? finalNodeId : validIds[validIds.length - 1]!) : null);
        } else {
          safeSelect(finalNodeId);
          updateLastSelected(finalNodeId);
          return;
        }
      }
      // Empty area: do not clear here — BoxSelectionHandler will clear on mouseup
      // if it was a click, or select nodes in marquee if it was a drag.
    };

    // Use capture on document so we intercept before Craft.js handlers
    document.addEventListener("mousedown", handleMouseDown, true);
    return () => document.removeEventListener("mousedown", handleMouseDown, true);
  }, [actions, query, activeTool]);

  return null;
};
