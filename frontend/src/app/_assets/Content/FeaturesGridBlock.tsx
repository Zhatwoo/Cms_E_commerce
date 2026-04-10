"use client";

import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../design/_components/rightPanel/settings/inputs/NumericInput";

export interface FeaturesGridBlockProps {
  heading?: string;
  subheading?: string;
  feature1Title?: string;
  feature1Desc?: string;
  feature2Title?: string;
  feature2Desc?: string;
  feature3Title?: string;
  feature3Desc?: string;
  backgroundColor?: string;
  headingColor?: string;
  textColor?: string;
  cardBg?: string;
  minHeight?: number;
}

const DEFAULTS: Required<FeaturesGridBlockProps> = {
  heading: "Why Choose Us",
  subheading: "Discover the features that make us stand out",
  feature1Title: "Feature 1",
  feature1Desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  feature2Title: "Feature 2",
  feature2Desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  feature3Title: "Feature 3",
  feature3Desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  backgroundColor: "#ffffff",
  headingColor: "#1e293b",
  textColor: "#64748b",
  cardBg: "#f8fafc",
  minHeight: 500,
};

export const FeaturesGridBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as FeaturesGridBlockProps }));

  const set = <K extends keyof FeaturesGridBlockProps>(key: K, val: FeaturesGridBlockProps[K]) =>
    setProp((p: FeaturesGridBlockProps) => { p[key] = val; });

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Content" defaultOpen>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Heading</label>
          <input className={inputCls} value={props.heading ?? DEFAULTS.heading} onChange={(e) => set("heading", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subheading</label>
          <input className={inputCls} value={props.subheading ?? DEFAULTS.subheading} onChange={(e) => set("subheading", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Feature 1 Title</label>
          <input className={inputCls} value={props.feature1Title ?? DEFAULTS.feature1Title} onChange={(e) => set("feature1Title", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Feature 1 Description</label>
          <input className={inputCls} value={props.feature1Desc ?? DEFAULTS.feature1Desc} onChange={(e) => set("feature1Desc", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Feature 2 Title</label>
          <input className={inputCls} value={props.feature2Title ?? DEFAULTS.feature2Title} onChange={(e) => set("feature2Title", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Feature 2 Description</label>
          <input className={inputCls} value={props.feature2Desc ?? DEFAULTS.feature2Desc} onChange={(e) => set("feature2Desc", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Feature 3 Title</label>
          <input className={inputCls} value={props.feature3Title ?? DEFAULTS.feature3Title} onChange={(e) => set("feature3Title", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Feature 3 Description</label>
          <input className={inputCls} value={props.feature3Desc ?? DEFAULTS.feature3Desc} onChange={(e) => set("feature3Desc", e.target.value)} />
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Background color</label>
            <ColorPicker value={props.backgroundColor ?? DEFAULTS.backgroundColor} onChange={(val) => set("backgroundColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Heading color</label>
            <ColorPicker value={props.headingColor ?? DEFAULTS.headingColor} onChange={(val) => set("headingColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Text color</label>
            <ColorPicker value={props.textColor ?? DEFAULTS.textColor} onChange={(val) => set("textColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Card background</label>
            <ColorPicker value={props.cardBg ?? DEFAULTS.cardBg} onChange={(val) => set("cardBg", val)} className="w-full" />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Size" defaultOpen={false}>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-builder-text-muted">Min height</label>
          <NumericInput value={props.minHeight ?? DEFAULTS.minHeight} onChange={(val) => set("minHeight", val)} min={200} max={1200} step={10} unit="px" />
        </div>
      </DesignSection>
    </div>
  );
};

export const FeaturesGridBlock = ({
  heading = DEFAULTS.heading,
  subheading = DEFAULTS.subheading,
  feature1Title = DEFAULTS.feature1Title,
  feature1Desc = DEFAULTS.feature1Desc,
  feature2Title = DEFAULTS.feature2Title,
  feature2Desc = DEFAULTS.feature2Desc,
  feature3Title = DEFAULTS.feature3Title,
  feature3Desc = DEFAULTS.feature3Desc,
  backgroundColor = DEFAULTS.backgroundColor,
  headingColor = DEFAULTS.headingColor,
  textColor = DEFAULTS.textColor,
  cardBg = DEFAULTS.cardBg,
  minHeight = DEFAULTS.minHeight,
}: FeaturesGridBlockProps) => {
  const { id, connectors: { connect, drag } } = useNode();

  const features = [
    { title: feature1Title, desc: feature1Desc },
    { title: feature2Title, desc: feature2Desc },
    { title: feature3Title, desc: feature3Desc },
  ];

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-node-id={id}
      style={{
        width: "100%",
        minHeight,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: backgroundColor,
        padding: "12px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "min(100%, 1200px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
          padding: "64px 24px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: headingColor }}>{heading}</p>
          <p style={{ margin: 0, fontSize: "clamp(14px, 2vw, 18px)", color: textColor }}>{subheading}</p>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "stretch", justifyContent: "center", width: "100%" }}>
          {features.map((feat, i) => (
            <div
              key={i}
              style={{
                minWidth: "min(100%, 300px)",
                flex: "1 1 300px",
                background: cardBg,
                borderRadius: 12,
                padding: "32px 28px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                boxSizing: "border-box",
              }}
            >
              <p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: headingColor }}>{feat.title}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: textColor, lineHeight: 1.6 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

FeaturesGridBlock.craft = {
  displayName: "Features Grid Block",
  props: { ...DEFAULTS },
  custom: {},
  related: { settings: FeaturesGridBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
