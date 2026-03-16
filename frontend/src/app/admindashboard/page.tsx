'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';

const AdminSidebar = dynamic(() => import('./components/sidebar').then((mod) => mod.AdminSidebar), { ssr: false });
const AdminHeader = dynamic(() => import('./components/header').then((mod) => mod.AdminHeader), { ssr: false });
const AdminDashboard = dynamic(() => import('./components/dashboard').then((mod) => mod.AdminDashboard), { ssr: false });

export default function AdminDashboardPage() {
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

                <div className="flex min-h-screen flex-1 flex-col">
                    <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                    <div className="flex-1">
                        <AdminDashboard />
                    </div>
                </div>
            </div>
        </div>
    );
}
