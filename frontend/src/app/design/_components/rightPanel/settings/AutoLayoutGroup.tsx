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
    return alignItems === align && justifyContent === justify;
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
        key={`${h}-${v}`}
        onClick={() => handleAlignment(targetAlign, targetJustify)}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${active
          ? "bg-brand-light text-brand-dark scale-110"
          : "bg-brand-medium/50 text-brand-light hover:bg-brand-medium/40"
          }`}
      >
        {/* center dot */}
        <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-brand-darker" : "bg-brand-light"}`} />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Direction & Wrap */}
      <div className="flex items-center gap-2 bg-brand-medium-dark rounded-[10px] border-2 border-brand-medium-dark p-.1">
        <button
          onClick={() => handleDirection("column")}
          className={`p-1.5 rounded-lg flex-1 flex justify-center ${flexDirection === "column" ? "bg-brand-medium/50 text-brand-lighter" : "text-brand-light hover:text-brand-lighter"}`}
          title="Vertical (Column)"
        >
          <ArrowDown size={16} />
        </button>
        <button
          onClick={() => handleDirection("row")}
          className={`p-1.5 rounded-lg flex-1 flex justify-center ${flexDirection === "row" ? "bg-brand-medium/50 text-brand-lighter" : "text-brand-light hover:text-brand-lighter"}`}
          title="Horizontal (Row)"
        >
          <ArrowRight size={16} />
        </button>
        <div className="w-px h-4 bg-brand-medium mx-1" />
        <button
          onClick={handleWrap}
          className={`p-1.5 rounded-lg flex-1 flex justify-center ${flexWrap === "wrap" ? "bg-brand-light text-brand-dark" : "text-brand-light hover:text-brand-lighter"}`}
          title="Wrap Items"
        >
          <WrapText size={16} />
        </button>
      </div>

      {/* Alignment Matrix & Gap */}
      <div className="flex gap-4">
        {/* 3x3 Matrix */}
        <div className="bg-brand-medium-dark p-1.5 rounded-xl inline-grid grid-cols-3 gap-2">
          {["start", "center", "end"].map(v =>
            ["start", "center", "end"].map(h =>
              renderMatrixCell(h as "start" | "center" | "end", v as "start" | "center" | "end")
            )
          )}
        </div>

        {/* Gap & Distribution */}
        <div className="flex flex-col justify-between flex-1 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] text-brand-lighter font-base">Gap</label>
            <div className="bg-brand-medium-dark px-2.5 rounded-lg">
              <NumericInput
                value={gap}
                onChange={(val) => setProp((props) => { props.gap = val; })}
                min={0}
                unit="px"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] text-brand-lighter font-base">Distribute</label>
            <div className="bg-brand-medium-dark px-2 rounded-lg">
              <select
                className="text-xs bg-brand-medium-dark text-brand-lighter py-1.5 px-2.5 focus:outline-none appearance-none"
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
