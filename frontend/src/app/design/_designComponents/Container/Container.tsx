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

export const Container = ({
  background,
  padding,
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
  justifyContent = "center",
  gap = 0,
  gridTemplateColumns = "1fr 1fr",
  gridTemplateRows = "auto",
  gridGap = 0,
  gridColumnGap,
  gridRowGap,
  gridAutoRows = "auto",
  gridAutoFlow = "row",
  position = "static",
  display = "flex",
  zIndex = 0,
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
  designWidth,
  designHeight,
  customClassName = "",
  children
}: ContainerProps) => {
  const { id, connectors: { connect, drag }, childCount, parentId } = useNode((node) => ({
    childCount: node.data.nodes.length,
    parentId: node.data.parent,
  }));
  const { parentDisplay, parentFlexDirection } = useEditor((state) => ({
    parentDisplay: parentId ? String(state.nodes[parentId]?.data?.props?.display ?? "") : "",
    parentFlexDirection: parentId ? String(state.nodes[parentId]?.data?.props?.flexDirection ?? "") : "",
  }));
  const hasChildren = childCount > 0 || React.Children.count(children) > 0;
  const isFlexRowParent = parentDisplay === "flex" && parentFlexDirection === "row";

  const wPx = parsePx(width);
  const hPx = parsePx(height);
  const canScale = false;
  const scaleX = canScale ? wPx / designWidth : 1;
  const scaleY = canScale ? hPx / designHeight : 1;

  // Resolve padding
  const p = typeof padding === 'number' ? padding : 0;
  const pl = paddingLeft !== undefined ? paddingLeft : p;
  const pr = paddingRight !== undefined ? paddingRight : p;
  const pt = paddingTop !== undefined ? paddingTop : p;
  const pb = paddingBottom !== undefined ? paddingBottom : p;
  const effectivePl = pl;
  const effectivePr = pr;
  const effectivePt = pt;
  const effectivePb = pb;

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
  const effectiveDisplay =
    editorVisibility === "hide"
      ? "none"
      : editorVisibility === "show" && display === "none"
        ? "flex"
        : display;
  const shouldFlexFill = width === "100%" && isFlexRowParent;

  return (
    <div
      data-node-id={id}
      data-fluid-space="true"
      data-layout={effectiveDisplay === "flex" ? (flexDirection === "row" ? "row" : "column") : undefined}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`relative ${hasChildren ? "" : "min-h-[120px]"} transition-[outline] duration-150 hover:outline hover:outline-blue-500 ${customClassName}`}
      style={{
        backgroundColor: childCount === 0 ? "#f4f5f7" : background,
        backgroundImage: backgroundImage
          ? backgroundOverlay
            ? `linear-gradient(${backgroundOverlay}, ${backgroundOverlay}), url(${backgroundImage})`
            : `url(${backgroundImage})`
          : undefined,
        backgroundSize: backgroundImage ? backgroundSize : undefined,
        backgroundPosition: backgroundImage ? backgroundPosition : undefined,
        backgroundRepeat: backgroundImage ? backgroundRepeat : undefined,
        paddingLeft: fluidSpace(effectivePl, 0),
        paddingRight: fluidSpace(effectivePr, 0),
        paddingTop: fluidSpace(effectivePt, 0),
        paddingBottom: fluidSpace(effectivePb, 0),
        marginLeft: fluidSpace(ml, 0),
        marginRight: fluidSpace(mr, 0),
        marginTop: fluidSpace(mt, 0),
        marginBottom: fluidSpace(mb, 0),
        width,
        height,
        flex: shouldFlexFill ? "1 1 0%" : undefined,
        boxSizing: "border-box",
        maxWidth: position === "static" ? "100%" : undefined,
        minWidth: 0,
        borderTopLeftRadius: `${rtl}px`,
        borderTopRightRadius: `${rtr}px`,
        borderBottomRightRadius: `${rbr}px`,
        borderBottomLeftRadius: `${rbl}px`,
        borderWidth: `${borderWidth}px`,
        borderColor,
        borderStyle,
        position,
        containerType: "inline-size",
        display: effectiveDisplay,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? posRight : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? posLeft : undefined,
        // Flex properties
        flexDirection: effectiveDisplay === "flex" ? flexDirection : undefined,
        flexWrap: effectiveDisplay === "flex" ? flexWrap : undefined,
        alignItems: effectiveDisplay === "flex" || effectiveDisplay === "grid" ? alignItems : undefined,
        justifyContent: effectiveDisplay === "flex" || effectiveDisplay === "grid" ? justifyContent : undefined,
        columnGap: effectiveDisplay === "flex"
          ? fluidSpace(gap, 0)
          : effectiveDisplay === "grid"
            ? fluidSpace((gridColumnGap ?? gridGap) as number, 0)
            : undefined,
        rowGap: effectiveDisplay === "flex"
          ? fluidSpace(gap, 0)
          : effectiveDisplay === "grid"
            ? fluidSpace((gridRowGap ?? gridGap) as number, 0)
            : undefined,
        // Grid properties
        gridTemplateColumns: effectiveDisplay === "grid" ? gridTemplateColumns : undefined,
        gridTemplateRows: effectiveDisplay === "grid" ? gridTemplateRows : undefined,
        gridAutoRows: effectiveDisplay === "grid" ? gridAutoRows : undefined,
        gridAutoFlow: effectiveDisplay === "grid" ? gridAutoFlow : undefined,
        boxShadow,
        opacity,
        overflow,
        cursor,
        transform: [rotation ? `rotate(${rotation}deg)` : null, flipHorizontal ? "scaleX(-1)" : null, flipVertical ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined,
        transformOrigin: "center center",
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
            display: effectiveDisplay === "flex" ? "flex" : effectiveDisplay === "grid" ? "grid" : "block",
            flexDirection: effectiveDisplay === "flex" ? flexDirection : undefined,
            flexWrap: effectiveDisplay === "flex" ? flexWrap : undefined,
            alignItems: effectiveDisplay === "flex" || effectiveDisplay === "grid" ? alignItems : undefined,
            justifyContent: effectiveDisplay === "flex" || effectiveDisplay === "grid" ? justifyContent : undefined,
            columnGap: effectiveDisplay === "flex"
              ? `${gap}px`
              : effectiveDisplay === "grid"
                ? `${gridColumnGap ?? gridGap}px`
                : undefined,
            rowGap: effectiveDisplay === "flex"
              ? `${gap}px`
              : effectiveDisplay === "grid"
                ? `${gridRowGap ?? gridGap}px`
                : undefined,
            gridTemplateColumns: effectiveDisplay === "grid" ? gridTemplateColumns : undefined,
            gridTemplateRows: effectiveDisplay === "grid" ? gridTemplateRows : undefined,
          }}
        >
          {children}
        </div>
      ) : (
        <>{children}</>
      )}

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
  cursor: "default"
};

Container.craft = {
  displayName: "Container",
  props: ContainerDefaultProps,
  related: {
    settings: ContainerSettings
  }
};
