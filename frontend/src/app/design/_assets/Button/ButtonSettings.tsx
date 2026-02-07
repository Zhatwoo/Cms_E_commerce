import React from "react";
import { useNode } from "@craftjs/core";
import { SettingsSection } from "../../_components/rightPanel/settings/SettingsSection";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { ColorInput } from "../../_components/rightPanel/settings/inputs/ColorInput";
import type { ButtonProps, SetProp } from "../../_types/components";

export const ButtonSettings = () => {
  const {
    label, link, variant,
    backgroundColor, textColor,
    fontSize, fontWeight, fontFamily,
    borderRadius, borderColor, borderWidth,
    width, height,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    opacity, boxShadow,
    actions: { setProp }
  } = useNode(node => ({
    label: node.data.props.label,
    link: node.data.props.link,
    variant: node.data.props.variant,
    backgroundColor: node.data.props.backgroundColor,
    textColor: node.data.props.textColor,
    fontSize: node.data.props.fontSize,
    fontWeight: node.data.props.fontWeight,
    fontFamily: node.data.props.fontFamily,
    borderRadius: node.data.props.borderRadius,
    borderColor: node.data.props.borderColor,
    borderWidth: node.data.props.borderWidth,
    width: node.data.props.width,
    height: node.data.props.height,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    marginLeft: node.data.props.marginLeft,
    marginRight: node.data.props.marginRight,
    marginTop: node.data.props.marginTop,
    marginBottom: node.data.props.marginBottom,
    opacity: node.data.props.opacity,
    boxShadow: node.data.props.boxShadow,
  }));

  const typedSetProp = setProp as SetProp<ButtonProps>;

  return (
    <div className="flex flex-col pb-4">
      <SettingsSection title="Button">
        <div className="flex flex-col gap-3">
          {/* Label */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter uppercase">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => typedSetProp((props) => { props.label = e.target.value; })}
              className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-2 focus:outline-none focus:border-brand-light"
            />
          </div>

          {/* Link URL */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter uppercase">Link URL</label>
            <input
              type="text"
              value={link}
              onChange={(e) => typedSetProp((props) => { props.link = e.target.value; })}
              placeholder="https://..."
              className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-2 focus:outline-none focus:border-brand-light"
            />
          </div>

          {/* Variant */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter uppercase">Variant</label>
            <div className="grid grid-cols-4 gap-1 bg-brand-dark/30 p-1 rounded-lg border border-brand-medium/20">
              {(["primary", "secondary", "outline", "ghost"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => typedSetProp((props) => { props.variant = v; })}
                  className={`text-[10px] py-1.5 rounded capitalize transition-colors ${variant === v
                      ? "bg-brand-medium/50 text-white"
                      : "text-brand-light hover:text-white"
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Style">
        <div className="flex flex-col gap-3">
          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter uppercase">Background</label>
              <div className="flex items-center gap-1 bg-brand-black border border-brand-medium/30 rounded-md p-1">
                <input
                  type="color"
                  value={backgroundColor || "#3b82f6"}
                  onChange={(e) => typedSetProp((props) => { props.backgroundColor = e.target.value; })}
                  className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0"
                />
                <ColorInput
                  value={backgroundColor || "#3b82f6"}
                  onChange={(val) => typedSetProp((props) => { props.backgroundColor = val; })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter uppercase">Text Color</label>
              <div className="flex items-center gap-1 bg-brand-black border border-brand-medium/30 rounded-md p-1">
                <input
                  type="color"
                  value={textColor || "#ffffff"}
                  onChange={(e) => typedSetProp((props) => { props.textColor = e.target.value; })}
                  className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0"
                />
                <ColorInput
                  value={textColor || "#ffffff"}
                  onChange={(val) => typedSetProp((props) => { props.textColor = val; })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Border & Radius */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter uppercase">Radius</label>
              <NumericInput
                value={borderRadius ?? 8}
                onChange={(val) => typedSetProp((props) => { props.borderRadius = val; })}
                min={0}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter uppercase">Border Width</label>
              <NumericInput
                value={borderWidth ?? 0}
                onChange={(val) => typedSetProp((props) => { props.borderWidth = val; })}
                min={0}
                unit="px"
              />
            </div>
          </div>

          {/* Typography */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter uppercase">Font Size</label>
              <NumericInput
                value={fontSize ?? 14}
                onChange={(val) => typedSetProp((props) => { props.fontSize = val; })}
                min={8}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter uppercase">Weight</label>
              <select
                value={fontWeight}
                onChange={(e) => typedSetProp((props) => { props.fontWeight = e.target.value; })}
                className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-1.5 focus:outline-none"
              >
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
              </select>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Size & Position">
        <SizePositionGroup
          width={width}
          height={height}
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
      </SettingsSection>

      <SettingsSection title="Effects" defaultOpen={false}>
        <EffectsGroup
          opacity={opacity}
          boxShadow={boxShadow}
          setProp={typedSetProp}
        />
      </SettingsSection>
    </div>
  );
};
