import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronUp, ChevronDown } from "lucide-react";

interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
  icon?: React.ReactNode;
  presets?: number[];
}

export const NumericInput = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  className = "",
  icon,
  presets
}: NumericInputProps) => {
  const [localVal, setLocalVal] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const localValRef = useRef(localVal);
  const isFocusedRef = useRef(isFocused);
  const isHoveredRef = useRef(isHovered);

  // Keep refs in sync
  useEffect(() => {
    localValRef.current = localVal;
  }, [localVal]);

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  const [dropdownRect, setDropdownRect] = useState<{ top: number, left: number, width: number } | null>(null);

  const updateRect = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownRect({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isFocused) {
      updateRect();
      window.addEventListener('scroll', updateRect, true);
      window.addEventListener('resize', updateRect);
      return () => {
        window.removeEventListener('scroll', updateRect, true);
        window.removeEventListener('resize', updateRect);
      };
    }
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) {
      const next = value.toString();
      if (localValRef.current !== next) {
        setLocalVal(next);
      }
    }
  }, [value, isFocused]);

  // Add native wheel listener to prevent config panel scrolling when adjusting values
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Allow native scrolling if the target is within the custom dropdown list
      if (e.target instanceof Node && container.querySelector('[data-preset-dropdown]')?.contains(e.target)) {
        return;
      }

      // Only prevent if input is focused or hovered (use refs to avoid stale closures)
      if (isFocusedRef.current || isHoveredRef.current) {
        e.preventDefault();
        e.stopImmediatePropagation();

        const effectiveStep = e.shiftKey ? step * 10 : step;
        const current = parseFloat(localValRef.current) || 0;
        const delta = e.deltaY > 0 ? -effectiveStep : effectiveStep;
        const next = current + delta;

        // Call validateAndChange using the current ref value
        const valStr = next.toString();
        if (valStr !== "" && valStr !== "-" && /^-?\d*\.?\d*$/.test(valStr)) {
          const num = parseFloat(valStr);
          if (!isNaN(num)) {
            let validNum = num;
            if (min !== undefined && validNum < min) validNum = min;
            if (max !== undefined && validNum > max) validNum = max;
            setLocalVal(validNum.toString());
            onChange(validNum);
          }
        }
      }
    };

    // Use capture phase to catch event before it bubbles to parent scrollable containers
    container.addEventListener('wheel', handleNativeWheel, { passive: false, capture: true });

    return () => {
      container.removeEventListener('wheel', handleNativeWheel, { capture: true });
    };
  }, [step, min, max, onChange]);

  const validateAndChange = (valStr: string, commit = false) => {
    // Allow empty during edit
    if (valStr === "" && !commit) {
      setLocalVal("");
      return;
    }

    // Basic regex for number (integer or float)
    // If step is integer, maybe enforce integer?
    // Let's support float generally.
    if (valStr !== "" && valStr !== "-" && !/^-?\d*\.?\d*$/.test(valStr)) {
      return;
    }

    setLocalVal(valStr);

    const num = parseFloat(valStr);
    if (!isNaN(num)) {
      // Check bounds
      let validNum = num;
      if (commit) {
        if (min !== undefined && validNum < min) validNum = min;
        if (max !== undefined && validNum > max) validNum = max;
        // Re-format if committed
        setLocalVal(validNum.toString());
        onChange(validNum);
      } else {
        // Live update if valid
        onChange(num);
      }
    } else if (commit) {
      // If empty or invalid on blur, revert
      setLocalVal(value.toString());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndChange(e.target.value, false);
  };

  const clickingPresetRef = useRef(false);

  const handleBlur = () => {
    setIsFocused(false);
    if (!clickingPresetRef.current) {
      validateAndChange(localVal, true);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = parseFloat(localVal) || 0;
      const next = current + step;
      validateAndChange(next.toString(), true); // Commit immediately for arrows
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseFloat(localVal) || 0;
      const next = current - step;
      validateAndChange(next.toString(), true);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isFocused || isHovered) {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
      const effectiveStep = e.shiftKey ? step * 10 : step;
      const current = parseFloat(localVal) || 0;
      const delta = e.deltaY > 0 ? -effectiveStep : effectiveStep;
      const next = current + delta;
      validateAndChange(next.toString(), true);
    }
  };

  const scrubStartRef = useRef<{ x: number, val: number } | null>(null);
  const handleScrubStart = (e: React.PointerEvent) => {
    e.preventDefault();
    scrubStartRef.current = { x: e.clientX, val: parseFloat(localValRef.current) || 0 };
    document.body.style.cursor = "ew-resize";

    const handleScrubMove = (me: PointerEvent) => {
      if (!scrubStartRef.current) return;
      const dx = me.clientX - scrubStartRef.current.x;
      const effectiveStep = me.shiftKey ? step * 10 : step;
      // 3px of drag = 1 step
      const steps = Math.round(dx / 3);
      if (steps === 0) return;
      const next = scrubStartRef.current.val + steps * effectiveStep;

      const valStr = next.toString();
      if (valStr !== "" && valStr !== "-" && /^-?\d*\.?\d*$/.test(valStr)) {
        const num = parseFloat(valStr);
        if (!isNaN(num)) {
          let validNum = num;
          if (min !== undefined && validNum < min) validNum = min;
          if (max !== undefined && validNum > max) validNum = max;
          setLocalVal(validNum.toString());
          onChange(validNum); // live update
        }
      }
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
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onWheel={handleWheel}
        className="flex items-center bg-brand-medium-dark border border-brand-medium/30 rounded-md w-full h-full"
      >
        {icon && (
          <div className="pl-2 cursor-ew-resize select-none" onPointerDown={handleScrubStart}>
            {icon}
          </div>
        )}
        <input
          type="text"
          value={localVal}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-xs text-brand-lighter p-1.5 focus:outline-none min-w-[20px]"
        />
        {unit && (
          <span
            className="text-[10px] text-brand-lighter font-base pr-2 select-none cursor-ew-resize"
            onPointerDown={handleScrubStart}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Custom Dropdown presets, only visible on focus, rendered in a portal to escape overflow-hidden */}
      {isFocused && presets && presets.length > 0 && dropdownRect && createPortal(
        <div
          data-preset-dropdown="true"
          className="bg-brand-dark/95 backdrop-blur-md border border-brand-medium/30 rounded-md shadow-2xl z-[99999] max-h-48 overflow-y-auto"
          style={{
            position: 'fixed',
            top: dropdownRect.top,
            left: dropdownRect.left,
            width: dropdownRect.width
          }}
          onMouseDown={(e) => {
            // keep input from losing focus if they arbitrarily click inside the dropdown area/scrollbar
            e.preventDefault();
          }}
        >
          {presets.map(p => (
            <button
              key={p}
              type="button"
              className="w-full text-left px-2.5 py-1.5 text-[11px] text-brand-lighter hover:bg-brand-medium/60 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clickingPresetRef.current = true;
                validateAndChange(p.toString(), true);
                setIsFocused(false);
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                setTimeout(() => {
                  clickingPresetRef.current = false;
                }, 0);
              }}
            >
              {p}{unit && <span className="text-brand-medium ml-1">{unit}</span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};
