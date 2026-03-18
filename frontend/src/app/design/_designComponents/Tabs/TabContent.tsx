import React from "react";
import { useNode } from "@craftjs/core";

export const TabContent = ({
  children,
  padding = 24,
  margin = 0,
  background = "transparent",
  display = "flex",
  flexDirection = "column",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = 0,
  position = "relative",
  width = "100%",
  height = "auto",
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
}: any) => {
  const {
    id,
    connectors: { connect },
  } = useNode();

  const style = {
    padding: typeof padding === "number" ? `${padding}px` : padding,
    margin: typeof margin === "number" ? `${margin}px` : margin,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    backgroundColor: background,
    display,
    flexDirection,
    alignItems,
    justifyContent,
    gap: typeof gap === "number" ? `${gap}px` : gap,
    position: position as any,
    width,
    height,
    minHeight: "100px",
  };

  return (
    <div
      ref={(ref) => {
        if (ref) connect(ref);
      }}
      data-node-id={id}
      data-tab-content-canvas="true"
      className="w-full min-h-[100px] relative"
      style={style}
    >
      {children}
    </div>
  );
};

TabContent.craft = {
  displayName: "TabContent",
  props: {
    padding: 24,
    margin: 0,
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 0,
    position: "relative",
    width: "100%",
    height: "auto",
    // Tab panels should behave like a normal flow layout (not freeform canvas).
    isFreeform: false,
  },
  rules: {
    canDrag: () => false,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  isCanvas: true,
};
