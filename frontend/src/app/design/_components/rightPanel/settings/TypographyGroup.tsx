import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Italic, Bold, ChevronDown } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";
import { ColorPicker } from "./inputs/ColorPicker";
import type { TypographyProps, SetProp } from "../../../_types/components";

interface TypographyGroupProps extends TypographyProps {
  setProp: SetProp<TypographyProps>;
}

interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

const FONT_OPTIONS = [
  "Outfit", "Roboto", "Open Sans", "Poppins", "Ubuntu", "Lato", "Raleway",
  "Playfair Display", "EB Garamond", "Merriweather", "Lora", "Montserrat",
  "Oswald", "Pacifico", "JetBrains Mono", "Fira Code",
];

const WEIGHT_OPTIONS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "700", label: "Bold" },
  { value: "900", label: "Black" },
] as const;

const TEXT_TRANSFORM_OPTIONS = [
  { value: "capitalize", label: "Aa" },
  { value: "uppercase", label: "AA" },
  { value: "lowercase", label: "aa" },
] as const;

const labelCls = "text-[10px] text-[var(--builder-text-muted)]";
const selectShellCls = "relative flex items-center rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)] transition-colors hover:border-[var(--builder-border-mid)]";
const iconButtonBaseCls = "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--builder-border)] text-[var(--builder-text-muted)] transition-colors";

const isBoldWeight = (weight: string) => {
  const parsed = Number.parseInt(weight, 10);
  if (!Number.isNaN(parsed)) return parsed >= 700;
  return weight.toLowerCase() === "bold";
};

