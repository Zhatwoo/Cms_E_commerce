import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import type { ButtonProps, SetProp } from "../../_types/components";

const FONT_OPTIONS = [
  "Outfit",
  "Roboto",
  "Open Sans",
  "Poppins",
  "Ubuntu",
  "Lato",
  "Raleway",
  "Playfair Display",
  "EB Garamond",
  "Merriweather",
  "Lora",
  "Montserrat",
  "Oswald",
  "Pacifico",
  "JetBrains Mono",
  "Fira Code",
];

export const ButtonSettings = () => {
  const {
    label, link, variant,
    backgroundColor, textColor,
    fontSize, fontWeight, fontFamily,
    borderRadius, borderWidth,
    width, height,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    opacity, boxShadow,
    rotation, flipHorizontal, flipVertical,
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
    rotation: node.data.props.rotation,
    flipHorizontal: node.data.props.flipHorizontal,
    flipVertical: node.data.props.flipVertical,
  }));

  const typedSetProp = setProp as SetProp<ButtonProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Position & Transform">
        <TransformGroup
          rotation={rotation}
          flipHorizontal={flipHorizontal}
          flipVertical={flipVertical}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Button">
        <div className="flex flex-col gap-3">
          {/* Label */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => typedSetProp((props) => { props.label = e.target.value; })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
            />
          </div>

          {/* Link URL */}
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

          {/* Variant */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Variant</label>
            <div className="grid grid-cols-5 gap-1 bg-[var(--builder-surface-2)] p-1 rounded-lg border border-[var(--builder-border)]">
              {(["primary", "secondary", "outline", "ghost", "cta"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => typedSetProp((props) => {
                    props.variant = v;
                    if (v === "cta") {
                      props.borderRadius = 0;
                      props.fontWeight = "700";
                      props.fontSize = 16;
                      props.paddingTop = 8;
                      props.paddingBottom = 8;
                      props.paddingLeft = 22;
                      props.paddingRight = 22;
                    }
                  })}
                  className={`text-[10px] py-1.5 rounded capitalize transition-colors ${variant === v
                    ? "bg-[var(--builder-accent)] text-black"
                    : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Style">
        <div className="flex flex-col gap-3">
          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Background</label>
              <ColorPicker
                value={backgroundColor || "#3b82f6"}
                onChange={(val) => typedSetProp((props) => { props.backgroundColor = val; })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Text Color</label>
              <ColorPicker
                value={textColor || "#ffffff"}
                onChange={(val) => typedSetProp((props) => { props.textColor = val; })}
              />
            </div>
          </div>

          {/* Border & Radius */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Radius</label>
              <NumericInput
                value={borderRadius ?? 8}
                onChange={(val) => typedSetProp((props) => { props.borderRadius = val; })}
                min={0}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Border Width</label>
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
              <label className="text-[10px] text-[var(--builder-text)]">Font Size</label>
              <NumericInput
                value={fontSize ?? 14}
                onChange={(val) => typedSetProp((props) => { props.fontSize = val; })}
                min={8}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Weight</label>
              <select
                value={fontWeight}
                onChange={(e) => typedSetProp((props) => { props.fontWeight = e.target.value; })}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
              >
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Font</label>
            <select
              value={fontFamily || "Outfit"}
              onChange={(e) => typedSetProp((props) => { props.fontFamily = e.target.value; })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Size & Position">
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
      </DesignSection>

      <DesignSection title="Effects" defaultOpen={false}>
        <EffectsGroup
          opacity={opacity}
          boxShadow={boxShadow}
          setProp={typedSetProp}
        />
      </DesignSection>

    </div>
  );
};
