import React from "react";
import { NumericInput } from "./inputs/NumericInput";
import { ColorPicker } from "./inputs/ColorPicker";
import type { EffectsProps, SetProp } from "../../../_types/components";

interface EffectsGroupProps extends EffectsProps {
  setProp: SetProp<EffectsProps>;
}

type ShadowType = "none" | "drop-shadow" | "inner-shadow";

interface ShadowConfig {
  type: ShadowType;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

interface ParsedShadow {
  config: ShadowConfig;
  isApproximate: boolean;
}

const labelCls = "text-[12px] text-[var(--builder-text)] font-base";
const selectCls = "w-full rounded-md border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2.5 py-1.5 text-xs text-[var(--builder-text)] focus:outline-none";
const inputShellCls = "rounded-md border border-[var(--builder-border)] bg-[var(--builder-surface-2)]";

const DEFAULT_SHADOW_CONFIG: ShadowConfig = {
  type: "drop-shadow",
  x: 0,
  y: 4,
  blur: 4,
  spread: 0,
  color: "#00000080",
};

const LEGACY_SHADOW_MAP: Array<{ value: string; config: ShadowConfig }> = [
  {
    value: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    config: { type: "drop-shadow", x: 0, y: 4, blur: 6, spread: -1, color: "#0000001A" },
  },
  {
    value: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    config: { type: "drop-shadow", x: 0, y: 10, blur: 15, spread: -3, color: "#0000001A" },
  },
  {
    value: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    config: { type: "drop-shadow", x: 0, y: 20, blur: 25, spread: -5, color: "#0000001A" },
  },
];

const keywordToHex: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  transparent: "#00000000",
  red: "#FF0000",
  green: "#008000",
  blue: "#0000FF",
  yellow: "#FFFF00",
  gray: "#808080",
  grey: "#808080",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toHexChannel = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0").toUpperCase();

const rgbaToHex = (r: number, g: number, b: number, a = 1) => {
  const alpha = toHexChannel(clamp(a, 0, 1) * 255);
  const base = `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
  return alpha === "FF" ? base : `${base}${alpha}`;
};

const normalizeShadowColor = (rawColor: string) => {
  const trimmed = rawColor.trim().replace(/;$/, "");
  if (!trimmed) return DEFAULT_SHADOW_CONFIG.color;

  if (/^#[0-9A-F]{3,8}$/i.test(trimmed)) {
    return `#${trimmed.slice(1).toUpperCase()}`;
  }

  const keyword = keywordToHex[trimmed.toLowerCase()];
  if (keyword) return keyword;

  const rgbaMatch = trimmed.match(/^rgba?\((.+)\)$/i);
  if (!rgbaMatch) return DEFAULT_SHADOW_CONFIG.color;

  const parts = rgbaMatch[1].split(",").map((part) => part.trim());
  if (parts.length < 3) return DEFAULT_SHADOW_CONFIG.color;

  const [r, g, b] = parts.slice(0, 3).map((part) => Number.parseFloat(part));
  const alpha = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);

  if ([r, g, b, alpha].some((part) => Number.isNaN(part))) {
    return DEFAULT_SHADOW_CONFIG.color;
  }

  return rgbaToHex(r, g, b, alpha);
};

const buildBoxShadow = (config: ShadowConfig) => {
  if (config.type === "none") return "none";

  const insetPrefix = config.type === "inner-shadow" ? "inset " : "";
  return `${insetPrefix}${config.x}px ${config.y}px ${Math.max(0, config.blur)}px ${config.spread}px ${config.color}`;
};

