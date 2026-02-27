import React from "react";
import { useNode } from "@craftjs/core";
import { ContainerSettings } from "./ContainerSettings";
import type { ContainerProps } from "../../_types/components";

function parsePx(value: string | undefined): number | null {
  if (value == null) return null;
  const m = String(value).match(/^(-?\d+(?:\.\d+)?)px$/);
  return m ? parseFloat(m[1]) : null;
}

export const Container = ({
  background,
  padding,
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingBottom,
  margin = 0,
  marginLeft,
  marginRight,
  marginTop,
  marginBottom,
  width = "100%",
  height = "auto",
  borderRadius = 0,
  radiusTopLeft,
  radiusTopRight,
  radiusBottomRight,
  radiusBottomLeft,
  backgroundImage = "",
  backgroundSize = "cover",
  backgroundPosition = "center",
  backgroundRepeat = "no-repeat",
  backgroundOverlay = "",
  borderColor = "transparent",
  borderWidth = 0,
  borderStyle = "solid",
  strokePlacement = "mid",
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "center",
  justifyContent = "center",
  gap = 0,
  gridTemplateColumns = "1fr 1fr",
  gridTemplateRows = "auto",
  gridGap = 0,
  gridColumnGap,
  gridRowGap,
  gridAutoRows = "auto",
  gridAutoFlow = "row",
  position = "static",
  display = "flex",
  zIndex = 0,
  top = "auto",
  right: posRight = "auto",
  bottom = "auto",
  left: posLeft = "auto",
  editorVisibility = "auto",
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  cursor = "default",
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  designWidth,
  designHeight,
  customClassName = "",
  children
}: ContainerProps) => {
  const { id, connectors: { connect, drag } } = useNode();

  const wPx = parsePx(width);
  const hPx = parsePx(height);
  const canScale = typeof designWidth === "number" && typeof designHeight === "number" && wPx != null && hPx != null && designWidth > 0 && designHeight > 0;
  const scaleX = canScale ? wPx / designWidth : 1;
  const scaleY = canScale ? hPx / designHeight : 1;

  // Resolve padding
  const p = typeof padding === 'number' ? padding : 0;
  const pl = paddingLeft !== undefined ? paddingLeft : p;
  const pr = paddingRight !== undefined ? paddingRight : p;
  const pt = paddingTop !== undefined ? paddingTop : p;
  const pb = paddingBottom !== undefined ? paddingBottom : p;

  // Resolve margin
  const m = typeof margin === 'number' ? margin : 0;
  const ml = marginLeft !== undefined ? marginLeft : m;
  const mr = marginRight !== undefined ? marginRight : m;
  const mt = marginTop !== undefined ? marginTop : m;
  const mb = marginBottom !== undefined ? marginBottom : m;

  // Resolve border radius
  const br = borderRadius || 0;
  const rtl = radiusTopLeft !== undefined ? radiusTopLeft : br;
  const rtr = radiusTopRight !== undefined ? radiusTopRight : br;
  const rbr = radiusBottomRight !== undefined ? radiusBottomRight : br;
  const rbl = radiusBottomLeft !== undefined ? radiusBottomLeft : br;
  const effectiveDisplay =
    editorVisibility === "hide"
      ? "none"
      : editorVisibility === "show" && display === "none"
        ? "flex"
        : display;

  return (
    <div
      data-node-id={id}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`min-h-[50px] transition-[outline] duration-150 hover:outline hover:outline-blue-500 ${customClassName}`}
      style={{
        backgroundColor: background,
        backgroundImage: backgroundImage
          ? backgroundOverlay
            ? `linear-gradient(${backgroundOverlay}, ${backgroundOverlay}), url(${backgroundImage})`
            : `url(${backgroundImage})`
          : undefined,
        backgroundSize: backgroundImage ? backgroundSize : undefined,
        backgroundPosition: backgroundImage ? backgroundPosition : undefined,
        backgroundRepeat: backgroundImage ? backgroundRepeat : undefined,
        paddingLeft: `${pl}px`,
        paddingRight: `${pr}px`,
        paddingTop: `${pt}px`,
        paddingBottom: `${pb}px`,
        marginLeft: `${ml}px`,
        marginRight: `${mr}px`,
        marginTop: `${mt}px`,
        marginBottom: `${mb}px`,
        width,
        height,
        maxWidth: "100%",
        minWidth: 0,
        borderTopLeftRadius: `${rtl}px`,
        borderTopRightRadius: `${rtr}px`,
        borderBottomRightRadius: `${rbr}px`,
        borderBottomLeftRadius: `${rbl}px`,
        ...(strokePlacement === "outside" && borderWidth > 0
          ? { border: "none", outline: `${borderWidth}px ${borderStyle} ${borderColor}`, outlineOffset: 0 }
          : { borderWidth: `${borderWidth}px`, borderColor, borderStyle }),
        position,
        display: effectiveDisplay,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? posRight : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? posLeft : undefined,
        // Flex properties
        flexDirection: effectiveDisplay === "flex" ? flexDirection : undefined,
        flexWrap: effectiveDisplay === "flex" ? flexWrap : undefined,
        alignItems: effectiveDisplay === "flex" || effectiveDisplay === "grid" ? alignItems : undefined,
        justifyContent: effectiveDisplay === "flex" || effectiveDisplay === "grid" ? justifyContent : undefined,
        columnGap: effectiveDisplay === "flex"
          ? `${gap}px`
          : effectiveDisplay === "grid"
            ? `${gridColumnGap ?? gridGap}px`
            : undefined,
        rowGap: effectiveDisplay === "flex"
          ? `${gap}px`
          : effectiveDisplay === "grid"
            ? `${gridRowGap ?? gridGap}px`
            : undefined,
        // Grid properties
        gridTemplateColumns: effectiveDisplay === "grid" ? gridTemplateColumns : undefined,
        gridTemplateRows: effectiveDisplay === "grid" ? gridTemplateRows : undefined,
        gridAutoRows: effectiveDisplay === "grid" ? gridAutoRows : undefined,
        gridAutoFlow: effectiveDisplay === "grid" ? gridAutoFlow : undefined,
        boxShadow,
        opacity,
        overflow,
        cursor,
        transform: [rotation ? `rotate(${rotation}deg)` : null, flipHorizontal ? "scaleX(-1)" : null, flipVertical ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined,
        transformOrigin: "center center",
      }}
    >
      {canScale ? (
        <div
          style={{
            width: designWidth,
            height: designHeight,
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: "0 0",
            flexShrink: 0,
            boxSizing: "border-box",
            display: effectiveDisplay === "flex" ? "flex" : effectiveDisplay === "grid" ? "grid" : "block",
            flexDirection: effectiveDisplay === "flex" ? flexDirection : undefined,
            flexWrap: effectiveDisplay === "flex" ? flexWrap : undefined,
            alignItems: effectiveDisplay === "flex" || effectiveDisplay === "grid" ? alignItems : undefined,
            justifyContent: effectiveDisplay === "flex" || effectiveDisplay === "grid" ? justifyContent : undefined,
            columnGap: effectiveDisplay === "flex"
              ? `${gap}px`
              : effectiveDisplay === "grid"
                ? `${gridColumnGap ?? gridGap}px`
                : undefined,
            rowGap: effectiveDisplay === "flex"
              ? `${gap}px`
              : effectiveDisplay === "grid"
                ? `${gridRowGap ?? gridGap}px`
                : undefined,
            gridTemplateColumns: effectiveDisplay === "grid" ? gridTemplateColumns : undefined,
            gridTemplateRows: effectiveDisplay === "grid" ? gridTemplateRows : undefined,
          }}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export const ContainerDefaultProps: Partial<ContainerProps> = {
  background: "#9999A1",
  padding: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  margin: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  width: "100%",
  height: "auto",
  backgroundImage: "",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundOverlay: "",
  borderRadius: 0,
  borderColor: "transparent",
  borderWidth: 0,
  borderStyle: "solid",
  strokePlacement: "mid",
  flexDirection: "column",
  flexWrap: "nowrap",
  alignItems: "center",
  justifyContent: "center",
  gap: 0,
  gridTemplateColumns: "1fr 1fr",
  gridTemplateRows: "auto",
  gridGap: 0,
  gridColumnGap: 0,
  gridRowGap: 0,
  gridAutoRows: "auto",
  gridAutoFlow: "row",
  position: "static",
  display: "flex",
  zIndex: 0,
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto",
  editorVisibility: "auto",
  boxShadow: "none",
  opacity: 1,
  overflow: "visible",
  cursor: "default"
};

Container.craft = {
  displayName: "Container",
  props: ContainerDefaultProps,
  related: {
    settings: ContainerSettings
  }
};
