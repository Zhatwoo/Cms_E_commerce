import React from "react";
import { useNode } from "@craftjs/core";
import { ShapeSettings } from "../shared/ShapeSettings";
import type { TriangleProps } from "@/app/design/_types/components";

export const Triangle = (props: TriangleProps) => {
  const {
    color = "#3498db",
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
    position = "relative",
    display = "flex",
    children,
    isPreview,
  } = props;

  const wCss = typeof width === "number" ? `${width}px` : (width || "200px");
  const hCss = typeof height === "number" ? `${height}px` : (height || "200px");
  const fillColor = background || color;

  if (isPreview) {
    return (
      <svg width={wCss} height={hCss} viewBox="0 0 100 100">
        <polygon points="0,100 50,0 100,100" fill={fillColor} />
      </svg>
    );
  }
  const effectiveOverflow = overflow === "visible" ? "hidden" : overflow;
  const { connectors: { connect, drag }, id } = useNode();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-node-id={id}
      style={{
        width: wCss,
        height: hCss,
        minWidth: wCss,
        minHeight: hCss,
        position,
        display,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center center",
        boxShadow,
        opacity,
        cursor,
      }}
      className="hover:outline hover:outline-blue-500"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        <polygon
          points="0,100 50,0 100,100"
          fill="transparent"
          stroke={borderColor}
          strokeWidth={borderWidth * 2}
          vectorEffect="non-scaling-stroke"
          strokeDasharray={borderStyle === "dashed" ? "6,6" : borderStyle === "dotted" ? "3,3" : undefined}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
          backgroundColor: fillColor,
          backgroundImage: backgroundImage
            ? backgroundOverlay
              ? `linear-gradient(${backgroundOverlay}, ${backgroundOverlay}), url(${backgroundImage})`
              : `url(${backgroundImage})`
            : undefined,
          backgroundSize: backgroundImage ? backgroundSize : undefined,
          backgroundPosition: backgroundImage ? backgroundPosition : undefined,
          backgroundRepeat: backgroundImage ? backgroundRepeat : undefined,
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const TriangleDefaultProps: Partial<TriangleProps> = {
  color: "#3498db",
  width: "200px",
  height: "200px",
  background: "#3498db",
  borderColor: "transparent",
  borderWidth: 0,
  borderStyle: "solid",
  strokePlacement: "mid",
  boxShadow: "none",
  opacity: 1,
  overflow: "hidden",
  cursor: "default",
  position: "relative",
  display: "flex",
};

Triangle.craft = {
  displayName: "Triangle",
  props: TriangleDefaultProps,
  rules: {
    canMove: () => true,
    canDelete: (node: any) => node.parent !== "ROOT",
  },
  related: {
    settings: ShapeSettings,
  },
  canvas: true,
};

