'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from './components/layout/sidebar';
import { DashboardHeader } from './components/layout/header';
import { ThemeProvider, useTheme } from './components/context/theme-context';
import { AuthProvider, useAuth } from './components/context/auth-context';
import { AlertProvider } from './components/context/alert-context';

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { colors } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth/login');
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
                <p className="text-white/70">Loading...</p>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex transition-colors duration-300"
            style={{ backgroundColor: colors.bg.primary, color: colors.text.primary }}
        >
            {/* Mobile sidebar drawer */}
            <div
                className={`fixed inset-0 z-40 lg:hidden transition-[opacity] ${sidebarOpen
                        ? 'opacity-100 duration-200 ease-out'
                        : 'opacity-0 duration-150 ease-in pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />

                {/* Sidebar panel */}
                <div
                    className={`absolute inset-y-0 left-0 w-64 will-change-transform transition-[transform] motion-reduce:transition-none ${sidebarOpen
                            ? 'translate-x-0 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'
                            : '-translate-x-full duration-300 ease-in'
                        }`}
                >
                    <DashboardSidebar mobile onClose={() => setSidebarOpen(false)} />
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:block">
                <DashboardSidebar />
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-screen">
                <div className="sticky top-0 z-50" style={{ backgroundColor: colors.bg.primary }}>
                    <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} />
                </div>
                <main className="flex-1 px-6 py-6 overflow-x-hidden min-w-0">{children}</main>
            </div>
        </div>
    );
}

export default function MDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider>
            <AlertProvider>
                <AuthProvider>
                    <DashboardLayoutContent>{children}</DashboardLayoutContent>
                </AuthProvider>
            </AlertProvider>
        </ThemeProvider>
    );
}
