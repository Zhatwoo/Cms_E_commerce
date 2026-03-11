'use client';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
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
    const [routeLoadingEnabled, setRouteLoadingEnabled] = useState(false);
    const [navigationStartPath, setNavigationStartPath] = useState<string | null>(null);
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

    const routeLoading = routeLoadingEnabled && navigationStartPath === pathname;
    const handleNavigateStart = () => {
        setNavigationStartPath(pathname);
        setRouteLoadingEnabled(true);
    };

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
                    <DashboardSidebar
                        mobile
                        onClose={() => setSidebarOpen(false)}
                        onNavigateStart={handleNavigateStart}
                    />
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:flex lg:shrink-0">
                <DashboardSidebar onNavigateStart={handleNavigateStart} />
            </div>

            {/* Main content area - ref: deep indigo/purple gradient (Color Palette) */}
            <div
                ref={contentScrollRef}
                className="no-scrollbar relative flex min-w-0 flex-1 basis-0 flex-col h-screen overflow-y-auto overflow-x-hidden"
                style={{ background: `linear-gradient(180deg, ${colors.bg.primary} 0%, ${colors.bg.primaryEnd} 100%)` }}
            >
                <div
                    className="pointer-events-none absolute inset-0 -z-0"
                    style={{
                        background: 'radial-gradient(62% 48% at 50% 38%, rgba(207, 152, 255, 0.2) 0%, rgba(94, 21, 205, 0.14) 38%, rgba(85, 40, 218, 0.06) 58%, rgba(85, 40, 218, 0) 76%)',
                    }}
                />

                <div className="sticky top-0 z-50 shrink-0 bg-transparent">
                    <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} />
                </div>
                <main className="relative z-10 flex-1 min-w-0 max-w-full overflow-x-hidden px-4 sm:px-6 pt-5 sm:pt-7 pb-4 sm:pb-6">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {routeLoading && (
                <div className="pointer-events-none fixed left-0 right-0 top-0 z-[120]">
                    <div className="h-[2px] w-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <motion.div
                            className="h-full"
                            initial={{ x: '-45%', width: '38%' }}
                            animate={{ x: '180%', width: '22%' }}
                            transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                            style={{ background: 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)' }}
                        />
                    </div>
                </div>
            )}
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
