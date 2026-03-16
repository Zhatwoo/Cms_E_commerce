import React, { useState, useEffect } from "react";
import { useNode, useEditor, Element } from "@craftjs/core";
import { TabsSettings } from "./TabsSettings";
import { TabContent } from "./TabContent";
import type { TabsProps, TabItem } from "../../_types/components";

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

export const Tabs = ({
  tabs = [],
  activeTabId,
  tabHeaderBackgroundColor = "#f3f4f6", // Default light gray
  tabHeaderTextColor = "#374151",       // Default dark gray text
  activeTabBackgroundColor = "#ffffff", // Default white
  activeTabTextColor = "#111827",       // Default almost black
  tabAlignment = "left",

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
  editorVisibility = "auto",
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  cursor = "default",
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  customClassName = "",
}: TabsProps) => {
  const {
    id,
    connectors: { connect, drag },
    actions: { setProp }
  } = useNode();

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }));

  // Handle local state vs builder props for active tab functionality
  // In preview mode, we need local state because setProp won't trigger re-renders or updates.
  const [localActiveTabId, setLocalActiveTabId] = useState(activeTabId);

  // Sync local state with prop when it changing from outside (e.g. Settings Panel)
  useEffect(() => {
    setLocalActiveTabId(activeTabId);
  }, [activeTabId]);

  // Fallback to first tab if activeTabId is invalid or empty
  const currentActiveTabId = tabs.some(t => t.id === localActiveTabId) 
    ? localActiveTabId 
    : (tabs.length > 0 ? tabs[0].id : "");


  // Component styling calculations (similar to Container)
  const p = typeof padding === 'number' ? padding : 0;
  const pl = paddingLeft !== undefined ? paddingLeft : p;
  const pr = paddingRight !== undefined ? paddingRight : p;
  const pt = paddingTop !== undefined ? paddingTop : p;
  const pb = paddingBottom !== undefined ? paddingBottom : p;

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

  // In preview (enabled === false), we should always respect the display prop 
  // and ignore editorVisibility (unless it's set to hide and we want to hide it in live too,
  // but usually editorVisibility is for builder UI control).
  // If display is already "none", it stays hidden.
  const effectiveDisplay = !enabled 
    ? display 
    : (editorVisibility === "hide"
        ? "none"
        : editorVisibility === "show" && display === "none"
          ? "flex"
          : display);

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


  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-node-id={id}
      className={`tabs-component w-full flex flex-col ${customClassName}`}
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
        display: effectiveDisplay,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? posRight : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? posLeft : undefined,
        boxShadow,
        opacity,
        overflow: overflow === "visible" ? undefined : overflow,
        cursor,
        transform: transformStyle,
        transformOrigin: "center center",
      }}
    >
      {/* Tab Headers */}
      <div 
        className="tabs-header flex flex-row w-full overflow-x-auto border-b no-scrollbar"
        style={{ 
          borderColor: borderColor !== "transparent" ? borderColor : "#e5e7eb",
          justifyContent: tabAlignment === "center" ? "center" : tabAlignment === "right" ? "flex-end" : "flex-start"
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === currentActiveTabId;
          return (
            <button
              key={tab.id}
              data-canvas-interactive="true"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onPointerDownCapture={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setLocalActiveTabId(tab.id);
                if (enabled) {
                  setProp((props: any) => {
                    props.activeTabId = tab.id;
                  });
                }
              }}
              className="px-6 py-4 font-semibold text-sm transition-all duration-300 border-b-2 whitespace-nowrap hover:bg-black/5 active:scale-95"
              style={{
                backgroundColor: isActive ? activeTabBackgroundColor : tabHeaderBackgroundColor,
                color: isActive ? activeTabTextColor : tabHeaderTextColor,
                borderBottomColor: isActive ? (activeTabTextColor || "#3b82f6") : "transparent",
                transform: isActive ? "scale(1.02)" : "scale(1)",
                zIndex: isActive ? 1 : 0
              }}
            >
              {tab.title}
            </button>
          );
        })}
      </div>

      {/* Tab Content Areas */}
      <div className="tabs-content relative w-full flex-grow min-h-[100px]">
        {tabs.map((tab) => {
          const isActive = tab.id === currentActiveTabId;
          
          return (
            <div 
              key={tab.id}
              style={{ pointerEvents: isActive ? "auto" : "none" }}
              className={`w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isActive ? "opacity-100 translate-y-0 relative" : "opacity-0 -translate-y-2 absolute inset-0"}`}
            >
              <div
                className="w-full min-h-[100px] flex flex-col"
              >
                <Element id={`tab-content-${tab.id}`} is={TabContent} canvas>
                  {tab.content}
                </Element>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TabsDefaultProps: Partial<TabsProps> = {
  tabs: [{ id: "tab-1", title: "Tab 1", content: "Tab 1 Content goes here..." }],
  activeTabId: "tab-1",
  tabHeaderBackgroundColor: "#f8fafc", // slate-50
  tabHeaderTextColor: "#64748b",       // slate-500
  activeTabBackgroundColor: "#ffffff",
  activeTabTextColor: "#0f172a",       // slate-900
  background: "#ffffff",
  padding: 0,
  width: "100%",
  height: "auto",
  borderWidth: 1,
  borderColor: "#e2e8f0",              // slate-200
  borderRadius: 8,
  display: "flex",
  tabAlignment: "left",
};

Tabs.craft = {
  displayName: "Tabs",
  props: TabsDefaultProps,
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  related: {
    settings: TabsSettings
  }
};
