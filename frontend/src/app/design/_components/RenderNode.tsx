import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import ReactDOM from "react-dom";
import { ResizeOverlay } from "./ResizeOverlay";
import { useCanvasTool } from "./CanvasToolContext";
import { useInlineTextEdit } from "./InlineTextEditContext";


function getNodeChildIds(node: Record<string, any> | null | undefined): string[] {
  if (!node || typeof node !== "object") return [];
  const data = (node.data ?? {}) as Record<string, unknown>;
  const fromNodes = (data.nodes ?? node.nodes) as unknown;
  const nodeIds = Array.isArray(fromNodes) ? (fromNodes as string[]) : [];

  const displayName = String((data.displayName as string | undefined) ?? "").trim();
  const shouldIncludeLinked = displayName === "Tabs";
  const fromLinked = shouldIncludeLinked ? ((data.linkedNodes ?? node.linkedNodes) as unknown) : null;
  const linkedIds =
    fromLinked && typeof fromLinked === "object"
      ? Object.values(fromLinked as Record<string, unknown>).filter((v): v is string => typeof v === "string")
      : [];

  return [...nodeIds, ...linkedIds];
}

function getNodeBaseName(node: Record<string, any> | null | undefined): string {
  const data = (node?.data ?? {}) as Record<string, unknown>;
  const custom = (data.custom ?? {}) as Record<string, unknown>;
  const raw = String(custom.displayName ?? data.displayName ?? data.name ?? "").trim();
  return raw || "Node";
}

function buildNodeNameIndexMap(nodes: Record<string, any>): {
  baseNameById: Record<string, string>;
  indexById: Record<string, number>;
  totalByName: Record<string, number>;
} {
  const baseNameById: Record<string, string> = {};
  const indexById: Record<string, number> = {};
  const totalByName: Record<string, number> = {};
  const seen = new Set<string>();

  const visit = (id: string) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    const node = nodes[id] as Record<string, any> | undefined;
    if (!node) return;

    const baseName = getNodeBaseName(node);
    baseNameById[id] = baseName;
    totalByName[baseName] = (totalByName[baseName] ?? 0) + 1;
    indexById[id] = totalByName[baseName];

    for (const childId of getNodeChildIds(node)) {
      visit(childId);
    }
  };

  visit("ROOT");
  for (const id of Object.keys(nodes)) {
    visit(id);
  }

  return { baseNameById, indexById, totalByName };
}

