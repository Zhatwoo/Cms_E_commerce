import React from "react";
import { useEditor, useNode } from "@craftjs/core";
import { ContainerSettings } from "./ContainerSettings";
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

function normalizeContainerHeight(value: string | undefined, hasChildren: boolean): string {
  if (value == null) return hasChildren ? "auto" : "240px";
  const v = String(value).trim().toLowerCase();
  // Allow 'auto' to actually be auto, but keep 240px fallback for empty drop zones
  return v === "auto" ? "auto" : value;
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

export const Container = ({
  background = "#ffffff",
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
  height = "240px",
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
  backgroundVideo = "",
  borderColor = "transparent",
  borderWidth = 0,
  borderStyle = "solid",
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = 0,
  gridTemplateColumns = "1fr 1fr",
  gridTemplateRows = "auto",
  gridGap = 0,
  gridColumnGap = 0,
  gridRowGap = 0,
  gridAutoRows = "auto",
  gridAutoFlow = "row",
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
  cursor = "default",
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  designWidth = 1440,
  designHeight = 900,
  customClassName = "",
  children,
}: ContainerProps) => {
  const {
    id,
    connectors: { connect, drag },
    childCount,
    parentId,
  } = useNode((node) => ({
    childCount: node.data.nodes.length,
    parentId: node.data.parent,
  }));

  const { actions, parentDisplay, parentFlexDirection } = useEditor((state) => ({
    parentDisplay: parentId ? String(state.nodes[parentId]?.data?.props?.display ?? "") : "",
    parentFlexDirection: parentId ? String(state.nodes[parentId]?.data?.props?.flexDirection ?? "") : "",
  }));

  const hasChildren = childCount > 0 || React.Children.count(children) > 0;
  const isFlexRowParent = parentDisplay === "flex" && parentFlexDirection === "row";
  const resolvedHeight = normalizeContainerHeight(height, hasChildren);

  const wPx = parsePx(width);
  const hPx = parsePx(resolvedHeight);
  const canScale = false;
  const scaleX = canScale && wPx != null ? wPx / designWidth : 1;
  const scaleY = canScale && hPx != null ? hPx / designHeight : 1;

  const p = typeof padding === "number" ? padding : 0;
  const pl = paddingLeft !== undefined ? paddingLeft : p;
  const pr = paddingRight !== undefined ? paddingRight : p;
  const pt = paddingTop !== undefined ? paddingTop : p;
  const pb = paddingBottom !== undefined ? paddingBottom : p;

  const m = typeof margin === "number" ? margin : 0;
  const ml = marginLeft !== undefined ? marginLeft : m;
  const mr = marginRight !== undefined ? marginRight : m;
  const mt = marginTop !== undefined ? marginTop : m;
  const mb = marginBottom !== undefined ? marginBottom : m;

  const spacingStyle = React.useMemo(
    () => ({
      paddingLeft: fluidSpace(pl, 0),
      paddingRight: fluidSpace(pr, 0),
      paddingTop: fluidSpace(pt, 0),
      paddingBottom: fluidSpace(pb, 0),
      marginLeft: fluidSpace(ml, 0),
      marginRight: fluidSpace(mr, 0),
      marginTop: fluidSpace(mt, 0),
      marginBottom: fluidSpace(mb, 0),
    }),
    [pl, pr, pt, pb, ml, mr, mt, mb]
  );

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

  const br = borderRadius || 0;
  const rtl = radiusTopLeft !== undefined ? radiusTopLeft : br;
  const rtr = radiusTopRight !== undefined ? radiusTopRight : br;
  const rbr = radiusBottomRight !== undefined ? radiusBottomRight : br;
  const rbl = radiusBottomLeft !== undefined ? radiusBottomLeft : br;

  const hasBackgroundVideo = Boolean(String(backgroundVideo || "").trim());

  const resolvedBackground = React.useMemo(() => {
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
  }, [
    background,
    backgroundImage,
    backgroundOverlay,
    backgroundPosition,
    backgroundRepeat,
    backgroundSize,
    hasBackgroundVideo,
  ]);

  const effectiveDisplay =
    editorVisibility === "hide"
      ? "none"
      : editorVisibility === "show" && display === "none"
        ? "flex"
        : display;

  const isFlexDisplay = effectiveDisplay === "flex" || effectiveDisplay === "inline-flex";
  const isGridDisplay = effectiveDisplay === "grid";

  const shouldFlexFill = width === "100%" && isFlexRowParent;

  // Only use positioning offsets for non-static positions
  const isPositioned = position !== "static";

  // Background video needs a positioned ancestor
  const resolvedPosition = hasBackgroundVideo && position === "static" ? "relative" : position;
  const showPlaceholderMinHeight = !hasChildren && resolvedHeight === "auto";

  return (
    <div
      data-node-id={id}
      data-fluid-space="true"
      data-layout={isFlexDisplay ? (flexDirection === "row" ? "row" : "column") : undefined}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`${resolvedPosition !== "static" ? "relative" : ""} ${showPlaceholderMinHeight ? "min-h-[120px]" : ""} ${customClassName}`}
      style={{
        background: resolvedBackground,
        isolation: "isolate",
        ...spacingStyle,
        width,
        height: resolvedHeight,
        flex: shouldFlexFill ? "1 1 0%" : undefined,
        boxSizing: "border-box",
        maxWidth: !isPositioned ? "100%" : undefined,
        minWidth: 0,
        borderTopLeftRadius: `${rtl}px`,
        borderTopRightRadius: `${rtr}px`,
        borderBottomRightRadius: `${rbr}px`,
        borderBottomLeftRadius: `${rbl}px`,
        borderWidth: `${borderWidth}px`,
        borderColor,
        borderStyle,
        position: resolvedPosition,
        containerType: "inline-size",
        contain: "layout",
        display: effectiveDisplay,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        alignSelf,
        top: isPositioned ? top : undefined,
        right: isPositioned ? posRight : undefined,
        bottom: isPositioned ? bottom : undefined,
        left: isPositioned ? posLeft : undefined,
        flexDirection: isFlexDisplay ? flexDirection : undefined,
        flexWrap: isFlexDisplay ? flexWrap : undefined,
        alignItems: isFlexDisplay || isGridDisplay ? alignItems : undefined,
        justifyContent: isFlexDisplay || isGridDisplay ? justifyContent : undefined,
        columnGap: isFlexDisplay
          ? fluidSpace(gap, 0)
          : isGridDisplay
            ? fluidSpace((gridColumnGap ?? gridGap) as number, 0)
            : undefined,
        rowGap: isFlexDisplay
          ? fluidSpace(gap, 0)
          : isGridDisplay
            ? fluidSpace((gridRowGap ?? gridGap) as number, 0)
            : undefined,
        gridTemplateColumns: isGridDisplay ? gridTemplateColumns : undefined,
        gridTemplateRows: isGridDisplay ? gridTemplateRows : undefined,
        gridAutoRows: isGridDisplay ? gridAutoRows : undefined,
        gridAutoFlow: isGridDisplay ? gridAutoFlow : undefined,
        boxShadow,
        opacity,
        overflow,
        cursor,
        transform: transformStyle,
        transformOrigin: "center center",
      }}
    >
      {hasBackgroundVideo ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: -1,
            overflow: "hidden",
            borderTopLeftRadius: `${rtl}px`,
            borderTopRightRadius: `${rtr}px`,
            borderBottomRightRadius: `${rbr}px`,
            borderBottomLeftRadius: `${rbl}px`,
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
    </div>
  );
};

export const ContainerDefaultProps: Partial<ContainerProps> = {
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
  height: "240px",
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
  editorVisibility: "auto",
  boxShadow: "none",
  opacity: 1,
  overflow: "visible",
  cursor: "default",
};

Container.craft = {
  displayName: "Container",
  props: ContainerDefaultProps,
  related: {
    settings: ContainerSettings,
  },
};