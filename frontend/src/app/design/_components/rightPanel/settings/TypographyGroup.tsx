import React, { useState } from "react";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";
import { ColorInput } from "./inputs/ColorInput";

interface TypographyGroupProps {
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: number;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  color?: string;
  setProp: (cb: (props: any) => void) => void;
}

export const TypographyGroup = ({
  fontFamily = "Inter",
  fontWeight = "400",
  fontSize = 16,
  lineHeight = 1.5,
  letterSpacing = 0,
  textAlign = "left",
  textTransform = "none",
  color = "#ffffff",
  setProp
}: TypographyGroupProps) => {

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-light uppercase tracking-wider">Typography</span>
      </div>

      {/* Font Family */}
      <div className="flex flex-col gap-1">
        <select
          value={fontFamily}
          onChange={(e) => setProp((props: any) => props.fontFamily = e.target.value)}
          className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-2 focus:outline-none"
        >
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Playfair Display">Playfair</option>
          <option value="Open Sans">Open Sans</option>
          <option value="Monospace">Monospace</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Weight */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter uppercase">Weight</label>
          <select
            value={fontWeight}
            onChange={(e) => setProp((props: any) => props.fontWeight = e.target.value)}
            className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-1.5 focus:outline-none"
          >
            <option value="300">Light</option>
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="700">Bold</option>
            <option value="900">Black</option>
          </select>
        </div>

        {/* Size */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter uppercase">Size</label>
          <NumericInput
            value={fontSize}
            onChange={(val) => setProp((props: any) => props.fontSize = val)}
            unit="px"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Line Height */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter uppercase">Line Height</label>
          <NumericInput
            value={Number(lineHeight)}
            step={0.1}
            onChange={(val) => setProp((props: any) => props.lineHeight = val)}
          />
        </div>

        {/* Letter Spacing */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter uppercase">Spacing</label>
          <NumericInput
            value={Number(letterSpacing)}
            step={0.1}
            onChange={(val) => setProp((props: any) => props.letterSpacing = val)}
          />
        </div>
      </div>

      {/* Alignment & Transform */}
      <div className="flex justify-between items-center bg-brand-dark/30 p-1.5 rounded-lg border border-brand-medium/20">
        <div className="flex gap-1">
          {[
            { val: "left", icon: AlignLeft },
            { val: "center", icon: AlignCenter },
            { val: "right", icon: AlignRight },
            { val: "justify", icon: AlignJustify },
          ].map(({ val, icon: Icon }) => (
            <button
              key={val}
              onClick={() => setProp((props: any) => props.textAlign = val)}
              className={`p-1 rounded ${textAlign === val ? "bg-brand-light text-brand-dark" : "text-brand-medium hover:text-white"}`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-brand-medium/30 mx-1"></div>
        <div className="flex gap-1">
          <select
            value={textTransform}
            onChange={(e) => setProp((props: any) => props.textTransform = e.target.value)}
            className="bg-transparent text-xs text-brand-light hover:text-white focus:outline-none appearance-none"
            style={{ textAlignLast: 'right' }}
          >
            <option value="none">None</option>
            <option value="uppercase">TT</option>
            <option value="lowercase">tt</option>
            <option value="capitalize">Tt</option>
          </select>
        </div>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-brand-lighter uppercase">Color</label>
        <div className="flex items-center gap-2 bg-brand-black border border-brand-medium/30 rounded-md p-1">
          <input
            type="color"
            value={color}
            onChange={(e) => setProp((props: any) => props.color = e.target.value)}
            className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
          />
          <ColorInput
            value={color}
            onChange={(val) => setProp((props: any) => props.color = val)}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};
