'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { adminNotifications, adminStats, chartSeries, recentUserActions } from './adminConfig';
import { DashboardActivityPanel } from './DashboardActivityPanel';
import { DashboardNotificationsPanel } from './DashboardNotificationsPanel';
import { DashboardStatCard } from './DashboardStatCard';

export function AdminDashboard() {
    return (
        <main className="flex-1 overflow-y-auto">
            <div className="w-full px-4 pb-8 pt-4 sm:px-6 lg:px-6 lg:pb-10 lg:pt-6">
                <div className="flex flex-col gap-2">
                    <motion.h1
                        className="admin-dashboard-purple text-[2.65rem] font-extrabold leading-none tracking-[-0.05em] sm:text-[3.65rem]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        Welcome, <span className="admin-dashboard-admin-gradient">Admin!</span>
                    </motion.h1>
                    <motion.p
                        className="admin-dashboard-soft-text text-sm font-medium sm:text-base"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.08, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        Overview
                    </motion.p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {adminStats.map((metric, index) => (
                        <DashboardStatCard
                            key={metric.title}
                            title={metric.title}
                            value={metric.value}
                            liveLabel={metric.liveLabel}
                            series={chartSeries}
                            index={index}
                        />
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
                    <DashboardActivityPanel items={recentUserActions} />
                    <DashboardNotificationsPanel items={adminNotifications} />
                </div>
            </div>
        </main>
    );
}
