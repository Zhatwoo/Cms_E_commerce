import React from "react";
import { useNode } from "@craftjs/core";
import { ContainerSettings } from "./ContainerSettings";
import type { ContainerProps } from "../../_types/components";

export const Container = ({
  background,
  padding = 20,
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
  borderColor = "transparent",
  borderWidth = 0,
  borderStyle = "solid",
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = 0,
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
        display: "flex",
        flexDirection,
        flexWrap,
        alignItems,
        justifyContent,
        gap: `${gap}px`,
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
  background: "#27272a",
  padding: 20,
  margin: 0,
  width: "100%",
  height: "auto",
  borderRadius: 0,
  borderColor: "transparent",
  borderWidth: 0,
  borderStyle: "solid",
  flexDirection: "column",
  flexWrap: "nowrap",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: 0,
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
