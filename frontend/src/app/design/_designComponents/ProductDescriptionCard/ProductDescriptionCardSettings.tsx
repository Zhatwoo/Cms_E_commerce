"use client";

import React, { useEffect, useState } from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../_context/DesignProjectContext";
import type { ProductDescriptionCardProps, LayoutStyle } from "./ProductDescriptionCard";
import { Package, ChevronDown } from "lucide-react";

const Row = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-center gap-2 mb-2 ${className}`}>{children}</div>
);
const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] text-[var(--builder-text-muted)] w-24 shrink-0">{children}</span>
);
const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
    <div onClick={() => onChange(!checked)} className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? "bg-[var(--builder-accent)] border-[var(--builder-accent)]" : "border-[var(--builder-border-mid)] bg-transparent"}`}>
      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
    <span className="text-[12px] text-[var(--builder-text)]">{label}</span>
  </label>
);

// Layout thumbnail SVGs
const LayoutThumb = ({ style, active, onClick, label }: { style: LayoutStyle; active: boolean; onClick: () => void; label: string }) => {
  const base = `flex flex-col items-center gap-1 cursor-pointer group`;
  const box = `w-full aspect-[4/3] rounded-lg border-2 overflow-hidden flex transition-all ${active ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10" : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] hover:border-[var(--builder-border-mid)]"}`;

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
    // close-up: image full width, text below
    inner = (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, background: active ? "var(--builder-accent)" : "#94a3b8", opacity: active ? 0.7 : 0.5 }} />
        <div style={{ padding: "4px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[70, 50].map((w, i) => <div key={i} style={{ height: 3, background: active ? "var(--builder-accent)" : "#cbd5e1", borderRadius: 2, width: `${w}%`, opacity: 0.7 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className={base} onClick={onClick}>
      <div className={box}>{inner}</div>
      <span className={`text-[9px] font-semibold uppercase tracking-wide ${active ? "text-[var(--builder-accent)]" : "text-[var(--builder-text-faint)]"}`}>{label}</span>
    </div>
  );
};

