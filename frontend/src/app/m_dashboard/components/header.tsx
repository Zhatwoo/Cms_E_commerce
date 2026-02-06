'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, type User } from '@/lib/api';

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
    user: User | null;
    onMenuToggle: () => void;
};

export function DashboardHeader({ user, onMenuToggle }: DashboardHeaderProps) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const userName = user?.name || user?.email || '';

    const handleLogout = async () => {
        await logout();
        setShowMenu(false);
        router.push('/auth/login');
        router.refresh();
    };

    return (
        <header className="border-b border-white/20 backdrop-blur-xl bg-black/25 sticky top-0 z-20">
            <div className="flex items-center justify-between px-6 py-4">
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

                <div className="flex-1" />

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/10 rounded-lg backdrop-blur-sm"
                        aria-label="Notifications"
                    >
                        <BellIcon />
                    </button>

                    <div className="relative flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-white">{userName || 'User'}</p>
                            <p className="text-xs text-gray-400">Website Owner</p>
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowMenu((v) => !v)}
                                className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-gray-300 shadow-lg hover:bg-white/20 transition-colors"
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
                                    <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/20 bg-[#0a0d14] py-1 shadow-xl z-20">
                                        <Link
                                            href="/m_dashboard/profile"
                                            className="block px-4 py-2 text-sm text-white hover:bg-white/10"
                                            onClick={() => setShowMenu(false)}
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10"
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