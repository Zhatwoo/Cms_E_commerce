"use client";

import React, { useState } from "react";
import { useEditor } from "@craftjs/core";
import { GROUPED_TEMPLATES } from "../../../templates";

export const AssetsPanel = () => {
  const { connectors } = useEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (folder: string) => setOpen((o) => ({ ...o, [folder]: !o[folder] }));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h3 className="text-sm font-semibold text-brand-light mb-1">Templates</h3>
        <p className="text-xs text-brand-medium">Drag and drop templates to the canvas</p>
      </div>

      <div className="flex flex-col gap-2">
        {GROUPED_TEMPLATES.map((group) => (
          <div key={group.folder} className="border border-brand-medium/30 rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(group.folder)}
              className="w-full flex items-center justify-between px-3 py-2 bg-brand-white/5 hover:bg-brand-white/10"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-medium">{group.folder}</span>
              <span className="text-brand-medium text-xs">{open[group.folder] ? "−" : "+"}</span>
            </button>

            {open[group.folder] && (
              <div className="p-3 space-y-2">
                {group.items.map((item: any, idx: number) => (
                  <div
                    key={item.label || idx}
                    ref={(ref) => {
                      if (ref) connectors.create(ref, item.element ?? item.element);
                    }}
                    className="bg-brand-white/5 p-3 rounded hover:bg-brand-white/10 transition cursor-move border border-brand-medium/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-brand-light">{item.label ?? item.label}</div>
                        {item.description && (
                          <div className="text-xs text-brand-medium mt-1">{item.description}</div>
                        )}
                      </div>
                      {item.preview && (
                        <div className="h-8 w-8 bg-brand-medium/20 rounded-lg flex items-center justify-center text-xs">
                          {item.preview}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};