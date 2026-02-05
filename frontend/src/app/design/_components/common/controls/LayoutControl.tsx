import React from "react";
import { ArrowRight, ArrowDown, WrapText, SquareRoundCorner } from "lucide-react";
import { PropertyInput } from "../inputs/PropertyInput";

interface LayoutControlProps {
  width: string;
  height: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  borderRadius?: number;
  flexDirection?: string;
  flexWrap?: string;
  setProp: (cb: (props: any) => void) => void;
}

export const LayoutControl = ({
  width, height,
  paddingLeft = 0, paddingRight = 0, paddingTop = 0, paddingBottom = 0,
  borderRadius = 0,
  flexDirection, flexWrap,
  setProp
}: LayoutControlProps) => {

  // Helper to process Width/Height changes (px handling)
  const handleDimChange = (prop: string, value: string) => {
    // 1. Check if plain number -> treat as px
    if (/^\d+$/.test(value)) {
      setProp((props: any) => {
        props[prop] = `${value}px`;
      });
      return;
    }

    // 2. Validate CSS value
    // Allow:
    // - Numbers with units: 10px, 1.5em, 50%, 100vh, etc.
    // - Keywords: auto, fit-content, min-content, max-content, inherit, initial, unset
    // - Calc expressions: calc(...)

    // Simple regex for length/percentage
    const lengthRegex = /^-?(\d*\.?\d+)(px|%|em|rem|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/i;
    // Keywords
    const keywordRegex = /^(auto|fit-content|min-content|max-content|inherit|initial|unset)$/i;
    // Calc (basic check)
    const calcRegex = /^calc\(.+\)$/i;

    if (lengthRegex.test(value) || keywordRegex.test(value) || calcRegex.test(value)) {
      setProp((props: any) => {
        props[prop] = value;
      });
    }
    // If invalid, do nothing. PropertyInput will revert on blur.
  };

  // Helper to display clean number for dimensions
  const getDisplayValue = (val: string) => {
    if (!val) return "";
    if (val.endsWith("px")) {
      return val.replace("px", "");
    }
    return val;
  };

  // Helper for numeric props (Radius)
  const handleNumChange = (prop: string, value: string) => {
    setProp((props: any) => props[prop] = parseInt(value) || 0);
  };

  const activeClass = "bg-brand-light text-brand-dark";
  const inactiveClass = "text-brand-light hover:text-white hover:bg-white/5";
  const btnClass = "flex-1 p-2 rounded-md transition-all flex items-center justify-center border border-transparent";

  // Helpers for padding X/Y
  const paddingX = paddingLeft || 0;
  const paddingY = paddingTop || 0;

  const updatePaddingX = (val: string) => {
    const num = parseInt(val) || 0;
    setProp((props: any) => {
      props.paddingLeft = num;
      props.paddingRight = num;
    });
  };

  const updatePaddingY = (val: string) => {
    const num = parseInt(val) || 0;
    setProp((props: any) => {
      props.paddingTop = num;
      props.paddingBottom = num;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-xs font-bold text-brand-medium uppercase tracking-wider mb-1">Layout</h4>

      {/* Width / Height Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-brand-black border border-brand-medium/30 rounded-lg p-2 flex items-center gap-2">
          <span className="text-brand-medium text-xs font-mono">W</span>
          <PropertyInput
            value={getDisplayValue(width)}
            onChange={(val) => handleDimChange('width', val)}
            placeholder="auto"
          />
        </div>
        <div className="bg-brand-black border border-brand-medium/30 rounded-lg p-2 flex items-center gap-2">
          <span className="text-brand-medium text-xs font-mono">H</span>
          <PropertyInput
            value={getDisplayValue(height)}
            onChange={(val) => handleDimChange('height', val)}
            placeholder="auto"
          />
        </div>
      </div>

      {/* Radius & Flow & Padding */}
      <div className="grid grid-cols-2 gap-2">
        {/* Radius */}
        <div className="bg-brand-black border border-brand-medium/30 rounded-lg p-2 flex items-center gap-2">
          <SquareRoundCorner size={14} className="text-brand-medium" />
          <PropertyInput
            value={borderRadius}
            onChange={(val) => handleNumChange('borderRadius', val)}
          />
        </div>

        {/* Padding X */}
        <div className="bg-brand-black border border-brand-medium/30 rounded-lg p-2 flex items-center gap-2" title="Padding Horizontal">
          <span className="text-brand-medium text-xs font-mono px-1">PX</span>
          <PropertyInput
            value={paddingX}
            onChange={(val) => updatePaddingX(val)}
          />
        </div>

        {/* Padding Y */}
        <div className="bg-brand-black border border-brand-medium/30 rounded-lg p-2 flex items-center gap-2" title="Padding Vertical">
          <span className="text-brand-medium text-xs font-mono px-1">PY</span>
          <PropertyInput
            value={paddingY}
            onChange={(val) => updatePaddingY(val)}
          />
        </div>
      </div>

      {/* Flow Control */}
      <div className="bg-brand-dark/50 p-1 rounded-lg border border-brand-medium/20 flex gap-1">
        <button
          className={`${btnClass} ${flexDirection === 'row' && flexWrap === 'nowrap' ? activeClass : inactiveClass}`}
          onClick={() => setProp((p: any) => { p.flexDirection = 'row'; p.flexWrap = 'nowrap'; })}
          title="Flow to Right"
        >
          <ArrowRight size={16} />
        </button>
        <button
          className={`${btnClass} ${flexDirection === 'column' ? activeClass : inactiveClass}`}
          onClick={() => setProp((p: any) => { p.flexDirection = 'column'; p.flexWrap = 'nowrap'; })}
          title="Flow to Bottom"
        >
          <ArrowDown size={16} />
        </button>
        <button
          className={`${btnClass} ${flexWrap === 'wrap' ? activeClass : inactiveClass}`}
          onClick={() => setProp((p: any) => { p.flexDirection = 'row'; p.flexWrap = 'wrap'; })}
          title="Wrap"
        >
          <WrapText size={16} />
        </button>
      </div>

    </div>
  );
};
