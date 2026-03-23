import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { PositionGroup } from "../../_components/rightPanel/settings/PositionGroup";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import type { RatingProps, SetProp } from "../../_types/components";

export const RatingSettings = () => {
  const {
    value,
    max,
    size,
    gap,
    valueGap,
    filledColor,
    emptyColor,
    showValue,
    valueText,
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
    fontFamily,
    fontWeight,
    fontStyle,
    fontSize,
    lineHeight,
    letterSpacing,
    textAlign,
    textTransform,
    color,
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
    zIndex,
    top,
    right,
    bottom,
    left,
    editorVisibility,
    opacity,
    boxShadow,
    actions: { setProp },
  } = useNode((node) => ({
    value: Math.round(node.data.props.value ?? 4),
    max: node.data.props.max ?? 5,
    size: node.data.props.size ?? 20,
    gap: node.data.props.gap ?? 4,
    valueGap: node.data.props.valueGap ?? 8,
    filledColor: node.data.props.filledColor ?? "#f59e0b",
    emptyColor: node.data.props.emptyColor ?? "#475569",
    showValue: node.data.props.showValue ?? true,
    valueText: node.data.props.valueText ?? "",
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
    fontFamily: node.data.props.fontFamily ?? "Outfit",
    fontWeight: node.data.props.fontWeight ?? "500",
    fontStyle: node.data.props.fontStyle ?? "normal",
    fontSize: node.data.props.fontSize ?? 12,
    lineHeight: node.data.props.lineHeight ?? 1.2,
    letterSpacing: node.data.props.letterSpacing ?? 0,
    textAlign: node.data.props.textAlign ?? "left",
    textTransform: node.data.props.textTransform ?? "none",
    color: node.data.props.color ?? "#e2e8f0",
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
    zIndex: node.data.props.zIndex ?? 1,
    top: node.data.props.top ?? "auto",
    right: node.data.props.right ?? "auto",
    bottom: node.data.props.bottom ?? "auto",
    left: node.data.props.left ?? "auto",
    editorVisibility: node.data.props.editorVisibility ?? "auto",
    opacity: node.data.props.opacity ?? 1,
    boxShadow: node.data.props.boxShadow ?? "none",
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
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Show Value</label>
            <input
              type="checkbox"
              checked={!!showValue}
              onChange={(e) => typedSetProp((p) => { p.showValue = e.target.checked; })}
              className="accent-[var(--builder-accent)] cursor-pointer"
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

      <DesignSection title="Value Text">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)] font-medium">Custom Value</label>
            <input
              type="text"
              value={valueText}
              onChange={(e) => typedSetProp((p) => {
                const next = e.target.value;
                p.valueText = next.trim() === "" ? undefined : next;
              })}
              placeholder="Leave blank for auto"
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>
          <TypographyGroup
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            fontStyle={fontStyle}
            fontSize={fontSize}
            lineHeight={lineHeight}
            letterSpacing={letterSpacing}
            textAlign={textAlign}
            textTransform={textTransform}
            color={color}
            setProp={typedSetProp}
          />
        </div>
      </DesignSection>

      <DesignSection title="Box Appearance" defaultOpen={false}>
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

      <DesignSection title="Size & Effects" defaultOpen={false}>
        <PositionGroup
          position={position}
          display={display}
          zIndex={zIndex}
          top={top}
          right={right}
          bottom={bottom}
          left={left}
          editorVisibility={editorVisibility}
          setProp={typedSetProp}
        />
        <div className="my-4 border-t border-[var(--builder-border)]" />
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
        <div className="mt-4">
          <EffectsGroup
            opacity={opacity}
            boxShadow={boxShadow}
            setProp={typedSetProp}
          />
        </div>
      </DesignSection>
    </div>
  );
};
