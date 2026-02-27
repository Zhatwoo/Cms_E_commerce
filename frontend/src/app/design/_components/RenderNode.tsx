import React, { useEffect, useRef, useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import ReactDOM from "react-dom";
import { ResizeOverlay } from "./ResizeOverlay";
import { useCanvasTool } from "./CanvasToolContext";

export const RenderNode = ({ render }: { render: React.ReactElement }) => {
  const activeTool = useCanvasTool();

  const {
    id,
    isSelectedEvent,
    isHover,
    dom,
    name,
    visibility,
  } = useNode((node) => ({
    id: node.id,
    isSelectedEvent: node.events.selected,
    isHover: node.events.hovered,
    dom: node.dom,
    name: node.data.custom.displayName || node.data.displayName,
    visibility: (node.data.props?.visibility as "visible" | "hidden" | undefined) ?? "visible",
  }));

  const { isActive, actions } = useEditor((_, query) => ({
    isActive: query.getEvent('selected').contains(id),
  }));

  const [mounted, setMounted] = useState(false);
  const pendingSelectTimerRef = useRef<number | null>(null);
  const isHandTool = activeTool === "hand";

  useEffect(() => {
    setMounted(true);
  }, []);

  // When Hand tool is active, don't show selection/hover outline or labels on assets
  useEffect(() => {
    if (dom) {
      if (id === "ROOT" || name === "Viewport") {
        dom.classList.remove("component-selected");
        return;
      }

      const isPendingSelected = dom.dataset.pendingSelected === "true";
      if (isActive || isPendingSelected || (!isHandTool && isHover)) {
        dom.classList.add("component-selected");
      } else {
        dom.classList.remove("component-selected");
      }
    }
  }, [dom, id, name, isActive, isHover, isHandTool]);

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
      if (event.button !== 0) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (document.body.dataset.canvasPan === "true") return;
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
  }, [actions, dom, id, name]);

  // Don't render overlays for ROOT/Viewport shells only
  if (id === "ROOT" || name === "Viewport") {
    return <>{render}</>;
  }

  return (
    <>
      {/* Label overlay (portal) — hidden when Hand tool is active */}
      {!isHandTool && mounted && (isHover || isActive) && dom ?
        ReactDOM.createPortal(
          <div
            data-panel="node-label"
            className={`fixed px-2 py-1 bg-blue-500 text-brand-lighter text-[10px] rounded-t-md z-50 pointer-events-none transition-opacity duration-200 uppercase font-bold tracking-wider ${isActive || isHover ? "opacity-100" : "opacity-0"
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

      {/* Resize / Move overlay — only for actively selected nodes (skip Text so inline edit remains clickable) */}
      {mounted && isActive && dom && name !== "Text" ? (
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
