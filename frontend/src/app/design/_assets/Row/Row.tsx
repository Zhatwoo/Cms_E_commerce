import React from "react";
import { useNode } from "@craftjs/core";
import { RowSettings } from "./RowSettings";
import type { ContainerProps } from "../../_types/components";

/**
 * Row — a horizontal flex container for creating multi-column layouts.
 * Default direction is row with wrap enabled.
 */
export const Row = ({
  background = "transparent",
  padding = 0,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin = 0,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  width = "100%",
  height = "auto",
  borderRadius = 0,
  borderColor = "transparent",
  borderWidth = 0,
  borderStyle = "solid",
  flexDirection = "row",
  flexWrap = "wrap",
  alignItems = "stretch",
  justifyContent = "flex-start",
  gap = 16,
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  children,
}: ContainerProps) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const p = typeof padding === "number" ? padding : 0;
  const pl = paddingLeft ?? p;
  const pr = paddingRight ?? p;
  const pt = paddingTop ?? p;
  const pb = paddingBottom ?? p;

  const m = typeof margin === "number" ? margin : 0;
  const ml = marginLeft ?? m;
  const mr = marginRight ?? m;
  const mt = marginTop ?? m;
  const mb = marginBottom ?? m;

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="min-h-[40px] transition-all hover:outline hover:outline-blue-500"
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
        borderRadius: `${borderRadius}px`,
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
      }}
    >
      {children}
    </div>
  );
};

export const RowDefaultProps: Partial<ContainerProps> = {
  background: "transparent",
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
  borderRadius: 0,
  borderColor: "transparent",
  borderWidth: 0,
  borderStyle: "solid",
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "stretch",
  justifyContent: "flex-start",
  gap: 16,
  boxShadow: "none",
  opacity: 1,
  overflow: "visible",
};

Row.craft = {
  displayName: "Row",
  props: RowDefaultProps,
  related: {
    settings: RowSettings,
  },
};
