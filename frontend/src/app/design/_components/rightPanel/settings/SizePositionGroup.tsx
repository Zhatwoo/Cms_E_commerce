import React, { useState, useEffect } from "react";
import { Maximize, Move } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";
import type { SpacingProps, SizeProps, SetProp } from "../../../_types/components";

type SizePositionSettableProps = SizeProps & SpacingProps;

interface SizePositionGroupProps extends SizePositionSettableProps {
  setProp: SetProp<SizePositionSettableProps>;
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

  // Helper for Width/Height modes (val may be string or number from props)
  const getMode = (val: string | number | undefined) => {
    const s = String(val ?? "");
    if (s === "100%" || (s === "auto" && !s.includes("px"))) return "fill";
    if (s === "fit-content") return "hug";
    return "fixed";
  };

  // Sync last fixed values when props change and mode is fixed
  useEffect(() => {
    if (getMode(width) === "fixed") {
      setLastFixedWidth(typeof width === "string" ? width : `${width ?? 200}px`);
    }
  }, [width]);

  useEffect(() => {
    if (getMode(height) === "fixed") {
      setLastFixedHeight(typeof height === "string" ? height : `${height ?? 200}px`);
    }
  }, [height]);

  const handleSizeChange = (dim: "width" | "height", mode: string) => {
    setProp((props) => {
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

  const BoxInput = ({ label, top, right, bottom, left, expanded, setExpanded, onChange }: {
    label: string;
    top: number;
    right: number;
    bottom: number;
    left: number;
    expanded: boolean;
    setExpanded: (val: boolean) => void;
    onChange: (side: string, val: number) => void;
  }) => {
    const handleAll = (val: number) => {
      onChange("all", val);
    };

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-brand-lighter">{label}</label>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`p-0.5 rounded ${expanded ? "bg-brand-light text-brand-dark" : "text-brand-medium hover:text-brand-lighter"}`}
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
              <div key={item.key} className="flex items-center gap-1 bg-brand-medium-dark px-1.5 rounded-lg">
                <span className="text-[10px] text-brand-light text-center px-1.5">{item.label}</span>
                <NumericInput
                  value={item.val}
                  onChange={(val) => onChange(item.key, val)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-brand-medium-dark px-3 rounded-lg border border-brand-medium/20">
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
    setProp((props) => {
      if (side === "all") {
        props.paddingTop = val;
        props.paddingRight = val;
        props.paddingBottom = val;
        props.paddingLeft = val;
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
    setProp((props) => {
      if (side === "all") {
        props.marginTop = val;
        props.marginRight = val;
        props.marginBottom = val;
        props.marginLeft = val;
        props.margin = val;
      } else {
        if (side === "top") props.marginTop = val;
        if (side === "right") props.marginRight = val;
        if (side === "bottom") props.marginBottom = val;
        if (side === "left") props.marginLeft = val;
      }
    });
  };

  // Helper render for Width/Height inputs (val may be string or number from props)
  const renderSizeInput = (dim: "width" | "height", val: string | number | undefined, setLast: (v: string) => void) => {
    const strVal = String(val ?? "");
    const mode = getMode(strVal);
    const numVal = strVal.replace("px", "");

    return (
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-brand-lighter capitalize">{dim}</label>
        <div className="flex items-center bg-brand-medium-dark rounded-lg px-1.5">
          <input
            type="text"
            value={numVal}
            disabled={mode !== "fixed"}
            onChange={(e) => {
              const v = e.target.value;
              if (/^\d*$/.test(v)) {
                setProp((props) => { props[dim] = v + "px"; });
              }
            }}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            className={`w-full bg-transparent text-xs p-1.5 focus:outline-none ${mode !== "fixed" ? "text-brand-light" : "text-brand-lighter"}`}
          />
          <div className="w-px h-4 bg-brand-medium mx-1" />

          <select
            value={mode}
            onChange={(e) => handleSizeChange(dim, e.target.value)}
            className="text-xs text-brand-light focus:outline-none appearance-none px-2 text-center"
          >
            <option value="fixed" className="text-brand-light bg-brand-dark">Fixed</option>
            <option value="fill" className="text-brand-light bg-brand-dark">Fill</option>
            <option value="hug" className="text-brand-light bg-brand-dark">Hug</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
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
