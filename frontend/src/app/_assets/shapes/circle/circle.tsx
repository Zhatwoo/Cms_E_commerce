import React from "react";
import { useNode } from "@craftjs/core";
import { CircleSettings } from "./circleSettings";
import type { CircleProps, SquareProps, TriangleProps } from "@/app/design/_types/components";

export interface CircleResizableProps {
  color?: string;
  width?: number;
  height?: number;
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
    width = 200,
    height = 200,
    background,
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

  if (isPreview) {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={w / 2}
          ry={h / 2}
          fill={color}
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
        minWidth: w,
        minHeight: h,
        backgroundColor: color,
        borderRadius: "50%",
        borderWidth: `${borderWidth}px`,
        borderColor,
        borderStyle,
        boxShadow,
        opacity,
        overflow,
        cursor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
};

export const CircleDefaultProps: Partial<CircleResizableProps> = {
  color: "#10b981",
  width: 200,
  height: 200,
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
    settings: CircleSettings
  }
};