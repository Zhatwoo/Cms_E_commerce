"use client";

import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../design/_components/rightPanel/settings/inputs/NumericInput";
import { useDesignProject } from "../../design/_context/DesignProjectContext";
import { addFileToMediaLibrary } from "../../design/_lib/mediaActions";

export interface ImageTextBlockProps {
  nodeId?: string;
  tagline?: string;
  heading?: string;
  description?: string;
  feature1?: string;
  feature2?: string;
  feature3?: string;
  imageSrc?: string;
  backgroundColor?: string;
  taglineColor?: string;
  headingColor?: string;
  textColor?: string;
  checkColor?: string;
  layoutStyle?: "image-left" | "image-right" | "image-top" | "image-bottom";
}

const LayoutThumb = ({ style, active, onClick, label }: { style: string; active: boolean; onClick: () => void; label: string }) => {
  const box = `w-full aspect-[4/3] rounded-lg border-2 overflow-hidden flex transition-all ${
    active ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10"
      : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] hover:border-[var(--builder-border-mid)]"
  }`;
  const c = active ? "var(--builder-accent)" : "#94a3b8";

  let inner: React.ReactNode = null;
  if (style === "image-left") {
    inner = (
      <div className="flex flex-row w-full h-full items-center p-1.5 gap-1.5">
        <div className="w-[45%] h-full rounded" style={{ backgroundColor: c, opacity: 0.35 }} />
        <div className="flex flex-col gap-1 flex-1 justify-center">
          <div className="h-[3px] w-full rounded-full" style={{ backgroundColor: c, opacity: 0.5 }} />
          <div className="h-[3px] w-[75%] rounded-full" style={{ backgroundColor: c, opacity: 0.3 }} />
          <div className="h-[3px] w-[60%] rounded-full" style={{ backgroundColor: c, opacity: 0.3 }} />
        </div>
      </div>
    );
  } else if (style === "image-right") {
    inner = (
      <div className="flex flex-row w-full h-full items-center p-1.5 gap-1.5">
        <div className="flex flex-col gap-1 flex-1 justify-center">
          <div className="h-[3px] w-full rounded-full" style={{ backgroundColor: c, opacity: 0.5 }} />
          <div className="h-[3px] w-[75%] rounded-full" style={{ backgroundColor: c, opacity: 0.3 }} />
          <div className="h-[3px] w-[60%] rounded-full" style={{ backgroundColor: c, opacity: 0.3 }} />
        </div>
        <div className="w-[45%] h-full rounded" style={{ backgroundColor: c, opacity: 0.35 }} />
      </div>
    );
  } else if (style === "image-top") {
    inner = (
      <div className="flex flex-col w-full h-full p-1.5 gap-1.5">
        <div className="w-full h-[50%] rounded" style={{ backgroundColor: c, opacity: 0.35 }} />
        <div className="flex flex-col gap-1 flex-1 justify-center">
          <div className="h-[3px] w-full rounded-full" style={{ backgroundColor: c, opacity: 0.5 }} />
          <div className="h-[3px] w-[75%] rounded-full" style={{ backgroundColor: c, opacity: 0.3 }} />
        </div>
      </div>
    );
  } else if (style === "image-bottom") {
    inner = (
      <div className="flex flex-col w-full h-full p-1.5 gap-1.5">
        <div className="flex flex-col gap-1 flex-1 justify-center">
          <div className="h-[3px] w-full rounded-full" style={{ backgroundColor: c, opacity: 0.5 }} />
          <div className="h-[3px] w-[75%] rounded-full" style={{ backgroundColor: c, opacity: 0.3 }} />
        </div>
        <div className="w-full h-[50%] rounded" style={{ backgroundColor: c, opacity: 0.35 }} />
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

export const ImageTextBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as ImageTextBlockProps }));
  const { projectId } = useDesignProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof ImageTextBlockProps>(key: K, val: ImageTextBlockProps[K]) =>
    setProp((p: ImageTextBlockProps) => { p[key] = val; });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setUploading(true);
    try {
      const item = await addFileToMediaLibrary(projectId, file);
      set("imageSrc", item.url);
    } catch { /* upload failed */ }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  const layouts: { value: ImageTextBlockProps["layoutStyle"]; label: string }[] = [
    { value: "image-left", label: "Left" },
    { value: "image-right", label: "Right" },
    { value: "image-top", label: "Top" },
    { value: "image-bottom", label: "Bottom" },
  ];

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Layout" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          {layouts.map((l) => (
            <LayoutThumb
              key={l.value}
              style={l.value!}
              active={(props.layoutStyle ?? "image-left") === l.value}
              onClick={() => set("layoutStyle", l.value)}
              label={l.label}
            />
          ))}
        </div>
      </DesignSection>

      <DesignSection title="Content" defaultOpen>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Tagline</label>
          <input className={inputCls} value={props.tagline ?? "Crafted with Care"} onChange={(e) => set("tagline", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Heading</label>
          <input className={inputCls} value={props.heading ?? "Quality You Can Feel"} onChange={(e) => set("heading", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Description</label>
          <input className={inputCls} value={props.description ?? "We believe in creating products that stand the test of time. Each piece is carefully selected for its quality, design, and sustainability. Our commitment to excellence means you get only the best."} onChange={(e) => set("description", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Feature 1</label>
          <input className={inputCls} value={props.feature1 ?? "Sustainably sourced materials"} onChange={(e) => set("feature1", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Feature 2</label>
          <input className={inputCls} value={props.feature2 ?? "Handcrafted by artisans"} onChange={(e) => set("feature2", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Feature 3</label>
          <input className={inputCls} value={props.feature3 ?? "30-day satisfaction guarantee"} onChange={(e) => set("feature3", e.target.value)} />
        </div>
      </DesignSection>

      <DesignSection title="Background" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Image</label>
            <div className="flex gap-1.5">
              <input className={inputCls + " flex-1 min-w-0"} value={props.imageSrc ?? ""} onChange={(e) => set("imageSrc", e.target.value)} placeholder="https://..." />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-8 px-2.5 rounded text-[10px] font-semibold bg-builder-surface-3 border border-(--builder-border) text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-2 transition-colors shrink-0 disabled:opacity-50" title="Upload image">
                {uploading ? "..." : "Upload"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Background color</label>
            <ColorPicker value={props.backgroundColor ?? "#ffffff"} onChange={(val) => set("backgroundColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Tagline color</label>
            <ColorPicker value={props.taglineColor ?? "#6366f1"} onChange={(val) => set("taglineColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Heading color</label>
            <ColorPicker value={props.headingColor ?? "#1e293b"} onChange={(val) => set("headingColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Text color</label>
            <ColorPicker value={props.textColor ?? "#64748b"} onChange={(val) => set("textColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Check color</label>
            <ColorPicker value={props.checkColor ?? "#10b981"} onChange={(val) => set("checkColor", val)} className="w-full" />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};

export const ImageTextBlock = ({
  nodeId,
  tagline = "Crafted with Care",
  heading = "Quality You Can Feel",
  description = "We believe in creating products that stand the test of time. Each piece is carefully selected for its quality, design, and sustainability. Our commitment to excellence means you get only the best.",
  feature1 = "Sustainably sourced materials",
  feature2 = "Handcrafted by artisans",
  feature3 = "30-day satisfaction guarantee",
  imageSrc = "",
  backgroundColor = "#ffffff",
  taglineColor = "#6366f1",
  headingColor = "#1e293b",
  textColor = "#64748b",
  checkColor = "#10b981",
  layoutStyle = "image-left",
}: ImageTextBlockProps) => {
  const node = (() => {
    try {
      return useNode();
    } catch (e) {
      return null;
    }
  })();

  const id = node?.id || nodeId;
  const connectors = node?.connectors;


  const features = [feature1, feature2, feature3];

  const isVertical = layoutStyle === "image-top" || layoutStyle === "image-bottom";
  const flexDir = layoutStyle === "image-right" ? "row-reverse"
    : layoutStyle === "image-top" ? "column"
    : layoutStyle === "image-bottom" ? "column-reverse"
    : "row";

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
        backgroundColor,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          width: "100%",
          display: "flex",
          flexDirection: flexDir,
          gap: 48,
          flexWrap: "wrap",
          padding: "72px 24px",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Image placeholder */}
        <div
          style={{
            width: isVertical ? "100%" : "min(100%, 480px)",
            height: isVertical ? 300 : 380,
            backgroundColor: imageSrc ? undefined : "#f1f5f9",
            borderRadius: 16,
            flexShrink: 0,
            backgroundImage: imageSrc ? `url(${imageSrc})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!imageSrc && (
            <span style={{ fontSize: 16, fontWeight: 500, color: "#94a3b8" }}>Image</span>
          )}
        </div>

        {/* Text content */}
        <div
          style={{
            width: "min(100%, 480px)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: taglineColor, letterSpacing: 2, textTransform: "uppercase" }}>
            {tagline}
          </p>
          <p style={{ margin: 0, fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: headingColor, lineHeight: 1.2 }}>
            {heading}
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 400, color: textColor, lineHeight: 1.7 }}>
            {description}
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            {features.map((feature, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "row", gap: 10, alignItems: "center" }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#ecfdf5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: checkColor, lineHeight: 1 }}>&#10003;</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#475569" }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

ImageTextBlock.craft = {
  displayName: "Image Text Block",
  props: {
    tagline: "Crafted with Care",
    heading: "Quality You Can Feel",
    description: "We believe in creating products that stand the test of time. Each piece is carefully selected for its quality, design, and sustainability. Our commitment to excellence means you get only the best.",
    feature1: "Sustainably sourced materials",
    feature2: "Handcrafted by artisans",
    feature3: "30-day satisfaction guarantee",
    imageSrc: "",
    backgroundColor: "#ffffff",
    taglineColor: "#6366f1",
    headingColor: "#1e293b",
    textColor: "#64748b",
    checkColor: "#10b981",
    layoutStyle: "image-left",
  },
  custom: {},
  related: { settings: ImageTextBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
