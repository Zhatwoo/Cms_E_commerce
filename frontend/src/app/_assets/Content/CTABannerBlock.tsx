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
  layoutStyle?: "horizontal" | "centered" | "stacked" | "split";
}

const LayoutThumb = ({ style, active, onClick, label }: { style: string; active: boolean; onClick: () => void; label: string }) => {
  const box = `w-full aspect-[4/3] rounded-lg border-2 overflow-hidden flex transition-all ${
    active ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10"
      : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] hover:border-[var(--builder-border-mid)]"
  }`;
  const c = active ? "var(--builder-accent)" : "#94a3b8";
  const t = active ? "var(--builder-accent)" : "#cbd5e1";

  let inner: React.ReactNode = null;

  if (style === "horizontal") {
    inner = (
      <div className="flex flex-row items-center justify-between w-full px-2">
        <div className="flex flex-col gap-[3px]">
          <div style={{ width: 28, height: 3, borderRadius: 1, background: t }} />
          <div style={{ width: 20, height: 2, borderRadius: 1, background: t, opacity: 0.5 }} />
        </div>
        <div className="flex flex-row gap-1">
          <div style={{ width: 12, height: 6, borderRadius: 2, background: c }} />
          <div style={{ width: 12, height: 6, borderRadius: 2, background: c, opacity: 0.4 }} />
        </div>
      </div>
    );
  } else if (style === "centered") {
    inner = (
      <div className="flex flex-col items-center justify-center w-full gap-[4px]">
        <div style={{ width: 28, height: 3, borderRadius: 1, background: t }} />
        <div style={{ width: 20, height: 2, borderRadius: 1, background: t, opacity: 0.5 }} />
        <div className="flex flex-row gap-1 mt-1">
          <div style={{ width: 12, height: 6, borderRadius: 2, background: c }} />
          <div style={{ width: 12, height: 6, borderRadius: 2, background: c, opacity: 0.4 }} />
        </div>
      </div>
    );
  } else if (style === "stacked") {
    inner = (
      <div className="flex flex-col items-center justify-center w-full gap-[4px]">
        <div className="flex flex-col gap-[3px] w-full px-2">
          <div style={{ width: "100%", height: 3, borderRadius: 1, background: t }} />
          <div style={{ width: "70%", height: 2, borderRadius: 1, background: t, opacity: 0.5 }} />
        </div>
        <div className="flex flex-row gap-1 mt-1">
          <div style={{ width: 12, height: 6, borderRadius: 2, background: c }} />
          <div style={{ width: 12, height: 6, borderRadius: 2, background: c, opacity: 0.4 }} />
        </div>
      </div>
    );
  } else if (style === "split") {
    inner = (
      <div className="flex flex-row items-stretch w-full h-full">
        <div className="flex-1 flex flex-col justify-center gap-[3px] px-2">
          <div style={{ width: 24, height: 3, borderRadius: 1, background: t }} />
          <div style={{ width: 16, height: 2, borderRadius: 1, background: t, opacity: 0.5 }} />
        </div>
        <div style={{ width: 1, background: c, opacity: 0.3 }} />
        <div className="flex-1 flex flex-col items-center justify-center gap-1 px-2">
          <div style={{ width: 12, height: 6, borderRadius: 2, background: c }} />
          <div style={{ width: 12, height: 6, borderRadius: 2, background: c, opacity: 0.4 }} />
        </div>
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

export const CTABannerBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as CTABannerBlockProps }));

  const set = <K extends keyof CTABannerBlockProps>(key: K, val: CTABannerBlockProps[K]) =>
    setProp((p: CTABannerBlockProps) => { p[key] = val; });

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Layout" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          {(["horizontal", "centered", "stacked", "split"] as const).map((s) => (
            <LayoutThumb
              key={s}
              style={s}
              label={s}
              active={(props.layoutStyle ?? "horizontal") === s}
              onClick={() => set("layoutStyle", s)}
            />
          ))}
        </div>
      </DesignSection>

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
  nodeId,
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
  layoutStyle = "horizontal",
}: CTABannerBlockProps) => {
  const node = (() => {
    try {
      return useNode();
    } catch (e) {
      return null;
    }
  })();

  const id = node?.id || nodeId;
  const connectors = node?.connectors;


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
          flexDirection: layoutStyle === "horizontal" || layoutStyle === "split" ? "row" : "column",
          flexWrap: "wrap",
          gap: 32,
          justifyContent: layoutStyle === "horizontal" ? "space-between" : "center",
          alignItems: layoutStyle === "centered" || layoutStyle === "stacked" ? "center" : layoutStyle === "split" ? "stretch" : "center",
          boxSizing: "border-box",
          textAlign: layoutStyle === "centered" ? "center" : undefined,
        }}
      >
        {layoutStyle === "split" ? (
          <>
            <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
              <p style={{ margin: 0, fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, color: headingColor, lineHeight: 1.2 }}>{heading}</p>
              <p style={{ margin: 0, fontSize: "clamp(14px, 2vw, 16px)", color: textColor, lineHeight: 1.6 }}>{subheading}</p>
            </div>
            <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center" }}>
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
          </>
        ) : (
          <>
            <div style={{
              maxWidth: layoutStyle === "horizontal" ? 560 : undefined,
              width: layoutStyle === "stacked" ? "100%" : undefined,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: layoutStyle === "centered" ? "center" : undefined,
            }}>
              <p style={{ margin: 0, fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, color: headingColor, lineHeight: 1.2 }}>{heading}</p>
              <p style={{ margin: 0, fontSize: "clamp(14px, 2vw, 16px)", color: textColor, lineHeight: 1.6 }}>{subheading}</p>
            </div>

            <div style={{
              display: "flex",
              flexDirection: "row",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: layoutStyle === "centered" || layoutStyle === "stacked" ? "center" : undefined,
            }}>
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
          </>
        )}
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
    layoutStyle: "horizontal",
  },
  custom: {},
  related: { settings: CTABannerBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
