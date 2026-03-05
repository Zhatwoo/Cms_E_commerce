import React, { useEffect, useRef, useState } from "react";
import { useEditor, useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";

const PAGE_BASE_WIDTH = 1920;
const PAGE_BASE_HEIGHT = 1200;
const PAGE_GAP_X = 220;
const PAGE_GAP_Y = 220;
const PAGE_COLUMNS = 3;
const VIEWPORT_BASE_MIN_WIDTH = 240000;
const VIEWPORT_BASE_MIN_HEIGHT = 240000;
const VIEWPORT_EDGE_PADDING = 100000;
const PAGE_GRID_ORIGIN_X = VIEWPORT_EDGE_PADDING;
const PAGE_GRID_ORIGIN_Y = VIEWPORT_EDGE_PADDING;
// Extra space for mobile previews beside each page
const MOBILE_PREVIEW_SAFE_WIDTH = 520;
const MOBILE_WIDTH = 390;
const MOBILE_MIN_HEIGHT = 640;
const MOBILE_PREVIEW_GAP = 200;
const MOBILE_PREVIEW_LABEL_OFFSET = 0;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function adaptCloneForMobile(root: HTMLElement) {
  const contentMaxWidth = MOBILE_WIDTH - 28;
  const contentInset = 14;
  const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
  all.forEach((el) => {
    el.style.boxSizing = "border-box";
    el.style.maxWidth = "100%";
    el.style.minWidth = "0px";
    el.style.transition = "all 180ms ease";

    const nodeId = el.getAttribute("data-node-id");
    if (nodeId && nodeId !== "ROOT") {
      const currentWidth = el.style.width;
      const widthPx = parsePx(currentWidth);
      if (widthPx !== null && widthPx > contentMaxWidth) {
        el.style.width = "100%";
      }
      if (!currentWidth || currentWidth === "auto") {
        el.style.width = "100%";
      }

      const heightPx = parsePx(el.style.height);
      if (heightPx !== null && heightPx > 420) {
        el.style.height = "auto";
      }

      const position = (el.style.position || "").toLowerCase();
      if (position === "absolute" || position === "fixed") {
        const leftPx = parsePx(el.style.left);
        const rightPx = parsePx(el.style.right);
        const topPx = parsePx(el.style.top);
        const bottomPx = parsePx(el.style.bottom);
        const likelyOverflowingFlow =
          (widthPx !== null && widthPx > contentMaxWidth) ||
          (leftPx !== null && leftPx > contentInset) ||
          (rightPx !== null && rightPx > contentInset) ||
          (topPx !== null && topPx > 32) ||
          (bottomPx !== null && bottomPx > 32);

        if (likelyOverflowingFlow) {
          el.style.position = "relative";
          el.style.top = "auto";
          el.style.right = "auto";
          el.style.bottom = "auto";
          el.style.left = "auto";
          el.style.width = "100%";
          el.style.maxWidth = "100%";
          el.style.marginLeft = "0";
          el.style.marginRight = "0";
          el.style.transform = "none";
          el.style.transformOrigin = "top left";
        }
      }
    }

    const layout = el.getAttribute("data-layout");
    if (layout === "row") {
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.flexWrap = "nowrap";
      el.style.alignItems = "stretch";
      el.style.gap = "12px";
      el.style.width = "100%";
    }

    if (layout === "column") {
      el.style.width = "100%";
      el.style.flex = "none";
    }

    const fontPx = parsePx(el.style.fontSize);
    if (fontPx !== null && fontPx > 30) {
      const scaled = Math.max(14, Math.round(fontPx * 0.62));
      el.style.fontSize = `${scaled}px`;
    }

    const lineHeightRaw = Number.parseFloat(el.style.lineHeight || "");
    if (Number.isFinite(lineHeightRaw) && lineHeightRaw > 2.2) {
      el.style.lineHeight = "1.4";
    }

    const padL = parsePx(el.style.paddingLeft);
    const padR = parsePx(el.style.paddingRight);
    if (padL !== null && padL > 24) el.style.paddingLeft = "16px";
    if (padR !== null && padR > 24) el.style.paddingRight = "16px";

    const marginL = parsePx(el.style.marginLeft);
    const marginR = parsePx(el.style.marginRight);
    if (marginL !== null && marginL > 24) el.style.marginLeft = "12px";
    if (marginR !== null && marginR > 24) el.style.marginRight = "12px";

    if (el.tagName === "BUTTON") {
      const buttonWidthPx = parsePx(el.style.width);
      if (!el.style.width || el.style.width === "auto") {
        el.style.width = "fit-content";
      }
      if (buttonWidthPx !== null && buttonWidthPx > contentMaxWidth) {
        el.style.width = "100%";
      }
      el.style.maxWidth = "100%";
      el.style.whiteSpace = "normal";
      el.style.wordBreak = "break-word";
    }

    if (el.tagName === "IMG" || el.tagName === "VIDEO" || el.tagName === "IFRAME") {
      const mediaWidthPx = parsePx(el.style.width);
      if (mediaWidthPx !== null && mediaWidthPx > contentMaxWidth) {
        el.style.width = "100%";
      }
      const mediaHeightPx = parsePx(el.style.height);
      if (mediaHeightPx !== null && mediaHeightPx > 420) {
        el.style.height = "auto";
      }
      el.style.maxWidth = "100%";
      el.style.height = el.style.height || "auto";
    }
  });

  const rowChildren = Array.from(root.querySelectorAll<HTMLElement>("[data-layout='row'] > [data-node-id]"));
  rowChildren.forEach((child) => {
    child.style.width = "100%";
    child.style.maxWidth = "100%";
    child.style.flex = "none";
  });

  root.style.width = "100%";
  root.style.minWidth = "0px";
  root.style.overflowX = "hidden";
  root.style.paddingLeft = "14px";
  root.style.paddingRight = "14px";
  root.style.transition = "all 180ms ease";
}

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
  const mobileCanvasRef = useRef<HTMLDivElement | null>(null);
  const [mobilePanelPos, setMobilePanelPos] = useState({ top: 16, left: 0 });
  const [isDraggingMobilePanel, setIsDraggingMobilePanel] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const mobilePositionInitializedRef = useRef(false);
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
      if (!pageNode || pageNode.data?.displayName !== "Page") return;

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

  useEffect(() => {
    const root = viewportRootRef.current;
    if (!root || mobilePositionInitializedRef.current) return;

    const desktopRoot = desktopCanvasRef.current;
    const rootRect = root.getBoundingClientRect();
    let contentRight = 16;
    let contentTop = 16;
    let desktopOffsetLeft = 0;
    let desktopOffsetTop = 0;

    if (desktopRoot) {
      const desktopRect = desktopRoot.getBoundingClientRect();
      desktopOffsetLeft = desktopRect.left - rootRect.left;
      desktopOffsetTop = desktopRect.top - rootRect.top;
      const pageNodes = Array.from(desktopRoot.querySelectorAll<HTMLElement>("[data-page-node='true']"));
      if (pageNodes.length > 0) {
        const rootCenterX = rootRect.left + rootRect.width / 2;
        const rootCenterY = rootRect.top + rootRect.height / 2;

        let closestNode: HTMLElement | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        for (const node of pageNodes) {
          const rect = node.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const distance = Math.hypot(centerX - rootCenterX, centerY - rootCenterY);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestNode = node;
          }
        }

        if (closestNode) {
          const nodeRight = desktopOffsetLeft + closestNode.offsetLeft + closestNode.offsetWidth;
          const nodeTop = desktopOffsetTop + closestNode.offsetTop;
          if (Number.isFinite(nodeRight)) contentRight = Math.max(contentRight, nodeRight);
          if (Number.isFinite(nodeTop)) contentTop = Math.max(16, nodeTop);
        }
      }
    }

    const desiredLeft = contentRight + MOBILE_PREVIEW_GAP;
    const panelHeight = MOBILE_MIN_HEIGHT + 32;
    const maxLeft = Math.max(16, root.clientWidth - MOBILE_WIDTH - 16);
    const maxTop = Math.max(16, root.clientHeight - panelHeight - 16);
    const left = clamp(desiredLeft, 16, maxLeft);
    const top = clamp(contentTop - MOBILE_PREVIEW_LABEL_OFFSET, 16, maxTop);
    setMobilePanelPos({ top, left });
    mobilePositionInitializedRef.current = true;
  }, [viewportSize.minWidth, viewportSize.minHeight]);

  useEffect(() => {
    if (!isDraggingMobilePanel) return;

    const handleMove = (event: MouseEvent) => {
      const root = viewportRootRef.current;
      if (!root) return;
      const rootRect = root.getBoundingClientRect();
      const panelWidth = MOBILE_WIDTH;
      const panelHeight = MOBILE_MIN_HEIGHT + 32;

      const desiredLeft = event.clientX - rootRect.left - dragOffsetRef.current.x;
      const desiredTop = event.clientY - rootRect.top - dragOffsetRef.current.y;
      const maxLeft = Math.max(16, root.clientWidth - panelWidth - 16);
      const maxTop = Math.max(16, root.clientHeight - panelHeight - 16);

      setMobilePanelPos({
        left: clamp(desiredLeft, 16, maxLeft),
        top: clamp(desiredTop, 16, maxTop),
      });
    };

    const handleUp = () => {
      setIsDraggingMobilePanel(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingMobilePanel]);

  useEffect(() => {
    const desktopRoot = desktopCanvasRef.current;
    const mobileRoot = mobileCanvasRef.current;
    if (!desktopRoot || !mobileRoot) return;

    let frame = 0;

    const renderMobilePreview = () => {
      const source = desktopRoot.querySelector("[data-page-node='true'][data-node-id]") as HTMLElement | null;
      if (!source) {
        mobileRoot.innerHTML = "";
        return;
      }

      const clone = source.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-node-id");
      clone.style.pointerEvents = "auto";
      clone.style.margin = "0";
      clone.style.transformOrigin = "top left";
      clone.style.width = "100%";
      clone.style.height = "auto";
      clone.style.transform = "none";
      clone.dataset.mobilePreviewRoot = "true";

      adaptCloneForMobile(clone);
      const interactiveNodes = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))];
      interactiveNodes.forEach((el) => {
        el.style.pointerEvents = "auto";
      });

      let selectedNodeId: string | null = null;
      try {
        selectedNodeId = query.getEvent("selected").first() ?? null;
      } catch {
        selectedNodeId = null;
      }

      if (selectedNodeId) {
        const selectedEl = clone.querySelector<HTMLElement>(`[data-node-id="${selectedNodeId}"]`);
        if (selectedEl) {
          selectedEl.style.outline = "2px solid #3b82f6";
          selectedEl.style.outlineOffset = "1px";
        }
      }

      mobileRoot.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.style.width = `${MOBILE_WIDTH}px`;
      wrapper.style.minHeight = `${MOBILE_MIN_HEIGHT}px`;
      wrapper.style.height = "auto";
      wrapper.style.overflow = "auto";
      wrapper.style.position = "relative";
      wrapper.style.background = "#e5e7eb";
      wrapper.style.borderRadius = "0.5rem";
      wrapper.style.padding = "0";
      wrapper.style.boxSizing = "border-box";
      wrapper.style.overflowX = "hidden";
      wrapper.appendChild(clone);
      mobileRoot.appendChild(wrapper);
    };

    const queueRender = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(renderMobilePreview);
    };

    const handleMobileMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const nodeEl = target.closest<HTMLElement>("[data-node-id]");
      if (!nodeEl) return;

      const nodeId = nodeEl.getAttribute("data-node-id");
      if (!nodeId || nodeId === "ROOT" || nodeId === viewportId) return;

      if (!query.getState().nodes[nodeId]) return;

      event.preventDefault();
      event.stopPropagation();
      actions.selectNode(nodeId);

      const canvasContainer = desktopRoot.closest("[data-canvas-container]") as HTMLElement | null;
      if (canvasContainer) {
        canvasContainer.dispatchEvent(
          new CustomEvent("center-on-node", { detail: { nodeId } })
        );
      }

      queueRender();
    };

    const blockCanvasPanFromMobile = (event: Event) => {
      event.stopPropagation();
    };

    const mutation = new MutationObserver(queueRender);
    mutation.observe(desktopRoot, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });

    const resizeObserver = new ResizeObserver(queueRender);
    resizeObserver.observe(desktopRoot);

    mobileRoot.addEventListener("mousedown", handleMobileMouseDown, true);
    mobileRoot.addEventListener("mousedown", blockCanvasPanFromMobile, true);
    mobileRoot.addEventListener("mousemove", blockCanvasPanFromMobile, true);
    mobileRoot.addEventListener("mouseup", blockCanvasPanFromMobile, true);
    mobileRoot.addEventListener("wheel", blockCanvasPanFromMobile, { capture: true });

    queueRender();

    return () => {
      cancelAnimationFrame(frame);
      mutation.disconnect();
      resizeObserver.disconnect();
      mobileRoot.removeEventListener("mousedown", handleMobileMouseDown, true);
      mobileRoot.removeEventListener("mousedown", blockCanvasPanFromMobile, true);
      mobileRoot.removeEventListener("mousemove", blockCanvasPanFromMobile, true);
      mobileRoot.removeEventListener("mouseup", blockCanvasPanFromMobile, true);
      mobileRoot.removeEventListener("wheel", blockCanvasPanFromMobile, true);
    };
  }, [actions, query, viewportId]);

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
      return incomingNodes.every((node) => node?.data?.displayName === "Page");
    },
  },
};
