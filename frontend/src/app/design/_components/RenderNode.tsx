import React, { useEffect, useRef, useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import ReactDOM from "react-dom";
import { ResizeOverlay } from "./ResizeOverlay";
import { useCanvasTool } from "./CanvasToolContext";
import { useInlineTextEdit } from "./InlineTextEditContext";

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

  const { isActive, actions } = useEditor((_, query) => ({
    isActive: query.getEvent('selected').contains(id),
  }));

  const [isDomHovered, setIsDomHovered] = useState(false);
  const pendingSelectTimerRef = useRef<number | null>(null);
  const isHandTool = activeTool === "hand";
  const isDrawingTool = activeTool === "text" || activeTool === "shape";
  const isTextNode = name === "Text";
  const canShowResizeOverlay = !isHandTool && !isDrawingTool && isActive && dom && (!isTextNode || editingTextNodeId !== id);

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

    const onMouseDownCapture = (event: MouseEvent) => {
      if (isHandTool) return;
      if (event.button !== 0) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (document.body.dataset.canvasPan === "true") return;
      if (document.body.dataset.spacePan === "true") return;
      if (document.body.dataset.boxSelecting === "true") return;

      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-panel]")) return;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;

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
  }, [actions, dom, id, name, isHandTool]);

  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!dom) return;
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

    // Initial check and periodic poll for unexpected layout shifts
    const interval = setInterval(update, 500);

    return () => {
      window.removeEventListener("scroll", scrollUpdate, true);
      window.removeEventListener("resize", scrollUpdate);
      clearInterval(interval);
    };
  }, [dom]);

  // Don't render overlays for ROOT/Viewport shells only
  if (id === "ROOT" || name === "Viewport") {
    return <>{render}</>;
  }

  const isLabelVisible = !isHandTool && ((isDomHovered && !suppressPassiveHover) || isActive) && dom && rect;

  return (
    <>
      {/* Label overlay (portal) — hidden when Hand tool is active */}
      {isLabelVisible ?
        ReactDOM.createPortal(
          <div
            data-panel="node-label"
            className={`fixed px-2 py-1 bg-blue-500/90 [backdrop-filter:blur(4px)] text-brand-lighter text-[10px] rounded-t-md z-40 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] uppercase font-bold tracking-wider shadow-lg ${isActive || (isDomHovered && !suppressPassiveHover) ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-95"
              }`}
            style={{
              left: 0,
              top: 0,
              transform: `translate3d(${rect.left}px, ${rect.top - 24}px, 0)`,
            }}
          >
            {name}
          </div>,
          document.body
        )
        : null}

      {/* Resize / Move overlay — active nodes, including Text when not inline editing */}
      {canShowResizeOverlay ? (
        <ResizeOverlay nodeId={id} dom={dom} />
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
