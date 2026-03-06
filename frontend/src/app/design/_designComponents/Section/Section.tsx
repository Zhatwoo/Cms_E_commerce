import React from "react";
import { useNode } from "@craftjs/core";
import { SectionSettings } from "./SectionSettings";
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
 * Section — a full-width page band (hero, content section, footer, etc.)
 * Always stretches to 100% width with vertical (column) flex layout by default.
 */
export const Section = ({
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
  justifyContent = "flex-start",
  gap = 0,
  position = "static",
  zIndex = 0,
  top = "auto",
  right: posRight = "auto",
  bottom = "auto",
  left: posLeft = "auto",
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  rotation = 0,
  designWidth,
  designHeight,
  customClassName = "",
  children,
}: ContainerProps) => {
  const normalizeFlexPos = (value: unknown, fallback: "flex-start" | "center" | "flex-end") => {
    const raw = String(value ?? "").trim().toLowerCase();
    if (raw === "start" || raw === "flex-start") return "flex-start";
    if (raw === "end" || raw === "flex-end") return "flex-end";
    if (raw === "center") return "center";
    return fallback;
  };
  const resolvedAlignItems = normalizeFlexPos(alignItems, "center");
  const resolvedJustifyContent = normalizeFlexPos(justifyContent, "flex-start");

  const {
    id,
    connectors: { connect, drag },
    childCount,
  } = useNode((node) => ({
    childCount: node.data.nodes.length,
  }));
  const isHeaderAsset = /header/i.test(id ?? "");
  const hasChildren = childCount > 0 || React.Children.count(children) > 0;

  const wPx = parsePx(width);
  const hPx = parsePx(height);
  const canScale = false;
  const scaleX = canScale ? ((typeof wPx === "number" ? wPx : 1) / (designWidth ?? 1)) : 1;
  const scaleY = canScale ? (typeof hPx === "number" ? hPx : 1) / (designHeight ?? 1) : 1;

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
    <section
      data-node-id={id}
      data-fluid-space="true"
      {...(isHeaderAsset ? { "data-header": "true" } : {})}
      data-layout={flexDirection === "row" ? "row" : "column"}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`min-h-[80px] transition-[outline] duration-150 ${customClassName}`}
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
        maxWidth: "100%",
        minWidth: 0,
        borderRadius: `${borderRadius}px`,
        ...(strokePlacement === "outside" && borderWidth > 0
          ? { border: "none", outline: `${borderWidth}px ${borderStyle} ${borderColor}`, outlineOffset: 0 }
          : { borderWidth: `${borderWidth}px`, borderColor, borderStyle }),
        display: "flex",
        containerType: "inline-size",
        position,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? posRight : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? posLeft : undefined,
        flexDirection,
        flexWrap,
        alignItems: resolvedAlignItems,
        justifyContent: resolvedJustifyContent,
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
            alignItems: resolvedAlignItems,
            justifyContent: resolvedJustifyContent,
            gap: fluidSpace(gap, 0),
          }}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
};

export const SectionDefaultProps: Partial<ContainerProps> = {
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
  justifyContent: "flex-start",
  gap: 0,
  position: "static",
  zIndex: 0,
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto",
  boxShadow: "none",
  opacity: 1,
  overflow: "visible",
};

Section.craft = {
  displayName: "Section",
  props: SectionDefaultProps,
  related: {
    settings: SectionSettings,
  },
};
