import React, { useEffect, useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import ReactDOM from "react-dom";
import { ResizeOverlay } from "./ResizeOverlay";
import { useCanvasTool } from "./CanvasToolContext";

export const RenderNode = ({ render }: { render: React.ReactElement }) => {
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

  const activeTool = useCanvasTool();
  const { isActive } = useEditor((_, query) => ({
    isActive: query.getEvent('selected').contains(id),
  }));

  const [mounted, setMounted] = useState(false);
  const isHandTool = activeTool === "hand";

  useEffect(() => {
    setMounted(true);
  }, []);

  // When Hand tool is active, don't show selection/hover outline or labels on assets
  useEffect(() => {
    if (dom) {
      if (!isHandTool && (isActive || isHover)) {
        dom.classList.add("component-selected");
      } else {
        dom.classList.remove("component-selected");
      }
    }
  }, [dom, isActive, isHover, isHandTool]);

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

      {/* Resize / Move overlay — only for actively selected nodes */}
      {mounted && isActive && dom ? (
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
