/**
 * API service for page auto-save operations
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${BASE.replace(/\/$/, '')}/api`;
const REQUEST_TIMEOUT_MS = 10000;

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
        await getMyId(); // Log UID for diagnostics

        // console.log('🔍 Auto-save starting...');

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

        console.log('✅ Saved to Firebase database');
        return { success: true, data: data.data };
    } catch (error) {
        console.error('❌ Auto-save error:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Diagnostic: Get current user ID from server
 */
export async function getMyId(): Promise<void> {
    try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await safeFetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        if (!response) {
            console.warn('👤 Current User: NOT LOGGED IN (network unavailable)');
            return;
        }

        if (response.ok) {
            const data = await response.json();
            console.log(`👤 Current User (via Cookie/Auth): ${data.user.id} (${data.user.email})`);
        } else {
            console.warn('👤 Current User: NOT LOGGED IN (or cookie missing)');
        }
    } catch (e) {
        console.error('👤 Current User: Error checking auth', e);
    }
}

/**
 * Get the user's draft page
 * Returns null if not authenticated - will fall back to localStorage
 */
export async function getDraft(projectId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    await getMyId(); // Log UID for diagnostics
    try {
        const token = getAuthToken();

        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Pass projectId in query with timestamp to avoid caching
        const response = await safeFetch(`${API_BASE_URL}/pages/draft?projectId=${projectId}&t=${Date.now()}`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        if (!response) {
            return { success: true, data: null };
        }

        const data = await response.json();

        if (!response.ok) {
            console.warn('⚠️ Database load failed:', data.message);
            return { success: true, data: null };
        }

        if (data.data) {
            console.log('✅ Loaded draft from Firebase database');
        }
        return { success: true, data: data.data };
    } catch (error) {
        console.error('Get draft error:', error);
        return { success: true, data: null };
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

        console.log('✅ Deleted draft from Firebase database');
        return { success: true };
    } catch (error) {
        console.error('Delete draft error:', error);
        return { success: false, error: 'Network error' };
    }
}