const StyledDropdown = <T extends string>({
  value,
  options,
  onChange,
  buttonClassName = "",
  menuClassName = "",
  className = "",
  align = "left",
  minMenuWidth = 72,
}: {
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (value: T) => void;
  buttonClassName?: string;
  menuClassName?: string;
  className?: string;
  align?: "left" | "right";
  minMenuWidth?: number;
}) => {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;

    const updateRect = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.max(rect.width, minMenuWidth);
      setMenuRect({
        top: rect.bottom + 6,
        left: align === "right" ? rect.right - width : rect.left,
        width,
      });
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [align, minMenuWidth, open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${selectShellCls} gap-2 px-2.5 py-1.5 text-xs text-[var(--builder-text)] ${buttonClassName} ${className}`.trim()}
      >
        <span className={`flex-1 truncate ${align === "right" ? "text-right" : "text-left"}`}>{selectedOption.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--builder-text-faint)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && menuRect && createPortal(
        <div
          ref={menuRef}
          className={`z-[99999] overflow-hidden rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface)] shadow-2xl ${menuClassName}`.trim()}
          style={{
            position: "fixed",
            top: menuRect.top,
            left: menuRect.left,
            width: menuRect.width,
          }}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center px-3 py-2 text-xs transition-colors ${
                  active
                    ? "bg-[var(--builder-surface-2)] text-[var(--builder-text)]"
                    : "text-[var(--builder-text-muted)] hover:bg-[var(--builder-surface-2)] hover:text-[var(--builder-text)]"
                } ${align === "right" ? "justify-end text-right" : "justify-start text-left"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};

export const TypographyGroup = ({
  fontFamily = "Outfit",
  fontWeight = "400",
  fontStyle = "normal",
  fontSize = 16,
  lineHeight = 1.5,
  letterSpacing = 0,
  textAlign = "left",
  textTransform = "none",
  color = "#ffffff",
  setProp
}: TypographyGroupProps) => {
  const italicActive = fontStyle === "italic";
  const boldActive = isBoldWeight(fontWeight);

  const alignmentOptions: { val: NonNullable<TypographyProps["textAlign"]>; icon: typeof AlignLeft }[] = [
    { val: "left", icon: AlignLeft },
    { val: "center", icon: AlignCenter },
    { val: "right", icon: AlignRight },
    { val: "justify", icon: AlignJustify },
  ];

  const activeBtnCls = "border-[var(--builder-accent)] bg-[var(--builder-accent)] text-black";
  const inactiveBtnCls = "hover:border-[var(--builder-border-mid)] hover:text-[var(--builder-text)]";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Font</label>
        <StyledDropdown
          value={fontFamily}
          options={FONT_OPTIONS.map((font) => ({ value: font, label: font }))}
          onChange={(value) => setProp((props) => { props.fontFamily = value; })}
          buttonClassName="w-full"
          minMenuWidth={180}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Weight</label>
          <div className="flex items-center gap-1.5">
            <StyledDropdown
              value={fontWeight}
              options={WEIGHT_OPTIONS}
              onChange={(value) => setProp((props) => { props.fontWeight = value; })}
              buttonClassName="w-full"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setProp((props) => { props.fontStyle = props.fontStyle === "italic" ? "normal" : "italic"; })}
              className={`${iconButtonBaseCls} ${italicActive ? activeBtnCls : inactiveBtnCls}`}
              title="Italic"
              aria-pressed={italicActive}
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              onClick={() => setProp((props) => { props.fontWeight = isBoldWeight(String(props.fontWeight ?? fontWeight)) ? "400" : "700"; })}
              className={`${iconButtonBaseCls} ${boldActive ? activeBtnCls : inactiveBtnCls}`}
              title="Bold"
              aria-pressed={boldActive}
            >
              <Bold size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Size</label>
          <div className="rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)]">
            <NumericInput value={fontSize} onChange={(val) => setProp((props) => { props.fontSize = val; })} unit="px" presets={[10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64, 96]} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Line Height</label>
          <div className="flex items-center gap-1.5">
            <StyledDropdown
              value={lineHeight === "normal" || lineHeight === 0 ? "auto" : "custom"}
              options={[
                { value: "auto", label: "Auto" },
                { value: "custom", label: "Custom" },
              ]}
              onChange={(value) => {
                if (value === "auto") {
                  setProp((props) => { props.lineHeight = "normal"; });
                  return;
                }
                setProp((props) => { props.lineHeight = typeof lineHeight === "number" ? lineHeight : 1.5; });
              }}
              buttonClassName="w-full"
              className="flex-1"
            />
            {lineHeight !== "normal" && lineHeight !== 0 && (
              <div className="flex-1 rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)]">
                <NumericInput value={Number(lineHeight)} step={0.1} onChange={(val) => setProp((props) => { props.lineHeight = val; })} unit="x" presets={[1, 1.2, 1.5, 2, 2.5]} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Spacing</label>
          <div className="rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)]">
            <NumericInput value={Number(letterSpacing)} step={0.1} onChange={(val) => setProp((props) => { props.letterSpacing = val; })} unit="px" presets={[-1, 0, 1, 2, 4, 8]} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)] p-1.5">
        <div className="flex gap-1">
          {showAlignmentControls
            ? alignmentOptions.map(({ val, icon: Icon }) => (
              <button
                key={val}
                type="button"
                onClick={() => setProp((props) => { props.textAlign = val; })}
                className={`${iconButtonBaseCls} ${textAlign === val ? activeBtnCls : inactiveBtnCls}`}
                aria-pressed={textAlign === val}
                title={`Align ${val}`}
              >
                <Icon size={14} />
              </button>
            ))
            : null}
        </div>

        <div className="mx-1 h-5 w-px bg-[var(--builder-border)]" />

        <StyledDropdown
          value={textTransform === "none" ? "capitalize" : textTransform}
          options={TEXT_TRANSFORM_OPTIONS}
          onChange={(value) => setProp((props) => { props.textTransform = value; })}
          buttonClassName="min-w-[72px]"
          align="right"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Color</label>
        <ColorPicker value={color || "#ffffff"} onChange={(val) => setProp((props) => { props.color = val; })} />
      </div>
    </div>
  );
};
