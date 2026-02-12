'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const SearchIcon = () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ pointerEvents: 'none' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const BellIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ pointerEvents: 'none' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const ProfileIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ pointerEvents: 'none' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export function AdminHeader() {
    const router = useRouter();

    const handleProfileClick = () => {
        router.push('/admindashboard/userAccount');
    };

    const handleNotificationsClick = () => {
        router.push('/admindashboard/notifications');
    };

    return (
        <header className="sticky flex top-0 z-40 bg-black text-white border-b border-gray-800" suppressHydrationWarning>
            <div className="w-full px-6 py-3 flex items-center gap-4" suppressHydrationWarning>
                {/* Left: Search */}
                <div className="max-w-sm">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full pl-4 pr-10 py-2 bg-white text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="off"
                            suppressHydrationWarning
                            style={{ pointerEvents: 'auto' }}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <SearchIcon />
                        </div>
                    </div>
                </div>

                {/* Right: Icons */}
                <div className="flex items-center justify-end gap-2 ml-auto">
                    <button
                        type="button"
                        onClick={handleNotificationsClick}
                        className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="Notifications"
                        suppressHydrationWarning
                        style={{ pointerEvents: 'auto' }}
                    >
                        <BellIcon />
                    </button>

                    <button
                        type="button"
                        onClick={handleProfileClick}
                        className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                        aria-label="Profile"
                        suppressHydrationWarning
                        style={{ pointerEvents: 'auto' }}
                    >
                        <ProfileIcon />
                    </button>
                </div>
            </div>
        </header>
    );
}

//removed settings icon and added it to account page