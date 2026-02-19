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
        zIndex: zIndex !== 0 ? zIndex : undefined,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        alignItems: "center",
        justifyContent: "center",
        boxShadow,
        opacity,
        overflow: effectiveOverflow,
        cursor,
        padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
        margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
      }}
      className="transition-all hover:outline hover:outline-blue-500"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <polygon
          points="0,100 50,0 100,100"
          fill="transparent"
          stroke={borderColor}
          strokeWidth={borderWidth}
          strokeDasharray={borderStyle === "dashed" ? "6,6" : borderStyle === "dotted" ? "3,3" : undefined}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
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
          zIndex: 3,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
  boxShadow: "none",
  opacity: 1,
  overflow: "hidden",
  cursor: "default",
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
