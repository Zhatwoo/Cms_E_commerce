"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";

export type VideoStyleLayoutStyle = "image-left-1" | "image-left-2" | "image-right" | "close-up";

export interface VideoStyleHeroBlockProps {
  layoutStyle?: VideoStyleLayoutStyle;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  backgroundImage?: string;
  minHeight?: number;
  overlayColor?: string;
}

const LayoutThumb = ({ style, active, onClick, label }: { style: VideoStyleLayoutStyle; active: boolean; onClick: () => void; label: string }) => {
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

export const VideoStyleHeroBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as VideoStyleHeroBlockProps }));
  const set = <K extends keyof VideoStyleHeroBlockProps>(key: K, val: VideoStyleHeroBlockProps[K]) =>
    setProp((p: VideoStyleHeroBlockProps) => { p[key] = val; });

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
          ] as { style: VideoStyleLayoutStyle; label: string }[]).map(({ style, label }) => (
            <LayoutThumb key={style} style={style} label={label} active={(props.layoutStyle ?? "close-up") === style} onClick={() => set("layoutStyle", style)} />
          ))}
        </div>
      </DesignSection>
      <DesignSection title="Content" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Title</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.title ?? "Watch Our Story"} onChange={(e) => set("title", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subtitle</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.subtitle ?? "Experience the craftsmanship behind every product we create."} onChange={(e) => set("subtitle", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Button label</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.buttonLabel ?? "Shop the Collection"} onChange={(e) => set("buttonLabel", e.target.value)} />
        </div>
      </DesignSection>
    </div>
  );
};

export const VideoStyleHeroBlock = ({
  layoutStyle = "close-up",
  title = "Watch Our Story",
  subtitle = "Experience the craftsmanship behind every product we create.",
  buttonLabel = "Shop the Collection",
  backgroundImage = "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=2032&auto=format&fit=crop",
  minHeight = 560,
  overlayColor = "rgba(0,0,0,0.6)",
}: VideoStyleHeroBlockProps) => {
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
        position: "relative",
      }}
    >
      <div
        style={{
          width: "min(100%, 1200px)",
          display: "flex",
          flexDirection: isCloseUp ? "column" : imageOnRight ? "row-reverse" : "row",
          gap: 40,
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
          boxSizing: "border-box",
        }}
      >
        {/* Play button / video placeholder */}
        <div
          style={{
            flex: isCloseUp ? "none" : "0 0 45%",
            width: isCloseUp ? "min(100%, 640px)" : undefined,
            height: isCloseUp ? 340 : 380,
            minHeight: 280,
            borderRadius: 16,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            position: "relative",
          }}
        >
          {/* Play icon */}
          <div style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            border: "2px solid rgba(255,255,255,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M8 5.14v14.72a1 1 0 001.5.86l11.24-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" fill="#ffffff" />
            </svg>
          </div>
        </div>

        {/* Text content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: isCloseUp ? "center" : "flex-start",
            justifyContent: "center",
            textAlign: isCloseUp ? "center" : "left",
            gap: 16,
            padding: "16px 0",
          }}
        >
          <p style={{
            margin: 0,
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.1,
            letterSpacing: -0.5,
          }}>
            {title}
          </p>
          <p style={{
            margin: 0,
            fontSize: "clamp(14px, 2vw, 18px)",
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.7,
            maxWidth: 460,
          }}>
            {subtitle}
          </p>
          <button type="button" style={{
            marginTop: 8,
            background: "#ffffff",
            color: "#0f172a",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            padding: "14px 36px",
            borderRadius: 50,
            letterSpacing: 0.3,
          }}>
            {buttonLabel}
          </button>
        </div>
      </div>
    </section>
  );
};

VideoStyleHeroBlock.craft = {
  displayName: "Video Style Hero Block",
  props: {
    layoutStyle: "close-up",
    title: "Watch Our Story",
    subtitle: "Experience the craftsmanship behind every product we create.",
    buttonLabel: "Shop the Collection",
    backgroundImage: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=2032&auto=format&fit=crop",
    minHeight: 560,
    overlayColor: "rgba(0,0,0,0.6)",
  },
  custom: {},
  related: { settings: VideoStyleHeroBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
