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

  return (
    <div className="flex flex-col gap-4">
      {/* Opacity */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <label className="text-[10px] text-brand-lighter uppercase">Opacity</label>
          <span className="text-[10px] text-brand-light">{Math.round(opacity * 100)}%</span>
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
          <label className="text-[10px] text-brand-lighter uppercase">Overflow</label>
          <select
            value={overflow}
            onChange={(e) => setProp((props) => { props.overflow = e.target.value; })}
            className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-1.5 focus:outline-none"
          >
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="scroll">Scroll</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter uppercase">Cursor</label>
          <select
            value={cursor}
            onChange={(e) => setProp((props) => { props.cursor = e.target.value; })}
            className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-1.5 focus:outline-none"
          >
            <option value="default">Default</option>
            <option value="pointer">Pointer</option>
            <option value="text">Text</option>
            <option value="not-allowed">Not Allowed</option>
          </select>
        </div>
      </div>

      {/* Box Shadow (Simplified for now) */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-brand-lighter uppercase">Shadow</label>
        <select
          value={boxShadow === "none" ? "none" : "sm"}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "none") setProp((props) => { props.boxShadow = "none"; });
            else setProp((props) => { props.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"; });
          }}
          className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-1.5 focus:outline-none"
        >
          <option value="none">None</option>
          <option value="sm">Small Drop Shadow</option>
        </select>
      </div>
    </div>
  );
};
