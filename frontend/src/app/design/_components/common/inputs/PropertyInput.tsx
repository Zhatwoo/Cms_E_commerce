import React, { useState, useEffect } from "react";

interface PropertyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  onBlur?: (value: string) => void;
}

export const PropertyInput = ({ value, onChange, className, placeholder, onBlur }: PropertyInputProps) => {
  const [internalValue, setInternalValue] = useState<string>(value?.toString() || "");

  // Sync internal value with prop value when prop changes
  useEffect(() => {
    setInternalValue(value?.toString() || "");
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      // Revert to original value
      setInternalValue(value?.toString() || "");
      e.currentTarget.blur();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // 1. If empty, revert to previous value
    if (val.trim() === "") {
      setInternalValue(value?.toString() || "");
      return;
    }

    // 2. If it's effectively unchanged, do nothing
    if (val === value?.toString()) {
      return;
    }

    // 3. Commit the change
    // The parent component is responsible for validation. 
    // If the parent rejects the value (doesn't update props), 
    // the useEffect hook won't fire.
    // So we manually revert to the current prop value here to be safe.
    // If the parent *does* accept it, the prop changes, and useEffect fires anyway.
    onChange(val);

    if (onBlur) {
      onBlur(val);
    }

    // Force reset to the current prop value (the "old" valid one).
    // If the parent accepts the change, this value will be overwritten by useEffect shortly.
    // If the parent rejects it, this correctly reverts the UI.
    setInternalValue(value?.toString() || "");
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <input
      type="text"
      value={internalValue}
      onChange={(e) => setInternalValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={`bg-transparent text-white text-sm focus:outline-none text-right w-full appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${className || ""}`}
      placeholder={placeholder}
    />
  );
};
