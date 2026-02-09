/**
 * API client for backend. Auth token is in HttpOnly cookie (mercato_token); user info in localStorage (mercato_user).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'mercato_token';
const USER_KEY = 'mercato_user';

export type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
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
};

export type ApiError = { success: false; message: string; error?: string };

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function getApiUrl(): string {
  return API_URL.replace(/\/$/, '');
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
  const url = `${getApiUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // ✅ cookie only
  });

  return handleResponse<T>(res);
}

// --- Auth API helpers (backend uses Firebase Authentication; login sends idToken) ---

/** Login: config from backend → Firebase sign-in → idToken → backend JWT */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const { getAuthAsync } = await import('@/lib/firebase');
  const auth = await getAuthAsync();
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await userCred.user.getIdToken();
  const data = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  return data;
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
