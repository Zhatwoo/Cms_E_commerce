import React, { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export interface MultiSelectItem {
  id: string;
  label: string;
}

interface MultiSelectInputProps {
  label?: string;
  items: MultiSelectItem[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MultiSelectInput = ({
  label,
  items,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
}: MultiSelectInputProps) => {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => {
    const set = new Set(value);
    return items.filter((i) => set.has(i.id));
  }, [items, value]);

  const toggle = (id: string) => {
    const set = new Set(value);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange(Array.from(set));
  };

  const clearOne = (id: string) => {
    onChange(value.filter((v) => v !== id));
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label ? <label className="text-[10px] text-[var(--builder-text)]">{label}</label> : null}

      <div className="relative">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          aria-expanded={open}
          onClick={() => { if (!disabled) setOpen((o) => !o); }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((o) => !o);
            }
            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={`w-full min-h-9 bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md px-2 py-1.5 text-left text-xs text-[var(--builder-text)] flex items-center gap-2 ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-[var(--builder-border-mid)]"}`}
        >
          <div className="flex-1 flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-[var(--builder-text-faint)]">{placeholder}</span>
            ) : (
              selected.slice(0, 2).map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 bg-black/25 border border-transparent rounded px-1.5 py-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="truncate max-w-[120px]">{s.label || s.id}</span>
                  <span
                    role="button"
                    tabIndex={-1}
                    className="text-[var(--builder-text-faint)] hover:text-[var(--builder-text)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearOne(s.id);
                    }}
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </span>
              ))
            )}
            {selected.length > 2 ? (
              <span className="text-[10px] text-[var(--builder-text-faint)] self-center">+{selected.length - 2}</span>
            ) : null}
          </div>
          <ChevronDown className={`w-4 h-4 text-[var(--builder-text-faint)] transition-transform ${open ? "rotate-180" : ""}`} />
        </div>

        {open && !disabled && (
          <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto bg-[var(--builder-surface)] border border-[var(--builder-border)] rounded-md shadow-xl">
            <div className="p-1">
              {items.length === 0 ? (
                <div className="px-2 py-2 text-xs text-[var(--builder-text-faint)]">No options</div>
              ) : (
                items.map((it) => {
                  const checked = value.includes(it.id);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => toggle(it.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-left"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                        className="h-4 w-4 accent-brand-blue"
                      />
                      <span className="text-xs text-[var(--builder-text)] truncate">{it.label || it.id}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

