'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    getMe,
    getStoredUser,
    setStoredUser,
    getAnalytics,
    type User 
} from '@/lib/api';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
    ADMIN_CHART_SERIES,
    ADMIN_STATS,
} from '@/lib/config/adminDashboardMocks';
import { getNotifications, type NotificationItem } from '@/lib/notifications';
import { formatToPHTime, formatToPHTimeShort } from '@/lib/dateUtils';
import { useAdminLoading } from './LoadingProvider';

// ─── DashboardPanel ──────────────────────────────────────────────────────────

function DashboardPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <section
            className={`rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm ${className}`.trim()}
        >
            {children}
        </section>
    );
}

// ─── DashboardLineChart ──────────────────────────────────────────────────────

type ChartSeriesItem = { label: string; color: string; points: readonly number[] };

const CW = 240, CH = 110, LP = 28, RP = 10, TP = 12, BP = 26;
const CHART_TEXT_COLOR = 'rgba(71, 85, 105, 0.75)';

function toPoints(points: readonly number[], maxValue: number) {
    if (points.length === 0) return '';
    return points
        .map((p, i) => {
            const x = LP + i * ((CW - LP - RP) / Math.max(points.length - 1, 1));
            const y = TP + ((maxValue - p) / maxValue) * (CH - TP - BP);
            return `${x},${y}`;
        })
        .join(' ');
}

