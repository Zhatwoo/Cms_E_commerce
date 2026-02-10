import React from "react";
import { useNode } from "@craftjs/core";
import { ContainerSettings } from "./ContainerSettings";
import type { ContainerProps } from "../../_types/components";

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
  children
}: ContainerProps) => {
  const { connectors: { connect, drag } } = useNode();

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
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="min-h-[50px] transition-all hover:outline hover:outline-blue-500"
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
        cursor
      }}
    >
      {children}
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
