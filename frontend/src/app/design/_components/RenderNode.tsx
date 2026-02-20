import React, { useEffect } from "react";
import { useNode, useEditor } from "@craftjs/core";
import ReactDOM from "react-dom";
import { ResizeOverlay } from "./ResizeOverlay";

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

  const { isSelectedByEditor } = useEditor((_, query) => ({
    isSelectedByEditor: query.getEvent("selected").contains(id),
  }));

  const isActive = isSelectedByEditor || isSelectedEvent;

  const mounted = typeof window !== "undefined";

  useEffect(() => {
    if (dom) {
      if (isActive || isHover) {
        dom.classList.add("component-selected");
      } else {
        dom.classList.remove("component-selected");
      }
    }
  }, [dom, isActive, isHover]);

  // Don't render overlays for ROOT/Viewport shells only
  if (id === "ROOT" || name === "Viewport") {
    return <>{render}</>;
  }

  return (
    <>
      {/* Label overlay (portal) */}
      {mounted && (isHover || isActive) && dom ?
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

      {/* Resize / Move overlay — show ONLY on selected, not on hover */}
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
