'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
    getApiUrl,
    getClients,
    getDomainsManagement,
    getMe,
    getStoredUser,
    setStoredUser,
    listProducts,
    logout,
    type ApiProduct,
    type ClientRow,
    type User,
    type WebsiteManagementRow,
} from '@/lib/api';
import { getNotifications, markAsRead, type NotificationItem } from '@/lib/notifications';

const SearchIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ProfileChevronIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M6 9l6 6 6-6" />
    </svg>
);

const ProfileMenuIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const LogoutMenuIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

type AdminHeaderProps = {
    onMenuClick?: () => void;
};

type SearchTarget = {
    id: string;
    label: string;
    href: string;
    keywords: string[];
    category: 'Page' | 'Tab';
};

type SearchResult = {
    id: string;
    title: string;
    subtitle: string;
    href: string;
    category: 'Page' | 'Tab' | 'Client' | 'Website' | 'Product';
};

const ADMIN_SEARCH_TARGETS: SearchTarget[] = [
    { id: 'page-home', label: 'Dashboard Home', href: '/admindashboard', keywords: ['home', 'dashboard', 'overview'], category: 'Page' },
    { id: 'page-analytics', label: 'Analytics', href: '/admindashboard/monitorAnalytics', keywords: ['analytics', 'traffic', 'revenue', 'growth'], category: 'Page' },
    { id: 'page-management', label: 'User and Website Management', href: '/admindashboard/usernweb', keywords: ['management', 'users', 'websites', 'clients'], category: 'Page' },
    { id: 'tab-clients', label: 'Clients Tab', href: '/admindashboard/usernweb?tab=clients', keywords: ['clients', 'users', 'accounts'], category: 'Tab' },
    { id: 'tab-websites', label: 'Websites Tab', href: '/admindashboard/usernweb?tab=domains', keywords: ['websites', 'domains', 'sites'], category: 'Tab' },
    { id: 'page-templates', label: 'Templates and Assets', href: '/admindashboard/templatesnassets', keywords: ['templates', 'assets', 'themes'], category: 'Page' },
    { id: 'tab-templates-built-in', label: 'Built-In Templates Tab', href: '/admindashboard/templatesnassets?tab=builtin', keywords: ['built in', 'builtin', 'templates'], category: 'Tab' },
    { id: 'tab-templates-user', label: 'User Templates Tab', href: '/admindashboard/templatesnassets?tab=user', keywords: ['user templates', 'uploaded templates'], category: 'Tab' },
    { id: 'page-monitoring', label: 'Website and Product Monitoring', href: '/admindashboard/monitoring?tab=websites', keywords: ['monitoring', 'websites', 'products'], category: 'Page' },
    { id: 'tab-monitor-websites', label: 'Monitoring Websites Tab', href: '/admindashboard/monitoring?tab=websites', keywords: ['monitoring websites', 'website status'], category: 'Tab' },
    { id: 'tab-monitor-products', label: 'Monitoring Products Tab', href: '/admindashboard/monitoring?tab=products', keywords: ['monitoring products', 'product status'], category: 'Tab' },
    { id: 'page-moderation', label: 'Moderation and Compliance', href: '/admindashboard/moderationCompliance', keywords: ['moderation', 'compliance', 'approval'], category: 'Page' },
    { id: 'page-notifications', label: 'Notifications', href: '/admindashboard/notifications', keywords: ['notifications', 'alerts', 'inbox'], category: 'Page' },
    { id: 'page-profile', label: 'Admin Profile', href: '/admindashboard/userAccount/profile', keywords: ['profile', 'account', 'user account'], category: 'Page' },
    { id: 'page-security', label: 'Admin Security', href: '/admindashboard/userAccount/security', keywords: ['security', 'password', 'auth'], category: 'Page' },
    { id: 'page-activity', label: 'Admin Activity', href: '/admindashboard/userAccount/activity', keywords: ['activity', 'logs'], category: 'Page' },
];

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

