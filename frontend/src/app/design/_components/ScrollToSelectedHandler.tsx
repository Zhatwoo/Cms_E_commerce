"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { selectedToIds } from "../_lib/canvasActions";

/**
 * When the user selects a node (e.g. from the Files panel), dispatches a custom
 * event so the camera system in EditorShell can center on the selected element.
 */
export function ScrollToSelectedHandler() {
  const { selected } = useEditor((state) => ({ selected: state.events.selected }));
  const lastCenteredNodeIdRef = useRef<string | null>(null);

  useEffect(() => {
    const ids = selectedToIds(selected);
    if (ids.length === 0) {
      lastCenteredNodeIdRef.current = null;
      return;
    }

    const targetId = ids[0];
    if (!targetId) return;
    if (lastCenteredNodeIdRef.current === targetId) return;

    const canvasContainer = document.querySelector("[data-canvas-container]") as HTMLElement | null;
    if (!canvasContainer) return;

    const desktopNodeEl = document.querySelector<HTMLElement>(
      `[data-viewport-desktop] [data-node-id="${targetId}"]`
    );
    if (!desktopNodeEl) return;

    canvasContainer.dispatchEvent(
      new CustomEvent("center-on-node", { detail: { nodeId: targetId } })
    );

    lastCenteredNodeIdRef.current = targetId;
  }, [selected]);

  return null;
}
