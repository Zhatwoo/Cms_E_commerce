/**
 * Auth: only HttpOnly cookie (mercato_token). No confidential data in localStorage or cookies.
 * User profile is kept in memory only; fetched via GET /api/auth/me when needed.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
let activeApiBase = API_URL.replace(/\/$/, '');
let activeProjectId: string | null = null;

/** In-memory user only; never persisted to localStorage or cookies. */
let inMemoryUser: User | null = null;

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
};

export type AuthResponse = {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  confirmUrl?: string;
};

export type ApiError = { success: false; message: string; error?: string };

/** Token is in HttpOnly cookie only; not readable from JS. */
export function getToken(): string | null {
  return null;
}

export function setToken(_token: string): void {
  // No-op: token is set by backend in HttpOnly cookie
}

export function removeToken(): void {
  inMemoryUser = null;
  if (typeof document === 'undefined') return;
  document.cookie = 'mercato_user=; Path=/; Max-Age=0';
}

/** Remove any legacy auth from localStorage so confidential data does not appear there. */
function clearLegacyAuthFromLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('mercato_user');
    window.localStorage.removeItem('mercato_token');
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
}

export function setActiveProjectId(projectId: string | null): void {
  const normalized = (projectId || '').toString().trim();
  activeProjectId = normalized || null;
}

export function getActiveProjectId(): string | null {
  return activeProjectId;
}

export function getApiUrl(): string {
  return activeApiBase;
}

function getApiCandidates(): string[] {
  const envApi = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
  const candidates = new Set<string>();

  if (envApi) candidates.add(envApi);
  candidates.add(activeApiBase);

  // Local DX fallback: backend may auto-switch to 5001 when 5000 is busy.
  if (!envApi || /^https?:\/\/(localhost|127\.0\.0\.1):5000$/i.test(envApi)) {
    candidates.add('http://localhost:5000');
    candidates.add('http://127.0.0.1:5000');
    candidates.add('http://localhost:5001');
    candidates.add('http://127.0.0.1:5001');
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const host = (window.location.hostname || '').trim();
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      candidates.add(`${protocol}://${host}:5000`);
      candidates.add(`${protocol}://${host}:5001`);
      if (protocol === 'https') {
        candidates.add(`http://${host}:5000`);
        candidates.add(`http://${host}:5001`);
      }
    }
  }

  return Array.from(candidates);
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as ApiError).message || res.statusText || 'Request failed';
    throw new Error(msg);
  }
  return data as T;
}