function includesQuery(value: string, query: string): boolean {
    return normalize(value).includes(query);
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [websites, setWebsites] = useState<WebsiteManagementRow[]>([]);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [hasLoadedClients, setHasLoadedClients] = useState(false);
    const [hasLoadedWebsites, setHasLoadedWebsites] = useState(false);
    const [hasLoadedProducts, setHasLoadedProducts] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const profileMenuRef = useRef<HTMLDivElement | null>(null);
    const notificationsRef = useRef<HTMLDivElement | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string; type: string } | null>(null);

    useEffect(() => {
        const load = () => {
            setNotifications(getNotifications());
        };
        load();
        window.addEventListener('notificationsUpdate', load);

        const onNewReceived = (e: any) => {
            const newItem = e.detail;
            if (!newItem) return;

            // Only show toast if it's NOT from the current user (don't double notify)
            // Or if current user is null (maybe just for testing)
            if (currentUser && newItem.adminId === currentUser.id) {
                return;
            }

            setActiveToast({
                id: newItem.id || `toast-${Date.now()}`,
                title: newItem.title,
                message: newItem.message,
                type: newItem.type || 'info'
            });

            // Auto dismiss toast
            setTimeout(() => {
                setActiveToast(prev => (prev?.id === newItem.id ? null : prev));
            }, 5000);
        };

        window.addEventListener('notification:new_received', onNewReceived);

        return () => {
            window.removeEventListener('notificationsUpdate', load);
            window.removeEventListener('notification:new_received', onNewReceived);
        };
    }, [currentUser]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleProfileClick = () => {
        setShowProfileMenu(false);
        router.push('/admindashboard/userAccount/profile');
    };

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await logout();
        } finally {
            setShowProfileMenu(false);
            router.replace('/adminauth/login');
            router.refresh();
            setIsLoggingOut(false);
        }
    };

    const handleNotificationsClick = () => {
        setShowNotifications((prev) => !prev);
        setShowProfileMenu(false);
    };

    const handleMarkSingleRead = (id: string, e: React.SyntheticEvent) => {
        e.stopPropagation();
        markAsRead(id);
    };

    const handleOpenNotification = (id: string) => {
        markAsRead(id);
        setShowNotifications(false);
        router.push('/admindashboard/notifications');
    };

    const handleSearchNavigate = (href: string) => {
        setIsSearchOpen(false);
        setQuery('');
        setDebouncedQuery('');
        router.push(href);
    };

    useEffect(() => {
        const handleUserUpdate = () => {
            setCurrentUser(getStoredUser());
        };

        window.addEventListener('userUpdate', handleUserUpdate);
        return () => window.removeEventListener('userUpdate', handleUserUpdate);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const syncUser = async () => {
            try {
                // Prioritize local state first
                const local = getStoredUser();
                if (local) {
                    setCurrentUser(local);
                }

                const res = await getMe();
                if (!isMounted) return;
                if (res.success && res.user) {
                    // Only update if we don't have local mock-saved data or if it's a fresh login
                    const updated = { 
                        ...res.user,
                        // Preserve our session-only mock data if it exists
                        avatar: local?.avatar || res.user.avatar,
                        username: (local as any)?.username || (res.user as any).username
                    };
                    setStoredUser(updated);
                    setCurrentUser(updated);
                }
            } catch {
                // keep stored user fallback
                const local = getStoredUser();
                if (local) setCurrentUser(local);
            }
        };

        syncUser();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 220);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (!searchContainerRef.current) return;
            if (!searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }

            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }

            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsSearchOpen(false);
                setShowProfileMenu(false);
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onEscape);
        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onEscape);
        };
    }, []);

    useEffect(() => {
        const q = normalize(debouncedQuery);
        if (q.length < 2) return;
        if (hasLoadedClients && hasLoadedWebsites && hasLoadedProducts) return;

        let cancelled = false;
        setIsDataLoading(true);

        (async () => {
            try {
                const loadTasks: Promise<void>[] = [];

                if (!hasLoadedClients) {
                    loadTasks.push(
                        getClients().then((res) => {
                            if (cancelled) return;
                            setClients(res.success && Array.isArray(res.users) ? res.users : []);
                            setHasLoadedClients(true);
                        })
                    );
                }

                if (!hasLoadedWebsites) {
                    loadTasks.push(
                        getDomainsManagement().then((res) => {
                            if (cancelled) return;
                            setWebsites(res.success && Array.isArray(res.data) ? res.data : []);
                            setHasLoadedWebsites(true);
                        })
                    );
                }

                if (!hasLoadedProducts) {
                    loadTasks.push(
                        listProducts({ limit: 500, ignoreActiveProjectScope: true, includeAllUsers: true }).then((res) => {
                            if (cancelled) return;
                            setProducts(res.success && Array.isArray(res.items) ? res.items : []);
                            setHasLoadedProducts(true);
                        })
                    );
                }

                await Promise.allSettled(loadTasks);

                if (cancelled) return;
            } finally {
                if (!cancelled) setIsDataLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, hasLoadedClients, hasLoadedProducts, hasLoadedWebsites]);

    const searchResults = useMemo(() => {
        const q = normalize(debouncedQuery);
        if (!q) return [] as SearchResult[];

        const pageResults: SearchResult[] = ADMIN_SEARCH_TARGETS
            .filter((target) => includesQuery(target.label, q) || target.keywords.some((keyword) => includesQuery(keyword, q)))
            .map((target) => ({
                id: target.id,
                title: target.label,
                subtitle: target.href,
                href: target.href,
                category: target.category,
            }));

        const clientResults: SearchResult[] = clients
            .filter((client) => {
                const displayName = client.displayName || '';
                const email = client.email || '';
                const usernameFromEmail = email.split('@')[0] || '';
                const status = client.status || '';
                return includesQuery(displayName, q)
                    || includesQuery(email, q)
                    || includesQuery(usernameFromEmail, q)
                    || includesQuery(status, q);
            })
            .slice(0, 8)
            .map((client) => ({
                id: `client-${client.id}`,
                title: client.displayName || client.email || 'Client',
                subtitle: `${client.email || 'Client account'}${client.subscriptionPlan ? ` • ${client.subscriptionPlan}` : ''}`,
                href: `/admindashboard/usernweb?tab=clients&search=${encodeURIComponent(client.email || client.displayName || '')}&clientId=${encodeURIComponent(client.id)}`,
                category: 'Client',
            }));

        const websiteResults: SearchResult[] = websites
            .filter((website) => {
                return includesQuery(website.domainName || '', q)
                    || includesQuery(website.owner || '', q)
                    || includesQuery(website.plan || '', q)
                    || includesQuery(website.status || '', q)
                    || includesQuery(website.domainType || '', q);
            })
            .slice(0, 8)
            .map((website) => ({
                id: `website-${website.id}`,
                title: website.domainName || 'Website',
                subtitle: `${website.owner || 'Website owner'}${website.plan ? ` • ${website.plan}` : ''}`,
                href: `/admindashboard/usernweb?tab=domains&search=${encodeURIComponent(website.domainName || website.owner || '')}&websiteId=${encodeURIComponent(website.id)}&websiteUserId=${encodeURIComponent(website.userId || '')}`,
                category: 'Website',
            }));

        const productResults: SearchResult[] = products
            .filter((product) => {
                return includesQuery(product.name || '', q)
                    || includesQuery(product.sku || '', q)
                    || includesQuery(product.subdomain || '', q)
                    || includesQuery(product.category || '', q)
                    || includesQuery(product.subcategory || '', q)
                    || includesQuery(product.status || '', q);
            })
            .slice(0, 8)
            .map((product) => ({
                id: `product-${product.id}`,
                title: product.name || 'Product',
                subtitle: `${product.subdomain || 'Unknown subdomain'}${product.sku ? ` • SKU: ${product.sku}` : ''}${product.category ? ` • ${product.category}` : ''}`,
                href: `/admindashboard/monitoring?tab=products&search=${encodeURIComponent(product.name || product.sku || '')}&productId=${encodeURIComponent(product.id)}`,
                category: 'Product',
            }));

        return [...pageResults, ...clientResults, ...websiteResults, ...productResults].slice(0, 14);
    }, [clients, debouncedQuery, products, websites]);

    const resolveAvatarUrl = (raw?: string): string => {
        const value = String(raw || '').trim();
        if (!value) return '';
        if (/^(https?:|data:|blob:)/i.test(value)) return value;
        if (value.startsWith('/')) return `${getApiUrl()}${value}`;
        return value;
    };

    const avatarSrc = resolveAvatarUrl(currentUser?.avatar);
    const namePart = (currentUser as any)?.username || currentUser?.name || currentUser?.email || 'Admin';
    const profileDisplayName = namePart.includes("John Lloyd") ? "kurohara" : String(namePart).trim();
    const avatarAlt = profileDisplayName || 'Admin profile';
    const initials = profileDisplayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'A';

    return (
        <header className="relative z-20 px-4 pt-4 sm:px-6 lg:px-6 lg:pt-6">
            {/* Real-time Notification Toast (Framer Motion) */}
            <AnimatePresence>
                {activeToast && (
                    <motion.div
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="fixed right-4 top-20 z-[9999] flex w-[320px] cursor-pointer items-start gap-3 rounded-2xl bg-white/95 p-4 shadow-[0_12px_45px_rgba(109,40,217,0.18)] backdrop-blur-md"
                        style={{ border: '1.5px solid rgba(177,59,255,0.2)' }}
                        onClick={() => router.push('/admindashboard/notifications')}
                    >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br transition-all hover:scale-105 active:scale-95 ${
                            activeToast.type === 'error' ? 'from-rose-500 to-red-600' :
                            activeToast.type === 'warning' ? 'from-orange-400 to-amber-500' :
                            'from-[#B13BFF] to-[#8B5CF6]'
                        }`}>
                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h4 className="truncate text-sm font-bold text-[#4a1a8a]">{activeToast.title}</h4>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-normal text-[#7a6aa0]">{activeToast.message}</p>
                            <div className="mt-1 text-[10px] font-bold uppercase tracking-tighter text-[#B13BFF]/60 underline decoration-[#B13BFF]/30">Click to expand</div>
                        </div>
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}
                            className="text-[#B13BFF]/50 hover:text-[#B13BFF]"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex w-full items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-3">
                    {onMenuClick ? (
                        <button
                            type="button"
                            onClick={onMenuClick}
                            aria-label="Open menu"
                            suppressHydrationWarning
                            className="admin-dashboard-panel inline-flex h-12 w-12 items-center justify-center rounded-2xl lg:hidden"
                        >
                            <Image src="/admin-dashboard/icons/toggle.png" alt="Menu" width={18} height={18} className="object-contain" />
                        </button>
                    ) : null}

                    <div ref={searchContainerRef} className="relative w-full max-w-[23rem] sm:max-w-[24rem]">
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onFocus={() => setIsSearchOpen(true)}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setIsSearchOpen(true);
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && searchResults.length > 0) {
                                        event.preventDefault();
                                        handleSearchNavigate(searchResults[0].href);
                                    }
                                }}
                                placeholder="Search pages, tabs, users, websites, products"
                                suppressHydrationWarning
                                className="admin-dashboard-input admin-dashboard-panel-soft admin-dashboard-soft-text h-12 w-full rounded-2xl border-0 pl-12 pr-4 text-sm font-medium outline-none placeholder:opacity-100"
                            />
                            <div className="admin-dashboard-yellow pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                                <SearchIcon />
                            </div>
                        </div>

                        {isSearchOpen ? (
                            <div className="admin-dashboard-panel absolute left-0 right-0 top-[calc(100%+0.55rem)] max-h-[21rem] overflow-y-auto rounded-2xl border border-[rgba(177,59,255,0.24)] bg-[#F5F4FF] p-2 shadow-[0_12px_30px_rgba(123,78,192,0.18)]">
                                {normalize(query).length < 2 ? (
                                    <p className="px-3 py-2 text-xs text-[#7C7393]">Type at least 2 characters to search all admin content.</p>
                                ) : searchResults.length === 0 ? (
                                    isDataLoading ? (
                                        <p className="px-3 py-2 text-xs text-[#7C7393]">Loading searchable data...</p>
                                    ) : (
                                    <p className="px-3 py-2 text-xs text-[#7C7393]">No matches found.</p>
                                    )
                                ) : (
                                    <div className="space-y-1">
                                        {isDataLoading ? <p className="px-3 py-1 text-[11px] text-[#7C7393]">Loading more data...</p> : null}
                                        {searchResults.map((result) => (
                                            <button
                                                key={result.id}
                                                type="button"
                                                onClick={() => handleSearchNavigate(result.href)}
                                                className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/70"
                                            >
                                                <p className="text-sm font-semibold text-[#4E2A8A]">{result.title}</p>
                                                <p className="text-xs text-[#7C7393]">{result.category} • {result.subtitle}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div ref={notificationsRef} className="relative">
                        <button
                            type="button"
                            onClick={handleNotificationsClick}
                            suppressHydrationWarning
                            className={`admin-dashboard-panel inline-flex h-12 w-12 items-center justify-center rounded-full transition-all hover:-translate-y-0.5 ${showNotifications ? 'shadow-[0_0_20px_rgba(177,59,255,0.2)] border-[rgba(177,59,255,0.3)]' : ''}`}
                            aria-label="Notifications"
                        >
                            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] text-[#4a1a8a]" fill="currentColor">
                                <path d="M12 22a2.98 2.98 0 0 0 2.818-2H9.182A2.98 2.98 0 0 0 12 22zm7-6V9a7 7 0 1 0-14 0v7l-2 2v1h18v-1l-2-2z" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute right-2.5 top-2.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#FF5252] px-1 text-[9px] font-bold text-white ring-2 ring-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications ? (
                            <div className="admin-dashboard-panel absolute right-0 top-[calc(100%+0.55rem)] z-30 w-[18rem] overflow-hidden rounded-2xl border border-[rgba(177,59,255,0.24)] bg-white shadow-[0_12px_30px_rgba(123,78,192,0.18)]">
                                <div className="border-b border-[rgba(177,59,255,0.1)] bg-[#F5F4FF]/50 px-4 py-3">
                                    <h3 className="text-sm font-bold text-[#4a1a8a]">Notifications</h3>
                                </div>
                                <div className="max-h-[22rem] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="flex min-h-[5rem] items-center justify-center p-6 text-center">
                                            <p className="text-sm font-medium text-[#7a6aa0]">No notifications yet.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-[rgba(177,59,255,0.08)]">
                                            {notifications.slice(0, 10).map((n) => (
                                                <button
                                                    key={n.id} 
                                                    type="button"
                                                    onClick={() => handleOpenNotification(n.id)}
                                                    className={`group relative flex w-full cursor-pointer flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-[#F5F4FF]/50 ${!n.read ? 'bg-[#F5F4FF]/20' : ''}`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <span className={`text-[13px] font-bold leading-tight ${!n.read ? 'text-[#4a1a8a]' : 'text-[#7a6aa0]'}`}>{n.title}</span>
                                                        {!n.read && (
                                                            <span
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={(e) => handleMarkSingleRead(n.id, e)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        handleMarkSingleRead(n.id, e);
                                                                    }
                                                                }}
                                                                className="h-2 w-2 flex-shrink-0 rounded-full bg-[#B13BFF] transition-transform hover:scale-125"
                                                                title="Mark as read"
                                                            />
                                                        )}
                                                    </div>
                                                    <p className="line-clamp-2 text-xs text-[#8B85A5]">{n.message}</p>
                                                    <span className="mt-1 text-[10px] font-medium text-[#B13BFF]/60">{n.time}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-[rgba(177,59,255,0.1)] bg-[#F5F4FF]/30 px-4 py-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNotifications(false);
                                            router.push('/admindashboard/notifications');
                                        }}
                                        className="text-xs font-bold text-[#4a1a8a] transition-colors hover:text-[#B13BFF]"
                                    >
                                        See all
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div ref={profileMenuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setShowProfileMenu((prev) => !prev)}
                            suppressHydrationWarning
                            className="admin-dashboard-panel relative inline-flex h-12 w-12 items-center justify-center overflow-visible rounded-full transition-transform hover:-translate-y-0.5"
                            aria-label="Profile menu"
                        >
                            <span className="inline-flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                                {avatarSrc ? (
                                    <img
                                        src={avatarSrc}
                                        alt={avatarAlt}
                                        className="h-full w-full object-cover"
                                        onError={() => setCurrentUser((prev) => (prev ? { ...prev, avatar: '' } : prev))}
                                    />
                                ) : (
                                    <span className="inline-flex h-full w-full items-center justify-center bg-gradient-to-br from-[#B13BFF] to-[#8B5CF6] text-sm font-bold text-white">
                                        {initials}
                                    </span>
                                )}
                            </span>

                            <span
                                className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[rgba(177,59,255,0.25)] bg-white text-[#6D28D9] shadow-[0_4px_10px_rgba(123,78,192,0.22)]"
                                aria-hidden="true"
                            >
                                <span className={`transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : 'rotate-0'}`}>
                                    <ProfileChevronIcon />
                                </span>
                            </span>
                        </button>

                        {showProfileMenu ? (
                            <div className="admin-dashboard-panel absolute right-0 top-[calc(100%+0.55rem)] z-30 w-44 rounded-2xl border border-[rgba(177,59,255,0.24)] bg-[#F5F4FF] p-1.5 shadow-[0_12px_30px_rgba(123,78,192,0.18)]">
                                <button
                                    type="button"
                                    onClick={handleProfileClick}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#4E2A8A] transition hover:bg-white/70"
                                >
                                    <ProfileMenuIcon />
                                    Profile
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#B13BFF] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <LogoutMenuIcon />
                                    {isLoggingOut ? 'Logging out...' : 'Log out'}
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </header>
    );
}