// c:\Users\echob\OJT\Cms_E_commerce\frontend\src\app\m_dashboard\components\header.tsx

'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, type User } from '@/lib/api';
import { useTheme } from './theme-context';
import { useAuth } from './auth-context';

const SunIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const MoonIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const BellIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const UserIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const NOTIFICATIONS = [
    { id: 1, text: "Project 'Mercato Launch' deployed successfully.", time: "2m ago", unread: true },
    { id: 2, text: "New order #1023 received ($120.00).", time: "1h ago", unread: true },
    { id: 3, text: "Domain verification failed for shop.mercato.tools", time: "5h ago", unread: false },
];

type DashboardHeaderProps = {
    onMenuToggle: () => void;
};

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
    const router = useRouter();
    const { user, setUser } = useAuth();
    const { theme, toggleTheme, colors } = useTheme();
    const [showMenu, setShowMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const userName = user?.name || user?.email || '';

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setShowMenu(false);
        router.push('/auth/login');
        router.refresh();
    };

    return (
        <header 
            className="border-b sticky top-0 z-20 transition-colors duration-300"
            style={{ borderColor: colors.border.faint }}
        >
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center">
                    <button
                        type="button"
                        className="lg:hidden p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        style={{ color: colors.text.secondary }}
                        onClick={onMenuToggle}
                        aria-label="Open menu"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        style={{ color: colors.text.secondary }}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 relative"
                            style={{ color: colors.text.secondary }}
                            aria-label="Notifications"
                        >
                            <BellIcon />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white dark:border-black" />
                        </button>
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                                <div 
                                    className="absolute right-0 mt-2 w-80 rounded-xl border shadow-xl z-20 backdrop-blur-md overflow-hidden"
                                    style={{ backgroundColor: theme === 'dark' ? 'rgba(29, 29, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderColor: colors.border.faint }}
                                >
                                    <div className="px-4 py-3 border-b" style={{ borderColor: colors.border.faint }}>
                                        <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>Notifications</p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {NOTIFICATIONS.map(n => (
                                            <div key={n.id} className="px-4 py-3 border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" style={{ borderColor: colors.border.faint }}>
                                                <p className="text-sm" style={{ color: colors.text.primary }}>{n.text}</p>
                                                <p className="text-xs mt-1" style={{ color: colors.text.muted }}>{n.time}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium" style={{ color: colors.text.primary }}>{userName || 'User'}</p>
                            <p className="text-xs" style={{ color: colors.text.muted }}>Website Owner</p>
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowMenu((v) => !v)}
                                className="h-10 w-10 rounded-full border flex items-center justify-center shadow-sm hover:opacity-80 transition-opacity"
                                style={{ 
                                    backgroundColor: colors.bg.elevated, 
                                    borderColor: colors.border.faint,
                                    color: colors.text.secondary
                                }}
                                aria-label="Profile menu"
                            >
                                <UserIcon />
                            </button>
                            {showMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        aria-hidden="true"
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <div 
                                        className="absolute right-0 mt-2 w-48 rounded-xl border py-1 shadow-xl z-20 backdrop-blur-md"
                                        style={{ 
                                            backgroundColor: theme === 'dark' ? 'rgba(29, 29, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                            borderColor: colors.border.faint
                                        }}
                                    >
                                        <Link
                                            href="/m_dashboard/profile"
                                            className="block px-4 py-2 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                                            style={{ color: colors.text.primary }}
                                            onClick={() => setShowMenu(false)}
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                                            style={{ color: colors.status.error }}
                                        >
                                            Log out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
