"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../_context/DesignProjectContext";
import type { ProductSliderProps, ProductSliderSourceMode } from "./ProductSlider";

// ── Reusable primitives ──────────────────────────────────────────────────────

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-2">{children}</div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] text-[var(--builder-text-muted)] w-24 shrink-0">{children}</span>
);

const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => (
  <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
    <div
      onClick={() => onChange(!checked)}
      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
        checked ? "bg-[var(--builder-accent)] border-[var(--builder-accent)]" : "border-[var(--builder-border-mid)] bg-transparent"
      }`}
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

const AlignButtons = ({
  value,
  onChange,
}: {
  value: "left" | "center" | "right";
  onChange: (v: "left" | "center" | "right") => void;
}) => (
  <div className="flex gap-1">
    {(["left", "center", "right"] as const).map((a) => (
      <button
        key={a}
        type="button"
        onClick={() => onChange(a)}
        className={`px-2 py-1 rounded text-[10px] font-semibold uppercase transition-colors ${
          value === a
            ? "bg-[var(--builder-accent)] text-white"
            : "bg-[var(--builder-surface-3)] text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
        }`}
      >
        {a[0].toUpperCase()}
      </button>
    ))}
  </div>
);

// ── Settings component ───────────────────────────────────────────────────────

export const ProductSliderSettings = () => {
  const { props, actions: { setProp } } = useNode((node) => ({ props: node.data.props as ProductSliderProps }));
  const { projectSubdomain } = useDesignProject();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [productToAdd, setProductToAdd] = useState("");

  const set = <K extends keyof ProductSliderProps>(key: K, val: ProductSliderProps[K]) =>
    setProp((p: ProductSliderProps) => { p[key] = val; });

  useEffect(() => {
    let cancelled = false;

    listProducts({ subdomain: projectSubdomain ?? undefined, status: "active", limit: 500 })
      .then((res) => {
        if (!cancelled) setProducts(res.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [projectSubdomain]);

  const sourceMode: ProductSliderSourceMode = props.productSourceMode === "manual" ? "manual" : "auto";
  const selectedProductIds = useMemo(
    () => (Array.isArray(props.selectedProductIds) ? props.selectedProductIds.map((id) => String(id || "").trim()).filter(Boolean) : []),
    [props.selectedProductIds]
  );

  const selectedProductSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds]);

  const selectedProductEntries = useMemo(
    () => selectedProductIds.map((id) => {
      const product = products.find((item) => String(item.id) === id);
      return { id, label: product?.name ?? `Unavailable product (${id.slice(0, 8)})` };
    }),
    [products, selectedProductIds]
  );

  const selectableProducts = useMemo(
    () => products.filter((product) => !selectedProductSet.has(String(product.id))),
    [products, selectedProductSet]
  );

  const upsertSelectedProductIds = (next: string[]) => {
    const normalized = Array.from(new Set(next.map((id) => String(id || "").trim()).filter(Boolean)));
    set("selectedProductIds", normalized);
  };

  const addSelectedProduct = (productId: string) => {
    const normalized = String(productId || "").trim();
    if (!normalized) return;
    upsertSelectedProductIds([...selectedProductIds, normalized]);
  };

  const removeSelectedProduct = (productId: string) => {
    const normalized = String(productId || "").trim();
    if (!normalized) return;
    upsertSelectedProductIds(selectedProductIds.filter((id) => id !== normalized));
  };

  const moveSelectedProduct = (index: number, direction: "up" | "down") => {
    const nextIds = [...selectedProductIds];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextIds.length) return;
    [nextIds[index], nextIds[targetIndex]] = [nextIds[targetIndex], nextIds[index]];
    upsertSelectedProductIds(nextIds);
  };

  return (
    <div className="flex flex-col gap-0">

      {/* ── Products ── */}
      <DesignSection title="Products" defaultOpen>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--builder-text-faint)]">
          Choose how products are displayed
        </p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {([
            { value: "auto", label: "Auto" },
            { value: "manual", label: "Manual" },
          ] as Array<{ value: ProductSliderSourceMode; label: string }>).map((option) => {
            const active = sourceMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => set("productSourceMode", option.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10 text-[var(--builder-text)]"
                    : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] text-[var(--builder-text-muted)] hover:border-[var(--builder-border-mid)]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {sourceMode === "manual" ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-[11px] text-[var(--builder-text-muted)]">
              Add products one by one to control exactly what appears in this slider.
            </p>

            <div className="flex gap-2">
              <select
                value={productToAdd}
                onChange={(event) => setProductToAdd(event.target.value)}
                title="Select product"
                className="h-8 flex-1 rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)] focus:border-[var(--builder-accent)] focus:outline-none"
              >
                <option value="">Select product</option>
                {selectableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!productToAdd) return;
                  addSelectedProduct(productToAdd);
                  setProductToAdd("");
                }}
                className="h-8 rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-3 text-xs font-semibold text-[var(--builder-text)] hover:border-[var(--builder-border-mid)]"
              >
                Add
              </button>
            </div>

            <div className="mt-1 rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)] p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--builder-text)]">Selected products</span>
                <button
                  type="button"
                  onClick={() => upsertSelectedProductIds([])}
                  className="text-[10px] font-semibold text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
                >
                  Clear
                </button>
              </div>

              {selectedProductEntries.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {selectedProductEntries.map((entry, idx) => (
                      <span
                        key={`${entry.id}-${idx}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--builder-border-mid)] bg-[var(--builder-surface-3)] px-2 py-0.5 text-[10px] text-[var(--builder-text)]"
                      >
                        <div className="flex gap-0.5 mr-0.5 border-r border-[var(--builder-border)] pr-1">
                          <button
                            type="button"
                            onClick={() => moveSelectedProduct(idx, "up")}
                            disabled={idx === 0}
                            className="text-[10px] text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] disabled:opacity-30"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSelectedProduct(idx, "down")}
                            disabled={idx === selectedProductEntries.length - 1}
                            className="text-[10px] text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] disabled:opacity-30"
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>
                        <span className="max-w-[120px] truncate">{entry.label}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedProduct(entry.id)}
                          className="ml-0.5 text-[10px] font-bold text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
                          aria-label={`Remove ${entry.label}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              ) : (
                <p className="m-0 text-[10px] text-[var(--builder-text-faint)]">No products selected yet.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="m-0 text-[11px] text-[var(--builder-text-muted)]">
            Auto mode shows all active products from this project.
          </p>
        )}
      </DesignSection>

      {/* ── General ── */}
      <DesignSection title="General" defaultOpen>
        <Toggle checked={!!props.showTitle} onChange={(v) => set("showTitle", v)} label="Gallery title" />
        <div className="pl-6 flex flex-col gap-1.5 mt-1">
          <Row>
            <Label>Title text</Label>
            <input
              className="flex-1 h-7 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
              value={props.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
            />
          </Row>
          {props.showTitle && (
            <>
              <Row>
                <Label>Font size</Label>
                <NumericInput value={props.titleFontSize ?? 28} min={12} max={72} unit="px" onChange={(v) => set("titleFontSize", v)} />
              </Row>
              <Row>
                <Label>Color</Label>
                <ColorPicker value={props.titleColor ?? "#111827"} onChange={(v) => set("titleColor", v)} />
              </Row>
              <Row>
                <Label>Align</Label>
                <AlignButtons value={(props.titleAlign as any) ?? "center"} onChange={(v) => set("titleAlign", v)} />
              </Row>
            </>
          )}
        </div>
      </DesignSection>

      {/* ── Product cards ── */}
      <DesignSection title="Product cards" defaultOpen>
        <Toggle checked={!!props.showProductName} onChange={(v) => set("showProductName", v)} label="Product name" />
        <Toggle checked={!!props.showDivider} onChange={(v) => set("showDivider", v)} label="Name & price divider" />
        <Toggle checked={!!props.showPrice} onChange={(v) => set("showPrice", v)} label="Product price" />
        <Toggle checked={!!props.showDiscountBadge} onChange={(v) => set("showDiscountBadge", v)} label="Discount badge" />
        <Toggle checked={!!props.showRibbon} onChange={(v) => set("showRibbon", v)} label="Ribbon" />
        {props.showRibbon && (
          <div className="pl-6 flex flex-col gap-1.5 mt-1 mb-1">
            <Row>
              <Label>Ribbon text</Label>
              <input
                className="flex-1 h-7 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
                value={props.ribbonText ?? "Sale"}
                onChange={(e) => set("ribbonText", e.target.value)}
              />
            </Row>
            <Row>
              <Label>Ribbon color</Label>
              <ColorPicker value={props.ribbonColor ?? "#ef4444"} onChange={(v) => set("ribbonColor", v)} />
            </Row>
          </div>
        )}
        <Toggle checked={!!props.showDescription} onChange={(v) => set("showDescription", v)} label="Product description" />
      </DesignSection>

      {/* ── Add to Cart button ── */}
      <DesignSection title="Add to Cart button" defaultOpen>
        <Toggle checked={!!props.showAddToCart} onChange={(v) => set("showAddToCart", v)} label="Add to Cart button" />
        {props.showAddToCart && (
          <div className="pl-6 flex flex-col gap-1.5 mt-1">
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
              <Label>Radius</Label>
              <NumericInput value={props.buttonBorderRadius ?? 6} min={0} max={50} unit="px" onChange={(v) => set("buttonBorderRadius", v)} />
            </Row>
          </div>
        )}
        <Toggle checked={!!props.showQuickView} onChange={(v) => set("showQuickView", v)} label="Quick View button" />
      </DesignSection>

      {/* ── Layout ── */}
      <DesignSection title="Layout" defaultOpen={false}>
        <Row>
          <Label>Header Align</Label>
          <AlignButtons value={props.titleAlign || "left"} onChange={(v) => set("titleAlign", v)} />
        </Row>
        <Row>
          <Label>Card Align</Label>
          <AlignButtons value={props.cardAlign || "left"} onChange={(v) => set("cardAlign", v)} />
        </Row>
        <Row>
          <Label>Card width</Label>
          <NumericInput value={props.cardWidth ?? 240} min={160} max={480} unit="px" onChange={(v) => set("cardWidth", v)} />
        </Row>
        <Row>
          <Label>Image height</Label>
          <NumericInput value={props.imageHeight ?? 220} min={80} max={480} unit="px" onChange={(v) => set("imageHeight", v)} />
        </Row>
        <Row>
          <Label>Card radius</Label>
          <NumericInput value={props.cardBorderRadius ?? 8} min={0} max={32} unit="px" onChange={(v) => set("cardBorderRadius", v)} />
        </Row>
        <Row>
          <Label>Gap</Label>
          <NumericInput value={props.gap ?? 18} min={0} max={64} unit="px" onChange={(v) => set("gap", v)} />
        </Row>
        <Row>
          <Label>Padding T</Label>
          <NumericInput value={props.paddingTop ?? 48} min={0} max={200} unit="px" onChange={(v) => set("paddingTop", v)} />
        </Row>
        <Row>
          <Label>Padding B</Label>
          <NumericInput value={props.paddingBottom ?? 48} min={0} max={200} unit="px" onChange={(v) => set("paddingBottom", v)} />
        </Row>
        <Row>
          <Label>Padding L</Label>
          <NumericInput value={props.paddingLeft ?? 24} min={0} max={200} unit="px" onChange={(v) => set("paddingLeft", v)} />
        </Row>
        <Row>
          <Label>Padding R</Label>
          <NumericInput value={props.paddingRight ?? 24} min={0} max={200} unit="px" onChange={(v) => set("paddingRight", v)} />
        </Row>
      </DesignSection>

      {/* ── Appearance ── */}
      <DesignSection title="Appearance" defaultOpen={false}>
        <Row>
          <Label>Background</Label>
          <ColorPicker value={props.background ?? "#f9fafb"} onChange={(v) => set("background", v)} />
        </Row>
        <Row>
          <Label>Card fill</Label>
          <ColorPicker value={props.cardBackground ?? "#ffffff"} onChange={(v) => set("cardBackground", v)} />
        </Row>
        <Row>
          <Label>Card border</Label>
          <ColorPicker value={props.cardBorderColor ?? "#e5e7eb"} onChange={(v) => set("cardBorderColor", v)} />
        </Row>
      </DesignSection>

    </div>
  );
};
