import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { PositionGroup } from "../../_components/rightPanel/settings/PositionGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import type { PaginationProps, SetProp } from "../../_types/components";

export const PaginationSettings = () => {
  const {
    totalItems,
    itemsPerPage,
    currentPage,
    type,
    activeColor,
    gap,
    prevText,
    nextText,
    fontSize,
    fontWeight,
    color,
    textAlign,
    textDecoration,
    width,
    height,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    background,
    borderRadius,
    radiusTopLeft,
    radiusTopRight,
    radiusBottomRight,
    radiusBottomLeft,
    borderWidth,
    borderColor,
    borderStyle,
    opacity,
    boxShadow,
    overflow,
    cursor,
    rotation,
    flipHorizontal,
    flipVertical,
    position,
    display,
    zIndex,
    top,
    right,
    bottom,
    left,
    editorVisibility,
    actions: { setProp },
  } = useNode((node) => ({
    totalItems: node.data.props.totalItems ?? 50,
    itemsPerPage: node.data.props.itemsPerPage ?? 10,
    currentPage: node.data.props.currentPage ?? 1,
    type: node.data.props.type ?? "numbers",
    activeColor: node.data.props.activeColor ?? "#3b82f6",
    gap: node.data.props.gap ?? 8,
    prevText: node.data.props.prevText ?? "Prev",
    nextText: node.data.props.nextText ?? "Next",
    fontSize: node.data.props.fontSize ?? 14,
    fontWeight: node.data.props.fontWeight ?? "400",
    color: node.data.props.color ?? "#a1a1aa",
    textAlign: node.data.props.textAlign ?? "center",
    textDecoration: node.data.props.textDecoration ?? "none",
    width: node.data.props.width ?? "auto",
    height: node.data.props.height ?? "auto",
    paddingTop: node.data.props.paddingTop ?? 0,
    paddingRight: node.data.props.paddingRight ?? 0,
    paddingBottom: node.data.props.paddingBottom ?? 0,
    paddingLeft: node.data.props.paddingLeft ?? 0,
    marginTop: node.data.props.marginTop ?? 0,
    marginRight: node.data.props.marginRight ?? 0,
    marginBottom: node.data.props.marginBottom ?? 0,
    marginLeft: node.data.props.marginLeft ?? 0,
    background: node.data.props.background ?? "transparent",
    borderRadius: node.data.props.borderRadius ?? 6,
    radiusTopLeft: node.data.props.radiusTopLeft,
    radiusTopRight: node.data.props.radiusTopRight,
    radiusBottomRight: node.data.props.radiusBottomRight,
    radiusBottomLeft: node.data.props.radiusBottomLeft,
    borderWidth: node.data.props.borderWidth ?? 1,
    borderColor: node.data.props.borderColor ?? "#3f3f46",
    borderStyle: node.data.props.borderStyle ?? "solid",
    opacity: node.data.props.opacity ?? 1,
    boxShadow: node.data.props.boxShadow ?? "none",
    overflow: node.data.props.overflow ?? "visible",
    cursor: node.data.props.cursor ?? "default",
    rotation: node.data.props.rotation ?? 0,
    flipHorizontal: node.data.props.flipHorizontal ?? false,
    flipVertical: node.data.props.flipVertical ?? false,
    position: node.data.props.position ?? "relative",
    display: node.data.props.display ?? "inline-flex",
    zIndex: node.data.props.zIndex ?? 0,
    top: node.data.props.top ?? "auto",
    right: node.data.props.right ?? "auto",
    bottom: node.data.props.bottom ?? "auto",
    left: node.data.props.left ?? "auto",
    editorVisibility: node.data.props.editorVisibility ?? "auto",
  }));

  const typedSetProp = setProp as SetProp<PaginationProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Typography">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Prev Label</label>
            <input
              type="text"
              value={prevText}
              onChange={(e) => typedSetProp((p) => { p.prevText = e.target.value; })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Next Label</label>
            <input
              type="text"
              value={nextText}
              onChange={(e) => typedSetProp((p) => { p.nextText = e.target.value; })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>
        </div>
        <TypographyGroup
          fontSize={fontSize}
          fontWeight={fontWeight}
          color={color}
          textAlign={textAlign}
          textDecoration={textDecoration}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Pagination">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => typedSetProp((p) => { p.type = e.target.value as any; })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
            >
              <option value="numbers">Numbers</option>
              <option value="simple">Simple (Back/Next)</option>
              <option value="load-more">Load More Button</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)] font-medium">Total Items</label>
              <input
                type="number"
                value={totalItems}
                onChange={(e) => typedSetProp((p) => { p.totalItems = Number(e.target.value); })}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)] font-medium">Per Page</label>
              <input
                type="number"
                value={itemsPerPage}
                onChange={(e) => typedSetProp((p) => { p.itemsPerPage = Number(e.target.value); })}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Current Page</label>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => typedSetProp((p) => { p.currentPage = Number(e.target.value); })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Active Page Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={activeColor}
                onChange={(e) => typedSetProp((p) => { p.activeColor = e.target.value; })}
                className="w-8 h-8 rounded-lg border border-[var(--builder-border)] bg-transparent cursor-pointer overflow-hidden p-0"
              />
              <input
                type="text"
                value={activeColor}
                onChange={(e) => typedSetProp((p) => { p.activeColor = e.target.value; })}
                className="flex-1 bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-[11px] text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Spacing (Gap)</label>
            <input
              type="number"
              value={gap}
              onChange={(e) => typedSetProp((p) => { p.gap = Number(e.target.value); })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Transform" defaultOpen={false}>
        <TransformGroup
          rotation={rotation}
          flipHorizontal={flipHorizontal}
          flipVertical={flipVertical}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Layout & Layer" defaultOpen={false}>
        <PositionGroup
          position={position}
          display={display}
          zIndex={zIndex}
          top={top}
          right={right}
          bottom={bottom}
          left={left}
          editorVisibility={editorVisibility}
          setProp={typedSetProp as any}
        />
      </DesignSection>

      <DesignSection title="Size & Spacing" defaultOpen={false}>
        <SizePositionGroup
          width={width}
          height={height}
          paddingTop={paddingTop}
          paddingRight={paddingRight}
          paddingBottom={paddingBottom}
          paddingLeft={paddingLeft}
          marginTop={marginTop}
          marginRight={marginRight}
          marginBottom={marginBottom}
          marginLeft={marginLeft}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Appearance" defaultOpen={false}>
        <AppearanceGroup
          background={background}
          borderRadius={borderRadius}
          radiusTopLeft={radiusTopLeft}
          radiusTopRight={radiusTopRight}
          radiusBottomRight={radiusBottomRight}
          radiusBottomLeft={radiusBottomLeft}
          borderWidth={borderWidth}
          borderColor={borderColor}
          borderStyle={borderStyle}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Effects" defaultOpen={false}>
        <EffectsGroup
          opacity={opacity}
          boxShadow={boxShadow}
          overflow={overflow}
          cursor={cursor}
          setProp={typedSetProp as any}
        />
      </DesignSection>
    </div>
  );
};

