import React, { useEffect, useRef, useState } from "react";
import { useEditor, useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";

const PAGE_BASE_WIDTH = 1440;
const PAGE_BASE_HEIGHT = 900;
const PAGE_GAP_X = 220;
const PAGE_GAP_Y = 220;
const PAGE_COLUMNS = 3;
const VIEWPORT_BASE_MIN_WIDTH = 240000;
const VIEWPORT_BASE_MIN_HEIGHT = 240000;
const VIEWPORT_EDGE_PADDING = 30000;
const PAGE_GRID_ORIGIN_X = 30000;
const PAGE_GRID_ORIGIN_Y = 30000;
// Extra space for mobile previews beside each page
const MOBILE_PREVIEW_SAFE_WIDTH = 520;


function parsePx(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = parseFloat(value.replace("px", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function toDimensionPx(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parsePx(value);
    if (parsed !== null && parsed > 0) return parsed;
  }
  return fallback;
}

export const Viewport = ({ children }: { children?: React.ReactNode }) => {
  const viewportRootRef = useRef<HTMLDivElement | null>(null);
  const desktopCanvasRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState({
    minWidth: VIEWPORT_BASE_MIN_WIDTH,
    minHeight: VIEWPORT_BASE_MIN_HEIGHT,
  });
  const { id: viewportId, connectors: { connect, drag } } = useNode((node) => ({
    id: node.id,
  }));
  const { actions, query } = useEditor();
  const actionsRef = useRef(actions);
  const queryRef = useRef(query);
  actionsRef.current = actions;
  queryRef.current = query;

  useEffect(() => {
    const state = queryRef.current.getState();
    const nodes = state?.nodes ?? {};
    const viewportNode = nodes[viewportId];
    const pageIds: string[] = Array.isArray(viewportNode?.data?.nodes)
      ? viewportNode.data.nodes
      : [];

    let maxRight = 0;
    let maxBottom = 0;

    pageIds.forEach((pageId, index) => {
      const pageNode = nodes[pageId];
      const dname = pageNode?.data?.displayName;
      if (!pageNode || (dname !== "Page" && dname?.toLowerCase() !== "page")) return;

      const props = (pageNode.data?.props ?? {}) as Record<string, unknown>;
      const hasCanvasX = typeof props.canvasX === "number";
      const hasCanvasY = typeof props.canvasY === "number";
      const needsFallbackPosition = !hasCanvasX || !hasCanvasY;

      const col = index % PAGE_COLUMNS;
      const row = Math.floor(index / PAGE_COLUMNS);
      const canvasX = PAGE_GRID_ORIGIN_X + col * (PAGE_BASE_WIDTH + PAGE_GAP_X);
      const canvasY = PAGE_GRID_ORIGIN_Y + row * (PAGE_BASE_HEIGHT + PAGE_GAP_Y);

      const finalCanvasX = hasCanvasX ? Number(props.canvasX) : canvasX;
      const finalCanvasY = hasCanvasY ? Number(props.canvasY) : canvasY;
      const pageWidth = toDimensionPx(props.width, PAGE_BASE_WIDTH);
      const pageHeight = toDimensionPx(props.height, PAGE_BASE_HEIGHT);

      maxRight = Math.max(maxRight, finalCanvasX + pageWidth);
      maxBottom = Math.max(maxBottom, finalCanvasY + pageHeight);

      if (needsFallbackPosition) {
        actionsRef.current.setProp(pageId, (pageProps: Record<string, unknown>) => {
          if (typeof pageProps.canvasX !== "number") pageProps.canvasX = canvasX;
          if (typeof pageProps.canvasY !== "number") pageProps.canvasY = canvasY;
        });
      }
    });

    const desktopRoot = desktopCanvasRef.current;
    let domMaxRight = 0;
    let domMaxBottom = 0;

    if (desktopRoot) {
      const rootRect = desktopRoot.getBoundingClientRect();
      const nodeEls = Array.from(desktopRoot.querySelectorAll<HTMLElement>("[data-node-id]"));
      for (const el of nodeEls) {
        const rect = el.getBoundingClientRect();
        const right = rect.right - rootRect.left;
        const bottom = rect.bottom - rootRect.top;
        if (Number.isFinite(right)) domMaxRight = Math.max(domMaxRight, right);
        if (Number.isFinite(bottom)) domMaxBottom = Math.max(domMaxBottom, bottom);
      }
    }

    const dynamicMinWidth = Math.max(
      VIEWPORT_BASE_MIN_WIDTH,
      Math.ceil(Math.max(maxRight, domMaxRight) + VIEWPORT_EDGE_PADDING + MOBILE_PREVIEW_SAFE_WIDTH)
    );
    const dynamicMinHeight = Math.max(
      VIEWPORT_BASE_MIN_HEIGHT,
      Math.ceil(Math.max(maxBottom, domMaxBottom) + VIEWPORT_EDGE_PADDING)
    );

    setViewportSize((prev) => {
      const widthChanged = Math.abs(prev.minWidth - dynamicMinWidth) >= 1;
      const heightChanged = Math.abs(prev.minHeight - dynamicMinHeight) >= 1;
      if (!widthChanged && !heightChanged) {
        return prev;
      }
      return { minWidth: dynamicMinWidth, minHeight: dynamicMinHeight };
    });
    // Keep deps array constant size (React requirement); use refs to avoid loop from actions/query changing
  }, [viewportId, actionsRef, queryRef]);

  return (
    <div
      ref={(ref) => {
        viewportRootRef.current = ref;
        if (ref) connect(drag(ref));
      }}
      className="relative p-32"
      style={{ minWidth: `${viewportSize.minWidth}px`, minHeight: `${viewportSize.minHeight}px` }}
    >
      <div data-viewport-desktop className="relative w-full h-full" ref={desktopCanvasRef}>
        {children}
      </div>
    </div>
  );
};


Viewport.craft = {
  displayName: "Viewport",
  rules: {
    canMoveIn: (incomingNodes: Node[]) => {
      return incomingNodes.every((node) => {
        const dname = node?.data?.displayName;
        if (!dname) return false;
        const lowered = dname.toLowerCase();
        return lowered === "page" || lowered.includes("page");
      });
    },
  },
};
