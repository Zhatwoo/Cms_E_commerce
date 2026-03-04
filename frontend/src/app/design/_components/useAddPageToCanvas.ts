"use client";

import { useCallback } from "react";
import { useEditor } from "@craftjs/core";

function toPx(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace("px", "").trim());
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

const VIEWPORT_CENTER_WIDTH = 20000;
const VIEWPORT_CENTER_HEIGHT = 14000;

type AddNodeTreeInput = {
  rootNodeId: string;
  nodes: Record<string, {
    type: { resolvedName: string };
    isCanvas: boolean;
    props: Record<string, unknown>;
    displayName: string;
    nodes: string[];
    linkedNodes: Record<string, string>;
    custom: Record<string, unknown>;
    hidden: boolean;
  }>;
};

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

      const viewportChildren = Array.isArray(nodes[viewportId]?.data?.nodes)
        ? (nodes[viewportId].data.nodes as string[])
        : [];
      const existingPageIds = viewportChildren.filter((id) => nodes[id]?.data?.displayName === "Page");

      const selectedRaw = state.events.selected;
      const selectedIds: string[] = Array.isArray(selectedRaw)
        ? selectedRaw
        : selectedRaw instanceof Set
          ? Array.from(selectedRaw)
          : selectedRaw && typeof selectedRaw === "object"
            ? Object.keys(selectedRaw)
            : [];

      const selectedPageId = selectedIds.find((id) => nodes[id]?.data?.displayName === "Page") ?? null;
      const templatePageId = selectedPageId ?? existingPageIds[0] ?? null;
      const templateProps = templatePageId ? (nodes[templatePageId]?.data?.props as Record<string, unknown> | undefined) : undefined;

      const PAGE_WIDTH = toPx(templateProps?.width, 1440);
      const PAGE_HEIGHT = toPx(templateProps?.height, 900);
      const PAGE_BACKGROUND =
        typeof templateProps?.background === "string" && templateProps.background.trim().length > 0
          ? templateProps.background
          : "#E6E6E9";

      const PAGE_GAP_X = 220;
      const PAGE_GAP_Y = 220;
      const COLUMNS = 3;

      const baseCanvasX =
        typeof templateProps?.canvasX === "number"
          ? templateProps.canvasX
          : Math.round(VIEWPORT_CENTER_WIDTH / 2 - PAGE_WIDTH / 2);
      const baseCanvasY =
        typeof templateProps?.canvasY === "number"
          ? templateProps.canvasY
          : Math.round(VIEWPORT_CENTER_HEIGHT / 2 - PAGE_HEIGHT / 2);

      const col = pageCount % COLUMNS;
      const row = Math.floor(pageCount / COLUMNS);
      const canvasX = baseCanvasX + col * (PAGE_WIDTH + PAGE_GAP_X);
      const canvasY = baseCanvasY + row * (PAGE_HEIGHT + PAGE_GAP_Y);

      const tree: AddNodeTreeInput = {
        rootNodeId: pageId,
        nodes: {
          [pageId]: {
            type: { resolvedName: "Page" },
            isCanvas: true,
            props: {
              pageName,
              width: `${PAGE_WIDTH}px`,
              height: `${PAGE_HEIGHT}px`,
              background: PAGE_BACKGROUND,
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
      (actions as unknown as { addNodeTree?: (tree: AddNodeTreeInput, parentId?: string, index?: number) => void })
        .addNodeTree?.(tree, viewportId);
      onPageAdded?.(pageId, pageName);
    } catch (e) {
      console.error("Add page to canvas failed:", e);
    }
  }, [query, actions, onPageAdded]);

  return addPageToCanvas;
}
