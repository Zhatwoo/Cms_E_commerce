"use client";

import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../design/_components/rightPanel/settings/inputs/NumericInput";
import { useDesignProject } from "../../design/_context/DesignProjectContext";
import { addFileToMediaLibrary } from "../../design/_lib/mediaActions";

export type MinimalTypeLayoutStyle = "image-left-1" | "image-left-2" | "image-right" | "close-up";

export interface MinimalTypeHeroBlockProps {
  layoutStyle?: MinimalTypeLayoutStyle;
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  backgroundImage?: string;
  imageOpacity?: number;
  minHeight?: number;
  overlayColor?: string;
  buttonColor?: string;
  titleColor?: string;
  subtitleColor?: string;
}

const LayoutThumb = ({ style, active, onClick, label }: { style: MinimalTypeLayoutStyle; active: boolean; onClick: () => void; label: string }) => {
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

export const MinimalTypeHeroBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as MinimalTypeHeroBlockProps }));
  const set = <K extends keyof MinimalTypeHeroBlockProps>(key: K, val: MinimalTypeHeroBlockProps[K]) =>
    setProp((p: MinimalTypeHeroBlockProps) => { p[key] = val; });
  const { projectId } = useDesignProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setUploading(true);
    try {
      const res = await addFileToMediaLibrary(projectId, file);
      if (res?.url) set("backgroundImage", res.url);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
          ] as { style: MinimalTypeLayoutStyle; label: string }[]).map(({ style, label }) => (
            <LayoutThumb key={style} style={style} label={label} active={(props.layoutStyle ?? "close-up") === style} onClick={() => set("layoutStyle", style)} />
          ))}
        </div>
      </DesignSection>
      <DesignSection title="Content" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Title</label>
          <input className={inputCls} value={props.title ?? "Elevate Your Style"} onChange={(e) => set("title", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subtitle</label>
          <input className={inputCls} value={props.subtitle ?? "Premium quality products crafted for those who appreciate the finer things in life."} onChange={(e) => set("subtitle", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Primary button</label>
          <input className={inputCls} value={props.primaryLabel ?? "Explore Collection"} onChange={(e) => set("primaryLabel", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Secondary button</label>
          <input className={inputCls} value={props.secondaryLabel ?? "Our Story"} onChange={(e) => set("secondaryLabel", e.target.value)} />
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
            <label className="text-[10px] text-builder-text-muted">Image opacity (%)</label>
            <NumericInput value={props.imageOpacity != null ? (props.imageOpacity <= 1 ? props.imageOpacity * 100 : props.imageOpacity) : 85} onChange={(val) => set("imageOpacity", val)} min={0} max={100} step={1} unit="%" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Overlay color</label>
            <ColorPicker value={props.overlayColor ?? "rgba(255,255,255,0.95)"} onChange={(val) => set("overlayColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Min height</label>
            <NumericInput value={props.minHeight ?? 580} onChange={(val) => set("minHeight", val)} min={200} max={1200} step={10} unit="px" />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Title color</label>
            <ColorPicker value={props.titleColor ?? "#0f172a"} onChange={(val) => set("titleColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Subtitle color</label>
            <ColorPicker value={props.subtitleColor ?? "#64748b"} onChange={(val) => set("subtitleColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Button color</label>
            <ColorPicker value={props.buttonColor ?? "#0f172a"} onChange={(val) => set("buttonColor", val)} className="w-full" />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};

export const MinimalTypeHeroBlock = ({
  nodeId,
  layoutStyle = "close-up",
  title = "Elevate Your Style",
  subtitle = "Premium quality products crafted for those who appreciate the finer things in life.",
  primaryLabel = "Explore Collection",
  secondaryLabel = "Our Story",
  backgroundImage = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
  imageOpacity = 0.85,
  minHeight = 580,
  overlayColor = "rgba(255,255,255,0.95)",
  buttonColor = "#0f172a",
  titleColor = "#0f172a",
  subtitleColor = "#64748b",
}: MinimalTypeHeroBlockProps) => {
  const node = (() => {
    try {
      return useNode();
    } catch (e) {
      return null;
    }
  })();

  const id = node?.id || nodeId;
  const connectors = node?.connectors;

  const getImageOpacity = (value: number) => Math.min(1, Math.max(0, value > 1 ? value / 100 : value));


  const isCloseUp = layoutStyle === "close-up";
  const imageOnRight = layoutStyle === "image-right";

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
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: overlayColor,
        padding: "12px",
        boxSizing: "border-box",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: getImageOpacity(imageOpacity),
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(100%, 1000px)",
          display: "flex",
          flexDirection: isCloseUp ? "column" : imageOnRight ? "row-reverse" : "row",
          gap: 40,
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        {!isCloseUp && (
          <div
            style={{
              flex: "0 0 42%",
              minHeight: 340,
              borderRadius: 16,
              background: "rgba(148,163,184,0.12)",
              border: "1px solid rgba(148,163,184,0.15)",
            }}
          />
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <p style={{
            margin: 0,
            fontSize: "clamp(32px, 6vw, 56px)",
            fontWeight: 300,
            color: titleColor,
            lineHeight: 1.1,
            letterSpacing: -1,
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}>
            {title}
          </p>
          <div style={{ width: 40, height: 1, background: "#0f172a", margin: "4px 0" }} />
          <p style={{
            margin: 0,
            fontSize: 16,
            color: subtitleColor,
            lineHeight: 1.8,
            maxWidth: 500,
          }}>
            {subtitle}
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
            <button type="button" style={{
              background: buttonColor,
              color: "#ffffff",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              padding: "14px 36px",
              borderRadius: 0,
              letterSpacing: 2,
              textTransform: "uppercase" as const,
            }}>
              {primaryLabel}
            </button>
            <button type="button" style={{
              background: "transparent",
              color: buttonColor,
              border: `1px solid ${buttonColor}`,
              fontSize: 13,
              fontWeight: 500,
              padding: "14px 36px",
              borderRadius: 0,
              letterSpacing: 2,
              textTransform: "uppercase" as const,
            }}>
              {secondaryLabel}
            </button>
          </div>
        </div>

        {isCloseUp && (
          <div
            style={{
              width: "100%",
              maxWidth: 800,
              height: 320,
              borderRadius: 16,
              background: "rgba(148,163,184,0.12)",
              border: "1px solid rgba(148,163,184,0.15)",
            }}
          />
        )}
      </div>
    </section>
  );
};

MinimalTypeHeroBlock.craft = {
  displayName: "Minimal Type Hero Block",
  props: {
    layoutStyle: "close-up",
    title: "Elevate Your Style",
    subtitle: "Premium quality products crafted for those who appreciate the finer things in life.",
    primaryLabel: "Explore Collection",
    secondaryLabel: "Our Story",
    backgroundImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
    imageOpacity: 0.85,
    minHeight: 580,
    overlayColor: "rgba(255,255,255,0.95)",
    buttonColor: "#0f172a",
    titleColor: "#0f172a",
    subtitleColor: "#64748b",
  },
  custom: {},
  related: { settings: MinimalTypeHeroBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
