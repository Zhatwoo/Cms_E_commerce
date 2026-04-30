"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";

export interface NewsletterCTABlockProps {
  nodeId?: string;
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
  layoutStyle?: "centered" | "left-aligned" | "split" | "minimal";
}

const defaultProps = {
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
  layoutStyle: "centered" as const,
};

const LayoutThumb = ({ style, active, onClick, label }: { style: string; active: boolean; onClick: () => void; label: string }) => {
  const box = `w-full aspect-[4/3] rounded-lg border-2 overflow-hidden flex transition-all ${
    active ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10"
      : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] hover:border-[var(--builder-border-mid)]"
  }`;

  let inner: React.ReactNode = null;

  if (style === "centered") {
    inner = (
      <div className="flex flex-col items-center justify-center gap-1 w-full p-2">
        <div className="w-8 h-1.5 rounded-sm bg-current opacity-50" />
        <div className="w-6 h-1 rounded-sm bg-current opacity-25" />
        <div className="flex gap-0.5 mt-1">
          <div className="w-6 h-2 rounded-sm bg-current opacity-20" />
          <div className="w-3 h-2 rounded-sm bg-current opacity-40" />
        </div>
      </div>
    );
  } else if (style === "left-aligned") {
    inner = (
      <div className="flex flex-col items-start justify-center gap-1 w-full p-2">
        <div className="w-8 h-1.5 rounded-sm bg-current opacity-50" />
        <div className="w-6 h-1 rounded-sm bg-current opacity-25" />
        <div className="flex gap-0.5 mt-1">
          <div className="w-6 h-2 rounded-sm bg-current opacity-20" />
          <div className="w-3 h-2 rounded-sm bg-current opacity-40" />
        </div>
      </div>
    );
  } else if (style === "split") {
    inner = (
      <div className="flex flex-row items-center justify-center gap-2 w-full p-2">
        <div className="flex flex-col gap-1 flex-1">
          <div className="w-full h-1.5 rounded-sm bg-current opacity-50" />
          <div className="w-3/4 h-1 rounded-sm bg-current opacity-25" />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div className="w-full h-2 rounded-sm bg-current opacity-20" />
          <div className="w-2/3 h-2 rounded-sm bg-current opacity-40" />
        </div>
      </div>
    );
  } else if (style === "minimal") {
    inner = (
      <div className="flex flex-row items-center justify-center gap-1 w-full p-2">
        <div className="w-6 h-1.5 rounded-sm bg-current opacity-50" />
        <div className="w-5 h-2 rounded-sm bg-current opacity-20" />
        <div className="w-3 h-2 rounded-sm bg-current opacity-40" />
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

export const NewsletterCTABlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as NewsletterCTABlockProps }));

  const set = <K extends keyof NewsletterCTABlockProps>(key: K, val: NewsletterCTABlockProps[K]) =>
    setProp((p: NewsletterCTABlockProps) => { p[key] = val; });

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  const currentLayout = props.layoutStyle ?? defaultProps.layoutStyle;

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Layout" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          {(["centered", "left-aligned", "split", "minimal"] as const).map((s) => (
            <LayoutThumb
              key={s}
              style={s}
              active={currentLayout === s}
              onClick={() => set("layoutStyle", s)}
              label={s === "left-aligned" ? "Left" : s.charAt(0).toUpperCase() + s.slice(1)}
            />
          ))}
        </div>
      </DesignSection>

      <DesignSection title="Content" defaultOpen>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Heading</label>
          <input className={inputCls} value={props.heading ?? defaultProps.heading} onChange={(e) => set("heading", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subheading</label>
          <input className={inputCls} value={props.subheading ?? defaultProps.subheading} onChange={(e) => set("subheading", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Button label</label>
          <input className={inputCls} value={props.buttonLabel ?? defaultProps.buttonLabel} onChange={(e) => set("buttonLabel", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Placeholder</label>
          <input className={inputCls} value={props.placeholder ?? defaultProps.placeholder} onChange={(e) => set("placeholder", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Disclaimer</label>
          <input className={inputCls} value={props.disclaimer ?? defaultProps.disclaimer} onChange={(e) => set("disclaimer", e.target.value)} />
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Background color</label>
            <ColorPicker value={props.backgroundColor ?? defaultProps.backgroundColor} onChange={(val) => set("backgroundColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Card background</label>
            <ColorPicker value={props.cardBg ?? defaultProps.cardBg} onChange={(val) => set("cardBg", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Heading color</label>
            <ColorPicker value={props.headingColor ?? defaultProps.headingColor} onChange={(val) => set("headingColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Text color</label>
            <ColorPicker value={props.textColor ?? defaultProps.textColor} onChange={(val) => set("textColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Button color</label>
            <ColorPicker value={props.buttonColor ?? defaultProps.buttonColor} onChange={(val) => set("buttonColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Input background</label>
            <ColorPicker value={props.inputBg ?? defaultProps.inputBg} onChange={(val) => set("inputBg", val)} className="w-full" />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};

export const NewsletterCTABlock = ({
  nodeId,
  heading = defaultProps.heading,
  subheading = defaultProps.subheading,
  buttonLabel = defaultProps.buttonLabel,
  placeholder = defaultProps.placeholder,
  disclaimer = defaultProps.disclaimer,
  backgroundColor = defaultProps.backgroundColor,
  cardBg = defaultProps.cardBg,
  headingColor = defaultProps.headingColor,
  textColor = defaultProps.textColor,
  buttonColor = defaultProps.buttonColor,
  inputBg = defaultProps.inputBg,
  layoutStyle = defaultProps.layoutStyle,
}: NewsletterCTABlockProps) => {
  const node = (() => {
    try {
      return useNode();
    } catch (e) {
      return null;
    }
  })();

  const id = node?.id || nodeId;
  const connectors = node?.connectors;


  const inputRow = (
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
        width: layoutStyle === "minimal" ? "auto" : "min(100%, 520px)",
        flex: layoutStyle === "minimal" ? "1 1 auto" : undefined,
        boxSizing: "border-box" as const,
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
  );

  const disclaimerEl = (
    <p style={{ margin: 0, fontSize: 12, color: textColor, textAlign: layoutStyle === "left-aligned" ? "left" : "center" as const }}>
      {disclaimer}
    </p>
  );

  /* ---- MINIMAL layout ---- */
  if (layoutStyle === "minimal") {
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
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: backgroundColor,
          padding: "32px 24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: 800,
            width: "100%",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 16,
          }}
        >
          <p style={{ margin: 0, fontSize: "clamp(16px, 3vw, 20px)", fontWeight: 700, color: headingColor, whiteSpace: "nowrap" }}>
            {heading}
          </p>
          {inputRow}
        </div>
      </section>
    );
  }

  /* ---- SPLIT layout ---- */
  if (layoutStyle === "split") {
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
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 40,
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          {/* Left column: text */}
          <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: 0, fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, color: headingColor }}>
              {heading}
            </p>
            <p style={{ margin: 0, fontSize: "clamp(14px, 2vw, 16px)", color: textColor, lineHeight: 1.6 }}>
              {subheading}
            </p>
          </div>
          {/* Right column: form */}
          <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 12 }}>
            {inputRow}
            {disclaimerEl}
          </div>
        </div>
      </section>
    );
  }

  /* ---- CENTERED / LEFT-ALIGNED layouts ---- */
  const isCentered = layoutStyle === "centered";

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
          alignItems: isCentered ? "center" : "flex-start",
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
            textAlign: isCentered ? "center" : "left",
          }}
        >
          {heading}
        </p>

        <p
          style={{
            margin: 0,
            fontSize: "clamp(14px, 2vw, 16px)",
            color: textColor,
            textAlign: isCentered ? "center" : "left",
            lineHeight: 1.6,
          }}
        >
          {subheading}
        </p>

        {inputRow}
        {disclaimerEl}
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
    layoutStyle: "centered",
  },
  custom: {},
  related: { settings: NewsletterCTABlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