const parseShadow = (boxShadow?: string): ParsedShadow => {
  if (!boxShadow || boxShadow === "none") {
    return {
      config: { ...DEFAULT_SHADOW_CONFIG, type: "none" },
      isApproximate: false,
    };
  }

  const trimmed = boxShadow.trim();
  const legacyShadow = LEGACY_SHADOW_MAP.find((entry) => entry.value === trimmed);
  if (legacyShadow) {
    return {
      config: legacyShadow.config,
      isApproximate: true,
    };
  }

  const shadowMatch = trimmed.match(/^(inset\s+)?(-?\d*\.?\d+)px\s+(-?\d*\.?\d+)px\s+(-?\d*\.?\d+)px(?:\s+(-?\d*\.?\d+)px)?\s+(.+)$/i);
  if (!shadowMatch) {
    return {
      config: { ...DEFAULT_SHADOW_CONFIG, type: trimmed.startsWith("inset") ? "inner-shadow" : "drop-shadow" },
      isApproximate: true,
    };
  }

  return {
    config: {
      type: shadowMatch[1] ? "inner-shadow" : "drop-shadow",
      x: Number.parseFloat(shadowMatch[2]) || 0,
      y: Number.parseFloat(shadowMatch[3]) || 0,
      blur: Number.parseFloat(shadowMatch[4]) || 0,
      spread: Number.parseFloat(shadowMatch[5] ?? "0") || 0,
      color: normalizeShadowColor(shadowMatch[6]),
    },
    isApproximate: false,
  };
};

export const EffectsGroup = ({
  boxShadow = "none",
  overflow = "visible",
  cursor = "default",
  setProp,
}: EffectsGroupProps) => {
  const parsedShadow = parseShadow(boxShadow);
  const shadowConfig = parsedShadow.config;

  const updateShadow = (nextPartial: Partial<ShadowConfig>) => {
    const nextConfig: ShadowConfig = {
      ...shadowConfig,
      ...nextPartial,
    };

    setProp((props) => {
      props.boxShadow = buildBoxShadow(nextConfig);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Overflow</label>
          <select
            value={overflow}
            onChange={(e) => setProp((props) => { props.overflow = e.target.value; })}
            className={selectCls}
          >
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="scroll">Scroll</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Cursor</label>
          <select
            value={cursor}
            onChange={(e) => setProp((props) => { props.cursor = e.target.value; })}
            className={selectCls}
          >
            <option value="default">Default</option>
            <option value="pointer">Pointer</option>
            <option value="text">Text</option>
            <option value="not-allowed">Not Allowed</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Shadow</label>
          <select
            value={shadowConfig.type}
            onChange={(e) => {
              const nextType = e.target.value as ShadowType;
              if (nextType === "none") {
                setProp((props) => { props.boxShadow = "none"; });
                return;
              }

              updateShadow({
                ...(shadowConfig.type === "none" ? DEFAULT_SHADOW_CONFIG : shadowConfig),
                type: nextType,
              });
            }}
            className={selectCls}
          >
            <option value="none">None</option>
            <option value="drop-shadow">Drop shadow</option>
            <option value="inner-shadow">Inner shadow</option>
          </select>
        </div>

        {shadowConfig.type !== "none" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Position X</label>
                <div className={inputShellCls}>
                  <NumericInput
                    value={shadowConfig.x}
                    onChange={(value) => updateShadow({ x: value })}
                    unit="px"
                    step={1}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Position Y</label>
                <div className={inputShellCls}>
                  <NumericInput
                    value={shadowConfig.y}
                    onChange={(value) => updateShadow({ y: value })}
                    unit="px"
                    step={1}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Blur</label>
                <div className={inputShellCls}>
                  <NumericInput
                    value={shadowConfig.blur}
                    onChange={(value) => updateShadow({ blur: Math.max(0, value) })}
                    unit="px"
                    min={0}
                    step={1}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Spread</label>
                <div className={inputShellCls}>
                  <NumericInput
                    value={shadowConfig.spread}
                    onChange={(value) => updateShadow({ spread: value })}
                    unit="px"
                    step={1}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Color</label>
              <ColorPicker
                value={shadowConfig.color}
                onChange={(value) => updateShadow({ color: value })}
              />
            </div>

            {parsedShadow.isApproximate && (
              <p className="text-[10px] text-[var(--builder-text-muted)]">
                Editing this shadow will convert older multi-layer presets into a single Figma-style shadow.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
