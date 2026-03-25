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

const SearchIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <button type="button" onClick={onClose} className="text-base font-semibold" style={{ color: '#9A99AF' }}>Cancel</button>
                            <button
                                type="button"
                                onClick={() => { onConfirm(); onClose(); }}
                                className="rounded-2xl px-10 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
                                style={{ background: '#FF4343' }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

/* ── DetailsModal ─────────────────────────────────────────────── */
interface DetailsModalProps {
    isOpen: boolean; onClose: () => void;
    data: { site: string; violationType?: string; priority?: string; reportedBy?: string; reportDate?: string; description?: string; };
}

const DetailsModal: React.FC<DetailsModalProps> = ({ isOpen, onClose, data }) => {
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
                    className="w-full max-w-[820px] rounded-xl"
                    style={{ ...panel, border: '1px solid rgba(166,61,255,0.2)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-8 py-6" style={{ borderBottom: '1px solid rgba(166,61,255,0.14)' }}>
                        <h3 className="text-2xl font-semibold" style={{ color: '#471396' }}>Report Details</h3>
                    </div>
                    <div className="space-y-6 px-8 py-7">
                        <div>
                            <p className="text-sm font-medium" style={{ color: '#8A86A4' }}>Website</p>
                            <p className="mt-1 text-2xl font-semibold leading-tight" style={{ color: '#471396' }}>{data.site}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#8A86A4' }}>Violation Type</p>
                                <p className="mt-1 text-xl font-semibold" style={{ color: '#471396' }}>{data.violationType || 'Copyright Violation'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#8A86A4' }}>Priority</p>
                                <p className="mt-1 text-xl font-semibold uppercase tracking-[0.3em]" style={{ color: '#FF4343' }}>{data.priority || 'HIGH'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#8A86A4' }}>Reported By</p>
                                <p className="mt-1 text-xl font-semibold" style={{ color: '#471396' }}>{data.reportedBy || 'report@cms.com'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#8A86A4' }}>Report Date</p>
                                <p className="mt-1 text-xl font-semibold" style={{ color: '#471396' }}>{data.reportDate || 'January 28, 2026'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: '#8A86A4' }}>Report Details</p>
                            <p className="mt-2 max-w-[96%] text-base leading-7" style={{ color: '#471396' }}>
                                {data.description || 'This website has been reported for copyright violation. The content appears to contain unauthorized use of copyrighted material without proper licensing or attribution.'}
                            </p>
                        </div>
                    </div>
                    <div className="px-8 pb-8">
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-2xl px-10 py-3 text-base font-semibold transition-opacity hover:opacity-90"
                                style={{ background: '#FFCC00', color: '#1F1F1F' }}
                            >
                                Close
                            </button>
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
        return [{ label: 'REMOVALS', value: '56' }, { label: 'RESTORED', value: '7' }, { label: 'AUDITED', value: '10' }];
    }, [tab]);

    const handleView = (site: string) => { setCurrentSite(site); setShowDetailsModal(true); };
    const handleDismiss = () => {
        addNotification("Report Dismissed", `Dismissed report for ${currentSite}. No action taken.`, 'success');
        console.log('Dismissed:', currentSite);
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
                                    <div className="text-5xl font-bold leading-none" style={{ color: '#c89000' }}>{item.value}</div>
                                    <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#471396' }}>{item.label}</div>
                                </div>
                                <div className="rounded-full bg-[rgba(103,2,191,0.08)] px-3 py-1 text-[10px] font-bold text-[#B13BFF]">
                                    {(() => {
                                        // Mocking some growth for compliance since it's not in the main analytics trends yet
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
                    <div className="flex gap-1 rounded-xl p-1" style={{ border: '1px solid rgba(166,61,255,0.2)', background: 'rgba(255,255,255,0.7)' }}>
                        {(['reports', 'records'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    if (t === tab) return;
                                    startLoading();
                                    setTab(t);
                                }}
                                className="min-w-[132px] rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors"
                                style={tab === t ? { background: '#FFCC00', color: '#471396' } : { color: '#66607E' }}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>

                    <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-full" style={{ background: '#FFCC00', color: '#471396' }} aria-label="Search">
                        <SearchIcon />
                    </button>

                    <input
                        aria-label="Search websites"
                        placeholder="Search websites"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 min-w-[17rem] flex-1 rounded-2xl px-4 text-sm font-medium outline-none"
                        style={{ background: 'rgba(248,245,255,0.9)', border: '1.5px solid rgba(166,61,255,0.16)', color: '#471396' }}
                    />
                </div>

                {/* Main table */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                    className="overflow-hidden rounded-[32px] p-8"
                    style={panel}
                >
                    <div className="min-h-[350px]">
                        <AnimatePresence mode="wait">
                            {tab === 'reports' && (
                                <motion.div key="reports" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                                    <h3 className="mb-6 text-2xl font-semibold" style={{ color: '#471396' }}>Reports</h3>
                                    <div className="mb-6 text-sm" style={{ color: '#8A86A4' }}>{filteredLabel}</div>
                                    <div
                                        className="flex items-center justify-between rounded-2xl px-6 py-5"
                                        style={{ background: 'rgba(240,235,255,0.6)', border: '1px solid rgba(166,61,255,0.09)' }}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="h-20 w-[4px] rounded-full" style={{ background: '#FFCC00' }} />
                                            <div>
                                                <p className="text-2xl font-semibold" style={{ color: '#471396' }}>example-site.com</p>
                                                <p className="text-base" style={{ color: '#8A86A4' }}>Copyright Violation</p>
                                                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.35em]" style={{ color: '#FF4343' }}>HIGH</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5">
                                            <button type="button" onClick={() => handleView('example-site.com')} className="text-lg font-medium" style={{ color: '#471396' }}>View</button>
                                            <button type="button" onClick={() => { setCurrentSite('example-site.com'); setShowDismissModal(true); }} className="rounded-xl px-6 py-2.5 text-base font-semibold text-white" style={{ background: '#FF4343' }}>Dismiss</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {tab === 'records' && (
                                <motion.div key="records" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                                    <h3 className="mb-6 text-2xl font-semibold" style={{ color: '#471396' }}>Records</h3>
                                    <div className="mb-6 text-sm" style={{ color: '#8A86A4' }}>{filteredLabel}</div>
                                    <div className="rounded-2xl px-6 py-5" style={{ background: 'rgba(240,235,255,0.6)', border: '1px solid rgba(166,61,255,0.09)' }}>
                                        <div className="flex items-center gap-5">
                                            <div className="h-20 w-[4px] rounded-full" style={{ background: '#FFCC00' }} />
                                            <div>
                                                <p className="text-2xl font-semibold" style={{ color: '#471396' }}>example-site.com</p>
                                                <p className="text-base" style={{ color: '#8A86A4' }}>Action: Removed</p>
                                                <p className="text-base" style={{ color: '#8A86A4' }}>By: Admin user on 2026-01-28</p>
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
            <DetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} data={{ site: currentSite, violationType: 'Copyright Violation', priority: 'HIGH', reportedBy: 'report@cms.com', reportDate: 'January 28, 2026', description: 'This website has been reported for copyright violation. The content appears to contain unauthorized use of copyrighted material without proper licensing or attribution.' }} />
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