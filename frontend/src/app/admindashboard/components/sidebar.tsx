'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '@/lib/api';
import { ADMIN_NAV_ITEMS, isAdminNavItemMatch } from '@/lib/config/adminNavigation';
import { ChevronDownIcon, CloseIcon, LogoutIcon } from '@/lib/icons/adminIcons';
import { useAdminLoading } from './LoadingProvider';

// ── Message / Chat icon derived from the uploaded purple chat bubble ──────────
export function MessageIcon({ className = 'h-5 w-5' }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Rounded rectangle body */}
            <rect x="16" y="16" width="480" height="360" rx="80" ry="80" fill="currentColor" />
            {/* Tail / pointer */}
            <path d="M120 376 L60 460 L240 376 Z" fill="currentColor" />
            {/* Three dots - changed to white for better visibility and matching design */}
            <circle cx="168" cy="196" r="36" fill="white" />
            <circle cx="256" cy="196" r="36" fill="white" />
            <circle cx="344" cy="196" r="36" fill="white" />
        </svg>
    );
}

interface AdminSidebarProps {
    mobile?: boolean;
    onClose?: () => void;
    forcedActiveItemId?: string;
    forcedActiveChildId?: string;
    onNavigateStart?: () => void;
}

function isChildPathMatch(pathname: string, matchIncludes: string): boolean {
    return pathname.includes(matchIncludes);
}

let desktopSidebarExpandedMemory = false;

const panelStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.86)',
    border: '1px solid rgba(166,61,255,0.13)',
    boxShadow: '0 8px 32px rgba(103,2,191,0.09), inset 0 1px 0 rgba(255,255,255,0.9)',
    backdropFilter: 'blur(16px)',
};

const iconWrapStyle: React.CSSProperties = {
    background: 'rgba(166,61,255,0.07)',
    border: '1px solid rgba(166,61,255,0.10)',
};

const navActiveStyle: React.CSSProperties = {
    background: 'rgba(166,61,255,0.09)',
    color: '#6b21d8',
};

const navLabelStyle: React.CSSProperties = {
    display: 'inline-block',
    transition: 'opacity 100ms, transform 150ms ease',
    transformOrigin: 'left center',
};

const childLabelStyle: React.CSSProperties = {
    display: 'inline-block',
    transition: 'transform 150ms ease, padding-left 150ms ease',
    transformOrigin: 'left center',
};

