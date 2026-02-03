'use client';
import React, { useState } from 'react';
import { DashboardSidebar } from './components/sidebar';
import { DashboardHeader } from './components/header';
import { DashboardContent } from './components/dashboard';

export default function MDashboardPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex">
            {/* Mobile sidebar drawer */}
            <div
                className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
                    className={`absolute inset-y-0 left-0 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <DashboardSidebar mobile onClose={() => setSidebarOpen(false)} />
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:block">
                <DashboardSidebar />
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-screen">
                <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} />
                <DashboardContent />
            </div>
        </div>
    );
}