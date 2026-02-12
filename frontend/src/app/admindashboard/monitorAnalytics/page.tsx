'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import PlatformTraffic from './components/PlatformTraffic';
import RevenueGrowth from './components/RevenueGrowth';
import SubscriptionDistribution from './components/SubscriptionDistribution';

const ChevronRightIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 16, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1 },
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.06,
        },
    },
};

export default function MonitoringAnalyticsPage() {
    const [activeTab, setActiveTab] = useState('platform');

    const tabNames: Record<string, string> = {
        platform: 'Platform Traffic',
        engagement: 'Revenue Growth',
        trends: 'Subscription Distribution',
    };

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
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    <div className="p-8 space-y-8">
                {/* Header Section */}
                <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
                >
                    <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                        Monitoring and Analytics
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Monitoring & Analytics</span>
                        <ChevronRightIcon />
                        <span className="text-slate-700">{tabNames[activeTab]}</span>
                    </div>
                </motion.div>

                {/* Stats Cards Row */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {[
                        { label: 'Daily Active Users', value: '3,000', change: '+5.2% today' },
                        { label: 'Revenue', value: '1,247', change: '+12.8% this week' },
                        { label: 'Published Websites', value: '89', change: '+2.4% vs last week' },
                    ].map((card) => (
                        <motion.div
                            key={card.label}
                            className="relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)]"
                            variants={cardVariants}
                            whileHover={{ y: -4, scale: 1.01 }}
                            transition={{
                                duration: 0.38,
                                ease: [0.23, 0.82, 0.25, 1],
                                type: 'spring',
                                stiffness: 260,
                                damping: 24,
                            }}
                        >
                            <div className="relative space-y-2">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em]">
                                    {card.label}
                                </p>
                                <p className="text-3xl font-semibold text-slate-900">{card.value}</p>
                                <p className="text-xs text-slate-500">{card.change}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Main Content */}
                <motion.div
                    className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)] overflow-hidden"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.32, ease: [0.22, 0.84, 0.25, 1] }}
                >
                    {/* Tabs */}
                    <div className="border-b border-slate-200">
                        <div className="flex gap-8 px-6 pt-6">
                            {[
                                { id: 'platform', label: 'Platform Traffic' },
                                { id: 'engagement', label: 'Revenue Growth' },
                                { id: 'trends', label: 'Subscription Distribution' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                            {/* Content Section */}
                            <div className="p-6">
                                {/* Platform Traffic Tab */}
                                {activeTab === 'platform' && <PlatformTraffic />}

                                {/* Revenue Growth Tab */}
                                {activeTab === 'engagement' && <RevenueGrowth />}

                                {/* Subscription Distribution Tab */}
                                {activeTab === 'trends' && <SubscriptionDistribution />}
                            </div>
                        </motion.div>

                        {/* Workspace Statistics */}
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.48, ease: [0.22, 0.84, 0.25, 1] }}
                        >
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)] p-8">
                                <h3 className="text-lg font-semibold text-slate-900 mb-6">Workspace Statistics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Total Projects', value: '4,500' },
                                        { label: 'Draft Sites', value: '1,200' },
                                        { label: 'Custom Domains', value: '830' },
                                        { label: 'Avg Sites/User', value: '2.1' },
                                    ].map((stat, idx) => (
                                        <motion.div
                                            key={stat.label}
                                            className="flex flex-col border-l-4 border-blue-500 pl-4"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, delay: 0.5 + 0.05 * idx }}
                                        >
                                            <p className="text-sm text-slate-600 font-medium mb-1">{stat.label}</p>
                                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Workspace Statistics */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.48, ease: [0.22, 0.84, 0.25, 1] }}
                >
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)] p-8">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Workspace Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Projects', value: '4,500' },
                                { label: 'Draft Sites', value: '1,200' },
                                { label: 'Custom Domains', value: '830' },
                                { label: 'Avg Sites/User', value: '2.1' },
                            ].map((stat, idx) => (
                                <motion.div
                                    key={stat.label}
                                    className="flex flex-col border-l-4 border-blue-500 pl-4"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: 0.5 + 0.05 * idx }}
                                >
                                    <p className="text-sm text-slate-600 font-medium mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
            </div>
        </div>
    );
}
//hatdog

