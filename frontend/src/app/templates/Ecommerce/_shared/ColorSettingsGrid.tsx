"use client";

import React from "react";
import { ColorInput } from "../../../design/_components/rightPanel/settings/inputs/ColorInput";

interface ColorSettingItem {
  key: string;
  label: string;
  fallback: string;
}

interface ColorSettingsGridProps {
  items: ColorSettingItem[];
  props: Record<string, any>;
  setProp: (cb: (p: any) => void) => void;
}

/** Renders a list of color pickers with hex input for settings panels */
export const ColorSettingsGrid: React.FC<ColorSettingsGridProps> = ({
  items,
  props,
  setProp,
}) => (
  <div className="space-y-2">
    {items.map(({ key, label, fallback }) => (
      <div key={key}>
        <label className="text-xs text-brand-lighter block mb-1">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={props[key] ?? fallback}
            onChange={(e) => setProp((p: any) => (p[key] = e.target.value))}
            className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
          />
          <ColorInput
            value={props[key] ?? fallback}
            onChange={(val) => setProp((p: any) => (p[key] = val))}
          />
        </div>
      </div>
    ))}
  </div>
);
