import React from "react";
import { useNode } from "@craftjs/core";
import { ShapeSettings } from "../shared/ShapeSettings";
import type { CircleProps } from "@/app/design/_types/components";

export interface CircleResizableProps {
  color?: string;
  width?: number | string;
  height?: number | string;
  background?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  boxShadow?: string;
  opacity?: number;
  overflow?: string;
  cursor?: string;
  children?: React.ReactNode;
  isPreview?: boolean;
}

export const Circle = (props: CircleProps) => {
  const {
    color = "#10b981",
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

  if (isPreview) {
    return (
      <svg width={w} height={h}>
        <ellipse
          cx="50%"
          cy="50%"
          rx="50%"
          ry="50%"
          fill={fillColor}
        />
      </svg>
    );
  }

  const { connectors: { connect, drag } } = useNode();
  
  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="transition-all hover:outline hover:outline-blue-500"
      style={{
        width: w,
        height: h,
        minWidth: w as string,
        minHeight: h as string,
        backgroundColor: fillColor,
        borderRadius: "50%",
        borderWidth: `${borderWidth}px`,
        borderColor,
        borderStyle,
        position,
        display,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        boxShadow,
        opacity,
        overflow,
        cursor,
        alignItems: "center",
        justifyContent: "center",
        padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
        margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
      }}
    >
      {children}
    </div>
  );
};

export const CircleDefaultProps: Partial<CircleResizableProps> = {
  color: "#10b981",
  width: "200px",
  height: "200px",
  background: undefined,
  borderColor: "transparent",
  borderWidth: 0,
  borderStyle: "solid",
  boxShadow: "none",
  opacity: 1,
  overflow: "visible",
  cursor: "default"
};

Circle.craft = {
  displayName: "Circle",
  props: CircleDefaultProps,
  related: {
    settings: ShapeSettings
  }
};
