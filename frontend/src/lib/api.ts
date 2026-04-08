/**
 * Auth: only HttpOnly cookie (mercato_token). No confidential data in localStorage or cookies.
 * User profile is kept in memory only; fetched via GET /api/auth/me when needed.
 */

import { getApiBase, parseApiBaseList } from "./apiBase";

const DEFAULT_API_BASE = "http://localhost:5000";
let activeApiBase = getApiBase(process.env.NEXT_PUBLIC_API_URL, DEFAULT_API_BASE);
let activeProjectId: string | null = null;
const PUBLISHED_SITE_USER_PREFIX = 'mercato_published_site_user_';
const RESERVED_PUBLISHED_SITE_SEGMENTS = new Set([
  'sites', 'site', 's', 'm_dashboard', 'design', 'auth', 'admindashboard', 'landing', 'templates',
  'api', '_next', 'favicon.ico', 'admin', 'login', 'register', 'signup',
]);

/** In-memory user with session persistence (for UI consistency during mock-saving). */
let inMemoryUser: User | null = (typeof window !== 'undefined') 
  ? (() => {
      try {
          const s = localStorage.getItem('mercato_session_user');
          return s ? JSON.parse(s) : null;
      } catch { return null; }
  })()
  : null;

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
  paymentMethod?: any; // kept for compatibility
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
  type: 'support' | 'internal' | 'request';
  status: 'unread' | 'read';
  websiteId: string | null;
  createdAt: string;
};

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || '';
  if (typeof error === 'string') return error;
  return '';
}

export function isBackendUnavailableError(error: unknown): boolean {
  return getApiErrorMessage(error).includes('Backend is unreachable');
}

export function isAccountDeactivatedError(error: unknown): boolean {
  const message = getApiErrorMessage(error).toLowerCase();
  return message.includes('account has been deactivated') || message.includes('your account has been deactivated');
}

export function isQuietAuthError(error: unknown): boolean {
  const message = getApiErrorMessage(error).toLowerCase();
  return (
    isAccountDeactivatedError(error) ||
    message.includes('not authorized') ||
    message.includes('no token')
  );
}

/** Token is in HttpOnly cookie only; not readable from JS. */
export function getToken(): string | null {
  return null;
}

export function setToken(_token: string): void {
  // No-op: token is set by backend in HttpOnly cookie
}

export function removeToken(): void {
  inMemoryUser = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('mercato_session_user');
    } catch { /* ignore */ }
  }
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
  if (typeof window !== 'undefined') {
    try {
      if (user) localStorage.setItem('mercato_session_user', JSON.stringify(user));
      else localStorage.removeItem('mercato_session_user');
    } catch { /* ignore */ }
  }
}

function getPublishedSiteStorageKey(identifier: string): string {
  return `${PUBLISHED_SITE_USER_PREFIX}${encodeURIComponent(String(identifier || '').trim().toLowerCase())}`;
}