export const RenderNode = ({ render }: { render: React.ReactElement }) => {
  const { activeTool } = useCanvasTool();
  const { editingTextNodeId } = useInlineTextEdit();

  const {
    id,
    dom,
    name,
    visibility,
  } = useNode((node) => ({
    id: node.id,
    dom: node.dom,
    name: node.data.custom.displayName || node.data.displayName,
    visibility: (node.data.props?.visibility as "visible" | "hidden" | undefined) ?? "visible",
  }));
  const suppressPassiveHover = name === "Page";

  const { isActive, actions, query } = useEditor((state, query) => ({
    isActive: query.getEvent("selected").contains(id),
  }));

  const [isDomHovered, setIsDomHovered] = useState(false);
  const pendingSelectTimerRef = useRef<number | null>(null);
  const isHandTool = activeTool === "hand";
  const isDrawingTool = activeTool === "text" || activeTool === "shape";
  const isTextNode = name === "Text";
  const canShowResizeOverlay =
    !isHandTool &&
    !isDrawingTool &&
    isActive &&
    dom &&
    (!isTextNode || editingTextNodeId !== id);

  useEffect(() => {
    if (!dom) return;
    const onEnter = () => setIsDomHovered(true);
    const onLeave = () => setIsDomHovered(false);
    dom.addEventListener("mouseenter", onEnter);
    dom.addEventListener("mouseleave", onLeave);
    return () => {
      dom.removeEventListener("mouseenter", onEnter);
      dom.removeEventListener("mouseleave", onLeave);
    };
  }, [dom]);

  // When Hand tool is active, don't show selection/hover outline or labels on assets
  useEffect(() => {
    if (dom) {
      if (id === "ROOT" || name === "Viewport") {
        dom.classList.remove("component-selected");
        return;
      }

      const isPendingSelected = dom.dataset.pendingSelected === "true";
      const isBoxPreviewSelected = dom.dataset.boxPreviewSelected === "true";
      if (!isHandTool && (isActive || isPendingSelected || isBoxPreviewSelected || (isDomHovered && !suppressPassiveHover))) {
        dom.classList.add("component-selected");
      } else {
        dom.classList.remove("component-selected");
      }
    }
  }, [dom, id, name, isActive, isDomHovered, isHandTool, suppressPassiveHover]);

  useEffect(() => {
    return () => {
      if (pendingSelectTimerRef.current !== null) {
        window.clearTimeout(pendingSelectTimerRef.current);
        pendingSelectTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!dom) return;
    if (id === "ROOT" || name === "Viewport") return;

    const findDeepestNodeId = (element: HTMLElement | null): string | null => {
      if (!element) return null;
      const selfId = element.getAttribute("data-node-id");
      if (selfId) return selfId;
      let current: HTMLElement | null = element;
      while (current && current !== document.body) {
        const nodeId = current.getAttribute("data-node-id");
        if (nodeId) return nodeId;
        current = current.parentElement;
      }
      return null;
    };

    const onMouseDownCapture = (event: MouseEvent) => {
      if (isHandTool) return;
      if (event.button !== 0) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (document.body.dataset.canvasPan === "true") return;
      if (document.body.dataset.spacePan === "true") return;
      if (document.body.dataset.boxSelecting === "true") return;
      if (document.body.dataset.boxSelectingIntent === "true") return;

      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-panel]")) return;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;

      if (!event.ctrlKey && !event.metaKey) {
        try {
          const nodes = query.getState().nodes;
          const selectableGroupNames = new Set(["Container", "Section", "Row", "Column", "Frame", "Banner", "TabContent", "Tab Content"]);
          const clickedNodeId = findDeepestNodeId(target);
          if (clickedNodeId && clickedNodeId !== id) return;

          const clickedNode = nodes[id];
          const clickedDisplayName = clickedNode?.data?.displayName as string | undefined;
          const clickedIsCanvas = clickedNode?.data?.isCanvas === true;
          const clickedIsPageLike = clickedDisplayName === "Page" || clickedDisplayName === "Viewport";
          const clickedIsGroup = clickedIsCanvas || (clickedDisplayName && selectableGroupNames.has(clickedDisplayName));

          if (clickedIsGroup && !clickedIsPageLike) {
            if (event.cancelable) event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function" && clickedDisplayName !== "Section") {
              event.stopImmediatePropagation();
            }
            actions.selectNode(id);
            return;
          }

        } catch {
          // ignore
        }
      }

      dom.dataset.pendingSelected = "true";
      dom.classList.add("component-selected");
      if (pendingSelectTimerRef.current !== null) {
        window.clearTimeout(pendingSelectTimerRef.current);
      }
      pendingSelectTimerRef.current = window.setTimeout(() => {
        if (!dom) return;
        delete dom.dataset.pendingSelected;
        pendingSelectTimerRef.current = null;
      }, 220);

      try {
        actions.selectNode(id);
      } catch {
        // ignore
      }
    };

    dom.addEventListener("mousedown", onMouseDownCapture, true);
    return () => {
      dom.removeEventListener("mousedown", onMouseDownCapture, true);
    };
  }, [actions, dom, id, name, isHandTool, query]);

  const [rect, setRect] = useState<DOMRect | null>(null);
  const shouldTrackRect = !!(isActive || isDomHovered);

  useEffect(() => {
    if (!dom || !shouldTrackRect) {
      if (!shouldTrackRect) setRect(null);
      return;
    }

    const update = () => {
      const next = dom.getBoundingClientRect();
      setRect((prev) => {
        if (!prev) return next;
        if (
          Math.abs(prev.left - next.left) < 0.5 &&
          Math.abs(prev.top - next.top) < 0.5 &&
          Math.abs(prev.width - next.width) < 0.5 &&
          Math.abs(prev.height - next.height) < 0.5
        ) return prev;
        return next;
      });
    };

    update();

    const scrollUpdate = () => requestAnimationFrame(update);
    window.addEventListener("scroll", scrollUpdate, true);
    window.addEventListener("resize", scrollUpdate);

    const interval = setInterval(update, 600);

    return () => {
      window.removeEventListener("scroll", scrollUpdate, true);
      window.removeEventListener("resize", scrollUpdate);
      clearInterval(interval);
    };
  }, [dom, shouldTrackRect]);

  const isLabelVisible = !isHandTool && ((isDomHovered && !suppressPassiveHover) || isActive) && dom && rect;
  const numberedLabel = useMemo(() => {
    if (!isLabelVisible) return name;
    try {
      const nodes = (query.getState().nodes ?? {}) as Record<string, any>;
      const map = buildNodeNameIndexMap(nodes);
      const baseName = map.baseNameById[id] || name || "Node";
      const total = map.totalByName[baseName] ?? 1;
      const index = map.indexById[id] ?? 1;
      return total > 1 ? `${baseName} ${index}` : baseName;
    } catch {
      return name;
    }
  }, [isLabelVisible, query, id, name]);

  // Don't render overlays for ROOT/Viewport shells only
  if (id === "ROOT" || name === "Viewport") {
    return <>{render}</>;
  }

  return (
    <>
      {/* Label overlay (portal) removed as requested */}

      {/* Resize / Move overlay — active nodes, including Text when not inline editing */}
      {canShowResizeOverlay ? (
        <ResizeOverlay
          nodeId={id}
          dom={dom}
          disableRotate={name === "Section"}
          disableResize={name === "Product Slider"}
        />
      ) : null}

      <div
        style={
          visibility === "hidden"
            ? { visibility: "hidden" as const, pointerEvents: "none" as const }
            : { display: "contents" }
        }
      >
        {render}
      </div>
    </>
  );
};
