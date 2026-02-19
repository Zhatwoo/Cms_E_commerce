import React, { useState, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Italic, Bold } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";
import { ColorInput } from "./inputs/ColorInput";
import type { TypographyProps, SetProp } from "../../../_types/components";

interface TypographyGroupProps extends TypographyProps {
  setProp: SetProp<TypographyProps>;
}

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Poppins",
  "Ubuntu",
  "Lato",
  "Raleway",
  "Playfair Display",
  "EB Garamond",
  "Merriweather",
  "Lora",
  "Montserrat",
  "Oswald",
  "Pacifico",
  "JetBrains Mono",
  "Fira Code",
];

export const TypographyGroup = ({
  fontFamily = "Inter",
  fontWeight = "400",
  fontStyle = "normal",
  fontSize = 16,
  lineHeight = 1.5,
  letterSpacing = 0,
  textAlign = "left",
  textTransform = "none",
  color = "#ffffff",
  setProp
}: TypographyGroupProps) => {
  const [isItalic, setIsItalic] = useState(fontStyle === "italic");
  const [isBold, setIsBold] = useState(fontWeight === "700");

  // Sync local state when props change
  useEffect(() => {
    setIsItalic(fontStyle === "italic");
  }, [fontStyle]);

  useEffect(() => {
    setIsBold(fontWeight === "700");
  }, [fontWeight]);

  const handleItalicToggle = () => {
    const newIsItalic = !isItalic;
    setIsItalic(newIsItalic);
    setProp((props) => { 
      props.fontStyle = newIsItalic ? "italic" : "normal"; 
    });
  };

  const handleBoldToggle = () => {
    const newIsBold = !isBold;
    setIsBold(newIsBold);
    setProp((props) => { 
      props.fontWeight = newIsBold ? "700" : "400"; 
    });
  };

  const alignmentOptions: { val: NonNullable<TypographyProps["textAlign"]>; icon: typeof AlignLeft }[] = [
    { val: "left", icon: AlignLeft },
    { val: "center", icon: AlignCenter },
    { val: "right", icon: AlignRight },
    { val: "justify", icon: AlignJustify },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Font Family */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-brand-lighter">Font</label>
        <div className="bg-brand-medium-dark rounded-lg px-2.5">
          <select
            value={fontFamily}
            onChange={(e) => setProp((props) => { props.fontFamily = e.target.value; })}
            className="w-full text-xs bg-brand-medium-dark text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Weight */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter">Weight</label>
          <div className="bg-brand-medium-dark rounded-lg px-2.5">
            <select
              value={fontWeight}
              onChange={(e) => setProp((props) => { props.fontWeight = e.target.value; })}
              className="w-full text-xs bg-brand-medium-dark text-brand-lighter px-2.5 py-1.5 focus:outline-none appearance-none"
            >
              <option value="300" >Light</option>
              <option value="400" >Regular</option>
              <option value="500" >Medium</option>
              <option value="700" >Bold</option>
              <option value="900" >Black</option>
            </select>
          </div>
        </div>

        {/* Size */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter">Size</label>
          <div className="bg-brand-medium-dark rounded-lg px-2.5">
            <NumericInput
              value={fontSize}
              onChange={(val) => setProp((props) => { props.fontSize = val; })}
              unit="px"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Line Height: Auto | Custom */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter">Line Height</label>
          <div className="flex items-center gap-1.5">
            <select
              value={lineHeight === "normal" || lineHeight === 0 ? "auto" : "custom"}
              onChange={(e) => {
                if (e.target.value === "auto") {
                  setProp((props) => { props.lineHeight = "normal"; });
                } else {
                  setProp((props) => { props.lineHeight = typeof lineHeight === "number" ? lineHeight : 1.5; });
                }
              }}
              className="flex-1 bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2 py-1.5 focus:outline-none appearance-none"
            >
              <option value="auto" className="text-brand-light bg-brand-dark">Auto</option>
              <option value="custom" className="text-brand-light bg-brand-dark">Custom</option>
            </select>
            {lineHeight !== "normal" && lineHeight !== 0 && (
              <div className="flex-1 bg-brand-medium-dark rounded-lg px-2">
                <NumericInput
                  value={Number(lineHeight)}
                  step={0.1}
                  onChange={(val) => setProp((props) => { props.lineHeight = val; })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Letter Spacing */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-brand-lighter">Spacing</label>
          <div className="bg-brand-medium-dark rounded-lg px-2.5">
            <NumericInput
              value={Number(letterSpacing)}
              step={0.1}
              onChange={(val) => setProp((props) => { props.letterSpacing = val; })}
            />
          </div>
        </div>
      </div>

      {/* Alignment & Transform */}
      <div className="flex justify-between items-center bg-brand-dark/30 p-1.5 rounded-lg border border-brand-medium/20">
        <div className="flex gap-1">
          {alignmentOptions.map(({ val, icon: Icon }) => (
            <button
              key={val}
              onClick={() => setProp((props) => { props.textAlign = val; })}
              className={`p-1 rounded ${textAlign === val ? "bg-brand-light text-brand-dark" : "text-brand-medium hover:text-brand-lighter"}`}
            >
              <Icon size={14} />
            </button>
          ))}
          {/* Italic button */}
          <button
            onClick={handleItalicToggle}
            className={`p-1 rounded transition-colors ${isItalic ? "bg-brand-light text-brand-dark" : "text-brand-medium hover:text-brand-lighter"}`}
            title="Italic"
          >
            <Italic size={14} />
          </button>
          {/* Bold button */}
          <button
            onClick={handleBoldToggle}
            className={`p-1 rounded transition-colors ${isBold ? "bg-brand-light text-brand-dark" : "text-brand-medium hover:text-brand-lighter"}`}
            title="Bold"
          >
            <Bold size={14} />
          </button>
        </div>
        <div className="w-px h-4 bg-brand-medium/30 mx-1"></div>
        <div className="flex gap-1">
          <select
            value={textTransform}
            onChange={(e) => setProp((props) => {
              props.textTransform = e.target.value as TypographyProps["textTransform"];
            })}
            className="text-xs text-brand-light hover:text-brand-lighter focus:outline-none appearance-none"
            style={{ textAlignLast: 'right' }}
          >
            <option value="none" className="text-brand-light bg-brand-dark">None</option>
            <option value="uppercase" className="text-brand-light bg-brand-dark">TT</option>
            <option value="lowercase" className="text-brand-light bg-brand-dark">tt</option>
            <option value="capitalize" className="text-brand-light bg-brand-dark">Tt</option>
          </select>
        </div>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-brand-lighter">Color</label>
        <div className="flex items-center gap-2 bg-brand-medium-dark rounded-lg p-1">
          <input
            type="color"
            value={color}
            onChange={(e) => setProp((props) => { props.color = e.target.value; })}
            className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
          />
          <ColorInput
            value={color}
            onChange={(val) => setProp((props) => { props.color = val; })}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};
