'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './components/sidebar';
import { AdminHeader } from './components/header';
import { AdminDashboard } from './components/dashboard';

export default function AdminDashboardPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <AdminSidebar />
            </div>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="lg:hidden">
                        <AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
                    </div>
                </>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                <div className="fixed top-0 right-0 left-0 lg:left-64 z-30">
                    <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                </div>
                <div className="pt-[60px]">
                    <AdminDashboard />
                </div>
            </div>
        </div>
    );
}
