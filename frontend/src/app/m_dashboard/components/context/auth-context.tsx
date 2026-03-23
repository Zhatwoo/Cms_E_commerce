/*
Etong auth-context.tsx na to ginawa lang to para global na yung pag tawag ng auth ni user di na per page
para isahang tawag lang and di maabuso yung token
*/


'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiErrorMessage, getMe, logout, setStoredUser, type User } from '@/lib/api';

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
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const handleSuspendedSession = async (reason?: string) => {
        const message = reason && reason.trim()
            ? `Your account is currently suspended. Reason: ${reason.trim()}`
            : 'Your account is currently suspended. Please contact admin for assistance.';
        try {
            if (typeof window !== 'undefined') {
                window.sessionStorage.setItem('mercato_suspension_notice', message);
            }
        } catch {
            // ignore storage failure
        }
        await logout();
        setUser(null);
        setStoredUser(null);
        router.replace('/?suspended=1');
    };

    const fetchUser = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await getMe();
            if (res.success && res.user) {
                setUser(res.user);
                setStoredUser(res.user); // in-memory only; no localStorage/cookies for user data
            } else {
                setUser(null);
                setStoredUser(null);
            }
        } catch (error) {
            const message = getApiErrorMessage(error).toLowerCase();
            if (message.includes('suspended') || message.includes('deactivated') || message.includes('restricted')) {
                await handleSuspendedSession(getApiErrorMessage(error));
                return;
            }
            setUser(null);
            setStoredUser(null);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => {
            fetchUser(true);
        }, 15000);

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchUser(true);
            }
        };

        window.addEventListener('focus', onVisibilityChange);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener('focus', onVisibilityChange);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);