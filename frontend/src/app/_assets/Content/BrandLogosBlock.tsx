"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";

export interface BrandLogosBlockProps {
  heading?: string;
  brand1?: string;
  brand2?: string;
  brand3?: string;
  brand4?: string;
  brand5?: string;
  backgroundColor?: string;
  headingColor?: string;
  brandColor?: string;
  brandBg?: string;
  layoutStyle?: "single-row" | "two-rows" | "grid" | "minimal";
}

const LayoutThumb = ({ style, active, onClick, label }: { style: string; active: boolean; onClick: () => void; label: string }) => {
  const box = `w-full aspect-[4/3] rounded-lg border-2 overflow-hidden flex transition-all ${
    active ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10"
      : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] hover:border-[var(--builder-border-mid)]"
  }`;
  const c = active ? "var(--builder-accent)" : "#94a3b8";

  let inner: React.ReactNode = null;
  if (style === "single-row") {
    inner = (
      <div className="flex flex-row w-full h-full items-center justify-center p-1.5 gap-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c, opacity: 0.35 }} />
        ))}
      </div>
    );
  } else if (style === "two-rows") {
    inner = (
      <div className="flex flex-col w-full h-full items-center justify-center p-1.5 gap-1">
        <div className="flex flex-row gap-1 justify-center">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c, opacity: 0.35 }} />
          ))}
        </div>
        <div className="flex flex-row gap-1 justify-center">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="w-3.5 h-3 rounded-sm" style={{ backgroundColor: c, opacity: 0.35 }} />
          ))}
        </div>
      </div>
    );
  } else if (style === "grid") {
    inner = (
      <div className="grid grid-cols-3 w-full h-full place-items-center p-1.5 gap-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c, opacity: 0.35 }} />
        ))}
      </div>
    );
  } else if (style === "minimal") {
    inner = (
      <div className="flex flex-row w-full h-full items-center justify-center p-1.5 gap-1">
        {[...Array(4)].map((_, i) => (
          <React.Fragment key={i}>
            <div className="h-[3px] w-3 rounded-full" style={{ backgroundColor: c, opacity: 0.5 }} />
            {i < 3 && <div className="h-[3px] w-[2px] rounded-full" style={{ backgroundColor: c, opacity: 0.25 }} />}
          </React.Fragment>
        ))}
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

export const BrandLogosBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as BrandLogosBlockProps }));

  const set = <K extends keyof BrandLogosBlockProps>(key: K, val: BrandLogosBlockProps[K]) =>
    setProp((p: BrandLogosBlockProps) => { p[key] = val; });

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  const layouts: { value: BrandLogosBlockProps["layoutStyle"]; label: string }[] = [
    { value: "single-row", label: "Row" },
    { value: "two-rows", label: "Two Rows" },
    { value: "grid", label: "Grid" },
    { value: "minimal", label: "Minimal" },
  ];

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Layout" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          {layouts.map((l) => (
            <LayoutThumb
              key={l.value}
              style={l.value!}
              active={(props.layoutStyle ?? "single-row") === l.value}
              onClick={() => set("layoutStyle", l.value)}
              label={l.label}
            />
          ))}
        </div>
      </DesignSection>

      <DesignSection title="Content" defaultOpen>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Heading</label>
          <input className={inputCls} value={props.heading ?? "Trusted by Leading Brands"} onChange={(e) => set("heading", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Brand 1</label>
          <input className={inputCls} value={props.brand1 ?? "Brand A"} onChange={(e) => set("brand1", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Brand 2</label>
          <input className={inputCls} value={props.brand2 ?? "Brand B"} onChange={(e) => set("brand2", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Brand 3</label>
          <input className={inputCls} value={props.brand3 ?? "Brand C"} onChange={(e) => set("brand3", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Brand 4</label>
          <input className={inputCls} value={props.brand4 ?? "Brand D"} onChange={(e) => set("brand4", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Brand 5</label>
          <input className={inputCls} value={props.brand5 ?? "Brand E"} onChange={(e) => set("brand5", e.target.value)} />
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Background color</label>
            <ColorPicker value={props.backgroundColor ?? "#ffffff"} onChange={(val) => set("backgroundColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Heading color</label>
            <ColorPicker value={props.headingColor ?? "#94a3b8"} onChange={(val) => set("headingColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Brand color</label>
            <ColorPicker value={props.brandColor ?? "#cbd5e1"} onChange={(val) => set("brandColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Brand background</label>
            <ColorPicker value={props.brandBg ?? "#f8fafc"} onChange={(val) => set("brandBg", val)} className="w-full" />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};

export const BrandLogosBlock = ({
  heading = "Trusted by Leading Brands",
  brand1 = "Brand A",
  brand2 = "Brand B",
  brand3 = "Brand C",
  brand4 = "Brand D",
  brand5 = "Brand E",
  backgroundColor = "#ffffff",
  headingColor = "#94a3b8",
  brandColor = "#cbd5e1",
  brandBg = "#f8fafc",
  layoutStyle = "single-row",
}: BrandLogosBlockProps) => {
  const { id, connectors: { connect, drag } } = useNode();

  const brands = [brand1, brand2, brand3, brand4, brand5];

  const renderBrands = () => {
    if (layoutStyle === "minimal") {
      return (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: 0,
            width: "100%",
          }}
        >
          {brands.map((brand, idx) => (
            <React.Fragment key={idx}>
              <span style={{ fontSize: 16, fontWeight: 600, color: brandColor, whiteSpace: "nowrap" }}>{brand}</span>
              {idx < brands.length - 1 && (
                <span style={{ fontSize: 16, fontWeight: 400, color: brandColor, opacity: 0.4, margin: "0 12px" }}>|</span>
              )}
            </React.Fragment>
          ))}
        </div>
      );
    }

    if (layoutStyle === "grid") {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 16,
            width: "100%",
          }}
        >
          {brands.map((brand, idx) => (
            <div
              key={idx}
              style={{
                height: 72,
                background: brandBg,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: brandColor }}>{brand}</span>
            </div>
          ))}
        </div>
      );
    }

    if (layoutStyle === "two-rows") {
      return (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          {brands.map((brand, idx) => (
            <div
              key={idx}
              style={{
                flex: idx < 3 ? "1 1 30%" : "1 1 45%",
                maxWidth: idx < 3 ? "30%" : "45%",
                height: 72,
                background: brandBg,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: brandColor }}>{brand}</span>
            </div>
          ))}
        </div>
      );
    }

    // single-row (default)
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 32,
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        {brands.map((brand, idx) => (
          <div
            key={idx}
            style={{
              width: 160,
              height: 72,
              background: brandBg,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 600, color: brandColor }}>{brand}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
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
          padding: "48px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: headingColor,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {heading}
        </p>

        {renderBrands()}

        <div
          style={{
            width: "100%",
            height: 1,
            background: "#e2e8f0",
          }}
        />
      </div>
    </section>
  );
};

BrandLogosBlock.craft = {
  displayName: "Brand Logos Block",
  props: {
    heading: "Trusted by Leading Brands",
    brand1: "Brand A",
    brand2: "Brand B",
    brand3: "Brand C",
    brand4: "Brand D",
    brand5: "Brand E",
    backgroundColor: "#ffffff",
    headingColor: "#94a3b8",
    brandColor: "#cbd5e1",
    brandBg: "#f8fafc",
    layoutStyle: "single-row",
  },
  custom: {},
  related: { settings: BrandLogosBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
