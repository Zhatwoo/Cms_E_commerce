import React from "react";
import { listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../../_context/DesignProjectContext";

type ProductBindingGroupProps = {
  productId?: string;
  onChange: (productId?: string) => void;
};

const selectClassName =
  "w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]";

export function ProductBindingGroup({ productId, onChange }: ProductBindingGroupProps) {
  const { projectSubdomain, loading: projectLoading } = useDesignProject();
  const [products, setProducts] = React.useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!projectSubdomain) {
      setProducts([]);
      setLoadingProducts(false);
      setError(null);
      return;
    }

    let active = true;
    setLoadingProducts(true);
    setError(null);

    listProducts({ subdomain: projectSubdomain, status: "active", limit: 100 })
      .then((res) => {
        if (!active) return;
        setProducts(res.success ? res.items : []);
      })
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Failed to load products.";
        setProducts([]);
        setError(message);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, [projectSubdomain]);

  const selectedProduct = React.useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [products, productId]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-[var(--builder-text)]">Product</label>
        <select
          value={productId ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          disabled={!projectSubdomain || loadingProducts || products.length === 0}
          className={`${selectClassName} disabled:opacity-60`}
        >
          <option value="">Auto-bind by layout order</option>
          {productId && !selectedProduct ? (
            <option value={productId}>Previously bound product (not active)</option>
          ) : null}
          {products.map((product) => {
            const price =
              typeof product.finalPrice === "number"
                ? product.finalPrice
                : typeof product.price === "number"
                  ? product.price
                  : 0;

            return (
              <option key={product.id} value={product.id}>
                {product.name} - PHP {price.toFixed(2)}
              </option>
            );
          })}
        </select>
      </div>

      <p className="text-[10px] leading-4 text-[var(--builder-text-muted)]">
        Choose one active store product for this card. Leave it on auto to keep the existing repeating gallery behavior.
      </p>

      {selectedProduct ? (
        <div className="rounded-md border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-3 py-2 text-[10px] text-[var(--builder-text-muted)]">
          Bound to <span className="text-[var(--builder-text)]">{selectedProduct.name}</span>
        </div>
      ) : null}

      {productId && !selectedProduct && !loadingProducts ? (
        <p className="text-[10px] text-amber-400/90">
          This card is bound to a product that is not currently active, so the published site will fall back to the static card content until that product is active again.
        </p>
      ) : null}

      {projectLoading ? (
        <p className="text-[10px] text-[var(--builder-text-muted)]">Loading project details...</p>
      ) : null}

      {!projectLoading && !projectSubdomain ? (
        <p className="text-[10px] text-amber-400/90">
          This project does not have a storefront subdomain yet, so products cannot be loaded here.
        </p>
      ) : null}

      {projectSubdomain && loadingProducts ? (
        <p className="text-[10px] text-[var(--builder-text-muted)]">Loading active products...</p>
      ) : null}

      {projectSubdomain && !loadingProducts && !error && products.length === 0 ? (
        <p className="text-[10px] text-[var(--builder-text-muted)]">
          No active products were found for this storefront yet.
        </p>
      ) : null}

      {error ? (
        <p className="text-[10px] text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
