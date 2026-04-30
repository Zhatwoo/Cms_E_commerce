/**
 * Internal core for the API client.
 *
 * Auth: only HttpOnly cookie (mercato_token). No confidential data in
 * localStorage or cookies. User profile is kept in memory only and
 * fetched via GET /api/auth/me when needed.
 *
 * This module owns all module-private mutable state (active API base,
 * active project id, in-memory user) and the fetch primitives. All
 * other api/* modules import from here and never duplicate state.
 */

import { getApiBase, parseApiBaseList } from "../apiBase";

const DEFAULT_API_BASE = "http://localhost:5000";
let activeApiBase = getApiBase(process.env.NEXT_PUBLIC_API_URL, DEFAULT_API_BASE);
let activeProjectId: string | null = null;

const PUBLISHED_SITE_USER_PREFIX = "mercato_published_site_user_";
const RESERVED_PUBLISHED_SITE_SEGMENTS = new Set([
  "sites", "site", "s", "m_dashboard", "design", "auth", "admindashboard", "landing", "templates",
  "api", "_next", "favicon.ico", "admin", "login", "register", "signup",
]);

/* ── Types ──────────────────────────────────────────────────────── */

export type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  subscriptionPlan?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
  username?: string;
  website?: string;
  paymentMethods?: any[];
  paymentMethod?: any;
  emailVerified?: boolean;
  lastPasswordChange?: string;
  lastSeen?: string;
  notificationPreferences?: {
    securityAlerts: boolean;
    sessionNotifications: boolean;
    accountUpdates: boolean;
  };
};

export type AuthResponse = {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  confirmUrl?: string;
};

export type ApiError = { success: false; message: string; error?: string };

export type ApiMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  message: string;
  type: "support" | "internal" | "request";
  status: "unread" | "read";
  websiteId: string | null;
  createdAt: string;
};

/* ── Error helpers ──────────────────────────────────────────────── */

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || "";
  if (typeof error === "string") return error;
  return "";
}

export function isBackendUnavailableError(error: unknown): boolean {
  return getApiErrorMessage(error).includes("Backend is unreachable");
}

function isAccountDeactivatedError(error: unknown): boolean {
  const message = getApiErrorMessage(error).toLowerCase();
  return message.includes("account has been deactivated") || message.includes("your account has been deactivated");
}

export function isQuietAuthError(error: unknown): boolean {
  const message = getApiErrorMessage(error).toLowerCase();
  return (
    isAccountDeactivatedError(error) ||
    message.includes("not authorized") ||
    message.includes("no token")
  );
}

/* ── Token / in-memory user ─────────────────────────────────────── */

let inMemoryUser: User | null = (typeof window !== "undefined")
  ? (() => {
      try {
        const s = localStorage.getItem("mercato_session_user");
        return s ? JSON.parse(s) : null;
      } catch { return null; }
    })()
  : null;

/** Auth token lives in an HttpOnly cookie, not in JS. removeToken just clears any in-memory user state and the legacy non-HttpOnly mercato_user cookie. */
export function removeToken(): void {
  inMemoryUser = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("mercato_session_user");
    } catch { /* ignore */ }
  }
  if (typeof document === "undefined") return;
  document.cookie = "mercato_user=; Path=/; Max-Age=0";
}

/** Remove any legacy auth from localStorage so confidential data does not appear there. */
function clearLegacyAuthFromLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("mercato_user");
    window.localStorage.removeItem("mercato_token");
  } catch {
    // ignore
  }
}

export function getStoredUser(): User | null {
  clearLegacyAuthFromLocalStorage();
  return inMemoryUser;
}

export function setStoredUser(user: User | null): void {
  inMemoryUser = user;
  if (typeof window !== "undefined") {
    try {
      if (user) localStorage.setItem("mercato_session_user", JSON.stringify(user));
      else localStorage.removeItem("mercato_session_user");
    } catch { /* ignore */ }
  }
}

/* ── Published site user ────────────────────────────────────────── */

function getPublishedSiteStorageKey(identifier: string): string {
  return `${PUBLISHED_SITE_USER_PREFIX}${encodeURIComponent(String(identifier || "").trim().toLowerCase())}`;
}

export function getPublishedSiteIdentifier(): string | null {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname || "";
  const pathSegments = pathname.split("/").filter(Boolean);
  const firstSegment = pathSegments[0] || "";
  const secondSegment = pathSegments[1] || "";

  if (firstSegment && firstSegment !== "sites" && firstSegment !== "s" && RESERVED_PUBLISHED_SITE_SEGMENTS.has(firstSegment)) {
    return null;
  }

  const fromPath =
    (firstSegment === "sites" || firstSegment === "s") && secondSegment
      ? secondSegment.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")
      : "";

  if (fromPath && !RESERVED_PUBLISHED_SITE_SEGMENTS.has(fromPath)) {
    return fromPath;
  }

  const host = (window.location.hostname || "").trim().toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;

  if (host.endsWith(".localhost")) {
    const subdomain = host.slice(0, -".localhost".length).trim();
    if (subdomain && !RESERVED_PUBLISHED_SITE_SEGMENTS.has(subdomain)) {
      return subdomain;
    }
    return null;
  }

  const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || "").trim().toLowerCase();
  if (baseDomain) {
    if (host === baseDomain) return null;
    if (host.endsWith(`.${baseDomain}`)) {
      const subdomain = host.slice(0, -(baseDomain.length + 1)).trim();
      if (subdomain && !RESERVED_PUBLISHED_SITE_SEGMENTS.has(subdomain)) {
        return subdomain;
      }
      return null;
    }
  }

  return host;
}

