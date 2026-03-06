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
    const { selectedProject, projects, loading: projectLoading } = useProject();
    const router = useRouter();
    const pathname = usePathname();
    const { colors } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const contentScrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/');
        }
    }, [loading, user, router]);

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
            <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(180deg, ${colors.bg.primary} 0%, ${colors.bg.primaryEnd} 100%)`, color: colors.text.primary }}>
                <p style={{ color: colors.text.muted }}>Loading...</p>
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

            {/* Main content area - ref: deep indigo/purple gradient (Color Palette) */}
            <div
                ref={contentScrollRef}
                className="no-scrollbar flex min-w-0 flex-1 basis-0 flex-col h-screen overflow-y-auto overflow-x-hidden"
                style={{ background: `linear-gradient(180deg, ${colors.bg.primary} 0%, ${colors.bg.primaryEnd} 100%)` }}
            >
                <div className="sticky top-0 z-50 shrink-0 bg-transparent">
                    <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} />
                </div>
                <main className="flex-1 min-w-0 max-w-full overflow-x-hidden px-4 sm:px-6 pt-5 sm:pt-7 pb-4 sm:pb-6">
                    {children}
                </main>
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
