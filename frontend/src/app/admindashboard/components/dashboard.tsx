'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    getMe,
    getStoredUser,
    setStoredUser,
    getAnalytics,
    type User 
} from '@/lib/api';
import {
    ADMIN_CHART_SERIES,
    ADMIN_STATS,
} from '@/lib/config/adminDashboardMocks';
import { getNotifications, type NotificationItem } from '@/lib/notifications';

// ─── DashboardPanel ──────────────────────────────────────────────────────────

function DashboardPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <section
            className={`rounded-[28px] ${className}`.trim()}
            style={{
                background: 'rgba(255,255,255,0.82)',
                border: '1px solid rgba(166,61,255,0.13)',
                boxShadow: '0 4px 24px rgba(103,2,191,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                backdropFilter: 'blur(14px)',
            }}
        >
            {children}
        </section>
    );
}

// ─── DashboardLineChart ──────────────────────────────────────────────────────

type ChartSeriesItem = { label: string; color: string; points: readonly number[] };

const CW = 240, CH = 110, LP = 28, RP = 10, TP = 12, BP = 26;
const CHART_TEXT_COLOR = 'rgba(74, 26, 138, 0.5)';

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
                            <line x1={LP} y1={y} x2={CW - RP} y2={y} stroke="rgba(103,2,191,0.08)" strokeWidth="1" />
                            <text x={8} y={y + 3} fontSize="8" fill={CHART_TEXT_COLOR}>{v}</text>
                        </g>
                    );
                })}
                <line x1={LP} y1={CH - BP} x2={CW - RP} y2={CH - BP} stroke="rgba(103,2,191,0.08)" strokeWidth="1" />
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
                <text x={82} y={CH - 9} fontSize="8" fill={CHART_TEXT_COLOR}>Historical</text>
                <text x={165} y={CH - 9} fontSize="8" fill={CHART_TEXT_COLOR}>Current</text>
            </svg>
            <div className="mt-1 flex items-center justify-center gap-4 text-[10px]" style={{ color: '#a090c8' }}>
                {series.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <svg width="12" height="6" viewBox="0 0 12 6" aria-hidden>
                            <rect width="12" height="6" rx="3" fill={item.color} />
                        </svg>
                        <span>{item.label || 'Growth'}</span>
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
                        <p className="text-[2.5rem] font-bold leading-none" style={{ color: '#c89000' }}>{value}</p>
                        <p className="mt-2 text-xs font-bold tracking-[0.04em]" style={{ color: '#4a1a8a' }}>{title}</p>
                    </div>
                    <span className="text-[10px]" style={{ color: '#a090c8' }}>{liveLabel}</span>
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
                    <h2 className="text-[1.45rem] font-semibold" style={{ color: '#4a1a8a' }}>Recent User Actions</h2>
                    <button type="button" suppressHydrationWarning className="text-xs transition-opacity hover:opacity-70" style={{ color: '#a090c8' }}>
                        View audit log
                    </button>
                </div>
                <div
                    className="mt-5 rounded-[18px] p-3 sm:p-4"
                    style={{ background: 'rgba(240,235,255,0.6)', border: '1px solid rgba(166,61,255,0.08)' }}
                >
                    {items.map((item) => (
                        <div key={item.title} className="flex gap-4 rounded-[14px] px-4 py-4" style={{ background: 'rgba(255,255,255,0.6)' }}>
                            <div className="w-1 shrink-0 rounded-full" style={{ background: '#f5c000' }} />
                            <div className="min-w-0">
                                <p className="text-base font-semibold" style={{ color: '#4a1a8a' }}>{item.title}</p>
                                <p className="mt-1 text-sm" style={{ color: '#7a6aa0' }}>{item.action}</p>
                                <p className="text-sm" style={{ color: '#a090c8' }}>{item.meta}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </DashboardPanel>
        </motion.div>
    );
}

// ─── DashboardNotificationsPanel ─────────────────────────────────────────────

function DashboardNotificationsPanel({ items }: { items: NotificationItem[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.44, delay: 0.34, ease: [0.22, 0.84, 0.25, 1] }}
        >
            <DashboardPanel className="min-h-[15.6rem] p-5 sm:p-6">
                <h2 className="text-[1.45rem] font-semibold" style={{ color: '#4a1a8a' }}>Notifications</h2>
                <div className="mt-6 space-y-4">
                    {items.length === 0 ? (
                        <p className="text-sm text-[#a090c8]">No recent notifications.</p>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <span 
                                        className="mt-1.5 h-3 w-3 rounded-full shrink-0" 
                                        style={{ 
                                            background: item.type === 'error' ? '#FF4343' : 
                                                       item.type === 'warning' ? '#f5c000' : 
                                                       item.type === 'success' ? '#10B981' : '#B13BFF' 
                                        }} 
                                    />
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: '#4a1a8a' }}>{item.title}</p>
                                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#7a6aa0' }}>{item.message}</p>
                                    </div>
                                </div>
                                <p className="text-right text-[10px] whitespace-nowrap mt-1" style={{ color: '#a090c8' }}>
                                    {new Date(item.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </DashboardPanel>
        </motion.div>
    );
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────

export function AdminDashboard() {
    const [displayName, setDisplayName] = useState(() => {
        const stored = getStoredUser();
        const baseName = (stored as any)?.username || stored?.name || stored?.email || 'Admin';
        return String(baseName).includes("John Lloyd") ? "kurohara" : String(baseName).trim();
    });

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [stats, setStats] = useState({
        activeUsers: 0,
        publishedWebsites: 0,
        activeDomains: 0,
        pendingWebsites: 0,
        trends: {
            users: [0, 0, 0, 0, 0, 0, 0],
            websites: [0, 0, 0, 0, 0, 0, 0],
            domains: [0, 0, 0, 0, 0, 0, 0],
            pending: [0, 0, 0, 0, 0, 0, 0]
        }
    });
    const [loading, setLoading] = useState(true);

    const loadRealtimeData = async () => {
        try {
            const [notifRes, analyticsRes] = await Promise.all([
                Promise.resolve(getNotifications()),
                getAnalytics('7days')
            ]);

            setNotifications(notifRes.slice(0, 5));
            
            if (analyticsRes.success && analyticsRes.analytics) {
                const s = analyticsRes.analytics.summary || {};
                const t = analyticsRes.analytics.trends || {};
                
                // Final safety: normalize strings/numbers from backend
                const uCount = Number(s.activeUsers || 0);
                const wCount = Number(s.publishedWebsites || 0);
                const dCount = Number(s.activeDomains || 0);
                const pCount = Number(s.pendingWebsites || 0);

                // Simulation utility for brand new platforms
                const generateFallback = (finalValue: number, seed: number) => {
                    const base = [finalValue * 0.4, finalValue * 0.2, finalValue * 0.5, finalValue * 0.8, finalValue * 0.6, finalValue * 0.9, finalValue];
                    return base.map(v => Math.max(v, seed));
                };

                setStats({
                    activeUsers: uCount,
                    publishedWebsites: wCount,
                    activeDomains: dCount,
                    pendingWebsites: pCount,
                    trends: {
                        users: (t.users && t.users.some((v: any) => v > 0)) ? t.users : generateFallback(uCount, 2),
                        websites: (t.websites && t.websites.some((v: any) => v > 0)) ? t.websites : generateFallback(wCount, 1),
                        domains: (t.domains && t.domains.some((v: any) => v > 0)) ? t.domains : generateFallback(dCount, 1),
                        pending: (t.pending && t.pending.some((v: any) => v > 0)) ? t.pending : generateFallback(pCount, 0.5),
                    }
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRealtimeData();

        const onNotify = () => {
            loadRealtimeData();
        };

        window.addEventListener('notificationsUpdate', onNotify);
        window.addEventListener('notification:new_received', onNotify);
        
        return () => {
            window.removeEventListener('notificationsUpdate', onNotify);
            window.removeEventListener('notification:new_received', onNotify);
        };
    }, []);

    useEffect(() => {
        const updateFromStored = () => {
            const stored = getStoredUser();
            const baseName = (stored as any)?.username || stored?.name || stored?.email || 'Admin';
            setDisplayName(String(baseName).includes("John Lloyd") ? "kurohara" : String(baseName).trim());
        };

        window.addEventListener('userUpdate', updateFromStored);
        return () => window.removeEventListener('userUpdate', updateFromStored);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const syncUserName = async () => {
            try {
                const res = await getMe();
                if (!isMounted || !res.success || !res.user) return;
                
                // Get local state first to check for session overrides
                const local = getStoredUser();
                
                const updatedUser = {
                    ...res.user,
                    username: (local as any)?.username || (res.user as any).username,
                    avatar: local?.avatar || res.user.avatar
                };
                
                setStoredUser(updatedUser);
                const baseName = (updatedUser as any).username || updatedUser.name || updatedUser.email || 'Admin';
                setDisplayName(String(baseName).includes("John Lloyd") ? "kurohara" : String(baseName).trim());
            } catch { /* keep fallback */ }
        };
        syncUserName();
        return () => { isMounted = false; };
    }, []);

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="w-full px-4 pb-8 pt-4 sm:px-6 lg:px-6 lg:pb-10 lg:pt-6">
                <div className="flex flex-col gap-2">
                    <motion.h1
                        className="text-[2.65rem] font-extrabold leading-none tracking-[-0.05em] sm:text-[3.65rem]"
                        style={{ color: '#4a1a8a' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        Welcome,{' '}
                        <span style={{
                            background: 'linear-gradient(90deg, #7b1de8 0%, #b36760 52%, #f5a623 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            {displayName}!
                        </span>
                    </motion.h1>
                    <motion.p
                        className="text-sm font-medium sm:text-base"
                        style={{ color: '#7a6aa0' }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.08, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        Overview
                    </motion.p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { title: 'ACTIVE USERS', value: stats.activeUsers, trend: stats.trends.users },
                        { title: 'PUBLISHED WEBSITES', value: stats.publishedWebsites, trend: stats.trends.websites },
                        { title: 'ACTIVE DOMAINS', value: stats.activeDomains, trend: stats.trends.domains },
                        { title: 'PENDING WEBSITES', value: stats.pendingWebsites, trend: stats.trends.pending },
                    ].map((metric, index) => {
                        // Normalize raw trend counts (e.g. 0-5) to 0-100 scale for the chart
                        const max = Math.max(...metric.trend, 1);
                        const points = metric.trend.map(p => (p / max) * 100);
                        
                        return (
                            <DashboardStatCard
                                key={metric.title}
                                title={metric.title}
                                value={String(metric.value)}
                                liveLabel="Live"
                                series={[{ label: 'Platform Growth', color: '#B13BFF', points }]}
                                index={index}
                            />
                        );
                    })}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
                    <DashboardActivityPanel 
                        items={notifications.map(n => ({
                            title: n.title,
                            action: n.message,
                            meta: `By Admin • ${new Date(n.time).toLocaleDateString()}`
                        }))} 
                    />
                    <DashboardNotificationsPanel items={notifications} />
                </div>
            </div>
        </main>
    );
}