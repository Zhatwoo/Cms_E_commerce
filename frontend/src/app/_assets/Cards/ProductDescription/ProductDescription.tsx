"use client";

import React from "react";
import { useEditor, useNode } from "@craftjs/core";
import { listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../../design/_context/DesignProjectContext";
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { TemplateEntry } from "../../_types";

type ProductDescriptionSourceMode = "auto" | "manual";

interface ProductDescriptionCanvasProps {
  productSourceMode?: ProductDescriptionSourceMode;
  selectedProductIds?: string[];
  position?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  zIndex?: number;
  maxItems?: number;
  background?: string;
  cardBackground?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  showProductName?: boolean;
  showDivider?: boolean;
  showDescription?: boolean;
  showPrice?: boolean;
  showComparePrice?: boolean;
  showDiscountBadge?: boolean;
  descriptionLines?: number;
  showSku?: boolean;
  showStock?: boolean;
  showAddToCart?: boolean;
  showQuantitySelector?: boolean;
  headerAlign?: "left" | "center" | "right";
  cardsAlign?: "left" | "center" | "right";
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(price);

const Row = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-center gap-2 mb-2 ${className}`}>{children}</div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] text-[var(--builder-text-muted)] w-24 shrink-0">{children}</span>
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
  sourceMode: ProductDescriptionSourceMode,
  selectedIds: string[],
  maxItems: number
): ApiProduct[] {
  const safeMax = Math.max(1, Math.min(maxItems, 12));

  if (sourceMode !== "manual") {
    return products.slice(0, safeMax);
  }

  const byId = new Map(products.map((product) => [String(product.id), product]));
  return selectedIds
    .map((id) => byId.get(String(id)))
    .filter((product): product is ApiProduct => Boolean(product))
    .slice(0, safeMax);
}

export function ProductDescriptionCanvas({
  productSourceMode = "auto",
  selectedProductIds = [],
  maxItems = 4,
  background = "#F5F3F0",
  cardBackground = "#FFFFFF",
  paddingTop = 16,
  paddingRight = 24,
  paddingBottom = 16,
  paddingLeft = 24,
  showProductName = true,
  showDivider = true,
  showDescription = true,
  showPrice = true,
  showComparePrice = true,
  showDiscountBadge = true,
  descriptionLines = 6,
  showSku = false,
  showStock = false,
  showAddToCart = true,
  showQuantitySelector = false,
  position = "relative",
  top,
  left,
  right,
  bottom,
  zIndex,
  headerAlign,
  cardsAlign,
}: ProductDescriptionCanvasProps) {
  const { 
    connectors, 
    id,
    nodePosition,
    nodeTop,
    nodeLeft,
    nodeRight,
    nodeBottom,
    nodeZIndex
  } = useNode((node) => ({
    nodePosition: node.data.props.position,
    nodeTop: node.data.props.top,
    nodeLeft: node.data.props.left,
    nodeRight: node.data.props.right,
    nodeBottom: node.data.props.bottom,
    nodeZIndex: node.data.props.zIndex,
  }));
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
        minHeight: "420px",
        background,
        padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
        boxSizing: "border-box",
        position: (nodePosition || position) as React.CSSProperties["position"],
        top: nodeTop ?? top ?? undefined,
        left: nodeLeft ?? left ?? undefined,
        right: nodeRight ?? right ?? undefined,
        bottom: nodeBottom ?? bottom ?? undefined,
        zIndex: (nodeZIndex || zIndex) ?? undefined,
      }}
    >
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((index) => (
            <div key={index} style={{ minHeight: 320, borderRadius: 12, background: "#e5e7eb" }} />
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
              : "No products selected yet. Open Product Description settings and add products.")
            : "No active products found for this project."}
        </div>
      )}

      {!loading && !isEmpty && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 220px), 280px))`, 
          gap: 16,
          justifyContent: cardsAlign === "center" ? "center" : cardsAlign === "right" ? "end" : "start",
          justifyItems: cardsAlign === "center" ? "center" : cardsAlign === "right" ? "end" : "start",
        }}>
          {displayedProducts.map((product) => {
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
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 320,
                  maxWidth: 360,
                  width: "100%",
                }}
              >
                <div style={{ width: "100%", height: 220, background: "#F5F3F0", overflow: "hidden" }}>
                  {image ? (
                    <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>
                      No image
                    </div>
                  )}
                  {showDiscountBadge && hasDiscount && (
                    <span style={{ position: "absolute", top: 12, left: 12, background: "#C2410C", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: "5px 12px" }}>
                      {Math.max(1, Math.round(((compareAt! - price) / compareAt!) * 100))}% OFF
                    </span>
                  )}
                </div>

                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {showProductName && (
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                      {product.name}
                    </p>
                  )}
                  {showDivider && showProductName && showPrice && <div style={{ width: 44, height: 2, background: "#E5E7EB", borderRadius: 999 }} />}
                  {showDescription && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 400,
                        color: "#6B7280",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: descriptionLines,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {product.description || "No description available."}
                    </p>
                  )}
                  {showSku && product.sku && (
                    <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF", lineHeight: 1.4 }}>SKU: {product.sku}</p>
                  )}
                  {showStock && (
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, lineHeight: 1.4, color: stockStatus === "Out of Stock" ? "#DC2626" : stockStatus === "Low Stock" ? "#D97706" : "#16A34A" }}>
                      {stockStatus}
                    </p>
                  )}
                  {(showPrice || showAddToCart) && (
                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                      {showPrice && (
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{formatPrice(price)}</p>
                          {showComparePrice && hasDiscount && (
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 400, color: "#D1D5DB", lineHeight: 1, textDecoration: "line-through" }}>
                              {formatPrice(compareAt || 0)}
                            </p>
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
                          <button type="button" style={{ flex: 1, minWidth: 120, background: "#111827", color: "#fff", fontSize: 12, fontWeight: 700, border: "none", padding: "10px 18px", cursor: "pointer" }}>
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

export const ProductDescriptionSettings = () => {
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
    showDescription,
    showPrice,
    showComparePrice,
    showDiscountBadge,
    descriptionLines,
    showSku,
    showStock,
    showAddToCart,
    showQuantitySelector,
    headerAlign,
    cardsAlign,
    actions: { setProp },
  } = useNode((node) => ({
    productSourceMode: (node.data.props.productSourceMode as ProductDescriptionSourceMode | undefined) || "auto",
    selectedProductIds: (node.data.props.selectedProductIds as string[] | undefined) || [],
    maxItems: (node.data.props.maxItems as number | undefined) || 4,
    paddingTop: (node.data.props.paddingTop as number | undefined) ?? 16,
    paddingRight: (node.data.props.paddingRight as number | undefined) ?? 24,
    paddingBottom: (node.data.props.paddingBottom as number | undefined) ?? 16,
    paddingLeft: (node.data.props.paddingLeft as number | undefined) ?? 24,
    showProductName: node.data.props.showProductName !== false,
    showDivider: node.data.props.showDivider !== false,
    showDescription: node.data.props.showDescription !== false,
    showPrice: node.data.props.showPrice !== false,
    showComparePrice: node.data.props.showComparePrice !== false,
    showDiscountBadge: node.data.props.showDiscountBadge !== false,
    descriptionLines: (node.data.props.descriptionLines as number | undefined) ?? 6,
    showSku: node.data.props.showSku === true,
    showStock: node.data.props.showStock === true,
    showAddToCart: node.data.props.showAddToCart !== false,
    showQuantitySelector: node.data.props.showQuantitySelector === true,
    headerAlign: node.data.props.headerAlign as "left" | "center" | "right" | undefined,
    cardsAlign: node.data.props.cardsAlign as "left" | "center" | "right" | undefined,
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
    setProp((props: ProductDescriptionCanvasProps) => {
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
          Choose how products are displayed
        </p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {([
            { value: "auto", label: "Auto" },
            { value: "manual", label: "Manual" },
          ] as Array<{ value: ProductDescriptionSourceMode; label: string }>).map((option) => {
            const active = productSourceMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setProp((props: ProductDescriptionCanvasProps) => {
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
            <p className="m-0 text-[11px] text-[var(--builder-text-muted)]">Add products one by one to control exactly what appears in this block.</p>

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
                        x
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
          <p className="m-0 text-[11px] text-[var(--builder-text-muted)]">Auto mode shows active products from this project.</p>
        )}
      </DesignSection>

      <DesignSection title="Layout" defaultOpen={false}>
        <Row>
          <Label>Header Align</Label>
          <AlignButtons value={headerAlign || "left"} onChange={(v) => setProp((p: ProductDescriptionCanvasProps) => { p.headerAlign = v; })} />
        </Row>
        <Row>
          <Label>Card Align</Label>
          <AlignButtons value={cardsAlign || "left"} onChange={(v) => setProp((p: ProductDescriptionCanvasProps) => { p.cardsAlign = v; })} />
        </Row>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-[var(--builder-text-muted)] w-24 shrink-0">Cards shown</span>
          <input
            type="number"
            min={1}
            max={12}
            value={maxItems}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value || "4", 10);
              const safe = Number.isFinite(next) ? Math.max(1, Math.min(next, 12)) : 4;
              setProp((props: ProductDescriptionCanvasProps) => {
                props.maxItems = safe;
              });
            }}
            className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
          />
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--builder-text-faint)]">Spacing</p>
        <Row>
          <Label>Top</Label>
          <input type="number" min={0} max={200} value={paddingTop} onChange={(event) => setProp((props: ProductDescriptionCanvasProps) => { props.paddingTop = Number.parseInt(event.target.value || "0", 10) || 0; })} className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]" />
        </Row>
        <Row>
          <Label>Right</Label>
          <input type="number" min={0} max={200} value={paddingRight} onChange={(event) => setProp((props: ProductDescriptionCanvasProps) => { props.paddingRight = Number.parseInt(event.target.value || "0", 10) || 0; })} className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]" />
        </Row>
        <Row>
          <Label>Bottom</Label>
          <input type="number" min={0} max={200} value={paddingBottom} onChange={(event) => setProp((props: ProductDescriptionCanvasProps) => { props.paddingBottom = Number.parseInt(event.target.value || "0", 10) || 0; })} className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]" />
        </Row>
        <Row>
          <Label>Left</Label>
          <input type="number" min={0} max={200} value={paddingLeft} onChange={(event) => setProp((props: ProductDescriptionCanvasProps) => { props.paddingLeft = Number.parseInt(event.target.value || "0", 10) || 0; })} className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]" />
        </Row>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--builder-text-faint)]">
          What&apos;s displayed?
        </p>

        <Toggle checked={!!showProductName} onChange={(value) => setProp((props: ProductDescriptionCanvasProps) => { props.showProductName = value; })} label="Product name" />
        <Toggle checked={!!showDivider} onChange={(value) => setProp((props: ProductDescriptionCanvasProps) => { props.showDivider = value; })} label="Name & price divider" />
        <Toggle checked={!!showPrice} onChange={(value) => setProp((props: ProductDescriptionCanvasProps) => { props.showPrice = value; })} label="Product price" />
        {showPrice && <Toggle checked={!!showComparePrice} onChange={(value) => setProp((props: ProductDescriptionCanvasProps) => { props.showComparePrice = value; })} label="Compare-at price" />}
        <Toggle checked={!!showDiscountBadge} onChange={(value) => setProp((props: ProductDescriptionCanvasProps) => { props.showDiscountBadge = value; })} label="Discount badge" />
        <Toggle checked={!!showDescription} onChange={(value) => setProp((props: ProductDescriptionCanvasProps) => { props.showDescription = value; })} label="Description" />
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
                  setProp((props: ProductDescriptionCanvasProps) => {
                    props.descriptionLines = safe;
                  });
                }}
                className="h-7 w-20 rounded px-2 text-xs bg-[var(--builder-surface-3)] border border-[var(--builder-border)] text-[var(--builder-text)] focus:outline-none focus:border-[var(--builder-accent)]"
              />
            </Row>
          </div>
        )}
        <Toggle checked={!!showSku} onChange={(value) => setProp((props: ProductDescriptionCanvasProps) => { props.showSku = value; })} label="SKU" />
        <Toggle checked={!!showStock} onChange={(value) => setProp((props: ProductDescriptionCanvasProps) => { props.showStock = value; })} label="Stock status" />
        <Toggle checked={!!showAddToCart} onChange={(value) => setProp((props: ProductDescriptionCanvasProps) => { props.showAddToCart = value; })} label="Add to Cart button" />
        {showAddToCart && <Toggle checked={!!showQuantitySelector} onChange={(value) => setProp((props: ProductDescriptionCanvasProps) => { props.showQuantitySelector = value; })} label="Quantity selector" />}
      </DesignSection>
    </div>
  );
};

ProductDescriptionCanvas.craft = {
  displayName: "Product Description",
  props: {
    productSourceMode: "auto",
    selectedProductIds: [],
    maxItems: 4,
    background: "#F5F3F0",
    cardBackground: "#FFFFFF",
    paddingTop: 16,
    paddingRight: 24,
    paddingBottom: 16,
    paddingLeft: 24,
    showProductName: true,
    showDivider: true,
    showDescription: true,
    showPrice: true,
    showComparePrice: true,
    showDiscountBadge: true,
    descriptionLines: 6,
    showSku: false,
    showStock: false,
    showAddToCart: true,
    showQuantitySelector: false,
  },
  related: {
    settings: ProductDescriptionSettings,
  },
  rules: {
    canDrag: () => true,
  },
  isCanvas: false,
};

export const ProductDescription: TemplateEntry = {
  label: "Product Description",
  description: "Product cards with image, name, description and price",
  preview: "PD",
  category: "card",
  element: React.createElement(ProductDescriptionCanvas),
};
