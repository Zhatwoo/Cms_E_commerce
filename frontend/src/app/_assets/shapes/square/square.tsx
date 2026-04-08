import React from "react";
import { useNode } from "@craftjs/core";
import { ShapeSettings } from "../shared/ShapeSettings";
import type { SquareProps } from "@/app/design/_types/components";

const SquarePreview = ({
  w,
  h,
  fillColor,
  resolvedTopLeft,
  resolvedTopRight,
  resolvedBottomRight,
  resolvedBottomLeft,
}: {
  w: string;
  h: string;
  fillColor: string;
  resolvedTopLeft: number;
  resolvedTopRight: number;
  resolvedBottomRight: number;
  resolvedBottomLeft: number;
}) => (
  <div
    style={{
      width: w,
      height: h,
      backgroundColor: fillColor,
      borderRadius: `${resolvedTopLeft}px ${resolvedTopRight}px ${resolvedBottomRight}px ${resolvedBottomLeft}px`,
    }}
  />
);

const SquareEditor = ({
  w,
  h,
  fillColor,
  backgroundImage,
  backgroundOverlay,
  backgroundSize,
  backgroundPosition,
  backgroundRepeat,
  borderWidth,
  borderStyle,
  borderColor,
  strokePlacement,
  resolvedTopLeft,
  resolvedTopRight,
  resolvedBottomRight,
  resolvedBottomLeft,
  position,
  display,
  zIndex,
  top,
  right,
  bottom,
  left,
  rotation,
  boxShadow,
  opacity,
  effectiveOverflow,
  cursor,
  pt,
  pr,
  pb,
  pl,
  mt,
  mr,
  mb,
  ml,
  children,
}: {
  w: string;
  h: string;
  fillColor: string;
  backgroundImage: string;
  backgroundOverlay: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  borderWidth: number;
  borderStyle: string;
  borderColor: string;
  strokePlacement: "mid" | "inside" | "outside";
  resolvedTopLeft: number;
  resolvedTopRight: number;
  resolvedBottomRight: number;
  resolvedBottomLeft: number;
  position: React.CSSProperties["position"];
  display: React.CSSProperties["display"];
  rotation: number;
  boxShadow: string;
  opacity: number;
  effectiveOverflow: React.CSSProperties["overflow"];
  cursor: React.CSSProperties["cursor"];
  pt: number;
  pr: number;
  pb: number;
  pl: number;
  mt: number;
  mr: number;
  mb: number;
  ml: number;
  children?: React.ReactNode;
}) => {
  const { connectors: { connect, drag }, id } = useNode();

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
        alignItems: "center",
        justifyContent: "center",
        padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
        margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center center",
        backgroundColor: fillColor,
        backgroundImage: backgroundImage
          ? backgroundOverlay
            ? `linear-gradient(${backgroundOverlay}, ${backgroundOverlay}), url(${backgroundImage})`
            : `url(${backgroundImage})`
          : undefined,
        backgroundSize: backgroundImage ? backgroundSize : undefined,
        backgroundPosition: backgroundImage ? backgroundPosition : undefined,
        backgroundRepeat: backgroundImage ? backgroundRepeat : undefined,
        ...(strokePlacement === "outside" && borderWidth > 0
          ? { border: "none", outline: `${borderWidth}px ${borderStyle} ${borderColor}`, outlineOffset: 0 }
          : { borderWidth: `${borderWidth}px`, borderColor, borderStyle }),
        borderRadius: `${resolvedTopLeft}px ${resolvedTopRight}px ${resolvedBottomRight}px ${resolvedBottomLeft}px`,
        boxShadow,
        opacity,
        overflow: effectiveOverflow,
        cursor,
      }}
      className="hover:outline hover:outline-blue-500"
    >
      {children}
    </div>
  );
};

export const Square = (props: SquareProps) => {
  const {
    color = "#e74c3c",
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
    borderRadius = 0,
    radiusTopLeft,
    radiusTopRight,
    radiusBottomRight,
    radiusBottomLeft,
    rotation = 0,
    boxShadow = "none",
    opacity = 1,
    overflow = "visible",
    cursor = "default",
    position = "relative",
    display = "flex",
    pt = 0,
    pr = 0,
    pb = 0,
    pl = 0,
    mt = 0,
    mr = 0,
    mb = 0,
    ml = 0,
    children,
    isPreview,
  } = props;

  const w = typeof width === "number" ? `${width}px` : (width || "200px");
  const h = typeof height === "number" ? `${height}px` : (height || "200px");
  const fillColor = background || color;
  const uniformRadius = typeof borderRadius === "number" ? borderRadius : 0;
  const resolvedTopLeft = radiusTopLeft ?? uniformRadius;
  const resolvedTopRight = radiusTopRight ?? uniformRadius;
  const resolvedBottomRight = radiusBottomRight ?? uniformRadius;
  const resolvedBottomLeft = radiusBottomLeft ?? uniformRadius;
  const effectiveOverflow = overflow === "visible" ? "hidden" : overflow;

  if (isPreview) {
    return <SquarePreview
      w={w}
      h={h}
      fillColor={fillColor}
      resolvedTopLeft={resolvedTopLeft}
      resolvedTopRight={resolvedTopRight}
      resolvedBottomRight={resolvedBottomRight}
      resolvedBottomLeft={resolvedBottomLeft}
    />;
  }
  return <SquareEditor
    w={w}
    h={h}
    fillColor={fillColor}
    backgroundImage={backgroundImage}
    backgroundOverlay={backgroundOverlay}
    backgroundSize={backgroundSize}
    backgroundPosition={backgroundPosition}
    backgroundRepeat={backgroundRepeat}
    borderWidth={borderWidth}
    borderStyle={borderStyle}
    borderColor={borderColor}
    strokePlacement={strokePlacement}
    resolvedTopLeft={resolvedTopLeft}
    resolvedTopRight={resolvedTopRight}
    resolvedBottomRight={resolvedBottomRight}
    resolvedBottomLeft={resolvedBottomLeft}
    rotation={rotation}
    boxShadow={boxShadow}
    opacity={opacity}
    effectiveOverflow={effectiveOverflow}
    cursor={cursor}
    position={position}
    display={display}
    zIndex={0}
    top={0}
    right={0}
    bottom={0}
    left={0}
    pt={pt}
    pr={pr}
    pb={pb}
    pl={pl}
    mt={mt}
    mr={mr}
    mb={mb}
    ml={ml}
  >
    {children}
  </SquareEditor>;
};

export const SquareDefaultProps: Partial<SquareProps> = {
  color: "#e74c3c",
  width: "200px",
  height: "200px",
  background: "#e74c3c",
  borderRadius: 0,
  radiusTopLeft: 0,
  radiusTopRight: 0,
  radiusBottomRight: 0,
  radiusBottomLeft: 0,
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
  pt: 0,
  pr: 0,
  pb: 0,
  pl: 0,
  mt: 0,
  mr: 0,
  mb: 0,
  ml: 0,
};

Square.craft = {
  displayName: "Square",
  props: SquareDefaultProps,
  rules: {
    canMove: () => true,
    canDelete: (node: { parent?: string }) => node.parent !== "ROOT",
  },
  related: {
    settings: ShapeSettings,
  },
  canvas: true,
};

