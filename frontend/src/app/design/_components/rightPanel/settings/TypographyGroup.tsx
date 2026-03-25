import React, { useState, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Italic, Bold } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";
import { ColorPicker } from "./inputs/ColorPicker";
import type { TypographyProps, SetProp } from "../../../_types/components";

interface TypographyGroupProps extends TypographyProps {
  setProp: SetProp<TypographyProps>;
  showAlignmentControls?: boolean;
}

const FONT_OPTIONS = [
  "Outfit", "Roboto", "Open Sans", "Poppins", "Ubuntu", "Lato", "Raleway",
  "Playfair Display", "EB Garamond", "Merriweather", "Lora", "Montserrat",
  "Oswald", "Pacifico", "JetBrains Mono", "Fira Code",
];

const inputCls = "w-full text-xs bg-[var(--builder-surface-2)] text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none appearance-none";
const wrapCls  = "bg-[var(--builder-surface-2)] rounded-lg px-2.5 border border-[var(--builder-border)]";
const labelCls = "text-[10px] text-[var(--builder-text-muted)]";

export const TypographyGroup = ({
  fontFamily = "Outfit",
  fontWeight = "400",
  fontStyle = "normal",
  fontSize = 16,
  lineHeight = 1.5,
  letterSpacing = 0,
  textAlign = "left",
  textTransform = "none",
  color = "#ffffff",
  setProp,
  showAlignmentControls = true,
}: TypographyGroupProps) => {
  const [isItalic, setIsItalic] = useState(fontStyle === "italic");
  const [isBold, setIsBold] = useState(fontWeight === "700");

  useEffect(() => { setIsItalic(fontStyle === "italic"); }, [fontStyle]);
  useEffect(() => { setIsBold(fontWeight === "700"); }, [fontWeight]);

  const handleItalicToggle = () => {
    const next = !isItalic;
    setIsItalic(next);
    setProp((props) => { props.fontStyle = next ? "italic" : "normal"; });
  };

  const handleBoldToggle = () => {
    const next = !isBold;
    setIsBold(next);
    setProp((props) => { props.fontWeight = next ? "700" : "400"; });
  };

  const alignmentOptions: { val: NonNullable<TypographyProps["textAlign"]>; icon: typeof AlignLeft }[] = [
    { val: "left", icon: AlignLeft },
    { val: "center", icon: AlignCenter },
    { val: "right", icon: AlignRight },
    { val: "justify", icon: AlignJustify },
  ];

  const activeBtnCls = "bg-[var(--builder-accent)] text-black";
  const inactiveBtnCls = "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]";

  return (
    <div className="flex flex-col gap-4">
      {/* Font Family */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Font</label>
        <div className={wrapCls}>
          <select value={fontFamily} onChange={(e) => setProp((props) => { props.fontFamily = e.target.value; })} className={inputCls}>
            {FONT_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Weight */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Weight</label>
          <div className={wrapCls}>
            <select value={fontWeight} onChange={(e) => setProp((props) => { props.fontWeight = e.target.value; })} className={inputCls}>
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="700">Bold</option>
              <option value="900">Black</option>
            </select>
          </div>
        </div>

        {/* Size */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Size</label>
          <div className={wrapCls}>
            <NumericInput value={fontSize} onChange={(val) => setProp((props) => { props.fontSize = val; })} unit="px" presets={[10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64, 96]} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Line Height */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Line Height</label>
          <div className="flex items-center gap-1.5">
            <select
              value={lineHeight === "normal" || lineHeight === 0 ? "auto" : "custom"}
              onChange={(e) => {
                if (e.target.value === "auto") setProp((props) => { props.lineHeight = "normal"; });
                else setProp((props) => { props.lineHeight = typeof lineHeight === "number" ? lineHeight : 1.5; });
              }}
              className={`flex-1 ${inputCls} rounded-lg`}
              style={{ background: "var(--builder-surface-2)" }}
            >
              <option value="auto">Auto</option>
              <option value="custom">Custom</option>
            </select>
            {lineHeight !== "normal" && lineHeight !== 0 && (
              <div className={`flex-1 ${wrapCls}`}>
                <NumericInput value={Number(lineHeight)} step={0.1} onChange={(val) => setProp((props) => { props.lineHeight = val; })} unit="x" presets={[1, 1.2, 1.5, 2, 2.5]} />
              </div>
            )}
          </div>
        </div>

        {/* Letter Spacing */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Spacing</label>
          <div className={wrapCls}>
            <NumericInput value={Number(letterSpacing)} step={0.1} onChange={(val) => setProp((props) => { props.letterSpacing = val; })} unit="px" presets={[-1, 0, 1, 2, 4, 8]} />
          </div>
        </div>
      </div>

      {/* Alignment & Transform */}
      <div className="flex justify-between items-center bg-[var(--builder-surface-2)] p-1.5 rounded-lg border border-[var(--builder-border)]">
        <div className="flex gap-1">
          {showAlignmentControls
            ? alignmentOptions.map(({ val, icon: Icon }) => (
              <button key={val} onClick={() => setProp((props) => { props.textAlign = val; })}
                className={`p-1 rounded ${textAlign === val ? activeBtnCls : inactiveBtnCls}`}>
                <Icon size={14} />
              </button>
            ))
            : null}
          <button onClick={handleItalicToggle} className={`p-1 rounded transition-colors ${isItalic ? activeBtnCls : inactiveBtnCls}`} title="Italic">
            <Italic size={14} />
          </button>
          <button onClick={handleBoldToggle} className={`p-1 rounded transition-colors ${isBold ? activeBtnCls : inactiveBtnCls}`} title="Bold">
            <Bold size={14} />
          </button>
        </div>
        <div className="w-px h-4 bg-[var(--builder-border)] mx-1" />
        <div className="flex gap-1">
          <select
            value={textTransform}
            onChange={(e) => setProp((props) => { props.textTransform = e.target.value as TypographyProps["textTransform"]; })}
            className="text-xs text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] focus:outline-none appearance-none bg-transparent"
            style={{ textAlignLast: "right" }}
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
        <label className={labelCls}>Color</label>
        <ColorPicker value={color || "#ffffff"} onChange={(val) => setProp((props) => { props.color = val; })} />
      </div>
    </div>
  );
};
