"use client";

import React from "react";
import { useNode, useEditor } from "@craftjs/core";
import { listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../../design/_context/DesignProjectContext";
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { TemplateEntry } from "../../_types";

type FeaturedProductSourceMode = "auto" | "manual";

interface FeaturedProductProps {
  title?: string;
  subtitle?: string;
  maxItems?: number;
  productSourceMode?: FeaturedProductSourceMode;
  selectedProductIds?: string[];
  background?: string;
  cardBackground?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  showProductName?: boolean;
  showDivider?: boolean;
  showPrice?: boolean;
  showComparePrice?: boolean;
  showDiscountBadge?: boolean;
  showDescription?: boolean;
  descriptionLines?: number;
  showSku?: boolean;
  showStock?: boolean;
  showAddToCart?: boolean;
  showQuantitySelector?: boolean;
}

const BADGE_LABELS = ["NEW ARRIVAL", "BEST SELLER", "EDITOR'S PICK"];
const BADGE_COLORS = ["#C2410C", "#A16207", "#1D4ED8"];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(price);

const Row = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-center gap-2 mb-2 ${className}`}>{children}</div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] text-[var(--builder-text-muted)] w-24 shrink-0">{children}</span>
);

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) => (
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

const getStockStatus = (product: ApiProduct) => {
  const available = product.availableStock ?? product.stock ?? product.onHandStock ?? 0;
  const lowThreshold = product.lowStockThreshold ?? 0;

  if (available <= 0) return "Out of Stock";
  if (lowThreshold > 0 && available <= lowThreshold) return "Low Stock";
  return "In Stock";
};

function getDisplayedProducts(
  products: ApiProduct[],
  mode: FeaturedProductSourceMode,
  selectedIds: string[],
  maxItems: number
): ApiProduct[] {
  const limitedMax = Math.max(1, Math.min(maxItems, 6));
  if (mode === "auto") {
    return products.slice(0, limitedMax);
  }

  const byId = new Map(products.map((product) => [String(product.id), product]));
  const manual = selectedIds
    .map((id) => byId.get(String(id)))
    .filter((product): product is ApiProduct => Boolean(product));

  return manual.slice(0, limitedMax);
}

export function FeaturedProductCanvas({
  title = "Featured Products",
  subtitle = "Handpicked pieces worth every peso.",
  maxItems = 3,
  productSourceMode = "auto",
  selectedProductIds = [],
  background = "#F7F4F0",
  cardBackground = "#FFFFFF",
  paddingTop = 24,
  paddingRight = 24,
  paddingBottom = 12,
  paddingLeft = 24,
  showProductName = true,
  showDivider = true,
  showPrice = true,
  showComparePrice = true,
  showDiscountBadge = true,
  showDescription = true,
  descriptionLines = 6,
  showSku = false,
  showStock = false,
  showAddToCart = true,
  showQuantitySelector = false,
}: FeaturedProductProps) {
  const { connectors, actions: { setProp } } = useNode();
  const { enabled } = useEditor((s) => ({ enabled: s.options.enabled }));
  const { projectSubdomain } = useDesignProject();
  const [products, setProducts] = React.useState<ApiProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [qty, setQty] = React.useState(1);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listProducts({ subdomain: projectSubdomain ?? undefined, status: "active", limit: 500 })
      .then((res) => {
        if (!cancelled) setProducts(res.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectSubdomain]);

  const selectedIds = React.useMemo(
    () => (Array.isArray(selectedProductIds) ? selectedProductIds.map((id) => String(id || "").trim()).filter(Boolean) : []),
    [selectedProductIds]
  );

  const displayedProducts = React.useMemo(
    () => getDisplayedProducts(products, productSourceMode, selectedIds, maxItems),
    [maxItems, productSourceMode, products, selectedIds]
  );

  const isEmpty = !loading && displayedProducts.length === 0;

  return (
    <section
      ref={(ref) => {
        if (ref) connectors.connect(connectors.drag(ref));
      }}
      style={{
        width: "100%",
        background,
        padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 8 }}>
        <h2
          data-inline-text-edit
          suppressContentEditableWarning
          contentEditable={enabled}
          onBlur={(event) => {
            const next = String(event.currentTarget.innerText || "").trim() || "Featured Products";
            setProp((props: FeaturedProductProps) => {
              props.title = next;
            });
          }}
          style={{ margin: 0, fontSize: 32, fontWeight: 700, lineHeight: 1.15, color: "#111827" }}
        >
          {title}
        </h2>
        <p
          data-inline-text-edit
          suppressContentEditableWarning
          contentEditable={enabled}
          onBlur={(event) => {
            const next = String(event.currentTarget.innerText || "").trim() || "Handpicked pieces worth every peso.";
            setProp((props: FeaturedProductProps) => {
              props.subtitle = next;
            });
          }}
          style={{ margin: 0, fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: "#9CA3AF" }}
        >
          {subtitle}
        </p>
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map((index) => (
            <div key={index} style={{ borderRadius: 8, background: "#e5e7eb", minHeight: 360 }} />
          ))}
        </div>
      )}

      {isEmpty && enabled && (
        <div
          style={{
            border: "2px dashed #d1d5db",
            borderRadius: 12,
            padding: 24,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 14,
          }}
        >
          {productSourceMode === "manual"
            ? (selectedIds.length > 0
              ? "Selected products are unavailable."
              : "No products selected yet. Open Featured Product settings and add products.")
            : "No active products found for this project."}
        </div>
      )}

      {!loading && !isEmpty && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {displayedProducts.map((product, index) => {
            const image = product.images?.[0] ?? "";
            const price = product.finalPrice ?? product.price ?? 0;
            const compareAt = product.compareAtPrice;
            const hasDiscount = !!compareAt && compareAt > price;
            const stockStatus = getStockStatus(product);

            return (
              <article
                key={product.id}
                style={{
                  background: cardBackground,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ position: "relative", width: "100%", height: "clamp(180px, 22vw, 260px)", background: "#F7F4F0" }}>
                  {image ? (
                    <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>
                      No image
                    </div>
                  )}
                  {showDiscountBadge && (
                    <span
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: BADGE_COLORS[index % BADGE_COLORS.length],
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 1,
                        padding: "5px 12px",
                      }}
                    >
                      {hasDiscount
                        ? `${Math.max(1, Math.round(((compareAt! - price) / compareAt!) * 100))}% OFF`
                        : BADGE_LABELS[index % BADGE_LABELS.length]}
                    </span>
                  )}
                </div>

                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {showProductName && (
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                        {product.name}
                      </h3>
                    )}
                    {showDivider && showProductName && showPrice && (
                      <div style={{ width: 44, height: 2, background: "#E5E7EB", borderRadius: 999 }} />
                    )}
                    {showDescription && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "#9CA3AF",
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: descriptionLines,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product.description || "Store highlight product"}
                      </p>
                    )}
                    {showSku && product.sku && (
                      <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF", lineHeight: 1.4 }}>
                        SKU: {product.sku}
                      </p>
                    )}
                    {showStock && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          fontWeight: 700,
                          lineHeight: 1.4,
                          color: stockStatus === "Out of Stock" ? "#DC2626" : stockStatus === "Low Stock" ? "#D97706" : "#16A34A",
                        }}
                      >
                        {stockStatus}
                      </p>
                    )}
                  </div>

                  {(showPrice || showAddToCart) && (
                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                      {showPrice && (
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                            {formatPrice(price)}
                          </span>
                          {showComparePrice && hasDiscount && (
                            <span style={{ fontSize: 12, fontWeight: 400, color: "#D1D5DB", lineHeight: 1, textDecoration: "line-through" }}>
                              {formatPrice(compareAt || 0)}
                            </span>
                          )}
                        </div>
                      )}

                      {showAddToCart && (
                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          {showQuantitySelector && (
                            <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                              <button type="button" onClick={() => setQty((current) => Math.max(1, current - 1))} style={{ width: 32, height: 40, background: "#F9FAFB", border: "none", cursor: "pointer", fontSize: 16, color: "#374151" }}>-</button>
                              <span style={{ width: 36, textAlign: "center", fontSize: 13, fontWeight: 600, color: "#111827" }}>{qty}</span>
                              <button type="button" onClick={() => setQty((current) => current + 1)} style={{ width: 32, height: 40, background: "#F9FAFB", border: "none", cursor: "pointer", fontSize: 16, color: "#374151" }}>+</button>
                            </div>
                          )}
                          <button
                            type="button"
                            style={{
                              flex: 1,
                              minWidth: 120,
                              background: "#111827",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 700,
                              border: "none",
                              padding: "10px 18px",
                              cursor: "pointer",
                            }}
                          >
                            Add to Cart
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export const FeaturedProductSettings = () => {
  const {
    productSourceMode,
    selectedProductIds,
    maxItems,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    showProductName,
    showDivider,
    showPrice,
    showComparePrice,
    showDiscountBadge,
    showDescription,
    descriptionLines,
    showSku,
    showStock,
    showAddToCart,
    showQuantitySelector,
    actions: { setProp },
  } = useNode((node) => ({
    productSourceMode: (node.data.props.productSourceMode as FeaturedProductSourceMode | undefined) || "auto",
    selectedProductIds: (node.data.props.selectedProductIds as string[] | undefined) || [],
    maxItems: (node.data.props.maxItems as number | undefined) || 3,
    paddingTop: (node.data.props.paddingTop as number | undefined) ?? 24,
    paddingRight: (node.data.props.paddingRight as number | undefined) ?? 24,
    paddingBottom: (node.data.props.paddingBottom as number | undefined) ?? 12,
    paddingLeft: (node.data.props.paddingLeft as number | undefined) ?? 24,
    showProductName: (node.data.props.showProductName as boolean | undefined) ?? true,
    showDivider: (node.data.props.showDivider as boolean | undefined) ?? true,
    showPrice: (node.data.props.showPrice as boolean | undefined) ?? true,
    showComparePrice: (node.data.props.showComparePrice as boolean | undefined) ?? true,
    showDiscountBadge: (node.data.props.showDiscountBadge as boolean | undefined) ?? true,
    showDescription: (node.data.props.showDescription as boolean | undefined) ?? true,
    descriptionLines: (node.data.props.descriptionLines as number | undefined) ?? 6,
    showSku: (node.data.props.showSku as boolean | undefined) ?? false,
    showStock: (node.data.props.showStock as boolean | undefined) ?? false,
    showAddToCart: (node.data.props.showAddToCart as boolean | undefined) ?? true,
    showQuantitySelector: (node.data.props.showQuantitySelector as boolean | undefined) ?? false,
  }));

  const { projectSubdomain } = useDesignProject();
  const [products, setProducts] = React.useState<ApiProduct[]>([]);
  const [productToAdd, setProductToAdd] = React.useState("");

  React.useEffect(() => {
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

  const selectedIds = React.useMemo(
    () => (Array.isArray(selectedProductIds) ? selectedProductIds.map((id) => String(id || "").trim()).filter(Boolean) : []),
    [selectedProductIds]
  );

  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedEntries = React.useMemo(
    () => selectedIds.map((id) => {
      const product = products.find((item) => String(item.id) === id);
      return { id, label: product?.name ?? `Unavailable product (${id.slice(0, 8)})` };
    }),
    [products, selectedIds]
  );

  const selectableProducts = React.useMemo(
    () => products.filter((product) => !selectedSet.has(String(product.id))),
    [products, selectedSet]
  );

  const upsertSelectedIds = (next: string[]) => {
    const normalized = Array.from(new Set(next.map((id) => String(id || "").trim()).filter(Boolean)));
    setProp((props: FeaturedProductProps) => {
      props.selectedProductIds = normalized;
    });
  };

  const addProduct = (productId: string) => {
    const normalized = String(productId || "").trim();
    if (!normalized) return;
    upsertSelectedIds([...selectedIds, normalized]);
  };

  const removeProduct = (productId: string) => {
    const normalized = String(productId || "").trim();
    if (!normalized) return;
    upsertSelectedIds(selectedIds.filter((id) => id !== normalized));
  };

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Products" defaultOpen>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--builder-text-faint)]">
          Choose how featured items are sourced
        </p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {([
            { value: "auto", label: "Auto" },
            { value: "manual", label: "Manual" },
          ] as Array<{ value: FeaturedProductSourceMode; label: string }>).map((option) => {
            const active = productSourceMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setProp((props: FeaturedProductProps) => {
                    props.productSourceMode = option.value;
                  });
                }}
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

        {productSourceMode === "manual" ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-[11px] text-[var(--builder-text-muted)]">Add products in order. The first items are shown as featured cards.</p>

            <div className="flex gap-2">
              <select
                value={productToAdd}
                onChange={(event) => setProductToAdd(event.target.value)}
                title="Select product"
                className="h-8 flex-1 rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)] focus:border-[var(--builder-accent)] focus:outline-none"
              >
                <option value="">Select product</option>
                {selectableProducts.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!productToAdd) return;
                  addProduct(productToAdd);
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
                  onClick={() => upsertSelectedIds([])}
                  className="text-[10px] font-semibold text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
                >
                  Clear
                </button>
              </div>

              {selectedEntries.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedEntries.map((entry) => (
                    <span
                      key={entry.id}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--builder-border-mid)] bg-[var(--builder-surface-3)] px-2 py-0.5 text-[10px] text-[var(--builder-text)]"
                    >
                      {entry.label}
                      <button
                        type="button"
                        onClick={() => removeProduct(entry.id)}
                        className="text-[10px] font-bold leading-none text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
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
          <p className="m-0 text-[11px] text-[var(--builder-text-muted)]">Auto mode shows the first active products from this project.</p>
        )}
      </DesignSection>

      <DesignSection title="Layout" defaultOpen={false}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-[var(--builder-text-muted)] w-24 shrink-0">Cards shown</span>
          <input
            type="number"
            min={1}
            max={6}
            value={maxItems}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value || "3", 10);
              const safe = Number.isFinite(next) ? Math.max(1, Math.min(next, 6)) : 3;
              setProp((props: FeaturedProductProps) => {
                props.maxItems = safe;
              });
            }}
            className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
          />
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--builder-text-faint)]">Spacing</p>
        <Row>
          <Label>Top</Label>
          <input type="number" min={0} max={200} value={paddingTop} onChange={(event) => setProp((props: FeaturedProductProps) => { props.paddingTop = Number.parseInt(event.target.value || "0", 10) || 0; })} className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]" />
        </Row>
        <Row>
          <Label>Right</Label>
          <input type="number" min={0} max={200} value={paddingRight} onChange={(event) => setProp((props: FeaturedProductProps) => { props.paddingRight = Number.parseInt(event.target.value || "0", 10) || 0; })} className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]" />
        </Row>
        <Row>
          <Label>Bottom</Label>
          <input type="number" min={0} max={200} value={paddingBottom} onChange={(event) => setProp((props: FeaturedProductProps) => { props.paddingBottom = Number.parseInt(event.target.value || "0", 10) || 0; })} className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]" />
        </Row>
        <Row>
          <Label>Left</Label>
          <input type="number" min={0} max={200} value={paddingLeft} onChange={(event) => setProp((props: FeaturedProductProps) => { props.paddingLeft = Number.parseInt(event.target.value || "0", 10) || 0; })} className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]" />
        </Row>
      </DesignSection>

      <DesignSection title="What's Displayed" defaultOpen>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--builder-text-faint)]">
          Configure the featured product card content
        </p>

        <Toggle checked={!!showProductName} onChange={(value) => setProp((props: FeaturedProductProps) => { props.showProductName = value; })} label="Product name" />
        <Toggle checked={!!showDivider} onChange={(value) => setProp((props: FeaturedProductProps) => { props.showDivider = value; })} label="Name & price divider" />
        <Toggle checked={!!showPrice} onChange={(value) => setProp((props: FeaturedProductProps) => { props.showPrice = value; })} label="Product price" />
        {showPrice && (
          <Toggle checked={!!showComparePrice} onChange={(value) => setProp((props: FeaturedProductProps) => { props.showComparePrice = value; })} label="Compare-at price" />
        )}
        <Toggle checked={!!showDiscountBadge} onChange={(value) => setProp((props: FeaturedProductProps) => { props.showDiscountBadge = value; })} label="Discount badge" />
        <Toggle checked={!!showDescription} onChange={(value) => setProp((props: FeaturedProductProps) => { props.showDescription = value; })} label="Description" />
        {showDescription && (
          <div className="pl-6 mb-1">
            <Row>
              <Label>Max lines</Label>
              <input
                type="number"
                min={1}
                max={6}
                value={descriptionLines ?? 6}
                onChange={(event) => {
                  const next = Number.parseInt(event.target.value || "6", 10);
                  const safe = Number.isFinite(next) ? Math.max(1, Math.min(next, 6)) : 6;
                  setProp((props: FeaturedProductProps) => {
                    props.descriptionLines = safe;
                  });
                }}
                className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
              />
            </Row>
          </div>
        )}
        <Toggle checked={!!showSku} onChange={(value) => setProp((props: FeaturedProductProps) => { props.showSku = value; })} label="SKU" />
        <Toggle checked={!!showStock} onChange={(value) => setProp((props: FeaturedProductProps) => { props.showStock = value; })} label="Stock status" />
        <Toggle checked={!!showAddToCart} onChange={(value) => setProp((props: FeaturedProductProps) => { props.showAddToCart = value; })} label="Add to Cart button" />
        {showAddToCart && (
          <Toggle checked={!!showQuantitySelector} onChange={(value) => setProp((props: FeaturedProductProps) => { props.showQuantitySelector = value; })} label="Quantity selector" />
        )}
      </DesignSection>
    </div>
  );
};

FeaturedProductCanvas.craft = {
  displayName: "Featured Product",
  props: {
    title: "Featured Products",
    subtitle: "Handpicked pieces worth every peso.",
    maxItems: 3,
    productSourceMode: "auto",
    selectedProductIds: [],
    background: "#F7F4F0",
    cardBackground: "#FFFFFF",
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 12,
    paddingLeft: 24,
    showProductName: true,
    showDivider: true,
    showPrice: true,
    showComparePrice: true,
    showDiscountBadge: true,
    showDescription: true,
    descriptionLines: 6,
    showSku: false,
    showStock: false,
    showAddToCart: true,
    showQuantitySelector: false,
  },
  related: {
    settings: FeaturedProductSettings,
  },
  rules: {
    canDrag: () => true,
  },
  isCanvas: false,
};

export const FeaturedProduct: TemplateEntry = {
  label: "Featured Product",
  description: "Three featured products with display toggles, badges, price, and add to cart button",
  preview: "🏷️",
  category: "card",
  element: React.createElement(FeaturedProductCanvas),
};
