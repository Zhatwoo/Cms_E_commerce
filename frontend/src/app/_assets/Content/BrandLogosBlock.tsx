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
}

export const BrandLogosBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as BrandLogosBlockProps }));

  const set = <K extends keyof BrandLogosBlockProps>(key: K, val: BrandLogosBlockProps[K]) =>
    setProp((p: BrandLogosBlockProps) => { p[key] = val; });

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  return (
    <div className="flex flex-col gap-0">
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
}: BrandLogosBlockProps) => {
  const { id, connectors: { connect, drag } } = useNode();

  const brands = [brand1, brand2, brand3, brand4, brand5];

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
  },
  custom: {},
  related: { settings: BrandLogosBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
