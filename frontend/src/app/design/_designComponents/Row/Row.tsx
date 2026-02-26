import React from "react";
import { useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";
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
  strokePlacement = "mid",
  flexDirection = "row",
  flexWrap = "wrap",
  alignItems = "stretch",
  justifyContent = "flex-start",
  gap = 16,
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  rotation = 0,
  customClassName = "",
  children,
}: ContainerProps) => {
  const { id, connectors: { connect, drag }, childCount } = useNode((node) => ({
    childCount: node.data.nodes.length,
  }));

  const isHeaderAsset = /header/i.test(id ?? "");
  const effectiveAlignItems = alignItems === "stretch" ? "flex-start" : alignItems;

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
      data-node-id={id}
      {...(isHeaderAsset ? { "data-header": "true" } : {})}
      data-layout={flexDirection === "row" ? "row" : "column"}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`min-h-[40px] transition-[outline] duration-150 hover:outline hover:outline-blue-500 ${customClassName}`}
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
        ...(strokePlacement === "outside" && borderWidth > 0
          ? { border: "none", outline: `${borderWidth}px ${borderStyle} ${borderColor}`, outlineOffset: 0 }
          : { borderWidth: `${borderWidth}px`, borderColor, borderStyle }),
        display: "flex",
        flexDirection,
        flexWrap,
        alignItems: effectiveAlignItems,
        justifyContent,
        gap: `${gap}px`,
        boxShadow,
        opacity,
        overflow,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
      }}
    >
      {children}
      {childCount === 0 && (
        <div
          className="w-full min-h-[52px] border border-dashed border-brand-medium/50 rounded-lg flex items-center justify-center text-xs text-brand-light/70"
          data-row-drop-zone="true"
        >
          Drop components here
        </div>
      )}
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
  strokePlacement: "mid",
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: 16,
  boxShadow: "none",
  opacity: 1,
  overflow: "visible",
};

Row.craft = {
  displayName: "Row",
  props: RowDefaultProps,
  rules: {
    canMoveIn: (incomingNodes: Node[]) =>
      incomingNodes.every((node) => {
        const name = node.data.displayName;
        return name !== "Page" && name !== "Viewport";
      }),
  },
  related: {
    settings: RowSettings,
  },
};
