'use client';
import React from 'react';

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

type DashboardHeaderProps = {
    onMenuToggle: () => void;
};

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
    return (
        <header className="border-b border-white/20 backdrop-blur-xl bg-black/25 sticky top-0 z-20">
            <div className="flex items-center justify-between px-6 py-4">
                {/* Left: only mobile menu button */}
                <div className="flex items-center">
                    <button
                        type="button"
                        className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        onClick={onMenuToggle}
                        aria-label="Open menu"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Center: empty on purpose (or future title/breadcrumb) */}
                <div className="flex-1" />

                {/* Right: notifications + profile – always here */}
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/10 rounded-lg backdrop-blur-sm"
                        aria-label="Notifications"
                    >
                        <BellIcon />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block"> {/* hide name on very small screens if you want */}
                            <p className="text-sm font-medium text-white">Juan Dela Cruz</p>
                            <p className="text-xs text-gray-400">Website Owner</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-gray-300 shadow-lg">
                            <UserIcon />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}