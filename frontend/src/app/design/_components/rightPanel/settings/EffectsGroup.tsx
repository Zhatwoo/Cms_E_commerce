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
      {/* Overflow & Cursor */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-[var(--builder-text)] font-base">Overflow</label>
          <select
            value={overflow}
            onChange={(e) => setProp((props) => { props.overflow = e.target.value; })}
            className="w-full bg-[var(--builder-surface-2)] rounded-md text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none appearance-none"
          >
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="scroll">Scroll</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-[var(--builder-text)] font-base">Cursor</label>
          <select
            value={cursor}
            onChange={(e) => setProp((props) => { props.cursor = e.target.value; })}
            className="w-full bg-[var(--builder-surface-2)] rounded-md text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none appearance-none"
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
        <label className="text-[12px] text-[var(--builder-text)] font-base">Shadow</label>
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
          className="w-full bg-[var(--builder-surface-2)] rounded-md text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none appearance-none"
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
