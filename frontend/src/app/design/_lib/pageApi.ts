/**
 * API service for page auto-save operations
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${BASE.replace(/\/$/, '')}/api`;
const REQUEST_TIMEOUT_MS = 10000;
const DRAFT_CACHE_TTL_MS = 15000;

type DraftResponse = { success: boolean; data?: any; error?: string };
const draftCache = new Map<string, { expiresAt: number; value: DraftResponse }>();
const draftInFlight = new Map<string, Promise<DraftResponse>>();

/** Wraps fetch; returns null on network/parse errors so callers can handle gracefully. */
async function safeFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response | null> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    try {
        const finalInit: RequestInit = { ...(init ?? {}) };

        if (!finalInit.signal) {
            controller = new AbortController();
            finalInit.signal = controller.signal;
            timeoutId = setTimeout(() => {
                try {
                    controller?.abort();
                } catch {
                    // ignore abort errors
                }
            }, REQUEST_TIMEOUT_MS);
        }

        return await fetch(input, finalInit);
    } catch {
        return null;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

/** Auth uses HttpOnly cookie (mercato_token); no token in localStorage. Use credentials: 'include' for API calls. */
function getAuthToken(): string | null {
    return null;
}

/**
 * Auto-save the current page content
 * Works with or without authentication - database save is optional
 */
export async function autoSavePage(content: string, projectId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const token = getAuthToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const url = `${API_BASE_URL}/pages/autosave`;

        const response = await safeFetch(url, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ content, projectId }) // Passing projectId
        });

        if (!response) {
            return { success: false, error: 'Network error' };
        }

        const data = await response.json();

        if (!response.ok) {
            console.warn('❌ Database save failed:', data.message);
            return { success: false, error: data.message || 'Database save failed' };
        }

        draftCache.set(projectId, {
            expiresAt: Date.now() + DRAFT_CACHE_TTL_MS,
            value: { success: true, data: { ...data.data, content } }
        });
        return { success: true, data: data.data };
    } catch (error) {
        console.error('❌ Auto-save error:', error);
        return { success: false, error: 'Network error' };
    }
}

/** Check auth status (no console logging of user data). */
export async function getMyId(): Promise<void> {
    try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await safeFetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });
    } catch {
        // Silent - no logging of auth state or user data
    }
}

/**
 * Get the user's draft page
 * Returns null if not authenticated - will fall back to localStorage
 */
export async function getDraft(projectId: string): Promise<DraftResponse> {
    const cached = draftCache.get(projectId);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
        return cached.value;
    }

    const existing = draftInFlight.get(projectId);
    if (existing) {
        return existing;
    }

    const request = (async (): Promise<DraftResponse> => {
    try {
        const token = getAuthToken();

        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await safeFetch(`${API_BASE_URL}/pages/draft?projectId=${projectId}`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        if (!response) {
            const fallback = { success: true, data: null };
            draftCache.set(projectId, { expiresAt: now + 4000, value: fallback });
            return fallback;
        }

        const data = await response.json();

        if (!response.ok) {
            const msg = data?.message || '';
            if (response.status === 401) {
                return { success: false, data: null, error: 'auth' };
            }
            if (response.status === 403) {
                const forbidden = { success: false, data: null, error: 'forbidden' };
                draftCache.set(projectId, { expiresAt: now + DRAFT_CACHE_TTL_MS, value: forbidden });
                return forbidden;
            }
            console.warn('⚠️ Database load failed:', msg);
            const fallback = { success: true, data: null };
            draftCache.set(projectId, { expiresAt: now + 4000, value: fallback });
            return fallback;
        }

        const result = { success: true, data: data.data };
        draftCache.set(projectId, { expiresAt: now + DRAFT_CACHE_TTL_MS, value: result });
        return result;
    } catch (error) {
        console.error('Get draft error:', error);
        const fallback = { success: true, data: null };
        draftCache.set(projectId, { expiresAt: now + 4000, value: fallback });
        return fallback;
    }
    })();

    draftInFlight.set(projectId, request);
    try {
        return await request;
    } finally {
        draftInFlight.delete(projectId);
    }
}

/**
 * Delete the user's draft page
 */
export async function deleteDraft(projectId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await safeFetch(`${API_BASE_URL}/pages/draft?projectId=${projectId}`, {
            method: 'DELETE',
            headers,
            credentials: 'include'
        });

        if (!response) {
            return { success: false, error: 'Network error' };
        }

        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.message };
        }

        draftCache.delete(projectId);
        draftInFlight.delete(projectId);
        return { success: true };
    } catch (error) {
        console.error('Delete draft error:', error);
        return { success: false, error: 'Network error' };
    }
}
