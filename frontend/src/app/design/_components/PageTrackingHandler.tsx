"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { selectedToIds } from "../_lib/canvasActions";

const SET_CURRENT_PAGE = "set-current-page";

/**
 * Figma-style page tracking: syncs current page with selection.
 * When user selects a node, the page containing that node becomes the current page.
 */
export function PageTrackingHandler() {
  const { selected, nodes } = useEditor((state) => ({
    selected: state.events.selected,
    nodes: state.nodes,
  }));

  const lastPageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const ids = selectedToIds(selected);
    if (ids.length === 0) return;

    const nodeId = ids[0];
    if (!nodeId) return;

    const nodesMap = nodes as Record<string, { data?: { displayName?: string; parent?: string } } | undefined>;
    if (!nodesMap) return;

    let current: string | null = nodeId;
    let pageId: string | null = null;

    while (current) {
      const node = nodesMap[current] as { data?: { displayName?: string; parent?: string } } | undefined;
      if (!node?.data) break;
      if (node.data.displayName === "Page") {
        pageId = current;
        break;
      }
      current = node.data.parent ?? null;
    }

    if (pageId && pageId !== lastPageIdRef.current) {
      lastPageIdRef.current = pageId;
      const container = document.querySelector("[data-canvas-container]") as HTMLElement | null;
      if (container) {
        container.dispatchEvent(new CustomEvent(SET_CURRENT_PAGE, { detail: { pageId } }));
      }
    }
  }, [selected, nodes]);

  return null;
}

export { SET_CURRENT_PAGE };
