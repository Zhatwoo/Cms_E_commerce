/**
 * Admin & cross-cutting endpoints:
 *   - Domain ownership/management views (getMyDomains, websites mgmt,
 *     site analytics tracking)
 *   - Client account administration (list, plan/status updates, etc.)
 *   - Platform analytics for the admin dashboard
 *   - Shared notifications and messages
 *   - Chat/conversations (currently stubbed; messaging feature is
 *     half-implemented)
 */

import {
  apiFetch,
  authFetch,
  handleResponse,
  type ApiMessage,
} from "./_core";

/* ── Domain ownership / website management ─────────────────────── */

export type DomainRow = {
  id: string;
  userId: string;
  domain: string;
  status: string;
  createdAt?: string;
};

export async function getMyDomains(): Promise<{
  success: boolean;
  data?: DomainRow[];
}> {
  return apiFetch<{ success: boolean; data?: DomainRow[] }>("/api/domains/my");
}

export type WebsiteManagementRow = {
  id: string;
  projectId?: string;
  userId: string;
  domainName: string;
  thumbnail?: string;
  industry?: string | null;
  owner: string;
  status: string;
  plan: string;
  domainType: string;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  errors?: number;
  reports?: number;
  analyticsKey?: string;
};

export type WebsiteManagementStats = {
  total: number;
  live: number;
  underReview: number;
  flagged: number;
};

export async function getDomainsManagement(): Promise<{
  success: boolean;
  data?: WebsiteManagementRow[];
  stats?: WebsiteManagementStats;
}> {
  return apiFetch<{
    success: boolean;
    data?: WebsiteManagementRow[];
    stats?: WebsiteManagementStats;
  }>("/api/domains/admin/management");
}

export type WebsiteAnalyticsData = {
  domainId: string;
  views: number;
  errors: number;
  reports: number;
  lastViewedAt?: string;
  lastErrorAt?: string;
  lastReportedAt?: string;
};

export async function getWebsiteAnalytics(domainIds: string[]): Promise<{
  success: boolean;
  analytics?: Record<string, WebsiteAnalyticsData>;
}> {
  if (!domainIds || domainIds.length === 0) {
    return { success: true, analytics: {} };
  }

  const queryString = domainIds.map((id) => `domainIds=${encodeURIComponent(id)}`).join("&");
  return apiFetch<{ success: boolean; analytics?: Record<string, WebsiteAnalyticsData> }>(
    `/api/dashboard/website-analytics?${queryString}`
  );
}

/* ── Client administration ──────────────────────────────────────── */

export type ClientRow = {
  id: string;
  email: string;
  displayName: string;
  subscriptionPlan: string;
  status: string;
  suspensionReason?: string;
  createdAt?: string;
  isActive?: boolean;
  storageUsedBytes?: number;
  storageLimitBytes?: number;
  storageUsedGb?: number;
  storageLimitGb?: number;
  phone?: string;
  bio?: string;
  lastSeen?: string;
  isOnline?: boolean;
};

export async function getClients(): Promise<{
  success: boolean;
  users?: ClientRow[];
  total?: number;
}> {
  return apiFetch<{ success: boolean; users?: ClientRow[]; total?: number }>(
    "/api/users?role=client&limit=500"
  );
}

/** Admin: update a client's subscription plan (free, basic, pro). */
export async function updateClientPlan(
  userId: string,
  plan: string
): Promise<{ success: boolean; message?: string; user?: ClientRow }> {
  return apiFetch<{ success: boolean; message?: string; user?: ClientRow }>(
    `/api/users/${userId}/plan`,
    { method: "PUT", body: JSON.stringify({ plan }) }
  );
}

/** Admin: update client status (Published = active, Suspended, Restricted). */
export async function updateClientStatus(
  userId: string,
  status: "Published" | "Suspended" | "Restricted",
  suspensionReason?: string
): Promise<{ success: boolean; message?: string; user?: ClientRow }> {
  return apiFetch<{ success: boolean; message?: string; user?: ClientRow }>(
    `/api/users/${userId}/status`,
    { method: "PUT", body: JSON.stringify({ status, suspensionReason }) }
  );
}

