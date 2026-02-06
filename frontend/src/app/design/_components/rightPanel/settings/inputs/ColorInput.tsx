import React, { useState, useEffect } from "react";

interface ColorInputProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export const ColorInput = ({ value, onChange, className = "" }: ColorInputProps) => {
  const [localVal, setLocalVal] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalVal(value);
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalVal(val);

    // Live update if valid hex
    if (/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
      let finalVal = val;
      if (!finalVal.startsWith("#")) {
        finalVal = "#" + finalVal;
      }
      onChange(finalVal);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Validate final value
    const isValid = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(localVal);

    if (!isValid) {
      setLocalVal(value); // Revert
    } else {
      let finalVal = localVal;
      if (!finalVal.startsWith("#")) {
        finalVal = "#" + finalVal;
      }
      if (finalVal !== value) {
        onChange(finalVal);
      }
      setLocalVal(finalVal);
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
  };

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="text"
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent text-xs text-white focus:outline-none uppercase"
        spellCheck={false}
      />
    </div>
  );
};
