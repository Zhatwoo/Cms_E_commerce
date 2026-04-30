/**
 * Auth + profile API: login/register/verify, getMe, profile updates,
 * password change, billing setup links, avatar upload, and admin user
 * creation. Also includes the published-site (storefront) auth flows.
 */

import {
  apiFetch,
  authFetch,
  publishedAuthFetch,
  handleResponse,
  getApiUrl,
  getPublishedSiteIdentifier,
  setStoredUser,
  setStoredPublishedSiteUser,
  removeToken,
  type AuthResponse,
  type User,
} from "./_core";

/** Login with Firebase idToken (browser signs in; works even if backend API key is restricted). */
export async function loginWithIdToken(idToken: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

/** Login with Google via Firebase popup, then exchange the idToken for the backend session cookie. */
export async function loginWithGoogle(): Promise<AuthResponse> {
  const { isFirebaseConfigured, signInWithGoogleAndGetIdToken } = await import("@/lib/firebase");
  if (!isFirebaseConfigured()) {
    throw new Error("Google sign-in is not configured. Add Firebase web config to the frontend environment.");
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
  const { signInAndGetIdToken, isFirebaseConfigured } = await import("@/lib/firebase");
  if (isFirebaseConfigured()) {
    try {
      const idToken = await signInAndGetIdToken(email, password);
      return loginWithIdToken(idToken);
    } catch {
      // Fallback: backend email/password (e.g. REST API)
    }
  }
  return authFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(params: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** Register Super Admin from /admindashboard/register (no auth required). Saves to Firestore user/roles/super_admin. Returns session cookie. */
export async function registerAdmin(params: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/register-admin", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message?: string; resetUrl?: string }> {
  return authFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
  return authFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

/** Verify email with token from confirmation link. Returns user and token for auto-login. */
export async function verifyEmail(token: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

/** Resend verification email to the given email address. */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message?: string }> {
  return authFetch<{ success: boolean; message?: string }>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

/** Logout: clear cookie on backend and clear local user data */
export async function logout(): Promise<void> {
  try {
    await apiFetch<{ success: boolean; message?: string }>("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  try {
    const { signOutFirebaseAuth } = await import("@/lib/firebase");
    await signOutFirebaseAuth();
  } catch {
    // ignore
  }
  removeToken();
}

/** Get current user from backend (uses cookie). Use to restore session when only cookie is present. */
export async function getMe(): Promise<{ success: boolean; user?: User }> {
  const res = await authFetch<{ success: boolean; user?: User }>("/api/auth/me");
  if (res.success && res.user) setStoredUser(res.user);
  return res;
}

/* ── Published site (storefront) auth ──────────────────────────── */

export async function registerPublishedSiteUser(params: {
  name: string;
  email: string;
  password: string;
  siteIdentifier?: string | null;
}): Promise<AuthResponse> {
  const identifier = String(params.siteIdentifier || getPublishedSiteIdentifier() || "").trim().toLowerCase();
  const response = await publishedAuthFetch<AuthResponse>(
    "/api/published-auth/register",
    {
      method: "POST",
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
  const identifier = String(params.siteIdentifier || getPublishedSiteIdentifier() || "").trim().toLowerCase();
  const response = await publishedAuthFetch<AuthResponse>(
    "/api/published-auth/login",
    {
      method: "POST",
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
  return publishedAuthFetch<{ success: boolean; user?: User }>("/api/published-auth/me", {}, siteIdentifier);
}

export async function logoutPublishedSiteUser(siteIdentifier?: string | null): Promise<void> {
  const identifier = String(siteIdentifier || getPublishedSiteIdentifier() || "").trim().toLowerCase();
  try {
    await publishedAuthFetch("/api/published-auth/logout", { method: "POST" }, identifier);
  } catch {
    // ignore
  }
  if (identifier) {
    setStoredPublishedSiteUser(identifier, null);
  }
}

/* ── Profile ────────────────────────────────────────────────────── */

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
  const res = await authFetch<{ success: boolean; message?: string; user?: User }>("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (res.success && res.user) setStoredUser(res.user);
  return res;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; token?: string }> {
  return authFetch<{ success: boolean; message?: string; token?: string }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function createStripeSetupIntent(): Promise<{ success: boolean; clientSecret: string }> {
  return authFetch<{ success: boolean; clientSecret: string }>("/api/auth/billing/setup-intent", {
    method: "POST",
  });
}

export async function getUnionBankLink(): Promise<{ success: boolean; url: string }> {
  return apiFetch<{ success: boolean; url: string }>("/api/payments/unionbank/link");
}

export async function getPayPalLink(): Promise<{ success: boolean; url: string }> {
  return apiFetch<{ success: boolean; url: string }>("/api/payments/paypal/link");
}

/** Upload avatar via backend: file is saved in Storage only at Clients/profile_picture/{username}/profile-{uid}. */
export async function uploadAvatarApi(
  file: File
): Promise<{ success: boolean; message?: string; url?: string; user?: User }> {
  const formData = new FormData();
  formData.append("avatar", file);
  const url = typeof window === "undefined" ? `${getApiUrl()}/api/auth/avatar` : "/api/auth/avatar";
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse<{ success: boolean; message?: string; url?: string; user?: User }>(res);
}

/** Create user (admin only). Role: 'admin' | 'client' | 'super_admin'. */
export async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "client" | "super_admin";
}): Promise<{ success: boolean; message?: string; user?: User }> {
  return apiFetch<{ success: boolean; message?: string; user?: User }>("/api/users", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
