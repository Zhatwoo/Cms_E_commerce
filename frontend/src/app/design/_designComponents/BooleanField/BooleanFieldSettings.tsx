import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { PositionGroup } from "../../_components/rightPanel/settings/PositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { BooleanInput } from "../../_components/rightPanel/settings/inputs/BooleanInput";
import { MultiSelectInput } from "../../_components/rightPanel/settings/inputs/MultiSelectInput";
import type { BooleanFieldProps, SetProp, TypographyProps } from "../../_types/components";

function makeOptionId(): string {
  return `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const BooleanFieldSettings = () => {
  const {
    controlType,
    name,
    disabled,
    showLabels,
    labelColor,
    color,
    gap,
    itemGap,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    lineHeight,
    letterSpacing,
    textAlign,
    textTransform,
    textDecoration,
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
    opacity,
    boxShadow,
    overflow,
    cursor,
    actions: { setProp },
  } = useNode((node) => ({
    controlType: node.data.props.controlType ?? "checkbox",
    name: node.data.props.name ?? "choice",
    disabled: node.data.props.disabled ?? false,
    showLabels: node.data.props.showLabels ?? true,
    labelColor: node.data.props.labelColor ?? "#000000",
    color: node.data.props.color ?? node.data.props.labelColor ?? "#000000",
    gap: node.data.props.gap ?? 10,
    itemGap: node.data.props.itemGap ?? 10,
    fontSize: node.data.props.fontSize ?? 14,
    fontFamily: node.data.props.fontFamily ?? "Outfit",
    fontWeight: node.data.props.fontWeight ?? "500",
    fontStyle: (node.data.props as any).fontStyle ?? "normal",
    lineHeight: (node.data.props as any).lineHeight ?? 1.2,
    letterSpacing: (node.data.props as any).letterSpacing ?? 0,
    textAlign: (node.data.props as any).textAlign ?? "left",
    textTransform: (node.data.props as any).textTransform ?? "none",
    textDecoration: (node.data.props as any).textDecoration ?? "none",
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
    opacity: node.data.props.opacity ?? 1,
    boxShadow: node.data.props.boxShadow ?? "none",
    overflow: node.data.props.overflow ?? "visible",
    cursor: node.data.props.cursor ?? "default",
  }));

  const typedSetProp = setProp as SetProp<BooleanFieldProps>;
  const typedSetTypographyProp = ((cb: (props: TypographyProps) => void) =>
    typedSetProp((props) => {
      cb(props as any);
      if (typeof (props as any).color === "string") {
        props.labelColor = (props as any).color;
      }
    })) as SetProp<TypographyProps>;
  const normalizedOptions: NonNullable<BooleanFieldProps["options"]> =
    Array.isArray(options) && options.length > 0
      ? options
      : [
        { id: "opt-1", label: "Option 1", checked: false },
        { id: "opt-2", label: "Option 2", checked: false },
        { id: "opt-3", label: "Option 3", checked: false },
      ];
  const selectedIds = normalizedOptions.filter((o) => !!o.checked).map((o) => o.id);

  return (
    <div className="flex flex-col pb-4">
      {/* Boolean Field section on top */}
      <DesignSection title="Boolean Field">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Type</label>
              <select
                value={(controlType as BooleanFieldProps["controlType"]) ?? "checkbox"}
                onChange={(e) => typedSetProp((props) => { props.controlType = e.target.value as any; })}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none appearance-none"
              >
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Group Name</label>
              <input
                type="text"
                value={name ?? ""}
                onChange={(e) => typedSetProp((props) => { props.name = e.target.value; })}
                placeholder="choice"
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <div className="bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md p-2">
                <BooleanInput
                  label="Show Labels"
                  value={!!showLabels}
                  onChange={(val) => typedSetProp((props) => { props.showLabels = val; })}
                  variant="checkbox"
                  layout="spread"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md p-2">
                <BooleanInput
                  label="Disabled"
                  value={!!disabled}
                  onChange={(val) => typedSetProp((props) => { props.disabled = val; })}
                  variant="checkbox"
                  layout="spread"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Gap</label>
              <NumericInput
                value={gap ?? 10}
                onChange={(val) => typedSetProp((props) => { props.gap = val; })}
                min={0}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Item Gap</label>
              <NumericInput
                value={itemGap ?? 10}
                onChange={(val) => typedSetProp((props) => { props.itemGap = val; })}
                min={0}
                unit="px"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="hidden md:block text-[10px] text-[var(--builder-text)]" aria-hidden="true">
              &nbsp;
            </div>
            <button
              type="button"
              onClick={() => typedSetProp((props) => {
                const next = Array.isArray(props.options) ? [...props.options] : [...normalizedOptions];
                next.push({ id: makeOptionId(), label: `Option ${next.length + 1}`, checked: false });
                props.options = next;
              })}
              className="w-full bg-[var(--builder-surface-3)] hover:bg-[var(--builder-surface-3)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] py-2 transition-colors"
            >
              Add option
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-[var(--builder-text)]">Options</label>
            <div className="flex flex-col gap-2">
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
                <div className="text-[10px] text-[var(--builder-text-faint)]">
                  Radio mode: only one option can be checked.
                </div>
              )}

              {normalizedOptions.map((opt, idx) => (
                <div key={opt.id} className="bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md p-2 flex flex-col gap-2">
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
                      className="flex-1 bg-black/20 border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => typedSetProp((props) => {
                        const next = (Array.isArray(props.options) ? [...props.options] : [...normalizedOptions]).filter((o) => o.id !== opt.id);
                        props.options = next.length ? next : [{ id: makeOptionId(), label: "Option 1", checked: false }];
                      })}
                      className="px-2 py-2 text-xs rounded-md bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 text-red-600 hover:text-red-700 transition-colors"
                      title="Remove option"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--builder-text-faint)]">Checked</span>
                    <div className="bg-black/20 border border-[var(--builder-border)] rounded-md px-2 py-1">
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
        </div>
      </DesignSection>

      {/* Transform */}
      <DesignSection title="Transform" defaultOpen={false}>
        <TransformGroup
          rotation={rotation}
          flipHorizontal={flipHorizontal}
          flipVertical={flipVertical}
          setProp={typedSetProp}
        />
      </DesignSection>

      {/* Layout & Layer */}
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

      {/* Size & Spacing */}
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

      {/* Typography (if text) */}
      <DesignSection title="Typography">
        <TypographyGroup
          fontFamily={fontFamily ?? "Outfit"}
          fontWeight={fontWeight ?? "500"}
          fontStyle={(fontStyle as any) ?? "normal"}
          fontSize={fontSize ?? 14}
          lineHeight={(lineHeight as any) ?? 1.2}
          letterSpacing={(letterSpacing as any) ?? 0}
          textAlign={(textAlign as any) ?? "left"}
          textTransform={(textTransform as any) ?? "none"}
          textDecoration={(textDecoration as any) ?? "none"}
          color={(color as any) ?? labelColor ?? "#000000"}
          setProp={typedSetTypographyProp}
        />
      </DesignSection>

      {/* Effects */}
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
