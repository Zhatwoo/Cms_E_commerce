"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";

export type HeroLayoutStyle = "image-left-1" | "image-left-2" | "image-right" | "close-up";

export interface HeroBannerCTA_v2BlockProps {
  layoutStyle?: HeroLayoutStyle;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  backgroundImage?: string;
  minHeight?: number;
  overlayColor?: string;
}

const LayoutThumb = ({
  style,
  active,
  onClick,
  label,
}: {
  style: HeroLayoutStyle;
  active: boolean;
  onClick: () => void;
  label: string;
}) => {
  const base = "flex flex-col items-center gap-1 cursor-pointer group";
  const box = `w-full aspect-[4/3] rounded-lg border-2 overflow-hidden flex transition-all ${
    active
      ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10"
      : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] hover:border-[var(--builder-border-mid)]"
  }`;

  const imgBlock = (w: string, h = "100%") => (
    <div
      style={{
        width: w,
        height: h,
        background: active ? "var(--builder-accent)" : "#94a3b8",
        opacity: active ? 0.7 : 0.5,
        flexShrink: 0,
      }}
    />
  );

  const textBlock = (
    <div style={{ flex: 1, padding: "6px 4px", display: "flex", flexDirection: "column", gap: 3 }}>
      {[70, 90, 55, 80].map((w, i) => (
        <div
          key={i}
          style={{
            height: 3,
            background: active ? "var(--builder-accent)" : "#cbd5e1",
            borderRadius: 2,
            width: `${w}%`,
            opacity: active ? 0.8 : 0.6,
          }}
        />
      ))}
    </div>
  );

  let inner: React.ReactNode;
  if (style === "image-left-1" || style === "image-left-2") {
    inner = (
      <>
        {imgBlock("45%")}
        {textBlock}
      </>
    );
  } else if (style === "image-right") {
    inner = (
      <>
        {textBlock}
        {imgBlock("45%")}
      </>
    );
  } else {
    inner = (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            background: active ? "var(--builder-accent)" : "#94a3b8",
            opacity: active ? 0.7 : 0.5,
          }}
        />
        <div style={{ padding: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          {[70, 50].map((w, i) => (
            <div
              key={i}
              style={{
                height: 3,
                background: active ? "var(--builder-accent)" : "#cbd5e1",
                borderRadius: 2,
                width: `${w}%`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={base} onClick={onClick}>
      <div className={box}>{inner}</div>
      <span
        className={`text-[9px] font-semibold uppercase tracking-wide ${
          active ? "text-builder-accent" : "text-builder-text-faint"
        }`}
      >
        {label}
      </span>
    </div>
  );
};

export const HeroBannerCTA_v2BlockSettings = () => {
  const {
    props,
    actions: { setProp },
  } = useNode((node) => ({ props: node.data.props as HeroBannerCTA_v2BlockProps }));

  const set = <K extends keyof HeroBannerCTA_v2BlockProps>(key: K, val: HeroBannerCTA_v2BlockProps[K]) =>
    setProp((p: HeroBannerCTA_v2BlockProps) => {
      p[key] = val;
    });

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Layout" defaultOpen>
        <p className="text-[10px] text-builder-text-faint mb-2 uppercase tracking-wider font-semibold">
          Select layout style
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {([
            { style: "image-left-1", label: "Image left 1" },
            { style: "image-left-2", label: "Image left 2" },
            { style: "image-right", label: "Image right" },
            { style: "close-up", label: "Close-up" },
          ] as { style: HeroLayoutStyle; label: string }[]).map(({ style, label }) => (
            <LayoutThumb
              key={style}
              style={style}
              label={label}
              active={(props.layoutStyle ?? "image-left-1") === style}
              onClick={() => set("layoutStyle", style)}
            />
          ))}
        </div>
      </DesignSection>

      <DesignSection title="Content" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Title</label>
          <input
            className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent"
            value={props.title ?? "Lorem Ipsum Generator"}
            onChange={(e) => set("title", e.target.value)}
          />

          <label className="text-[11px] text-builder-text-muted">Subtitle</label>
          <input
            className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent"
            value={props.subtitle ?? "Paragraphs Sentences Words Copy"}
            onChange={(e) => set("subtitle", e.target.value)}
          />

          <label className="text-[11px] text-builder-text-muted">Button label</label>
          <input
            className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent"
            value={props.buttonLabel ?? "BUY NOW"}
            onChange={(e) => set("buttonLabel", e.target.value)}
          />
        </div>
      </DesignSection>
    </div>
  );
};

export const HeroBannerCTA_v2Block = ({
  layoutStyle = "image-left-1",
  title = "Lorem Ipsum Generator",
  subtitle = "Paragraphs Sentences Words Copy",
  buttonLabel = "BUY NOW",
  backgroundImage =
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2099&auto=format&fit=crop",
  minHeight = 500,
  overlayColor = "rgba(255,255,255,0.2)",
}: HeroBannerCTA_v2BlockProps) => {
  const {
    id,
    connectors: { connect, drag },
  } = useNode();

  const isCloseUp = layoutStyle === "close-up";
  const imageOnRight = layoutStyle === "image-right";

  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-node-id={id}
      style={{
        width: "100%",
        minHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          width: "min(100%, 1280px)",
          minHeight,
          padding: "clamp(40px, 6vw, 80px) clamp(16px, 4vw, 48px)",
          display: "flex",
          flexDirection: isCloseUp ? "column" : imageOnRight ? "row-reverse" : "row",
          alignItems: "stretch",
          justifyContent: "center",
          gap: 24,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            flex: isCloseUp ? "0 0 260px" : "0 0 45%",
            minHeight: isCloseUp ? 260 : 340,
            background: "rgba(2,6,23,0.12)",
            border: "1px solid rgba(255,255,255,0.35)",
            backdropFilter: "blur(1px)",
          }}
        />

        <div
          style={{
            flex: 1,
            minHeight: isCloseUp ? "auto" : 340,
            display: "flex",
            flexDirection: "column",
            alignItems: isCloseUp ? "center" : "flex-start",
            justifyContent: "center",
            textAlign: isCloseUp ? "center" : "left",
            gap: 14,
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.35)",
            padding: "28px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "clamp(18px, 3vw, 28px)",
              fontWeight: 500,
              fontFamily: "Georgia, serif",
              color: "#000000",
            }}
          >
            {title}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(24px, 5vw, 42px)",
              fontWeight: 700,
              lineHeight: 1.1,
              fontFamily: "Georgia, serif",
              color: "#000000",
            }}
          >
            {subtitle}
          </p>
          <button
            type="button"
            style={{
              marginTop: 10,
              border: "none",
              background: "#000000",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              padding: "16px 40px",
              cursor: "pointer",
            }}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </section>
  );
};

HeroBannerCTA_v2Block.craft = {
  displayName: "Hero Banner CTA v2 Block",
  props: {
    layoutStyle: "image-left-1",
    title: "Lorem Ipsum Generator",
    subtitle: "Paragraphs Sentences Words Copy",
    buttonLabel: "BUY NOW",
    backgroundImage:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2099&auto=format&fit=crop",
    minHeight: 500,
    overlayColor: "rgba(255,255,255,0.2)",
  },
  custom: {},
  related: { settings: HeroBannerCTA_v2BlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
