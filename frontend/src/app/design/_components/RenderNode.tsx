import React, { useEffect, useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import ReactDOM from "react-dom";
import { ResizeOverlay } from "./ResizeOverlay";

export const RenderNode = ({ render }: { render: React.ReactElement }) => {
  const { id } = useNode();
  const { isActive } = useEditor((_, query) => ({
    isActive: query.getEvent('selected').contains(id),
  }));

  const {
    isHover,
    dom,
    name,
    parent,
  } = useNode((node) => ({
    isHover: node.events.hovered,
    dom: node.dom,
    name: node.data.custom.displayName || node.data.displayName,
    parent: node.data.parent,
  }));

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (dom) {
      if (isActive || isHover) {
        dom.classList.add("component-selected");
      } else {
        dom.classList.remove("component-selected");
      }
    }
  }, [dom, isActive, isHover]);

  // Don't render overlays for Root or Viewport
  if (parent === 'ROOT') {
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

      {/* Resize / Move overlay — only for actively selected nodes */}
      {mounted && isActive && dom ? (
        <ResizeOverlay nodeId={id} dom={dom} />
      ) : null}

      {render}
    </>
  );
};
