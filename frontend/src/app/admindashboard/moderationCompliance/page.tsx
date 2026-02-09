'use client';

import React, { useState } from 'react';
import ModerationCompliance from '../components/moderationCompliance';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import { AnimatePresence } from 'framer-motion';

export default function ModerationCompliancePage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 flex">
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
                <div className="flex-1 p-8 bg-gray-100 overflow-auto">
                    <ModerationCompliance />
                </div>
            </div>
        </div>
    );
}

