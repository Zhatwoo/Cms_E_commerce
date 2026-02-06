'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const MonitoringIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const WebsiteIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const ModerationIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const TemplatesIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);

const MoreIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const LogoutIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, href: '/admindashboard' },
    { id: 'monitoring', label: 'Monitoring & Analytics', icon: <MonitoringIcon />, href: '/admindashboard/monitorAnalytics' },
    { id: 'website', label: 'User & Website Management', icon: <WebsiteIcon />, href: '/admindashboard/usernweb' },
    { id: 'moderation', label: 'Moderation & Compliance', icon: <ModerationIcon />, href: '/admindashboard/moderationCompliance' },
    { id: 'templates', label: 'Templates & Assets Management', icon: <TemplatesIcon />, href: '/admindashboard/templatesnassets' },
];

interface AdminSidebarProps {
    mobile?: boolean;
    onClose?: () => void;
}

export function AdminSidebar({ mobile = false, onClose }: AdminSidebarProps) {
    const [moreExpanded, setMoreExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const pathname = usePathname();

    const COLLAPSED_WIDTH = 72;
    const EXPANDED_WIDTH = 320;

    const getActiveItem = () => {
        if (pathname.includes('monitorAnalytics')) return 'monitoring';
        if (pathname.includes('moderationCompliance')) return 'moderation';
        if (pathname.includes('usernweb')) return 'website';
        if (pathname.includes('templatesnassets')) return 'templates';
        if (pathname.includes('admindashboard') && !pathname.includes('moderationCompliance') && !pathname.includes('usernweb') && !pathname.includes('templatesnassets')) return 'dashboard';
        return 'dashboard';
    };

    // For mobile → keep full drawer
    if (mobile) {
        return (
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/50 z-40"
                />
                
                {/* Sidebar */}
                <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed inset-y-0 left-0 z-50 w-64 bg-black text-white h-full flex flex-col"
                    suppressHydrationWarning
                >
                {/* Mobile header with close */}
                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="text-base font-semibold">Web Builder</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                        aria-label="Close sidebar"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                    {navItems.map((item) =>
                        item.href ? (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => {
                                    onClose?.();
                                }}
                                className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-sm transition-colors mb-1 ${
                                    getActiveItem() === item.id
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                            >
                                <span className="flex-shrink-0 mt-0.5">{item.icon}</span>
                                <span className="font-normal text-left leading-tight">{item.label}</span>
                            </Link>
                        ) : (
                            <button
                                key={item.id}
                                onClick={() => {}}
                                className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-sm transition-colors mb-1 ${
                                    getActiveItem() === item.id
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                            >
                                <span className="flex-shrink-0 mt-0.5">{item.icon}</span>
                                <span className="font-normal text-left leading-tight">{item.label}</span>
                            </button>
                        )
                    )}

                    {/* More dropdown */}
                    <div className="mt-1">
                        <button
                            onClick={() => setMoreExpanded(!moreExpanded)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 mt-0.5">
                                    <MoreIcon />
                                </span>
                                <span className="font-normal text-left">More</span>
                            </div>
                            <ChevronDownIcon />
                        </button>
                    </div>
                </nav>

                {/* Log out */}
                <div className="border-t border-gray-800 p-3">
                    <button className="w-full flex items-start gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                        <span className="flex-shrink-0 mt-0.5">
                            <LogoutIcon />
                        </span>
                        <span className="font-normal text-left">Log out</span>
                    </button>
                </div>
            </motion.aside>
            </>
        );
    }

    // Desktop: hover-expand version
    return (
        <motion.aside
            className="hidden lg:flex lg:flex-col lg:border-r lg:border-gray-800 lg:bg-black lg:shadow-inner lg:h-screen lg:sticky lg:top-0 overflow-hidden text-white z-20"
            initial={false}
            animate={{ width: isHovered ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 28,
                mass: 0.8,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            suppressHydrationWarning
        >
            {/* Brand header */}
            <div className="flex items-center justify-center border-b border-gray-800 py-5 shrink-0">
                <div className="h-9 w-9 rounded-xl bg-gray-700 flex items-center justify-center font-bold text-gray-200 shadow-md">
                    W
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 flex flex-col" suppressHydrationWarning>
                {navItems.map((item) => {
                    const isActive = getActiveItem() === item.id;
                    
                    const content = (
                        <div className={`
                            group relative flex items-center rounded-lg transition-colors
                            w-full px-4 py-3
                            ${
                                isActive
                                    ? 'bg-gray-800/70 text-white'
                                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                            }
                        `}>
                            {/* Fixed icon position */}
                            <div className="w-12 flex items-center justify-center shrink-0">
                                <span className="flex h-5 w-5 items-center justify-center text-gray-400 group-hover:text-gray-200 transition-colors">
                                    {item.icon}
                                </span>
                            </div>

                            {/* Label slide-in */}
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -12 }}
                                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                        className="ml-3 text-sm font-medium whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Active indicator when collapsed */}
                            {isActive && !isHovered && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
                            )}
                        </div>
                    );

                    return item.href ? (
                        <Link key={item.id} href={item.href}>
                            {content}
                        </Link>
                    ) : (
                        <button key={item.id} type="button" className="w-full text-left">
                            {content}
                        </button>
                    );
                })}

                {/* More button */}
                <button
                    type="button"
                    className="group relative flex items-center rounded-lg transition-colors w-full px-4 py-3 text-gray-300 hover:bg-gray-800/50 hover:text-white"
                    suppressHydrationWarning
                >
                    <div className="w-12 flex items-center justify-center shrink-0">
                        <span className="flex h-5 w-5 items-center justify-center text-gray-400 group-hover:text-gray-200 transition-colors">
                            <MoreIcon />
                        </span>
                    </div>
                    <AnimatePresence>
                        {isHovered && (
                            <motion.span
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                className="ml-3 text-sm font-medium whitespace-nowrap"
                            >
                                More
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </nav>

            {/* Log out */}
            <div className="border-t border-gray-800 py-4 shrink-0">
                <button
                    type="button"
                    className="group relative flex items-center rounded-lg transition-colors w-full px-4 py-3 text-gray-300 hover:bg-gray-800/50 hover:text-white"
                    suppressHydrationWarning
                >
                    <div className="w-12 flex items-center justify-center shrink-0">
                        <span className="flex h-5 w-5 items-center justify-center text-gray-400 group-hover:text-gray-200 transition-colors">
                            <LogoutIcon />
                        </span>
                    </div>
                    <AnimatePresence>
                        {isHovered && (
                            <motion.span
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                className="ml-3 text-sm font-medium whitespace-nowrap"
                            >
                                Log out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.aside>
    );
}
