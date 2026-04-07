'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import { addNotification } from '@/lib/notifications';
import { useAdminLoading } from '../components/LoadingProvider';

/* ── icon helpers ─────────────────────────────────────────────── */
const ChevronRightIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const SearchIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

/* ── shared light-mode style atoms ───────────────────────────── */
const panel: React.CSSProperties = {
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(166,61,255,0.16)',
    boxShadow: '0 20px 50px rgba(103,2,191,0.12), 0 4px 12px rgba(103,2,191,0.04)',
    backdropFilter: 'blur(20px)',
};

/* ── DismissModal ─────────────────────────────────────────────── */
interface DismissModalProps { isOpen: boolean; onClose: () => void; onConfirm: () => void; site: string; }

const DismissModal: React.FC<DismissModalProps> = ({ isOpen, onClose, onConfirm, site }) => {
    if (!isOpen) return null;
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(200,185,245,0.45)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="w-full max-w-[560px] rounded-xl"
                    style={{ ...panel, border: '1px solid rgba(166,61,255,0.2)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-8 py-6" style={{ borderBottom: '1px solid rgba(166,61,255,0.14)' }}>
                        <h3 className="text-2xl font-semibold" style={{ color: '#471396' }}>Dismiss Report</h3>
                    </div>
                    <div className="space-y-6 px-8 py-6">
                        <p className="text-base leading-7" style={{ color: '#471396' }}>
                            Are you sure you want to dismiss this report for {site}? The report will be archived and no action will be taken.
                        </p>
                        <div className="flex items-center justify-end gap-6">
                            <motion.button 
                                whileTap={{ scale: 0.96 }}
                                type="button" onClick={onClose} className="text-base font-semibold" style={{ color: '#9A99AF' }}>Cancel</motion.button>
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                type="button"
                                onClick={() => { onConfirm(); onClose(); }}
                                className="rounded-2xl px-10 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center"
                                style={{ background: '#FF4343' }}
                            >
                                Dismiss
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

/* ── DetailsModal ─────────────────────────────────────────────── */
interface DetailsModalProps {
    isOpen: boolean; 
    onClose: () => void;
    data: { 
        id: string;
        site: string; 
        violationType: string; 
        severity: 'high' | 'medium' | 'low'; 
        reportedBy: string; 
        reportDate: string; 
        description: string;
        history: { date: string; action: string; user: string; }[];
    };
}

const DetailsModal: React.FC<DetailsModalProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    const severityMap = {
        high: { label: 'HIGH SEVERITY', color: '#FF4343', bg: 'rgba(255,67,67,0.08)', icon: '⚠️' },
        medium: { label: 'MEDIUM SEVERITY', color: '#FFCC00', bg: 'rgba(255,204,0,0.08)', icon: '⚡' },
        low: { label: 'LOW SEVERITY', color: '#10B981', bg: 'rgba(16,185,129,0.08)', icon: '🔍' },
    };

    const s = severityMap[data.severity];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                style={{ background: 'rgba(15,8,30,0.6)', backdropFilter: 'blur(8px)' }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col rounded-[32px] shadow-2xl"
                    style={{ ...panel, border: '1px solid rgba(166,61,255,0.25)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-10 py-8 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(166,61,255,0.12)' }}>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
                                {s.icon}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight" style={{ color: '#471396' }}>Report Case File</h3>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: '#471396' }}>Case ID: {data.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 rounded-xl text-[11px] font-black tracking-tighter" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
                                {s.label}
                            </div>
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-[#471396] opacity-50">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Left Side: General Info */}
                            <div className="space-y-8">
                                <div className="p-6 rounded-2xl bg-[rgba(166,61,255,0.03)] border border-[rgba(166,61,255,0.08)]">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A78BFA] mb-2">Subject Website</p>
                                    <h4 className="text-3xl font-black tracking-tight" style={{ color: '#4a1a8a' }}>{data.site}</h4>
                                    <button className="mt-3 text-xs font-bold flex items-center gap-2 text-[#B13BFF] hover:underline transition-all">
                                        Open Website Preview
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-5 rounded-2xl border border-[rgba(166,61,255,0.08)]">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#A78BFA] mb-1.5">Violation Type</p>
                                        <p className="text-sm font-black" style={{ color: '#4a1a8a' }}>{data.violationType}</p>
                                    </div>
                                    <div className="p-5 rounded-2xl border border-[rgba(166,61,255,0.08)]">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#A78BFA] mb-1.5">Report Date</p>
                                        <p className="text-sm font-black" style={{ color: '#4a1a8a' }}>{data.reportDate}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A78BFA]">Context & Evidence</p>
                                    <div className="p-6 rounded-2xl bg-white border border-[rgba(166,61,255,0.12)] shadow-sm">
                                        <p className="text-[14px] leading-relaxed font-medium" style={{ color: '#4a1a8a' }}>{data.description}</p>
                                        <p className="mt-4 text-[11px] font-bold flex items-center gap-2 text-[#7a6aa0]">
                                            <span className="opacity-50">Source:</span> {data.reportedBy}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Visual & History */}
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A78BFA]">Screenshot Evidence</p>
                                    <div className="aspect-video w-full rounded-2xl bg-[#f5f4ff] border-2 border-dashed border-[rgba(166,61,255,0.2)] flex flex-col items-center justify-center group overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[rgba(166,61,255,0.05)]" />
                                        <svg className="w-10 h-10 text-[#B13BFF] opacity-30 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="mt-3 text-[10px] font-bold uppercase text-[#B13BFF] opacity-50">Captured-view-0294.png</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A78BFA]">Action History</p>
                                    <div className="space-y-4">
                                        {data.history.map((h, i) => (
                                            <div key={i} className="flex gap-4 items-start">
                                                <div className="mt-1 h-3 w-3 rounded-full shrink-0 shadow-sm" style={{ background: i === 0 ? '#B13BFF' : '#E0E7FF', border: '2px solid white' }} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[13px] font-black" style={{ color: '#4a1a8a' }}>{h.action}</p>
                                                        <p className="text-[10px] font-bold text-[#A78BFA]">{h.date}</p>
                                                    </div>
                                                    <p className="text-[11px] font-bold opacity-60 mt-0.5" style={{ color: '#7a6aa0' }}>Triggered by: {h.user}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-10 py-8 bg-[#fdfcff]" style={{ borderTop: '1px solid rgba(166,61,255,0.12)' }}>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="flex-1 min-w-[160px] py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                                style={{ background: '#10B981', color: 'white' }}
                                onClick={() => { addNotification("Site Approved", `The site ${data.site} has been approved and report cleared.`, 'success'); onClose(); }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Approve Site
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="flex-1 min-w-[160px] py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                                style={{ background: '#FFCC00', color: '#1a1a1a' }}
                                onClick={() => { addNotification("Report Rejected", `Case for ${data.site} rejected. Further info requested.`, 'warning'); onClose(); }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                Reject Case
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="flex-1 min-w-[160px] py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                                style={{ background: '#FF4343', color: 'white' }}
                                onClick={() => { addNotification("Website Banned", `${data.site} has been permanently banned from the platform.`, 'error'); onClose(); }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                Ban Website
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

/* ── Board ────────────────────────────────────────────────────── */
function ModerationComplianceBoard() {
    const { startLoading } = useAdminLoading();
    const [tab, setTab] = useState<'reports' | 'records'>('reports');
    const [searchQuery, setSearchQuery] = useState('');
    const [showDismissModal, setShowDismissModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [currentSite, setCurrentSite] = useState('example-site.com');

    const tabLabel = tab === 'reports' ? 'Reports' : 'Records';
    const filteredLabel = searchQuery.trim() ? `Results for "${searchQuery.trim()}"` : tabLabel;

    const stats = useMemo(() => {
        if (tab === 'reports') return [{ label: 'NEW REPORTS', value: '56' }, { label: 'HIGH PRIORITY', value: '7' }, { label: 'RESOLVED', value: '10' }];
        return [{ label: 'REMOVALS', value: '142' }, { label: 'RESTORED', value: '28' }, { label: 'AUDITED', value: '89' }];
    }, [tab]);

    const initialReports = [
        {
            id: 'RPT-8821',
            site: 'luxury-watches-replica.com',
            violationType: 'Copyright Violation',
            severity: 'high' as const,
            reportedBy: 'legal@rolex-protectx.com',
            reportDate: 'April 05, 2026',
            description: 'Unauthorized distribution of proprietary brand assets, trademarked marketing materials, and counterfeit high-end horology products.',
            history: [
                { date: '2026-04-05 10:00', action: 'Report received', user: 'External IP' },
                { date: '2026-04-05 10:15', action: 'Auto-flagged for high severity', user: 'AI-Moderator' }
            ]
        },
        {
            id: 'RPT-9012',
            site: 'quick-cash-now.net',
            violationType: 'Phishing Attempt',
            severity: 'medium' as const,
            reportedBy: 'security-scan@mercato.com',
            reportDate: 'April 06, 2026',
            description: 'Suspicious login forms detected matching known banking phishing templates. Potential harvesting of user credentials.',
            history: [
                { date: '2026-04-06 09:30', action: 'Bot scan completed', user: 'Security Bot' }
            ]
        },
        {
            id: 'RPT-9045',
            site: 'trending-blog-agg.io',
            violationType: 'Spam / Low Quality',
            severity: 'low' as const,
            reportedBy: 'user-7821@gmail.com',
            reportDate: 'April 06, 2026',
            description: 'Site is generating thousands of low-quality AI articles per day with misleading titles to farm ad revenue.',
            history: [
                { date: '2026-04-06 11:00', action: 'User report received', user: 'Community' }
            ]
        }
    ];

    const [currentReport, setCurrentReport] = useState(initialReports[0]);

    const handleView = (rpt: typeof initialReports[0]) => { 
        setCurrentReport(rpt); 
        setCurrentSite(rpt.site);
        setShowDetailsModal(true); 
    };

    const handleDismiss = () => {
        addNotification("Report Dismissed", `Dismissed report for ${currentSite}. No action taken.`, 'success');
    };

    const severityStyles = {
        high: { color: '#FF4343', bg: '#FF4343' },
        medium: { color: '#FFCC00', bg: '#FFCC00' },
        low: { color: '#10B981', bg: '#10B981' },
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-2">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="mb-1 text-3xl font-bold sm:text-4xl" style={{ color: '#7b1de8' }}>Moderation &amp; Compliance</h1>
                        <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: '#a78bfa' }}>
                            <span>Moderation &amp; Compliance</span>
                            <ChevronRightIcon />
                            <span className="font-semibold" style={{ color: '#7b1de8' }}>{tabLabel}</span>
                        </div>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-3">
                        <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: '#FFCC00', color: '#232323' }}>Auto-review on</div>
                        <div className="rounded-full border px-3 py-1 text-xs" style={{ border: '1px solid rgba(138,134,164,0.35)', color: '#8A86A4' }}>Last sync 2 min ago</div>
                    </motion.div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                {/* Stat cards */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {stats.map((item, idx) => (
                        <motion.div
                            key={item.label}
                            className="rounded-[28px] p-6 sm:p-7 relative overflow-hidden"
                            style={panel}
                            whileHover={{ y: -4, scale: 1.01 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="text-5xl font-bold leading-none" style={{ color: '#4a1a8a' }}>{item.value}</div>
                                    <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4a1a8a', opacity: 0.7 }}>{item.label}</div>
                                </div>
                                <div className="rounded-full bg-[rgba(103,2,191,0.06)] px-3 py-1.5 text-[10px] font-black text-[#B13BFF] border border-[rgba(166,61,255,0.1)]">
                                    {(() => {
                                        const values = [52, 54, 55, 50, 58, 56];
                                        const curr = Number(item.value);
                                        const prev = values[idx % values.length];
                                        const pct = ((curr - prev) / prev) * 100;
                                        return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% since yesterday`;
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Tabs + search */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-1 rounded-xl p-1 relative" style={{ border: '1px solid rgba(166,61,255,0.2)', background: 'rgba(255,255,255,0.7)' }}>
                        {(['reports', 'records'] as const).map((t) => (
                            <motion.button
                                key={t}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => {
                                    if (t === tab) return;
                                    startLoading();
                                    setTab(t);
                                }}
                                className={`relative min-w-[132px] rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                                    tab === t ? 'text-[#471396]' : 'text-[#66607E] hover:text-[#471396]'
                                }`}
                            >
                                {tab === t && (
                                    <motion.div
                                        layoutId="moderationTabBackground"
                                        className="absolute inset-0 rounded-lg bg-[#FFCC00] shadow-sm"
                                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                    />
                                )}
                                <span className="relative z-10">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                            </motion.button>
                        ))}
                    </div>

                    <div className="relative flex-1 min-w-[17rem]">
                        <input
                            aria-label="Search websites"
                            placeholder="Search websites"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 w-full rounded-2xl pl-12 pr-4 text-sm font-medium outline-none"
                            style={{ background: 'rgba(248,245,255,0.9)', border: '1.5px solid rgba(166,61,255,0.16)', color: '#471396' }}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <motion.div 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="flex items-center justify-center text-[#FFB800]">
                                <SearchIcon className="h-5 w-5" />
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Main table */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                    className="overflow-hidden rounded-[40px] p-10"
                    style={panel}
                >
                    <div className="min-h-[350px]">
                        <AnimatePresence mode="wait">
                            {tab === 'reports' && (
                                <motion.div key="reports" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                                    <h3 className="mb-8 text-3xl font-black tracking-tight" style={{ color: '#471396' }}>Active Reports</h3>
                                    <div className="mb-6 text-sm font-bold uppercase tracking-widest opacity-50" style={{ color: '#8A86A4' }}>{filteredLabel}</div>
                                    <div className="space-y-4">
                                        {initialReports.map((rpt) => (
                                            <motion.div
                                                key={rpt.id}
                                                whileHover={{ x: 4 }}
                                                className="flex items-center justify-between rounded-2xl px-8 py-6 group transition-all"
                                                style={{ background: 'rgba(246,243,255,0.7)', border: '1px solid rgba(166,61,255,0.1)' }}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-1 rounded-full shrink-0" style={{ background: severityStyles[rpt.severity].bg }} />
                                                    <div>
                                                        <p className="text-xl font-black tracking-tight" style={{ color: '#471396' }}>{rpt.site}</p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <p className="text-sm font-bold opacity-60" style={{ color: '#8A86A4' }}>{rpt.violationType}</p>
                                                            <div className="h-1 w-1 rounded-full bg-gray-300" />
                                                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: severityStyles[rpt.severity].color }}>{rpt.severity}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <motion.button 
                                                        whileTap={{ scale: 0.94 }}
                                                        type="button" onClick={() => handleView(rpt)} className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition" style={{ color: '#471396', border: '1.5px solid rgba(166,61,255,0.2)' }}>Inspect</motion.button>
                                                    <motion.button 
                                                        whileTap={{ scale: 0.94 }}
                                                        type="button" onClick={() => { setCurrentSite(rpt.site); setShowDismissModal(true); }} className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white transition shadow-sm" style={{ background: '#FF4343' }}>Dismiss</motion.button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                            {tab === 'records' && (
                                <motion.div key="records" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                                    <h3 className="mb-6 text-2xl font-bold" style={{ color: '#471396' }}>Compliance History</h3>
                                    <div className="mb-6 text-sm font-bold opacity-50" style={{ color: '#8A86A4' }}>{filteredLabel}</div>
                                    <div className="space-y-4">
                                        <div className="rounded-2xl px-8 py-6" style={{ background: 'rgba(240,235,255,0.6)', border: '1px solid rgba(166,61,255,0.09)' }}>
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-1.5 rounded-full" style={{ background: '#10B981' }} />
                                                <div>
                                                    <p className="text-xl font-bold" style={{ color: '#471396' }}>example-site.com</p>
                                                    <p className="text-sm opacity-70" style={{ color: '#8A86A4' }}>Action: Removed • By: Admin user on 2026-01-28</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>

            <DismissModal isOpen={showDismissModal} onClose={() => setShowDismissModal(false)} onConfirm={handleDismiss} site={currentSite} />
            <DetailsModal 
                isOpen={showDetailsModal} 
                onClose={() => setShowDetailsModal(false)} 
                data={currentReport}
            />
        </motion.div>
    );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function ModerationCompliancePage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="admin-dashboard-shell flex h-screen overflow-hidden" suppressHydrationWarning>
            <AdminSidebar forcedActiveItemId="moderation" />
            <AnimatePresence>
                {sidebarOpen && (
                    <div className="lg:hidden">
                        <AdminSidebar mobile onClose={() => setSidebarOpen(false)} forcedActiveItemId="moderation" />
                    </div>
                )}
            </AnimatePresence>
            <div className="flex min-h-0 flex-1 flex-col">
                <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 min-h-0 overflow-y-auto">
                    <div className="px-8 pt-8 pb-32"><ModerationComplianceBoard /></div>
                </main>
            </div>
        </div>
    );
}