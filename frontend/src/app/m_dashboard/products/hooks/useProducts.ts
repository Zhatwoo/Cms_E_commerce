"use client";

import { useCallback, useEffect, useState } from "react";
import { listProducts, type ApiProduct } from "@/lib/api";

type UseProductsOptions<T> = {
  /** Gate the request — when false the hook returns an empty list and loading=false. */
  enabled: boolean;
  /** When the parent is still resolving its project context, the hook should report loading=true without firing a request. */
  pending?: boolean;
  /** Subdomain scope. When omitted the request runs without a subdomain filter (relies on the active-project header). */
  subdomain: string | null;
  /** Maximum items to fetch in a single page. */
  limit?: number;
  /** Map an ApiProduct to whatever shape the page wants. */
  transform: (product: ApiProduct) => T;
  /** Called with a human-readable message when the request fails. */
  onError?: (message: string) => void;
};

type UseProductsResult<T> = {
  products: T[];
  setProducts: React.Dispatch<React.SetStateAction<T[]>>;
  loading: boolean;
  reload: () => Promise<void>;
};

/**
 * Owns the products list state, the listProducts request, and the
 * loading flag. Refresh-on-focus and post-mutation cache updates
 * remain the caller's responsibility (they depend on page-specific
 * state like open modals).
 */
export function useProducts<T>({
  enabled,
  pending = false,
  subdomain,
  limit = 500,
  transform,
  onError,
}: UseProductsOptions<T>): UseProductsResult<T> {
  const [products, setProducts] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const reload = useCallback(async () => {
    if (pending) {
      setLoading(true);
      return;
    }
    setLoading(true);
    if (!enabled) {
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      const res = await listProducts(
        subdomain ? { subdomain, page: 1, limit } : { page: 1, limit }
      );
      if (res?.success && Array.isArray(res.items)) {
        setProducts(res.items.map(transform));
      } else {
        setProducts([]);
      }
    } catch (error) {
      setProducts([]);
      onError?.(error instanceof Error ? error.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [pending, enabled, subdomain, limit, transform, onError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { products, setProducts, loading, reload };
}
