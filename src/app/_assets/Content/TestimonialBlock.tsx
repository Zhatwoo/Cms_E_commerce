"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../design/_components/rightPanel/settings/inputs/NumericInput";

export type TestimonialLayoutStyle = "centered" | "left-aligned" | "card-left" | "card-right";

export interface TestimonialBlockProps {
  nodeId?: string;
  layoutStyle?: TestimonialLayoutStyle;
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

const LayoutThumb = ({ style, active, onClick, label }: { style: TestimonialLayoutStyle; active: boolean; onClick: () => void; label: string }) => {
  const box = `w-full aspect-[4/3] rounded-lg border-2 overflow-hidden flex transition-all ${
    active
      ? "border-(--builder-accent) bg-builder-accent/10"
      : "border-(--builder-border) bg-builder-surface-2 hover:border-(--builder-border-mid)"
  }`;
  const c = active ? "var(--builder-accent)" : "#94a3b8";
  const co = active ? 0.7 : 0.5;
  const t = active ? "var(--builder-accent)" : "#cbd5e1";
  const to2 = active ? 0.8 : 0.6;

  const textLines = (widths: number[], align: "center" | "flex-start" = "center") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: align, flex: 1 }}>
      {widths.map((w, i) => (
        <div key={i} style={{ height: 2, background: t, borderRadius: 1, width: `${w}%`, opacity: to2 }} />
      ))}
    </div>
  );

  const avatar = (size = 10) => (
    <div style={{ width: size, height: size, borderRadius: "50%", background: c, opacity: co, flexShrink: 0 }} />
  );

  let inner: React.ReactNode;
  if (style === "centered") {
    inner = (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 8 }}>
        {textLines([80, 60, 70], "center")}
        <div style={{ marginTop: 4 }}>{avatar(10)}</div>
        {textLines([40, 30], "center")}
      </div>
    );
  } else if (style === "left-aligned") {
    inner = (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: 8 }}>
        {textLines([80, 60, 70], "flex-start")}
        <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 4 }}>
          {avatar(10)}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <div style={{ height: 2, width: 20, background: t, borderRadius: 1, opacity: to2 }} />
            <div style={{ height: 2, width: 14, background: t, borderRadius: 1, opacity: to2 }} />
          </div>
        </div>
      </div>
    );
  } else if (style === "card-left") {
    inner = (
      <div style={{ width: "100%", display: "flex", gap: 4, padding: 6, alignItems: "center" }}>
        <div style={{ width: "30%", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          {avatar(14)}
          <div style={{ height: 2, width: 16, background: t, borderRadius: 1, opacity: to2 }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {[80, 60, 70, 50].map((w, i) => (
            <div key={i} style={{ height: 2, background: t, borderRadius: 1, width: `${w}%`, opacity: to2 }} />
          ))}
        </div>
      </div>
    );
  } else {
    // card-right
    inner = (
      <div style={{ width: "100%", display: "flex", gap: 4, padding: 6, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {[80, 60, 70, 50].map((w, i) => (
            <div key={i} style={{ height: 2, background: t, borderRadius: 1, width: `${w}%`, opacity: to2 }} />
          ))}
        </div>
        <div style={{ width: "30%", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          {avatar(14)}
          <div style={{ height: 2, width: 16, background: t, borderRadius: 1, opacity: to2 }} />
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

export const TestimonialBlockSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as TestimonialBlockProps }));

  const set = <K extends keyof TestimonialBlockProps>(key: K, val: TestimonialBlockProps[K]) =>
    setProp((p: TestimonialBlockProps) => { p[key] = val; });

  const inputCls = "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Layout" defaultOpen>
        <p className="text-[10px] text-builder-text-faint mb-2 uppercase tracking-wider font-semibold">Select layout style</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {([
            { style: "centered" as const, label: "Centered" },
            { style: "left-aligned" as const, label: "Left Aligned" },
            { style: "card-left" as const, label: "Card Left" },
            { style: "card-right" as const, label: "Card Right" },
          ]).map((item) => (
            <LayoutThumb
              key={item.style}
              style={item.style}
              label={item.label}
              active={(props.layoutStyle ?? "centered") === item.style}
              onClick={() => set("layoutStyle", item.style)}
            />
          ))}
        </div>
      </DesignSection>

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
  nodeId,
  layoutStyle = "centered",
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
  const node = (() => {
    try {
      return useNode();
    } catch (e) {
      return null;
    }
  })();

  const id = node?.id || nodeId;
  const connectors = node?.connectors;


  const isSplit = layoutStyle === "card-left" || layoutStyle === "card-right";
  const isCentered = layoutStyle === "centered";

  const avatarSection = (
    <div
      style={{
        display: "flex",
        flexDirection: isSplit ? "column" : "row",
        gap: isSplit ? 8 : 14,
        alignItems: "center",
        flexWrap: "wrap",
        ...(isSplit ? { width: 120, flexShrink: 0, justifyContent: "center" } : {}),
        ...(isCentered ? { justifyContent: "center" } : {}),
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

      <div style={{ display: "flex", flexDirection: "column", gap: 2, ...(isSplit || isCentered ? { alignItems: "center", textAlign: "center" as const } : {}) }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: nameColor }}>{authorName}</span>
        <span style={{ fontSize: 14, color: roleColor }}>{authorRole}</span>
      </div>
    </div>
  );

  const quoteSection = (
    <p
      style={{
        margin: 0,
        fontSize: "clamp(18px, 3vw, 24px)",
        color: quoteColor,
        lineHeight: 1.5,
        fontStyle: "italic",
        ...(isSplit ? {} : { marginBottom: 32 }),
        ...(isCentered ? { textAlign: "center" } : {}),
        ...(layoutStyle === "left-aligned" ? { textAlign: "left" } : {}),
      }}
    >
      &ldquo;{quote}&rdquo;
    </p>
  );

  const renderContent = () => {
    if (layoutStyle === "card-left") {
      return (
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {avatarSection}
          <div style={{ flex: 1 }}>{quoteSection}</div>
        </div>
      );
    }
    if (layoutStyle === "card-right") {
      return (
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <div style={{ flex: 1 }}>{quoteSection}</div>
          {avatarSection}
        </div>
      );
    }
    // centered or left-aligned
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        ...(isCentered ? { alignItems: "center" } : { alignItems: "flex-start" }),
      }}>
        {quoteSection}
        {avatarSection}
      </div>
    );
  };

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
        {renderContent()}
      </div>
    </section>
  );
};

TestimonialBlock.craft = {
  displayName: "Testimonial Block",
  props: {
    layoutStyle: "centered" as TestimonialLayoutStyle,
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
