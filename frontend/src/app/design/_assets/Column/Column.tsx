import React from "react";
import { useNode } from "@craftjs/core";
import { ColumnSettings } from "./ColumnSettings";
import type { ContainerProps } from "../../_types/components";

/**
 * Column — a vertical flex child designed to live inside a Row.
 * Defaults to flex-1 so columns share space equally within a Row.
 */
export const Column = ({
  background = "transparent",
  padding = 12,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin = 0,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  width = "auto",
  height = "auto",
  borderRadius = 0,
  borderColor = "transparent",
  borderWidth = 0,
  borderStyle = "solid",
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = 8,
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
        flex: width === "auto" ? 1 : undefined,
        backgroundColor: background,
        paddingLeft: `${pl}px`,
        paddingRight: `${pr}px`,
        paddingTop: `${pt}px`,
        paddingBottom: `${pb}px`,
        marginLeft: `${ml}px`,
        marginRight: `${mr}px`,
        marginTop: `${mt}px`,
        marginBottom: `${mb}px`,
        width: width !== "auto" ? width : undefined,
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

export const ColumnDefaultProps: Partial<ContainerProps> = {
  background: "transparent",
  padding: 12,
  paddingTop: 12,
  paddingRight: 12,
  paddingBottom: 12,
  paddingLeft: 12,
  margin: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  width: "auto",
  height: "auto",
  borderRadius: 0,
  borderColor: "transparent",
  borderWidth: 0,
  borderStyle: "solid",
  flexDirection: "column",
  flexWrap: "nowrap",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: 8,
  boxShadow: "none",
  opacity: 1,
  overflow: "visible",
};

Column.craft = {
  displayName: "Column",
  props: ColumnDefaultProps,
  related: {
    settings: ColumnSettings,
  },
};
