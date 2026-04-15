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
  maxItems?: number;
  background?: string;
  cardBackground?: string;
  showDescription?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(price);

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
  showDescription = true,
}: ProductDescriptionCanvasProps) {
  const { connectors } = useNode();
  const { enabled } = useEditor((s) => ({ enabled: s.options.enabled }));
  const { projectSubdomain } = useDesignProject();
  const [products, setProducts] = React.useState<ApiProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

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
        padding: "16px 24px",
        boxSizing: "border-box",
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {displayedProducts.map((product) => {
            const image = product.images?.[0] ?? "";
            const price = product.finalPrice ?? product.price ?? 0;

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
                </div>

                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                    {product.name}
                  </p>
                  {showDescription && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 400,
                        color: "#6B7280",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {product.description || "No description available."}
                    </p>
                  )}
                  <p style={{ margin: "auto 0 0", fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                    {formatPrice(price)}
                  </p>
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
    showDescription,
    actions: { setProp },
  } = useNode((node) => ({
    productSourceMode: (node.data.props.productSourceMode as ProductDescriptionSourceMode | undefined) || "auto",
    selectedProductIds: (node.data.props.selectedProductIds as string[] | undefined) || [],
    maxItems: (node.data.props.maxItems as number | undefined) || 4,
    showDescription: node.data.props.showDescription !== false,
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

        <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
          <input
            type="checkbox"
            checked={showDescription}
            onChange={(event) => {
              const checked = event.target.checked;
              setProp((props: ProductDescriptionCanvasProps) => {
                props.showDescription = checked;
              });
            }}
          />
          <span className="text-[12px] text-[var(--builder-text)]">Show description</span>
        </label>
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
    showDescription: true,
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
