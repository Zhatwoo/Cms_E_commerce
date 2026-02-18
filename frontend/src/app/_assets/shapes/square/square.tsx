import React from "react";
import { useNode } from "@craftjs/core";
import { ShapeSettings } from "../shared/ShapeSettings";
import type { SquareProps } from "@/app/design/_types/components";

export const Square = (props: SquareProps) => {
  const {
    color = "#e74c3c",
    width = "200px",
    height = "200px",
    background,
    margin = 0,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    padding = 0,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    borderColor = "transparent",
    borderWidth = 0,
    borderStyle = "solid",
    position = "relative",
    display = "flex",
    zIndex = 0,
    top = "auto",
    right = "auto",
    bottom = "auto",
    left = "auto",
    boxShadow = "none",
    opacity = 1,
    overflow = "visible",
    cursor = "default",
    children,
    isPreview,
  } = props;

  const w = typeof width === "number" ? `${width}px` : (width || "200px");
  const h = typeof height === "number" ? `${height}px` : (height || "200px");
  const fillColor = background || color;
  const m = typeof margin === "number" ? margin : 0;
  const mt = marginTop ?? m;
  const mr = marginRight ?? m;
  const mb = marginBottom ?? m;
  const ml = marginLeft ?? m;
  const p = typeof padding === "number" ? padding : 0;
  const pt = paddingTop ?? p;
  const pr = paddingRight ?? p;
  const pb = paddingBottom ?? p;
  const pl = paddingLeft ?? p;
  const { connectors: { connect, drag }, id } = useNode();
  if (isPreview) {
    return <div style={{ width: w, height: h, backgroundColor: fillColor }} />;
  }
  return (
    <div
      ref={ref => { if (ref) connect(drag(ref)); }}
      data-node-id={id}
      style={{
        width: w,
        height: h,
        minWidth: w,
        minHeight: h,
        position,
        display,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: fillColor,
        borderWidth: `${borderWidth}px`,
        borderColor,
        borderStyle,
        boxShadow,
        opacity,
        overflow,
        cursor,
        padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
        margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
      }}
      className="transition-all hover:outline hover:outline-blue-500"
    >
      {children}
    </div>
  );
};

export const SquareDefaultProps: Partial<SquareProps> = {
  color: "#e74c3c",
  width: "200px",
  height: "200px",
  background: "#e74c3c",
  borderColor: "transparent",
  borderWidth: 0,
  borderStyle: "solid",
  boxShadow: "none",
  opacity: 1,
  overflow: "visible",
  cursor: "default",
};

Square.craft = {
  displayName: "Square",
  props: SquareDefaultProps,
  rules: {
    canMove: () => true,
    canDelete: (node: any) => node.parent !== "ROOT",
  },
  related: {
    settings: ShapeSettings,
  },
  canvas: true,
};
