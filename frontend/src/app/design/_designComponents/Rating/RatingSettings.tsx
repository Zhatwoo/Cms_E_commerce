import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { LayoutLayerGroup } from "../../_components/rightPanel/settings/LayoutLayerGroup";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import type { RatingProps, SetProp } from "../../_types/components";

export const RatingSettings = () => {
  const {
    id,
    value,
    max,
    size,
    gap,
    valueGap,
    filledColor,
    emptyColor,
    interactive,
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
    position,
    display,
    alignSelf,
    zIndex,
    top,
    right,
    bottom,
    left,
    isFreeform,
    editorVisibility,
    rotation,
    flipHorizontal,
    flipVertical,
    opacity,
    boxShadow,
    overflow,
    cursor,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    value: Math.round(node.data.props.value ?? 4),
    max: node.data.props.max ?? 5,
    size: node.data.props.size ?? 20,
    gap: node.data.props.gap ?? 4,
    valueGap: node.data.props.valueGap ?? 8,
    filledColor: node.data.props.filledColor ?? "#f59e0b",
    emptyColor: node.data.props.emptyColor ?? "#475569",
    interactive: node.data.props.interactive ?? false,
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
    borderRadius: node.data.props.borderRadius ?? 8,
    radiusTopLeft: node.data.props.radiusTopLeft,
    radiusTopRight: node.data.props.radiusTopRight,
    radiusBottomRight: node.data.props.radiusBottomRight,
    radiusBottomLeft: node.data.props.radiusBottomLeft,
    borderWidth: node.data.props.borderWidth ?? 0,
    borderColor: node.data.props.borderColor ?? "transparent",
    borderStyle: node.data.props.borderStyle ?? "solid",
    position: node.data.props.position ?? "relative",
    display: node.data.props.display ?? "inline-flex",
    alignSelf: node.data.props.alignSelf ?? "auto",
    zIndex: node.data.props.zIndex ?? 1,
    top: node.data.props.top ?? "auto",
    right: node.data.props.right ?? "auto",
    bottom: node.data.props.bottom ?? "auto",
    left: node.data.props.left ?? "auto",
    isFreeform: node.data.props.isFreeform,
    editorVisibility: node.data.props.editorVisibility ?? "auto",
    rotation: node.data.props.rotation ?? 0,
    flipHorizontal: node.data.props.flipHorizontal ?? false,
    flipVertical: node.data.props.flipVertical ?? false,
    opacity: node.data.props.opacity ?? 1,
    boxShadow: node.data.props.boxShadow ?? "none",
    overflow: node.data.props.overflow ?? "visible",
    cursor: node.data.props.cursor ?? "default",
  }));

  const typedSetProp = setProp as SetProp<RatingProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Rating">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Value</label>
            <input
              type="number"
              value={value}
              step="1"
              min={0}
              max={Math.max(1, Math.round(Number(max) || 5))}
              onChange={(e) => {
                const raw = e.currentTarget.valueAsNumber;
                const rounded = Number.isFinite(raw) ? Math.round(raw) : 0;
                const clamped = Math.min(Math.max(0, rounded), Math.max(1, Math.round(Number(max) || 5)));
                typedSetProp((p) => { p.value = clamped; });
              }}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Max Stars</label>
            <input
              type="number"
              value={max}
              min={1}
              onChange={(e) => typedSetProp((p) => { p.max = Number(e.target.value); })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Star Size</label>
            <input
              type="number"
              value={size}
              onChange={(e) => typedSetProp((p) => { p.size = Number(e.target.value); })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Star Gap</label>
            <input
              type="number"
              value={gap}
              onChange={(e) => typedSetProp((p) => { p.gap = Number(e.target.value); })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Value Gap</label>
            <input
              type="number"
              value={valueGap}
              onChange={(e) => typedSetProp((p) => { p.valueGap = Number(e.target.value); })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Interactive</label>
            <input
              type="checkbox"
              checked={!!interactive}
              onChange={(e) => typedSetProp((p) => { p.interactive = e.target.checked; })}
              className="accent-[var(--builder-accent)] cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Filled Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={filledColor}
                onChange={(e) => typedSetProp((p) => { p.filledColor = e.target.value; })}
                className="w-8 h-8 rounded-lg border border-[var(--builder-border)] bg-transparent cursor-pointer overflow-hidden p-0"
              />
              <input
                type="text"
                value={filledColor}
                onChange={(e) => typedSetProp((p) => { p.filledColor = e.target.value; })}
                className="flex-1 bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-[11px] text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Empty Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={emptyColor}
                onChange={(e) => typedSetProp((p) => { p.emptyColor = e.target.value; })}
                className="w-8 h-8 rounded-lg border border-[var(--builder-border)] bg-transparent cursor-pointer overflow-hidden p-0"
              />
              <input
                type="text"
                value={emptyColor}
                onChange={(e) => typedSetProp((p) => { p.emptyColor = e.target.value; })}
                className="flex-1 bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-[11px] text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
              />
            </div>
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
        <LayoutLayerGroup
          nodeId={id}
          position={position}
          display={display}
          isFreeform={isFreeform}
          alignSelf={alignSelf}
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
          setProp={typedSetProp}
        />
      </DesignSection>
    </div>
  );
};
