"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../design/_components/rightPanel/settings/inputs/NumericInput";

export interface CTABannerBlockProps {
  heading?: string;
  subheading?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  gradientFrom?: string;
  gradientTo?: string;
  headingColor?: string;
  textColor?: string;
  primaryButtonColor?: string;
  primaryButtonTextColor?: string;
  minHeight?: number;
}

export const CTABannerBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as CTABannerBlockProps }));

  const set = <K extends keyof CTABannerBlockProps>(key: K, val: CTABannerBlockProps[K]) =>
    setProp((p: CTABannerBlockProps) => { p[key] = val; });

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Content" defaultOpen>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Heading</label>
          <input className={inputCls} value={props.heading ?? "Ready to Transform Your Shopping Experience?"} onChange={(e) => set("heading", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subheading</label>
          <input className={inputCls} value={props.subheading ?? "Join thousands of satisfied customers and discover products you'll love. Free shipping on orders over $50."} onChange={(e) => set("subheading", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Primary button</label>
          <input className={inputCls} value={props.primaryLabel ?? "Start Shopping"} onChange={(e) => set("primaryLabel", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Secondary button</label>
          <input className={inputCls} value={props.secondaryLabel ?? "Learn More"} onChange={(e) => set("secondaryLabel", e.target.value)} />
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Gradient from</label>
            <ColorPicker value={props.gradientFrom ?? "#6366f1"} onChange={(val) => set("gradientFrom", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Gradient to</label>
            <ColorPicker value={props.gradientTo ?? "#a855f7"} onChange={(val) => set("gradientTo", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Heading color</label>
            <ColorPicker value={props.headingColor ?? "#ffffff"} onChange={(val) => set("headingColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Text color</label>
            <ColorPicker value={props.textColor ?? "rgba(255,255,255,0.8)"} onChange={(val) => set("textColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Primary button color</label>
            <ColorPicker value={props.primaryButtonColor ?? "#ffffff"} onChange={(val) => set("primaryButtonColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Primary button text</label>
            <ColorPicker value={props.primaryButtonTextColor ?? "#6366f1"} onChange={(val) => set("primaryButtonTextColor", val)} className="w-full" />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Size" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Min height</label>
            <NumericInput value={props.minHeight ?? 300} onChange={(val) => set("minHeight", val)} min={100} max={800} step={10} unit="px" />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};

export const CTABannerBlock = ({
  heading = "Ready to Transform Your Shopping Experience?",
  subheading = "Join thousands of satisfied customers and discover products you'll love. Free shipping on orders over $50.",
  primaryLabel = "Start Shopping",
  secondaryLabel = "Learn More",
  gradientFrom = "#6366f1",
  gradientTo = "#a855f7",
  headingColor = "#ffffff",
  textColor = "rgba(255,255,255,0.8)",
  primaryButtonColor = "#ffffff",
  primaryButtonTextColor = "#6366f1",
  minHeight = 300,
}: CTABannerBlockProps) => {
  const { id, connectors: { connect, drag } } = useNode();

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
        background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          width: "100%",
          padding: "72px 40px",
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 32,
          justifyContent: "space-between",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ margin: 0, fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, color: headingColor, lineHeight: 1.2 }}>{heading}</p>
          <p style={{ margin: 0, fontSize: "clamp(14px, 2vw, 16px)", color: textColor, lineHeight: 1.6 }}>{subheading}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            style={{
              background: primaryButtonColor,
              color: primaryButtonTextColor,
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              padding: "14px 32px",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#ffffff",
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              padding: "14px 32px",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </section>
  );
};

CTABannerBlock.craft = {
  displayName: "CTA Banner Block",
  props: {
    heading: "Ready to Transform Your Shopping Experience?",
    subheading: "Join thousands of satisfied customers and discover products you'll love. Free shipping on orders over $50.",
    primaryLabel: "Start Shopping",
    secondaryLabel: "Learn More",
    gradientFrom: "#6366f1",
    gradientTo: "#a855f7",
    headingColor: "#ffffff",
    textColor: "rgba(255,255,255,0.8)",
    primaryButtonColor: "#ffffff",
    primaryButtonTextColor: "#6366f1",
    minHeight: 300,
  },
  custom: {},
  related: { settings: CTABannerBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
