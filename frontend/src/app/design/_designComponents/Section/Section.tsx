import React from "react";
import { useNode } from "@craftjs/core";
import { SectionSettings } from "./SectionSettings";
import type { SectionProps } from "../../_types/components";

function fluidSpace(value: number, min = 0): string {
  if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
  const preferred = Math.max(0.1, value / 12);
  const floor = Math.max(min, Math.round(value * 0.45));
  return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

function isColorLike(value: unknown): boolean {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v) return false;
  if (v === "transparent" || v === "currentcolor" || v === "inherit") return true;
  if (v.startsWith("#")) return true;
  if (v.startsWith("rgb(") || v.startsWith("rgba(")) return true;
  if (v.startsWith("hsl(") || v.startsWith("hsla(")) return true;
  return ["white", "black", "red", "blue", "green", "gray", "grey"].includes(v);
}

export const Section = ({
  background = "transparent",
  padding = 40,
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
  backgroundVideo = "",
  borderColor = "transparent",
  borderWidth = 0,
  borderStyle = "solid",
  strokePlacement = "mid",
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = 0,
  gridTemplateColumns,
  gridTemplateRows,
  gridGap,
  gridColumnGap,
  gridRowGap,
  gridAutoRows,
  gridAutoFlow,
  justifyItems = "stretch",
  alignContent = "flex-start",
  display = "block",
  isFreeform = true,
  position = "relative",
  zIndex = 0,
  alignSelf = "auto",
  top = "auto",
  right: posRight = "auto",
  bottom = "auto",
  left: posLeft = "auto",
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  contentWidth: _contentWidth = "constrained",
  customClassName = "",
  editorVisibility = "auto",
  children,
}: SectionProps = {}) => {
  const {
    id,
    connectors: { connect },
  } = useNode();
  const isHeaderAsset = /header/i.test(id ?? "");

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

  const resolvedHeight = String(height ?? "auto").trim() || "auto";
  const hasBackgroundVideo = Boolean(String(backgroundVideo || "").trim());
  void _contentWidth;

  const transformStyle = React.useMemo(
    () =>
      [
        rotation ? `rotate(${rotation}deg)` : null,
        flipHorizontal ? "scaleX(-1)" : null,
        flipVertical ? "scaleY(-1)" : null,
      ]
        .filter(Boolean)
        .join(" ") || undefined,
    [rotation, flipHorizontal, flipVertical]
  );

  const setSectionRef = React.useCallback(
    (element: HTMLElement | null) => {
      if (element) connect(element);
    },
    [connect]
  );

  const effectiveDisplay =
    editorVisibility === "hide" 
      ? "none" 
      : editorVisibility === "show" && display === "none"
        ? "block"
        : (display ?? "block");

  const isFlexDisplay = effectiveDisplay === "flex" || effectiveDisplay === "inline-flex";
  const isGridDisplay = effectiveDisplay === "grid";


  const sectionStyle = React.useMemo<React.CSSProperties>(
    () => ({
      background: (() => {
        if (hasBackgroundVideo) return background;

        if (backgroundImage) {
          const overlayLayer =
            backgroundOverlay && backgroundOverlay !== "transparent"
              ? `linear-gradient(${backgroundOverlay}, ${backgroundOverlay})`
              : null;
          const imageLayer = `url(${backgroundImage}) ${backgroundPosition} / ${backgroundSize} ${backgroundRepeat}`;
          const layers = [overlayLayer, imageLayer].filter(Boolean).join(", ");
          const colorToken = isColorLike(background) ? ` ${background}` : "";
          return `${layers}${colorToken}`;
        }

        return background;
      })(),
      isolation: "isolate",
      paddingLeft: fluidSpace(pl, 0),
      paddingRight: fluidSpace(pr, 0),
      paddingTop: fluidSpace(pt, 0),
      paddingBottom: fluidSpace(pb, 0),
      marginLeft: fluidSpace(ml, 0),
      marginRight: fluidSpace(mr, 0),
      marginTop: fluidSpace(mt, 0),
      marginBottom: fluidSpace(mb, 0),
      width,
      minHeight: resolvedHeight !== "auto" ? resolvedHeight : undefined,
      height: resolvedHeight === "auto" ? "auto" : undefined,
      boxSizing: "border-box",
      maxWidth: "100%",
      minWidth: 0,
      borderRadius: `${borderRadius}px`,
      ...(strokePlacement === "outside" && borderWidth > 0
        ? { border: "none", outline: `${borderWidth}px ${borderStyle} ${borderColor}`, outlineOffset: 0 }
        : { borderWidth: `${borderWidth}px`, borderColor, borderStyle }),
      position: position === "static" ? "relative" : position,
      zIndex: zIndex !== 0 ? zIndex : undefined,
      alignSelf,
      top: position !== "static" ? top : undefined,
      right: position !== "static" ? posRight : undefined,
      bottom: position !== "static" ? bottom : undefined,
      left: position !== "static" ? posLeft : undefined,
      boxShadow,
      opacity,
      overflow,
      transform: transformStyle,
      transformOrigin: "center center",
      display: isFreeform ? "block" : effectiveDisplay,
      containerType: "inline-size",
      flexDirection: !isFreeform && isFlexDisplay ? flexDirection : undefined,
      flexWrap: !isFreeform && isFlexDisplay ? flexWrap : undefined,
      alignItems: !isFreeform && (isFlexDisplay || isGridDisplay) ? alignItems : undefined,
      justifyContent: !isFreeform && (isFlexDisplay || isGridDisplay) ? justifyContent : undefined,
      columnGap: !isFreeform && isFlexDisplay
        ? fluidSpace(gap, 0)
        : !isFreeform && isGridDisplay
          ? fluidSpace((gridColumnGap ?? gridGap) as number, 0)
          : undefined,
      rowGap: !isFreeform && isFlexDisplay
        ? fluidSpace(gap, 0)
        : !isFreeform && isGridDisplay
          ? fluidSpace((gridRowGap ?? gridGap) as number, 0)
          : undefined,
      gridTemplateColumns: !isFreeform && isGridDisplay ? gridTemplateColumns : undefined,
      gridTemplateRows: !isFreeform && isGridDisplay ? gridTemplateRows : undefined,
      gridAutoRows: !isFreeform && isGridDisplay ? gridAutoRows : undefined,
      gridAutoFlow: !isFreeform && isGridDisplay ? gridAutoFlow : undefined,
      justifyItems: !isFreeform && isGridDisplay ? justifyItems : undefined,
      alignContent: !isFreeform && isGridDisplay ? alignContent : undefined,
    }),
    [
      background,
      backgroundImage,
      backgroundOverlay,
      backgroundPosition,
      backgroundRepeat,
      backgroundSize,
      backgroundVideo,
      hasBackgroundVideo,
      borderColor,
      borderRadius,
      borderStyle,
      borderWidth,
      bottom,
      boxShadow,
      flexDirection,
      flexWrap,
      alignItems,
      justifyContent,
      gap,
      gridTemplateColumns,
      gridTemplateRows,
      gridGap,
      gridColumnGap,
      gridRowGap,
      gridAutoRows,
      gridAutoFlow,
      justifyItems,
      alignContent,
      mb,
      ml,
      mr,
      mt,
      opacity,
      overflow,
      transformStyle,
      pb,
      pl,
      posLeft,
      posRight,
      position,
      pr,
      pt,
      resolvedHeight,
      strokePlacement,
      top,
      width,
      zIndex,
      alignSelf,
      effectiveDisplay,
      isFreeform,
      editorVisibility,
      display,
      isFlexDisplay,
      isGridDisplay,
      justifyItems,
      alignContent,
    ]
  );

  return (
    <section
      data-node-id={id}
      data-node-content-host="true"
      data-fluid-space="true"
      data-layout={flexDirection === "row" ? "row" : "column"}
      {...(isHeaderAsset ? { "data-header": "true" } : {})}
      ref={setSectionRef}
      className={`group min-h-[80px] ${customClassName}`}
      style={sectionStyle}
    >
      {hasBackgroundVideo ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: -1,
            overflow: "hidden",
            borderRadius: `${borderRadius}px`,
          }}
        >
          <video
            src={backgroundVideo}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
          {backgroundOverlay && backgroundOverlay !== "transparent" ? (
            <div className="absolute inset-0" style={{ background: backgroundOverlay }} />
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
};

export const SectionDefaultProps: Partial<SectionProps> = {
  background: "transparent",
  padding: 40,
  paddingTop: 40,
  paddingRight: 24,
  paddingBottom: 40,
  paddingLeft: 24,
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
  backgroundVideo: "",
  borderRadius: 0,
  borderColor: "transparent",
  borderWidth: 0,
  borderStyle: "solid",
  strokePlacement: "mid",
  flexDirection: "column",
  flexWrap: "nowrap",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: 0,
  display: "block",
  isFreeform: true,
  position: "relative",
  zIndex: 0,
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto",
  boxShadow: "none",
  opacity: 1,
  overflow: "visible",
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  contentWidth: "full",
  contentMaxWidth: "none",
  alignSelf: "auto",
  gridTemplateColumns: "1fr 1fr",
  gridTemplateRows: "auto",
  gridGap: 0,
  gridColumnGap: 0,
  gridRowGap: 0,
  gridAutoRows: "auto",
  gridAutoFlow: "row",
  justifyItems: "stretch",
  alignContent: "flex-start",
};

Section.craft = {
  displayName: "Section",
  props: SectionDefaultProps,
  rules: {
    canMoveIn: () => true,
  },
  related: {
    settings: SectionSettings,
  },
};
