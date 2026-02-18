import React from "react";
import { useNode } from "@craftjs/core";
import { TriangleSettings } from "./triangleSettings";
import type { CircleProps, SquareProps, TriangleProps } from "@/app/design/_types/components";

export const Triangle = (props: TriangleProps) => {
  const {
    color = "#3498db",
    width = 200,
    height = 200,
    borderColor = "transparent",
    borderWidth = 0,
    borderStyle = "solid",
    boxShadow = "none",
    opacity = 1,
    overflow = "visible",
    cursor = "default",
    children,
    isPreview,
  } = props;

  const w = Number(width) || 200;
  const h = Number(height) || 200;
  // Points for a triangle that fills the bounding box
  const points = `0,${h} ${w / 2},0 ${w},${h}`;
  if (isPreview) {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polygon points={points} fill={color} />
      </svg>
    );
  }
  const { connectors: { connect, drag } } = useNode();
  return (
    <div
      ref={ref => { if (ref) connect(drag(ref)); }}
      style={{
        width: w,
        height: h,
        minWidth: w,
        minHeight: h,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow,
        opacity,
        overflow,
        cursor,
      }}
      className="transition-all hover:outline hover:outline-blue-500"
    >
      {/* SVG Triangle Background */}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <polygon
          points={points}
          fill={color}
          stroke={borderColor}
          strokeWidth={borderWidth}
          strokeDasharray={borderStyle === "dashed" ? "6,6" : borderStyle === "dotted" ? "3,3" : undefined}
        />
      </svg>
      {/* Content Canvas */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const TriangleDefaultProps: Partial<CircleProps> = {
  color: "#3498db",
  size: 100,
};

Triangle.craft = {
  displayName: "Triangle",
  props: TriangleDefaultProps,
  rules: {
    canMove: () => true,
    canDelete: (node: any) => node.parent !== "ROOT",
  },
  related: {
    settings: TriangleSettings,
  },
  canvas: true,
};
