"use client";

import { useCallback } from "react";
import { useEditor } from "@craftjs/core";

/**
 * Returns a function that adds a new Page node to the Viewport on the canvas via Craft.js.
 * Use for "Add Page" button / FAB so users can add pages without dragging from the panel.
 */
export function useAddPageToCanvas(onPageAdded?: (id: string, name: string) => void) {
  const { actions, query } = useEditor();

  const addPageToCanvas = useCallback(() => {
    try {
      const state = query.getState();
      const nodes = state?.nodes ?? {};
      const rootNode = nodes["ROOT"];
      if (!rootNode?.data?.nodes?.length) return;
      const frameRootId = rootNode.data.nodes[0];
      const frameRoot = nodes[frameRootId];
      const viewportId = frameRoot?.data?.nodes?.[0] ?? null;
      if (!viewportId || nodes[viewportId]?.data?.displayName !== "Viewport") return;

      const pageCount = Object.values(nodes).filter((n) => n?.data?.displayName === "Page").length;
      const pageNum = pageCount + 1;
      const pageId = `page-${Date.now()}`;
      const pageName = `Page ${pageNum}`;
      const PAGE_WIDTH = 1920;
      const PAGE_HEIGHT = 1200;
      const PAGE_GAP_X = 220;
      const PAGE_GAP_Y = 220;
      const COLUMNS = 3;
      const col = pageCount % COLUMNS;
      const row = Math.floor(pageCount / COLUMNS);
      const canvasX = col * (PAGE_WIDTH + PAGE_GAP_X);
      const canvasY = row * (PAGE_HEIGHT + PAGE_GAP_Y);

      const tree = {
        rootNodeId: pageId,
        nodes: {
          [pageId]: {
            type: { resolvedName: "Page" },
            isCanvas: true,
            props: {
              pageName,
              width: `${PAGE_WIDTH}px`,
              height: `${PAGE_HEIGHT}px`,
              background: "#E6E6E9",
              canvasX,
              canvasY,
            },
            displayName: "Page",
            nodes: [],
            linkedNodes: {},
            custom: {},
            hidden: false,
          },
        },
      };
      (actions as { addNodeTree?: (tree: typeof tree, parentId: string) => void }).addNodeTree?.(tree, viewportId);
      onPageAdded?.(pageId, pageName);
    } catch (e) {
      console.error("Add page to canvas failed:", e);
    }
  }, [query, actions, onPageAdded]);

  return addPageToCanvas;
}
