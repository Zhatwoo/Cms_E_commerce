import React, { useState } from "react";
import { ArrowDown, ArrowRight, WrapText } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";

interface AutoLayoutGroupProps {
  flexDirection?: "row" | "column";
  flexWrap?: "nowrap" | "wrap";
  alignItems?: string;
  justifyContent?: string;
  gap?: number;
  setProp: (cb: (props: any) => void) => void;
}

export const AutoLayoutGroup = ({
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = 0,
  setProp
}: AutoLayoutGroupProps) => {

  const handleDirection = (dir: "row" | "column") => {
    setProp((props: any) => props.flexDirection = dir);
  };

  const handleWrap = () => {
    setProp((props: any) => props.flexWrap = props.flexWrap === "wrap" ? "nowrap" : "wrap");
  };

  const handleAlignment = (align: string, justify: string) => {
    setProp((props: any) => {
      props.alignItems = align;
      props.justifyContent = justify;
    });
  };

  const isActive = (align: string, justify: string) => {
    return alignItems === align && justifyContent === justify;
  };

  const renderMatrixCell = (h: "start" | "center" | "end", v: "start" | "center" | "end") => {
    let targetAlign = "";
    let targetJustify = "";

    const mapVal = (val: string) => val === "start" ? "flex-start" : val === "end" ? "flex-end" : "center";

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
        key={`${h}-${v}`}
        onClick={() => handleAlignment(targetAlign, targetJustify)}
        className={`w-6 h-6 rounded flex items-center justify-center transition-all ${active
          ? "bg-brand-light text-brand-dark shadow-sm scale-110"
          : "bg-brand-medium/20 text-brand-light hover:bg-brand-medium/40"
          }`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-brand-dark" : "bg-current"}`} />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-light uppercase tracking-wider">Auto Layout</span>
      </div>

      {/* Direction & Wrap */}
      <div className="flex items-center gap-2 bg-brand-dark/30 p-1 rounded-lg border border-brand-medium/20">
        <button
          onClick={() => handleDirection("column")}
          className={`p-1.5 rounded flex-1 flex justify-center ${flexDirection === "column" ? "bg-brand-medium/50 text-white" : "text-brand-light hover:text-white"}`}
          title="Vertical (Column)"
        >
          <ArrowDown size={16} />
        </button>
        <button
          onClick={() => handleDirection("row")}
          className={`p-1.5 rounded flex-1 flex justify-center ${flexDirection === "row" ? "bg-brand-medium/50 text-white" : "text-brand-light hover:text-white"}`}
          title="Horizontal (Row)"
        >
          <ArrowRight size={16} />
        </button>
        <div className="w-px h-4 bg-brand-medium/30 mx-1" />
        <button
          onClick={handleWrap}
          className={`p-1.5 rounded flex-1 flex justify-center ${flexWrap === "wrap" ? "bg-brand-light text-brand-dark" : "text-brand-light hover:text-white"}`}
          title="Wrap Items"
        >
          <WrapText size={16} />
        </button>
      </div>

      {/* Alignment Matrix & Gap */}
      <div className="flex gap-4">
        {/* 3x3 Matrix */}
        <div className="bg-brand-dark/30 p-2 rounded-lg border border-brand-medium/20 inline-grid grid-cols-3 gap-1">
          {["start", "center", "end"].map(v =>
            ["start", "center", "end"].map(h =>
              renderMatrixCell(h as any, v as any)
            )
          )}
        </div>

        {/* Gap & Distribution */}
        <div className="flex flex-col justify-between flex-1 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter uppercase">Gap</label>
            <NumericInput
              value={gap}
              onChange={(val) => setProp((props: any) => props.gap = val)}
              min={0}
              unit="px"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter uppercase">Distribute</label>
            <select
              className="bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-1.5 focus:outline-none appearance-none"
              value={justifyContent === "space-between" ? "space-between" : "packed"}
              onChange={(e) => {
                if (e.target.value === "space-between") {
                  setProp((props: any) => props.justifyContent = "space-between");
                } else {
                  setProp((props: any) => props.justifyContent = "flex-start");
                }
              }}
            >
              <option value="packed">Packed</option>
              <option value="space-between">Space Between</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
