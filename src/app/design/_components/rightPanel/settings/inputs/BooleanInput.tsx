import React from "react";

export type BooleanInputVariant = "checkbox" | "radio";
export type BooleanInputLayout = "spread" | "inline";

interface BooleanInputProps {
  label?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  variant?: BooleanInputVariant;
  layout?: BooleanInputLayout;
  disabled?: boolean;
  className?: string;
}

export const BooleanInput = ({
  label,
  value,
  onChange,
  variant = "checkbox",
  layout = "spread",
  disabled = false,
  className = "",
}: BooleanInputProps) => {
  return (
    <label
      className={`flex items-center gap-2 select-none ${layout === "spread" ? "justify-between" : "justify-start"} ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {layout === "spread" ? (
        <>
          {label ? (
            <span className="text-[10px] text-builder-text font-medium">{label}</span>
          ) : null}
          <input
            type={variant}
            checked={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-builder-accent"
          />
        </>
      ) : (
        <>
          <input
            type={variant}
            checked={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-builder-accent"
          />
          {label ? (
            <span className="text-[10px] text-builder-text font-medium">{label}</span>
          ) : null}
        </>
      )}
    </label>
  );
};

