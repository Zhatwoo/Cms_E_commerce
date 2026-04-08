"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";

export type HeroWithImageLayoutStyle = "image-left-1" | "image-left-2" | "image-right" | "close-up";

export interface HeroWithImageBlockProps {
  layoutStyle?: HeroWithImageLayoutStyle;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  backgroundImage?: string;
  minHeight?: number;
  overlayColor?: string;
}

const LayoutThumb = ({ style, active, onClick, label }: { style: HeroWithImageLayoutStyle; active: boolean; onClick: () => void; label: string }) => {
  const box = `w-full aspect-[4/3] rounded-lg border-2 overflow-hidden flex transition-all ${
    active
      ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10"
      : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] hover:border-[var(--builder-border-mid)]"
  }`;

  const imgBlock = (w: string, h = "100%") => (
    <div style={{ width: w, height: h, background: active ? "var(--builder-accent)" : "#94a3b8", opacity: active ? 0.7 : 0.5, flexShrink: 0 }} />
  );

  const textBlock = (
    <div style={{ flex: 1, padding: "6px 4px", display: "flex", flexDirection: "column", gap: 3 }}>
      {[70, 90, 55, 80].map((w, i) => (
        <div key={i} style={{ height: 3, background: active ? "var(--builder-accent)" : "#cbd5e1", borderRadius: 2, width: `${w}%`, opacity: active ? 0.8 : 0.6 }} />
      ))}
    </div>
  );

  let inner: React.ReactNode;
  if (style === "image-left-1" || style === "image-left-2") {
    inner = <>{imgBlock("45%")}{textBlock}</>;
  } else if (style === "image-right") {
    inner = <>{textBlock}{imgBlock("45%")}</>;
  } else {
    inner = (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, background: active ? "var(--builder-accent)" : "#94a3b8", opacity: active ? 0.7 : 0.5 }} />
        <div style={{ padding: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          {[70, 50].map((w, i) => (
            <div key={i} style={{ height: 3, background: active ? "var(--builder-accent)" : "#cbd5e1", borderRadius: 2, width: `${w}%`, opacity: 0.7 }} />
          ))}
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

export const HeroWithImageBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as HeroWithImageBlockProps }));

  const set = <K extends keyof HeroWithImageBlockProps>(key: K, val: HeroWithImageBlockProps[K]) =>
    setProp((p: HeroWithImageBlockProps) => {
      p[key] = val;
    });

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Layout" defaultOpen>
        <p className="text-[10px] text-builder-text-faint mb-2 uppercase tracking-wider font-semibold">Select layout style</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {([
            { style: "image-left-1", label: "Image left 1" },
            { style: "image-left-2", label: "Image left 2" },
            { style: "image-right", label: "Image right" },
            { style: "close-up", label: "Close-up" },
          ] as { style: HeroWithImageLayoutStyle; label: string }[]).map(({ style, label }) => (
            <LayoutThumb key={style} style={style} label={label} active={(props.layoutStyle ?? "image-left-1") === style} onClick={() => set("layoutStyle", style)} />
          ))}
        </div>
      </DesignSection>

      <DesignSection title="Content" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Title</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.title ?? "Welcome to Our Website"} onChange={(e) => set("title", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subtitle</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.subtitle ?? "We're here to help you discover what you need. Browse our offerings and get in touch."} onChange={(e) => set("subtitle", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Button label</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.buttonLabel ?? "Learn More"} onChange={(e) => set("buttonLabel", e.target.value)} />
        </div>
      </DesignSection>
    </div>
  );
};

export const HeroWithImageBlock = ({
  layoutStyle = "image-left-1",
  title = "Welcome to Our Website",
  subtitle = "We're here to help you discover what you need. Browse our offerings and get in touch.",
  buttonLabel = "Learn More",
  backgroundImage = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop",
  minHeight = 620,
  overlayColor = "rgba(255,255,255,0.88)",
}: HeroWithImageBlockProps) => {
  const { id, connectors: { connect, drag } } = useNode();

  const isCloseUp = layoutStyle === "close-up";
  const imageOnRight = layoutStyle === "image-right";

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
        backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "12px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "min(100%, 1280px)",
          display: "flex",
          flexDirection: isCloseUp ? "column" : imageOnRight ? "row-reverse" : "row",
          gap: 48,
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          padding: "48px 24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: isCloseUp ? 280 : 360,
            maxWidth: 560,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 40, fontWeight: 700, color: "#1e293b", lineHeight: 1.15 }}>{title}</p>
          <p style={{ margin: 0, fontSize: 16, color: "#64748b", lineHeight: 1.6 }}>{subtitle}</p>
          <button type="button" style={{ background: "#10b981", color: "#ffffff", border: "none", fontSize: 14, fontWeight: 600, padding: "13px 32px", borderRadius: 6, minWidth: 160 }}>{buttonLabel}</button>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: isCloseUp ? 280 : 360,
            maxWidth: 560,
            width: "100%",
            height: isCloseUp ? 260 : 400,
            borderRadius: 12,
            background: "rgba(148,163,184,0.45)",
            border: "1px solid rgba(100,116,139,0.25)",
          }}
        />
      </div>
    </section>
  );
};

HeroWithImageBlock.craft = {
  displayName: "Hero With Image Block",
  props: {
    layoutStyle: "image-left-1",
    title: "Welcome to Our Website",
    subtitle: "We're here to help you discover what you need. Browse our offerings and get in touch.",
    buttonLabel: "Learn More",
    backgroundImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop",
    minHeight: 620,
    overlayColor: "rgba(255,255,255,0.88)",
  },
  custom: {},
  related: { settings: HeroWithImageBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
