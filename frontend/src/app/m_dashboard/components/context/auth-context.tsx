'use client';

/**
 * ============================================================================
 * Auth Context
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file provides a global authentication context for the application,
 * enabling centralized user state management and authentication operations.
 *
 * The context provides:
 * - Global user state management
 * - Single API call for user authentication
 * - User refresh/refetch functionality
 * - User state setter for updates
 * - Loading state tracking
 *
 * ----------------------------------------------------------------------------
 * What this Context Does:
 * ----------------------------------------------------------------------------
 * - Wraps the application with user authentication state
 * - Fetches current user data on mount using getMe() API
 * - Stores user data in global context for easy access
 * - Provides loading state for authentication checks
 * - Allows manual user refresh via refreshUser()
 * - Provides setUser() for updating user state
 * - Prevents excessive API calls by centralizing user fetch
 *
 * ----------------------------------------------------------------------------
 * Props / Parameters (AuthProvider):
 * ----------------------------------------------------------------------------
 *
 * children: React.ReactNode
 * - React components to be wrapped by the auth provider.
 * - REQUIRED
 *
 * Context Values:
 *
 * user: User | null
 * - Currently authenticated user object.
 * - null if user is not authenticated.
 *
 * loading: boolean
 * - Whether authentication is being checked.
 * - true during initial fetch.
 *
 * refreshUser: () => Promise<void>
 * - Manually refresh/refetch user data from API.
 * - Useful for updating after user changes.
 *
 * setUser: (user: User | null) => void
 * - Update user state manually.
 * - Allows forcing a specific user state.
 *
 * ----------------------------------------------------------------------------
 * Type Definitions:
 * ----------------------------------------------------------------------------
 *
 * User
 * - User object type from API.
 * - Contains user information and metadata.
 *
 * AuthContextType
 * - Context type definition with user, loading, and callbacks.
 *
 * ----------------------------------------------------------------------------
 * How to Use:
 * ----------------------------------------------------------------------------
 *
 * 1. Wrap application with AuthProvider:
 *
 * <AuthProvider>
 *   <YourApp />
 * </AuthProvider>
 *
 * 2. Use in components:
 *
 * const { user, loading, refreshUser } = useAuth();
 *
 * if (loading) return <div>Loading...</div>;
 * if (!user) return <div>Not authenticated</div>;
 *
 * return <div>Welcome, {user.name}</div>;
 *
 * ============================================================================
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, setStoredUser, type User } from '@/lib/api';

type AuthContextType = {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    refreshUser: async () => { },
    setUser: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const res = await getMe();
            if (res.success && res.user) {
                setUser(res.user);
                setStoredUser(res.user); // in-memory only; no localStorage/cookies for user data
            } else {
                setUser(null);
                setStoredUser(null);
            }
        } catch {
            setUser(null);
            setStoredUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (!user) return;

        // Presence Heartbeat: silently keep lastSeen updated every 60s
        const heartbeat = setInterval(() => {
            getMe().catch(() => {});
        }, 60000);

        return () => clearInterval(heartbeat);
    }, [user]);

    const value = useMemo(
        () => ({ user, loading, refreshUser: fetchUser, setUser }),
        [user, loading, fetchUser]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);