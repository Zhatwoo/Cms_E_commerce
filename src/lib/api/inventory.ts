/**
 * Inventory API: stock listing, summary, movements (audit trail),
 * adjustments, and CSV import.
 */

import { apiFetch } from "./_core";
import type { ApiProduct } from "./products";

export type InventorySummary = {
  totalProducts: number;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  lowStock: number;
  outOfStock: number;
  stockValue: number;
};

export type InventoryMovement = {
  id: string;
  userId?: string | null;
  projectId?: string | null;
  subdomain?: string | null;
  productId?: string | null;
  productName?: string | null;
  productSku?: string | null;
  type: "IN" | "OUT" | "ADJUST" | "RESERVE" | "RELEASE" | string;
  quantity: number;
  beforeOnHand?: number | null;
  afterOnHand?: number | null;
  beforeReserved?: number | null;
  afterReserved?: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
  actor?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function listInventory(params?: {
  subdomain?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; items: ApiProduct[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.subdomain) query.set("subdomain", params.subdomain);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<{ success: boolean; items: ApiProduct[]; total: number; page: number; totalPages: number }>(
    qs ? `/api/inventory?${qs}` : "/api/inventory"
  );
}

export async function getInventorySummary(params?: {
  subdomain?: string;
  status?: string;
  search?: string;
}): Promise<{ success: boolean; data: InventorySummary }> {
  const query = new URLSearchParams();
  if (params?.subdomain) query.set("subdomain", params.subdomain);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return apiFetch<{ success: boolean; data: InventorySummary }>(
    qs ? `/api/inventory/summary?${qs}` : "/api/inventory/summary"
  );
}

export async function listInventoryMovements(params?: {
  productId?: string;
  type?: string;
  subdomain?: string;
  projectId?: string;
  limit?: number;
}): Promise<{ success: boolean; items: InventoryMovement[] }> {
  const query = new URLSearchParams();
  if (params?.productId) query.set("productId", params.productId);
  if (params?.type) query.set("type", params.type);
  if (params?.subdomain) query.set("subdomain", params.subdomain);
  if (params?.projectId) query.set("projectId", params.projectId);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<{ success: boolean; items: InventoryMovement[] }>(
    qs ? `/api/inventory/movements?${qs}` : "/api/inventory/movements"
  );
}

export async function deleteInventoryMovement(
  movementId: string,
  params?: { subdomain?: string; projectId?: string }
): Promise<{ success: boolean; message?: string; data?: InventoryMovement }> {
  const normalizedId = String(movementId || "").trim();
  if (!normalizedId) {
    throw new Error("movementId is required");
  }

  const query = new URLSearchParams();
  if (params?.subdomain) query.set("subdomain", params.subdomain);
  if (params?.projectId) query.set("projectId", params.projectId);
  const qs = query.toString();
  const encodedId = encodeURIComponent(normalizedId);

  return apiFetch<{ success: boolean; message?: string; data?: InventoryMovement }>(
    qs ? `/api/inventory/movements/${encodedId}?${qs}` : `/api/inventory/movements/${encodedId}`,
    {
      method: "DELETE",
    }
  );
}

export async function bulkDeleteInventoryMovements(params: {
  ids?: string[];
  deleteAll?: boolean;
  subdomain?: string;
  projectId?: string;
}): Promise<{ success: boolean; message?: string; data?: { deleted?: number; missing?: string[] } }> {
  const body: Record<string, unknown> = {};
  if (params.deleteAll) body.deleteAll = true;
  if (Array.isArray(params.ids) && params.ids.length > 0) body.ids = params.ids;

  if (!body.deleteAll && (!body.ids || (Array.isArray(body.ids) && body.ids.length === 0))) {
    throw new Error("Provide ids array or set deleteAll=true to delete movements.");
  }

  const query = new URLSearchParams();
  if (params.subdomain) query.set("subdomain", params.subdomain);
  if (params.projectId) query.set("projectId", params.projectId);
  const qs = query.toString();

  return apiFetch<{ success: boolean; message?: string; data?: { deleted?: number; missing?: string[] } }>(
    qs ? `/api/inventory/movements/bulk-delete?${qs}` : "/api/inventory/movements/bulk-delete",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function adjustInventoryStock(params: {
  productId: string;
  quantity?: number;
  movementType?: "IN" | "OUT" | "ADJUST";
  notes?: string;
  referenceType?: string;
  referenceId?: string;
  setOnHandStock?: number;
  setReservedStock?: number;
  variantKey?: string;
  setVariantStock?: number;
}): Promise<{ success: boolean; message?: string; data?: ApiProduct }> {
  return apiFetch<{ success: boolean; message?: string; data?: ApiProduct }>("/api/inventory/adjust", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export type ImportInventoryRow = {
  sku: string;
  onHandStock?: number;
  reservedStock?: number;
  lowStockThreshold?: number;
};

export type ImportInventoryResult = {
  success: boolean;
  updated?: number;
  errors?: Array<{ row: number; sku: string; message: string }>;
  message?: string;
};

export async function importInventoryCsv(params: {
  rows: ImportInventoryRow[];
  subdomain?: string;
}): Promise<ImportInventoryResult> {
  const query = new URLSearchParams();
  if (params.subdomain) query.set("subdomain", params.subdomain);
  const qs = query.toString();
  return apiFetch<ImportInventoryResult>(qs ? `/api/inventory/import?${qs}` : "/api/inventory/import", {
    method: "POST",
    body: JSON.stringify({ rows: params.rows }),
  });
}
