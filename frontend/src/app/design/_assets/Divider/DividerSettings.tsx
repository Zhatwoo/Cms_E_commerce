import React from "react";
import { useNode } from "@craftjs/core";
import { SettingsSection } from "../../_components/rightPanel/settings/SettingsSection";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { ColorInput } from "../../_components/rightPanel/settings/inputs/ColorInput";
import type { DividerProps, SetProp } from "../../_types/components";

export const DividerSettings = () => {
  const {
    dividerStyle, color, thickness, width, marginTop, marginBottom,
    actions: { setProp }
  } = useNode(node => ({
    dividerStyle: node.data.props.dividerStyle,
    color: node.data.props.color,
    thickness: node.data.props.thickness,
    width: node.data.props.width,
    marginTop: node.data.props.marginTop,
    marginBottom: node.data.props.marginBottom,
  }));

  const typedSetProp = setProp as SetProp<DividerProps>;

  return (
    <div className="flex flex-col pb-4">
      <SettingsSection title="Divider">
        <div className="flex flex-col gap-3">
          {/* Style */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Style</label>
            <div className="grid grid-cols-3 gap-1 bg-brand-dark/30 p-1 rounded-lg border border-brand-medium/20">
              {(["solid", "dashed", "dotted"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => typedSetProp((props) => { props.dividerStyle = s; })}
                  className={`text-[10px] py-1.5 rounded capitalize transition-colors ${dividerStyle === s
                      ? "bg-brand-medium/50 text-white"
                      : "text-brand-light hover:text-white"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Color</label>
            <div className="flex items-center gap-2 bg-brand-black border border-brand-medium/30 rounded-md p-1">
              <input
                type="color"
                value={color}
                onChange={(e) => typedSetProp((props) => { props.color = e.target.value; })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
              />
              <ColorInput
                value={color ?? "#4a4a4a"}
                onChange={(val) => typedSetProp((props) => { props.color = val; })}
                className="flex-1"
              />
            </div>
          </div>

          {/* Thickness & Width */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Thickness</label>
              <NumericInput
                value={thickness ?? 1}
                onChange={(val) => typedSetProp((props) => { props.thickness = val; })}
                min={1}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Width</label>
              <select
                value={width}
                onChange={(e) => typedSetProp((props) => { props.width = e.target.value; })}
                className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-1.5 focus:outline-none"
              >
                <option value="100%">Full</option>
                <option value="75%">75%</option>
                <option value="50%">50%</option>
                <option value="25%">25%</option>
              </select>
            </div>
          </div>

          {/* Spacing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Margin Top</label>
              <NumericInput
                value={marginTop ?? 8}
                onChange={(val) => typedSetProp((props) => { props.marginTop = val; })}
                min={0}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Margin Bottom</label>
              <NumericInput
                value={marginBottom ?? 8}
                onChange={(val) => typedSetProp((props) => { props.marginBottom = val; })}
                min={0}
                unit="px"
              />
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};
