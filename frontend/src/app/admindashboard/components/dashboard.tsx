'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    ADMIN_CHART_SERIES,
    ADMIN_NOTIFICATIONS,
    ADMIN_RECENT_USER_ACTIONS,
    ADMIN_STATS,
} from '@/lib/config/adminDashboardMocks';

// ─── Data ────────────────────────────────────────────────────────────────────

// ─── DashboardPanel ──────────────────────────────────────────────────────────

function DashboardPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <section className={`admin-dashboard-panel rounded-[28px] ${className}`.trim()}>
            {children}
        </section>
    );
}

// ─── DashboardLineChart ──────────────────────────────────────────────────────

type ChartSeriesItem = { label: string; color: string; points: readonly number[] };

const CW = 240, CH = 110, LP = 28, RP = 10, TP = 12, BP = 26;
const CHART_TEXT_COLOR = 'rgba(71, 19, 150, 0.58)';

function toPoints(points: readonly number[]) {
    return points
        .map((p, i) => {
            const x = LP + i * ((CW - LP - RP) / Math.max(points.length - 1, 1));
            const y = TP + ((100 - p) / 100) * (CH - TP - BP);
            return `${x},${y}`;
        })
        .join(' ');
}

function DashboardLineChart({ series }: { series: readonly ChartSeriesItem[] }) {
    return (
        <div className="mt-4">
            <svg viewBox={`0 0 ${CW} ${CH}`} className="h-[7.2rem] w-full">
                {[0, 20, 40, 60, 80, 100].map((v) => {
                    const y = TP + ((100 - v) / 100) * (CH - TP - BP);
                    return (
                        <g key={v}>
                            <line x1={LP} y1={y} x2={CW - RP} y2={y} stroke="rgba(71,19,150,0.10)" strokeWidth="1" />
                            <text x={8} y={y + 3} fontSize="8" fill={CHART_TEXT_COLOR}>{v}</text>
                        </g>
                    );
                })}
                <line x1={LP} y1={CH - BP} x2={CW - RP} y2={CH - BP} stroke="rgba(71,19,150,0.10)" strokeWidth="1" />
                {series.map((item) => (
                    <g key={item.label}>
                        <polyline fill="none" stroke={item.color} strokeWidth="1.8" points={toPoints(item.points)} />
                        {item.points.map((p, i) => {
                            const x = LP + i * ((CW - LP - RP) / Math.max(item.points.length - 1, 1));
                            const y = TP + ((100 - p) / 100) * (CH - TP - BP);
                            return <circle key={`${item.label}-${i}`} cx={x} cy={y} r="2.4" fill="#FFFFFF" stroke={item.color} strokeWidth="1" />;
                        })}
                    </g>
                ))}
                <text x={82} y={CH - 9} fontSize="8" fill={CHART_TEXT_COLOR}>Data 1</text>
                <text x={165} y={CH - 9} fontSize="8" fill={CHART_TEXT_COLOR}>Data 2</text>
            </svg>
            <div className="admin-dashboard-muted-text mt-1 flex items-center justify-center gap-4 text-[10px]">
                {series.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <svg width="12" height="6" viewBox="0 0 12 6" aria-hidden>
                            <rect width="12" height="6" rx="3" fill={item.color} />
                        </svg>
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── DashboardStatCard ───────────────────────────────────────────────────────

function DashboardStatCard({
    title, value, liveLabel, series, index,
}: {
    title: string; value: string; liveLabel: string; series: readonly ChartSeriesItem[]; index: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.08 * index, ease: [0.22, 0.84, 0.25, 1] }}
        >
            <DashboardPanel className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="admin-dashboard-yellow text-[2.5rem] font-bold leading-none">{value}</p>
                        <p className="admin-dashboard-purple mt-2 text-xs font-bold tracking-[0.04em]">{title}</p>
                    </div>
                    <span className="admin-dashboard-muted-text text-[10px]">{liveLabel}</span>
                </div>
                <DashboardLineChart series={series} />
            </DashboardPanel>
        </motion.div>
    );
}

// ─── DashboardActivityPanel ──────────────────────────────────────────────────

function DashboardActivityPanel({ items }: { items: readonly { title: string; action: string; meta: string }[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.28, ease: [0.22, 0.84, 0.25, 1] }}
        >
            <DashboardPanel className="min-h-[15.6rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="admin-dashboard-purple text-[1.45rem] font-semibold">Recent User Actions</h2>
                    <button type="button" suppressHydrationWarning className="admin-dashboard-muted-text text-xs transition-opacity hover:opacity-70">
                        View audit log
                    </button>
                </div>
                <div className="admin-dashboard-inset-panel mt-5 rounded-[18px] p-3 sm:p-4">
                    {items.map((item) => (
                        <div key={item.title} className="flex gap-4 rounded-[14px] bg-white/40 px-4 py-4">
                            <div className="admin-dashboard-yellow-fill w-1 shrink-0 rounded-full" />
                            <div className="min-w-0">
                                <p className="admin-dashboard-purple text-base font-semibold">{item.title}</p>
                                <p className="admin-dashboard-soft-text mt-1 text-sm">{item.action}</p>
                                <p className="admin-dashboard-muted-text text-sm">{item.meta}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </DashboardPanel>
        </motion.div>
    );
}

// ─── DashboardNotificationsPanel ─────────────────────────────────────────────

function DashboardNotificationsPanel({ items }: { items: readonly { title: string; date: string }[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.44, delay: 0.34, ease: [0.22, 0.84, 0.25, 1] }}
        >
            <DashboardPanel className="min-h-[15.6rem] p-5 sm:p-6">
                <h2 className="admin-dashboard-purple text-[1.45rem] font-semibold">Notifications</h2>
                <div className="mt-6 space-y-4">
                    {items.map((item) => (
                        <div key={item.title} className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <span className="admin-dashboard-yellow-fill mt-1.5 h-3 w-3 rounded-full" />
                                <p className="admin-dashboard-purple text-sm font-medium">{item.title}</p>
                            </div>
                            <p className="admin-dashboard-muted-text text-xs text-right">{item.date}</p>
                        </div>
                    ))}
                </div>
            </DashboardPanel>
        </motion.div>
    );
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────

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
                    {ADMIN_STATS.map((metric, index) => (
                        <DashboardStatCard
                            key={metric.title}
                            title={metric.title}
                            value={metric.value}
                            liveLabel={metric.liveLabel}
                            series={ADMIN_CHART_SERIES}
                            index={index}
                        />
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
                    <DashboardActivityPanel items={ADMIN_RECENT_USER_ACTIONS} />
                    <DashboardNotificationsPanel items={ADMIN_NOTIFICATIONS} />
                </div>
            </div>
        </main>
    );
}
