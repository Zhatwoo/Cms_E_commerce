'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg
        className={`h-4 w-4 transition-transform duration-200${isOpen ? ' rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

import { adminNavItems } from './adminConfig';

interface AdminSidebarProps {
    mobile?: boolean;
    onClose?: () => void;
}

export function AdminSidebar({ mobile = false, onClose }: AdminSidebarProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
    const pathname = usePathname();

    const toggleDropdown = (id: string) => {
        setOpenDropdowns((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
        );
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setOpenDropdowns([]);
    };

    const activeItem = adminNavItems.find(
        (item) => item.match(pathname) || (item.children?.some((c) => c.match(pathname)) ?? false)
    )?.id;
    const COLLAPSED_WIDTH = 104;
    const EXPANDED_WIDTH = 322;

    if (mobile) {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/50 z-40"
                />

                <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed inset-y-0 left-0 z-50 flex w-[18.5rem] flex-col px-4 py-4"
                >
                    <div className="admin-dashboard-panel flex h-full flex-col rounded-[28px] p-4">
                        <div className="px-2 pb-5 pt-1">
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={onClose}
                                    className="admin-dashboard-soft-text rounded-2xl p-2"
                                    aria-label="Close sidebar"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            <div className="mt-2 flex flex-col items-center text-center">
                                <Image src="/images/logo.svg" alt="CMS E-commerce" width={76} height={76} className="h-[76px] w-[76px] object-contain" />
                            </div>
                        </div>

                        <nav className="flex-1 space-y-1 overflow-y-auto">
                            {adminNavItems.map((item) => {
                                const isActive = activeItem === item.id;
                                const hasChildren = !!(item.children?.length);
                                const isOpen = openDropdowns.includes(item.id);

                                return (
                                    <div key={item.id}>
                                        {hasChildren ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleDropdown(item.id)}
                                                className={`admin-dashboard-purple flex w-full items-center gap-3 rounded-[18px] px-4 py-3 transition-transform hover:-translate-y-0.5 ${isActive ? 'admin-dashboard-nav-active' : ''}`.trim()}
                                            >
                                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/55">
                                                    <Image src={item.iconSrc} alt={item.iconAlt} width={20} height={20} className="h-5 w-5 object-contain" />
                                                </span>
                                                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                                                <ChevronDownIcon isOpen={isOpen} />
                                            </button>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                onClick={() => onClose?.()}
                                                className={`admin-dashboard-purple flex items-center gap-3 rounded-[18px] px-4 py-3 transition-transform hover:-translate-y-0.5 ${isActive ? 'admin-dashboard-nav-active' : ''}`.trim()}
                                            >
                                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/55">
                                                    <Image src={item.iconSrc} alt={item.iconAlt} width={20} height={20} className="h-5 w-5 object-contain" />
                                                </span>
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </Link>
                                        )}
                                        <AnimatePresence initial={false}>
                                            {hasChildren && isOpen ? (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.22 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-1 flex flex-col gap-0.5 pl-6">
                                                        {(item.children ?? []).map((child) => {
                                                            const isChildActive = child.match(pathname);
                                                            return (
                                                                <Link
                                                                    key={child.id}
                                                                    href={child.href}
                                                                    onClick={() => onClose?.()}
                                                                    className={`admin-dashboard-purple flex items-center rounded-[14px] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/30 ${isChildActive ? 'admin-dashboard-nav-active' : ''}`.trim()}
                                                                >
                                                                    {child.label}
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            ) : null}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </nav>

                        <div className="pt-4">
                            <button
                                type="button"
                                className="admin-dashboard-logout flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-medium"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/55">
                                    <LogoutIcon />
                                </span>
                                <span>Log out</span>
                            </button>
                        </div>
                    </div>
                </motion.aside>
            </>
        );
    }

    return (
        <motion.aside
            className="sticky top-0 z-20 hidden h-[100dvh] overflow-hidden px-4 py-4 lg:flex"
            initial={false}
            animate={{ width: isHovered ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
        >
            <div className="admin-dashboard-panel flex h-full w-full flex-col items-center overflow-hidden rounded-[28px] px-2 py-5">
                <div className="mb-4 flex w-full shrink-0 items-center justify-center px-1 pt-1">
                    <Link href="/admindashboard" aria-label="Dashboard Home">
                        <Image src="/images/logo.svg" alt="CMS E-commerce" width={56} height={56} className="h-14 w-14 object-contain" />
                    </Link>
                </div>

                <nav className="mt-[50px] flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
                    {adminNavItems.map((item) => {
                        const isActive = activeItem === item.id;
                        const hasChildren = !!(item.children?.length);
                        const isOpen = openDropdowns.includes(item.id);

                        return (
                            <div key={item.id} className="w-full shrink-0">
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        onClick={() => isHovered && toggleDropdown(item.id)}
                                        aria-label={item.label}
                                        className={`group relative flex w-full items-center rounded-2xl px-2 py-2 transition-transform hover:-translate-y-0.5 ${isActive ? 'admin-dashboard-nav-active' : ''}`.trim()}
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/55">
                                            <Image src={item.iconSrc} alt={item.iconAlt} width={20} height={20} className="h-5 w-5 object-contain" />
                                        </span>
                                        <span className={`admin-dashboard-purple ml-3 flex-1 whitespace-nowrap text-left text-sm font-semibold transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                                            {item.label}
                                        </span>
                                        <span className={`admin-dashboard-purple mr-1 transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                                            <ChevronDownIcon isOpen={isOpen} />
                                        </span>
                                        {isActive ? (
                                            <span className={`admin-dashboard-yellow-fill absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-opacity duration-100 ${isHovered ? 'opacity-0' : 'opacity-100'}`} />
                                        ) : null}
                                    </button>
                                ) : (
                                    <Link
                                        href={item.href}
                                        aria-label={item.label}
                                        className={`group relative flex w-full items-center rounded-2xl px-2 py-2 transition-transform hover:-translate-y-0.5 ${isActive ? 'admin-dashboard-nav-active' : ''}`.trim()}
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/55">
                                            <Image src={item.iconSrc} alt={item.iconAlt} width={20} height={20} className="h-5 w-5 object-contain" />
                                        </span>
                                        <span className={`admin-dashboard-purple ml-3 whitespace-nowrap text-sm font-semibold transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                                            {item.label}
                                        </span>
                                        {isActive ? (
                                            <span className={`admin-dashboard-yellow-fill absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-opacity duration-100 ${isHovered ? 'opacity-0' : 'opacity-100'}`} />
                                        ) : null}
                                    </Link>
                                )}
                                <AnimatePresence initial={false}>
                                    {hasChildren && isHovered && isOpen ? (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.22 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-1 flex flex-col gap-0.5 pl-4">
                                                {(item.children ?? []).map((child) => {
                                                    const isChildActive = child.match(pathname);
                                                    return (
                                                        <Link
                                                            key={child.id}
                                                            href={child.href}
                                                            className={`admin-dashboard-purple flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-white/30 ${isChildActive ? 'admin-dashboard-nav-active' : ''}`.trim()}
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </nav>

                <button
                    type="button"
                    className="admin-dashboard-logout mt-auto shrink-0 flex w-full items-center rounded-2xl px-2 py-2"
                    aria-label="Log out"
                    title="Log out"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/55">
                        <LogoutIcon />
                    </span>
                    <span className={`ml-3 whitespace-nowrap text-sm font-semibold transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        Log out
                    </span>
                </button>
            </div>
        </motion.aside>
    );
}
