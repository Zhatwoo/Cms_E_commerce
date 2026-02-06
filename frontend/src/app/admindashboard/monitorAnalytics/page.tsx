'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import { AnimatePresence } from 'framer-motion';
import Chart from 'chart.js/auto';

const ChevronRightIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
};

const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
};

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
    const [timePeriod, setTimePeriod] = useState('7days');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const trafficChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    // Initialize traffic chart on mount and when time period changes
    useEffect(() => {
        if (!trafficChartRef.current) return;

        const getChartData = () => {
            if (timePeriod === '7days') {
                return {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    visitors: [270, 300, 360, 330, 410, 380, 450],
                    signups: [120, 150, 180, 170, 210, 200, 240],
                };
            } else if (timePeriod === '30days') {
                return {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    visitors: [2100, 2450, 2890, 3200],
                    signups: [850, 980, 1120, 1350],
                };
            } else {
                return {
                    labels: ['Jan', 'Feb', 'Mar'],
                    visitors: [8500, 9200, 10100],
                    signups: [3200, 3800, 4200],
                };
            }
        };

        // Destroy previous chart if it exists
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const chartData = getChartData();

        const ctx = trafficChartRef.current.getContext('2d');
        if (!ctx) return;

        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Visitors',
                        data: chartData.visitors,
                        borderColor: '#1d4ed8',
                        backgroundColor: 'rgba(29, 78, 216, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: 'Signups',
                        data: chartData.signups,
                        borderColor: '#64748b',
                        backgroundColor: 'rgba(100, 116, 139, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(226, 232, 240, 0.5)',
                        },
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                    },
                },
            },
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [timePeriod]);

    const tabNames: Record<string, string> = {
        platform: 'Platform Traffic',
        engagement: 'Revenue Growth',
        trends: 'Subscription Distribution',
    };

    const subscriptionData = [
        { label: 'Free', value: 35, color: '#94a3b8' },
        { label: 'Basic', value: 30, color: '#2563eb' },
        { label: 'Pro', value: 25, color: '#22c55e' },
        { label: 'Enterprise', value: 10, color: '#f59e0b' },
    ];
    const totalSubscriptions = subscriptionData.reduce((sum, item) => sum + item.value, 0);
    let cumulativeAngle = 0;
    const subscriptionSegments = subscriptionData.map((item) => {
        const startAngle = (cumulativeAngle / totalSubscriptions) * 360;
        cumulativeAngle += item.value;
        const endAngle = (cumulativeAngle / totalSubscriptions) * 360;
        return { ...item, startAngle, endAngle };
    });

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
                        {activeTab === 'platform' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                        <div>
                                            <h2 className="text-2xl font-semibold text-slate-900">Platform Traffic</h2>
                                            <p className="text-sm text-slate-500 mt-1">Visitors and signups performance</p>
                                        </div>
                                        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                                            {[
                                                { id: '7days', label: 'Last 7 days' },
                                                { id: '30days', label: 'Last 30 days' },
                                                { id: '3months', label: 'Last 3 months' },
                                            ].map((period) => (
                                                <button
                                                    key={period.id}
                                                    onClick={() => setTimePeriod(period.id)}
                                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                        timePeriod === period.id
                                                            ? 'bg-white text-slate-900 shadow-sm'
                                                            : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                                >
                                                    {period.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl p-8 border border-slate-200">
                                        <canvas ref={trafficChartRef} height="80"></canvas>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Revenue Growth Tab */}
                        {activeTab === 'engagement' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 min-h-[400px] flex items-center justify-center">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Revenue Growth</h2>
                                            <p className="text-sm text-slate-500">Revenue insights coming soon</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Subscription Distribution Tab */}
                        {activeTab === 'trends' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                        <div>
                                            <h2 className="text-2xl font-semibold text-slate-900">Subscription Distribution</h2>
                                            <p className="text-sm text-slate-500 mt-1">Current plan mix across the platform</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl p-8 border border-slate-200">
                                        <div className="flex flex-col lg:flex-row items-center gap-10">
                                            <svg viewBox="0 0 360 360" className="w-full max-w-[280px]" style={{ aspectRatio: '360/360' }}>
                                                {subscriptionSegments.map((segment) => (
                                                    <path
                                                        key={segment.label}
                                                        d={describeArc(180, 180, 120, segment.startAngle, segment.endAngle)}
                                                        fill={segment.color}
                                                    />
                                                ))}
                                                <circle cx="180" cy="180" r="68" fill="#ffffff" />
                                                <text x="180" y="175" fontSize="16" fill="#0f172a" textAnchor="middle" fontWeight="600">
                                                    Total
                                                </text>
                                                <text x="180" y="200" fontSize="20" fill="#0f172a" textAnchor="middle" fontWeight="700">
                                                    {totalSubscriptions}%
                                                </text>
                                            </svg>

                                            <div className="space-y-4 w-full">
                                                {subscriptionSegments.map((segment) => (
                                                    <div key={`legend-${segment.label}`} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                                                            <span className="text-sm font-medium text-slate-700">{segment.label}</span>
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-900">{segment.value}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
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

