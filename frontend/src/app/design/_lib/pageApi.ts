/**
 * API service for page auto-save operations
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${BASE.replace(/\/$/, '')}/api`;

/**
 * Get authentication token from localStorage
 * Checks 'mercato_token' first, then falls back to 'token'
 */
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('mercato_token') || localStorage.getItem('token');

    if (token) {
        try {
            // Simple decode of JWT payload to see the UID for debugging
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log(`🔑 getAuthToken: UID from token is [${payload.id}]`);
        } catch (e) {
            console.log('🔑 getAuthToken: Could not decode token payload');
        }
    } else {
        console.log('🔑 getAuthToken: No token found in localStorage');
    }

    return token;
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

        const response = await fetch(url, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ content, projectId }) // Passing projectId
        });

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

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

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
        const response = await fetch(`${API_BASE_URL}/pages/draft?projectId=${projectId}&t=${Date.now()}`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

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

        const response = await fetch(`${API_BASE_URL}/pages/draft?projectId=${projectId}`, {
            method: 'DELETE',
            headers,
            credentials: 'include'
        });

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
