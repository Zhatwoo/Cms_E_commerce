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

  const [mounted, setMounted] = useState(false);
  const [isDomHovered, setIsDomHovered] = useState(false);
  const pendingSelectTimerRef = useRef<number | null>(null);
  const isHandTool = activeTool === "hand";
  const isDrawingTool = activeTool === "text" || activeTool === "shape";
  const isTextNode = name === "Text";
  const canShowResizeOverlay = !isHandTool && !isDrawingTool && isActive && dom && (!isTextNode || editingTextNodeId !== id);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      if (!isHandTool && (isActive || isPendingSelected || (isDomHovered && !suppressPassiveHover))) {
        dom.classList.add("component-selected");
      } else {
        dom.classList.remove("component-selected");
        if (dom.dataset.pendingSelected === "true") {
          delete dom.dataset.pendingSelected;
        }
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

  // Don't render overlays for ROOT/Viewport shells only
  if (id === "ROOT" || name === "Viewport") {
    return <>{render}</>;
  }

  return (
    <>
      {/* Label overlay (portal) — hidden when Hand tool is active */}
      {!isHandTool && mounted && ((isDomHovered && !suppressPassiveHover) || isActive) && dom ?
        ReactDOM.createPortal(
          <div
            data-panel="node-label"
            className={`fixed px-2 py-1 bg-blue-500 text-brand-lighter text-[10px] rounded-t-md z-40 pointer-events-none transition-opacity duration-200 uppercase font-bold tracking-wider ${isActive || (isDomHovered && !suppressPassiveHover) ? "opacity-100" : "opacity-0"
              }`}
            style={{
              left: dom.getBoundingClientRect().left,
              top: dom.getBoundingClientRect().top - 24,
            }}
          >
            {name}
          </div>,
          document.body
        )
        : null}

      {/* Resize / Move overlay — active nodes, including Text when not inline editing */}
      {mounted && canShowResizeOverlay ? (
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
