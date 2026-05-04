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
  justifyItems = "stretch",
  alignItems = "stretch",
  justifyContent = "flex-start",
  alignContent = "flex-start",
  setProp,
}: GridLayoutGroupProps) => {
  const effectiveColGap = gridColumnGap ?? gridGap;
  const effectiveRowGap = gridRowGap ?? gridGap;

  const handleAlignment = (just: GridProps["justifyItems"], al: GridProps["alignItems"]) => {
    setProp((props) => {
      props.justifyItems = just;
      props.alignItems = al;
    });
  };

  const isActive = (just: GridProps["justifyItems"], al: GridProps["alignItems"]) => {
    return justifyItems === just && alignItems === al;
  };

  const mapVal = (val: string): "start" | "center" | "end" | "stretch" =>
    val === "start" ? "start" : val === "end" ? "end" : val === "center" ? "center" : "stretch";

  const renderMatrixCell = (h: "start" | "center" | "end" | "stretch", v: "start" | "center" | "end" | "stretch") => {
    const active = isActive(h, v);
    return (
      <button
        type="button"
        key={`${h}-${v}`}
        onClick={() => handleAlignment(h, v)}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${active
          ? "bg-builder-accent text-black scale-110"
          : "bg-builder-surface-3 text-builder-text-muted hover:bg-builder-surface-hover"
          }`}
        title={`Align: ${v}, Justify: ${h}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-builder-surface" : "bg-builder-text-faint"}`} />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Column Presets */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] text-builder-text font-medium">
          Grid Structure
        </label>
        <div className="flex flex-col gap-3 bg-builder-surface-2 p-3 rounded-xl border border-(--builder-border)">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-builder-text-muted uppercase tracking-wider">Columns</span>
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
                    ? "bg-builder-accent text-white font-medium"
                    : "bg-builder-surface-3 text-builder-text-muted hover:bg-builder-surface-hover"
                    }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={gridTemplateColumns}
              onChange={(e) =>
                setProp((props) => {
                  props.gridTemplateColumns = e.target.value;
                })
              }
              placeholder="e.g. 1fr 2fr"
              className="w-full bg-builder-surface-3 rounded-lg text-xs text-builder-text px-2.5 py-1.5 focus:outline-none placeholder:text-builder-text-faint"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-builder-text-muted uppercase tracking-wider">Rows</span>
            <input
              type="text"
              value={gridTemplateRows}
              onChange={(e) =>
                setProp((props) => {
                  props.gridTemplateRows = e.target.value;
                })
              }
              placeholder="e.g. auto 1fr"
              className="w-full bg-builder-surface-3 rounded-lg text-xs text-builder-text px-2.5 py-1.5 focus:outline-none placeholder:text-builder-text-faint"
            />
          </div>
        </div>
      </div>

      {/* Alignment & Distribution */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] text-builder-text font-medium">Alignment & Distribution</label>
        <div className="flex gap-4 items-start">
          {/* 3x3 Matrix for items */}
          <div className="bg-builder-surface-2 p-2 rounded-xl border border-(--builder-border) inline-grid grid-cols-3 gap-2">
            {["start", "center", "end"].map(v =>
              ["start", "center", "end"].map(h =>
                renderMatrixCell(h as any, v as any)
              )
            )}
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-builder-text-muted">Justify Content</span>
              <select
                value={justifyContent}
                onChange={(e) => setProp(p => { p.justifyContent = e.target.value as any; })}
                className="w-full bg-builder-surface-2 rounded-lg text-xs text-builder-text px-2 py-1.5 focus:outline-none appearance-none border border-(--builder-border)"
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="space-between">Space Between</option>
                <option value="space-around">Space Around</option>
                <option value="space-evenly">Space Evenly</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-builder-text-muted">Align Content</span>
              <select
                value={alignContent}
                onChange={(e) => setProp(p => { p.alignContent = e.target.value as any; })}
                className="w-full bg-builder-surface-2 rounded-lg text-xs text-builder-text px-2 py-1.5 focus:outline-none appearance-none border border-(--builder-border)"
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="space-between">Space Between</option>
                <option value="space-around">Space Around</option>
                <option value="space-evenly">Space Evenly</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced & Gap */}
      <div className="flex flex-col gap-3 bg-builder-surface-2 p-3 rounded-xl border border-(--builder-border)">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-builder-text-muted uppercase tracking-wider">Gap (Col)</span>
            <div className="bg-builder-surface-3 px-2 rounded-lg h-[32px] flex items-center">
              <NumericInput
                value={effectiveColGap}
                onChange={(val) => setProp(p => { p.gridColumnGap = val; })}
                min={0}
                unit="px"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-builder-text-muted uppercase tracking-wider">Gap (Row)</span>
            <div className="bg-builder-surface-3 px-2 rounded-lg h-[32px] flex items-center">
              <NumericInput
                value={effectiveRowGap}
                onChange={(val) => setProp(p => { p.gridRowGap = val; })}
                min={0}
                unit="px"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-builder-text-muted uppercase tracking-wider">Auto Flow</span>
          <select
            value={gridAutoFlow}
            onChange={(e) => setProp(p => { p.gridAutoFlow = e.target.value as any; })}
            className="w-full bg-builder-surface-3 rounded-lg text-xs text-builder-text px-2.5 py-1.5 focus:outline-none appearance-none"
          >
            {AUTO_FLOW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
