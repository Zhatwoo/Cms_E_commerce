"use client";

import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../design/_components/rightPanel/settings/inputs/NumericInput";
import { useDesignProject } from "../../design/_context/DesignProjectContext";
import { addFileToMediaLibrary } from "../../design/_lib/mediaActions";

export type CollectionLayoutStyle = "image-left-1" | "image-left-2" | "image-right" | "close-up";

export interface CollectionHeroBlockProps {
  nodeId?: string;
  layoutStyle?: CollectionLayoutStyle;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  backgroundImage?: string;
  categoryMode?: "auto" | "manual";
  selectedCategories?: string[];
  categoryTags?: string[];
  collectionImage1?: string;
  collectionImage2?: string;
  collectionImage3?: string;
  collectionImage4?: string;
  imageOpacity?: number;
  minHeight?: number;
  overlayColor?: string;
  buttonColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  badgeColor?: string;
}

const LayoutThumb = ({ style, active, onClick, label }: { style: CollectionLayoutStyle; active: boolean; onClick: () => void; label: string }) => {
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

const COLLECTION_IMAGE_SLOTS = [
  { key: "collectionImage1", label: "Image 1", tint: "rgba(234,88,12,0.12)", stroke: "#ea580c" },
  { key: "collectionImage2", label: "Image 2", tint: "rgba(168,85,247,0.10)", stroke: "#a855f7" },
  { key: "collectionImage3", label: "Image 3", tint: "rgba(14,165,233,0.10)", stroke: "#0ea5e9" },
  { key: "collectionImage4", label: "Image 4", tint: "rgba(34,197,94,0.10)", stroke: "#22c55e" },
] as const;

export const CollectionHeroBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as CollectionHeroBlockProps }));
  const { projectId } = useDesignProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const backgroundFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [uploadSlot, setUploadSlot] = useState<number | null>(null);

  const set = <K extends keyof CollectionHeroBlockProps>(key: K, val: CollectionHeroBlockProps[K]) =>
    setProp((p: CollectionHeroBlockProps) => { p[key] = val; });

  const setImageSlot = (slot: number, value: string) => {
    const key = COLLECTION_IMAGE_SLOTS[slot]?.key;
    if (!key) return;
    set(key, value);
  };

  const setSelectedCategory = (index: number, value: string) => {
    const current = [...(props.selectedCategories ?? ["Women", "Men", "Accessories", "Shoes"])];
    while (current.length < 4) current.push("");
    current[index] = value;
    set("selectedCategories", current);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = uploadSlot != null ? COLLECTION_IMAGE_SLOTS[uploadSlot]?.key : null;
    if (!file || !projectId || !key) return;
    setUploading(true);
    try {
      const item = await addFileToMediaLibrary(projectId, file);
      set(key, item.url);
    } catch { /* upload failed */ }
    setUploading(false);
    setUploadSlot(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setBackgroundUploading(true);
    try {
      const item = await addFileToMediaLibrary(projectId, file);
      set("backgroundImage", item.url);
    } catch { /* upload failed */ }
    setBackgroundUploading(false);
    if (backgroundFileRef.current) backgroundFileRef.current.value = "";
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
          ] as { style: CollectionLayoutStyle; label: string }[]).map(({ style, label }) => (
            <LayoutThumb key={style} style={style} label={label} active={(props.layoutStyle ?? "image-right") === style} onClick={() => set("layoutStyle", style)} />
          ))}
        </div>
      </DesignSection>
      <DesignSection title="Content" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Badge text</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.badgeText ?? "Up to 50% Off"} onChange={(e) => set("badgeText", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Title</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.title ?? "Summer Sale"} onChange={(e) => set("title", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subtitle</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.subtitle ?? "Shop our biggest sale of the year. Hundreds of styles marked down for a limited time."} onChange={(e) => set("subtitle", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Primary button</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.primaryLabel ?? "Shop Sale"} onChange={(e) => set("primaryLabel", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Secondary button</label>
          <input className="w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent" value={props.secondaryLabel ?? "View All"} onChange={(e) => set("secondaryLabel", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted mt-2">Category source</label>
          <select
            className={inputCls}
            value={props.categoryMode ?? "auto"}
            onChange={(e) => set("categoryMode", e.target.value as "auto" | "manual")}
          >
            <option value="auto">Auto (from product categories)</option>
            <option value="manual">Manual</option>
          </select>

          {(props.categoryMode ?? "auto") === "manual" && (
            <>
              {[0, 1, 2, 3].map((index) => (
                <React.Fragment key={`category-input-${index}`}>
                  <label className="text-[11px] text-builder-text-muted">Category tag {index + 1}</label>
                  <input
                    className={inputCls}
                    value={props.selectedCategories?.[index] ?? ["Women", "Men", "Accessories", "Shoes"][index]}
                    onChange={(e) => setSelectedCategory(index, e.target.value)}
                    placeholder="Enter category"
                  />
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </DesignSection>

      <DesignSection title="Background" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Background image</label>
            <div className="flex gap-1.5">
              <input
                className={inputCls + " flex-1 min-w-0"}
                value={props.backgroundImage ?? ""}
                onChange={(e) => set("backgroundImage", e.target.value)}
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={() => backgroundFileRef.current?.click()}
                disabled={backgroundUploading}
                className="h-8 px-2.5 rounded text-[10px] font-semibold bg-builder-surface-3 border border-(--builder-border) text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-2 transition-colors shrink-0 disabled:opacity-50"
                title="Upload background image"
              >
                {backgroundUploading ? "..." : "Upload"}
              </button>
              <input ref={backgroundFileRef} type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Image opacity (%)</label>
            <NumericInput value={props.imageOpacity != null ? (props.imageOpacity <= 1 ? props.imageOpacity * 100 : props.imageOpacity) : 85} onChange={(val) => set("imageOpacity", val)} min={0} max={100} step={1} unit="%" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Overlay color</label>
            <ColorPicker value={props.overlayColor ?? "rgba(255,241,235,0.88)"} onChange={(val) => set("overlayColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Min height</label>
            <NumericInput value={props.minHeight ?? 520} onChange={(val) => set("minHeight", val)} min={200} max={1200} step={10} unit="px" />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Collection Images" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3">
            {COLLECTION_IMAGE_SLOTS.map((slot, index) => {
              const value = props[slot.key] ?? "";
              return (
                <div key={slot.key} className="flex flex-col gap-1">
                  <label className="text-[10px] text-builder-text-muted">{slot.label}</label>
                  <div className="flex gap-1.5">
                    <input
                      className={inputCls + " flex-1 min-w-0"}
                      value={value}
                      onChange={(e) => setImageSlot(index, e.target.value)}
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUploadSlot(index);
                        fileRef.current?.click();
                      }}
                      disabled={uploading}
                      className="h-8 px-2.5 rounded text-[10px] font-semibold bg-builder-surface-3 border border-(--builder-border) text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-2 transition-colors shrink-0 disabled:opacity-50"
                      title={`Upload ${slot.label}`}
                    >
                      {uploading && uploadSlot === index ? "..." : "Upload"}
                    </button>
                  </div>
                </div>
              );
            })}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Title color</label>
            <ColorPicker value={props.titleColor ?? "#1e293b"} onChange={(val) => set("titleColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Subtitle color</label>
            <ColorPicker value={props.subtitleColor ?? "#64748b"} onChange={(val) => set("subtitleColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Button color</label>
            <ColorPicker value={props.buttonColor ?? "#ea580c"} onChange={(val) => set("buttonColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Badge color</label>
            <ColorPicker value={props.badgeColor ?? "#dc2626"} onChange={(val) => set("badgeColor", val)} className="w-full" />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};

export const CollectionHeroBlock = ({
  nodeId,
  layoutStyle = "image-right",
  title = "Summer Sale",
  subtitle = "Shop our biggest sale of the year. Hundreds of styles marked down for a limited time.",
  badgeText = "Up to 50% Off",
  primaryLabel = "Shop Sale",
  secondaryLabel = "View All",
  backgroundImage = "https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=2070&auto=format&fit=crop",
  categoryMode = "auto",
  selectedCategories = ["Women", "Men", "Accessories", "Shoes"],
  categoryTags,
  collectionImage1 = "",
  collectionImage2 = "",
  collectionImage3 = "",
  collectionImage4 = "",
  imageOpacity = 0.85,
  minHeight = 520,
  overlayColor = "rgba(255,241,235,0.88)",
  buttonColor = "#ea580c",
  titleColor = "#1e293b",
  subtitleColor = "#64748b",
  badgeColor = "#dc2626",
}: CollectionHeroBlockProps) => {
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

  const collectionImages = [collectionImage1, collectionImage2, collectionImage3, collectionImage4];
  const manualTags = (selectedCategories ?? []).map((tag) => String(tag || "").trim()).filter(Boolean);
  const autoTags = (categoryTags ?? []).map((tag) => String(tag || "").trim()).filter(Boolean);
  const activeTags = categoryMode === "manual" ? manualTags : autoTags;
  const visibleCategoryTags = (activeTags.length > 0 ? activeTags : ["Women", "Men", "Accessories", "Shoes"]).slice(0, 4);


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
          width: "min(100%, 1200px)",
          display: "flex",
          flexDirection: isCloseUp ? "column" : imageOnRight ? "row-reverse" : "row",
          gap: 40,
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          padding: "48px 24px",
          boxSizing: "border-box",
        }}
      >
        {/* Product image grid placeholder */}
        <div
          style={{
            flex: isCloseUp ? "none" : "0 0 48%",
            width: isCloseUp ? "100%" : undefined,
            maxWidth: isCloseUp ? 600 : undefined,
            minHeight: isCloseUp ? 260 : 380,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {COLLECTION_IMAGE_SLOTS.map((slot, index) => {
            const imageUrl = collectionImages[index];
            return (
              <div
                key={slot.key}
                style={{
                  borderRadius: 12,
                  background: imageUrl
                    ? `linear-gradient(rgba(15,23,42,0.08), rgba(15,23,42,0.08)), url(${imageUrl})`
                    : slot.tint,
                  backgroundSize: imageUrl ? "cover" : undefined,
                  backgroundPosition: imageUrl ? "center" : undefined,
                  border: "1px solid rgba(148,163,184,0.15)",
                  minHeight: 140,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {!imageUrl && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke={slot.stroke} strokeWidth="1.5" fill="none" />
                    <path d="M3 15l5-5 4 4 3-3 6 6" stroke={slot.stroke} strokeWidth="1.5" fill="none" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            minWidth: "min(100%, 300px)",
            display: "flex",
            flexDirection: "column",
            alignItems: isCloseUp ? "center" : "flex-start",
            justifyContent: "center",
            textAlign: isCloseUp ? "center" : "left",
            gap: 16,
          }}
        >
          {/* Sale badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: badgeColor,
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 16px",
            borderRadius: 50,
            letterSpacing: 0.5,
            textTransform: "uppercase" as const,
          }}>
            {badgeText}
          </div>

          <p style={{ margin: 0, fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 800, color: titleColor, lineHeight: 1.05 }}>
            {title}
          </p>
          <p style={{ margin: 0, fontSize: "clamp(14px, 2vw, 16px)", color: subtitleColor, lineHeight: 1.7, maxWidth: 440 }}>
            {subtitle}
          </p>

          {/* Category tags */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "4px 0" }}>
            {visibleCategoryTags.map((tag) => (
              <span key={tag} style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#475569",
                background: "rgba(255,255,255,0.7)",
                border: "1px solid #e2e8f0",
                padding: "5px 14px",
                borderRadius: 50,
              }}>
                {tag}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
            <button type="button" style={{
              background: buttonColor,
              color: "#ffffff",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              padding: "14px 32px",
              borderRadius: 10,
            }}>
              {primaryLabel}
            </button>
            <button type="button" style={{
              background: "transparent",
              color: "#1e293b",
              border: "2px solid #1e293b",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 32px",
              borderRadius: 10,
            }}>
              {secondaryLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

CollectionHeroBlock.craft = {
  displayName: "Collection Hero Block",
  props: {
    layoutStyle: "image-right",
    title: "Summer Sale",
    subtitle: "Shop our biggest sale of the year. Hundreds of styles marked down for a limited time.",
    badgeText: "Up to 50% Off",
    primaryLabel: "Shop Sale",
    secondaryLabel: "View All",
    backgroundImage: "https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=2070&auto=format&fit=crop",
    categoryMode: "auto",
    selectedCategories: ["Women", "Men", "Accessories", "Shoes"],
    collectionImage1: "",
    collectionImage2: "",
    collectionImage3: "",
    collectionImage4: "",
    imageOpacity: 0.85,
    minHeight: 520,
    overlayColor: "rgba(255,241,235,0.88)",
    buttonColor: "#ea580c",
    titleColor: "#1e293b",
    subtitleColor: "#64748b",
    badgeColor: "#dc2626",
  },
  custom: {},
  related: { settings: CollectionHeroBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
