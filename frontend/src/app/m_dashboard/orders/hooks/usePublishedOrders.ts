"use client";

import { useCallback, useEffect, useState } from "react";
import { listMyPublishedOrders, type ApiPublishedOrder } from "@/lib/api";

type UsePublishedOrdersOptions = {
  /** Parent context still resolving; hook reports loading=true and skips the request. */
  pending?: boolean;
  /** Subdomain scope. When falsy the hook resets to an empty list without firing a request. */
  subdomain: string | null;
  limit?: number;
  page?: number;
};

type UsePublishedOrdersResult = {
  orders: ApiPublishedOrder[];
  setOrders: React.Dispatch<React.SetStateAction<ApiPublishedOrder[]>>;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/**
 * Owns the listMyPublishedOrders fetch + loading state for the
 * m_dashboard orders page. Status-update mutations remain in the
 * page since they need to coordinate with optimistic UI state
 * (editingOrderId, draftStatus, etc.).
 */
export function usePublishedOrders({
  pending = false,
  subdomain,
  limit = 200,
  page = 1,
}: UsePublishedOrdersOptions): UsePublishedOrdersResult {
  const [orders, setOrders] = useState<ApiPublishedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (pending) {
      setLoading(true);
      return;
    }
    setLoading(true);
    setError(null);
    if (!subdomain) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const res = await listMyPublishedOrders({ subdomain, limit, page });
      setOrders(Array.isArray(res.items) ? res.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [pending, subdomain, limit, page]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { orders, setOrders, loading, error, reload };
}
