"use client";

import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../design/_components/rightPanel/settings/inputs/NumericInput";

export type FeaturesGridLayoutStyle = "three-col" | "two-col" | "single-col" | "horizontal";

export interface FeaturesGridBlockProps {
  layoutStyle?: FeaturesGridLayoutStyle;
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
  layoutStyle: "three-col",
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

const LayoutThumb = ({ style, active, onClick, label }: { style: FeaturesGridLayoutStyle; active: boolean; onClick: () => void; label: string }) => {
  const box = `w-full aspect-[4/3] rounded-lg border-2 overflow-hidden flex transition-all ${
    active
      ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10"
      : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] hover:border-[var(--builder-border-mid)]"
  }`;
  const c = active ? "var(--builder-accent)" : "#94a3b8";
  const co = active ? 0.7 : 0.5;
  const t = active ? "var(--builder-accent)" : "#cbd5e1";
  const to2 = active ? 0.8 : 0.6;

  const cardBox = (w: string) => (
    <div style={{ flex: `0 0 ${w}`, display: "flex", flexDirection: "column" as const, gap: 2, background: c, opacity: co, borderRadius: 3, padding: "4px 3px" }}>
      {[80, 60].map((pw, i) => (
        <div key={i} style={{ height: 2, background: t, borderRadius: 1, width: `${pw}%`, opacity: to2 }} />
      ))}
    </div>
  );

  let inner: React.ReactNode;
  if (style === "three-col") {
    inner = (
      <div style={{ width: "100%", display: "flex", gap: 3, padding: 6, alignItems: "stretch" }}>
        {cardBox("30%")}{cardBox("30%")}{cardBox("30%")}
      </div>
    );
  } else if (style === "two-col") {
    inner = (
      <div style={{ width: "100%", display: "flex", gap: 4, padding: 6, alignItems: "stretch" }}>
        {cardBox("46%")}{cardBox("46%")}
      </div>
    );
  } else if (style === "single-col") {
    inner = (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3, padding: 6 }}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 2, background: c, opacity: co, borderRadius: 3, padding: "6px 4px" }}>
          {[90, 70, 50].map((pw, i) => (
            <div key={i} style={{ height: 2, background: t, borderRadius: 1, width: `${pw}%`, opacity: to2 }} />
          ))}
        </div>
      </div>
    );
  } else {
    // horizontal
    inner = (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3, padding: 6 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", gap: 3, alignItems: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c, opacity: co, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              {[70, 50].map((pw, j) => (
                <div key={j} style={{ height: 2, background: t, borderRadius: 1, width: `${pw}%`, opacity: to2 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={onClick}>
      <div className={box}>{inner}</div>
      <span className={`text-[9px] font-semibold uppercase tracking-wide ${active ? "text-builder-accent" : "text-builder-text-faint"}`}>{label}</span>
    </div>
  );
};

export const FeaturesGridBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as FeaturesGridBlockProps }));

  const set = <K extends keyof FeaturesGridBlockProps>(key: K, val: FeaturesGridBlockProps[K]) =>
    setProp((p: FeaturesGridBlockProps) => { p[key] = val; });

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Layout" defaultOpen>
        <p className="text-[10px] text-builder-text-faint mb-2 uppercase tracking-wider font-semibold">Select layout style</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {([
            { style: "three-col" as const, label: "3 Columns" },
            { style: "two-col" as const, label: "2 Columns" },
            { style: "single-col" as const, label: "1 Column" },
            { style: "horizontal" as const, label: "Horizontal" },
          ]).map((item) => (
            <LayoutThumb
              key={item.style}
              style={item.style}
              label={item.label}
              active={(props.layoutStyle ?? DEFAULTS.layoutStyle) === item.style}
              onClick={() => set("layoutStyle", item.style)}
            />
          ))}
        </div>
      </DesignSection>

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
  layoutStyle = DEFAULTS.layoutStyle,
  nodeId,
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
  const node = (() => {
    try {
      return useNode();
    } catch (e) {
      return null;
    }
  })();

  const id = node?.id || nodeId;
  const connectors = node?.connectors;


  const features = [
    { title: feature1Title, desc: feature1Desc },
    { title: feature2Title, desc: feature2Desc },
    { title: feature3Title, desc: feature3Desc },
  ];

  return (
    <section
      ref={(ref) => {
        if (ref && connectors?.connect && connectors?.drag) {
          connectors.connect(connectors.drag(ref));
        }
      }}

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
        <div style={{
          display: "flex",
          flexWrap: layoutStyle === "horizontal" ? "nowrap" : "wrap",
          flexDirection: layoutStyle === "horizontal" ? "column" : "row",
          gap: 24,
          alignItems: "stretch",
          justifyContent: "center",
          width: "100%",
        }}>
          {features.map((feat, i) => {
            const cardFlex =
              layoutStyle === "two-col" ? "1 1 45%" :
              layoutStyle === "single-col" ? "1 1 100%" :
              layoutStyle === "horizontal" ? "0 0 auto" :
              "1 1 300px";
            const cardMinWidth =
              layoutStyle === "two-col" ? "min(100%, 400px)" :
              layoutStyle === "single-col" ? "100%" :
              "min(100%, 300px)";
            const cardMaxWidth = layoutStyle === "single-col" ? "100%" : undefined;

            if (layoutStyle === "horizontal") {
              return (
                <div
                  key={i}
                  style={{
                    width: "100%",
                    background: cardBg,
                    borderRadius: 12,
                    padding: "24px 28px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    display: "flex",
                    flexDirection: "row",
                    gap: 20,
                    alignItems: "center",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: headingColor,
                    opacity: 0.15,
                    flexShrink: 0,
                  }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: headingColor }}>{feat.title}</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: textColor, lineHeight: 1.6 }}>{feat.desc}</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={i}
                style={{
                  minWidth: cardMinWidth,
                  flex: cardFlex,
                  maxWidth: cardMaxWidth,
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
            );
          })}
        </div>
      </div>
    </section>
  );
};

FeaturesGridBlock.craft = {
  displayName: "Features Grid Block",
  props: { ...DEFAULTS, layoutStyle: "three-col" as FeaturesGridLayoutStyle },
  custom: {},
  related: { settings: FeaturesGridBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
