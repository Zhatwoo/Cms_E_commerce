import React, { useEffect, useRef, useState } from "react";
import { useEditor, useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";

const MOBILE_WIDTH = 390;
const MOBILE_MIN_HEIGHT = 640;
const MOBILE_SIDE_GUTTER = 14;
const MOBILE_INNER_WIDTH = MOBILE_WIDTH - MOBILE_SIDE_GUTTER * 2;
const PAGE_BASE_WIDTH = 1920;
const PAGE_BASE_HEIGHT = 1200;
const PAGE_GAP_X = 220;
const PAGE_GAP_Y = 220;
const PAGE_COLUMNS = 3;
const VIEWPORT_BASE_MIN_WIDTH = 20000;
const VIEWPORT_BASE_MIN_HEIGHT = 14000;
const VIEWPORT_EDGE_PADDING = 6000;
const MOBILE_PREVIEW_SAFE_WIDTH = 520;
const PAGE_GRID_ORIGIN_X = Math.round(VIEWPORT_BASE_MIN_WIDTH / 2 - PAGE_BASE_WIDTH / 2);
const PAGE_GRID_ORIGIN_Y = Math.round(VIEWPORT_BASE_MIN_HEIGHT / 2 - PAGE_BASE_HEIGHT / 2);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

function asElements(collection: HTMLCollection): HTMLElement[] {
  return Array.from(collection).filter((el): el is HTMLElement => el instanceof HTMLElement);
}

function applyHamburgerIfNeeded(root: HTMLElement): HTMLElement | null {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>("*"));
  const header = candidates.find((el) => {
    if ((el.style.display || "").toLowerCase() !== "flex") return false;
    const direction = (el.style.flexDirection || "row").toLowerCase();
    if (direction !== "row") return false;

    const children = asElements(el.children);
    if (children.length < 3) return false;

    const readable = children.filter((child) => {
      const text = (child.textContent || "").trim();
      return text.length >= 2 && text.length <= 24;
    }).length;

    return readable >= 3;
  });

  if (!header) return null;

  const children = asElements(header.children);
  if (children.length < 3) return null;

  const logo = children[0];
  const menuItems = children.slice(1);

  header.dataset.mobileNavRoot = "true";

  header.style.flexDirection = "row";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.flexWrap = "nowrap";
  header.style.gap = "12px";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.textContent = "☰";
  toggle.setAttribute("aria-label", "Toggle menu");
  toggle.style.display = "inline-flex";
  toggle.style.alignItems = "center";
  toggle.style.justifyContent = "center";
  toggle.style.width = "34px";
  toggle.style.height = "34px";
  toggle.style.border = "1px solid rgba(255,255,255,0.25)";
  toggle.style.borderRadius = "8px";
  toggle.style.background = "transparent";
  toggle.style.color = "inherit";
  toggle.style.cursor = "pointer";

  const menu = document.createElement("div");
  menu.style.display = "none";
  menu.style.flexDirection = "column";
  menu.style.gap = "8px";
  menu.style.padding = "10px 0 0";
  menu.style.width = "100%";

  menuItems.forEach((item) => {
    item.style.position = "static";
    item.style.top = "auto";
    item.style.right = "auto";
    item.style.bottom = "auto";
    item.style.left = "auto";
    item.style.transform = "none";
    item.style.display = "block";
    item.style.width = "100%";
    item.style.textAlign = "left";
    item.style.margin = "0";
    menu.appendChild(item);
  });

  const shell = document.createElement("div");
  shell.dataset.mobileNavShell = "true";
  shell.style.width = "100%";
  shell.appendChild(menu);

  toggle.onclick = () => {
    menu.style.display = menu.style.display === "none" ? "flex" : "none";
  };

  header.textContent = "";
  logo.style.position = "static";
  logo.style.top = "auto";
  logo.style.right = "auto";
  logo.style.bottom = "auto";
  logo.style.left = "auto";
  logo.style.transform = "none";
  header.appendChild(logo);
  header.appendChild(toggle);
  header.insertAdjacentElement("afterend", shell);
  return header;
}

