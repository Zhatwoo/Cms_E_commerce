"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getInventorySummary,
  listInventory,
  listInventoryMovements,
  type ApiProduct,
  type InventoryMovement,
  type InventorySummary,
} from "@/lib/api";

type UseInventoryOptions<TRow extends ApiProduct> = {
  /** Parent context still loading; hook reports loading=true and skips the request. */
  pending?: boolean;
  /** Subdomain scope. When falsy the hook resets to empties without firing a request. */
  subdomain: string | null;
  /** Free-text search forwarded to listInventory and getInventorySummary. */
  search?: string;
  /** Page size for the items request. */
  itemsLimit?: number;
  /** Page size for the recent-movements request. */
  recentMovementsLimit: number;
  /**
   * Optional overlay that merges any client-side pending status changes
   * on top of the server-returned movement list. Receives the limit so
   * the page can clamp the result.
   */
  mergeMovements?: (server: InventoryMovement[], limit?: number) => InventoryMovement[];
  /** Called with a human-readable error string if any of the three requests fail. */
  onError?: (message: string) => void;
};

type UseInventoryResult<TRow extends ApiProduct> = {
  items: TRow[];
  setItems: React.Dispatch<React.SetStateAction<TRow[]>>;
  summary: InventorySummary | null;
  setSummary: React.Dispatch<React.SetStateAction<InventorySummary | null>>;
  movements: InventoryMovement[];
  setMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/**
 * Owns the parallel "items + summary + recent movements" fetch the
 * inventory page needs on mount and on search/subdomain change.
 *
 * The all-movements-modal flow is *not* in here because it has its
 * own state (selection, bulk-delete confirm) that is tightly coupled
 * to the modal's lifecycle.
 */
export function useInventory<TRow extends ApiProduct = ApiProduct>({
  pending = false,
  subdomain,
  search,
  itemsLimit = 500,
  recentMovementsLimit,
  mergeMovements,
  onError,
}: UseInventoryOptions<TRow>): UseInventoryResult<TRow> {
  const [items, setItems] = useState<TRow[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
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
      setItems([]);
      setSummary(null);
      setMovements([]);
      setLoading(false);
      return;
    }
    try {
      const [invRes, summaryRes, movementRes] = await Promise.all([
        listInventory({ subdomain, limit: itemsLimit, search: search || undefined }),
        getInventorySummary({ subdomain, search: search || undefined }),
        listInventoryMovements({ subdomain, limit: recentMovementsLimit }),
      ]);
      setItems(Array.isArray(invRes.items) ? (invRes.items as unknown as TRow[]) : []);
      setSummary(summaryRes.data || null);
      const serverMovements = Array.isArray(movementRes.items) ? movementRes.items : [];
      setMovements(
        mergeMovements ? mergeMovements(serverMovements, recentMovementsLimit) : serverMovements
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load inventory";
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }, [pending, subdomain, search, itemsLimit, recentMovementsLimit, mergeMovements, onError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    items,
    setItems,
    summary,
    setSummary,
    movements,
    setMovements,
    loading,
    error,
    reload,
  };
}