export function AdminSidebar({ mobile = false, onClose, forcedActiveItemId, forcedActiveChildId, onNavigateStart }: AdminSidebarProps) {
    const [isHovered, setIsHovered] = useState(() => (!mobile && desktopSidebarExpandedMemory));
    const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
    const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const itemLeaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const pathname = usePathname();
    const router = useRouter();
    const { startLoading } = useAdminLoading();

    const handleNavigate = () => {
        startLoading();
        onNavigateStart?.();
    };

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try { await logout(); } finally {
            onClose?.();
            router.replace('/adminauth/login');
            router.refresh();
            setIsLoggingOut(false);
        }
    };

    useEffect(() => { if (!mobile) desktopSidebarExpandedMemory = isHovered; }, [isHovered, mobile]);

    const toggleDropdown = (id: string) =>
        setOpenDropdowns((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
        );

    const handleMouseEnter = () => {
        if (collapseTimerRef.current) { clearTimeout(collapseTimerRef.current); collapseTimerRef.current = null; }
        desktopSidebarExpandedMemory = true;
        setIsHovered(true);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 1);
    };

    const handleMouseLeave = () => {
        if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = setTimeout(() => {
            desktopSidebarExpandedMemory = false;
            setIsHovered(false);
            setOpenDropdowns([]);
            setHoveredItemId(null);
            collapseTimerRef.current = null;
            window.dispatchEvent(new Event('resize'));
        }, 180);
    };

    const handleNavItemMouseEnter = (id: string) => {
        if (itemLeaveTimers.current[id]) {
            clearTimeout(itemLeaveTimers.current[id]);
            delete itemLeaveTimers.current[id];
        }
        setHoveredItemId(id);
    };

    const handleNavItemMouseLeave = (id: string) => {
        itemLeaveTimers.current[id] = setTimeout(() => {
            setHoveredItemId((prev) => (prev === id ? null : prev));
            delete itemLeaveTimers.current[id];
        }, 120);
    };

    const handleLabelMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.currentTarget.style.transform = 'scale(1.09)';
    };

    const handleLabelMouseLeave = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.currentTarget.style.transform = 'scale(1)';
    };

    const handleChildMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const label = e.currentTarget.querySelector<HTMLSpanElement>('.child-label');
        if (label) {
            label.style.transform = 'scale(1.07)';
            label.style.paddingLeft = '4px';
        }
    };

    const handleChildMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const label = e.currentTarget.querySelector<HTMLSpanElement>('.child-label');
        if (label) {
            label.style.transform = 'scale(1)';
            label.style.paddingLeft = '0px';
        }
    };

    useEffect(() => () => {
        if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
        Object.values(itemLeaveTimers.current).forEach(clearTimeout);
    }, []);

    const matchedActiveItem = ADMIN_NAV_ITEMS.find((item) => isAdminNavItemMatch(pathname, item))?.id;
    const activeItem = forcedActiveItemId ?? matchedActiveItem;
    const COLLAPSED_WIDTH = 104;
    const EXPANDED_WIDTH = 322;

    // Helper to render a nav item icon — supports both image src and the MessageIcon SVG
    const renderIcon = (item: typeof ADMIN_NAV_ITEMS[number]) => {
        if (item.iconComponent === 'MessageIcon') {
            return (
                <MessageIcon className="h-5 w-5" />
            );
        }
        return (
            <Image src={item.iconSrc} alt={item.iconAlt} width={20} height={20} className="h-5 w-5 object-contain" />
        );
    };

    /* ── Mobile sidebar ──────────────────────────────────────── */
    if (mobile) {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="fixed inset-0 z-40"
                    style={{ background: 'rgba(80,30,150,0.25)', backdropFilter: 'blur(2px)' }}
                />
                <motion.aside
                    initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed inset-y-0 left-0 z-50 flex w-[18.5rem] flex-col px-4 py-4"
                >
                    <div className="flex h-full flex-col rounded-[28px] p-4" style={panelStyle}>
                        {/* Top */}
                        <div className="px-2 pb-5 pt-1">
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={onClose}
                                    className="rounded-2xl p-2 transition"
                                    style={{ color: '#7a6aa0' }}
                                    aria-label="Close sidebar"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            <div className="mt-2 flex flex-col items-center text-center">
                                <Image src="/images/logo.svg" alt="CMS E-commerce" width={48} height={48} className="h-9 w-auto object-contain" />
                            </div>
                        </div>

                        {/* Nav — mobile keeps click-to-toggle */}
                        <nav className="flex-1 space-y-1 overflow-y-auto">
                            {ADMIN_NAV_ITEMS.map((item) => {
                                const isActive = activeItem === item.id;
                                const hasChildren = !!(item.children?.length);
                                const isOpen = openDropdowns.includes(item.id) || (!!forcedActiveChildId && item.id === activeItem);

                                return (
                                    <motion.div key={item.id} layout>
                                        {hasChildren ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleDropdown(item.id)}
                                                suppressHydrationWarning
                                                className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 transition-colors"
                                                style={{ color: '#4a1a8a', ...(isActive ? navActiveStyle : {}) }}
                                            >
                                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={iconWrapStyle}>
                                                    {renderIcon(item)}
                                                </span>
                                                <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>
                                                <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200${isOpen ? ' rotate-180' : ''}`} />
                                            </button>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                onClick={() => {
                                                    onClose?.();
                                                    handleNavigate();
                                                }}
                                                className="flex items-center gap-3 rounded-[18px] px-4 py-3 transition-colors"
                                                style={{ color: '#4a1a8a', ...(isActive ? navActiveStyle : {}) }}
                                            >
                                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={iconWrapStyle}>
                                                    {renderIcon(item)}
                                                </span>
                                                <span className="text-sm font-semibold">{item.label}</span>
                                            </Link>
                                        )}

                                        <AnimatePresence>
                                            {hasChildren && isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.22 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="ml-16 mt-1 flex flex-col gap-0.5">
                                                        {(item.children ?? []).map((child) => {
                                                            const isChildActive = forcedActiveChildId ? child.id === forcedActiveChildId : isChildPathMatch(pathname, child.matchIncludes);
                                                            return (
                                                                <Link
                                                                    key={child.id}
                                                                    href={child.href}
                                                                    onClick={() => {
                                                                        setHoveredItemId(null);
                                                                        handleNavigate();
                                                                    }}
                                                                    className="flex items-center rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors"
                                                                    style={{ color: '#4a1a8a', ...(isChildActive ? navActiveStyle : {}) }}
                                                                >
                                                                    {child.label}
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </nav>

                        {/* Logout */}
                        <div className="pt-4">
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                suppressHydrationWarning
                                className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-medium transition"
                                style={{ color: '#b13bff' }}
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={iconWrapStyle}>
                                    <LogoutIcon />
                                </span>
                                <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                            </button>
                        </div>
                    </div>
                </motion.aside>
            </>
        );
    }

    /* ── Desktop sidebar ─────────────────────────────────────── */
    return (
        <motion.aside
            className="sticky top-0 z-20 hidden h-[100dvh] flex-shrink-0 overflow-hidden px-4 py-4 lg:flex"
            initial={false}
            animate={{ width: isHovered ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex h-full w-full flex-col items-center overflow-hidden rounded-[28px] px-2 py-5" style={panelStyle}>
                {/* Logo */}
                <div className="mb-4 flex w-full shrink-0 items-center justify-center px-1 pt-1">
                    <Link href="/admindashboard" aria-label="Dashboard Home" onClick={handleNavigate}>
                        <Image src="/images/logo.svg" alt="CMS E-commerce" width={48} height={48} className="h-9 w-auto max-w-[48px] object-contain" />
                    </Link>
                </div>

                {/* Nav items */}
                <nav className="mt-[50px] flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
                    {ADMIN_NAV_ITEMS.map((item) => {
                        const isActive = activeItem === item.id;
                        const hasChildren = !!(item.children?.length);
                        const isOpen = hoveredItemId === item.id || (!!forcedActiveChildId && item.id === activeItem);

                        return (
                            <div
                                key={item.id}
                                className="w-full shrink-0"
                                onMouseEnter={() => hasChildren ? handleNavItemMouseEnter(item.id) : undefined}
                                onMouseLeave={() => hasChildren ? handleNavItemMouseLeave(item.id) : undefined}
                            >
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        aria-label={item.label}
                                        suppressHydrationWarning
                                        className="group relative flex w-full items-center rounded-2xl px-2 py-2 transition-colors"
                                        style={{ color: '#4a1a8a', ...(isActive ? navActiveStyle : {}) }}
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={iconWrapStyle}>
                                            {renderIcon(item)}
                                        </span>
                                        <span
                                            className={`ml-3 flex-1 whitespace-nowrap text-left text-sm font-semibold transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                                            style={{ color: '#4a1a8a', ...navLabelStyle }}
                                            onMouseEnter={handleLabelMouseEnter}
                                            onMouseLeave={handleLabelMouseLeave}
                                        >
                                            {item.label}
                                        </span>
                                        <span className={`mr-1 transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'}`} style={{ color: '#4a1a8a' }}>
                                            <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200${isOpen ? ' rotate-180' : ''}`} />
                                        </span>
                                        {isActive && (
                                            <span
                                                className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-opacity duration-100 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
                                                style={{ background: '#f5c000' }}
                                            />
                                        )}
                                    </button>
                                ) : (
                                    <Link
                                        href={item.href}
                                        aria-label={item.label}
                                        onClick={handleNavigate}
                                        className="group relative flex w-full items-center rounded-2xl px-2 py-2 transition-colors"
                                        style={{ color: '#4a1a8a', ...(isActive ? navActiveStyle : {}) }}
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={iconWrapStyle}>
                                            {renderIcon(item)}
                                        </span>
                                        <span
                                            className={`ml-3 whitespace-nowrap text-sm font-semibold transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                                            style={{ color: '#4a1a8a', ...navLabelStyle }}
                                            onMouseEnter={handleLabelMouseEnter}
                                            onMouseLeave={handleLabelMouseLeave}
                                        >
                                            {item.label}
                                        </span>
                                        {isActive && (
                                            <span
                                                className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-opacity duration-100 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
                                                style={{ background: '#f5c000' }}
                                            />
                                        )}
                                    </Link>
                                )}

                                {/* Hover-driven animated dropdown */}
                                <AnimatePresence>
                                    {hasChildren && isOpen && isHovered && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-1 flex flex-col gap-0.5 pl-14">
                                                {(item.children ?? []).map((child) => {
                                                    const isChildActive = forcedActiveChildId
                                                        ? child.id === forcedActiveChildId
                                                        : isChildPathMatch(pathname, child.matchIncludes);
                                                    return (
                                                        <Link
                                                            key={child.id}
                                                            href={child.href}
                                                            onClick={handleNavigate}
                                                            onMouseEnter={handleChildMouseEnter}
                                                            onMouseLeave={handleChildMouseLeave}
                                                            className="flex items-center rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors"
                                                            style={{ color: '#4a1a8a', ...(isChildActive ? navActiveStyle : {}) }}
                                                        >
                                                            <span className="child-label" style={childLabelStyle}>
                                                                {child.label}
                                                            </span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </nav>

                {/* Logout */}
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    suppressHydrationWarning
                    className="mt-auto flex w-full shrink-0 items-center justify-start overflow-hidden rounded-2xl px-2 py-2 transition"
                    style={{ color: '#b13bff' }}
                    aria-label="Log out"
                    title="Log out"
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={iconWrapStyle}>
                        <LogoutIcon />
                    </span>
                    <span
                        className={`ml-3 whitespace-nowrap text-sm font-semibold transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                        aria-hidden={!isHovered}
                        style={{ color: '#b13bff', ...navLabelStyle }}
                        onMouseEnter={handleLabelMouseEnter}
                        onMouseLeave={handleLabelMouseLeave}
                    >
                        {isLoggingOut ? 'Logging out...' : 'Log out'}
                    </span>
                </button>
            </div>
        </motion.aside>
    );
}