export function getPublishedSiteIdentifier(): string | null {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname || '';
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0] || '';
  const secondSegment = pathSegments[1] || '';

  if (firstSegment && firstSegment !== 'sites' && firstSegment !== 's' && RESERVED_PUBLISHED_SITE_SEGMENTS.has(firstSegment)) {
    return null;
  }

  const fromPath =
    (firstSegment === 'sites' || firstSegment === 's') && secondSegment
      ? secondSegment.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
      : '';

  if (fromPath && !RESERVED_PUBLISHED_SITE_SEGMENTS.has(fromPath)) {
    return fromPath;
  }

  const host = (window.location.hostname || '').trim().toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;

  if (host.endsWith('.localhost')) {
    const subdomain = host.slice(0, -'.localhost'.length).trim();
    if (subdomain && !RESERVED_PUBLISHED_SITE_SEGMENTS.has(subdomain)) {
      return subdomain;
    }
    return null;
  }

  const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || '').trim().toLowerCase();
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
  if (typeof window === 'undefined') return null;
  const siteIdentifier = String(identifier || getPublishedSiteIdentifier() || '').trim().toLowerCase();
  if (!siteIdentifier) return null;

  try {
    const raw = localStorage.getItem(getPublishedSiteStorageKey(siteIdentifier));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredPublishedSiteUser(identifier: string | null, user: User | null): void {
  if (typeof window === 'undefined') return;
  const siteIdentifier = String(identifier || '').trim().toLowerCase();
  if (!siteIdentifier) return;

  try {
    const storageKey = getPublishedSiteStorageKey(siteIdentifier);
    if (user) localStorage.setItem(storageKey, JSON.stringify(user));
    else localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
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
  const envApis = parseApiBaseList(process.env.NEXT_PUBLIC_API_URL);
  const candidates = new Set<string>();

  envApis.forEach((v) => candidates.add(v));
  candidates.add(activeApiBase);

  // Local DX fallback: backend may auto-switch to 5001 when 5000 is busy.
  const hasLocal5000 = envApis.some((v) => /^https?:\/\/(localhost|127\.0\.0\.1):5000$/i.test(v));
  if (envApis.length === 0 || hasLocal5000) {
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

  const skipActiveProjectScope = headers['x-skip-active-project-scope'] === '1';
  if (skipActiveProjectScope) {
    delete headers['x-skip-active-project-scope'];
  }

  if (!skipActiveProjectScope && activeProjectId && !headers['x-project-id']) {
    headers['x-project-id'] = activeProjectId;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // In the browser, prefer same-origin requests to Next's `/api/*` proxy.
  // This avoids CORS/cookie edge cases when accessing via LAN IP on phones.
  if (typeof window !== 'undefined' && normalizedPath.startsWith('/api/')) {
    const res = await fetch(normalizedPath, {
      ...options,
      headers,
      credentials: 'include',
    });
    return handleResponse<T>(res);
  }

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
      const data = await handleResponse<T>(res);
      activeApiBase = base;
      return data;
    } catch (error: any) {
      lastError = error;
      // Retry on network-level failures OR 404s on local candidates (could be hit a zombie server)
      const isLocal = base.includes('localhost') || base.includes('127.0.0.1');
      const isNotFoundError = error.message?.includes('Route not found') || error.message?.includes('Not Found');
      
      if (isLocal && isNotFoundError && candidates.indexOf(base) < candidates.length - 1) {
        continue;
      }

      if (!(error instanceof TypeError)) {
        throw error;
      }
    }
  }

  throw new Error('Backend is unreachable. Start the backend server and ensure API URL/port is correct.');
}

async function authFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (typeof window === 'undefined') {
    return apiFetch<T>(path, options);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  return handleResponse<T>(res);
}

async function publishedAuthFetch<T>(
  path: string,
  options: RequestInit = {},
  siteIdentifier?: string | null
): Promise<T> {
  const identifier = String(siteIdentifier || getPublishedSiteIdentifier() || '').trim().toLowerCase();
  if (!identifier) {
    throw new Error('Published site could not be identified.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-site-identifier': identifier,
    ...((options.headers as Record<string, string>) || {}),
  };

  if (typeof window === 'undefined') {
    return apiFetch<T>(path, {
      ...options,
      headers,
    });
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  return handleResponse<T>(res);
}

// --- Auth API helpers (backend accepts idToken or email+password) ---

/** Login with Firebase idToken (browser signs in; works even if backend API key is restricted). */
export async function loginWithIdToken(idToken: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

/** Login with Google via Firebase popup, then exchange the idToken for the backend session cookie. */
export async function loginWithGoogle(): Promise<AuthResponse> {
  const { isFirebaseConfigured, signInWithGoogleAndGetIdToken } = await import('@/lib/firebase');
  if (!isFirebaseConfigured()) {
    throw new Error('Google sign-in is not configured. Add Firebase web config to the frontend environment.');
  }

  const idToken = await signInWithGoogleAndGetIdToken();
  const response = await loginWithIdToken(idToken);
  if (response.success) {
    setStoredUser(response.user ?? null);
  }
  return response;
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
  return authFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(params: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const data = await authFetch<AuthResponse>('/api/auth/register', {
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
  return authFetch<AuthResponse>('/api/auth/register-admin', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message?: string; resetUrl?: string }> {
  return authFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
  return authFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

/** Verify email with token from confirmation link. Returns user and token for auto-login. */
export async function verifyEmail(token: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

/** Resend verification email to the given email address. */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message?: string }> {
  return authFetch<{ success: boolean; message?: string }>('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

/** Logout: clear cookie on backend and clear local user data */
export async function logout(): Promise<void> {
  try {
    await apiFetch<{ success: boolean; message?: string }>('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
  try {
    const { signOutFirebaseAuth } = await import('@/lib/firebase');
    await signOutFirebaseAuth();
  } catch {
    // ignore
  }
  removeToken();
}

/** Get current user from backend (uses cookie). Use to restore session when only cookie is present. */
export async function getMe(): Promise<{ success: boolean; user?: User }> {
  const res = await authFetch<{ success: boolean; user?: User }>('/api/auth/me');
  if (res.success && res.user) setStoredUser(res.user);
  return res;
}

export async function registerPublishedSiteUser(params: {
  name: string;
  email: string;
  password: string;
  siteIdentifier?: string | null;
}): Promise<AuthResponse> {
  const identifier = String(params.siteIdentifier || getPublishedSiteIdentifier() || '').trim().toLowerCase();
  const response = await publishedAuthFetch<AuthResponse>(
    '/api/published-auth/register',
    {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        email: params.email,
        password: params.password,
      }),
    },
    identifier
  );
  if (response.success) {
    setStoredPublishedSiteUser(identifier, response.user ?? null);
  }
  return response;
}

export async function loginPublishedSiteUser(params: {
  email: string;
  password: string;
  siteIdentifier?: string | null;
}): Promise<AuthResponse> {
  const identifier = String(params.siteIdentifier || getPublishedSiteIdentifier() || '').trim().toLowerCase();
  const response = await publishedAuthFetch<AuthResponse>(
    '/api/published-auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        email: params.email,
        password: params.password,
      }),
    },
    identifier
  );
  if (response.success) {
    setStoredPublishedSiteUser(identifier, response.user ?? null);
  }
  return response;
}

export async function getPublishedSiteMe(
  siteIdentifier?: string | null
): Promise<{ success: boolean; user?: User }> {
  return publishedAuthFetch<{ success: boolean; user?: User }>('/api/published-auth/me', {}, siteIdentifier);
}

export async function logoutPublishedSiteUser(siteIdentifier?: string | null): Promise<void> {
  const identifier = String(siteIdentifier || getPublishedSiteIdentifier() || '').trim().toLowerCase();
  try {
    await publishedAuthFetch('/api/published-auth/logout', { method: 'POST' }, identifier);
  } catch {
    // ignore
  }
  if (identifier) {
    setStoredPublishedSiteUser(identifier, null);
  }
}

/** Update user profile (Full Name, Avatar, Username, Website, Bio) */
export async function updateProfile(data: {
  name?: string;
  avatar?: string;
  username?: string;
  website?: string;
  bio?: string;
  phone?: string;
  paymentMethods?: any[];
  paymentMethod?: any;
  notificationPreferences?: {
    securityAlerts: boolean;
    sessionNotifications: boolean;
    accountUpdates: boolean;
  };
}): Promise<{ success: boolean; message?: string; user?: User }> {
  const res = await authFetch<{ success: boolean; message?: string; user?: User }>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (res.success && res.user) setStoredUser(res.user);
  return res;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; token?: string }> {
  return authFetch<{ success: boolean; message?: string; token?: string }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function createStripeSetupIntent(): Promise<{ success: boolean; clientSecret: string }> {
  return authFetch<{ success: boolean; clientSecret: string }>('/api/auth/billing/setup-intent', {
    method: 'POST',
  });
}

export async function getUnionBankLink(): Promise<{ success: boolean; url: string }> {
  return apiFetch<{ success: boolean; url: string }>('/api/payments/unionbank/link');
}

export async function getPayPalLink(): Promise<{ success: boolean; url: string }> {
  return apiFetch<{ success: boolean; url: string }>('/api/payments/paypal/link');
}

/** Upload avatar via backend: file is saved in Storage only at Clients/profile_picture/{username}/profile-{uid}. */
export async function uploadAvatarApi(
  file: File
): Promise<{ success: boolean; message?: string; url?: string; user?: User }> {
  const formData = new FormData();
  formData.append('avatar', file);
  const url = typeof window === 'undefined' ? `${getApiUrl()}/api/auth/avatar` : '/api/auth/avatar';
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
  industry?: string | null;
  templateId?: string | null;
  subdomain?: string | null;
  thumbnail?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  daysLeft?: number;
  isShared?: boolean;
  ownerName?: string;
  ownerId?: string;
  collaboratorPermission?: "editor" | "viewer";
};

export async function listProjects(): Promise<{ success: boolean; projects: Project[] }> {
  const t0 = Date.now();
  console.log('[READ] listProjects fetch start');
  const res = await apiFetch<{ success: boolean; projects: Project[] }>('/api/projects');
  console.log('[READ] listProjects fetch done', { projects: res?.projects?.length, ms: Date.now() - t0 });
  return res;
}

export async function createProject(params: {
  title?: string;
  industry?: string | null;
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
  params: { title?: string; status?: string; industry?: string | null; subdomain?: string | null; thumbnail?: string | null }
): Promise<{ success: boolean; project: Project; message?: string }> {
  return apiFetch<{ success: boolean; project: Project; message?: string }>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
}

/** Move project to trash instead of deleting permanently. */
export async function deleteProject(id: string): Promise<{ success: boolean; message?: string; daysLeft?: number; retentionDays?: number }> {
  return apiFetch<{ success: boolean; message?: string; daysLeft?: number; retentionDays?: number }>(`/api/projects/${id}`, { method: 'DELETE' });
}

/** List all projects currently in the trash for the user. */
export async function listTrashedProjects(): Promise<{ success: boolean; projects: Project[]; retentionDays?: number }> {
  return apiFetch<{ success: boolean; projects: Project[]; retentionDays?: number }>('/api/projects/trash');
}

/** Restore a project from the trash back to the active list. */
export async function restoreProject(id: string): Promise<{ success: boolean; project: Project; message?: string }> {
  return apiFetch<{ success: boolean; project: Project; message?: string }>(`/api/projects/${id}/restore`, {
    method: 'POST',
  });
}

/** Get project storage usage (bytes and human readable). */
export async function getProjectStorage(id: string): Promise<{ success: boolean; storageBytes: number; storageReadable: string }> {
  return apiFetch<{ success: boolean; storageBytes: number; storageReadable: string }>(`/api/projects/${id}/storage`);
}

/** Permanently purge a project from the database. This action cannot be undone. */
export async function permanentDeleteProject(id: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/projects/${id}/permanent`, {
    method: 'DELETE',
  });
}

/** Upload media file for web builder. Returns the public URL. */
export async function uploadMediaApi(
  projectId: string,
  file: File,
  options?: { onProgress?: (percent: number) => void; folder?: 'images' | 'videos' | 'files' }
): Promise<{ url: string }> {
  const url =
    typeof window !== 'undefined'
      ? `/api/projects/${projectId}/media`
      : `${getApiUrl().replace(/\/$/, '')}/api/projects/${projectId}/media`;

  if (options?.onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('media', file);
      if (options.folder) formData.append('folder', options.folder);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && options.onProgress) {
          options.onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        let data: { success?: boolean; url?: string; message?: string } = {};
        const responseText = typeof xhr.responseText === 'string' ? xhr.responseText.trim() : '';
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = {};
          }
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          if (data.success && data.url) resolve({ url: data.url });
          else reject(new Error(data.message || 'Upload failed'));
        } else {
          reject(new Error(data.message || 'Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.open('POST', url);
      xhr.withCredentials = true;
      if (activeProjectId) xhr.setRequestHeader('x-project-id', activeProjectId);
      xhr.send(formData);
    });
  }

  const formData = new FormData();
  formData.append('media', file);
  if (options?.folder) formData.append('folder', options.folder);

  const headers: Record<string, string> = {};
  if (activeProjectId) headers['x-project-id'] = activeProjectId;

  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });

  const data = await handleResponse<{ success: boolean; url?: string; message?: string }>(res);
  if (!data.url) throw new Error(data.message || 'Upload failed');
  return { url: data.url };
}


/** Delete media files by their public URLs. */
export async function deleteMediaApi(
  projectId: string,
  urls: string[]
): Promise<{ success: boolean; message?: string; summary?: { deleted: number; skipped: number } }> {
  return apiFetch<{ success: boolean; message?: string; summary?: { deleted: number; skipped: number } }>(
    `/api/projects/${projectId}/media`,
    {
      method: 'DELETE',
      body: JSON.stringify({ urls }),
    }
  );
}


/** Update subdomain for an existing published project. */
export async function updateDomainSubdomain(
  projectId: string,
  subdomain: string
): Promise<{ success: boolean; message?: string; data?: { subdomain?: string } }> {
  return apiFetch<{ success: boolean; message?: string; data?: { subdomain?: string } }>('/api/domains/update-subdomain', {
    method: 'POST',
    body: JSON.stringify({ projectId, subdomain }),
  });
}

/** Unpublish (take down) a published project. Site will no longer be accessible until published again. */
export async function unpublishProject(projectId: string): Promise<{ success: boolean; message?: string; data?: { subdomain?: string } }> {
  return apiFetch<{ success: boolean; message?: string; data?: { subdomain?: string } }>('/api/domains/unpublish', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
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

// --- Custom Domains ---

export type CustomDomainEntry = {
  id: string;
  domain: string;
  subdomain?: string;
  projectId?: string;
  projectTitle?: string;
  status?: string;
  domainStatus: 'pending' | 'verified' | 'error';
  verifiedAt?: string | null;
};

export type DnsInstructions = {
  message: string;
  optionA: { type: string; host: string; value: string; description: string };
  optionB: { type: string; host: string; value: string; description: string };
};

/** List all custom domains for the current user. */
export async function listCustomDomains(): Promise<{ success: boolean; data: CustomDomainEntry[] }> {
  return apiFetch<{ success: boolean; data: CustomDomainEntry[] }>('/api/domains/custom');
}

/** Connect a custom domain to a published project. */
export async function addCustomDomain(
  projectId: string,
  domain: string
): Promise<{ success: boolean; message?: string; data?: { domain: string; status: string }; dnsInstructions?: DnsInstructions }> {
  return apiFetch('/api/domains/custom', {
    method: 'POST',
    body: JSON.stringify({ projectId, domain }),
  });
}

/** Verify DNS records for a custom domain. */
export async function verifyCustomDomain(
  projectId: string
): Promise<{ success: boolean; message?: string; data?: { domain: string; status: string; details: string } }> {
  return apiFetch('/api/domains/custom/verify', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  });
}

/** Remove a custom domain from a project. */
export async function removeCustomDomain(
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  return apiFetch('/api/domains/custom', {
    method: 'DELETE',
    body: JSON.stringify({ projectId }),
  });
}

// --- Products (stored per published_subdomains/{subdomain}/products) ---

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
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}

export async function adminWebsiteAction(params: {
  userId: string;
  domainId: string;
  action: 'take_down' | 'delete';
  reason?: string;
}): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>('/api/domains/admin/website-action', {
    method: 'POST',
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
  if (params?.subdomain) query.set('subdomain', params.subdomain);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.includeAllUsers) query.set('scope', 'all');
  const qs = query.toString();
  const path = qs ? `/api/products?${qs}` : '/api/products';
  const headers = params?.ignoreActiveProjectScope
    ? { 'x-skip-active-project-scope': '1' }
    : undefined;
  return apiFetch<{ success: boolean; items: ApiProduct[]; total: number; page: number; totalPages: number }>(path, {
    headers,
  });
}

// For uploading prodcut images to Firebase Storage 
export async function uploadProductImageApi(
  file: File,
  subdomain?: string
): Promise<{ success: boolean; message?: string; url?: string }> {
  if (typeof window !== 'undefined') {
    const formData = new FormData();
    formData.append('image', file);
    if (subdomain) formData.append('subdomain', subdomain);

    const res = await fetch(`/api/products/upload-image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return handleResponse<{ success: boolean; message?: string; url?: string }>(res);
  }

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
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/products/${id}`, {
    method: 'DELETE',
  });
}

// --- Inventory ---

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
  type: 'IN' | 'OUT' | 'ADJUST' | 'RESERVE' | 'RELEASE' | string;
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
  if (params?.subdomain) query.set('subdomain', params.subdomain);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<{ success: boolean; items: ApiProduct[]; total: number; page: number; totalPages: number }>(
    qs ? `/api/inventory?${qs}` : '/api/inventory'
  );
}

export async function getInventorySummary(params?: {
  subdomain?: string;
  status?: string;
  search?: string;
}): Promise<{ success: boolean; data: InventorySummary }> {
  const query = new URLSearchParams();
  if (params?.subdomain) query.set('subdomain', params.subdomain);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return apiFetch<{ success: boolean; data: InventorySummary }>(
    qs ? `/api/inventory/summary?${qs}` : '/api/inventory/summary'
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
  if (params?.productId) query.set('productId', params.productId);
  if (params?.type) query.set('type', params.type);
  if (params?.subdomain) query.set('subdomain', params.subdomain);
  if (params?.projectId) query.set('projectId', params.projectId);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<{ success: boolean; items: InventoryMovement[] }>(
    qs ? `/api/inventory/movements?${qs}` : '/api/inventory/movements'
  );
}

export async function deleteInventoryMovement(
  movementId: string,
  params?: { subdomain?: string; projectId?: string }
): Promise<{ success: boolean; message?: string; data?: InventoryMovement }> {
  const normalizedId = String(movementId || '').trim();
  if (!normalizedId) {
    throw new Error('movementId is required');
  }

  const query = new URLSearchParams();
  if (params?.subdomain) query.set('subdomain', params.subdomain);
  if (params?.projectId) query.set('projectId', params.projectId);
  const qs = query.toString();
  const encodedId = encodeURIComponent(normalizedId);

  return apiFetch<{ success: boolean; message?: string; data?: InventoryMovement }>(
    qs ? `/api/inventory/movements/${encodedId}?${qs}` : `/api/inventory/movements/${encodedId}`,
    {
      method: 'DELETE',
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
    throw new Error('Provide ids array or set deleteAll=true to delete movements.');
  }

  const query = new URLSearchParams();
  if (params.subdomain) query.set('subdomain', params.subdomain);
  if (params.projectId) query.set('projectId', params.projectId);
  const qs = query.toString();

  return apiFetch<{ success: boolean; message?: string; data?: { deleted?: number; missing?: string[] } }>(
    qs ? `/api/inventory/movements/bulk-delete?${qs}` : '/api/inventory/movements/bulk-delete',
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

export async function adjustInventoryStock(params: {
  productId: string;
  quantity?: number;
  movementType?: 'IN' | 'OUT' | 'ADJUST';
  notes?: string;
  referenceType?: string;
  referenceId?: string;
  setOnHandStock?: number;
  setReservedStock?: number;
  variantKey?: string;
  setVariantStock?: number;
}): Promise<{ success: boolean; message?: string; data?: ApiProduct }> {
  return apiFetch<{ success: boolean; message?: string; data?: ApiProduct }>('/api/inventory/adjust', {
    method: 'POST',
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
  if (params.subdomain) query.set('subdomain', params.subdomain);
  const qs = query.toString();
  return apiFetch<ImportInventoryResult>(qs ? `/api/inventory/import?${qs}` : '/api/inventory/import', {
    method: 'POST',
    body: JSON.stringify({ rows: params.rows }),
  });
}

// --- Orders ---

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
  status: 'Pending' | 'Processing' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | string;
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
  return apiFetch<{ success: boolean; message?: string; data?: ApiOrder }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function listMyOrders(params?: {
  page?: number;
  limit?: number;
  projectId?: string;
}): Promise<{ success: boolean; items: ApiOrder[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.projectId) query.set('projectId', params.projectId);
  const qs = query.toString();
  return apiFetch<{ success: boolean; items: ApiOrder[]; total: number; page: number; totalPages: number }>(
    qs ? `/api/orders/my?${qs}` : '/api/orders/my'
  );
}

export async function listAllOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
}): Promise<{ success: boolean; items: ApiOrder[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.status) query.set('status', params.status);
  if (params?.userId) query.set('userId', params.userId);
  const qs = query.toString();
  return apiFetch<{ success: boolean; items: ApiOrder[]; total: number; page: number; totalPages: number }>(
    qs ? `/api/orders?${qs}` : '/api/orders'
  );
}

export async function updateOrderStatus(
  id: string,
  status: 'Pending' | 'Processing' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned'
): Promise<{ success: boolean; message?: string; data?: ApiOrder }> {
  return apiFetch<{ success: boolean; message?: string; data?: ApiOrder }>(`/api/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}


export type ApiPublishedOrder = {
  id: string;
  subdomain: string;
  ownerUserId: string;
  projectId?: string | null;
  domainId?: string | null;
  items: ApiOrderItem[];
  total: number;
  status: 'Pending' | 'Processing' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | string;
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
  const normalizedSubdomain = params.subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  return apiFetch<{ success: boolean; message?: string; data?: ApiPublishedOrder }>(
    `/api/orders/published/${encodeURIComponent(normalizedSubdomain)}`,
    {
      method: 'POST',
      body: JSON.stringify({
        items: params.items,
        total: params.total,
        shippingAddress: params.shippingAddress ?? null,
        currency: params.currency ?? 'PHP',
      }),
    }
  );
}

/** Create payment (PayPal) for a published order. Returns redirectUrl to PayPal. */
export async function createPaymentIntent(
  subdomain: string,
  orderId: string,
  _paymentMethod?: 'paypal' | 'gcash' | 'maya' | 'card'
): Promise<{
  success: boolean;
  message?: string;
  redirectUrl?: string;
  clientKey?: string;
  publicKey?: string;
}> {
  const normalizedSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  return apiFetch<{
    success: boolean;
    message?: string;
    redirectUrl?: string;
    clientKey?: string;
    publicKey?: string;
  }>(
    `/api/orders/published/${encodeURIComponent(normalizedSubdomain)}/${encodeURIComponent(orderId)}/create-payment-intent`,
    {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: _paymentMethod ?? 'paypal' }),
    }
  );
}

/** Capture PayPal payment after user returns from PayPal (call when result page has token). */
export async function capturePayPal(
  subdomain: string,
  orderId: string,
  token: string
): Promise<{ success: boolean; message?: string }> {
  const normalizedSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
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
  if (params?.subdomain) query.set('subdomain', params.subdomain);
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<{ success: boolean; items: ApiPublishedOrder[]; total: number; page: number; totalPages: number }>(
    qs ? `/api/orders/published/my?${qs}` : '/api/orders/published/my'
  );
}

export async function updatePublishedOrderStatus(
  subdomain: string,
  id: string,
  status: 'Pending' | 'Processing' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned'
): Promise<{ success: boolean; message?: string; data?: ApiPublishedOrder }> {
  const normalizedSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  return apiFetch<{ success: boolean; message?: string; data?: ApiPublishedOrder }>(
    `/api/orders/published/${encodeURIComponent(normalizedSubdomain)}/${encodeURIComponent(id)}/status`,
    {
      method: 'PUT',
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
  const sub = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  return apiFetch<{ 
    success: boolean; 
    message?: string; 
    clientSecret?: string; 
    publicKey?: string; 
  }>(`/api/orders/published/${encodeURIComponent(sub)}/${encodeURIComponent(orderId)}/create-stripe-payment-intent`, {
    method: 'POST',
  });
}

export async function getStripePublicKey(): Promise<{ success: boolean; publicKey?: string }> {
  return apiFetch<{ success: boolean; publicKey?: string }>('/api/orders/stripe-public-key');
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
  }>('/api/domains/admin/management');
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

  const queryString = domainIds.map(id => `domainIds=${encodeURIComponent(id)}`).join('&');
  return apiFetch<{ success: boolean; analytics?: Record<string, WebsiteAnalyticsData> }>(
    `/api/dashboard/website-analytics?${queryString}`
  );
}

export async function trackWebsiteView(subdomain: string): Promise<{ success: boolean }> {
  try {
    // The backend will detect the subdomain from the Host header via middleware,
    // but we send it in the body as backup
    return await apiFetch<{ success: boolean }>(
      '/api/analytics/track-view',
      {
        method: 'POST',
        body: JSON.stringify({ subdomain }),
        headers: { 'x-skip-active-project-scope': '1' } // Don't add project ID header for public tracking
      }
    );
  } catch (error) {
    // Silently fail - don't block the site
    console.error('Failed to track view:', error);
    return { success: false };
  }
}

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
  status: 'Published' | 'Suspended' | 'Restricted',
  suspensionReason?: string
): Promise<{ success: boolean; message?: string; user?: ClientRow }> {
  return apiFetch<{ success: boolean; message?: string; user?: ClientRow }>(
    `/api/users/${userId}/status`,
    { method: 'PUT', body: JSON.stringify({ status, suspensionReason }) }
  );
}

/** Admin: delete a client (cannot delete self). */
export async function deleteClient(userId: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/users/${userId}`, {
    method: 'DELETE',
  });
}

/** Admin: update a client's profile details (name, email, password, etc.). */
export async function updateClientDetails(
  userId: string,
  data: { name?: string; email?: string; phone?: string; bio?: string; password?: string }
): Promise<{ success: boolean; message?: string; user?: ClientRow }> {
  return apiFetch<{ success: boolean; message?: string; user?: ClientRow }>(
    `/api/users/${userId}`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
}

/** Admin: set client domain status (published | suspended | flagged | draft). Uses same-origin proxy so cookies are sent. */
export async function setClientDomainStatus(
  userId: string,
  domainId: string,
  status: string
): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(
    '/api/domains/admin/set-client-status',
    {
      method: 'POST',
      body: JSON.stringify({ userId, domainId, status })
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
    '/api/domains/admin/update-subdomain',
    {
      method: 'POST',
      body: JSON.stringify({
        userId,
        subdomain,
        projectId: options?.projectId,
        domainId: options?.domainId,
      }),
    }
  );
}

/** Admin: analytics for Monitoring & Analytics (real data). */
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

/** Admin: Shared notifications (Audit trail for ALL admins). */
export async function getSharedNotifications(): Promise<{ success: boolean; notifications: any[] }> {
  return apiFetch<{ success: boolean; notifications: any[] }>('/api/notifications');
}

export async function addSharedNotification(data: { title: string; message: string; type?: string; [key: string]: any }): Promise<{ success: boolean; notification: any }> {
  return apiFetch<{ success: boolean; notification: any }>('/api/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function markSharedNotificationRead(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PUT' });
}

export async function markAllSharedNotificationsRead(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/api/notifications/mark-all-read', { method: 'PUT' });
}

export async function deleteSharedNotification(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/notifications/${id}`, { method: 'DELETE' });
}

/**
 * MESSAGING API
 */

export async function getMessages(filters: { type?: string; status?: string; limit?: number } = {}): Promise<{ success: boolean; data: ApiMessage[] }> {
  try {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    return await authFetch(`/api/messages?${params.toString()}`);
  } catch {
    return { success: false, data: [] };
  }
}

export async function sendMessage(data: { message: string; type: 'support' | 'internal' | 'request'; senderName?: string; senderAvatar?: string; websiteId?: string }): Promise<{ success: boolean; data?: ApiMessage }> {
  try {
    return await authFetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch {
    return { success: false };
  }
}

export async function markMessageRead(id: string): Promise<{ success: boolean }> {
  try {
    return await authFetch(`/api/messages/${id}/read`, { method: 'PATCH' });
  } catch {
    return { success: false };
  }
}

/* ── Chat/Conversation API ────────────────────────────────────── */

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
    if (search) params.append('search', search);
    const qs = params.toString();
    return await authFetch(`/api/users/admins/list${qs ? '?' + qs : ''}`);
  } catch {
    return { success: false, data: [] };
  }
}


const api = { getMe, updateProfile }; export default api;
