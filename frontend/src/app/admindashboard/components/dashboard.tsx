'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';

const UsersIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 10a3 3 0 100-6 3 3 0 000 6zM13 9a2.5 2.5 0 10-2.4-3.2 4.5 4.5 0 012.4 3.2z" />
        <path d="M2 16a4 4 0 014-4h2a4 4 0 014 4v1H2v-1zM12.5 14.2a3.6 3.6 0 011.7-.4h1.3a3.5 3.5 0 013.5 3.5V17h-6.5a5.4 5.4 0 00-.7-2.8z" />
    </svg>
);

const GlobeIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm5.9 7H13a13.5 13.5 0 00-1-4 6.1 6.1 0 013.9 4zM10 4.1c.7 1 1.2 2.5 1.4 4H8.6c.2-1.5.7-3 1.4-4zM4.1 9A6.1 6.1 0 018 5c-.4 1.2-.7 2.6-.8 4H4.1zm3 2c.1 1.4.4 2.8.8 4a6.1 6.1 0 01-3.8-4h3zm2.9 4.9c-.7-1-1.2-2.5-1.4-4h2.8c-.2 1.5-.7 3-1.4 4zM12 15a13.5 13.5 0 001-4h2.9a6.1 6.1 0 01-3.9 4z" />
    </svg>
);

const StatusIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 3a1 1 0 011 1v4a1 1 0 11-2 0V6a1 1 0 011-1zm0 9a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
    </svg>
);

const RatioIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 4h2v12H3V4zm6 4h2v8H9V8zm6-3h2v11h-2V5z" />
    </svg>
);

const BellIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a4 4 0 00-4 4v2.6l-1.2 2.4A1 1 0 005.7 13h8.6a1 1 0 00.9-1.4L14 8.6V6a4 4 0 00-4-4z" />
        <path d="M8 15a2 2 0 004 0H8z" />
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

export function AdminDashboard() {
    const metricCards = [
        {
            title: 'Active Users Today',
            value: '842',
            delta: '+4.1% vs yesterday',
            tooltip: 'Users active in the last 24 hours',
            icon: <UsersIcon />,
        },
        {
            title: 'Websites per User (avg)',
            value: '2.4',
            delta: '+0.3 from last month',
            tooltip: 'Average websites created per user',
            icon: <GlobeIcon />,
        },
        {
            title: 'Suspended Users',
            value: '37',
            delta: '-5 vs last week',
            tooltip: 'Users currently suspended or inactive',
            icon: <StatusIcon />,
        },
        {
            title: 'Inactive Users',
            value: '156',
            delta: '+9 from last week',
            tooltip: 'Users with no activity in the last 7 days',
            icon: <RatioIcon />,
        },
    ];


    const recentUserActions = [
        { action: 'Jamie Lee created a new site', time: '1', tone: 'bg-blue-500' },
        { action: 'User ID #342 upgraded plan', time: '2', tone: 'bg-emerald-500' },
        { action: 'User ID #219 exceeded bandwidth', time: '3', tone: 'bg-amber-500' },
        { action: 'Account suspended due to inactivity', time: '5', tone: 'bg-rose-500' },
        { action: 'User ID #114 reset password', time: '6', tone: 'bg-slate-400' },
    ];

    const notifications = [
        {
            title: 'Storage nearly full',
            message: 'Tenant storage at 96%',
            time: '4m ago',
            priority: 'Critical',
            tone: 'bg-rose-600',
            badge: 'bg-rose-100 text-rose-700',
        },
        {
            title: 'Capacity at 80%',
            message: 'Bandwidth usage reached 80%',
            time: '18m ago',
            priority: 'Warning',
            tone: 'bg-amber-600',
            badge: 'bg-amber-100 text-amber-700',
        },
        {
            title: 'New user signup',
            message: 'John Doe registered',
            time: '28m ago',
            priority: 'Info',
            tone: 'bg-emerald-600',
            badge: 'bg-emerald-100 text-emerald-700',
        },
        {
            title: 'Security scan completed',
            message: 'No vulnerabilities found',
            time: '1h ago',
            priority: 'Info',
            tone: 'bg-blue-600',
            badge: 'bg-blue-100 text-blue-700',
        },
    ];

    return (
        <main className="flex-1 overflow-y-auto bg-slate-50">
            <div className="p-8 space-y-8">
                {/* Welcome Header */}
                <div className="flex flex-col gap-2">
                    <motion.h1
                        className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        Welcome, Admin!
                    </motion.h1>
                    <motion.p
                        className="text-sm sm:text-base text-slate-700 max-w-xl"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.08, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        Overview
                    </motion.p>
                </div>

                {/* Stats Cards Row */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {metricCards.map((metric, idx) => (
                        <motion.div
                            key={metric.title}
                            className="relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)]"
                            variants={cardVariants}
                            whileHover={{ y: -4, scale: 1.01 }}
                            transition={{
                                duration: 0.38,
                                ease: [0.23, 0.82, 0.25, 1],
                                type: 'spring',
                                stiffness: 260,
                                damping: 24,
                                delay: 0.02 * idx,
                            }}
                        >
                            <div className="relative">
                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-[0.18em]">
                                    {metric.title}
                                </p>
                                <button
                                    className="mt-2 text-3xl font-semibold text-slate-900 hover:text-slate-700 transition-colors"
                                    title="View details"
                                >
                                    {metric.value}
                                </button>
                                <p className="mt-1 text-xs text-slate-600" title={metric.tooltip}>
                                    {metric.delta}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column - Takes 2/3 width */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Recent User Actions */}
                        <motion.div
                            className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)] overflow-hidden"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.4, ease: [0.22, 0.84, 0.25, 1] }}
                        >
                            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900">Recent User Actions</h2>
                                <button className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                                    View audit log
                                </button>
                            </div>
                            <div className="p-6 space-y-2">
                                {recentUserActions.map((item, idx) => (
                                    <motion.div
                                        key={item.action}
                                        className="flex items-center gap-3 py-2 text-sm text-slate-700"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            duration: 0.35,
                                            delay: 0.43 + 0.05 * idx,
                                            ease: [0.25, 0.8, 0.25, 1],
                                        }}
                                    >
                                        <span className={`h-2 w-2 rounded-full ${item.tone} flex-shrink-0`} />
                                        <span className="text-slate-800">{item.action}</span>
                                        <span className="ml-auto text-xs text-slate-500">~{item.time}h ago</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Takes 1/3 width */}
                    <motion.div
                        className="lg:col-span-1 space-y-4"
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.48, ease: [0.22, 0.84, 0.25, 1] }}
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                                            <BellIcon />
                                        </span>
                                        <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {['System', 'Users', 'Billing', 'Security'].map((filter) => (
                                        <button
                                            key={filter}
                                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                                                filter === 'System'
                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    {notifications.map((notif, idx) => (
                                        <motion.div
                                            key={notif.title}
                                            className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-white transition-colors"
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                duration: 0.35,
                                                delay: 0.5 + 0.04 * idx,
                                                ease: [0.25, 0.8, 0.25, 1],
                                            }}
                                        >
                                            <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 mt-1.5 ${notif.tone}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${notif.badge}`}>
                                                        {notif.priority}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 truncate">{notif.message}</p>
                                                <p className="text-[10px] text-slate-500 mt-1">{notif.time}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </div>
            </div>
        </main>
    );
}
