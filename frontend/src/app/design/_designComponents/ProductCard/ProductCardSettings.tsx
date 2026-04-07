"use client";

import React, { useEffect, useState } from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../_context/DesignProjectContext";
import type { ProductCardProps } from "./ProductCard";
import { Package, ChevronDown } from "lucide-react";

// ── Shared primitives ────────────────────────────────────────────────────────

const Row = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-center gap-2 mb-2 ${className}`}>{children}</div>
);
const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] text-[var(--builder-text-muted)] w-24 shrink-0">{children}</span>
);
const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
    <div
      onClick={() => onChange(!checked)}
      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? "bg-[var(--builder-accent)] border-[var(--builder-accent)]" : "border-[var(--builder-border-mid)] bg-transparent"}`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
    <span className="text-[12px] text-[var(--builder-text)]">{label}</span>
  </label>
);

// ── Settings ─────────────────────────────────────────────────────────────────

export const ProductCardSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as ProductCardProps }));
  const { projectSubdomain } = useDesignProject();
  const [products, setProducts] = useState<ApiProduct[]>([]);

  const set = <K extends keyof ProductCardProps>(key: K, val: ProductCardProps[K]) =>
    setProp((p: ProductCardProps) => { p[key] = val; });

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

        {/* Product picker */}
        <div className="relative mb-3">
          <select
            value={props.boundProductId ?? ""}
            onChange={(e) => set("boundProductId", e.target.value || undefined)}
            className="w-full h-8 rounded-lg px-3 pr-8 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)] appearance-none cursor-pointer"
          >
            <option value="">— No product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--builder-text-muted)] pointer-events-none" />
        </div>

        {/* Bound product preview */}
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
          <p className="text-[11px] text-[var(--builder-text-faint)] text-center py-2">
            No products found in your store.
          </p>
        )}
      </DesignSection>

      {/* ── Layout ── */}
      <DesignSection title="Layout" defaultOpen>
        <Toggle checked={!!props.showImage} onChange={(v) => set("showImage", v)} label="Product image" />
        {props.showImage && (
          <div className="pl-6 flex flex-col gap-1.5 mt-1 mb-1">
            <Row>
              <Label>Height</Label>
              <NumericInput value={props.imageHeight ?? 240} min={80} max={600} unit="px" onChange={(v) => set("imageHeight", v)} />
            </Row>
            <Row>
              <Label>Fit</Label>
              <select
                value={props.imageObjectFit ?? "cover"}
                onChange={(e) => set("imageObjectFit", e.target.value as any)}
                className="flex-1 h-7 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </Row>
          </div>
        )}
        <Toggle checked={!!props.showProductName} onChange={(v) => set("showProductName", v)} label="Product name" />
        <Toggle checked={!!props.showDivider} onChange={(v) => set("showDivider", v)} label="Name & price divider" />
        <Toggle checked={!!props.showPrice} onChange={(v) => set("showPrice", v)} label="Product price" />
        <Toggle checked={!!props.showDescription} onChange={(v) => set("showDescription", v)} label="Description" />
        {props.showDescription && (
          <div className="pl-6 mb-1">
            <Row>
              <Label>Max lines</Label>
              <NumericInput value={props.descriptionLines ?? 2} min={1} max={6} onChange={(v) => set("descriptionLines", v)} />
            </Row>
          </div>
        )}
        <Toggle checked={!!props.showDiscountBadge} onChange={(v) => set("showDiscountBadge", v)} label="Discount badge" />
        <Toggle checked={!!props.showRibbon} onChange={(v) => set("showRibbon", v)} label="Ribbon" />
        {props.showRibbon && (
          <div className="pl-6 flex flex-col gap-1.5 mt-1 mb-1">
            <Row>
              <Label>Text</Label>
              <input
                className="flex-1 h-7 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
                value={props.ribbonText ?? "Sale"}
                onChange={(e) => set("ribbonText", e.target.value)}
              />
            </Row>
            <Row>
              <Label>Color</Label>
              <ColorPicker value={props.ribbonColor ?? "#ef4444"} onChange={(v) => set("ribbonColor", v)} />
            </Row>
          </div>
        )}
        <Toggle checked={!!props.showAddToCart} onChange={(v) => set("showAddToCart", v)} label="Add to Cart button" />
        <Toggle checked={!!props.showQuickView} onChange={(v) => set("showQuickView", v)} label="Quick View button" />
      </DesignSection>

      {/* ── Design ── */}
      <DesignSection title="Design" defaultOpen={false}>

        {/* Card */}
        <p className="text-[10px] text-[var(--builder-text-faint)] mb-1.5 uppercase tracking-wider font-semibold">Card</p>
        <Row>
          <Label>Width</Label>
          <input
            className="flex-1 h-7 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
            value={props.width ?? "280px"}
            onChange={(e) => set("width", e.target.value)}
          />
        </Row>
        <Row>
          <Label>Background</Label>
          <ColorPicker value={props.cardBackground ?? "#ffffff"} onChange={(v) => set("cardBackground", v)} />
        </Row>
        <Row>
          <Label>Border color</Label>
          <ColorPicker value={props.cardBorderColor ?? "#e5e7eb"} onChange={(v) => set("cardBorderColor", v)} />
        </Row>
        <Row>
          <Label>Border width</Label>
          <NumericInput value={props.cardBorderWidth ?? 1} min={0} max={8} unit="px" onChange={(v) => set("cardBorderWidth", v)} />
        </Row>
        <Row>
          <Label>Radius</Label>
          <NumericInput value={props.cardBorderRadius ?? 10} min={0} max={40} unit="px" onChange={(v) => set("cardBorderRadius", v)} />
        </Row>
        <Row>
          <Label>Padding</Label>
          <NumericInput value={props.cardPadding ?? 12} min={0} max={48} unit="px" onChange={(v) => set("cardPadding", v)} />
        </Row>

        {/* Text */}
        <p className="text-[10px] text-[var(--builder-text-faint)] mb-1.5 mt-3 uppercase tracking-wider font-semibold">Text</p>
        <Row>
          <Label>Name size</Label>
          <NumericInput value={props.nameFontSize ?? 14} min={10} max={32} unit="px" onChange={(v) => set("nameFontSize", v)} />
        </Row>
        <Row>
          <Label>Name color</Label>
          <ColorPicker value={props.nameColor ?? "#111827"} onChange={(v) => set("nameColor", v)} />
        </Row>
        <Row>
          <Label>Name weight</Label>
          <select
            value={props.nameFontWeight ?? "700"}
            onChange={(e) => set("nameFontWeight", e.target.value)}
            className="flex-1 h-7 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none"
          >
            {["400", "500", "600", "700", "800"].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </Row>
        <Row>
          <Label>Price size</Label>
          <NumericInput value={props.priceFontSize ?? 14} min={10} max={28} unit="px" onChange={(v) => set("priceFontSize", v)} />
        </Row>
        <Row>
          <Label>Price color</Label>
          <ColorPicker value={props.priceColor ?? "#111827"} onChange={(v) => set("priceColor", v)} />
        </Row>

        {/* Button */}
        {props.showAddToCart && (
          <>
            <p className="text-[10px] text-[var(--builder-text-faint)] mb-1.5 mt-3 uppercase tracking-wider font-semibold">Button</p>
            <Row>
              <Label>Label</Label>
              <input
                className="flex-1 h-7 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
                value={props.buttonLabel ?? "Add to Cart"}
                onChange={(e) => set("buttonLabel", e.target.value)}
              />
            </Row>
            <Row>
              <Label>Background</Label>
              <ColorPicker value={props.buttonBackground ?? "#111827"} onChange={(v) => set("buttonBackground", v)} />
            </Row>
            <Row>
              <Label>Text color</Label>
              <ColorPicker value={props.buttonTextColor ?? "#ffffff"} onChange={(v) => set("buttonTextColor", v)} />
            </Row>
            <Row>
              <Label>Border color</Label>
              <ColorPicker value={props.buttonBorderColor ?? "transparent"} onChange={(v) => set("buttonBorderColor", v)} />
            </Row>
            <Row>
              <Label>Border width</Label>
              <NumericInput value={props.buttonBorderWidth ?? 0} min={0} max={4} unit="px" onChange={(v) => set("buttonBorderWidth", v)} />
            </Row>
            <Row>
              <Label>Radius</Label>
              <NumericInput value={props.buttonBorderRadius ?? 6} min={0} max={50} unit="px" onChange={(v) => set("buttonBorderRadius", v)} />
            </Row>
            <Row>
              <Label>Font size</Label>
              <NumericInput value={props.buttonFontSize ?? 13} min={10} max={20} unit="px" onChange={(v) => set("buttonFontSize", v)} />
            </Row>
          </>
        )}
      </DesignSection>

    </div>
  );
};
