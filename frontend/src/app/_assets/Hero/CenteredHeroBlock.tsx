"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";

export type CenteredHeroLayoutStyle = "image-left-1" | "image-left-2" | "image-right" | "close-up";

export interface CenteredHeroBlockProps {
  layoutStyle?: CenteredHeroLayoutStyle;
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  backgroundImage?: string;
  minHeight?: number;
  overlayColor?: string;
}

const LayoutThumb = ({ style, active, onClick, label }: { style: CenteredHeroLayoutStyle; active: boolean; onClick: () => void; label: string }) => {
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

export const CenteredHeroBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as CenteredHeroBlockProps }));

  const set = <K extends keyof CenteredHeroBlockProps>(key: K, val: CenteredHeroBlockProps[K]) =>
    setProp((p: CenteredHeroBlockProps) => {
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
          ] as { style: CenteredHeroLayoutStyle; label: string }[]).map(({ style, label }) => (
            <LayoutThumb key={style} style={style} label={label} active={(props.layoutStyle ?? "image-left-1") === style} onClick={() => set("layoutStyle", style)} />
          ))}
        </div>
      </DesignSection>

      <DesignSection title="Content" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Title</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.title ?? "Welcome to Our Platform"} onChange={(e) => set("title", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subtitle</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.subtitle ?? "Build amazing websites with our drag-and-drop editor. No coding required."} onChange={(e) => set("subtitle", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Primary button</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.primaryLabel ?? "Get Started"} onChange={(e) => set("primaryLabel", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Secondary button</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.secondaryLabel ?? "Learn More"} onChange={(e) => set("secondaryLabel", e.target.value)} />
        </div>
      </DesignSection>
    </div>
  );
};

export const CenteredHeroBlock = ({
  layoutStyle = "image-left-1",
  title = "Welcome to Our Platform",
  subtitle = "Build amazing websites with our drag-and-drop editor. No coding required.",
  primaryLabel = "Get Started",
  secondaryLabel = "Learn More",
  backgroundImage = "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2074&auto=format&fit=crop",
  minHeight = 620,
  overlayColor = "rgba(248,250,252,0.82)",
}: CenteredHeroBlockProps) => {
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
          gap: 28,
          alignItems: "stretch",
          justifyContent: "center",
          padding: "48px 24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            flex: isCloseUp ? "0 0 220px" : "0 0 44%",
            minHeight: isCloseUp ? 220 : 360,
            borderRadius: 12,
            background: "rgba(15,23,42,0.16)",
            border: "1px solid rgba(15,23,42,0.14)",
          }}
        />

        <div
          style={{
            flex: 1,
            background: "#ffffff",
            borderRadius: 12,
            padding: "52px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 16,
            boxSizing: "border-box",
            minHeight: isCloseUp ? undefined : 360,
          }}
        >
          <p style={{ margin: 0, fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 700, color: "#1e293b", lineHeight: 1.15 }}>{title}</p>
          <p style={{ margin: 0, fontSize: "clamp(14px, 2vw, 18px)", color: "#64748b", lineHeight: 1.6 }}>{subtitle}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", width: "100%", marginTop: 8 }}>
            <button type="button" style={{ background: "#3b82f6", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, padding: "13px 32px", borderRadius: 6, minWidth: "min(160px, 100%)" }}>{primaryLabel}</button>
            <button type="button" style={{ background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, padding: "13px 32px", borderRadius: 6, minWidth: "min(160px, 100%)" }}>{secondaryLabel}</button>
          </div>
        </div>
      </div>
    </section>
  );
};

CenteredHeroBlock.craft = {
  displayName: "Centered Hero Block",
  props: {
    layoutStyle: "image-left-1",
    title: "Welcome to Our Platform",
    subtitle: "Build amazing websites with our drag-and-drop editor. No coding required.",
    primaryLabel: "Get Started",
    secondaryLabel: "Learn More",
    backgroundImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2074&auto=format&fit=crop",
    minHeight: 620,
    overlayColor: "rgba(248,250,252,0.82)",
  },
  custom: {},
  related: { settings: CenteredHeroBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
