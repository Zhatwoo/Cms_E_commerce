'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HomeIcon = () => (
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
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const WebBuilderIcon = () => (
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
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

const TemplatesIcon = () => (
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
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="9" y1="9" x2="21" y2="9" />
    </svg>
);

const DomainsIcon = () => (
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
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const SettingsIcon = () => (
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
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
    </svg>
);

const CloseIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

type SidebarItem = {
    id: string;
    label: string;
    icon: React.ReactNode;
};

const navItems: SidebarItem[] = [
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'web-builder', label: 'Web Builder', icon: <WebBuilderIcon /> },
    { id: 'templates', label: 'Templates', icon: <TemplatesIcon /> },
    { id: 'domains', label: 'Domains', icon: <DomainsIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

type DashboardSidebarProps = {
    mobile?: boolean;
    onClose?: () => void;
};

export function DashboardSidebar({ mobile = false, onClose }: DashboardSidebarProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Widths — adjust to your taste
    const COLLAPSED_WIDTH = 72;   // icon-only
    const EXPANDED_WIDTH = 280;  // full labels

    // For mobile → keep full drawer (no hover behavior)
    if (mobile) {
        return (
            <aside
                className="fixed inset-y-0 left-0 z-50 w-72 bg-black/90 border-r border-gray-800 shadow-2xl h-full text-gray-100 flex flex-col"
            >

                {/* Mobile header with close */}
                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gray-700 flex items-center justify-center font-bold text-gray-200">
                            L
                        </div>
                        <span className="text-xl font-semibold text-gray-100">Lumapak</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-gray-200"
                        aria-label="Close sidebar"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-6 overflow-y-auto">
                    {/* Full labels for mobile */}
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800/40 hover:text-gray-100 transition-colors"
                        >
                            <span className="flex h-6 w-6 items-center justify-center text-gray-400">
                                {item.icon}
                            </span>
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
        );
    }

    // Desktop: hover-expand version
    return (
        <motion.aside
            className="hidden lg:flex lg:flex-col lg:border-r lg:border-gray-800 lg:bg-black/50 lg:backdrop-blur-xl lg:shadow-inner lg:h-screen lg:sticky lg:top-0 overflow-hidden text-gray-100"
            animate={{ width: isHovered ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
            transition={{
                duration: 0.48,
                ease: [0.34, 0.69, 0.1, 1.0], // smooth overshoot feel
                type: 'spring',
                stiffness: 200,
                damping: 25,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Brand header — always visible, centered icons when collapsed */}
            <div className="flex items-center justify-center border-b border-gray-800 py-5 shrink-0">
                <div className="h-9 w-9 rounded-xl bg-gray-700 flex items-center justify-center font-bold text-gray-200 shadow-md">
                    L
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 flex flex-col items-center">
                {navItems.map((item) => (
                    <motion.button
                        key={item.id}
                        className={`
                group relative flex items-center rounded-lg transition-colors
                ${isHovered ? 'w-full px-6 gap-4 justify-start' : 'w-12 h-12 justify-center'}
                py-3 text-gray-300 hover:bg-gray-800/40
            `}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="flex h-6 w-6 items-center justify-center text-gray-400 group-hover:text-gray-200 shrink-0">
                            {item.icon}
                        </span>

                        <AnimatePresence mode="wait">
                            {isHovered && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        duration: isHovered ? 0.24 : 0.14,
                                        ease: "easeOut",
                                    }}
                                    className="text-sm font-medium whitespace-nowrap ml-3"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                ))}
            </nav>

            {/* Optional bottom area */}
            <div className="border-t border-gray-800 py-4 text-xs text-gray-600 shrink-0 flex justify-center">
                v1.0
            </div>
        </motion.aside>

    );
}