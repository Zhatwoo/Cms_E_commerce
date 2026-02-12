"use client";

import React from "react";

interface ToggleListProps {
  items: { key: string; label: string; fallback: boolean }[];
  props: Record<string, any>;
  setProp: (cb: (p: any) => void) => void;
}

/** Renders a list of checkbox toggles for settings panels */
export const ToggleList: React.FC<ToggleListProps> = ({ items, props, setProp }) => (
  <div className="space-y-2">
    {items.map(({ key, label, fallback }) => (
      <div key={key} className="flex items-center justify-between">
        <label className="text-xs text-brand-lighter">{label}</label>
        <input
          type="checkbox"
          checked={props[key] ?? fallback}
          onChange={(e) => setProp((p: any) => (p[key] = e.target.checked))}
          className="w-4 h-4 rounded"
        />
      </div>
    ))}
  </div>
);
