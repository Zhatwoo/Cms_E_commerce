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
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  cursor = "default",
  rotation = 0,
  designWidth,
  designHeight,
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

  return (
    <div
      data-node-id={id}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="min-h-[50px] transition-[outline] duration-150 hover:outline hover:outline-blue-500"
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
        borderTopLeftRadius: `${rtl}px`,
        borderTopRightRadius: `${rtr}px`,
        borderBottomRightRadius: `${rbr}px`,
        borderBottomLeftRadius: `${rbl}px`,
        borderWidth: `${borderWidth}px`,
        borderColor,
        borderStyle,
        position,
        display,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? posRight : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? posLeft : undefined,
        // Flex properties
        flexDirection: display === "flex" ? flexDirection : undefined,
        flexWrap: display === "flex" ? flexWrap : undefined,
        alignItems: display === "flex" || display === "grid" ? alignItems : undefined,
        justifyContent: display === "flex" || display === "grid" ? justifyContent : undefined,
        gap: display === "flex" ? `${gap}px` : undefined,
        // Grid properties
        gridTemplateColumns: display === "grid" ? gridTemplateColumns : undefined,
        gridTemplateRows: display === "grid" ? gridTemplateRows : undefined,
        columnGap: display === "grid" ? `${gridColumnGap ?? gridGap}px` : undefined,
        rowGap: display === "grid" ? `${gridRowGap ?? gridGap}px` : undefined,
        gridAutoRows: display === "grid" ? gridAutoRows : undefined,
        gridAutoFlow: display === "grid" ? gridAutoFlow : undefined,
        boxShadow,
        opacity,
        overflow,
        cursor,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
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
            display: display === "flex" ? "flex" : display === "grid" ? "grid" : "block",
            flexDirection: display === "flex" ? flexDirection : undefined,
            flexWrap: display === "flex" ? flexWrap : undefined,
            alignItems: display === "flex" || display === "grid" ? alignItems : undefined,
            justifyContent: display === "flex" || display === "grid" ? justifyContent : undefined,
            gap: display === "flex" ? `${gap}px` : undefined,
            gridTemplateColumns: display === "grid" ? gridTemplateColumns : undefined,
            gridTemplateRows: display === "grid" ? gridTemplateRows : undefined,
            columnGap: display === "grid" ? `${gridColumnGap ?? gridGap}px` : undefined,
            rowGap: display === "grid" ? `${gridRowGap ?? gridGap}px` : undefined,
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
