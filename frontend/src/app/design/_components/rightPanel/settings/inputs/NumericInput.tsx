import React, { useState, useEffect, useRef } from "react";
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
}

export const NumericInput = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  className = "",
  icon
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

  useEffect(() => {
    // Only update from props if not currently editing (or if prop value changed externally significantly)
    // Actually, usually we want to sync, but avoid cursor jumping.
    // For simple settings panels, syncing on blur or effect is usually fine.
    // Let's sync always but only if we are not focused or if the parsed value is different.
    if (!isFocused) {
      setLocalVal(value.toString());
    }
  }, [value, isFocused]);

  // Add native wheel listener to prevent config panel scrolling when adjusting values
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Only prevent if input is focused or hovered (use refs to avoid stale closures)
      if (isFocusedRef.current || isHoveredRef.current) {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        // Get current value from ref to avoid stale closure
        const current = parseFloat(localValRef.current) || 0;
        const delta = e.deltaY > 0 ? -step : step;
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

  const handleBlur = () => {
    setIsFocused(false);
    validateAndChange(localVal, true);
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
    // Only adjust when input is focused or hovered
    if (isFocused || isHovered) {
      // Prevent scrolling the config panel
      e.preventDefault();
      e.stopPropagation();
      
      // Also stop on native event to prevent any parent scroll
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
      
      const current = parseFloat(localVal) || 0;
      // Scroll up (negative deltaY) = increase, scroll down (positive deltaY) = decrease
      const delta = e.deltaY > 0 ? -step : step;
      const next = current + delta;
      validateAndChange(next.toString(), true);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onWheel={handleWheel}
      className={`flex items-center overflow-hidden bg-brand-medium-dark border border-brand-medium/30 rounded-md ${className}`}
    >
      {icon && <div className="pl-2">{icon}</div>}
      <input
        type="text"
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent text-xs text-brand-lighter p-1.5 focus:outline-none"
      />
      {unit && <span className="text-[10px] text-brand-lighter font-base pr-2 select-none">{unit}</span>}

      {/* Optional: We could add up/down buttons here if desired, but arrow keys are usually enough for power users */}
    </div>
  );
};
