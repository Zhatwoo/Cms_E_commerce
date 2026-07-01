'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';

const AdminSidebar = dynamic(() => import('./sidebar'), { ssr: false }) as any;
const AdminHeader = dynamic(() => import('./header'), { ssr: false }) as any;
const AdminDashboard = dynamic(() => import('./dashboard'), { ssr: false }) as any;


export default function MainDashboardPageContent() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="admin-dashboard-shell relative flex min-h-screen overflow-hidden" suppressHydrationWarning>
            <div className="relative z-10 flex min-h-screen w-full">
                <AdminSidebar />

                <AnimatePresence>
                    {sidebarOpen && (
                        <div className="lg:hidden">
                            <AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
                        </div>
                    )}
                </AnimatePresence>

                <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
                    <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                    <AdminDashboard />
                </div>
            </div>
        </div>
    );
}
