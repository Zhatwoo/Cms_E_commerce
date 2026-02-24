'use client';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardSidebar } from './components/layout/sidebar';
import { DashboardHeader } from './components/layout/header';
import { ThemeProvider, useTheme } from './components/context/theme-context';
import { AuthProvider, useAuth } from './components/context/auth-context';
import { AlertProvider } from './components/context/alert-context';
import { ProjectProvider, useProject } from './components/context/project-context';

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const { selectedProject } = useProject();
    const router = useRouter();
    const pathname = usePathname();
    const { colors } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const contentScrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth/login');
        }
    }, [loading, user, router]);

    // If user is authenticated but no website/instance is selected yet,
    // send them to the main dashboard page to choose a website first,
    // but allow access to builder/domains so they can create their first site.
    useEffect(() => {
        if (!loading && user && !selectedProject) {
            const isDashboardRoot = pathname === '/m_dashboard';
            const isBuilder = pathname.startsWith('/m_dashboard/web-builder');
            const isDomains = pathname.startsWith('/m_dashboard/domains');
            const isInDashboard = pathname.startsWith('/m_dashboard');
            if (isInDashboard && !isDashboardRoot && !isBuilder && !isDomains) {
                router.replace('/m_dashboard');
            }
        }
    }, [loading, user, selectedProject, pathname, router]);

    useEffect(() => {
        if (pathname === '/m_dashboard') {
            contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [pathname]);

    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        const prevHtmlOverflow = html.style.getPropertyValue('overflow');
        const prevHtmlPriority = html.style.getPropertyPriority('overflow');
        const prevBodyOverflow = body.style.getPropertyValue('overflow');
        const prevBodyPriority = body.style.getPropertyPriority('overflow');

        html.style.setProperty('overflow', 'hidden', 'important');
        body.style.setProperty('overflow', 'hidden', 'important');

        return () => {
            if (prevHtmlOverflow) {
                html.style.setProperty('overflow', prevHtmlOverflow, prevHtmlPriority || undefined);
            } else {
                html.style.removeProperty('overflow');
            }

            if (prevBodyOverflow) {
                body.style.setProperty('overflow', prevBodyOverflow, prevBodyPriority || undefined);
            } else {
                body.style.removeProperty('overflow');
            }
        };
    }, []);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
                <p className="text-white/70">Loading...</p>
            </div>
        );
    }

    return (
        <div
            className="m-dashboard-shell h-screen w-full max-w-full flex overflow-hidden transition-colors duration-300"
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
            <div className="hidden lg:flex lg:shrink-0">
                <DashboardSidebar />
            </div>

            {/* Main content area */}
            <div ref={contentScrollRef} className="no-scrollbar flex min-w-0 flex-1 basis-0 flex-col h-screen overflow-y-auto overflow-x-hidden">
                <div className="sticky top-0 z-50 shrink-0" style={{ backgroundColor: colors.bg.primary }}>
                    <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} />
                </div>
                <main className="flex-1 min-w-0 max-w-full overflow-x-hidden px-4 sm:px-6 pt-5 sm:pt-7 pb-4 sm:pb-6">
                    {children}
                </main>
                <footer className="py-4 text-xs shrink-0 flex justify-center transition-colors duration-300" style={{ color: colors.text.muted }}>
                    Thanks for using our platform ✨
                </footer>
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
                    <ProjectProvider>
                        <DashboardLayoutContent>{children}</DashboardLayoutContent>
                    </ProjectProvider>
                </AuthProvider>
            </AlertProvider>
        </ThemeProvider>
    );
}
