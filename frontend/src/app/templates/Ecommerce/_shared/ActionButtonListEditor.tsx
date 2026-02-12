"use client";

import React from "react";

interface ActionButton {
  label: string;
  variant: "primary" | "secondary" | "outline";
}

interface ActionButtonListEditorProps {
  buttons: ActionButton[];
  onChange: (buttons: ActionButton[]) => void;
}

const variants: Array<"primary" | "secondary" | "outline"> = ["primary", "secondary", "outline"];

/** Editable list of action buttons with variant selection, reorder, and remove */
export const ActionButtonListEditor: React.FC<ActionButtonListEditorProps> = ({ buttons, onChange }) => {
  const update = (idx: number, patch: Partial<ActionButton>) => {
    const list = buttons.map((b, i) => (i === idx ? { ...b, ...patch } : b));
    onChange(list);
  };

  const remove = (idx: number) => onChange(buttons.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= buttons.length) return;
    const list = [...buttons];
    [list[idx], list[target]] = [list[target], list[idx]];
    onChange(list);
  };

  return (
    <div className="flex flex-col gap-3">
      {buttons.length === 0 && (
        <div className="text-xs text-brand-medium bg-brand-medium/10 border border-brand-medium/20 rounded px-3 py-2">
          No buttons yet. Click &quot;Add Button&quot; to create one.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {buttons.map((btn, idx) => (
          <div key={idx} className="rounded-lg border border-brand-medium/30 bg-brand-medium/5 p-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={btn.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                placeholder="Button label"
                className="flex-1 px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter"
              />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="grid grid-cols-3 gap-1 bg-brand-dark/30 p-1 rounded-lg border border-brand-medium/20">
                {variants.map((v) => (
                  <button
                    key={v}
                    onClick={() => update(idx, { variant: v })}
                    className={`text-[10px] py-1.5 rounded capitalize transition-colors ${
                      btn.variant === v ? "bg-brand-medium/50 text-brand-lighter" : "text-brand-light hover:text-brand-lighter"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex items-center gap-1">
                <button title="Move up" onClick={() => move(idx, -1)} className="px-2 py-1 text-xs bg-brand-medium/20 hover:bg-brand-medium/30 rounded">↑</button>
                <button title="Move down" onClick={() => move(idx, 1)} className="px-2 py-1 text-xs bg-brand-medium/20 hover:bg-brand-medium/30 rounded">↓</button>
                <button title="Remove" onClick={() => remove(idx)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">×</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange([...buttons, { label: "New Button", variant: "primary" }])}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          Add Button
        </button>
        <span className="text-[11px] text-brand-medium">Use variants to style each button.</span>
      </div>
    </div>
  );
};
