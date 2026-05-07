import React, { useState, useEffect, useRef } from "react";
import { Maximize2, Square, Shrink, Move, Lock, LockOpen, Scan } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";
import type { SpacingProps, SizeProps, SetProp } from "../../../_types/components";

type SizePositionSettableProps = SizeProps & SpacingProps;

interface SizePositionGroupProps extends SizePositionSettableProps {
  setProp: SetProp<SizePositionSettableProps>;
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  hidePadding?: boolean;
  hideMargin?: boolean;
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
  hidePadding = false,
  hideMargin = false,
  setProp
}: SizePositionGroupProps) => {

  const [expandPadding, setExpandPadding] = useState(false);
  const [expandMargin, setExpandMargin] = useState(false);
  const [aspectLocked, setAspectLocked] = useState(false);

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

  // Sync last fixed values when props change and mode is fixed (0 is valid)
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
        props[dim] = dim === "width" ? lastFixedWidth : lastFixedHeight;
      }
    });
  };

  const bothFixed = getMode(String(width ?? "")) === "fixed" && getMode(String(height ?? "")) === "fixed";
  const parsePx = (v: string | number | undefined): number =>
    typeof v === "number" ? v : parseInt(String(v ?? "").replace("px", ""), 10) || 0;
  const currentW = parsePx(width);
  const currentH = parsePx(height);
  const aspectRatio = currentH > 0 ? currentW / currentH : 1;

  const handleWidthPxChange = (newW: number) => {
    const wPx = `${Math.max(0, newW)}px`;
    setProp((props) => {
      props.width = wPx;
      if (aspectLocked && bothFixed && currentH > 0) {
        props.height = `${Math.max(0, Math.round(newW / aspectRatio))}px`;
      }
    });
  };
  const handleHeightPxChange = (newH: number) => {
    const hPx = `${Math.max(0, newH)}px`;
    setProp((props) => {
      props.height = hPx;
      if (aspectLocked && bothFixed && currentW > 0) {
        props.width = `${Math.max(0, Math.round(newH * aspectRatio))}px`;
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
          <label className="text-[10px] text-[var(--builder-text-muted)]">{label}</label>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`p-0.5 rounded ${expanded ? "bg-[var(--builder-accent)] text-black" : "text-[var(--builder-text-faint)] hover:text-[var(--builder-text-muted)]"}`}
          >
            <Scan size={12} className={expanded ? "rotate-90" : "rotate-0"} />
          </button>
        </div>

        {expanded ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={top}
                onChange={(val) => onChange("top", val)}
                icon={<div className="w-3 h-1 border-t-2 border-[var(--builder-border-mid)] mr-2" />}
                presets={[0, 4, 8, 12, 16, 24, 32, 48, 64]}
              />
            </div>
            <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={right}
                onChange={(val) => onChange("right", val)}
                icon={<div className="w-1 h-3 border-r-2 border-[var(--builder-border-mid)] mr-2" />}
                presets={[0, 4, 8, 12, 16, 24, 32, 48, 64]}
              />
            </div>
            <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={bottom}
                onChange={(val) => onChange("bottom", val)}
                icon={<div className="w-3 h-1 border-b-2 border-[var(--builder-border-mid)] mr-2" />}
                presets={[0, 4, 8, 12, 16, 24, 32, 48, 64]}
              />
            </div>
            <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={left}
                onChange={(val) => onChange("left", val)}
                icon={<div className="w-1 h-3 border-l-2 border-[var(--builder-border-mid)] mr-2" />}
                presets={[0, 4, 8, 12, 16, 24, 32, 48, 64]}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-[var(--builder-surface-2)] px-3 rounded-lg border border-[var(--builder-border)]">
            <Maximize2 size={12} className="text-[var(--builder-text-faint)]" />
            <NumericInput
              value={top}
              onChange={handleAll}
              className="w-full px-2"
              presets={[0, 4, 8, 12, 16, 24, 32, 48, 64]}
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

  const renderSizeRow = (dim: "width" | "height", val: string | number | undefined, setLast: (v: string) => void, onPxChange: (n: number) => void) => {
    const strVal = String(val ?? "");
    const mode = getMode(strVal);
    const propNumStr = strVal.replace("px", "");
    const isFixed = mode === "fixed";

    return (
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-[var(--builder-text-muted)] capitalize">{dim}</label>
        <div className="flex items-center gap-1">
          <SizePxInput
            propNumStr={propNumStr}
            disabled={!isFixed}
            setLast={setLast}
            onPxChange={onPxChange}
          />
          <div className="flex rounded-lg border border-[var(--builder-border)] overflow-hidden">
            <button
              type="button"
              onClick={() => handleSizeChange(dim, "hug")}
              className={`p-1.5 ${mode === "hug" ? "bg-[var(--builder-accent)] text-black" : "bg-[var(--builder-surface-2)] text-[var(--builder-text-muted)] hover:text-[var(--builder-text-muted)]"}`}
              title="Hug contents"
            >
              <Shrink size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleSizeChange(dim, "fixed")}
              className={`p-1.5 ${mode === "fixed" ? "bg-[var(--builder-accent)] text-black" : "bg-[var(--builder-surface-2)] text-[var(--builder-text-muted)] hover:text-[var(--builder-text-muted)]"}`}
              title="Fixed"
            >
              <Square size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleSizeChange(dim, "fill")}
              className={`p-1.5 ${mode === "fill" ? "bg-[var(--builder-accent)] text-black" : "bg-[var(--builder-surface-2)] text-[var(--builder-text-muted)] hover:text-[var(--builder-text-muted)]"}`}
              title="Fill"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <div className="flex flex-col gap-2">
            {renderSizeRow("width", width, setLastFixedWidth, (n) => {
              setLastFixedWidth(`${n}px`);
              handleWidthPxChange(n);
            })}
            {renderSizeRow("height", height, setLastFixedHeight, (n) => {
              setLastFixedHeight(`${n}px`);
              handleHeightPxChange(n);
            })}
          </div>
          {bothFixed && (
            <button
              type="button"
              onClick={() => setAspectLocked((a) => !a)}
              className={`p-2 rounded-lg border self-center ${aspectLocked ? "bg-[var(--builder-accent)] text-black border-[var(--builder-accent)]" : "bg-[var(--builder-surface-2)] border-[var(--builder-border)] text-[var(--builder-text-muted)] hover:text-[var(--builder-text-muted)]"}`}
              title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {aspectLocked ? <Lock size={16} /> : <LockOpen size={16} />}
            </button>
          )}
        </div>
      </div>

      {(!hidePadding || !hideMargin) && <div className="w-full h-px bg-[var(--builder-border)] my-1"></div>}

      {/* Padding */}
      {!hidePadding && (
        <BoxInput
          label="Padding"
          top={paddingTop} right={paddingRight} bottom={paddingBottom} left={paddingLeft}
          expanded={expandPadding}
          setExpanded={setExpandPadding}
          onChange={handlePaddingChange}
        />
      )}

      {/* Margin */}
      {!hideMargin && (
        <BoxInput
          label="Margin"
          top={marginTop} right={marginRight} bottom={marginBottom} left={marginLeft}
          expanded={expandMargin}
          setExpanded={setExpandMargin}
          onChange={handleMarginChange}
        />
      )}
    </div>
  );
};

/** Width/Height px input with local state so user can clear and type 0; allows zero value. */
function SizePxInput({
  propNumStr,
  disabled,
  setLast,
  onPxChange,
}: {
  propNumStr: string;
  disabled: boolean;
  setLast: (v: string) => void;
  onPxChange: (n: number) => void;
}) {
  const [localStr, setLocalStr] = useState(propNumStr);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused && localStr !== propNumStr) {
      setLocalStr(propNumStr);
    }
  }, [propNumStr, isFocused]);

  const displayVal = isFocused ? localStr : propNumStr;

  const scrubStartRef = useRef<{ x: number, val: number } | null>(null);
  const handleScrubStart = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    scrubStartRef.current = { x: e.clientX, val: parseInt(localStr) || 0 };
    document.body.style.cursor = "ew-resize";

    const handleScrubMove = (me: PointerEvent) => {
      if (!scrubStartRef.current) return;
      const dx = me.clientX - scrubStartRef.current.x;
      const stepValue = me.shiftKey ? 10 : 1;
      const steps = Math.round(dx / 3);
      if (steps === 0) return;
      const next = Math.max(0, scrubStartRef.current.val + steps * stepValue);
      setLocalStr(String(next));
      onPxChange(next);
      setLast(`${next}px`);
    };

    const handleScrubEnd = () => {
      scrubStartRef.current = null;
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", handleScrubMove);
      window.removeEventListener("pointerup", handleScrubEnd);
    };

    window.addEventListener("pointermove", handleScrubMove);
    window.addEventListener("pointerup", handleScrubEnd);
  };

  return (
    <div className="flex flex-1 items-center bg-[var(--builder-surface-2)] rounded-lg px-1.5 border border-[var(--builder-border)]">
      <input
        type="text"
        value={displayVal}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          if (/^\d*$/.test(v)) {
            setLocalStr(v);
            const n = parseInt(v, 10);
            if (!isNaN(n) && n >= 0) {
              onPxChange(n);
              setLast(`${n}px`);
            }
          }
        }}
        onFocus={(e) => {
          setIsFocused(true);
          setLocalStr(propNumStr);
          e.target.select();
        }}
        onBlur={() => {
          setIsFocused(false);
          const n = localStr === "" ? 0 : parseInt(localStr, 10);
          const valid = !isNaN(n) && n >= 0 ? n : 0;
          onPxChange(valid);
          setLast(`${valid}px`);
          setLocalStr(String(valid));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        onWheel={(e) => {
          if (disabled) return;
          e.preventDefault();
          e.stopPropagation();
          if (e.nativeEvent && "stopImmediatePropagation" in e.nativeEvent) {
            (e.nativeEvent as React.WheelEvent["nativeEvent"] & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
          }
          const current = parseInt(localStr || "0", 10);
          const safeCurrent = isNaN(current) || current < 0 ? 0 : current;
          const step = e.shiftKey ? 10 : 1;
          const delta = e.deltaY > 0 ? -step : step;
          const next = Math.max(0, safeCurrent + delta);
          onPxChange(next);
          setLast(`${next}px`);
          setLocalStr(String(next));
        }}
        className={`w-full bg-transparent text-xs p-1.5 focus:outline-none ${disabled ? "text-[var(--builder-text-muted)]" : "text-[var(--builder-text-muted)]"}`}
      />
      <span
        className={`text-[10px] text-[var(--builder-text-faint)] pr-1 ${!disabled ? "cursor-ew-resize select-none" : ""}`}
        onPointerDown={!disabled ? handleScrubStart : undefined}
      >
        px
      </span>
    </div>
  );
}
