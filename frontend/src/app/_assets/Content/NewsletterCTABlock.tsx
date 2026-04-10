"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";

export interface NewsletterCTABlockProps {
  heading?: string;
  subheading?: string;
  buttonLabel?: string;
  placeholder?: string;
  disclaimer?: string;
  backgroundColor?: string;
  cardBg?: string;
  headingColor?: string;
  textColor?: string;
  buttonColor?: string;
  inputBg?: string;
}

export const NewsletterCTABlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as NewsletterCTABlockProps }));

  const set = <K extends keyof NewsletterCTABlockProps>(key: K, val: NewsletterCTABlockProps[K]) =>
    setProp((p: NewsletterCTABlockProps) => { p[key] = val; });

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Content" defaultOpen>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Heading</label>
          <input className={inputCls} value={props.heading ?? "Stay in the Loop"} onChange={(e) => set("heading", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subheading</label>
          <input className={inputCls} value={props.subheading ?? "Subscribe to our newsletter and get 15% off your first order plus exclusive access to new arrivals."} onChange={(e) => set("subheading", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Button label</label>
          <input className={inputCls} value={props.buttonLabel ?? "Subscribe"} onChange={(e) => set("buttonLabel", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Placeholder</label>
          <input className={inputCls} value={props.placeholder ?? "Enter your email address"} onChange={(e) => set("placeholder", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Disclaimer</label>
          <input className={inputCls} value={props.disclaimer ?? "No spam, unsubscribe anytime."} onChange={(e) => set("disclaimer", e.target.value)} />
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Background color</label>
            <ColorPicker value={props.backgroundColor ?? "#f8fafc"} onChange={(val) => set("backgroundColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Card background</label>
            <ColorPicker value={props.cardBg ?? "#ffffff"} onChange={(val) => set("cardBg", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Heading color</label>
            <ColorPicker value={props.headingColor ?? "#0f172a"} onChange={(val) => set("headingColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Text color</label>
            <ColorPicker value={props.textColor ?? "#64748b"} onChange={(val) => set("textColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Button color</label>
            <ColorPicker value={props.buttonColor ?? "#0f172a"} onChange={(val) => set("buttonColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Input background</label>
            <ColorPicker value={props.inputBg ?? "#f1f5f9"} onChange={(val) => set("inputBg", val)} className="w-full" />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};

export const NewsletterCTABlock = ({
  heading = "Stay in the Loop",
  subheading = "Subscribe to our newsletter and get 15% off your first order plus exclusive access to new arrivals.",
  buttonLabel = "Subscribe",
  placeholder = "Enter your email address",
  disclaimer = "No spam, unsubscribe anytime.",
  backgroundColor = "#f8fafc",
  cardBg = "#ffffff",
  headingColor = "#0f172a",
  textColor = "#64748b",
  buttonColor = "#0f172a",
  inputBg = "#f1f5f9",
}: NewsletterCTABlockProps) => {
  const { id, connectors: { connect, drag } } = useNode();

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-node-id={id}
      style={{
        width: "100%",
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
          background: cardBg,
          maxWidth: 800,
          width: "100%",
          borderRadius: 20,
          boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)",
          padding: "64px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "clamp(22px, 4vw, 32px)",
            fontWeight: 700,
            color: headingColor,
            textAlign: "center",
          }}
        >
          {heading}
        </p>

        <p
          style={{
            margin: 0,
            fontSize: "clamp(14px, 2vw, 16px)",
            color: textColor,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          {subheading}
        </p>

        <div
          style={{
            background: inputBg,
            borderRadius: 12,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            padding: "6px 6px 6px 20px",
            gap: 8,
            alignItems: "center",
            justifyContent: "space-between",
            width: "min(100%, 520px)",
            boxSizing: "border-box",
          }}
        >
          <span style={{ fontSize: 14, color: textColor, flex: 1, minWidth: 120 }}>
            {placeholder}
          </span>
          <button
            type="button"
            style={{
              background: buttonColor,
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {buttonLabel}
          </button>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: textColor,
            textAlign: "center",
          }}
        >
          {disclaimer}
        </p>
      </div>
    </section>
  );
};

NewsletterCTABlock.craft = {
  displayName: "Newsletter CTA Block",
  props: {
    heading: "Stay in the Loop",
    subheading: "Subscribe to our newsletter and get 15% off your first order plus exclusive access to new arrivals.",
    buttonLabel: "Subscribe",
    placeholder: "Enter your email address",
    disclaimer: "No spam, unsubscribe anytime.",
    backgroundColor: "#f8fafc",
    cardBg: "#ffffff",
    headingColor: "#0f172a",
    textColor: "#64748b",
    buttonColor: "#0f172a",
    inputBg: "#f1f5f9",
  },
  custom: {},
  related: { settings: NewsletterCTABlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
