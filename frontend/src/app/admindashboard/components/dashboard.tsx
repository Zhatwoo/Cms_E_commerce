'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';

const MoreMenuIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
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
                        className="text-sm sm:text-base text-slate-600 max-w-xl"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.08, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        Dashboard
                    </motion.p>
                </div>

                {/* Stats Cards Row */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div
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
                        <div className="relative">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em]">Total Users</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">12,453</p>
                            <p className="mt-1 text-xs text-slate-500">+12.5% from last month</p>
                        </div>
                    </motion.div>
                    
                    <motion.div
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
                        <div className="relative">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em]">Total Websites</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">348</p>
                            <p className="mt-1 text-xs text-slate-500">+8.2% vs last month</p>
                        </div>
                    </motion.div>
                    
                    <motion.div
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
                        <div className="relative">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em]">Active Orders</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">2,847</p>
                            <p className="mt-1 text-xs text-slate-500">+15.3% this week</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column - Takes 2/3 width */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Published Sites Section */}
                        <motion.div
                            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)]"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.32, ease: [0.22, 0.84, 0.25, 1] }}
                        >
                            <div className="flex items-center justify-between gap-2 mb-5">
                                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Published Sites</h2>
                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                    30 days
                                </span>
                            </div>
                            <div className="space-y-1">
                                {[
                                    { name: 'Mercato Store', domain: 'mercato-store.com', lastDeploy: '5', visitors: '2.4k' },
                                    { name: 'Tech Landing', domain: 'tech-landing.io', lastDeploy: '8', visitors: '1.8k' },
                                    { name: 'Fashion Hub', domain: 'fashion-hub.co', lastDeploy: '12', visitors: '1.2k' }
                                ].map((site, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="grid grid-cols-4 gap-4 py-2.5 border-b border-slate-200 last:border-b-0 text-sm text-slate-700"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.35,
                                            delay: 0.35 + 0.06 * idx,
                                            ease: [0.25, 0.8, 0.25, 1],
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{site.name}</span>
                                            <span className="text-xs text-slate-500">{site.domain}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-sky-600" />
                                            <span className="text-sky-700">Live</span>
                                        </div>
                                        <div className="text-xs text-slate-500">~{site.lastDeploy} min ago</div>
                                        <div className="text-xs text-slate-700">{site.visitors} visits/24h</div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Recent Activities Section */}
                        <motion.div
                            className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)] overflow-hidden"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.4, ease: [0.22, 0.84, 0.25, 1] }}
                        >
                            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900">Recent Activities</h2>
                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                    Latest 5
                                </span>
                            </div>
                            <div className="p-6 space-y-2">
                                {[
                                    { action: 'User registration completed', time: '2' },
                                    { action: 'Website deployed successfully', time: '4' },
                                    { action: 'Domain configuration updated', time: '6' },
                                    { action: 'SSL certificate renewed', time: '8' },
                                    { action: 'Database backup completed', time: '10' }
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="flex items-center gap-3 py-2 text-sm text-slate-700"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            duration: 0.35,
                                            delay: 0.43 + 0.05 * idx,
                                            ease: [0.25, 0.8, 0.25, 1],
                                        }}
                                    >
                                        <span className="h-2 w-2 rounded-full bg-slate-400 flex-shrink-0" />
                                        <span className="text-slate-800">{item.action}</span>
                                        <span className="ml-auto text-xs text-slate-500">~{item.time}h ago</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Takes 1/3 width */}
                    <motion.div
                        className="lg:col-span-1"
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.48, ease: [0.22, 0.84, 0.25, 1] }}
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.08)] sticky top-8">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
                                    <button className="text-slate-500 hover:text-slate-900 transition-colors">
                                        <MoreMenuIcon />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { title: 'New user signup', message: 'John Doe registered', time: '5m ago', type: 'info' },
                                        { title: 'System alert', message: 'Database capacity at 85%', time: '12m ago', type: 'warning' },
                                        { title: 'Payment processed', message: 'Order #2847 completed', time: '28m ago', type: 'success' },
                                        { title: 'Site deployment', message: 'Tech Landing deployed', time: '1h ago', type: 'info' },
                                        { title: 'Security update', message: 'SSL certificate renewed', time: '2h ago', type: 'success' }
                                    ].map((notif, idx) => (
                                        <motion.div
                                            key={idx}
                                            className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-white transition-colors"
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                duration: 0.35,
                                                delay: 0.5 + 0.04 * idx,
                                                ease: [0.25, 0.8, 0.25, 1],
                                            }}
                                        >
                                            <div className={`h-2 w-2 rounded-full flex-shrink-0 mt-1.5 ${
                                                notif.type === 'success' ? 'bg-emerald-600' :
                                                notif.type === 'warning' ? 'bg-amber-600' :
                                                'bg-blue-600'
                                            }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900">{notif.title}</p>
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
