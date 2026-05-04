/*
Etong auth-context.tsx na to ginawa lang to para global na yung pag tawag ng auth ni user di na per page
para isahang tawag lang and di maabuso yung token
*/


'use client';
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