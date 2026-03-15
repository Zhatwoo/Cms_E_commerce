'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './components/sidebar';
import { AdminHeader } from './components/header';
import { AdminDashboard } from './components/dashboard';
import { AnimatePresence } from 'framer-motion';

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
