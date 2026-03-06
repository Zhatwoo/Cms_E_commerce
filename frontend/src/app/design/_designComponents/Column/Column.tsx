import React from "react";
import { useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";
import { ColumnSettings } from "./ColumnSettings";
import type { ContainerProps } from "../../_types/components";

function parsePx(value: string | undefined): number | null {
  if (value == null) return null;
  const m = String(value).match(/^(-?\d+(?:\.\d+)?)px$/);
  return m ? parseFloat(m[1]) : null;
}

function fluidSpace(value: number, min = 0): string {
  if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
  const preferred = Math.max(0.1, value / 12);
  const floor = Math.max(min, Math.round(value * 0.45));
  return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}


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
  strokePlacement = "mid",
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = 8,
  display = "flex",
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  rotation = 0,
  designWidth,
  designHeight,
  customClassName = "",
  children,
}: ContainerProps) => {
  const { id, connectors: { connect, drag }, childCount } = useNode((node) => ({
    childCount: node.data.nodes.length,
  }));

  const wPx = parsePx(width);
  const hPx = parsePx(height);
  const canScale = typeof designWidth === "number" && typeof designHeight === "number" && wPx != null && hPx != null && designWidth > 0 && designHeight > 0;
  const scaleX = canScale ? wPx / designWidth : 1;
  const scaleY = canScale ? hPx / designHeight : 1;

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
      data-fluid-space="true"
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`min-h-[40px] ${customClassName}`}
      style={{
        flex: width === "auto" ? "1 1 0%" : undefined,
        backgroundColor: background,
        paddingLeft: fluidSpace(pl, 0),
        paddingRight: fluidSpace(pr, 0),
        paddingTop: fluidSpace(pt, 0),
        paddingBottom: fluidSpace(pb, 0),
        marginLeft: fluidSpace(ml, 0),
        marginRight: fluidSpace(mr, 0),
        marginTop: fluidSpace(mt, 0),
        marginBottom: fluidSpace(mb, 0),
        width: width !== "auto" ? width : undefined,
        height,
        boxSizing: "border-box",
        containerType: "inline-size",
        maxWidth: "100%",
        minWidth: 0,
        borderRadius: `${borderRadius}px`,
        ...(strokePlacement === "outside" && borderWidth > 0
          ? { border: "none", outline: `${borderWidth}px ${borderStyle} ${borderColor}`, outlineOffset: 0 }
          : { borderWidth: `${borderWidth}px`, borderColor, borderStyle }),
        display: display ?? "flex",
        flexDirection,
        flexWrap,
        alignItems,
        justifyContent,
        gap: fluidSpace(gap, 0),
        boxShadow,
        opacity,
        overflow,
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
            display: "flex",
            flexDirection,
            flexWrap,
            alignItems,
            justifyContent,
            gap: fluidSpace(gap, 0),
          }}
        >
          {children}
          {childCount === 0 && (
            <div
              className="w-full min-h-[52px] border border-dashed border-brand-medium/50 rounded-lg flex items-center justify-center text-xs text-brand-light/70"
              data-column-drop-zone="true"
            >
              Drop components here
            </div>
          )}
        </div>
      ) : (
        <>
          {children}
          {childCount === 0 && (
            <div
              className="w-full min-h-[52px] border border-dashed border-brand-medium/50 rounded-lg flex items-center justify-center text-xs text-brand-light/70"
              data-column-drop-zone="true"
            >
              Drop components here
            </div>
          )}
        </>
      )}
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
  strokePlacement: "mid",
  flexDirection: "column",
  flexWrap: "nowrap",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: 8,
  display: "flex",
  boxShadow: "none",
  opacity: 1,
  overflow: "visible",
};

Column.craft = {
  displayName: "Column",
  props: ColumnDefaultProps,
  rules: {
    canMoveIn: (incomingNodes: Node[]) =>
      incomingNodes.every((node) => {
        const name = node.data.displayName;
        return name !== "Page" && name !== "Viewport";
      }),
  },
  related: {
    settings: ColumnSettings,
  },
};
