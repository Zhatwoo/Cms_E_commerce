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
  { value: "grid", label: "Grid" },
  { value: "block", label: "Block" },
  { value: "inline-block", label: "Inline Block" },
  { value: "none", label: "None" },
];

export const PositionGroup = ({
  position = "static",
  display = "flex",
  zIndex = 0,
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
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
        <label className="text-[12px] text-brand-lighter font-base">
          Position
        </label>
        <select
          value={position}
          onChange={(e) =>
            setProp((props) => {
              props.position = e.target.value as PositionProps["position"];
            })
          }
          className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none"
        >
          {POSITION_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="text-brand-light bg-brand-dark"
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Offset Controls — only when position is not static */}
      {showOffsets && (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-brand-lighter">Offsets</label>
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
                className="flex items-center gap-1 bg-brand-medium-dark px-1.5 rounded-lg"
              >
                <span className="text-[10px] text-brand-light text-center px-1.5">
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
                  className="w-full bg-transparent text-xs text-brand-lighter p-1.5 focus:outline-none placeholder:text-brand-medium"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display Mode */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-brand-lighter font-base">
          Display
        </label>
        <select
          value={display}
          onChange={(e) =>
            setProp((props) => {
              props.display = e.target.value as PositionProps["display"];
            })
          }
          className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none"
        >
          {DISPLAY_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="text-brand-light bg-brand-dark"
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Z-Index */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-brand-lighter font-base">
          Z-Index
        </label>
        <div className="bg-brand-medium-dark px-2.5 rounded-lg">
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
