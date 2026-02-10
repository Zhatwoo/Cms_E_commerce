import React from "react";
import { NumericInput } from "./inputs/NumericInput";
import type { GridProps, SetProp } from "../../../_types/components";

interface GridLayoutGroupProps extends GridProps {
  setProp: SetProp<GridProps>;
}

const COLUMN_PRESETS = [
  { label: "1 col", value: "1fr" },
  { label: "2 col", value: "1fr 1fr" },
  { label: "3 col", value: "1fr 1fr 1fr" },
  { label: "4 col", value: "1fr 1fr 1fr 1fr" },
  { label: "1-2", value: "1fr 2fr" },
  { label: "2-1", value: "2fr 1fr" },
];

const AUTO_FLOW_OPTIONS: { value: GridProps["gridAutoFlow"]; label: string }[] = [
  { value: "row", label: "Row" },
  { value: "column", label: "Column" },
  { value: "dense", label: "Dense" },
  { value: "row dense", label: "Row Dense" },
  { value: "column dense", label: "Column Dense" },
];

export const GridLayoutGroup = ({
  gridTemplateColumns = "1fr 1fr",
  gridTemplateRows = "auto",
  gridGap = 0,
  gridColumnGap,
  gridRowGap,
  gridAutoRows = "auto",
  gridAutoFlow = "row",
  setProp,
}: GridLayoutGroupProps) => {
  const effectiveColGap = gridColumnGap ?? gridGap;
  const effectiveRowGap = gridRowGap ?? gridGap;

  return (
    <div className="flex flex-col gap-4">
      {/* Column Presets */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-brand-lighter font-base">
          Columns
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {COLUMN_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() =>
                setProp((props) => {
                  props.gridTemplateColumns = preset.value;
                })
              }
              className={`text-[10px] px-2 py-1.5 rounded-lg transition-all ${gridTemplateColumns === preset.value
                  ? "bg-brand-light text-brand-dark font-medium"
                  : "bg-brand-medium-dark text-brand-light hover:bg-brand-medium/40"
                }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {/* Custom template columns input */}
        <input
          type="text"
          value={gridTemplateColumns}
          onChange={(e) =>
            setProp((props) => {
              props.gridTemplateColumns = e.target.value;
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="e.g. 1fr 2fr 1fr"
          className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none placeholder:text-brand-medium mt-1"
        />
      </div>

      {/* Template Rows */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-brand-lighter font-base">Rows</label>
        <input
          type="text"
          value={gridTemplateRows}
          onChange={(e) =>
            setProp((props) => {
              props.gridTemplateRows = e.target.value;
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="e.g. auto 200px 1fr"
          className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none placeholder:text-brand-medium"
        />
      </div>

      {/* Auto Rows */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-brand-lighter font-base">
          Auto Rows
        </label>
        <input
          type="text"
          value={gridAutoRows}
          onChange={(e) =>
            setProp((props) => {
              props.gridAutoRows = e.target.value;
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="e.g. minmax(100px, auto)"
          className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none placeholder:text-brand-medium"
        />
      </div>

      {/* Auto Flow */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-brand-lighter font-base">
          Auto Flow
        </label>
        <select
          value={gridAutoFlow}
          onChange={(e) =>
            setProp((props) => {
              props.gridAutoFlow = e.target.value as GridProps["gridAutoFlow"];
            })
          }
          className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none"
        >
          {AUTO_FLOW_OPTIONS.map((opt) => (
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

      {/* Gap Controls */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] text-brand-lighter font-base">Gap</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-brand-light">Column</span>
            <div className="bg-brand-medium-dark px-2.5 rounded-lg">
              <NumericInput
                value={effectiveColGap}
                onChange={(val) =>
                  setProp((props) => {
                    props.gridColumnGap = val;
                  })
                }
                min={0}
                unit="px"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-brand-light">Row</span>
            <div className="bg-brand-medium-dark px-2.5 rounded-lg">
              <NumericInput
                value={effectiveRowGap}
                onChange={(val) =>
                  setProp((props) => {
                    props.gridRowGap = val;
                  })
                }
                min={0}
                unit="px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
