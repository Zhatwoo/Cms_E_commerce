/**
 * Products API: CRUD, listing/search, image upload, plus admin
 * moderation actions (delete a user's product, take-down/delete a
 * user's website).
 */

import {
  apiFetch,
  handleResponse,
  getApiCandidates,
  setActiveApiBase,
} from "./_core";

export type ApiProduct = {
  id: string;
  name: string;
  userId?: string;
  projectId?: string | null;
  sku?: string;
  category?: string;
  subcategory?: string;
  subCategory?: string;
  sub_category?: string;
  slug?: string;
  description?: string;
  price: number;
  basePrice?: number;
  costPrice?: number | null;
  finalPrice?: number;
  compareAtPrice?: number | null;
  discount?: number;
  discountType?: "percentage" | "fixed";
  hasVariants?: boolean;
  variants?: Array<{
    id: string;
    name: string;
    pricingMode: "modifier" | "override";
    options: Array<{
      id: string;
      name: string;
      priceAdjustment: number;
      image?: string;
    }>;
  }>;
  variantStocks?: Record<string, number>;
  variantPrices?: Record<string, number>;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  images?: string[];
  status?: string;
  stock?: number | null;
  onHandStock?: number | null;
  reservedStock?: number;
  availableStock?: number | null;
  lowStockThreshold?: number;
  subdomain?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function adminDeleteProduct(
  id: string,
  reason: string
): Promise<{ success: boolean; message?: string; data?: { id: string } }> {
  return apiFetch<{ success: boolean; message?: string; data?: { id: string } }>(`/api/products/admin/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ reason }),
  });
}

export async function adminWebsiteAction(params: {
  userId: string;
  domainId: string;
  action: "take_down" | "delete";
  reason?: string;
}): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>("/api/domains/admin/website-action", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function listProducts(params?: {
  subdomain?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  ignoreActiveProjectScope?: boolean;
  includeAllUsers?: boolean;
}): Promise<{ success: boolean; items: ApiProduct[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.subdomain) query.set("subdomain", params.subdomain);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.includeAllUsers) query.set("scope", "all");
  const qs = query.toString();
  const path = qs ? `/api/products?${qs}` : "/api/products";
  const headers = params?.ignoreActiveProjectScope
    ? { "x-skip-active-project-scope": "1" }
    : undefined;
  return apiFetch<{ success: boolean; items: ApiProduct[]; total: number; page: number; totalPages: number }>(path, {
    headers,
  });
}

export async function getProduct(id: string): Promise<{ success: boolean; data?: ApiProduct; message?: string }> {
  const normalizedId = String(id || "").trim();
  if (!normalizedId) {
    throw new Error("Product id is required");
  }

  return apiFetch<{ success: boolean; data?: ApiProduct; message?: string }>(`/api/products/${encodeURIComponent(normalizedId)}`);
}

/** Upload product image to Firebase Storage via the backend. */
export async function uploadProductImageApi(
  file: File,
  subdomain?: string
): Promise<{ success: boolean; message?: string; url?: string }> {
  if (typeof window !== "undefined") {
    const formData = new FormData();
    formData.append("image", file);
    if (subdomain) formData.append("subdomain", subdomain);

    const res = await fetch(`/api/products/upload-image`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    return handleResponse<{ success: boolean; message?: string; url?: string }>(res);
  }

  const candidates = getApiCandidates();
  let lastError: unknown = null;

  for (const base of candidates) {
    const formData = new FormData();
    formData.append("image", file);
    if (subdomain) formData.append("subdomain", subdomain);

    try {
      const res = await fetch(`${base}/api/products/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      setActiveApiBase(base);
      return handleResponse<{ success: boolean; message?: string; url?: string }>(res);
    } catch (error) {
      lastError = error;
      if (!(error instanceof TypeError)) {
        throw error;
      }
    }
  }

  if (lastError instanceof Error && lastError.message) {
    throw lastError;
  }
  throw new Error("Backend is unreachable. Start the backend server and ensure API URL/port is correct.");
}

export async function createProduct(params: {
  /** Optional when using the active project scope header (`x-project-id`). */
  subdomain?: string;
  /** Optional fallback when `x-project-id` is not available. */
  projectId?: string;
  name: string;
  sku?: string;
  category?: string;
  subcategory?: string;
  subCategory?: string;
  sub_category?: string;
  slug?: string;
  description?: string;
  price?: number;
  basePrice?: number;
  costPrice?: number | null;
  finalPrice?: number;
  compareAtPrice?: number | null;
  discount?: number;
  discountType?: "percentage" | "fixed";
  hasVariants?: boolean;
  variants?: Array<{
    id: string;
    name: string;
    pricingMode: "modifier" | "override";
    options: Array<{
      id: string;
      name: string;
      priceAdjustment: number;
      image?: string;
    }>;
  }>;
  variantStocks?: Record<string, number>;
  variantPrices?: Record<string, number>;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  images?: string[];
  status?: string;
  stock?: number | null;
  lowStockThreshold?: number;
}): Promise<{ success: boolean; message?: string; data?: ApiProduct }> {
  return apiFetch<{ success: boolean; message?: string; data?: ApiProduct }>("/api/products", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function updateProduct(
  id: string,
  params: {
    name?: string;
    sku?: string;
    category?: string;
    subcategory?: string;
    subCategory?: string;
    sub_category?: string;
    slug?: string;
    description?: string;
    price?: number;
    basePrice?: number;
    costPrice?: number | null;
    finalPrice?: number;
    compareAtPrice?: number | null;
    discount?: number;
    discountType?: "percentage" | "fixed";
    hasVariants?: boolean;
    variants?: Array<{
      id: string;
      name: string;
      pricingMode: "modifier" | "override";
      options: Array<{
        id: string;
        name: string;
        priceAdjustment: number;
        image?: string;
      }>;
    }>;
    variantStocks?: Record<string, number>;
    variantPrices?: Record<string, number>;
    priceRangeMin?: number | null;
    priceRangeMax?: number | null;
    images?: string[];
    status?: string;
    stock?: number | null;
    lowStockThreshold?: number;
  }
): Promise<{ success: boolean; message?: string; data?: ApiProduct }> {
  return apiFetch<{ success: boolean; message?: string; data?: ApiProduct }>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}

export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/products/${id}`, {
    method: "DELETE",
  });
}
