"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../design/_components/rightPanel/settings/inputs/NumericInput";

export interface StatsCounterBlockProps {
  stat1Value?: string;
  stat1Label?: string;
  stat2Value?: string;
  stat2Label?: string;
  stat3Value?: string;
  stat3Label?: string;
  stat4Value?: string;
  stat4Label?: string;
  backgroundColor?: string;
  valueColor?: string;
  labelColor?: string;
  cardBg?: string;
}

const defaults: Required<StatsCounterBlockProps> = {
  stat1Value: "10K+",
  stat1Label: "Products",
  stat2Value: "500+",
  stat2Label: "Brands",
  stat3Value: "98%",
  stat3Label: "Happy Customers",
  stat4Value: "24/7",
  stat4Label: "Support",
  backgroundColor: "#0f172a",
  valueColor: "#ffffff",
  labelColor: "#94a3b8",
  cardBg: "rgba(255,255,255,0.05)",
};

export const StatsCounterBlockSettings = () => {
  const {
    props,
    actions: { setProp },
  } = useNode((node) => ({ props: node.data.props as StatsCounterBlockProps }));

  const set = <K extends keyof StatsCounterBlockProps>(
    key: K,
    val: StatsCounterBlockProps[K],
  ) => setProp((p: StatsCounterBlockProps) => { p[key] = val; });

  const inputCls =
    "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Content" defaultOpen>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Stat 1 Value</label>
          <input className={inputCls} value={props.stat1Value ?? defaults.stat1Value} onChange={(e) => set("stat1Value", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Stat 1 Label</label>
          <input className={inputCls} value={props.stat1Label ?? defaults.stat1Label} onChange={(e) => set("stat1Label", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Stat 2 Value</label>
          <input className={inputCls} value={props.stat2Value ?? defaults.stat2Value} onChange={(e) => set("stat2Value", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Stat 2 Label</label>
          <input className={inputCls} value={props.stat2Label ?? defaults.stat2Label} onChange={(e) => set("stat2Label", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Stat 3 Value</label>
          <input className={inputCls} value={props.stat3Value ?? defaults.stat3Value} onChange={(e) => set("stat3Value", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Stat 3 Label</label>
          <input className={inputCls} value={props.stat3Label ?? defaults.stat3Label} onChange={(e) => set("stat3Label", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Stat 4 Value</label>
          <input className={inputCls} value={props.stat4Value ?? defaults.stat4Value} onChange={(e) => set("stat4Value", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Stat 4 Label</label>
          <input className={inputCls} value={props.stat4Label ?? defaults.stat4Label} onChange={(e) => set("stat4Label", e.target.value)} />
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Background</label>
            <ColorPicker value={props.backgroundColor ?? defaults.backgroundColor} onChange={(val) => set("backgroundColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Value color</label>
            <ColorPicker value={props.valueColor ?? defaults.valueColor} onChange={(val) => set("valueColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Label color</label>
            <ColorPicker value={props.labelColor ?? defaults.labelColor} onChange={(val) => set("labelColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Card background</label>
            <ColorPicker value={props.cardBg ?? defaults.cardBg} onChange={(val) => set("cardBg", val)} className="w-full" />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};

export const StatsCounterBlock = ({
  stat1Value = defaults.stat1Value,
  stat1Label = defaults.stat1Label,
  stat2Value = defaults.stat2Value,
  stat2Label = defaults.stat2Label,
  stat3Value = defaults.stat3Value,
  stat3Label = defaults.stat3Label,
  stat4Value = defaults.stat4Value,
  stat4Label = defaults.stat4Label,
  backgroundColor = defaults.backgroundColor,
  valueColor = defaults.valueColor,
  labelColor = defaults.labelColor,
  cardBg = defaults.cardBg,
}: StatsCounterBlockProps) => {
  const {
    id,
    connectors: { connect, drag },
  } = useNode();

  const stats = [
    { value: stat1Value, label: stat1Label },
    { value: stat2Value, label: stat2Label },
    { value: stat3Value, label: stat3Label },
    { value: stat4Value, label: stat4Label },
  ];

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-node-id={id}
      style={{
        width: "100%",
        background: backgroundColor,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "64px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "min(100%, 1100px)",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {stats.map((stat, idx) => (
          <div
            key={idx}
            style={{
              flex: "1 1 220px",
              minWidth: "min(100%, 220px)",
              background: cardBg,
              borderRadius: 16,
              padding: "36px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxSizing: "border-box",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "clamp(28px, 5vw, 40px)",
                fontWeight: 700,
                color: valueColor,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 500,
                color: labelColor,
                textAlign: "center",
                letterSpacing: 1,
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

StatsCounterBlock.craft = {
  displayName: "Stats Counter Block",
  props: { ...defaults },
  custom: {},
  related: { settings: StatsCounterBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
