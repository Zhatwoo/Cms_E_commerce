'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { getAnalytics, type AnalyticsResponse } from '@/lib/api';

const AdminSidebar = dynamic(() => import('../../components/sidebar'), { ssr: false });
const AdminHeader = dynamic(() => import('../../components/header'), { ssr: false });
const PlatformTraffic = dynamic(() => import('./PlatformTraffic'), { ssr: false }) as any;
const RevenueGrowth = dynamic(() => import('./RevenueGrowth'), { ssr: false }) as any;
const SubscriptionDistribution = dynamic(() => import('./SubscriptionDistribution'), { ssr: false }) as any;



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

export default function AnalyticsPageContent() {
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
        const interval = setInterval(() => {
            loadAnalytics(true);
        }, 30000);
        return () => clearInterval(interval);
    }, [loadAnalytics]);

    useEffect(() => {
        const handleUpdate = () => {
            console.log('[Analytics] Real-time notification received, refreshing data...');
            loadAnalytics(true);
        };
        window.addEventListener('admin:data_changed', handleUpdate);
        return () => window.removeEventListener('admin:data_changed', handleUpdate);
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

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 lg:p-10 scrollbar-hide">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="mx-auto max-w-7xl space-y-10"
                    >
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-4">
                            <div>
                                <h1 className="admin-dashboard-purple text-[2.75rem] font-bold tracking-tight leading-[1.05]">Monitoring & Analytics</h1>
                                <p className="admin-dashboard-soft-text mt-2 text-base max-w-xl font-medium">Real-time performance metrics and user behavior insights for all websites.</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[#471396] font-bold bg-[#F5F4FF] px-5 py-3 rounded-2xl border border-[rgba(166,61,255,0.12)] shadow-sm">
                                <span className="flex h-2.5 w-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
                                Live System Overview
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { 
                                    label: 'Active Users', 
                                    value: loading ? '—' : (summary?.activeUsers?.toLocaleString() || '0'), 
                                    change: (() => {
                                        const pts = analytics?.trends?.users || [];
                                        if (pts.length < 2) return '+0%';
                                        const prev = pts[pts.length - 2];
                                        const curr = pts[pts.length - 1];
                                        if (!prev) return '+0%';
                                        const pct = ((curr - prev) / prev) * 100;
                                        return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
                                    })(),
                                    icon: 'Users', 
                                    color: '#B13BFF' 
                                },
                                { 
                                    label: 'System Revenue', 
                                    value: loading ? '—' : ('₱' + (summary?.revenue?.toLocaleString() || '0')), 
                                    change: '+18.2%', 
                                    icon: 'Dollar', 
                                    color: '#FFB800' 
                                },
                                { 
                                    label: 'Live Websites', 
                                    value: loading ? '—' : (summary?.publishedWebsites?.toLocaleString() || '0'), 
                                    change: summary?.pendingWebsites ? `${summary.pendingWebsites} pending` : '0 pending', 
                                    icon: 'Globe', 
                                    color: '#10B981' 
                                },
                                { 
                                    label: 'Custom Domains', 
                                    value: loading ? '—' : (summary?.activeDomains?.toLocaleString() || '0'), 
                                    change: workspace?.customDomains ? `${workspace.customDomains} configured` : '0 configured', 
                                    icon: 'Link', 
                                    color: '#8A78FF' 
                                },
                            ].map((stat) => (
                                <motion.div
                                    key={stat.label}
                                    variants={cardVariants}
                                    className="admin-dashboard-panel p-6"
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 rounded-2xl" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                            <span className="w-6 h-6 flex items-center justify-center font-bold">●</span>
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : stat.change.includes('pending') || stat.change.includes('configured') ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                            {stat.change}
                                        </span>
                                    </div>
                                    <h3 className="admin-dashboard-soft-text text-[13px] font-bold uppercase tracking-widest">{stat.label}</h3>
                                    <p className="admin-dashboard-purple text-[2.1rem] font-bold mt-1 leading-tight">{stat.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="admin-dashboard-inset-panel flex p-1.5 rounded-2xl relative w-fit overflow-hidden">
                                    {(['platform', 'engagement', 'trends'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setActiveTab(t)}
                                            className={`relative z-10 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                                activeTab === t ? 'text-[#471396]' : 'text-[#7a6aa0] hover:text-[#471396]'
                                            }`}
                                        >
                                            {activeTab === t && (
                                                <motion.div
                                                    layoutId="activeTabBackgroundAnalytics"
                                                    className="absolute inset-0 z-[-1] bg-[#FFCC00] rounded-xl shadow-md"
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            {tabNames[t]}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-[#471396] px-3">Data: Real-time</span>
                                    <span className="h-4 w-[1px] bg-purple-200"></span>
                                    <span className="font-semibold text-[#471396]">{tabNames[activeTab]}</span>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div
                                        key="loader"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-32 space-y-6"
                                    >
                                        <div className="relative h-16 w-16">
                                            <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                                            <div className="absolute inset-0 rounded-full border-4 border-[#B13BFF] border-t-transparent animate-spin"></div>
                                        </div>
                                        <p className="admin-dashboard-soft-text text-sm font-bold uppercase tracking-[0.2em]">Collating platform data...</p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0}}
                                        animate={{ opacity: 1}}
                                        exit={{ opacity: 0}}
                                        transition={{ duration: 0.35, ease: 'easeOut' }}
                                    >
                                        {activeTab === 'platform' && <PlatformTraffic period={period} onPeriodChange={setPeriod} signupsOverTime={analytics?.signupsOverTime} />}
                                        {activeTab === 'engagement' && <RevenueGrowth period={period} onPeriodChange={setPeriod} revenueOverTime={analytics?.revenueOverTime} />}
                                        {activeTab === 'trends' && <SubscriptionDistribution distribution={analytics?.subscriptionDistribution} />}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                            {[
                                { 
                                    title: 'Content Workspace', 
                                    desc: 'Manage drafts and publishing workflows across the ecosystem.', 
                                    mainStat: workspace?.draftSites || '0', 
                                    mainLabel: 'Pending Drafts',
                                    footer: 'Drafts ready for review',
                                    color: '#B13BFF'
                                },
                                { 
                                    title: 'Infrastructure', 
                                    desc: 'System health, uptime, and domain configuration status.', 
                                    mainStat: workspace?.customDomains || '0', 
                                    mainLabel: 'Active Configs',
                                    footer: 'Configured custom domains',
                                    color: '#FFB800'
                                },
                                { 
                                    title: 'Ecosystem Growth', 
                                    desc: 'Average projects and websites per active user account.', 
                                    mainStat: workspace?.avgSitesPerUser || '0.0', 
                                    mainLabel: 'Avg. Scale',
                                    footer: 'Websites per account',
                                    color: '#10B981'
                                }
                            ].map((item) => (
                                <motion.div
                                    key={item.title}
                                    variants={cardVariants}
                                    className="admin-dashboard-panel p-8 group relative overflow-hidden"
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                        <div className="w-24 h-24 rounded-full border-[12px]" style={{ borderColor: item.color }}></div>
                                    </div>
                                    <h3 className="admin-dashboard-purple text-2xl font-bold">{item.title}</h3>
                                    <p className="admin-dashboard-soft-text mt-3 text-sm font-medium leading-relaxed">{item.desc}</p>
                                    
                                    <div className="mt-10 pt-8 border-t border-[rgba(166,61,255,0.12)]">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-[#471396] tracking-tight">{item.mainStat}</span>
                                            <span className="text-sm font-bold text-[#A78BFA] uppercase tracking-wider">{item.mainLabel}</span>
                                        </div>
                                        <p className="mt-4 text-[13px] font-bold text-[#471396] opacity-70 flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                            {item.footer}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
