import React from "react";
import { useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";
import { RowSettings } from "./RowSettings";
import type { ContainerProps } from "../../_types/components";

function fluidSpace(value: number, min = 0): string {
  if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
  const preferred = Math.max(0.1, value / 12);
  const floor = Math.max(min, Math.round(value * 0.45));
  return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

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
  radiusTopLeft,
  radiusTopRight,
  radiusBottomRight,
  radiusBottomLeft,
  borderColor = "transparent",
  borderWidth = 0,
  borderStyle = "solid",
  strokePlacement = "mid",
  flexDirection = "row",
  flexWrap = "wrap",
  alignItems = "stretch",
  justifyContent = "flex-start",
  gap = 16,
  display = "flex",
  position = "static",
  zIndex = 0,
  alignSelf = "auto",
  top = "auto",
  right: posRight = "auto",
  bottom = "auto",
  left: posLeft = "auto",
  editorVisibility = "auto",
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  isFreeform = false,
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

  const isFlexDisplay = effectiveDisplay === "flex" || effectiveDisplay === "inline-flex";

  const transformStyle =
    [
      rotation ? `rotate(${rotation}deg)` : null,
      flipHorizontal ? "scaleX(-1)" : null,
      flipVertical ? "scaleY(-1)" : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div
      data-node-id={id}
      data-fluid-space="true"
      {...(isHeaderAsset ? { "data-header": "true" } : {})}
      data-layout={isFlexDisplay ? (flexDirection === "row" ? "row" : "column") : undefined}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`min-h-[40px] ${customClassName}`}
      style={{
        background,
        paddingLeft: fluidSpace(pl, 0),
        paddingRight: fluidSpace(pr, 0),
        paddingTop: fluidSpace(pt, 0),
        paddingBottom: fluidSpace(pb, 0),
        marginLeft: fluidSpace(ml, 0),
        marginRight: fluidSpace(mr, 0),
        marginTop: fluidSpace(mt, 0),
        marginBottom: fluidSpace(mb, 0),
        width,
        height,
        boxSizing: "border-box",
        maxWidth: position === "static" ? "100%" : undefined,
        minWidth: 0,
        borderTopLeftRadius: `${rtl}px`,
        borderTopRightRadius: `${rtr}px`,
        borderBottomRightRadius: `${rbr}px`,
        borderBottomLeftRadius: `${rbl}px`,
        ...(strokePlacement === "outside" && borderWidth > 0
          ? { border: "none", outline: `${borderWidth}px ${borderStyle} ${borderColor}`, outlineOffset: 0 }
          : { borderWidth: `${borderWidth}px`, borderColor, borderStyle }),
        position,
        position,
        display: isFreeform ? "block" : effectiveDisplay,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        alignSelf,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? posRight : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? posLeft : undefined,
        containerType: "inline-size",
        contain: "layout",
        flexDirection: !isFreeform && isFlexDisplay ? flexDirection : undefined,
        flexWrap: !isFreeform && isFlexDisplay ? flexWrap : undefined,
        alignItems: !isFreeform && isFlexDisplay ? effectiveAlignItems : undefined,
        justifyContent: !isFreeform && isFlexDisplay ? justifyContent : undefined,
        columnGap: !isFreeform && isFlexDisplay ? fluidSpace(gap, 0) : undefined,
        rowGap: !isFreeform && isFlexDisplay ? fluidSpace(gap, 0) : undefined,
        boxShadow,
        opacity,
        overflow,
        transform: transformStyle,
      }}
    >
      <style>{`[data-node-id="${id}"] > * { min-width: 0; }`}</style>
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
  display: "flex",
  boxShadow: "none",
  opacity: 1,
  overflow: "visible",
  alignSelf: "auto",
  isFreeform: false,
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
