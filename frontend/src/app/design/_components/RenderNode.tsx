import React, { useEffect, useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import ReactDOM from "react-dom";

export const RenderNode = ({ render }: { render: React.ReactElement }) => {
  const { id, dom, name, parent, isHover, isCanvas } = useNode((node) => ({
    isHover: node.events.hovered,
    dom: node.dom,
    name: node.data.custom.displayName || node.data.displayName,
    parent: node.data.parent,
    isCanvas: node.data.isCanvas,
  }));
  const { indicator, dragged, isActive } = useEditor((state, query) => ({
    isActive: query.getEvent("selected").contains(id),
    indicator: state.indicator,
    dragged: state.events.dragged,
  }));

  const isDragging = dragged.size > 0 || !!indicator;
  const indicatorParentId = indicator?.placement?.parent?.id;
  const isIndicatorParent = indicatorParentId === id;
  const isInvalidDrop = isIndicatorParent && !!indicator?.error;

  // Ensure portal only renders on client
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

  useEffect(() => {
    if (!dom) return;

    if (isDragging && isCanvas) {
      dom.classList.add("canvas-drop-target");
    } else {
      dom.classList.remove("canvas-drop-target");
    }

    if (isDragging && isIndicatorParent && isCanvas) {
      dom.classList.add("canvas-drop-active");
    } else {
      dom.classList.remove("canvas-drop-active");
    }

    if (isDragging && isInvalidDrop && isCanvas) {
      dom.classList.add("canvas-drop-invalid");
    } else {
      dom.classList.remove("canvas-drop-invalid");
    }
  }, [dom, isDragging, isCanvas, isIndicatorParent, isInvalidDrop]);

  // Don't render label for Root
  if (parent === 'ROOT') {
    return <>{render}</>;
  }

  return (
    <>
      {mounted && (isHover || isActive) && dom ?
        ReactDOM.createPortal(
          <div
            className={`fixed px-2 py-1 bg-blue-500 text-white text-[10px] rounded-t-md z-50 pointer-events-none transition-opacity duration-200 uppercase font-bold tracking-wider ${isActive || isHover ? "opacity-100" : "opacity-0"
              }`}
            style={{
              left: dom.getBoundingClientRect().left,
              top: dom.getBoundingClientRect().top - 24, // Position above the element
            }}
          >
            {name}
          </div>,
          document.body
        )
        : null}
      {render}
    </>
  );
};