function DashboardLineChart({ series }: { series: readonly ChartSeriesItem[] }) {
    const dataMax = Math.max(...series.flatMap((s) => s.points), 1);
    // Round up the max to the next nice increment (e.g. 5, 10, 50, 100)
    const getNiceMax = (m: number) => {
        if (m <= 5) return 5;
        if (m <= 10) return 10;
        if (m <= 25) return 25;
        if (m <= 50) return 50;
        if (m <= 100) return 100;
        return Math.ceil(m / 50) * 50;
    };
    const roundedMax = getNiceMax(dataMax);
    const intervals = [0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => Math.round(v * roundedMax));

    return (
        <div className="mt-4">
            <svg viewBox={`0 0 ${CW} ${CH}`} className="h-[7.2rem] w-full">
                {/* Horizontal reference lines */}
                {intervals.map((v) => {
                    const y = TP + ((roundedMax - v) / roundedMax) * (CH - TP - BP);
                    return (
                        <g key={v}>
                            <line x1={LP} y1={y} x2={CW - RP} y2={y} stroke="rgba(148, 163, 184, 0.28)" strokeWidth="1" />
                            <text x={8} y={y + 3} fontSize="8" fill={CHART_TEXT_COLOR}>{v}</text>
                        </g>
                    );
                })}

                {/* Vertical guides at start and end points (Half-lines) */}
                <line x1={LP} y1={TP} x2={LP} y2={CH - BP} stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1" strokeDasharray="3,3" />
                <line x1={CW - RP} y1={TP} x2={CW - RP} y2={CH - BP} stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1" strokeDasharray="3,3" />

                <line x1={LP} y1={CH - BP} x2={CW - RP} y2={CH - BP} stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1" />
                
                {series.map((item) => (
                    <g key={item.label}>
                        <polyline fill="none" stroke={item.color} strokeWidth="1.8" points={toPoints(item.points, roundedMax)} />
                        {item.points.map((p, i) => {
                            const x = LP + i * ((CW - LP - RP) / Math.max(item.points.length - 1, 1));
                            const y = TP + ((roundedMax - p) / roundedMax) * (CH - TP - BP);
                            return <circle key={`${item.label}-${i}`} cx={x} cy={y} r="2.8" fill="#FFFFFF" stroke={item.color} strokeWidth="2" />;
                        })}
                    </g>
                ))}
                <text x={LP} y={CH - 9} fontSize="7" fontWeight="bold" fill={CHART_TEXT_COLOR} textAnchor="start">7 DAYS AGO</text>
                <text x={CW - RP} y={CH - 9} fontSize="7" fontWeight="bold" fill={CHART_TEXT_COLOR} textAnchor="end">TODAY</text>
            </svg>
            <div className="mt-1 flex items-center justify-center gap-4 text-[10px] text-slate-500">
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
    const points = series[0]?.points || [];
    const calculateChange = (pts: readonly number[]) => {
        if (pts.length < 2) return { value: '0.0%', isIncrease: true, isNeutral: true };
        const curr = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        if (prev === 0) return { value: curr > 0 ? '+100%' : '0.0%', isIncrease: curr > 0, isNeutral: curr === 0 };
        const pct = ((curr - prev) / prev) * 100;
        return {
            value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
            isIncrease: pct >= 0,
            isNeutral: pct === 0
        };
    };
    const change = calculateChange(points);

    return (
        <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.08 * index, ease: [0.22, 0.84, 0.25, 1] }}
        >
            <DashboardPanel className="p-5 sm:p-6 overflow-hidden group">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <p className="text-[2.1rem] font-bold leading-none tracking-tight text-slate-900">{value}</p>
                            {!change.isNeutral && (
                                <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    change.isIncrease 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : 'bg-rose-50 text-rose-700'
                                }`}>
                                    {change.isIncrease ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                                    {change.value}
                                </div>
                            )}
                        </div>
                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">{title}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            {liveLabel}
                        </span>
                    </div>
                </div>
                
                <DashboardLineChart series={series} />

                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-widest text-slate-500">Weekly Momentum</span>
                    <span className="whitespace-nowrap text-[9px] font-medium text-slate-400">Compared to last week</span>
                </div>
            </DashboardPanel>
        </motion.div>
    );
}

// ─── DashboardActivityPanel ──────────────────────────────────────────────────

function DashboardActivityPanel({ items }: { items: readonly { id: string; title: string; action: string; meta: string }[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.28, ease: [0.22, 0.84, 0.25, 1] }}
        >
            <DashboardPanel className="h-[22rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[1.3rem] font-semibold text-slate-900">Recent User Actions</h2>
                    <button type="button" suppressHydrationWarning className="text-xs text-slate-500 transition-opacity hover:opacity-70">
                        View audit log
                    </button>
                </div>
                <div
                    className="mt-5 h-[calc(100%-3.2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4"
                >
                    <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                            <div className="w-1 shrink-0 rounded-full bg-amber-400" />
                            <div className="min-w-0">
                                <p className="text-base font-semibold text-slate-900">{item.title}</p>
                                <p className="mt-1 text-sm text-slate-600">{item.action}</p>
                                <p className="text-sm text-slate-400">{item.meta}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            </DashboardPanel>
        </motion.div>
    );
}

// ─── DashboardNotificationsPanel ─────────────────────────────────────────────

function DashboardNotificationsPanel({ items }: { items: NotificationItem[] }) {
    const { startLoading } = useAdminLoading();
    const typeDotClass: Record<string, string> = {
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        success: 'bg-emerald-500',
        info: 'bg-sky-500',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.44, delay: 0.34, ease: [0.22, 0.84, 0.25, 1] }}
        >
            <DashboardPanel className="h-[22rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[1.3rem] font-semibold text-slate-900">Notifications</h2>
                    <Link
                        href="/admindashboard/notifications"
                        onClick={() => startLoading()}
                        className="text-xs font-semibold text-slate-500 transition-opacity hover:opacity-70"
                    >
                        View all notifications
                    </Link>
                </div>
                <div className="mt-6 h-[calc(100%-3.4rem)] space-y-4 overflow-y-auto pr-1">
                    {items.length === 0 ? (
                        <p className="text-sm text-slate-500">No recent notifications.</p>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2.5">
                                <div className="flex items-start gap-4">
                                    <span 
                                        className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${typeDotClass[item.type] || 'bg-slate-400'}`}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{item.message}</p>
                                    </div>
                                </div>
                                <p className="mt-1 whitespace-nowrap text-right text-[10px] text-slate-400">
                                    {formatToPHTimeShort(item.time)}
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
    const { startLoading } = useAdminLoading();
    const [displayName, setDisplayName] = useState('Admin');

    useEffect(() => {
        const stored = getStoredUser();
        if (stored) {
            const baseName = (stored as any)?.username || stored?.name || stored?.email || 'Admin';
            setDisplayName(String(baseName).includes("John Lloyd") ? "kurohara" : String(baseName).trim());
        }
    }, []);

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [stats, setStats] = useState({
        activeUsers: 0,
        publishedWebsites: 0,
        activeDomains: 0,
        pendingWebsites: 0,
        trends: {
            users: [0, 0, 0, 0, 0, 0, 0],
            maxActiveUsers: [0, 0, 0, 0, 0, 0, 0],
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

                setStats({
                    activeUsers: uCount,
                    publishedWebsites: wCount,
                    activeDomains: dCount,
                    pendingWebsites: pCount,
                    trends: {
                        users: (t.users && t.users.some((v: any) => v > 0)) ? t.users : new Array(7).fill(uCount),
                        maxActiveUsers: (t.maxActiveUsers && t.maxActiveUsers.some((v: any) => v > 0)) ? t.maxActiveUsers : new Array(7).fill(Math.ceil(uCount * 1.4)),
                        websites: (t.websites && t.websites.some((v: any) => v > 0)) ? t.websites : new Array(7).fill(wCount),
                        domains: (t.domains && t.domains.some((v: any) => v > 0)) ? t.domains : new Array(7).fill(dCount),
                        pending: new Array(7).fill(pCount),
                    }
                });
            }
        } catch (error) {
            console.error('[Dashboard] Failed to load realtime data:', error);
            // Non-fatal error: dashboard will just show zeros/fallbacks
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
            <div className="w-full px-4 pb-24 pt-4 sm:px-6 lg:px-6 lg:pb-32 lg:pt-6">
                <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 px-5 py-6 shadow-[0_10px_32px_rgba(15,23,42,0.06)] sm:px-7">
                <div className="flex flex-col gap-2">
                    <motion.h1
                        className="text-[2.45rem] font-bold leading-none tracking-[-0.04em] text-slate-900 sm:text-[3.35rem]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        Welcome,{' '}
                        <span className="bg-gradient-to-r from-slate-900 via-sky-700 to-emerald-700 bg-clip-text text-transparent">
                            {displayName}!
                        </span>
                    </motion.h1>
                    <motion.p
                        className="text-sm font-medium text-slate-600 sm:text-base"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.08, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        A clean snapshot of platform health and live activity.
                    </motion.p>
                </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { 
                            title: 'ACTIVE USERS', 
                            value: stats.activeUsers, 
                            trend: stats.trends.users,
                            maxTrend: stats.trends.maxActiveUsers,
                            series: [
                                { label: 'Peak Active Users', color: '#0f172a', points: stats.trends.maxActiveUsers },
                                { label: 'Actual Active Users', color: '#0ea5e9', points: stats.trends.users }
                            ]
                        },
                        { title: 'PUBLISHED WEBSITES', value: stats.publishedWebsites, trend: stats.trends.websites },
                        { title: 'ACTIVE DOMAINS', value: stats.activeDomains, trend: stats.trends.domains },
                        { title: 'PENDING WEBSITES', value: stats.pendingWebsites, trend: stats.trends.pending },
                    ].map((metric, index) => (
                        <DashboardStatCard
                            key={metric.title}
                            title={metric.title}
                            value={String(metric.value)}
                            liveLabel="Live"
                            series={metric.series || [{ label: 'Platform Growth', color: '#475569', points: metric.trend }]}
                            index={index}
                        />
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
                    <DashboardActivityPanel 
                        items={notifications.map(n => ({
                            id: n.id,
                            title: n.title,
                            action: n.message,
                            meta: `By ${n.adminName || 'Admin'} • ${formatToPHTime(n.time)}`
                        }))} 
                    />
                    <DashboardNotificationsPanel items={notifications} />
                </div>
            </div>
        </main>
    );
}

export default AdminDashboard;
