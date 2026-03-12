import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { BooleanInput } from "../../_components/rightPanel/settings/inputs/BooleanInput";
import { MultiSelectInput } from "../../_components/rightPanel/settings/inputs/MultiSelectInput";
import type { BooleanFieldProps, SetProp } from "../../_types/components";

function makeOptionId(): string {
  return `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const BooleanFieldSettings = () => {
  const {
    controlType,
    name,
    disabled,
    labelColor,
    gap,
    itemGap,
    fontSize,
    fontFamily,
    fontWeight,
    showLabels,
    options,
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
    opacity,
    boxShadow,
    actions: { setProp },
  } = useNode((node) => ({
    controlType: node.data.props.controlType,
    name: node.data.props.name,
    disabled: node.data.props.disabled,
    labelColor: node.data.props.labelColor,
    gap: node.data.props.gap,
    itemGap: node.data.props.itemGap,
    fontSize: node.data.props.fontSize,
    fontFamily: node.data.props.fontFamily,
    fontWeight: node.data.props.fontWeight,
    showLabels: node.data.props.showLabels,
    options: node.data.props.options,
    width: node.data.props.width ?? "fit-content",
    height: node.data.props.height ?? "fit-content",
    paddingTop: node.data.props.paddingTop ?? 0,
    paddingRight: node.data.props.paddingRight ?? 0,
    paddingBottom: node.data.props.paddingBottom ?? 0,
    paddingLeft: node.data.props.paddingLeft ?? 0,
    marginTop: node.data.props.marginTop ?? 0,
    marginRight: node.data.props.marginRight ?? 0,
    marginBottom: node.data.props.marginBottom ?? 0,
    marginLeft: node.data.props.marginLeft ?? 0,
    opacity: node.data.props.opacity,
    boxShadow: node.data.props.boxShadow,
  }));

  const typedSetProp = setProp as SetProp<BooleanFieldProps>;
  const normalizedOptions: NonNullable<BooleanFieldProps["options"]> = Array.isArray(options) && options.length > 0
    ? options
    : [
      { id: "opt-1", label: "Option 1", checked: false },
      { id: "opt-2", label: "Option 2", checked: false },
      { id: "opt-3", label: "Option 3", checked: false },
    ];
  const selectedIds = normalizedOptions.filter((o) => !!o.checked).map((o) => o.id);

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Boolean Field">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Type</label>
              <select
                value={(controlType as BooleanFieldProps["controlType"]) ?? "checkbox"}
                onChange={(e) => typedSetProp((props) => { props.controlType = e.target.value as any; })}
                className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none appearance-none"
              >
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Group Name</label>
              <input
                type="text"
                value={name ?? ""}
                onChange={(e) => typedSetProp((props) => { props.name = e.target.value; })}
                placeholder="choice"
                className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-2 focus:outline-none focus:border-brand-light"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Show Labels</label>
              <BooleanInput
                value={!!showLabels}
                onChange={(val) => typedSetProp((props) => { props.showLabels = val; })}
                variant="checkbox"
                layout="inline"
                className="py-1"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Disabled</label>
              <BooleanInput
                value={!!disabled}
                onChange={(val) => typedSetProp((props) => { props.disabled = val; })}
                variant="checkbox"
                className="py-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Label Color</label>
              <ColorPicker
                value={labelColor || "#000000"}
                onChange={(val) => typedSetProp((props) => { props.labelColor = val; })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Gap</label>
              <NumericInput
                value={gap ?? 10}
                onChange={(val) => typedSetProp((props) => { props.gap = val; })}
                min={0}
                unit="px"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Item Gap</label>
              <NumericInput
                value={itemGap ?? 10}
                onChange={(val) => typedSetProp((props) => { props.itemGap = val; })}
                min={0}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter"> </label>
              <button
                type="button"
                onClick={() => typedSetProp((props) => {
                  const next = Array.isArray(props.options) ? [...props.options] : [...normalizedOptions];
                  next.push({ id: makeOptionId(), label: `Option ${next.length + 1}`, checked: false });
                  props.options = next;
                })}
                className="w-full bg-brand-medium/30 hover:bg-brand-medium/50 border border-brand-medium/30 rounded-md text-xs text-brand-lighter py-2 transition-colors"
              >
                Add option
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-brand-lighter">Options</label>
            <div className="flex flex-col gap-2">
              {/* Quick multi-select for checked state */}
              {controlType === "checkbox" ? (
                <MultiSelectInput
                  label="Selected (checked)"
                  items={normalizedOptions.map((o) => ({ id: o.id, label: o.label || o.id }))}
                  value={selectedIds}
                  onChange={(nextIds) => typedSetProp((props) => {
                    const next = Array.isArray(props.options) ? [...props.options] : [...normalizedOptions];
                    const set = new Set(nextIds);
                    props.options = next.map((o) => ({ ...o, checked: set.has(o.id) }));
                  })}
                  placeholder="None selected"
                />
              ) : (
                <div className="text-[10px] text-brand-light/60">
                  Radio mode: only one option can be checked.
                </div>
              )}

              {normalizedOptions.map((opt, idx) => (
                <div key={opt.id} className="bg-brand-medium-dark border border-brand-medium/30 rounded-md p-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => typedSetProp((props) => {
                        const next = Array.isArray(props.options) ? [...props.options] : [...normalizedOptions];
                        const i = next.findIndex((o) => o.id === opt.id);
                        if (i >= 0) next[i] = { ...next[i], label: e.target.value };
                        props.options = next;
                      })}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 bg-black/20 border border-brand-medium/20 rounded-md text-xs text-brand-lighter p-2 focus:outline-none focus:border-brand-light"
                    />
                    <button
                      type="button"
                      onClick={() => typedSetProp((props) => {
                        const next = (Array.isArray(props.options) ? [...props.options] : [...normalizedOptions]).filter((o) => o.id !== opt.id);
                        props.options = next.length ? next : [{ id: makeOptionId(), label: "Option 1", checked: false }];
                      })}
                      className="px-2 py-2 text-xs rounded-md bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-200 transition-colors"
                      title="Remove option"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-brand-light/70">Checked</span>
                    <div className="bg-black/20 border border-brand-medium/20 rounded-md px-2 py-1">
                      <BooleanInput
                        value={!!opt.checked}
                        onChange={(val) => typedSetProp((props) => {
                          const next = Array.isArray(props.options) ? [...props.options] : [...normalizedOptions];
                          if ((props.controlType ?? controlType) === "radio") {
                            for (let j = 0; j < next.length; j++) {
                              next[j] = { ...next[j], checked: next[j].id === opt.id ? val : false };
                            }
                          } else {
                            const i = next.findIndex((o) => o.id === opt.id);
                            if (i >= 0) next[i] = { ...next[i], checked: val };
                          }
                          props.options = next;
                        })}
                        variant={(controlType as any) ?? "checkbox"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Font Size</label>
              <NumericInput
                value={fontSize ?? 14}
                onChange={(val) => typedSetProp((props) => { props.fontSize = val; })}
                min={8}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Weight</label>
              <select
                value={fontWeight ?? "500"}
                onChange={(e) => typedSetProp((props) => { props.fontWeight = e.target.value; })}
                className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
              >
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Font</label>
            <select
              value={fontFamily ?? "Outfit"}
              onChange={(e) => typedSetProp((props) => { props.fontFamily = e.target.value; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            >
              {[
                "Outfit",
                "Roboto",
                "Open Sans",
                "Poppins",
                "Ubuntu",
                "Lato",
                "Raleway",
                "Montserrat",
              ].map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Size & Position" defaultOpen={false}>
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

