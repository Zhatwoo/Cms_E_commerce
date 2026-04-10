"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../design/_components/rightPanel/settings/inputs/NumericInput";

export interface TestimonialBlockProps {
  quote?: string;
  authorName?: string;
  authorRole?: string;
  authorInitials?: string;
  backgroundColor?: string;
  cardBg?: string;
  quoteColor?: string;
  nameColor?: string;
  roleColor?: string;
  accentColor?: string;
  minHeight?: number;
}

export const TestimonialBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as TestimonialBlockProps }));

  const set = <K extends keyof TestimonialBlockProps>(key: K, val: TestimonialBlockProps[K]) =>
    setProp((p: TestimonialBlockProps) => { p[key] = val; });

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Content" defaultOpen>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Quote</label>
          <input className={inputCls} value={props.quote ?? "Quality products and great experience. Will definitely be back."} onChange={(e) => set("quote", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Author name</label>
          <input className={inputCls} value={props.authorName ?? "Happy Customer"} onChange={(e) => set("authorName", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Author role</label>
          <input className={inputCls} value={props.authorRole ?? "Verified Buyer"} onChange={(e) => set("authorRole", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Author initials</label>
          <input className={inputCls} value={props.authorInitials ?? "HC"} onChange={(e) => set("authorInitials", e.target.value)} />
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Background color</label>
            <ColorPicker value={props.backgroundColor ?? "#f1f5f9"} onChange={(val) => set("backgroundColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Card background</label>
            <ColorPicker value={props.cardBg ?? "#ffffff"} onChange={(val) => set("cardBg", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Quote color</label>
            <ColorPicker value={props.quoteColor ?? "#475569"} onChange={(val) => set("quoteColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Name color</label>
            <ColorPicker value={props.nameColor ?? "#1e293b"} onChange={(val) => set("nameColor", val)} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text-muted">Accent color</label>
            <ColorPicker value={props.accentColor ?? "#3b82f6"} onChange={(val) => set("accentColor", val)} className="w-full" />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Size" defaultOpen={false}>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-builder-text-muted">Min height</label>
          <NumericInput value={props.minHeight ?? 400} onChange={(val) => set("minHeight", val)} min={200} max={1200} step={10} unit="px" />
        </div>
      </DesignSection>
    </div>
  );
};

export const TestimonialBlock = ({
  quote = "Quality products and great experience. Will definitely be back.",
  authorName = "Happy Customer",
  authorRole = "Verified Buyer",
  authorInitials = "HC",
  backgroundColor = "#f1f5f9",
  cardBg = "#ffffff",
  quoteColor = "#475569",
  nameColor = "#1e293b",
  roleColor = "#64748b",
  accentColor = "#3b82f6",
  minHeight = 400,
}: TestimonialBlockProps) => {
  const { id, connectors: { connect, drag } } = useNode();

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
        backgroundColor,
        padding: "48px 12px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          width: "100%",
          background: cardBg,
          borderRadius: 16,
          padding: "52px 48px",
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "clamp(18px, 3vw, 24px)",
            color: quoteColor,
            lineHeight: 1.5,
            fontStyle: "italic",
            marginBottom: 32,
          }}
        >
          &ldquo;{quote}&rdquo;
        </p>

        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>{authorInitials}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: nameColor }}>{authorName}</span>
            <span style={{ fontSize: 14, color: roleColor }}>{authorRole}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

TestimonialBlock.craft = {
  displayName: "Testimonial Block",
  props: {
    quote: "Quality products and great experience. Will definitely be back.",
    authorName: "Happy Customer",
    authorRole: "Verified Buyer",
    authorInitials: "HC",
    backgroundColor: "#f1f5f9",
    cardBg: "#ffffff",
    quoteColor: "#475569",
    nameColor: "#1e293b",
    roleColor: "#64748b",
    accentColor: "#3b82f6",
    minHeight: 400,
  },
  custom: {},
  related: { settings: TestimonialBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
