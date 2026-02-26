import React from "react";
import { useNode } from "@craftjs/core";
import { SectionSettings } from "./SectionSettings";
import type { ContainerProps } from "../../_types/components";

function parsePx(value: string | undefined): number | null {
  if (value == null) return null;
  const m = String(value).match(/^(-?\d+(?:\.\d+)?)px$/);
  return m ? parseFloat(m[1]) : null;
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
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "center",
  justifyContent = "flex-start",
  gap = 0,
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  rotation = 0,
  designWidth,
  designHeight,
  customClassName = "",
  children,
}: ContainerProps) => {
  const { id, connectors: { connect, drag } } = useNode();
  const isHeaderAsset = /header/i.test(id ?? "");

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
    <section
      data-node-id={id}
      {...(isHeaderAsset ? { "data-header": "true" } : {})}
      data-layout={flexDirection === "row" ? "row" : "column"}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`min-h-[80px] transition-[outline] duration-150 hover:outline hover:outline-blue-500 ${customClassName}`}
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
            gap: `${gap}px`,
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
  flexDirection: "column",
  flexWrap: "nowrap",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 0,
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
