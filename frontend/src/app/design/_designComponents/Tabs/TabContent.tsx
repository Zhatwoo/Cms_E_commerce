import React from "react";
import { useNode, useEditor } from "@craftjs/core";
import { ContainerSettings } from "../Container/ContainerSettings";
import type { ContainerProps } from "../../_types/components";

const LAYOUT_LIKE_TYPES = new Set(["Page", "Viewport", "Section", "Container", "Row", "Column", "Frame", "TabContent", "Tab Content"]);
const FLOW_PARENT_DISPLAY_NAMES = new Set(["Section", "Container", "Row", "Column", "Frame", "TabContent", "Tab Content"]);

function fluidSpace(value: number, min = 0): string {
  if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
  const preferred = Math.max(0.1, value / 12);
  const floor = Math.max(min, Math.round(value * 0.45));
  return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

export const TabContent = ({
  background = "transparent",
  padding = 24,
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
  position = "relative",
  zIndex = 0,
  top = "auto",
  right: posRight = "auto",
  bottom = "auto",
  left: posLeft = "auto",
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  cursor = "default",
  children,
}: ContainerProps) => {
  const {
    id,
    connectors: { connect, drag },
    childCount
  } = useNode((node) => ({
    childCount: node.data.nodes.length
  }));

  const { enabled } = useEditor((state: any) => ({
    enabled: state.options.enabled
  }));

  // Resolve padding
  const p = typeof padding === 'number' ? padding : 0;
  const pl = paddingLeft !== undefined ? paddingLeft : p;
  const pr = paddingRight !== undefined ? paddingRight : p;
  const pt = paddingTop !== undefined ? paddingTop : p;
  const pb = paddingBottom !== undefined ? paddingBottom : p;

  // Resolve margin
  const m = typeof margin === 'number' ? margin : 0;
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

  const br = borderRadius || 0;
  const rtl = radiusTopLeft !== undefined ? radiusTopLeft : br;
  const rtr = radiusTopRight !== undefined ? radiusTopRight : br;
  const rbr = radiusBottomRight !== undefined ? radiusBottomRight : br;
  const rbl = radiusBottomLeft !== undefined ? radiusBottomLeft : br;

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-node-id={id}
      data-tab-content-canvas="true"
      className="w-full min-h-[100px] relative transition-all duration-200"
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
        ...spacingStyle,
        width,
        height,
        boxSizing: "border-box",
        borderTopLeftRadius: `${rtl}px`,
        borderTopRightRadius: `${rtr}px`,
        borderBottomRightRadius: `${rbr}px`,
        borderBottomLeftRadius: `${rbl}px`,
        borderWidth: `${borderWidth}px`,
        borderColor,
        borderStyle,
        position,
        display,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? posRight : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? posLeft : undefined,
        flexDirection: display === "flex" ? flexDirection : undefined,
        flexWrap: display === "flex" ? flexWrap : undefined,
        alignItems: (display === "flex" || display === "grid") ? alignItems : undefined,
        justifyContent: (display === "flex" || display === "grid") ? justifyContent : undefined,
        columnGap: display === "flex"
          ? fluidSpace(gap, 0)
          : display === "grid"
            ? fluidSpace((gridColumnGap ?? gridGap) as number, 0)
            : undefined,
        rowGap: display === "flex"
          ? fluidSpace(gap, 0)
          : display === "grid"
            ? fluidSpace((gridRowGap ?? gridGap) as number, 0)
            : undefined,
        gridTemplateColumns: display === "grid" ? gridTemplateColumns : undefined,
        gridTemplateRows: display === "grid" ? gridTemplateRows : undefined,
        gridAutoRows: display === "grid" ? gridAutoRows : undefined,
        gridAutoFlow: display === "grid" ? gridAutoFlow : undefined,
        boxShadow,
        opacity,
        overflow,
        cursor,
      }}
    >
      {enabled && childCount === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg pointer-events-none m-4 bg-gray-50/50">
          <div className="text-gray-400 text-xs font-medium flex flex-col items-center gap-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Drop components here</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

TabContent.craft = {
  displayName: "TabContent",
  props: {
    padding: 24,
    margin: 0,
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 0,
    position: "relative",
    width: "100%",
    height: "auto",
  },
  rules: {
    canDrag: () => false,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: ContainerSettings
  },
  isCanvas: true,
};
