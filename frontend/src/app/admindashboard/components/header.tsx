'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    getClients,
    getDomainsManagement,
    listProducts,
    type ApiProduct,
    type ClientRow,
    type WebsiteManagementRow,
} from '@/lib/api';

const SearchIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

    const handleProfileClick = () => {
        router.push('/admindashboard/userAccount/profile');
    };

    const handleNotificationsClick = () => {
        router.push('/admindashboard/notifications');
    };

    const handleSearchNavigate = (href: string) => {
        setIsSearchOpen(false);
        setQuery('');
        setDebouncedQuery('');
        router.push(href);
    };

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
        };

        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsSearchOpen(false);
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
                        listProducts({ limit: 500 }).then((res) => {
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

    return (
        <header className="relative z-20 px-4 pt-4 sm:px-6 lg:px-6 lg:pt-6">
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
                    <button
                        type="button"
                        onClick={handleNotificationsClick}
                        suppressHydrationWarning
                        className="admin-dashboard-panel inline-flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5"
                        aria-label="Notifications"
                    >
                        <Image src="/admin-dashboard/icons/notification.png" alt="Notifications" width={20} height={20} className="object-contain" />
                    </button>

                    <button
                        type="button"
                        onClick={handleProfileClick}
                        suppressHydrationWarning
                        className="admin-dashboard-panel inline-flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5"
                        aria-label="Profile"
                    >
                        <Image src="/admin-dashboard/icons/account-circle.png" alt="Profile" width={22} height={22} className="object-contain" />
                    </button>
                </div>
            </div>
        </header>
    );
}