export const ProductDescriptionCardSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as ProductDescriptionCardProps }));
  const { projectSubdomain } = useDesignProject();
  const [products, setProducts] = useState<ApiProduct[]>([]);

  const set = <K extends keyof ProductDescriptionCardProps>(key: K, val: ProductDescriptionCardProps[K]) =>
    setProp((p: ProductDescriptionCardProps) => { p[key] = val; });

  useEffect(() => {
    listProducts({ subdomain: projectSubdomain ?? undefined })
      .then((res) => setProducts(res.items ?? []))
      .catch(() => setProducts([]));
  }, [projectSubdomain]);

  const boundProduct = products.find((p) => p.id === props.boundProductId);

  return (
    <div className="flex flex-col gap-0">

      {/* ── Product ── */}
      <DesignSection title="Product" defaultOpen>
        <p className="text-[10px] text-[var(--builder-text-faint)] mb-2 uppercase tracking-wider font-semibold">Bind product</p>
        <div className="relative mb-3">
          <select value={props.boundProductId ?? ""} onChange={(e) => set("boundProductId", e.target.value || undefined)}
            className="w-full h-8 rounded-lg px-3 pr-8 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)] appearance-none cursor-pointer">
            <option value="">— No product —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--builder-text-muted)] pointer-events-none" />
        </div>
        {boundProduct && (
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--builder-surface-2)] border border-[var(--builder-border)]">
            {boundProduct.images?.[0] ? (
              <img src={boundProduct.images[0]} alt={boundProduct.name} className="w-10 h-10 rounded object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded bg-[var(--builder-surface-3)] flex items-center justify-center shrink-0">
                <Package size={16} className="text-[var(--builder-text-faint)]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[var(--builder-text)] truncate">{boundProduct.name}</p>
              <p className="text-[11px] text-[var(--builder-text-muted)]">
                ₱{(boundProduct.finalPrice ?? boundProduct.price ?? 0).toLocaleString()}
                {boundProduct.compareAtPrice && boundProduct.compareAtPrice > (boundProduct.finalPrice ?? boundProduct.price ?? 0) && (
                  <span className="ml-1 line-through opacity-60">₱{boundProduct.compareAtPrice.toLocaleString()}</span>
                )}
              </p>
            </div>
          </div>
        )}
        {products.length === 0 && (
          <p className="text-[11px] text-[var(--builder-text-faint)] text-center py-2">No products found in your store.</p>
        )}
      </DesignSection>

      {/* ── Layout ── */}
      <DesignSection title="Layout" defaultOpen>
        <p className="text-[10px] text-[var(--builder-text-faint)] mb-2 uppercase tracking-wider font-semibold">Select layout style</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {([
            { style: "image-left-1", label: "Image left 1" },
            { style: "image-left-2", label: "Image left 2" },
            { style: "image-right",  label: "Image right" },
            { style: "close-up",     label: "Close-up" },
          ] as { style: LayoutStyle; label: string }[]).map(({ style, label }) => (
            <LayoutThumb key={style} style={style} label={label}
              active={props.layoutStyle === style}
              onClick={() => set("layoutStyle", style)} />
          ))}
        </div>

        <Toggle checked={!!props.stretchFullWidth} onChange={(v) => set("stretchFullWidth", v)} label="Stretch to full width" />

        {!props.stretchFullWidth && (
          <div className="pl-6 mb-1">
            <Row><Label>Width</Label>
              <input className="flex-1 h-7 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
                value={props.width ?? "680px"} onChange={(e) => set("width", e.target.value)} />
            </Row>
          </div>
        )}

        {props.layoutStyle !== "close-up" && (
          <Row>
            <Label>Image ratio</Label>
            <div className="flex-1 flex items-center gap-2">
              <input type="range" min={25} max={75} value={Math.round((props.imageRatio ?? 0.5) * 100)}
                onChange={(e) => set("imageRatio", parseInt(e.target.value) / 100)}
                className="flex-1 accent-[var(--builder-accent)]" />
              <span className="text-[11px] text-[var(--builder-text-muted)] w-8 text-right">{Math.round((props.imageRatio ?? 0.5) * 100)}%</span>
            </div>
          </Row>
        )}

        <p className="text-[10px] text-[var(--builder-text-faint)] mb-1 mt-3 uppercase tracking-wider font-semibold">What&apos;s Displayed?</p>
        <Toggle checked={!!props.showProductName} onChange={(v) => set("showProductName", v)} label="Product name" />
        <Toggle checked={!!props.showDivider} onChange={(v) => set("showDivider", v)} label="Name & price divider" />
        <Toggle checked={!!props.showPrice} onChange={(v) => set("showPrice", v)} label="Product price" />
        {props.showPrice && <Toggle checked={!!props.showComparePrice} onChange={(v) => set("showComparePrice", v)} label="Compare-at price" />}
        <Toggle checked={!!props.showDiscountName} onChange={(v) => set("showDiscountName", v)} label="Discount badge" />
        <Toggle checked={!!props.showDescription} onChange={(v) => set("showDescription", v)} label="Description" />
        {props.showDescription && (
          <div className="pl-6 mb-1">
            <Row><Label>Max lines</Label><NumericInput value={props.descriptionLines ?? 6} min={1} max={20} onChange={(v) => set("descriptionLines", v)} /></Row>
          </div>
        )}
        <Toggle checked={!!props.showSku} onChange={(v) => set("showSku", v)} label="SKU" />
        <Toggle checked={!!props.showStock} onChange={(v) => set("showStock", v)} label="Stock status" />
        <Toggle checked={!!props.showAddToCart} onChange={(v) => set("showAddToCart", v)} label="Add to Cart button" />
        {props.showAddToCart && <Toggle checked={!!props.showQuantitySelector} onChange={(v) => set("showQuantitySelector", v)} label="Quantity selector" />}
      </DesignSection>

      {/* ── Design ── */}
      <DesignSection title="Design" defaultOpen={false}>
        <p className="text-[10px] text-[var(--builder-text-faint)] mb-1.5 uppercase tracking-wider font-semibold">Card</p>
        <Row><Label>Background</Label><ColorPicker value={props.cardBackground ?? "#ffffff"} onChange={(v) => set("cardBackground", v)} /></Row>
        <Row><Label>Border color</Label><ColorPicker value={props.cardBorderColor ?? "#e5e7eb"} onChange={(v) => set("cardBorderColor", v)} /></Row>
        <Row><Label>Border width</Label><NumericInput value={props.cardBorderWidth ?? 1} min={0} max={8} unit="px" onChange={(v) => set("cardBorderWidth", v)} /></Row>
        <Row><Label>Radius</Label><NumericInput value={props.cardBorderRadius ?? 12} min={0} max={40} unit="px" onChange={(v) => set("cardBorderRadius", v)} /></Row>
        <Row><Label>Content pad</Label><NumericInput value={props.contentPadding ?? 32} min={0} max={80} unit="px" onChange={(v) => set("contentPadding", v)} /></Row>

        <p className="text-[10px] text-[var(--builder-text-faint)] mb-1.5 mt-3 uppercase tracking-wider font-semibold">Text</p>
        <Row><Label>Name size</Label><NumericInput value={props.nameFontSize ?? 22} min={12} max={48} unit="px" onChange={(v) => set("nameFontSize", v)} /></Row>
        <Row><Label>Name color</Label><ColorPicker value={props.nameColor ?? "#0f172a"} onChange={(v) => set("nameColor", v)} /></Row>
        <Row><Label>Name weight</Label>
          <select value={props.nameFontWeight ?? "700"} onChange={(e) => set("nameFontWeight", e.target.value)}
            className="flex-1 h-7 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none">
            {["400","500","600","700","800"].map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </Row>
        <Row><Label>Desc size</Label><NumericInput value={props.descriptionFontSize ?? 14} min={10} max={22} unit="px" onChange={(v) => set("descriptionFontSize", v)} /></Row>
        <Row><Label>Desc color</Label><ColorPicker value={props.descriptionColor ?? "#6b7280"} onChange={(v) => set("descriptionColor", v)} /></Row>
        <Row><Label>Price size</Label><NumericInput value={props.priceFontSize ?? 20} min={12} max={40} unit="px" onChange={(v) => set("priceFontSize", v)} /></Row>
        <Row><Label>Price color</Label><ColorPicker value={props.priceColor ?? "#0f172a"} onChange={(v) => set("priceColor", v)} /></Row>

        {props.showAddToCart && (
          <>
            <p className="text-[10px] text-[var(--builder-text-faint)] mb-1.5 mt-3 uppercase tracking-wider font-semibold">Button</p>
            <Row><Label>Label</Label>
              <input className="flex-1 h-7 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
                value={props.buttonLabel ?? "View Details"} onChange={(e) => set("buttonLabel", e.target.value)} />
            </Row>
            <Row><Label>Background</Label><ColorPicker value={props.buttonBackground ?? "transparent"} onChange={(v) => set("buttonBackground", v)} /></Row>
            <Row><Label>Text color</Label><ColorPicker value={props.buttonTextColor ?? "#0f172a"} onChange={(v) => set("buttonTextColor", v)} /></Row>
            <Row><Label>Border color</Label><ColorPicker value={props.buttonBorderColor ?? "#0f172a"} onChange={(v) => set("buttonBorderColor", v)} /></Row>
            <Row><Label>Border width</Label><NumericInput value={props.buttonBorderWidth ?? 1} min={0} max={4} unit="px" onChange={(v) => set("buttonBorderWidth", v)} /></Row>
            <Row><Label>Radius</Label><NumericInput value={props.buttonBorderRadius ?? 6} min={0} max={50} unit="px" onChange={(v) => set("buttonBorderRadius", v)} /></Row>
            <Row><Label>Font size</Label><NumericInput value={props.buttonFontSize ?? 14} min={10} max={20} unit="px" onChange={(v) => set("buttonFontSize", v)} /></Row>
            <Toggle checked={!!props.buttonFullWidth} onChange={(v) => set("buttonFullWidth", v)} label="Full width button" />
          </>
        )}
      </DesignSection>

    </div>
  );
};
