// wala header lang, laman lang neto is yung user name, profile, notif, dito ren pala nilagay yung theme toggle

'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getApiUrl, logout } from '@/lib/api';
import { useTheme } from '../context/theme-context';
import { useAuth } from '../context/auth-context';
import { ProjectSwitchPill } from './ProjectSwitchPill';
import { AnimatePresence, motion } from 'framer-motion';

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

const ChevronDownIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M6 9l6 6 6-6" />
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

const ProfileMenuIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
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

const LogoutIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const NOTIFICATIONS: { id: number; text: string; time: string; unread: boolean }[] = [];

type DashboardHeaderProps = {
    onMenuToggle: () => void;
};

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, setUser } = useAuth();
    const { theme, toggleTheme, colors } = useTheme();
    const [showMenu, setShowMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);
    const emailPrefix = (user?.email || '').split('@')[0] || 'user';
    const usernameValue = String(user?.username || emailPrefix || '').replace(/^@+/, '');
    const headerIdentity = `@${usernameValue || 'user'}`;
    const avatarAlt = user?.name || headerIdentity || 'User avatar';

    const resolveAvatarUrl = (raw?: string): string => {
        const value = String(raw || '').trim();
        if (!value) return '';
        if (/^(https?:|data:|blob:)/i.test(value)) return value;
        if (value.startsWith('/')) return `${getApiUrl()}${value}`;
        return value;
    };

    const avatarSrc = user?.avatar
        ? resolveAvatarUrl(user.avatar)
        : user?.email
            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`
            : '';
    const avatarLoadFailed = Boolean(avatarSrc && failedAvatarSrc === avatarSrc);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;
    const showProjectSwitch =
        pathname?.startsWith('/m_dashboard/products') ||
        pathname?.startsWith('/m_dashboard/inventory') ||
        pathname?.startsWith('/m_dashboard/orders');

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setShowMenu(false);
        router.push('/');
        router.refresh();
    };

    return (
        <header
            className="sticky top-0 z-30 transition-all duration-300 border-0"
            style={{
                background: scrolled
                    ? theme === 'dark'
                        ? 'rgba(0, 0, 54, 0.88)'
                        : 'rgba(240, 242, 245, 0.88)'
                    : 'transparent',
                backdropFilter: scrolled ? 'blur(14px)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
                borderBottom: scrolled
                    ? theme === 'dark'
                        ? '1px solid rgba(255,255,255,0.07)'
                        : '1px solid rgba(15,23,42,0.08)'
                    : 'none',
            }}
        >
            <div className="relative flex items-center justify-between px-4 sm:px-6" style={{ height: '84px' }}>
                <div className="flex items-center">
                    <button
                        type="button"
                        className={`lg:hidden p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                        style={{ color: theme === 'light' ? '#475569' : colors.text.secondary }}
                        onClick={onMenuToggle}
                        aria-label="Open menu"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {showProjectSwitch && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <ProjectSwitchPill />
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                        style={{ color: theme === 'light' ? '#475569' : colors.text.secondary }}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'} relative`}
                            style={{ color: theme === 'light' ? '#475569' : colors.text.secondary }}
                            aria-label="Notifications"
                        >
                            <BellIcon />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white dark:border-black" />
                            )}
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
                                        {NOTIFICATIONS.length > 0 ? (
                                            NOTIFICATIONS.map(n => (
                                                <div key={n.id} className="px-4 py-3 border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" style={{ borderColor: colors.border.faint }}>
                                                    <p className="text-sm" style={{ color: colors.text.primary }}>{n.text}</p>
                                                    <p className="text-xs mt-1" style={{ color: colors.text.muted }}>{n.time}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="px-4 py-4 text-sm" style={{ color: colors.text.muted }}>
                                                No notifications yet.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative flex items-center gap-3">
                        <div className="text-right hidden sm:block" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
                            <p className="text-sm font-medium" style={{ color: theme === 'light' ? '#0F172A' : colors.text.primary }}>{headerIdentity}</p>
                            <p className="text-xs" style={{ color: theme === 'light' ? '#475569' : colors.text.secondary }}>Website Owner</p>
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowMenu((v) => !v)}
                                className="relative h-10 w-10 rounded-full p-[2px] flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity overflow-visible cursor-pointer"
                                style={{
                                    background: 'linear-gradient(135deg, #FFCE00 0%, #A64CD9 50%, #5C1D8F 100%)',
                                    border: 'none',
                                    color: '#fff'
                                }}
                                aria-label="Profile menu"
                            >
                                <div
                                    className="h-full w-full rounded-full overflow-hidden flex items-center justify-center"
                                    style={{ backgroundColor: colors.bg.dark }}
                                >
                                    {avatarSrc && !avatarLoadFailed ? (
                                        <img
                                            src={avatarSrc}
                                            alt={avatarAlt}
                                            className="h-full w-full object-cover"
                                            onError={() => setFailedAvatarSrc(avatarSrc)}
                                        />
                                    ) : (
                                        <UserIcon />
                                    )}
                                </div>

                                <span
                                    className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border flex items-center justify-center"
                                    style={{
                                        backgroundColor: theme === 'dark' ? '#0F172A' : '#E2E8F0',
                                        borderColor: theme === 'dark' ? '#334155' : '#CBD5E1',
                                        color: theme === 'dark' ? '#94A3B8' : '#475569',
                                    }}
                                >
                                    <span className={`transition-transform duration-200 ${showMenu ? 'rotate-180' : 'rotate-0'}`}>
                                        <ChevronDownIcon />
                                    </span>
                                </span>
                            </button>
                            <AnimatePresence>
                                {showMenu && (
                                    <>
                                        <motion.div
                                            className="fixed inset-0 z-10"
                                            aria-hidden="true"
                                            onClick={() => setShowMenu(false)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.14 }}
                                        />
                                        <motion.div
                                            className="absolute right-0 mt-2 w-48 rounded-2xl border py-1.5 shadow-xl z-20 backdrop-blur-md"
                                            style={{
                                                backgroundColor: theme === 'dark' ? 'rgba(29, 29, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                                borderColor: colors.border.faint
                                            }}
                                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                        >
                                            <Link
                                                href="/m_dashboard/profile"
                                                className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                                                style={{ color: colors.text.primary }}
                                                onClick={() => setShowMenu(false)}
                                            >
                                                <ProfileMenuIcon />
                                                Profile
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-2 text-left px-4 py-2 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                                                style={{ color: colors.status.error }}
                                            >
                                                <LogoutIcon />
                                                Log out
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
