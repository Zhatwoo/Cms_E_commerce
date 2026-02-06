import React, { useState, useEffect } from "react";
import { Maximize, Move } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";

interface SizePositionGroupProps {
  width?: string;
  height?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  setProp: (cb: (props: any) => void) => void;
}

export const SizePositionGroup = ({
  width = "auto",
  height = "auto",
  paddingLeft = 0,
  paddingRight = 0,
  paddingTop = 0,
  paddingBottom = 0,
  marginLeft = 0,
  marginRight = 0,
  marginTop = 0,
  marginBottom = 0,
  setProp
}: SizePositionGroupProps) => {

  const [expandPadding, setExpandPadding] = useState(false);
  const [expandMargin, setExpandMargin] = useState(false);

  // Store last known fixed values to restore them when switching back to Fixed mode
  const [lastFixedWidth, setLastFixedWidth] = useState("200px");
  const [lastFixedHeight, setLastFixedHeight] = useState("200px");

  // Helper for Width/Height modes
  const getMode = (val: string) => {
    if (val === "100%" || (val === "auto" && !val.includes("px"))) return "fill";
    if (val === "fit-content") return "hug";
    return "fixed";
  };

  // Sync last fixed values when props change and mode is fixed
  useEffect(() => {
    if (getMode(width) === "fixed") {
      setLastFixedWidth(width);
    }
  }, [width]);

  useEffect(() => {
    if (getMode(height) === "fixed") {
      setLastFixedHeight(height);
    }
  }, [height]);

  const handleSizeChange = (dim: "width" | "height", mode: string) => {
    setProp((props: any) => {
      if (mode === "fill") {
        props[dim] = "100%";
      } else if (mode === "hug") {
        props[dim] = "fit-content";
      } else {
        // Restore last fixed value
        props[dim] = dim === "width" ? lastFixedWidth : lastFixedHeight;
      }
    });
  };

  const BoxInput = ({ label, top, right, bottom, left, expanded, setExpanded, onChange }: any) => {
    const handleAll = (val: number) => {
      onChange("all", val);
    };

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-brand-lighter uppercase">{label}</label>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`p-0.5 rounded ${expanded ? "bg-brand-light text-brand-dark" : "text-brand-medium hover:text-white"}`}
          >
            <Move size={12} />
          </button>
        </div>

        {expanded ? (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "T", val: top, key: "top" },
              { label: "R", val: right, key: "right" },
              { label: "B", val: bottom, key: "bottom" },
              { label: "L", val: left, key: "left" }
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-1 bg-brand-black/50 p-1 rounded border border-brand-medium/20">
                <span className="text-[10px] text-brand-medium w-3 text-center">{item.label}</span>
                <NumericInput
                  value={item.val}
                  onChange={(val) => onChange(item.key, val)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-brand-dark px-3 rounded-xl border border-brand-medium/20">
            <Maximize size={12} className="text-brand-medium" />
            <NumericInput
              value={top}
              onChange={handleAll}
              className="w-full px-2"
            />
          </div>
        )}
      </div>
    );
  };

  const handlePaddingChange = (side: string, val: number) => {
    setProp((props: any) => {
      if (side === "all") {
        props.paddingTop = props.paddingRight = props.paddingBottom = props.paddingLeft = val;
        props.padding = val;
      } else {
        if (side === "top") props.paddingTop = val;
        if (side === "right") props.paddingRight = val;
        if (side === "bottom") props.paddingBottom = val;
        if (side === "left") props.paddingLeft = val;
      }
    });
  };

  const handleMarginChange = (side: string, val: number) => {
    setProp((props: any) => {
      if (side === "all") {
        props.marginTop = props.marginRight = props.marginBottom = props.marginLeft = val;
        props.margin = val;
      } else {
        if (side === "top") props.marginTop = val;
        if (side === "right") props.marginRight = val;
        if (side === "bottom") props.marginBottom = val;
        if (side === "left") props.marginLeft = val;
      }
    });
  };

  // Helper render for Width/Height inputs
  const renderSizeInput = (dim: "width" | "height", val: string, setLast: (v: string) => void) => {
    const mode = getMode(val);
    const numVal = val.replace("px", "");

    return (
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-brand-lighter uppercase">{dim}</label>
        <div className="flex items-center bg-brand-black border border-brand-medium/30 rounded-md overflow-hidden">
          <select
            value={mode}
            onChange={(e) => handleSizeChange(dim, e.target.value)}
            className="bg-transparent text-xs text-brand-light p-1.5 border-r border-brand-medium/20 focus:outline-none appearance-none"
          >
            <option value="fixed">Fixed</option>
            <option value="fill">Fill</option>
            <option value="hug">Hug</option>
          </select>
          <input
            type="text"
            value={numVal}
            disabled={mode !== "fixed"}
            onChange={(e) => {
              const v = e.target.value;
              if (/^\d*$/.test(v)) {
                setProp((props: any) => props[dim] = v + "px");
              }
            }}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            className={`w-full bg-transparent text-xs p-1.5 focus:outline-none ${mode !== "fixed" ? "text-brand-medium/50" : "text-white"}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-light uppercase tracking-wider">Size & Position</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {renderSizeInput("width", width, setLastFixedWidth)}
        {renderSizeInput("height", height, setLastFixedHeight)}
      </div>

      <div className="w-full h-px bg-brand-medium/20 my-1"></div>

      {/* Padding */}
      <BoxInput
        label="Padding"
        top={paddingTop} right={paddingRight} bottom={paddingBottom} left={paddingLeft}
        expanded={expandPadding}
        setExpanded={setExpandPadding}
        onChange={handlePaddingChange}
      />

      {/* Margin */}
      <BoxInput
        label="Margin"
        top={marginTop} right={marginRight} bottom={marginBottom} left={marginLeft}
        expanded={expandMargin}
        setExpanded={setExpandMargin}
        onChange={handleMarginChange}
      />
    </div>
  );
};
