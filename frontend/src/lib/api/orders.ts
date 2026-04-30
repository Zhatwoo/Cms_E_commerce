/**
 * Orders API: dashboard orders, published-site (storefront) orders,
 * and the payment intent flows for PayPal and Stripe.
 */

import { apiFetch } from "./_core";

export type ApiOrderItem = {
  id?: string;
  productId?: string;
  sku?: string;
  name?: string;
  image?: string;
  subtotal?: number;
  quantity: number;
  price: number;
};

export type ApiOrder = {
  id: string;
  userId: string;
  projectId?: string | null;
  items: ApiOrderItem[];
  total: number;
  status: "Pending" | "Processing" | "Paid" | "Shipped" | "Delivered" | "Cancelled" | "Returned" | string;
  shippingAddress?: Record<string, unknown> | null;
  inventoryState?: {
    reservedApplied?: boolean;
    deductedApplied?: boolean;
    reserved_applied?: boolean;
    deducted_applied?: boolean;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function createOrder(params: {
  items: ApiOrderItem[];
  total?: number;
  shippingAddress?: Record<string, unknown> | null;
  projectId?: string;
}): Promise<{ success: boolean; message?: string; data?: ApiOrder }> {
  return apiFetch<{ success: boolean; message?: string; data?: ApiOrder }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function listMyOrders(params?: {
  page?: number;
  limit?: number;
  projectId?: string;
}): Promise<{ success: boolean; items: ApiOrder[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.projectId) query.set("projectId", params.projectId);
  const qs = query.toString();
  return apiFetch<{ success: boolean; items: ApiOrder[]; total: number; page: number; totalPages: number }>(
    qs ? `/api/orders/my?${qs}` : "/api/orders/my"
  );
}

export async function listAllOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
}): Promise<{ success: boolean; items: ApiOrder[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.userId) query.set("userId", params.userId);
  const qs = query.toString();
  return apiFetch<{ success: boolean; items: ApiOrder[]; total: number; page: number; totalPages: number }>(
    qs ? `/api/orders?${qs}` : "/api/orders"
  );
}

export async function updateOrderStatus(
  id: string,
  status: "Pending" | "Processing" | "Paid" | "Shipped" | "Delivered" | "Cancelled" | "Returned"
): Promise<{ success: boolean; message?: string; data?: ApiOrder }> {
  return apiFetch<{ success: boolean; message?: string; data?: ApiOrder }>(`/api/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

/* ── Published (storefront) orders ──────────────────────────────── */

export type ApiPublishedOrder = {
  id: string;
  subdomain: string;
  ownerUserId: string;
  projectId?: string | null;
  domainId?: string | null;
  items: ApiOrderItem[];
  total: number;
  status: "Pending" | "Processing" | "Paid" | "Shipped" | "Delivered" | "Cancelled" | "Returned" | string;
  shippingAddress?: Record<string, unknown> | null;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function createPublishedOrder(params: {
  subdomain: string;
  items: ApiOrderItem[];
  total?: number;
  shippingAddress?: Record<string, unknown> | null;
  currency?: string;
}): Promise<{ success: boolean; message?: string; data?: ApiPublishedOrder }> {
  const normalizedSubdomain = params.subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return apiFetch<{ success: boolean; message?: string; data?: ApiPublishedOrder }>(
    `/api/orders/published/${encodeURIComponent(normalizedSubdomain)}`,
    {
      method: "POST",
      body: JSON.stringify({
        items: params.items,
        total: params.total,
        shippingAddress: params.shippingAddress ?? null,
        currency: params.currency ?? "PHP",
      }),
    }
  );
}

/** Create payment (PayPal) for a published order. Returns redirectUrl to PayPal. */
export async function createPaymentIntent(
  subdomain: string,
  orderId: string,
  _paymentMethod?: "paypal" | "gcash" | "maya" | "card"
): Promise<{
  success: boolean;
  message?: string;
  redirectUrl?: string;
  clientKey?: string;
  publicKey?: string;
}> {
  const normalizedSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return apiFetch<{
    success: boolean;
    message?: string;
    redirectUrl?: string;
    clientKey?: string;
    publicKey?: string;
  }>(
    `/api/orders/published/${encodeURIComponent(normalizedSubdomain)}/${encodeURIComponent(orderId)}/create-payment-intent`,
    {
      method: "POST",
      body: JSON.stringify({ paymentMethod: _paymentMethod ?? "paypal" }),
    }
  );
}

/** Capture PayPal payment after user returns from PayPal (call when result page has token). */
export async function capturePayPal(
  subdomain: string,
  orderId: string,
  token: string
): Promise<{ success: boolean; message?: string }> {
  const normalizedSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const params = new URLSearchParams({ token });
  return apiFetch<{ success: boolean; message?: string }>(
    `/api/orders/published/${encodeURIComponent(normalizedSubdomain)}/${encodeURIComponent(orderId)}/capture-paypal?${params.toString()}`
  );
}

export async function listMyPublishedOrders(params?: {
  subdomain?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; items: ApiPublishedOrder[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.subdomain) query.set("subdomain", params.subdomain);
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<{ success: boolean; items: ApiPublishedOrder[]; total: number; page: number; totalPages: number }>(
    qs ? `/api/orders/published/my?${qs}` : "/api/orders/published/my"
  );
}

export async function updatePublishedOrderStatus(
  subdomain: string,
  id: string,
  status: "Pending" | "Processing" | "Paid" | "Shipped" | "Delivered" | "Cancelled" | "Returned"
): Promise<{ success: boolean; message?: string; data?: ApiPublishedOrder }> {
  const normalizedSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return apiFetch<{ success: boolean; message?: string; data?: ApiPublishedOrder }>(
    `/api/orders/published/${encodeURIComponent(normalizedSubdomain)}/${encodeURIComponent(id)}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    }
  );
}

export async function createStripePaymentIntent(
  subdomain: string,
  orderId: string
): Promise<{
  success: boolean;
  message?: string;
  clientSecret?: string;
  publicKey?: string;
}> {
  const sub = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return apiFetch<{
    success: boolean;
    message?: string;
    clientSecret?: string;
    publicKey?: string;
  }>(`/api/orders/published/${encodeURIComponent(sub)}/${encodeURIComponent(orderId)}/create-stripe-payment-intent`, {
    method: "POST",
  });
}

export async function getStripePublicKey(): Promise<{ success: boolean; publicKey?: string }> {
  return apiFetch<{ success: boolean; publicKey?: string }>("/api/orders/stripe-public-key");
}
