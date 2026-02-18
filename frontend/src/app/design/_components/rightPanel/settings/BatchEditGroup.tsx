"use client";

import React from "react";
import { useEditor } from "@craftjs/core";
import { DesignSection } from "./DesignSection";
import { ColorInput } from "./inputs/ColorInput";

const labelClass = "text-[12px] text-brand-lighter font-base";
const inputClass = "w-full bg-brand-medium-dark rounded-md text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none";
const sliderClass = "w-full accent-brand-light cursor-pointer";

interface BatchEditGroupProps {
  selectedIds: string[];
}

/**
 * Batch edit common props for multiple selected components.
 * Changes apply to all selected nodes at once.
 */
export const BatchEditGroup = ({ selectedIds }: BatchEditGroupProps) => {
  const { actions } = useEditor();

  // Read first node's props for display (from editor state via query)
  const firstProps = useEditor((state) => {
    const id = selectedIds[0];
    if (!id || !state.nodes[id]) return null;
    return state.nodes[id].data.props as Record<string, unknown>;
  });

  const applyToAll = React.useCallback(
    (update: (props: Record<string, unknown>) => void) => {
      selectedIds.forEach((id) => {
        try {
          actions.setProp(id, (props: Record<string, unknown>) => update(props));
        } catch {
          // skip if node removed
        }
      });
    },
    [actions, selectedIds]
  );

  if (!firstProps || selectedIds.length === 0) return null;

  const padding = ((firstProps as Record<string, any>)['padding'] ?? (firstProps as Record<string, any>)['paddingTop'] ?? 0) as number;
  const paddingTop = ((firstProps as Record<string, any>)['paddingTop'] ?? padding) as number;
  const paddingRight = ((firstProps as Record<string, any>)['paddingRight'] ?? padding) as number;
  const paddingBottom = ((firstProps as Record<string, any>)['paddingBottom'] ?? padding) as number;
  const paddingLeft = ((firstProps as Record<string, any>)['paddingLeft'] ?? padding) as number;

  const margin = ((firstProps as Record<string, any>)['margin'] ?? (firstProps as Record<string, any>)['marginTop'] ?? 0) as number;
  const marginTop = ((firstProps as Record<string, any>)['marginTop'] ?? margin) as number;
  const marginRight = ((firstProps as Record<string, any>)['marginRight'] ?? margin) as number;
  const marginBottom = ((firstProps as Record<string, any>)['marginBottom'] ?? margin) as number;
  const marginLeft = ((firstProps as Record<string, any>)['marginLeft'] ?? margin) as number;

  const background = ((firstProps as Record<string, any>)['background'] ?? "transparent") as string;
  const borderRadius = ((firstProps as Record<string, any>)['borderRadius'] ?? 0) as number;
  const opacity = ((firstProps as Record<string, any>)['opacity'] ?? 1) as number;

  return (
    <div className="flex flex-col pb-4 gap-2">
      <p className="text-[10px] text-brand-light mb-1">
        Applying to {selectedIds.length} selected. Changes affect all.
      </p>

      <DesignSection title="Spacing">
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClass}>Padding</label>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {[
                { k: "paddingTop", v: paddingTop, l: "T" },
                { k: "paddingRight", v: paddingRight, l: "R" },
                { k: "paddingBottom", v: paddingBottom, l: "B" },
                { k: "paddingLeft", v: paddingLeft, l: "L" },
              ].map(({ k, v, l }) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-brand-light">{l}</span>
                  <input
                    type="number"
                    value={typeof v === "number" ? v : ""}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (!Number.isNaN(n)) applyToAll((p) => { (p as Record<string, number>)[k] = n; });
                    }}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Margin</label>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {[
                { k: "marginTop", v: marginTop, l: "T" },
                { k: "marginRight", v: marginRight, l: "R" },
                { k: "marginBottom", v: marginBottom, l: "B" },
                { k: "marginLeft", v: marginLeft, l: "L" },
              ].map(({ k, v, l }) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-brand-light">{l}</span>
                  <input
                    type="number"
                    value={typeof v === "number" ? v : ""}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (!Number.isNaN(n)) applyToAll((p) => { (p as Record<string, number>)[k] = n; });
                    }}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Appearance">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Background</label>
            <div className="flex items-center gap-2 bg-brand-medium-dark rounded-lg px-2.5 py-1.5">
              <input
                type="color"
                value={background === "transparent" ? "#000000" : background}
                onChange={(e) => applyToAll((p) => { p.background = e.target.value; })}
                className="w-7 h-6 rounded cursor-pointer border-none bg-transparent"
              />
              <ColorInput
                value={background || "transparent"}
                onChange={(val) => applyToAll((p) => { p.background = val; })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className={labelClass}>Border radius</label>
              <span className="text-[10px] text-brand-light">{borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={borderRadius}
              onChange={(e) =>
                applyToAll((p) => {
                  const v = Number(e.target.value);
                  p.borderRadius = v;
                  p.radiusTopLeft = v;
                  p.radiusTopRight = v;
                  p.radiusBottomRight = v;
                  p.radiusBottomLeft = v;
                })
              }
              className={sliderClass}
            />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Effects">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <label className={labelClass}>Opacity</label>
            <span className="text-[10px] text-brand-light">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={(e) => applyToAll((p) => { p.opacity = Number(e.target.value); })}
            className={sliderClass}
          />
        </div>
      </DesignSection>
    </div>
  );
};