/** Admin: delete a client (cannot delete self). */
export async function deleteClient(userId: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/users/${userId}`, {
    method: "DELETE",
  });
}

/** Admin: update a client's profile details (name, email, password, etc.). */
export async function updateClientDetails(
  userId: string,
  data: { name?: string; email?: string; phone?: string; bio?: string; password?: string }
): Promise<{ success: boolean; message?: string; user?: ClientRow }> {
  return apiFetch<{ success: boolean; message?: string; user?: ClientRow }>(
    `/api/users/${userId}`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

/** Admin: set client domain status (published | suspended | flagged | draft). Uses same-origin proxy so cookies are sent. */
export async function setClientDomainStatus(
  userId: string,
  domainId: string,
  status: string
): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(
    "/api/domains/admin/set-client-status",
    {
      method: "POST",
      body: JSON.stringify({ userId, domainId, status }),
    }
  );
}

/** Admin: update a client's website subdomain by project/domain context. */
export async function adminUpdateClientDomainSubdomain(
  userId: string,
  subdomain: string,
  options?: { projectId?: string; domainId?: string }
): Promise<{ success: boolean; message?: string; data?: { subdomain?: string } }> {
  return apiFetch<{ success: boolean; message?: string; data?: { subdomain?: string } }>(
    "/api/domains/admin/update-subdomain",
    {
      method: "POST",
      body: JSON.stringify({
        userId,
        subdomain,
        projectId: options?.projectId,
        domainId: options?.domainId,
      }),
    }
  );
}

/* ── Platform analytics ─────────────────────────────────────────── */

export type AnalyticsResponse = {
  success: boolean;
  analytics?: {
    summary: {
      activeUsers: number;
      revenue: number;
      publishedWebsites: number;
      pendingWebsites: number;
      activeDomains: number;
    };
    trends: {
      users: number[];
      maxActiveUsers: number[];
      websites: number[];
      domains: number[];
      pending: number[];
    };
    subscriptionDistribution: { free: number; basic: number; pro: number };
    signupsOverTime: { labels: string[]; signups: number[] };
    revenueOverTime: { labels: string[]; data: number[] };
    workspace: { totalProjects: number; draftSites: number; customDomains: number; avgSitesPerUser: string };
  };
  message?: string;
};

export async function getAnalytics(period: "7days" | "30days" | "3months" = "7days"): Promise<AnalyticsResponse> {
  // Same-origin proxy so cookies are sent and backend is reachable.
  if (typeof window !== "undefined") {
    const res = await fetch(`/api/dashboard/analytics?period=${encodeURIComponent(period)}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<AnalyticsResponse>(res);
  }
  return apiFetch<AnalyticsResponse>(`/api/dashboard/analytics?period=${encodeURIComponent(period)}`);
}

/* ── Shared notifications (audit trail for ALL admins) ─────────── */

export async function getSharedNotifications(): Promise<{ success: boolean; notifications: any[] }> {
  return apiFetch<{ success: boolean; notifications: any[] }>("/api/notifications");
}

export async function addSharedNotification(data: { title: string; message: string; type?: string; [key: string]: any }): Promise<{ success: boolean; notification: any }> {
  return apiFetch<{ success: boolean; notification: any }>("/api/notifications", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function markSharedNotificationRead(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/notifications/${id}/read`, { method: "PUT" });
}

export async function markAllSharedNotificationsRead(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/api/notifications/mark-all-read", { method: "PUT" });
}

export async function deleteSharedNotification(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/notifications/${id}`, { method: "DELETE" });
}

/* ── Messages ──────────────────────────────────────────────────── */

export async function getMessages(filters: { type?: string; status?: string; limit?: number } = {}): Promise<{ success: boolean; data: ApiMessage[] }> {
  try {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.status) params.append("status", filters.status);
    if (filters.limit) params.append("limit", filters.limit.toString());

    return await authFetch(`/api/messages?${params.toString()}`);
  } catch {
    return { success: false, data: [] };
  }
}

export async function sendMessage(data: { message: string; type: "support" | "internal" | "request"; senderName?: string; senderAvatar?: string; websiteId?: string }): Promise<{ success: boolean; data?: ApiMessage }> {
  try {
    return await authFetch("/api/messages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return { success: false };
  }
}

export async function markMessageRead(id: string): Promise<{ success: boolean }> {
  try {
    return await authFetch(`/api/messages/${id}/read`, { method: "PATCH" });
  } catch {
    return { success: false };
  }
}

/* ── Chat / Conversations ──────────────────────────────────────── */

export type Conversation = {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserUsername?: string;
  otherUserEmail?: string;
  otherUserRole?: string;
  lastMessage: string;
  lastMessageType: string;
  lastMessageTime: string;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  recipientId: string | null;
  conversationId: string | null;
  message: string;
  type: string;
  status: string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatar: string | null;
};

export async function getAdmins(search?: string): Promise<{ success: boolean; data: AdminUser[] }> {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    const qs = params.toString();
    return await authFetch(`/api/users/admins/list${qs ? "?" + qs : ""}`);
  } catch {
    return { success: false, data: [] };
  }
}

/**
 * Conversation/messaging stubs. The messaging feature is currently
 * half-implemented; these stubs let callers compile and render an
 * empty state without making network calls.
 */
export async function getConversations(): Promise<{ success: boolean; data: Conversation[] }> {
  return { success: false, data: [] };
}

export async function getConversationMessages(_otherUserId: string): Promise<{ success: boolean; data: ChatMessage[] }> {
  return { success: false, data: [] };
}

export async function sendDirectMessage(
  _recipientId: string,
  _message: string,
): Promise<{ success: boolean; message?: string; data?: ChatMessage }> {
  return { success: false, message: "Messaging feature is not yet available." };
}
