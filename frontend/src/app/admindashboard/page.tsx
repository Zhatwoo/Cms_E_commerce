'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './components/sidebar';
import { AdminHeader } from './components/header';
import { AdminDashboard } from './components/dashboard';
import { AnimatePresence } from 'framer-motion';

export default function AdminDashboardPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 flex" suppressHydrationWarning>
            {/* Desktop Sidebar */}
            <AdminSidebar />

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <div className="lg:hidden">
                        <AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                <AdminHeader />
                <AdminDashboard />
            </div>
        </div>
    );
}
