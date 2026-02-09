import React from "react";
import { useNode } from "@craftjs/core";
import { SettingsSection } from "../../_components/rightPanel/settings/SettingsSection";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { ColorInput } from "../../_components/rightPanel/settings/inputs/ColorInput";
import type { PageProps, SetProp } from "../../_types";

export const PageSettings = () => {
  const {
    width, height, background,
    actions: { setProp }
  } = useNode(node => ({
    width: node.data.props.width,
    height: node.data.props.height,
    background: node.data.props.background,
  }));

  const typedSetProp = setProp as SetProp<PageProps>;

  return (
    <div className="flex flex-col pb-4">
      <SettingsSection title="Page">
        <div className="flex flex-col gap-3">
          <div className="flex flex-row gap-3">
            {/* Width */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Width</label>
              <div className="flex items-center px-2.5 bg-brand-medium-dark rounded-lg overflow-hidden">
                <input
                  type="text"
                  value={width?.replace("px", "") ?? "1000"}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d*$/.test(v)) {
                      typedSetProp((props) => { props.width = v + "px"; });
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-transparent text-xs text-brand-lighter p-2 focus:outline-none"
                />
                <span className="text-[10px] text-brand-medium pr-2 select-none">px</span>
              </div>
            </div>

            {/* Height */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Height</label>
              <select
                value={height === "auto" ? "auto" : "fixed"}
                onChange={(e) => {
                  if (e.target.value === "auto") {
                    typedSetProp((props) => { props.height = "auto"; });
                  } else {
                    typedSetProp((props) => { props.height = "1200px"; });
                  }
                }}
                className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none"
              >
                <option value="auto">Auto</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          </div>

          {/* Background */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Background</label>
            <div className="flex items-center gap-2 bg-brand-medium-dark rounded-lg px-2.5 py-1">
              <input
                type="color"
                value={background ?? "#ffffff"}
                onChange={(e) => typedSetProp((props) => { props.background = e.target.value; })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
              />
              <ColorInput
                value={background ?? "#ffffff"}
                onChange={(val) => typedSetProp((props) => { props.background = val; })}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};
