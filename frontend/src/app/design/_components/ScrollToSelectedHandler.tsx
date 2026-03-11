"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { selectedToIds } from "../_lib/canvasActions";

/**
 * When the user selects a node (e.g. from the Files panel), dispatches a custom
 * event so the camera system in EditorShell can center on the selected element.
 */
export function ScrollToSelectedHandler() {
  const { selected, query } = useEditor((state) => ({ selected: state.events.selected }));
  const lastCenteredNodeIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Centering should be explicit (e.g. from a future "focus in canvas" action),
    // not triggered by normal selection changes from panel/canvas clicks.
    const centerRequested = document.body.dataset.centerOnSelect === "true";
    if (!centerRequested) return;

    const ids = selectedToIds(selected);
    if (ids.length === 0) {
      lastCenteredNodeIdRef.current = null;
      return;
    }

    // Avoid accidental auto-centering when selecting regular components.
    // We only center when the selection is explicitly a single Page node.
    if (ids.length !== 1) return;

    const targetId = ids[0];
    if (!targetId) return;
    if (lastCenteredNodeIdRef.current === targetId) return;

    const selectedNode = query.node(targetId).get();
    const displayName = selectedNode?.data?.displayName;
    if (displayName !== "Page") return;

    const canvasContainer = document.querySelector("[data-canvas-container]") as HTMLElement | null;
    if (!canvasContainer) return;

    const desktopNodeEl = document.querySelector<HTMLElement>(
      `[data-viewport-desktop] [data-node-id="${targetId}"]`
    );
    if (!desktopNodeEl) return;

    canvasContainer.dispatchEvent(
      new CustomEvent("center-on-node", { detail: { nodeId: targetId } })
    );
    delete document.body.dataset.centerOnSelect;

    lastCenteredNodeIdRef.current = targetId;
  }, [query, selected]);

  return null;
}
