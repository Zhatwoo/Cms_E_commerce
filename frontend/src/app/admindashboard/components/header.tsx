'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const SearchIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

type AdminHeaderProps = {
    onMenuClick?: () => void;
};

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    const router = useRouter();

    const handleProfileClick = () => {
        router.push('/admindashboard/userAccount/profile');
    };

    const handleNotificationsClick = () => {
        router.push('/admindashboard/notifications');
    };

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

                    <div className="w-full max-w-[23rem] sm:max-w-[24rem]">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search"
                                suppressHydrationWarning
                                className="admin-dashboard-input admin-dashboard-panel-soft admin-dashboard-soft-text h-12 w-full rounded-2xl border-0 pl-12 pr-4 text-sm font-medium outline-none placeholder:opacity-100"
                            />
                            <div className="admin-dashboard-yellow pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                                <SearchIcon />
                            </div>
                        </div>
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