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
  strokePlacement?: "mid" | "inside" | "outside";
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
    backgroundImage = "",
    backgroundSize = "cover",
    backgroundPosition = "center",
    backgroundRepeat = "no-repeat",
    backgroundOverlay = "",
    borderColor = "transparent",
    borderWidth = 0,
    borderStyle = "solid",
    strokePlacement = "mid",
    rotation = 0,
    boxShadow = "none",
    opacity = 1,
    overflow = "visible",
    cursor = "default",
    position = "absolute",
    display = "flex",
    zIndex = 0,
    top,
    right,
    bottom,
    left,
    children,
    isPreview,
  } = props;

  const w = typeof width === "number" ? `${width}px` : (width || "200px");
  const h = typeof height === "number" ? `${height}px` : (height || "200px");
  const normalizedBackground = typeof background === "string" ? background.trim().toLowerCase() : "";
  const shouldUseBackground = Boolean(background) && normalizedBackground !== "transparent";
  const fillColor = shouldUseBackground ? background : color;
  const effectiveOverflow = overflow === "visible" ? "hidden" : overflow;

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

  const { id, connectors: { connect, drag } } = useNode((node) => ({ id: node.id }));
  
  return (
    <div
      data-node-id={id}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="hover:outline hover:outline-blue-500"
      style={{
        width: w,
        height: h,
        minWidth: w as string,
        minHeight: h as string,
        position: position as React.CSSProperties["position"],
        display: display as React.CSSProperties["display"],
        zIndex,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: fillColor,
        backgroundImage: backgroundImage
          ? backgroundOverlay
            ? `linear-gradient(${backgroundOverlay}, ${backgroundOverlay}), url(${backgroundImage})`
            : `url(${backgroundImage})`
          : undefined,
        backgroundSize: backgroundImage ? backgroundSize : undefined,
        backgroundPosition: backgroundImage ? backgroundPosition : undefined,
        backgroundRepeat: backgroundImage ? backgroundRepeat : undefined,
        borderRadius: "50%",
        ...(strokePlacement === "outside" && borderWidth > 0
          ? { border: "none", outline: `${borderWidth}px ${borderStyle} ${borderColor}`, outlineOffset: 0 }
          : { borderWidth: `${borderWidth}px`, borderColor, borderStyle }),
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center center",
        boxShadow,
        opacity,
        overflow: effectiveOverflow,
        cursor,
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
  background: "#10b981",
  borderColor: "transparent",
  borderWidth: 0,
  borderStyle: "solid",
  strokePlacement: "mid",
  boxShadow: "none",
  opacity: 1,
  overflow: "hidden",
  cursor: "default",
  position: "absolute",
  display: "flex",
  zIndex: 0,
};

Circle.craft = {
  displayName: "Circle",
  props: CircleDefaultProps,
  related: {
    settings: ShapeSettings
  },
  canvas: true,
};

