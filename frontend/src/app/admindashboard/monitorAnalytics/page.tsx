'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import { AnimatePresence } from 'framer-motion';

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
    const [timePeriod, setTimePeriod] = useState('7days');
    const [hoveredPoint, setHoveredPoint] = useState<{ date: string; mobile: number; desktop: number } | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const tabNames: Record<string, string> = {
        platform: 'Platform Activities',
        engagement: 'Engagement',
        trends: 'Trends & Anomalies',
    };

    // Generate visitor data based on time period
    const getVisitorData = () => {
        if (timePeriod === '7days') {
            return [
                { date: 'Feb 1', mobile: 280, desktop: 420 },
                { date: 'Feb 2', mobile: 320, desktop: 380 },
                { date: 'Feb 3', mobile: 380, desktop: 434 },
                { date: 'Feb 4', mobile: 350, desktop: 460 },
                { date: 'Feb 5', mobile: 420, desktop: 490 },
                { date: 'Feb 6', mobile: 390, desktop: 510 },
                { date: 'Feb 7', mobile: 450, desktop: 540 },
            ];
        } else if (timePeriod === '30days') {
            return Array.from({ length: 8 }).map((_, i) => ({
                date: `Day ${i * 4 + 1}`,
                mobile: 300 + Math.random() * 150,
                desktop: 400 + Math.random() * 200,
            }));
        } else {
            return Array.from({ length: 12 }).map((_, i) => ({
                date: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'][i],
                mobile: 250 + Math.random() * 200,
                desktop: 350 + Math.random() * 250,
            }));
        }
    };

    const visitorData = getVisitorData();
    const maxVisitors = Math.max(...visitorData.flatMap(d => [d.mobile, d.desktop]));

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
                        Monitoring & Analytics
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
                        { label: 'New Sign-ups', value: '1,247', change: '+12.8% this week' },
                        { label: 'Reports Generated', value: '89', change: '+2.4% vs last week' },
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
                                { id: 'platform', label: 'Platform Activities' },
                                { id: 'engagement', label: 'Engagement' },
                                { id: 'trends', label: 'Trends & Anomalies' },
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
                        {/* Platform Activities Tab */}
                        {activeTab === 'platform' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    {/* Header with Time Period Filter */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                        <div>
                                            <h2 className="text-2xl font-semibold text-slate-900">Total Visitors</h2>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Total for the last {timePeriod === '7days' ? '7 days' : timePeriod === '30days' ? '30 days' : '3 months'}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                                            {[
                                                { id: '3months', label: 'Last 3 months' },
                                                { id: '30days', label: 'Last 30 days' },
                                                { id: '7days', label: 'Last 7 days' },
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

                                    {/* Chart Container */}
                                    <div className="bg-white rounded-xl p-8 border border-slate-200 relative">
                                        <svg
                                            viewBox="0 0 800 400"
                                            className="w-full"
                                            style={{ aspectRatio: '800/400' }}
                                            onMouseLeave={() => setHoveredPoint(null)}
                                        >
                                            <defs>
                                                {/* Gradient for Desktop area */}
                                                <linearGradient id="desktopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#64748b" stopOpacity="0.15" />
                                                    <stop offset="100%" stopColor="#64748b" stopOpacity="0.02" />
                                                </linearGradient>
                                                {/* Gradient for Mobile area */}
                                                <linearGradient id="mobileGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                                                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.03" />
                                                </linearGradient>
                                            </defs>

                                            {/* Grid lines */}
                                            {[...Array(5)].map((_, i) => (
                                                <line
                                                    key={`grid-${i}`}
                                                    x1="60"
                                                    y1={50 + i * 70}
                                                    x2="760"
                                                    y2={50 + i * 70}
                                                    stroke="#e2e8f0"
                                                    strokeWidth="1"
                                                    opacity="1"
                                                />
                                            ))}

                                            {/* Y-axis labels */}
                                            {[Math.round(maxVisitors), Math.round(maxVisitors * 0.75), Math.round(maxVisitors * 0.5), Math.round(maxVisitors * 0.25), 0].map((label, i) => (
                                                <text
                                                    key={`y-${i}`}
                                                    x="45"
                                                    y={50 + i * 70 + 5}
                                                    fontSize="12"
                                                    fill="#94a3b8"
                                                    textAnchor="end"
                                                >
                                                    {label}
                                                </text>
                                            ))}

                                            {/* Desktop area (bottom layer) */}
                                            <path
                                                d={(() => {
                                                    const points = visitorData.map((d, i) => {
                                                        const x = 60 + (i / (visitorData.length - 1)) * 700;
                                                        const y = 330 - ((d.desktop / maxVisitors) * 280);
                                                        return `${x},${y}`;
                                                    });
                                                    const startX = 60;
                                                    const endX = 760;
                                                    return `M${startX},330 L${points.join(' L')} L${endX},330 Z`;
                                                })()}
                                                fill="url(#desktopGradient)"
                                            />

                                            {/* Desktop line */}
                                            <polyline
                                                points={visitorData.map((d, i) => {
                                                    const x = 60 + (i / (visitorData.length - 1)) * 700;
                                                    const y = 330 - ((d.desktop / maxVisitors) * 280);
                                                    return `${x},${y}`;
                                                }).join(' ')}
                                                fill="none"
                                                stroke="#64748b"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />

                                            {/* Mobile area (top layer) */}
                                            <path
                                                d={(() => {
                                                    const points = visitorData.map((d, i) => {
                                                        const x = 60 + (i / (visitorData.length - 1)) * 700;
                                                        const y = 330 - ((d.mobile / maxVisitors) * 280);
                                                        return `${x},${y}`;
                                                    });
                                                    const startX = 60;
                                                    const endX = 760;
                                                    return `M${startX},330 L${points.join(' L')} L${endX},330 Z`;
                                                })()}
                                                fill="url(#mobileGradient)"
                                            />

                                            {/* Mobile line */}
                                            <polyline
                                                points={visitorData.map((d, i) => {
                                                    const x = 60 + (i / (visitorData.length - 1)) * 700;
                                                    const y = 330 - ((d.mobile / maxVisitors) * 280);
                                                    return `${x},${y}`;
                                                }).join(' ')}
                                                fill="none"
                                                stroke="#2563eb"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />

                                            {/* Interactive points */}
                                            {visitorData.map((d, i) => {
                                                const x = 60 + (i / (visitorData.length - 1)) * 700;
                                                const yMobile = 330 - ((d.mobile / maxVisitors) * 280);
                                                const yDesktop = 330 - ((d.desktop / maxVisitors) * 280);
                                                
                                                return (
                                                    <g key={`point-${i}`}>
                                                        {/* Invisible larger circle for better hover */}
                                                        <circle
                                                            cx={x}
                                                            cy={yMobile}
                                                            r="20"
                                                            fill="transparent"
                                                            style={{ cursor: 'pointer' }}
                                                            onMouseEnter={() => setHoveredPoint(d)}
                                                        />
                                                        {/* Desktop point */}
                                                        <circle
                                                            cx={x}
                                                            cy={yDesktop}
                                                            r="4"
                                                            fill="#64748b"
                                                        />
                                                        {/* Mobile point */}
                                                        <circle
                                                            cx={x}
                                                            cy={yMobile}
                                                            r="4"
                                                            fill="#2563eb"
                                                        />
                                                    </g>
                                                );
                                            })}

                                            {/* X-axis labels */}
                                            {visitorData.map((d, i) => (
                                                <text
                                                    key={`x-${i}`}
                                                    x={60 + (i / (visitorData.length - 1)) * 700}
                                                    y="360"
                                                    fontSize="12"
                                                    fill="#94a3b8"
                                                    textAnchor="middle"
                                                >
                                                    {d.date}
                                                </text>
                                            ))}
                                        </svg>

                                        {/* Tooltip */}
                                        {hoveredPoint && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white border border-slate-200 rounded-lg p-4 shadow-xl"
                                            >
                                                <div className="text-sm font-semibold text-slate-900 mb-2">{hoveredPoint.date}</div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
                                                        <span className="text-sm text-slate-600">Mobile</span>
                                                        <span className="text-sm font-semibold text-slate-900 ml-auto">{hoveredPoint.mobile}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-sm bg-slate-500"></div>
                                                        <span className="text-sm text-slate-600">Desktop</span>
                                                        <span className="text-sm font-semibold text-slate-900 ml-auto">{hoveredPoint.desktop}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Engagement Tab */}
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
                                            <p className="text-slate-500">Engagement metrics coming soon</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Trends & Anomalies Tab */}
                        {activeTab === 'trends' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 min-h-[400px] flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-slate-500">Trends analysis data coming soon</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Additional Analytics Cards */}
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.48, ease: [0.22, 0.84, 0.25, 1] }}
                >
                    {/* Top Pages */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)] p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Pages</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Dashboard', views: '2,847', change: '+5.2%' },
                                { name: 'Builder', views: '2,104', change: '+3.1%' },
                                { name: 'Settings', views: '1,623', change: '-2.4%' },
                            ].map((page, idx) => (
                                <motion.div
                                    key={page.name}
                                    className="flex items-center justify-between py-2 border-b border-slate-200 last:border-b-0"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.35, delay: 0.5 + 0.05 * idx }}
                                >
                                    <span className="text-sm font-medium text-slate-900">{page.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-slate-600">{page.views}</span>
                                        <span className="text-xs text-blue-600 font-semibold">{page.change}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Events */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)] p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Events</h3>
                        <div className="space-y-3">
                            {[
                                { event: 'High traffic detected', time: '2 min ago', status: 'info' },
                                { event: 'New user registration spike', time: '15 min ago', status: 'success' },
                                { event: 'API response time increased', time: '1 hour ago', status: 'warning' },
                            ].map((item, idx) => (
                                <motion.div
                                    key={item.event}
                                    className="flex gap-3 py-3 border-b border-slate-200 last:border-b-0"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.35, delay: 0.55 + 0.05 * idx }}
                                >
                                    <div
                                        className={`h-2 w-2 rounded-full flex-shrink-0 mt-1.5 ${
                                            item.status === 'success'
                                                ? 'bg-emerald-600'
                                                : item.status === 'warning'
                                                ? 'bg-amber-600'
                                                : 'bg-blue-600'
                                        }`}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">{item.event}</p>
                                        <p className="text-xs text-slate-500">{item.time}</p>
                                    </div>
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
