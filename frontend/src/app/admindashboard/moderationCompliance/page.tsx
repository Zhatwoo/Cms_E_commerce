'use client';

import React, { useState } from 'react';
import ModerationCompliance from '../components/moderationCompliance';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';

export default function ModerationCompliancePage() {
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
                <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                <div className="flex-1 p-8 bg-gray-100 overflow-auto">
                    <ModerationCompliance />
                </div>
            </div>
        </div>
    );
}