export function getStoredPublishedSiteUser(identifier?: string | null): User | null {
  if (typeof window === "undefined") return null;
  const siteIdentifier = String(identifier || getPublishedSiteIdentifier() || "").trim().toLowerCase();
  if (!siteIdentifier) return null;

  try {
    const raw = localStorage.getItem(getPublishedSiteStorageKey(siteIdentifier));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredPublishedSiteUser(identifier: string | null, user: User | null): void {
  if (typeof window === "undefined") return;
  const siteIdentifier = String(identifier || "").trim().toLowerCase();
  if (!siteIdentifier) return;

  try {
    const storageKey = getPublishedSiteStorageKey(siteIdentifier);
    if (user) localStorage.setItem(storageKey, JSON.stringify(user));
    else localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

/* ── Active project / API base ──────────────────────────────────── */

export function setActiveProjectId(projectId: string | null): void {
  const normalized = (projectId || "").toString().trim();
  activeProjectId = normalized || null;
}

export function getActiveProjectId(): string | null {
  return activeProjectId;
}

export function getApiUrl(): string {
  return activeApiBase;
}

/** Update the cached active API base after a successful request to a candidate. */
export function setActiveApiBase(base: string): void {
  activeApiBase = base;
}

export function getApiCandidates(): string[] {
  const envApis = parseApiBaseList(process.env.NEXT_PUBLIC_API_URL);
  const candidates = new Set<string>();

  envApis.forEach((v) => candidates.add(v));
  candidates.add(activeApiBase);

  // Local DX fallback: backend may auto-switch to 5001 when 5000 is busy.
  const hasLocal5000 = envApis.some((v) => /^https?:\/\/(localhost|127\.0\.0\.1):5000$/i.test(v));
  if (envApis.length === 0 || hasLocal5000) {
    candidates.add("http://localhost:5000");
    candidates.add("http://127.0.0.1:5000");
    candidates.add("http://localhost:5001");
    candidates.add("http://127.0.0.1:5001");
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "https" : "http";
    const host = (window.location.hostname || "").trim();
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      candidates.add(`${protocol}://${host}:5000`);
      candidates.add(`${protocol}://${host}:5001`);
      if (protocol === "https") {
        candidates.add(`http://${host}:5000`);
        candidates.add(`http://${host}:5001`);
      }
    }
  }

  return Array.from(candidates);
}

/* ── Fetch primitives ───────────────────────────────────────────── */

export async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as ApiError).message || res.statusText || "Request failed";
    throw new Error(msg);
  }
  return data as T;
}

/** GET/POST etc. to API. Sends HttpOnly cookie (credentials) and optional Bearer token. */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const skipActiveProjectScope = headers["x-skip-active-project-scope"] === "1";
  if (skipActiveProjectScope) {
    delete headers["x-skip-active-project-scope"];
  }

  const isPublicSitePath = normalizedPath.startsWith("/api/public/");
  if (!skipActiveProjectScope && !isPublicSitePath && activeProjectId && !headers["x-project-id"]) {
    headers["x-project-id"] = activeProjectId;
  }

  // In the browser, prefer same-origin requests to Next's `/api/*` proxy.
  // This avoids CORS/cookie edge cases when accessing via LAN IP on phones.
  if (typeof window !== "undefined" && normalizedPath.startsWith("/api/")) {
    try {
      const res = await fetch(normalizedPath, {
        ...options,
        headers,
        credentials: "include",
      });
      return await handleResponse<T>(res);
    } catch (error) {
      // If it's a network error (TypeError), fall through to candidate loop
      // which might try a direct backend URL (localhost:5001 etc.)
      if (!(error instanceof TypeError)) {
        throw error;
      }
    }
  }

  const candidates = getApiCandidates();
  let lastError: unknown = null;

  for (const base of candidates) {
    const url = `${base}${normalizedPath}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
      const data = await handleResponse<T>(res);
      activeApiBase = base;
      return data;
    } catch (error: any) {
      lastError = error;
      // Retry on network-level failures OR 404s on local candidates (could be hit a zombie server)
      const isLocal = base.includes("localhost") || base.includes("127.0.0.1");
      const isNotFoundError = error.message?.includes("Route not found") || error.message?.includes("Not Found");

      if (isLocal && isNotFoundError && candidates.indexOf(base) < candidates.length - 1) {
        continue;
      }

      if (!(error instanceof TypeError)) {
        throw error;
      }
    }
  }

  void lastError;
  throw new Error("Backend is unreachable. Start the backend server and ensure API URL/port is correct.");
}

/** Same-origin fetch for auth endpoints; falls back to apiFetch on the server. */
export async function authFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (typeof window === "undefined") {
    return apiFetch<T>(path, options);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
  });

  return handleResponse<T>(res);
}

/** Same as authFetch but adds the x-site-identifier header for published-site auth. */
export async function publishedAuthFetch<T>(
  path: string,
  options: RequestInit = {},
  siteIdentifier?: string | null
): Promise<T> {
  const identifier = String(siteIdentifier || getPublishedSiteIdentifier() || "").trim().toLowerCase();
  if (!identifier) {
    throw new Error("Published site could not be identified.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-site-identifier": identifier,
    ...((options.headers as Record<string, string>) || {}),
  };

  if (typeof window === "undefined") {
    return apiFetch<T>(path, {
      ...options,
      headers,
    });
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
  });

  return handleResponse<T>(res);
}
