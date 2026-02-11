"use client";

import React from "react";
import { useEditor } from "@craftjs/core";
import { TEMPLATES } from "../../../templates";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "../../../templates/_types";

export const AssetsPanel = () => {
  const { connectors } = useEditor();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h3 className="text-sm font-semibold text-brand-light mb-1">Built-in Templates</h3>
        <p className="text-xs text-brand-medium">
          Drag and drop ready-to-use templates
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {CATEGORY_ORDER.map((category) => {
          const templates = TEMPLATES.filter((t) => t.category === category);
          if (templates.length === 0) return null;

          return (
            <div key={category} className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-brand-medium uppercase tracking-wider px-1">
                {CATEGORY_LABELS[category]}
              </span>
              <div className="grid grid-cols-1 gap-3">
                {templates.map((template) => (
                  <div
                    key={template.label}
                    ref={(ref) => {
                      if (ref) connectors.create(ref, template.element);
                    }}
                    className="bg-brand-white/5 p-4 rounded-xl hover:bg-brand-white/10 transition cursor-move border border-brand-medium/30 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-brand-light">
                          {template.label}
                        </h4>
                        <p className="text-xs text-brand-medium mt-1">
                          {template.description}
                        </p>
                      </div>
                      <div className="h-10 w-10 bg-brand-medium/20 rounded-lg flex items-center justify-center text-sm">
                        {template.preview}
                      </div>
                    </div>
                    <div className="text-[10px] text-brand-medium font-medium mt-2 px-2 py-1 bg-brand-medium/10 rounded inline-block">
                      {CATEGORY_LABELS[category]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-brand-medium/20">
        <div className="text-xs text-brand-medium">
          <p className="font-medium text-brand-light mb-1">How to use:</p>
          <p>Drag any template to the canvas. All elements can be customized after dropping.</p>
        </div>
      </div>
    </div>
  );
};