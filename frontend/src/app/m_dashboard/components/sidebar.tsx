'use client';
import React from 'react';

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
    href?: string; // optional – prepare for <Link> later
    active?: boolean;
};

const navItems: SidebarItem[] = [
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'web-builder', label: 'Web Builder', icon: <WebBuilderIcon /> },
    { id: 'templates', label: 'Templates', icon: <TemplatesIcon /> },
    { id: 'domains', label: 'Domains', icon: <DomainsIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon />, href: '/settings' },
];

type DashboardSidebarProps = {
    mobile?: boolean;
    onClose?: () => void;
    // You can later pass currentPath or activeId from parent / usePathname
    activeId?: string;
};

export function DashboardSidebar({ mobile = false, onClose, activeId }: DashboardSidebarProps) {
    return (
        <aside
            className={`
            ${mobile
                    ? 'fixed inset-y-0 left-0 z-50 w-72 bg-black/90 border-r border-gray-800 shadow-2xl'
                    : 'hidden lg:flex lg:flex-col lg:w-72 lg:shrink-0 lg:border-r lg:border-gray-800 lg:bg-black/50 lg:backdrop-blur-xl lg:shadow-inner lg:h-screen lg:sticky lg:top-0'
                }
            text-gray-100
          `}
        >
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gray-700 flex items-center justify-center font-bold text-gray-200 shadow-md">
                        CMD
                    </div>
                    <span className="text-xl font-semibold tracking-tight text-gray-100">CallMeDaddy</span>
                </div>

                {mobile && (
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500/40"
                        aria-label="Close sidebar"
                    >
                        <CloseIcon />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 flex flex-col">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = activeId ? item.id === activeId : false;

                        return (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className={`
                      group relative flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all
                      ${isActive
                                            ? 'bg-gray-800/50 text-gray-100 border-l-4 border-gray-400'
                                            : 'text-gray-400 hover:bg-gray-800/30 hover:text-gray-200 focus:bg-gray-700/40 focus:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500/40'
                                        }
                    `}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <span
                                        className={`flex h-5 w-5 items-center justify-center transition-colors ${isActive ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-300'
                                            }`}
                                    >
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>

                                    {isActive && (
                                        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gray-400" />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {!mobile && (
                <div className="border-t border-gray-800 px-6 py-4 text-xs text-gray-600">
                    v1.0.0 • © 2026
                </div>
            )}
        </aside>
    );
}