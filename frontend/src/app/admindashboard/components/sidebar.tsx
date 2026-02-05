'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
    { id: 'monitoring', label: 'Monitoring & Analytics', icon: <MonitoringIcon /> },
    { id: 'website', label: 'Website Management', icon: <WebsiteIcon /> },
    { id: 'moderation', label: 'Moderation & Compliance', icon: <ModerationIcon />, href: '/admindashboard/moderationCompliance' },
    { id: 'templates', label: 'Templates & Assets Management', icon: <TemplatesIcon /> },
    { id: 'user', label: 'User & Account Management', icon: <UserIcon /> },
];

interface AdminSidebarProps {
    mobile?: boolean;
    onClose?: () => void;
}

export function AdminSidebar({ mobile = false, onClose }: AdminSidebarProps) {
    const [moreExpanded, setMoreExpanded] = useState(false);
    const pathname = usePathname();

    const getActiveItem = () => {
        if (pathname.includes('moderationCompliance')) return 'moderation';
        if (pathname.includes('admindashboard') && !pathname.includes('moderationCompliance')) return 'dashboard';
        return 'dashboard';
    };

    // For mobile → keep full drawer
    if (mobile) {
        return (
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-black text-white h-full flex flex-col">
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
            </aside>
        );
    }

    // Desktop version
    return (
        <aside className="w-64 bg-black text-white h-screen flex flex-col sticky top-0">
            {/* Logo */}
            <div className="flex items-center px-6 py-4 border-b border-gray-800">
                <div className="text-base font-semibold">Web Builder</div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                {navItems.map((item) =>
                    item.href ? (
                        <Link
                            key={item.id}
                            href={item.href}
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
        </aside>
    );
}
