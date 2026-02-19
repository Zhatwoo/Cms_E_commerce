"use client";

import { useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { useCanvasTool } from "./CanvasToolContext";

/**
 * Handles multi-selection on the canvas via mousedown on capture phase.
 * - Click: select single node (or clear if clicking empty area)
 * - Ctrl (Win) / Cmd (Mac) + Click: toggle node in selection
 * - When Hand tool is active, selection is disabled (canvas pan only).
 *
 * Uses query.getState() inside the handler to avoid reactive subscriptions
 * that cause "Cannot update component while rendering another" errors.
 */
export const CanvasSelectionHandler = () => {
  const { actions, query } = useEditor();
  const activeTool = useCanvasTool();

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Hand tool: do not select nodes, let panning handle it
      if (activeTool === "hand") return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore inputs/textareas/selects/contenteditable
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;

      // Ignore clicks inside panel areas (left/right panels, bottom bar)
      if (target.closest("[data-panel]")) return;

      const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
      const nodeId = nodeEl?.getAttribute("data-node-id") ?? null;
      const isMulti = e.ctrlKey || e.metaKey;

      // Read current state lazily (no reactive subscription)
      const state = query.getState();
      const nodesMap = state.nodes;

      const exists = (id: string) => !!id && id !== "ROOT" && !!nodesMap[id];

      // Normalize current selection to string[]
      const raw = state.events.selected;
      const currentIds: string[] = Array.isArray(raw)
        ? raw
        : raw instanceof Set
          ? Array.from(raw)
          : raw && typeof raw === "object"
            ? Object.keys(raw)
            : [];

      const safeSelect = (payload: string | string[] | null) => {
        try {
          if (payload !== null) {
            actions.selectNode(payload);
          }
        } catch {
          try { actions.selectNode(undefined); } catch { /* ignore */ }
        }
      };

      if (nodeId && exists(nodeId)) {
        if (isMulti) {
          const next = new Set(currentIds.filter(exists));
          if (next.has(nodeId)) {
            next.delete(nodeId);
          } else {
            next.add(nodeId);
          }
          const validIds = Array.from(next).filter(exists);
          safeSelect(validIds.length === 0 ? null : validIds.length === 1 ? validIds[0] : validIds);
        } else {
          safeSelect(nodeId);
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