function adaptCloneForMobile(root: HTMLElement) {
  const mobileNavHeader = applyHamburgerIfNeeded(root);
  const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  all.forEach((el) => {
    el.dataset.mobilePreviewClone = "true";

    el.style.boxSizing = "border-box";
    el.style.maxWidth = "100%";

    if (el === root) {
      el.style.overflowX = "hidden";
    }

    const isMobileNavHeader = el === mobileNavHeader || el.dataset.mobileNavRoot === "true";
    const isMobileNavShell = el.dataset.mobileNavShell === "true";

    const position = (el.style.position || "").toLowerCase();
    const children = asElements(el.children);
    const hasChildren = children.length > 0;
    const textContent = (el.textContent || "").trim();
    const hasReadableText = textContent.length > 0;
    const tag = el.tagName.toLowerCase();
    const isMediaElement = ["img", "svg", "canvas", "video", "path"].includes(tag);
    if (position === "absolute" || position === "fixed") {
      const insideMobileNav = !!el.closest("[data-mobile-nav-root='true']") || !!el.closest("[data-mobile-nav-shell='true']");
      if (insideMobileNav) {
        el.style.position = "static";
        el.style.top = "auto";
        el.style.right = "auto";
        el.style.bottom = "auto";
        el.style.left = "auto";
        el.style.transform = "none";
      }
    }

    const widthPx = parsePx(el.style.width);
    if (widthPx !== null && widthPx > MOBILE_INNER_WIDTH) {
      el.style.width = "100%";
    }

    if (!isMediaElement && hasReadableText && widthPx !== null && widthPx > 0 && widthPx < 140) {
      el.style.width = "100%";
      el.style.minWidth = "0px";
    }

    const minWidthPx = parsePx(el.style.minWidth);
    if (minWidthPx !== null && minWidthPx > MOBILE_INNER_WIDTH) {
      el.style.minWidth = "0px";
    }

    const leftPx = parsePx(el.style.left);
    if (leftPx !== null && (leftPx > 8 || leftPx < 0)) {
      el.style.left = "0px";
    }

    const rightPx = parsePx(el.style.right);
    if (rightPx !== null && (rightPx > 8 || rightPx < 0)) {
      el.style.right = "0px";
    }

    const marginLeftPx = parsePx(el.style.marginLeft);
    if (marginLeftPx !== null && marginLeftPx > 20) {
      el.style.marginLeft = "0px";
    }

    const marginRightPx = parsePx(el.style.marginRight);
    if (marginRightPx !== null && marginRightPx > 20) {
      el.style.marginRight = "0px";
    }

    const horizontalPaddingLeft = parsePx(el.style.paddingLeft);
    if (horizontalPaddingLeft !== null && horizontalPaddingLeft > 20) {
      el.style.paddingLeft = `${clamp(horizontalPaddingLeft, 8, 20)}px`;
    }

    const horizontalPaddingRight = parsePx(el.style.paddingRight);
    if (horizontalPaddingRight !== null && horizontalPaddingRight > 20) {
      el.style.paddingRight = `${clamp(horizontalPaddingRight, 8, 20)}px`;
    }

    const heightPx = parsePx(el.style.height);
    if (heightPx !== null && hasChildren && heightPx > 520) {
      el.style.height = "auto";
      if (!el.style.minHeight) {
        el.style.minHeight = "0px";
      }
    }

    const minHeightPx = parsePx(el.style.minHeight);
    if (minHeightPx !== null && minHeightPx > 680) {
      el.style.minHeight = "0px";
    }

    if ((el.style.display || "").toLowerCase() === "grid") {
      const gridCols = (el.style.gridTemplateColumns || "").trim();
      if (gridCols.includes(" ")) {
        el.style.gridTemplateColumns = "1fr";
      }
    }

    if ((el.style.display || "").toLowerCase() === "flex") {
      const direction = (el.style.flexDirection || "row").toLowerCase();
      if (direction === "row" && !isMobileNavHeader && !isMobileNavShell) {
        const childCount = children.length;
        const widthPx = parsePx(el.style.width);
        const fixedChildrenWidth = children.reduce((sum, child) => {
          const childWidth = parsePx(child.style.width);
          return sum + (childWidth ?? 0);
        }, 0);
        const shouldStack =
          childCount > 1 &&
          (
            (widthPx !== null && widthPx > MOBILE_INNER_WIDTH) ||
            fixedChildrenWidth > MOBILE_INNER_WIDTH * 0.9
          );
        if (shouldStack) {
          el.style.flexDirection = "column";
          el.style.alignItems = "stretch";
          el.style.justifyContent = "flex-start";
          if (!el.style.gap) el.style.gap = "10px";
          children.forEach((child) => {
            child.style.maxWidth = "100%";
            const childWidth = parsePx(child.style.width);
            if (childWidth !== null) {
              child.style.width = "100%";
              child.style.minWidth = "0px";
            }
          });
        }
      }
    }

    el.style.wordBreak = "normal";
    el.style.overflowWrap = "break-word";
  });

  root.style.width = "100%";
  root.style.minWidth = "0px";
  root.style.paddingLeft = `${MOBILE_SIDE_GUTTER}px`;
  root.style.paddingRight = `${MOBILE_SIDE_GUTTER}px`;
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

  useEffect(() => {
    const state = query.getState();
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
        actions.setProp(pageId, (pageProps: Record<string, unknown>) => {
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
      if (prev.minWidth === dynamicMinWidth && prev.minHeight === dynamicMinHeight) {
        return prev;
      }
      return { minWidth: dynamicMinWidth, minHeight: dynamicMinHeight };
    });
  }, [actions, query, viewportId, children]);

  useEffect(() => {
    const root = viewportRootRef.current;
    if (!root || mobilePositionInitializedRef.current) return;

    const left = Math.max(16, root.clientWidth - MOBILE_WIDTH - 16);
    setMobilePanelPos({ top: 16, left });
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
      const source = desktopRoot.querySelector("[data-node-id]") as HTMLElement | null;
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

      const desktopNodeEl = desktopRoot.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`);
      const canvasContainer = desktopRoot.closest("[data-canvas-container]") as HTMLElement | null;
      if (desktopNodeEl && canvasContainer) {
        const containerRect = canvasContainer.getBoundingClientRect();
        const nodeRect = desktopNodeEl.getBoundingClientRect();
        const centerX = nodeRect.left + nodeRect.width / 2;
        const centerY = nodeRect.top + nodeRect.height / 2;
        const targetScrollLeft = canvasContainer.scrollLeft + (centerX - (containerRect.left + containerRect.width / 2));
        const targetScrollTop = canvasContainer.scrollTop + (centerY - (containerRect.top + containerRect.height / 2));
        canvasContainer.scrollTo({
          left: Math.max(0, targetScrollLeft),
          top: Math.max(0, targetScrollTop),
          behavior: "smooth",
        });
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
  }, [children, actions, query, viewportId]);

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

      <div
        className="absolute flex flex-col gap-2 select-none z-20 pointer-events-auto"
        style={{ top: mobilePanelPos.top, left: mobilePanelPos.left }}
        onMouseDown={(event) => event.stopPropagation()}
        onMouseMove={(event) => event.stopPropagation()}
        onMouseUp={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
      >
        <span
          className="text-xs uppercase tracking-wide text-brand-light/70 cursor-move"
          onMouseDown={(event) => {
            const root = viewportRootRef.current;
            if (!root) return;
            const rootRect = root.getBoundingClientRect();
            dragOffsetRef.current = {
              x: event.clientX - rootRect.left - mobilePanelPos.left,
              y: event.clientY - rootRect.top - mobilePanelPos.top,
            };
            setIsDraggingMobilePanel(true);
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          Mobile
        </span>
        <div
          ref={mobileCanvasRef}
          className="w-[390px] min-h-[640px] rounded-lg border border-white/10 bg-brand-white/5 overflow-hidden pointer-events-auto"
          aria-hidden
        />
      </div>
    </div>
  );
};

Viewport.craft = {
  displayName: "Viewport",
  rules: {
    canMoveIn: (incomingNodes: Node[]) =>
      incomingNodes.every((node) => node.data.displayName === "Page"),
  }
};
