import React from "react";
import { ArrowDown, ArrowRight, WrapText } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";
import type { LayoutProps, SetProp } from "../../../_types/components";

interface AutoLayoutGroupProps extends LayoutProps {
  setProp: SetProp<LayoutProps>;
}

export const AutoLayoutGroup = ({
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = 0,
  setProp
}: AutoLayoutGroupProps) => {

  const normalizeAxisPos = (
    value: unknown,
    fallback: "flex-start" | "center" | "flex-end"
  ): "flex-start" | "center" | "flex-end" => {
    const raw = String(value ?? "").trim().toLowerCase();
    if (raw === "start" || raw === "flex-start") return "flex-start";
    if (raw === "end" || raw === "flex-end") return "flex-end";
    if (raw === "center") return "center";
    return fallback;
  };

  const resolvedAlignItems = normalizeAxisPos(alignItems, "flex-start");
  const resolvedJustifyContent = normalizeAxisPos(justifyContent, "flex-start");

  const handleDirection = (dir: "row" | "column") => {
    setProp((props) => { props.flexDirection = dir; });
  };

  const handleWrap = () => {
    setProp((props) => { props.flexWrap = props.flexWrap === "wrap" ? "nowrap" : "wrap"; });
  };

  const mapVal = (val: string): "flex-start" | "center" | "flex-end" =>
    val === "start" ? "flex-start" : val === "end" ? "flex-end" : "center";

  const handleAlignment = (
    align: LayoutProps["alignItems"],
    justify: LayoutProps["justifyContent"]
  ) => {
    setProp((props) => {
      props.alignItems = align;
      props.justifyContent = justify;
    });
  };

  const isActive = (
    align: LayoutProps["alignItems"],
    justify: LayoutProps["justifyContent"]
  ) => {
    return resolvedAlignItems === align && resolvedJustifyContent === justify;
  };

  const renderMatrixCell = (h: "start" | "center" | "end", v: "start" | "center" | "end") => {
    let targetAlign: LayoutProps["alignItems"];
    let targetJustify: LayoutProps["justifyContent"];

    if (flexDirection === "row") {
      targetJustify = mapVal(h);
      targetAlign = mapVal(v);
    } else {
      targetAlign = mapVal(h);
      targetJustify = mapVal(v);
    }

    const active = isActive(targetAlign, targetJustify);

    return (
      <button
        type="button"
        key={`${h}-${v}`}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleAlignment(targetAlign, targetJustify);
        }}
        onClick={(e) => {
          e.preventDefault();
        }}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${active
          ? "bg-[var(--builder-accent)] text-black scale-110"
          : "bg-brand-medium/50 text-[var(--builder-text-muted)] hover:bg-[var(--builder-surface-3)]"
          }`}
      >
        {/* center dot */}
        <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[var(--builder-surface)]er" : "bg-brand-light"}`} />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Direction & Wrap */}
      <div className="flex items-center gap-2 bg-[var(--builder-surface-2)] rounded-[10px] border-2 border-[var(--builder-border-mid)]-dark p-.1">
        <button
          type="button"
          onClick={() => handleDirection("column")}
          className={`p-1.5 rounded-lg flex-1 flex justify-center ${flexDirection === "column" ? "bg-brand-medium/50 text-[var(--builder-text)]" : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"}`}
          title="Vertical (Column)"
        >
          <ArrowDown size={16} />
        </button>
        <button
          type="button"
          onClick={() => handleDirection("row")}
          className={`p-1.5 rounded-lg flex-1 flex justify-center ${flexDirection === "row" ? "bg-brand-medium/50 text-[var(--builder-text)]" : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"}`}
          title="Horizontal (Row)"
        >
          <ArrowRight size={16} />
        </button>
        <div className="w-px h-4 bg-brand-medium mx-1" />
        <button
          type="button"
          onClick={handleWrap}
          className={`p-1.5 rounded-lg flex-1 flex justify-center ${flexWrap === "wrap" ? "bg-[var(--builder-accent)] text-black" : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"}`}
          title="Wrap Items"
        >
          <WrapText size={16} />
        </button>
      </div>

      {/* Alignment Matrix & Gap */}
      <div className="flex gap-4">
        {/* 3x3 Matrix */}
        <div className="bg-[var(--builder-surface-2)] p-1.5 rounded-xl inline-grid grid-cols-3 gap-2">
          {["start", "center", "end"].map(v =>
            ["start", "center", "end"].map(h =>
              renderMatrixCell(h as "start" | "center" | "end", v as "start" | "center" | "end")
            )
          )}
        </div>

        {/* Gap & Distribution */}
        <div className="flex flex-col justify-between flex-1 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] text-[var(--builder-text)] font-base">Gap</label>
            <div className="bg-[var(--builder-surface-2)] px-2.5 rounded-lg">
              <NumericInput
                value={gap}
                onChange={(val) => setProp((props) => { props.gap = val; })}
                min={0}
                unit="px"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] text-[var(--builder-text)] font-base">Distribute</label>
            <div className="bg-[var(--builder-surface-2)] px-2 rounded-lg">
              <select
                className="text-xs bg-[var(--builder-surface-2)] text-[var(--builder-text)] py-1.5 px-2.5 focus:outline-none appearance-none"
                value={justifyContent === "space-between" ? "space-between" : "packed"}
                onChange={(e) => {
                  if (e.target.value === "space-between") {
                    setProp((props) => { props.justifyContent = "space-between"; });
                  } else {
                    setProp((props) => { props.justifyContent = "flex-start"; });
                  }
                }}
              >
                <option value="packed" className="px-10">Packed</option>
                <option value="space-between">Space Between</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
