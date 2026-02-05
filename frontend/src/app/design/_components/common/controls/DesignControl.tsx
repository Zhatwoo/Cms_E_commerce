import React from "react";
import { PropertyInput } from "../inputs/PropertyInput";

interface DesignControlProps {
  background?: string;
  borderColor?: string;
  borderWidth?: number;
  setProp: (cb: (props: any) => void) => void;
}

export const DesignControl = ({ background = "#ffffff", borderColor = "transparent", borderWidth = 0, setProp }: DesignControlProps) => {

  const handleColorChange = (prop: string, value: string) => {
    // Validate color using browser's native engine
    // We check if the browser accepts the color string
    const isValidColor = (str: string) => {
      if (!str) return false;
      const s = new Option().style;
      s.color = str;
      return s.color !== '';
    };

    if (isValidColor(value)) {
      setProp((props: any) => props[prop] = value);
    }
    // If invalid, do nothing. PropertyInput will revert.
  };

  const handleWidthChange = (value: string) => {
    setProp((props: any) => props.borderWidth = parseInt(value) || 0);
  };

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-xs font-bold text-brand-medium uppercase tracking-wider mb-1">Design</h4>
      <div className="w-full h-px bg-brand-medium/20 mb-2"></div>

      {/* Color */}
      <div className="flex items-center justify-between">
        <span className="text-brand-light text-sm">Color</span>
        <div className="flex items-center gap-2 bg-brand-black p-1 rounded-lg border border-brand-medium/30">
          <input
            type="color"
            value={background}
            onChange={(e) => handleColorChange('background', e.target.value)}
            className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
          />
          <div className="w-16">
            <PropertyInput
              value={background}
              onChange={(val) => handleColorChange('background', val)}
              className="bg-transparent text-xs text-white focus:outline-none uppercase text-left w-full"
            />
          </div>
        </div>
      </div>

      {/* Stroke */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-brand-light text-sm">Stroke</span>
        <div className="flex gap-2">
          {/* Width Input */}
          <div className="flex items-center gap-2 bg-brand-black p-1 rounded-lg border border-brand-medium/30 w-12 justify-center">
            <PropertyInput
              value={borderWidth}
              onChange={(val) => handleWidthChange(val)}
              className="bg-transparent text-xs text-white focus:outline-none text-center w-full"
              placeholder="0"
            />
          </div>

          {/* Color Input */}
          <div className="flex items-center gap-2 bg-brand-black p-1 rounded-lg border border-brand-medium/30">
            <input
              type="color"
              value={borderColor}
              onChange={(e) => handleColorChange('borderColor', e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
            />
            <div className="w-16">
              <PropertyInput
                value={borderColor}
                onChange={(val) => handleColorChange('borderColor', val)}
                className="bg-transparent text-xs text-white focus:outline-none uppercase text-left w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
