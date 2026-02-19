import React from "react";
import type { EffectsProps, SetProp } from "../../../_types/components";

interface EffectsGroupProps extends EffectsProps {
  setProp: SetProp<EffectsProps>;
}

export const EffectsGroup = ({
  opacity = 1,
  boxShadow = "none",
  overflow = "visible",
  cursor = "default",
  setProp
}: EffectsGroupProps) => {

  const opacityPct = Math.round(opacity * 100);
  const setOpacityFromPct = (pct: number) => {
    const v = Math.max(0, Math.min(100, pct)) / 100;
    setProp((props) => { props.opacity = v; });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Opacity: % input + slider */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center gap-2">
          <label className="text-[12px] text-brand-lighter font-base">Opacity</label>
          <div className="flex items-center bg-brand-medium-dark rounded-lg px-2 border border-brand-medium/30 w-20">
            <input
              type="text"
              value={opacityPct}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) setOpacityFromPct(v);
              }}
              onBlur={(e) => {
                const v = parseInt(e.target.value, 10);
                setOpacityFromPct(isNaN(v) ? opacityPct : v);
              }}
              className="w-full bg-transparent text-xs text-brand-lighter p-1 focus:outline-none text-right"
            />
            <span className="text-[10px] text-brand-medium">%</span>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={(e) => setProp((props) => { props.opacity = Number(e.target.value); })}
          className="w-full accent-brand-light"
        />
      </div>

      {/* Overflow & Cursor */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-brand-lighter font-base">Overflow</label>
          <select
            value={overflow}
            onChange={(e) => setProp((props) => { props.overflow = e.target.value; })}
            className="w-full bg-brand-medium-dark rounded-md text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none"
          >
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="scroll">Scroll</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-brand-lighter font-base">Cursor</label>
          <select
            value={cursor}
            onChange={(e) => setProp((props) => { props.cursor = e.target.value; })}
            className="w-full bg-brand-medium-dark rounded-md text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none"
          >
            <option value="default">Default</option>
            <option value="pointer">Pointer</option>
            <option value="text">Text</option>
            <option value="not-allowed">Not Allowed</option>
          </select>
        </div>
      </div>

      {/* Box Shadow presets */}
      <div className="flex flex-col gap-1">
        <label className="text-[12px] text-brand-lighter font-base">Shadow</label>
        <select
          value={(() => {
            if (!boxShadow || boxShadow === "none") return "none";
            const sm = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
            const md = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
            const lg = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
            if (boxShadow === sm) return "sm";
            if (boxShadow === md) return "md";
            if (boxShadow === lg) return "lg";
            return "sm";
          })()}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "none") setProp((props) => { props.boxShadow = "none"; });
            else if (val === "sm") setProp((props) => { props.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"; });
            else if (val === "md") setProp((props) => { props.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"; });
            else setProp((props) => { props.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"; });
          }}
          className="w-full bg-brand-medium-dark rounded-md text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none"
        >
          <option value="none">None</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </div>
    </div>
  );
};
