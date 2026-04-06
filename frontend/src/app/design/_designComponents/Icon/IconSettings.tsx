import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { PositionGroup } from "../../_components/rightPanel/settings/PositionGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import type { IconProps, SetProp } from "../../_types/components";

const ICON_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Search", value: "search" },
  { label: "Home", value: "home" },
  { label: "Menu", value: "menu" },
  { label: "Close", value: "close" },
  { label: "Settings", value: "settings" },
  { label: "Heart", value: "heart" },
  { label: "Plus", value: "plus" },
  { label: "Trash", value: "trash" },
  { label: "Star", value: "star" },
  { label: "Check", value: "check" },
  { label: "Chevron Right", value: "chevron-right" },
  { label: "Arrow Left", value: "arrow-left" },
  { label: "Arrow Right", value: "arrow-right" },
  { label: "Cart", value: "cart" },
  { label: "Shopping Bag", value: "shoppingBag" },
  { label: "Shopping Basket", value: "shoppingBasket" },
  { label: "User", value: "user" },
  { label: "Facebook", value: "facebook" },
  { label: "Google", value: "google" },
  { label: "Instagram", value: "instagram" },
  { label: "Twitter", value: "twitter" },
];

export const IconSettings = () => {
  const {
    iconType,
    size,
    color,
    link,
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    rotation,
    flipHorizontal,
    flipVertical,
    position,
    display,
    alignSelf,
    zIndex,
    top,
    right,
    bottom,
    left,
    editorVisibility,
    opacity,
    boxShadow,
    overflow,
    cursor,
    actions: { setProp },
  } = useNode((node) => ({
    iconType: node.data.props.iconType ?? "home",
    size: node.data.props.size ?? 24,
    color: node.data.props.color ?? "currentColor",
    link: node.data.props.link ?? "",
    width: node.data.props.width ?? "auto",
    height: node.data.props.height ?? "auto",
    paddingLeft: node.data.props.paddingLeft ?? 0,
    paddingRight: node.data.props.paddingRight ?? 0,
    paddingTop: node.data.props.paddingTop ?? 0,
    paddingBottom: node.data.props.paddingBottom ?? 0,
    marginLeft: node.data.props.marginLeft ?? 0,
    marginRight: node.data.props.marginRight ?? 0,
    marginTop: node.data.props.marginTop ?? 0,
    marginBottom: node.data.props.marginBottom ?? 0,
    rotation: node.data.props.rotation ?? 0,
    flipHorizontal: node.data.props.flipHorizontal ?? false,
    flipVertical: node.data.props.flipVertical ?? false,
    position: node.data.props.position ?? "relative",
    display: node.data.props.display ?? "inline-flex",
    alignSelf: node.data.props.alignSelf ?? "auto",
    zIndex: node.data.props.zIndex ?? 0,
    top: node.data.props.top ?? "auto",
    right: node.data.props.right ?? "auto",
    bottom: node.data.props.bottom ?? "auto",
    left: node.data.props.left ?? "auto",
    editorVisibility: node.data.props.editorVisibility ?? "auto",
    opacity: node.data.props.opacity ?? 1,
    boxShadow: node.data.props.boxShadow ?? "none",
    overflow: node.data.props.overflow ?? "visible",
    cursor: node.data.props.cursor ?? "default",
  }));

  const typedSetProp = setProp as SetProp<IconProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Icon">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Type</label>
            <select
              value={iconType}
              onChange={(e) => typedSetProp((props) => { props.iconType = e.target.value; })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none appearance-none"
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Size</label>
              <NumericInput
                value={size}
                onChange={(val) => typedSetProp((props) => { props.size = val; })}
                min={8}
                max={256}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Color</label>
              <ColorPicker
                value={color || "#ffffff"}
                onChange={(val) => typedSetProp((props) => { props.color = val; })}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Link URL</label>
            <input
              type="text"
              value={link}
              onChange={(e) => typedSetProp((props) => { props.link = e.target.value; })}
              placeholder="https://..."
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
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
          width={width as string}
          height={height as string}
          paddingLeft={paddingLeft}
          paddingRight={paddingRight}
          paddingTop={paddingTop}
          paddingBottom={paddingBottom}
          marginLeft={marginLeft}
          marginRight={marginRight}
          marginTop={marginTop}
          marginBottom={marginBottom}
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

