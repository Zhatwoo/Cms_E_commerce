'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import { getAnalytics, type AnalyticsResponse } from '@/lib/api';
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [period, setPeriod] = useState<'7days' | '30days' | '3months'>('7days');
    const [analytics, setAnalytics] = useState<AnalyticsResponse['analytics'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAnalytics = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const res = await getAnalytics(period);
            if (res.success && res.analytics) setAnalytics(res.analytics);
            else setAnalytics(null);
        } catch (e) {
            if (!silent) {
                setError(e instanceof Error ? e.message : 'Failed to load analytics');
                setAnalytics(null);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [period]);

    useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

    useEffect(() => {
        // Auto-refresh analytics data every 30 seconds for real-time accuracy
        const interval = setInterval(() => {
            loadAnalytics(true);
        }, 30000);
        return () => clearInterval(interval);
    }, [loadAnalytics]);

    useEffect(() => {
        // Listen for real-time updates from other admins
        const handleUpdate = () => {
            console.log('[Analytics] Real-time notification received, refreshing data...');
            loadAnalytics(true);
        };
        window.addEventListener('notification:new_received', handleUpdate);
        return () => window.removeEventListener('notification:new_received', handleUpdate);
    }, [loadAnalytics]);

    const tabNames: Record<string, string> = {
        platform: 'Platform Traffic',
        engagement: 'Revenue Growth',
        trends: 'Subscription Distribution',
    };

    const summary = analytics?.summary;
    const workspace = analytics?.workspace;

    return (
        <div className="admin-dashboard-shell flex h-screen w-full overflow-hidden">
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
            <div className="flex min-h-0 flex-1 flex-col min-w-0">
                <AdminHeader />
                <main className="flex-1 min-h-0 overflow-y-auto w-full">
                    <div className="min-h-full space-y-8 px-8 pt-8 pb-32">
                {/* Header Section */}
                <motion.div
                    className="w-full space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
                >
                    <h1 className="mb-1 text-3xl font-bold text-[#B13BFF] sm:text-4xl">
                        Monitoring and Analytics
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-[#A78BFA]">
                        <span>Monitoring & Analytics</span>
                        <ChevronRightIcon />
                        <span className="font-semibold text-[#471396]">{tabNames[activeTab]}</span>
                    </div>
                </motion.div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
                )}

                {/* Stats Cards Row */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {[
                        { 
                            label: 'Active Users', 
                            value: loading ? '—' : (summary?.activeUsers ?? 0).toLocaleString(), 
                            change: (() => {
                                const pts = analytics?.trends?.users || [];
                                if (pts.length < 2) return '—';
                                const curr = pts[pts.length - 1];
                                const prev = pts[pts.length - 2] || 0;
                                if (prev === 0) return curr > 0 ? `+${curr} Growth` : '0% Change';
                                const pct = ((curr - prev) / prev) * 100;
                                return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% since last period`;
                            })()
                        },
                        { 
                            label: 'Revenue', 
                            value: loading ? '—' : (summary?.revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }), 
                            change: (() => {
                                const pts = analytics?.revenueOverTime?.data || [];
                                if (pts.length < 2) return '—';
                                const curr = pts[pts.length - 1];
                                const prev = pts[pts.length - 2] || 0;
                                if (prev === 0) return curr > 0 ? `+${curr.toLocaleString()} Growth` : '0% Change';
                                const pct = ((curr - prev) / prev) * 100;
                                return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% since last period`;
                            })()
                        },
                        { 
                            label: 'Published Websites', 
                            value: loading ? '—' : String(summary?.publishedWebsites ?? 0), 
                            change: (() => {
                                const pts = analytics?.trends?.websites || [];
                                if (pts.length < 2) return '—';
                                const curr = pts[pts.length - 1];
                                const prev = pts[pts.length - 2] || 0;
                                if (prev === 0) return curr > 0 ? `+${curr} Growth` : '0% Change';
                                const pct = ((curr - prev) / prev) * 100;
                                return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% since last period`;
                            })()
                        },
                    ].map((card) => (
                        <motion.div
                            key={card.label}
                            className="admin-dashboard-panel relative overflow-hidden rounded-2xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] p-6 shadow-sm"
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
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#471396]">
                                    {card.label}
                                </p>
                                <p className="text-5xl font-bold leading-none text-[#FFCC00]">{card.value}</p>
                                <p className="text-xs font-bold text-[#B13BFF]">{card.change}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Main Content */}
                <motion.div
                    className="admin-dashboard-panel w-full overflow-hidden rounded-2xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] shadow-sm"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.32, ease: [0.22, 0.84, 0.25, 1] }}
                >
                    {/* Tabs */}
                    <div className="border-b border-[rgba(177,59,255,0.29)]">
                        <div className="flex gap-8 px-6 pt-6">
                            {[
                                { id: 'platform', label: 'Platform Traffic' },
                                { id: 'engagement', label: 'Revenue Growth' },
                                { id: 'trends', label: 'Subscription Distribution' },
                            ].map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-[#FFCC00] text-[#471396]'
                                            : 'border-transparent text-[#471396]/80 hover:text-[#471396]'
                                    }`}
                                >
                                    {tab.label}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                            {/* Content Section */}
                            <div className="p-6">
                                {activeTab === 'platform' && (
                                    <PlatformTraffic
                                        period={period}
                                        onPeriodChange={setPeriod}
                                        signupsOverTime={analytics?.signupsOverTime}
                                        loading={loading}
                                    />
                                )}
                                {activeTab === 'engagement' && (
                                    <RevenueGrowth
                                        period={period}
                                        onPeriodChange={setPeriod}
                                        revenueOverTime={analytics?.revenueOverTime}
                                        loading={loading}
                                    />
                                )}
                                {activeTab === 'trends' && (
                                    <SubscriptionDistribution distribution={analytics?.subscriptionDistribution} loading={loading} />
                                )}
                            </div>
                        </motion.div>

                {/* Workspace Statistics */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.48, ease: [0.22, 0.84, 0.25, 1] }}
                    className="w-full"
                >
                    <div className="admin-dashboard-panel w-full rounded-2xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] p-8 shadow-sm">
                        <h3 className="mb-6 text-lg font-semibold text-[#471396]">Workspace Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Projects', value: loading ? '—' : String(workspace?.totalProjects ?? 0) },
                                { label: 'Draft Sites', value: loading ? '—' : String(workspace?.draftSites ?? 0) },
                                { label: 'Published Domains', value: loading ? '—' : String(workspace?.customDomains ?? 0) },
                                { label: 'Avg Sites/User', value: loading ? '—' : String(workspace?.avgSitesPerUser ?? '0') },
                            ].map((stat, idx) => (
                                <motion.div
                                    key={stat.label}
                                    className="flex flex-col border-l-2 border-[#FFCC00] pl-4"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: 0.5 + 0.05 * idx }}
                                >
                                    <p className="mb-1 text-sm font-medium text-[#471396]">{stat.label}</p>
                                    <p className="text-4xl font-bold leading-none text-[#B13BFF]">{stat.value}</p>
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