/** GET/POST etc. to API. Sends HttpOnly cookie (credentials) and optional Bearer token. */
// export async function apiFetch<T>(
//   path: string,
//   options: RequestInit = {}
// ): Promise<T> {
//   const url = `${getApiUrl()}${path.startsWith('/') ? path : `/${path}`}`;
//   const token = getToken();
//   const headers: HeadersInit = {
//     'Content-Type': 'application/json',
//     ...(options.headers as Record<string, string>),
//   };
//   if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
//   const res = await fetch(url, { ...options, headers, credentials: 'include' });
//   return handleResponse<T>(res);
// }

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (activeProjectId && !headers['x-project-id']) {
    headers['x-project-id'] = activeProjectId;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const candidates = getApiCandidates();
  let lastError: unknown = null;

  for (const base of candidates) {
    const url = `${base}${normalizedPath}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // ✅ cookie only
      });
      activeApiBase = base;
      return await handleResponse<T>(res);
    } catch (error) {
      lastError = error;
      // Only retry on network-level failures (e.g. backend down / wrong port).
      if (!(error instanceof TypeError)) {
        throw error;
      }
    }
  }

  throw new Error('Backend is unreachable. Start the backend server and ensure API URL/port is correct.');
}

// --- Auth API helpers (backend accepts idToken or email+password) ---

/** Login with Firebase idToken (browser signs in; works even if backend API key is restricted). */
export async function loginWithIdToken(idToken: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

/** Login: email + password. Prefer Firebase client sign-in then idToken; fallback to backend email/password. */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const { signInAndGetIdToken, isFirebaseConfigured } = await import('@/lib/firebase');
  if (isFirebaseConfigured()) {
    try {
      const idToken = await signInAndGetIdToken(email, password);
      return loginWithIdToken(idToken);
    } catch {
      // Fallback: backend email/password (e.g. REST API)
    }
  }
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(params: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return data;
}

/** Register Super Admin from /admindashboard/register (no auth required). Saves to Firestore user/roles/super_admin. Returns session cookie. */
export async function registerAdmin(params: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register-admin', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

/** Verify email with token from confirmation link. Returns user and token for auto-login. */
export async function verifyEmail(token: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

/** Resend verification email to the given email address. */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

/** Logout: clear cookie on backend and clear local user data */
export async function logout(): Promise<void> {
  try {
    await fetch(`${getApiUrl()}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {
    // ignore
  }
  removeToken();
}

/** Get current user from backend (uses cookie). Use to restore session when only cookie is present. */
export async function getMe(): Promise<{ success: boolean; user?: User }> {
  return apiFetch<{ success: boolean; user?: User }>('/api/auth/me');
}

/** Update user profile (Name, Avatar) */
export async function updateProfile(data: {
  name?: string;
  avatar?: string;
}): Promise<{ success: boolean; message?: string; user?: User }> {
  return apiFetch<{ success: boolean; message?: string; user?: User }>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Upload avatar via backend: file is saved in Storage only (Clients/{uid}/avatar.ext). Backend returns URL and updated user. */
export async function uploadAvatarApi(
  file: File
): Promise<{ success: boolean; message?: string; url?: string; user?: User }> {
  const formData = new FormData();
  formData.append('avatar', file);
  const url = `${getApiUrl()}/api/auth/avatar`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return handleResponse<{ success: boolean; message?: string; url?: string; user?: User }>(res);
}

/** Create user (admin only). Role: 'admin' | 'client' | 'super_admin'. */
export async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'client' | 'super_admin';
}): Promise<{ success: boolean; message?: string; user?: User }> {
  return apiFetch<{ success: boolean; message?: string; user?: User }>('/api/users', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// --- Projects (client user drafts / web builder) ---

export type Project = {
  id: string;
  title: string;
  status: string;
  templateId?: string | null;
  subdomain?: string | null;
  thumbnail?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  daysLeft?: number;
};

export async function listProjects(): Promise<{ success: boolean; projects: Project[] }> {
  return apiFetch<{ success: boolean; projects: Project[] }>('/api/projects');
}

export async function createProject(params: {
  title?: string;
  templateId?: string | null;
  subdomain?: string | null;
}): Promise<{ success: boolean; project: Project; message?: string }> {
  return apiFetch<{ success: boolean; project: Project; message?: string }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getProject(id: string): Promise<{ success: boolean; project: Project; message?: string }> {
  return apiFetch<{ success: boolean; project: Project; message?: string }>(`/api/projects/${id}`);
}

export async function getProjectBySubdomain(subdomain: string): Promise<{ success: boolean; project?: Project }> {
  const sub = encodeURIComponent(subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || '');
  try {
    const data = await apiFetch<{ success: boolean; project?: Project }>(`/api/projects/by-subdomain?subdomain=${sub}`);
    return data;
  } catch {
    return { success: false };
  }
}

export async function updateProject(
  id: string,
  params: { title?: string; status?: string; subdomain?: string | null; thumbnail?: string | null }
): Promise<{ success: boolean; project: Project; message?: string }> {
  return apiFetch<{ success: boolean; project: Project; message?: string }>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
}

/** Move project to trash instead of deleting permanently. */
export async function deleteProject(id: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/projects/${id}`, { method: 'DELETE' });
}

/** List all projects currently in the trash for the user. */
export async function listTrashedProjects(): Promise<{ success: boolean; projects: Project[] }> {
  return apiFetch<{ success: boolean; projects: Project[] }>('/api/projects/trash');
}

/** Restore a project from the trash back to the active list. */
export async function restoreProject(id: string): Promise<{ success: boolean; project: Project; message?: string }> {
  return apiFetch<{ success: boolean; project: Project; message?: string }>(`/api/projects/${id}/restore`, {
    method: 'POST',
  });
}

/** Permanently purge a project from the database. This action cannot be undone. */
export async function permanentDeleteProject(id: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/projects/${id}/permanent`, {
    method: 'DELETE',
  });
}

/** Publish current project from Preview: creates/updates domain and public lookup so /sites/:subdomain works. */
export async function publishProject(
  projectId: string,
  subdomain?: string | null,
  content?: string | Record<string, unknown> | null
): Promise<{ success: boolean; message?: string; data?: { id: string; subdomain?: string } }> {
  return apiFetch<{ success: boolean; message?: string; data?: { id: string; subdomain?: string } }>('/api/domains/publish', {
    method: 'POST',
    body: JSON.stringify({ projectId, subdomain: subdomain || undefined, content: content ?? undefined }),
  });
}

/** Schedule publish: current draft will go live at the given date/time (site must be published at least once). */
export async function schedulePublish(
  projectId: string,
  scheduledAt: string,
  subdomain?: string | null,
  content?: string | Record<string, unknown> | null
): Promise<{ success: boolean; message?: string; data?: { subdomain?: string; scheduledAt?: string } }> {
  return apiFetch('/api/domains/schedule-publish', {
    method: 'POST',
    body: JSON.stringify({ projectId, subdomain: subdomain || undefined, scheduledAt, content: content ?? undefined }),
  });
}

/** Get scheduled publish for a project (if any). */
export async function getSchedule(projectId: string): Promise<{ success: boolean; data?: { scheduledAt: string; subdomain: string | null } | null }> {
  return apiFetch<{ success: boolean; data?: { scheduledAt: string; subdomain: string | null } | null }>(
    `/api/domains/schedule?projectId=${encodeURIComponent(projectId)}`
  );
}

/** Get publish history for a project (stack of { at, type }), newest first. */
export type PublishHistoryEntry = { at: string; type: string };
export async function getPublishHistory(projectId: string): Promise<{ success: boolean; data?: { history: PublishHistoryEntry[] } }> {
  return apiFetch<{ success: boolean; data?: { history: PublishHistoryEntry[] } }>(
    `/api/domains/publish-history?projectId=${encodeURIComponent(projectId)}`
  );
}

// --- Products (stored per published_subdomains/{subdomain}/products) ---

export type ApiProduct = {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  slug?: string;
  description?: string;
  price: number;
  basePrice?: number;
  costPrice?: number | null;
  finalPrice?: number;
  compareAtPrice?: number | null;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  hasVariants?: boolean;
  variants?: Array<{
    id: string;
    name: string;
    pricingMode: 'modifier' | 'override';
    options: Array<{
      id: string;
      name: string;
      priceAdjustment: number;
    }>;
  }>;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  images?: string[];
  status?: string;
  stock?: number | null;
  subdomain?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function listProducts(params?: {
  subdomain?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; items: ApiProduct[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.subdomain) query.set('subdomain', params.subdomain);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const path = qs ? `/api/products?${qs}` : '/api/products';
  return apiFetch<{ success: boolean; items: ApiProduct[]; total: number; page: number; totalPages: number }>(path);
}

// For uploading prodcut images to Firebase Storage 
export async function uploadProductImageApi(
  file: File,
  subdomain?: string
): Promise<{ success: boolean; message?: string; url?: string }> {
  const candidates = getApiCandidates();
  let lastError: unknown = null;

  for (const base of candidates) {
    const formData = new FormData();
    formData.append('image', file);
    if (subdomain) formData.append('subdomain', subdomain);

    try {
      const res = await fetch(`${base}/api/products/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      activeApiBase = base;
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
  throw new Error('Backend is unreachable. Start the backend server and ensure API URL/port is correct.');
}

export async function createProduct(params: {
  subdomain: string;
  name: string;
  sku?: string;
  category?: string;
  slug?: string;
  description?: string;
  price?: number;
  basePrice?: number;
  costPrice?: number | null;
  finalPrice?: number;
  compareAtPrice?: number | null;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  hasVariants?: boolean;
  variants?: Array<{
    id: string;
    name: string;
    pricingMode: 'modifier' | 'override';
    options: Array<{
      id: string;
      name: string;
      priceAdjustment: number;
    }>;
  }>;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  images?: string[];
  status?: string;
  stock?: number | null;
}): Promise<{ success: boolean; message?: string; data?: ApiProduct }> {
  return apiFetch<{ success: boolean; message?: string; data?: ApiProduct }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function updateProduct(
  id: string,
  params: {
    name?: string;
    sku?: string;
    category?: string;
    slug?: string;
    description?: string;
    price?: number;
    basePrice?: number;
    costPrice?: number | null;
    finalPrice?: number;
    compareAtPrice?: number | null;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    hasVariants?: boolean;
    variants?: Array<{
      id: string;
      name: string;
      pricingMode: 'modifier' | 'override';
      options: Array<{
        id: string;
        name: string;
        priceAdjustment: number;
      }>;
    }>;
    priceRangeMin?: number | null;
    priceRangeMax?: number | null;
    images?: string[];
    status?: string;
    stock?: number | null;
  }
): Promise<{ success: boolean; message?: string; data?: ApiProduct }> {
  return apiFetch<{ success: boolean; message?: string; data?: ApiProduct }>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/products/${id}`, {
    method: 'DELETE',
  });
}

/** Admin: User and Website Management — list websites with owner and plan from user/roles/client (subscription_plan). */
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
  return apiFetch<{ success: boolean; data?: DomainRow[] }>('/api/domains/my');
}

export type WebsiteManagementRow = {
  id: string;
  userId: string;
  domainName: string;
  owner: string;
  status: string;
  plan: string;
  domainType: string;
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
  // Same-origin proxy so request works when frontend and backend are on different origins
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/domains/management', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<{ success: boolean; data?: WebsiteManagementRow[]; stats?: WebsiteManagementStats }>(res);
  }
  return apiFetch<{
    success: boolean;
    data?: WebsiteManagementRow[];
    stats?: WebsiteManagementStats;
  }>('/api/domains/admin/management');
}

/** Admin: list all clients from user/roles/client with subscription_plan. */
export type ClientRow = {
  id: string;
  email: string;
  displayName: string;
  subscriptionPlan: string;
  status: string;
  createdAt?: string;
  isActive?: boolean;
};

export async function getClients(): Promise<{
  success: boolean;
  users?: ClientRow[];
  total?: number;
}> {
  return apiFetch<{ success: boolean; users?: ClientRow[]; total?: number }>(
    '/api/users?role=client&limit=500'
  );
}

/** Admin: update a client's subscription plan (free, basic, pro). */
export async function updateClientPlan(
  userId: string,
  plan: string
): Promise<{ success: boolean; message?: string; user?: ClientRow }> {
  return apiFetch<{ success: boolean; message?: string; user?: ClientRow }>(
    `/api/users/${userId}/plan`,
    { method: 'PUT', body: JSON.stringify({ plan }) }
  );
}

/** Admin: update client status (Published = active, Suspended, Restricted). */
export async function updateClientStatus(
  userId: string,
  status: 'Published' | 'Suspended' | 'Restricted'
): Promise<{ success: boolean; message?: string; user?: ClientRow }> {
  return apiFetch<{ success: boolean; message?: string; user?: ClientRow }>(
    `/api/users/${userId}/status`,
    { method: 'PUT', body: JSON.stringify({ status }) }
  );
}

/** Admin: delete a client (cannot delete self). */
export async function deleteClient(userId: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/users/${userId}`, {
    method: 'DELETE',
  });
}

/** Admin: set client domain status (published | suspended | flagged | draft). Uses same-origin proxy so cookies are sent. */
export async function setClientDomainStatus(
  userId: string,
  domainId: string,
  status: string
): Promise<{ success: boolean; message?: string }> {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/domains/admin/set-client-status', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, domainId, status }),
    });
    return handleResponse<{ success: boolean; message?: string }>(res);
  }
  return apiFetch<{ success: boolean; message?: string }>('/api/domains/admin/set-client-status', {
    method: 'POST',
    body: JSON.stringify({ userId, domainId, status }),
  });
}

/** Admin: analytics for Monitoring & Analytics (real data). */
export type AnalyticsResponse = {
  success: boolean;
  analytics?: {
    summary: { activeUsers: number; revenue: number; publishedWebsites: number };
    subscriptionDistribution: { free: number; basic: number; pro: number };
    signupsOverTime: { labels: string[]; signups: number[] };
    revenueOverTime: { labels: string[]; data: number[] };
    workspace: { totalProjects: number; draftSites: number; customDomains: number; avgSitesPerUser: string };
  };
  message?: string;
};

export async function getAnalytics(period: '7days' | '30days' | '3months' = '7days'): Promise<AnalyticsResponse> {
  // Same-origin proxy so cookies are sent and backend is reachable
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/dashboard/analytics?period=${encodeURIComponent(period)}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<AnalyticsResponse>(res);
  }
  return apiFetch<AnalyticsResponse>(`/api/dashboard/analytics?period=${encodeURIComponent(period)}`);
}
