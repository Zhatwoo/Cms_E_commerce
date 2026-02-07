import React, { useState } from "react";
import { Scan, Plus, SquareRoundCorner } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";
import { ColorInput } from "./inputs/ColorInput";
import type { AppearanceProps, SetProp } from "../../../_types/components";

interface AppearanceGroupProps extends AppearanceProps {
  setProp: SetProp<AppearanceProps>;
}

export const AppearanceGroup = ({
  background = "transparent",
  borderColor = "transparent",
  borderWidth = 0,
  borderStyle = "solid",
  radiusTopLeft = 0,
  radiusTopRight = 0,
  radiusBottomRight = 0,
  radiusBottomLeft = 0,
  setProp
}: AppearanceGroupProps) => {
  const [expandRadius, setExpandRadius] = useState(false);

  const handleRadiusChange = (corner: string, val: number) => {
    setProp((props) => {
      if (corner === "all") {
        props.radiusTopLeft = val;
        props.radiusTopRight = val;
        props.radiusBottomRight = val;
        props.radiusBottomLeft = val;
        props.borderRadius = val;
      } else {
        if (corner === "tl") props.radiusTopLeft = val;
        if (corner === "tr") props.radiusTopRight = val;
        if (corner === "br") props.radiusBottomRight = val;
        if (corner === "bl") props.radiusBottomLeft = val;
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Fill */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label className="text-[12px] text-brand-lighter font-base">Fill</label>
          <Plus size={12} className="text-brand-lighter hover:text-white cursor-pointer" />
        </div>
        {/* Color Input */}
        <div className="flex items-center gap-4 bg-brand-medium-dark rounded-lg px-2.5 py-1">
          <input
            type="color"
            value={background}
            onChange={(e) => setProp((props) => { props.background = e.target.value; })}
            className="w-7 h-6 rounded cursor-pointer border-none bg-transparent"
          />
          <ColorInput
            value={background}
            onChange={(val) => setProp((props) => { props.background = val; })}
            className="flex-1"
          />
        </div>
      </div>

      {/* Stroke / Border */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] text-brand-lighter font-base">Stroke</label>
        <div className="flex gap-2">
          {/* Color Input */}
          <div className="flex-1 flex items-center gap-4 bg-brand-medium-dark rounded-lg px-2.5 appearance-none">
            <input
              type="color"
              value={borderColor}
              onChange={(e) => setProp((props) => { props.borderColor = e.target.value; })}
              className="w-7 h-6 rounded cursor-pointer bg-transparent"
            />
            <ColorInput
              value={borderColor}
              onChange={(val) => setProp((props) => { props.borderColor = val; })}
              className="flex-1"
            />
          </div>
          {/* Thickness Input */}
          <div className="w-16 bg-brand-medium-dark rounded-lg px-2.5">
            <NumericInput
              value={borderWidth}
              onChange={(val) => setProp((props) => { props.borderWidth = val; })}
              unit="px"
            />
          </div>
        </div>
        <select
          value={borderStyle}
          onChange={(e) => setProp((props) => { props.borderStyle = e.target.value; })}
          className="w-full bg-brand-medium-dark rounded-lg text-xs text-white px-2.5 py-1.5 focus:outline-none appearance-none"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>

      {/* Corner Radius */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] text-brand-lighter">Corners</label>
          <button
            onClick={() => setExpandRadius(!expandRadius)}
            className={`p-0.5 rounded ${expandRadius ? "bg-brand-light text-brand-dark" : "text-brand-medium hover:text-white"}`}
          >
            <Scan strokeWidth={2} size={12} className={`text-brand-lighter hover:text-white ${expandRadius ? "rotate-90" : "rotate-0"}`} />
          </button>
        </div>

        {expandRadius ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex bg-brand-medium-dark rounded-lg px-2 items-center gap-2">

              <NumericInput
                value={radiusTopLeft}
                onChange={(val) => handleRadiusChange("tl", val)}
                icon={<div className="w-2 h-2 border-t border-l border-brand-medium mr-2" />}
              />
            </div>
            <div className="flex bg-brand-medium-dark rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={radiusTopRight}
                onChange={(val) => handleRadiusChange("tr", val)}
                icon={<div className="w-2 h-2 border-t border-r border-brand-medium mr-2" />}
              />
            </div>

            <div className="flex bg-brand-medium-dark rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={radiusBottomLeft}
                onChange={(val) => handleRadiusChange("bl", val)}
                icon={<div className="w-2 h-2 border-b border-l border-brand-medium mr-2" />}
              />
            </div>
            <div className="flex bg-brand-medium-dark rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={radiusBottomRight}
                onChange={(val) => handleRadiusChange("br", val)}
                icon={<div className="w-2 h-2 border-b border-r border-brand-medium mr-2" />}
              />
            </div>
          </div>
        ) : (
          <div className="flex bg-brand-medium-dark rounded-lg px-2 items-center gap-2">
            <SquareRoundCorner size={16} className="text-brand-lighter mx-2.5" />
            <NumericInput
              value={radiusTopLeft}
              onChange={(val) => handleRadiusChange("all", val)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
