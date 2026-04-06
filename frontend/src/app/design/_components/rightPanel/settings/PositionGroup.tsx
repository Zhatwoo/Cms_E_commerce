import React from "react";
import { NumericInput } from "./inputs/NumericInput";
import type { PositionProps, SetProp } from "../../../_types/components";

interface PositionGroupProps extends PositionProps {
  setProp: SetProp<PositionProps>;
}

const POSITION_OPTIONS: { value: PositionProps["position"]; label: string }[] = [
  { value: "static", label: "Static" },
  { value: "relative", label: "Relative" },
  { value: "absolute", label: "Absolute" },
  { value: "fixed", label: "Fixed" },
  { value: "sticky", label: "Sticky" },
];

const DISPLAY_OPTIONS: { value: PositionProps["display"]; label: string }[] = [
  { value: "flex", label: "Flex" },
  { value: "inline-flex", label: "Inline Flex" },
  { value: "grid", label: "Grid" },
  { value: "block", label: "Block" },
  { value: "inline-block", label: "Inline Block" },
  { value: "none", label: "None" },
];

const ALIGN_SELF_OPTIONS: { value: NonNullable<PositionProps["alignSelf"]>; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "stretch", label: "Stretch" },
];

const EDITOR_VISIBILITY_OPTIONS: { value: NonNullable<PositionProps["editorVisibility"]>; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "show", label: "Show" },
  { value: "hide", label: "Hide" },
];

export const PositionGroup = ({
  position = "static",
  display = "flex",
  alignSelf = "auto",
  zIndex = 0,
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  editorVisibility = "auto",
  setProp,
}: PositionGroupProps) => {
  const showOffsets = position !== "static";

  const parseOffset = (val: string): string => {
    if (val === "auto") return "";
    return val.replace("px", "");
  };

  const handleOffsetChange = (
    side: "top" | "right" | "bottom" | "left",
    rawValue: string
  ) => {
    setProp((props) => {
      if (rawValue === "" || rawValue === "auto") {
        props[side] = "auto";
      } else {
        props[side] = rawValue + "px";
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Position Mode */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-[var(--builder-text)] font-base">
          Position
        </label>
        <select
          value={position}
          onChange={(e) =>
            setProp((props) => {
              props.position = e.target.value as PositionProps["position"];
            })
          }
          className="w-full bg-[var(--builder-surface-2)] rounded-lg text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none appearance-none"
        >
          {POSITION_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="text-[var(--builder-text-muted)] bg-[var(--builder-surface)]"
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Offset Controls — only when position is not static */}
      {showOffsets && (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-[var(--builder-text)]">Offsets</label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { label: "T", key: "top", val: top },
                { label: "R", key: "right", val: right },
                { label: "B", key: "bottom", val: bottom },
                { label: "L", key: "left", val: left },
              ] as const
            ).map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-1 bg-[var(--builder-surface-2)] px-1.5 rounded-lg"
              >
                <span className="text-[10px] text-[var(--builder-text-muted)] text-center px-1.5">
                  {item.label}
                </span>
                <input
                  type="text"
                  value={parseOffset(item.val)}
                  placeholder="auto"
                  onChange={(e) => handleOffsetChange(item.key, e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className="w-full bg-transparent text-xs text-[var(--builder-text)] p-1.5 focus:outline-none placeholder:text-[var(--builder-text-faint)]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display Mode */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-[var(--builder-text)] font-base">
          Display
        </label>
        <select
          value={display}
          onChange={(e) =>
            setProp((props) => {
              props.display = e.target.value as PositionProps["display"];
            })
          }
          className="w-full bg-[var(--builder-surface-2)] rounded-lg text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none appearance-none"
        >
          {DISPLAY_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="text-[var(--builder-text-muted)] bg-[var(--builder-surface)]"
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Align Self (for flex parents) */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-[var(--builder-text)] font-base">
          Align Self
        </label>
        <select
          value={alignSelf ?? "auto"}
          onChange={(e) =>
            setProp((props) => {
              props.alignSelf = e.target.value as PositionProps["alignSelf"];
            })
          }
          className="w-full bg-[var(--builder-surface-2)] rounded-lg text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none appearance-none"
        >
          {ALIGN_SELF_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="text-[var(--builder-text-muted)] bg-[var(--builder-surface)]"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-[var(--builder-text-muted)] leading-snug">
          Works when the parent display is Flex/Inline Flex.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-[var(--builder-text)] font-base">
          Canvas Visibility
        </label>
        <select
          value={editorVisibility}
          onChange={(e) =>
            setProp((props) => {
              props.editorVisibility = e.target.value as PositionProps["editorVisibility"];
            })
          }
          className="w-full bg-[var(--builder-surface-2)] rounded-lg text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none appearance-none"
        >
          {EDITOR_VISIBILITY_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="text-[var(--builder-text-muted)] bg-[var(--builder-surface)]"
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Z-Index */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-[var(--builder-text)] font-base">
          Z-Index
        </label>
        <div className="bg-[var(--builder-surface-2)] px-2.5 rounded-lg">
          <NumericInput
            value={zIndex}
            onChange={(val) =>
              setProp((props) => {
                props.zIndex = val;
              })
            }
            min={-999}
            max={9999}
          />
        </div>
      </div>
    </div>
  );
};
