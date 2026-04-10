"use client";

import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../design/_components/rightPanel/settings/inputs/NumericInput";
import { useDesignProject } from "../../design/_context/DesignProjectContext";
import { addFileToMediaLibrary } from "../../design/_lib/mediaActions";

export type SplitScreenLayoutStyle = "image-left-1" | "image-left-2" | "image-right" | "close-up";

export interface SplitScreenHeroBlockProps {
  layoutStyle?: SplitScreenLayoutStyle;
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  backgroundImage?: string;
  minHeight?: number;
  overlayColor?: string;
  accentColor?: string;
  buttonColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  panelBg?: string;
}

const LayoutThumb = ({ style, active, onClick, label }: { style: SplitScreenLayoutStyle; active: boolean; onClick: () => void; label: string }) => {
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

export const SplitScreenHeroBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as SplitScreenHeroBlockProps }));
  const { projectId } = useDesignProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof SplitScreenHeroBlockProps>(key: K, val: SplitScreenHeroBlockProps[K]) =>
    setProp((p: SplitScreenHeroBlockProps) => { p[key] = val; });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setUploading(true);
    try {
      const item = await addFileToMediaLibrary(projectId, file);
      set("backgroundImage", item.url);
    } catch { /* upload failed */ }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

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
          ] as { style: SplitScreenLayoutStyle; label: string }[]).map(({ style, label }) => (
            <LayoutThumb key={style} style={style} label={label} active={(props.layoutStyle ?? "image-left-1") === style} onClick={() => set("layoutStyle", style)} />
          ))}
        </div>
      </DesignSection>
      <DesignSection title="Content" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Title</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.title ?? "New Season Collection"} onChange={(e) => set("title", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subtitle</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.subtitle ?? "Discover the latest trends in fashion and lifestyle. Curated pieces for the modern shopper."} onChange={(e) => set("subtitle", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Primary button</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.primaryLabel ?? "Shop Now"} onChange={(e) => set("primaryLabel", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Secondary button</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.secondaryLabel ?? "View Lookbook"} onChange={(e) => set("secondaryLabel", e.target.value)} />
        </div>
      </DesignSection>

      <DesignSection title="Background" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Background image</label>
            <div className="flex gap-1.5">
              <input className={inputCls + " flex-1 min-w-0"} value={props.backgroundImage ?? ""} onChange={(e) => set("backgroundImage", e.target.value)} placeholder="https://..." />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-8 px-2.5 rounded text-[10px] font-semibold bg-builder-surface-3 border border-(--builder-border) text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-2 transition-colors shrink-0 disabled:opacity-50" title="Upload image">
                {uploading ? "..." : "Upload"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Overlay color</label>
            <ColorPicker value={props.overlayColor ?? "rgba(0,0,0,0.35)"} onChange={(val) => set("overlayColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Min height</label>
            <NumericInput value={props.minHeight ?? 600} onChange={(val) => set("minHeight", val)} min={200} max={1200} step={10} unit="px" />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Accent color</label>
            <ColorPicker value={props.accentColor ?? "#6366f1"} onChange={(val) => set("accentColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Title color</label>
            <ColorPicker value={props.titleColor ?? "#f8fafc"} onChange={(val) => set("titleColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Subtitle color</label>
            <ColorPicker value={props.subtitleColor ?? "#94a3b8"} onChange={(val) => set("subtitleColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Button color</label>
            <ColorPicker value={props.buttonColor ?? "#6366f1"} onChange={(val) => set("buttonColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Panel background</label>
            <ColorPicker value={props.panelBg ?? "#0f172a"} onChange={(val) => set("panelBg", val)} className="w-full" />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};

export const SplitScreenHeroBlock = ({
  layoutStyle = "image-left-1",
  title = "New Season Collection",
  subtitle = "Discover the latest trends in fashion and lifestyle. Curated pieces for the modern shopper.",
  primaryLabel = "Shop Now",
  secondaryLabel = "View Lookbook",
  backgroundImage = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
  minHeight = 600,
  overlayColor = "rgba(0,0,0,0.35)",
  accentColor = "#6366f1",
  buttonColor = "#6366f1",
  titleColor = "#f8fafc",
  subtitleColor = "#94a3b8",
  panelBg = "#0f172a",
}: SplitScreenHeroBlockProps) => {
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
        flexDirection: isCloseUp ? "column" : imageOnRight ? "row-reverse" : "row",
        flexWrap: "wrap" as const,
        boxSizing: "border-box" as const,
      }}
    >
      {/* Image half */}
      <div
        style={{
          flex: isCloseUp ? "none" : "1 1 50%",
          minWidth: "min(100%, 320px)",
          minHeight: isCloseUp ? 280 : minHeight,
          backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 4,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }} />
      </div>

      {/* Content half */}
      <div
        style={{
          flex: isCloseUp ? "none" : "1 1 50%",
          minWidth: "min(100%, 320px)",
          minHeight: isCloseUp ? "auto" : minHeight,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "clamp(32px, 5vw, 64px) clamp(20px, 4vw, 48px)",
          boxSizing: "border-box",
          background: panelBg,
        }}
      >
        <div style={{
          width: 48,
          height: 4,
          background: accentColor,
          borderRadius: 2,
          marginBottom: 24,
        }} />
        <p style={{ margin: 0, fontSize: "clamp(11px, 1.5vw, 14px)", fontWeight: 600, letterSpacing: 3, color: accentColor, textTransform: "uppercase" as const, marginBottom: 12 }}>
          New Arrival
        </p>
        <p style={{ margin: 0, fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, color: titleColor, lineHeight: 1.1, marginBottom: 16 }}>
          {title}
        </p>
        <p style={{ margin: 0, fontSize: "clamp(14px, 2vw, 16px)", color: subtitleColor, lineHeight: 1.7, maxWidth: 480, marginBottom: 32 }}>
          {subtitle}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" style={{
            background: buttonColor,
            color: "#ffffff",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            padding: "14px 32px",
            borderRadius: 8,
            letterSpacing: 0.5,
          }}>
            {primaryLabel}
          </button>
          <button type="button" style={{
            background: "transparent",
            color: "#f8fafc",
            border: "1px solid rgba(248,250,252,0.2)",
            fontSize: 14,
            fontWeight: 600,
            padding: "14px 32px",
            borderRadius: 8,
            letterSpacing: 0.5,
          }}>
            {secondaryLabel}
          </button>
        </div>
      </div>
    </section>
  );
};

SplitScreenHeroBlock.craft = {
  displayName: "Split Screen Hero Block",
  props: {
    layoutStyle: "image-left-1",
    title: "New Season Collection",
    subtitle: "Discover the latest trends in fashion and lifestyle. Curated pieces for the modern shopper.",
    primaryLabel: "Shop Now",
    secondaryLabel: "View Lookbook",
    backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
    minHeight: 600,
    overlayColor: "rgba(0,0,0,0.35)",
    accentColor: "#6366f1",
    buttonColor: "#6366f1",
    titleColor: "#f8fafc",
    subtitleColor: "#94a3b8",
    panelBg: "#0f172a",
  },
  custom: {},
  related: { settings: SplitScreenHeroBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
