'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { X, TrendingUp, TrendingDown, ShoppingCart, CreditCard, CheckCircle, AlertCircle, ArrowRight, Package } from 'lucide-react';

interface CheckoutStep {
    step: string;
    visitors: number;
    dropOff: number;
    dropOffRate: number;
    avgTimeSpent: string;
}

interface CheckoutData {
    totalInitiated: number;
    totalCompleted: number;
    conversionRate: number;
    abandonmentRate: number;
    avgOrderValue: number;
    recoveredCarts: number;
    growth: number;
    steps: CheckoutStep[];
    paymentMethods: Array<{ method: string; count: number; percentage: number }>;
    abandonReasons: Array<{ reason: string; percentage: number }>;
    hourlyCheckouts: Array<{ hour: string; completed: number; abandoned: number }>;
}

interface AnalyticsData {
    revenue: {
        total: number;
        growth: number;
        monthly: Array<{ month: string; revenue: number }>;
    };
    orders: {
        total: number;
        growth: number;
        status: {
            pending: number;
            processing: number;
            shipped: number;
            delivered: number;
            cancelled: number;
        };
    };
    customers: {
        total: number;
        new: number;
        returning: number;
        growth: number;
    };
    products: {
        total: number;
        topSelling: Array<{ name: string; sales: number; revenue: number }>;
        lowStock: number;
    };
    traffic: {
        total: number;
        unique: number;
        bounce: number;
        sources: Array<{ source: string; visitors: number; percentage: number }>;
    };
    checkouts: CheckoutData;
}

const emptyAnalyticsData: AnalyticsData = {
    revenue: { total: 0, growth: 0, monthly: [] },
    orders: {
        total: 0, growth: 0,
        status: { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
    },
    customers: { total: 0, new: 0, returning: 0, growth: 0 },
    products: { total: 0, topSelling: [], lowStock: 0 },
    traffic: { total: 0, unique: 0, bounce: 0, sources: [] },
    checkouts: {
        totalInitiated: 0,
        totalCompleted: 0,
        conversionRate: 0,
        abandonmentRate: 0,
        avgOrderValue: 0,
        recoveredCarts: 0,
        growth: 0,
        steps: [
            { step: 'Cart View', visitors: 0, dropOff: 0, dropOffRate: 0, avgTimeSpent: '0s' },
            { step: 'Contact Info', visitors: 0, dropOff: 0, dropOffRate: 0, avgTimeSpent: '0s' },
            { step: 'Shipping', visitors: 0, dropOff: 0, dropOffRate: 0, avgTimeSpent: '0s' },
            { step: 'Payment', visitors: 0, dropOff: 0, dropOffRate: 0, avgTimeSpent: '0s' },
            { step: 'Confirmation', visitors: 0, dropOff: 0, dropOffRate: 0, avgTimeSpent: '0s' },
        ],
        paymentMethods: [],
        abandonReasons: [],
        hourlyCheckouts: [],
    }
};

import { AreaChart } from '../components/analytics/AreaChart';
import { FunnelChart } from '../components/analytics/FunnelChart';
import { MetricCard } from '../components/analytics/MetricCard';
import { RadialProgressChart } from '../components/analytics/RadialProgressChart';

type ModalType = 'revenue' | 'orders' | 'customers' | 'traffic' | 'newCustomers' | 'returningCustomers' | 'uniqueVisitors' | 'bounceRate' | 'checkouts' | 'checkoutConversion' | 'checkoutAbandonment' | 'recoveredCarts';

interface MetricDetails {
    title: string;
    value: string;
    growth: number;
    icon: React.ReactNode;
    details: { label: string; value: string | number }[];
    chart?: React.ReactNode;
}

// ─── Checkout Funnel Step Bar ───────────────────────────────────────────────
function CheckoutFunnelBar({ steps, colors, theme }: { steps: CheckoutStep[]; colors: any; theme: string }) {
    const maxVisitors = steps[0]?.visitors || 1;
    const stepColors = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#10b981'];

    if (steps.every(s => s.visitors === 0)) {
        return (
            <div className="h-[180px] rounded-xl border flex items-center justify-center text-sm"
                style={{ borderColor: colors.border.faint, color: colors.text.muted, backgroundColor: colors.bg.elevated }}>
                No checkout data yet for this period.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {steps.map((step, i) => {
                const widthPct = maxVisitors > 0 ? (step.visitors / maxVisitors) * 100 : 0;
                return (
                    <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium" style={{ color: colors.text.secondary }}>{step.step}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs" style={{ color: colors.text.muted }}>{step.avgTimeSpent}</span>
                                {step.dropOffRate > 0 && (
                                    <span className="text-xs font-medium" style={{ color: '#ef4444' }}>
                                        -{step.dropOffRate}%
                                    </span>
                                )}
                                <span className="text-xs font-semibold w-12 text-right" style={{ color: colors.text.primary }}>
                                    {step.visitors.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="relative h-7 rounded-md overflow-hidden" style={{ backgroundColor: colors.bg.elevated }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${widthPct}%` }}
                                transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                                className="absolute inset-y-0 left-0 rounded-md flex items-center px-2"
                                style={{ backgroundColor: stepColors[i] + '30', borderLeft: `3px solid ${stepColors[i]}` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Payment Methods Bar ────────────────────────────────────────────────────
function PaymentMethodsChart({ methods, colors }: { methods: CheckoutData['paymentMethods']; colors: any }) {
    const methodColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    if (methods.length === 0) {
        return (
            <div className="h-[80px] rounded-xl border flex items-center justify-center text-sm"
                style={{ borderColor: colors.border.faint, color: colors.text.muted, backgroundColor: colors.bg.elevated }}>
                No payment data available yet.
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            {methods.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: methodColors[i % methodColors.length] }} />
                    <div className="flex-1">
                        <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium" style={{ color: colors.text.secondary }}>{m.method}</span>
                            <span className="text-xs" style={{ color: colors.text.muted }}>{m.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: colors.border.faint }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${m.percentage}%` }}
                                transition={{ duration: 0.6, delay: i * 0.08 }}
                                className="h-1.5 rounded-full"
                                style={{ backgroundColor: methodColors[i % methodColors.length] }}
                            />
                        </div>
                    </div>
                    <span className="text-xs w-8 text-right font-medium" style={{ color: colors.text.primary }}>{m.count}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Hourly Checkout Heatmap ────────────────────────────────────────────────
function HourlyChart({ hourly, colors, theme }: { hourly: CheckoutData['hourlyCheckouts']; colors: any; theme: string }) {
    if (hourly.length === 0) {
        return (
            <div className="h-[80px] rounded-xl border flex items-center justify-center text-sm"
                style={{ borderColor: colors.border.faint, color: colors.text.muted, backgroundColor: colors.bg.elevated }}>
                No hourly data available yet.
            </div>
        );
    }
    const maxVal = Math.max(...hourly.map(h => h.completed + h.abandoned), 1);
    return (
        <div className="flex items-end gap-1 h-16">
            {hourly.map((h, i) => {
                const total = h.completed + h.abandoned;
                const heightPct = (total / maxVal) * 100;
                const completedPct = total > 0 ? (h.completed / total) * 100 : 0;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                        <div className="w-full rounded-sm overflow-hidden flex flex-col-reverse" style={{ height: `${Math.max(heightPct, 4)}%`, minHeight: 4, backgroundColor: colors.bg.elevated }}>
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${completedPct}%` }}
                                transition={{ duration: 0.5, delay: i * 0.02 }}
                                className="w-full bg-emerald-500 rounded-sm"
                            />
                        </div>
                        {i % 4 === 0 && (
                            <span className="text-[9px]" style={{ color: colors.text.muted }}>{h.hour}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Abandon Reasons ────────────────────────────────────────────────────────
function AbandonReasons({ reasons, colors }: { reasons: CheckoutData['abandonReasons']; colors: any }) {
    if (reasons.length === 0) {
        return (
            <div className="h-[80px] rounded-xl border flex items-center justify-center text-sm"
                style={{ borderColor: colors.border.faint, color: colors.text.muted, backgroundColor: colors.bg.elevated }}>
                No abandonment data yet.
            </div>
        );
    }
    return (
        <div className="space-y-2">
            {reasons.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 bg-red-400" />
                    <span className="flex-1 text-xs" style={{ color: colors.text.secondary }}>{r.reason}</span>
                    <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>{r.percentage}%</span>
                </div>
            ))}
        </div>
    );
}

export default function AnalyticsPage() {
    const { colors, theme } = useTheme();
    const [selectedPeriod, setSelectedPeriod] = useState('6M');
    const [openModal, setOpenModal] = useState<ModalType | null>(null);
    const data = emptyAnalyticsData;

    const periods = ['1D', '1W', '1M', '3M', '6M', '1Y'];
    const safePercent = (value: number, totalValue: number) => (totalValue > 0 ? Math.round((value / totalValue) * 100) : 0);

    const revenueChartData = data.revenue.monthly;
    const orderStatusData = [
        { label: 'Pending', value: data.orders.status.pending, percentage: safePercent(data.orders.status.pending, data.orders.total) },
        { label: 'Processing', value: data.orders.status.processing, percentage: safePercent(data.orders.status.processing, data.orders.total) },
        { label: 'Shipped', value: data.orders.status.shipped, percentage: safePercent(data.orders.status.shipped, data.orders.total) },
        { label: 'Delivered', value: data.orders.status.delivered, percentage: safePercent(data.orders.status.delivered, data.orders.total) },
        { label: 'Cancelled', value: data.orders.status.cancelled, percentage: safePercent(data.orders.status.cancelled, data.orders.total) }
    ];

    const hasRevenueData = revenueChartData.length > 0;
    const hasProducts = data.products.topSelling.length > 0;
    const hasTrafficSources = data.traffic.sources.length > 0;
    const statusColors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];

    const revenueIcon = (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
    const ordersIcon = (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
    );
    const customersIcon = (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    );
    const trafficIcon = (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );

    const modalDetails: Record<ModalType, MetricDetails | null> = {
        revenue: {
            title: 'Total Revenue', value: `₱${data.revenue.total.toLocaleString()}`, growth: data.revenue.growth, icon: revenueIcon,
            details: [
                { label: 'Average Order Value', value: data.revenue.total > 0 ? `₱${(data.revenue.total / Math.max(data.orders.total, 1)).toFixed(2)}` : '₱0.00' },
                { label: 'Monthly Average', value: data.revenue.monthly.length > 0 ? `₱${(data.revenue.total / data.revenue.monthly.length).toFixed(2)}` : '₱0.00' },
                { label: 'Best Month', value: data.revenue.monthly.length > 0 ? `₱${Math.max(...data.revenue.monthly.map(m => m.revenue)).toLocaleString()}` : '₱0' },
                { label: 'Period', value: selectedPeriod }
            ],
        },
        orders: {
            title: 'Total Orders', value: data.orders.total.toLocaleString(), growth: data.orders.growth, icon: ordersIcon,
            details: [
                { label: 'Pending', value: data.orders.status.pending },
                { label: 'Processing', value: data.orders.status.processing },
                { label: 'Shipped', value: data.orders.status.shipped },
                { label: 'Delivered', value: data.orders.status.delivered },
                { label: 'Cancelled', value: data.orders.status.cancelled },
                { label: 'Completion Rate', value: data.orders.total > 0 ? `${((data.orders.status.delivered / data.orders.total) * 100).toFixed(1)}%` : '0%' }
            ],
        },
        customers: {
            title: 'Total Customers', value: data.customers.total.toLocaleString(), growth: data.customers.growth, icon: customersIcon,
            details: [
                { label: 'New Customers', value: data.customers.new },
                { label: 'Returning Customers', value: data.customers.returning },
                { label: 'Retention Rate', value: data.customers.total > 0 ? `${((data.customers.returning / data.customers.total) * 100).toFixed(1)}%` : '0%' },
                { label: 'Average Customer Value', value: data.customers.total > 0 ? `₱${(data.revenue.total / data.customers.total).toFixed(2)}` : '₱0.00' }
            ],
        },
        traffic: {
            title: 'Total Traffic', value: data.traffic.total.toLocaleString(), growth: 0, icon: trafficIcon,
            details: [
                { label: 'Unique Visitors', value: data.traffic.unique.toLocaleString() },
                { label: 'Bounce Rate', value: `${data.traffic.bounce}%` },
                { label: 'Avg. Session Duration', value: '2m 34s' },
                { label: 'Pages per Session', value: '3.2' }
            ],
        },
        newCustomers: {
            title: 'New Customers', value: data.customers.new.toLocaleString(), growth: 0, icon: customersIcon,
            details: [
                { label: 'This Period', value: data.customers.new },
                { label: 'Percentage of Total', value: data.customers.total > 0 ? `${((data.customers.new / data.customers.total) * 100).toFixed(1)}%` : '0%' },
                { label: 'Conversion Rate', value: data.traffic.total > 0 ? `${((data.customers.new / data.traffic.total) * 100).toFixed(2)}%` : '0%' },
                { label: 'Avg. Acquisition Cost', value: '₱0.00' }
            ],
        },
        returningCustomers: {
            title: 'Returning Customers', value: data.customers.returning.toLocaleString(), growth: 0, icon: customersIcon,
            details: [
                { label: 'Returning Count', value: data.customers.returning },
                { label: 'Retention Rate', value: data.customers.total > 0 ? `${((data.customers.returning / data.customers.total) * 100).toFixed(1)}%` : '0%' },
                { label: 'Repeat Purchase Rate', value: '0%' },
                { label: 'Avg. Customer Lifetime Value', value: '₱0.00' }
            ],
        },
        uniqueVisitors: {
            title: 'Unique Visitors', value: data.traffic.unique.toLocaleString(), growth: 0, icon: trafficIcon,
            details: [
                { label: 'Total Visitors', value: data.traffic.total.toLocaleString() },
                { label: 'Total vs Unique', value: data.traffic.unique > 0 ? `${((data.traffic.total / data.traffic.unique) * 100).toFixed(1)}%` : '0%' },
                { label: 'Returning Visitor %', value: '0%' },
                { label: 'New Visitor %', value: '100%' }
            ],
        },
        bounceRate: {
            title: 'Bounce Rate', value: `${data.traffic.bounce}%`, growth: 0, icon: trafficIcon,
            details: [
                { label: 'Bounce Rate', value: `${data.traffic.bounce}%` },
                { label: 'Bounced Visitors', value: data.traffic.total > 0 ? Math.round((data.traffic.total * data.traffic.bounce) / 100) : 0 },
                { label: 'Engaged Visitors', value: data.traffic.total > 0 ? Math.round(data.traffic.total * (100 - data.traffic.bounce) / 100) : 0 },
                { label: 'Top Bounce Page', value: '/home' }
            ],
        },
        checkouts: {
            title: 'Total Checkouts', value: data.checkouts.totalInitiated.toLocaleString(), growth: data.checkouts.growth, icon: <ShoppingCart className="w-6 h-6" />,
            details: [
                { label: 'Completed', value: data.checkouts.totalCompleted },
                { label: 'Abandoned', value: data.checkouts.totalInitiated - data.checkouts.totalCompleted },
                { label: 'Conversion Rate', value: `${data.checkouts.conversionRate}%` },
                { label: 'Abandonment Rate', value: `${data.checkouts.abandonmentRate}%` },
                { label: 'Avg Order Value', value: `₱${data.checkouts.avgOrderValue.toFixed(2)}` },
                { label: 'Recovered Carts', value: data.checkouts.recoveredCarts }
            ],
        },
        checkoutConversion: {
            title: 'Checkout Conversion', value: `${data.checkouts.conversionRate}%`, growth: 0, icon: <CheckCircle className="w-6 h-6" />,
            details: [
                { label: 'Initiated', value: data.checkouts.totalInitiated },
                { label: 'Completed', value: data.checkouts.totalCompleted },
                { label: 'Lost Revenue Est.', value: '₱0.00' },
                { label: 'Industry Avg', value: '~35%' }
            ],
        },
        checkoutAbandonment: {
            title: 'Cart Abandonment', value: `${data.checkouts.abandonmentRate}%`, growth: 0, icon: <AlertCircle className="w-6 h-6" />,
            details: [
                { label: 'Abandoned Carts', value: data.checkouts.totalInitiated - data.checkouts.totalCompleted },
                { label: 'Abandonment Rate', value: `${data.checkouts.abandonmentRate}%` },
                { label: 'Top Drop-off Step', value: 'Payment' },
                { label: 'Recoverable Revenue', value: '₱0.00' }
            ],
        },
        recoveredCarts: {
            title: 'Recovered Carts', value: data.checkouts.recoveredCarts.toLocaleString(), growth: 0, icon: <Package className="w-6 h-6" />,
            details: [
                { label: 'Recovered Count', value: data.checkouts.recoveredCarts },
                { label: 'Recovery Rate', value: data.checkouts.totalInitiated > 0 ? `${((data.checkouts.recoveredCarts / data.checkouts.totalInitiated) * 100).toFixed(1)}%` : '0%' },
                { label: 'Revenue Recovered', value: `₱${(data.checkouts.recoveredCarts * data.checkouts.avgOrderValue).toFixed(2)}` },
                { label: 'Avg Recovery Time', value: '4h 12m' }
            ],
        },
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <section
                className="rounded-2xl border p-5 md:p-6"
                style={{
                    backgroundColor: colors.bg.card,
                    borderColor: colors.border.faint,
                    boxShadow: theme === 'dark'
                        ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 50px rgba(2,6,23,0.55)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 30px rgba(15,23,42,0.12)',
                }}
            >
                <div className="relative">
                    <div
                        className="absolute -inset-x-6 -inset-y-4 rounded-3xl opacity-70 blur-2xl"
                        style={{
                            background: theme === 'dark'
                                ? 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.16), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.14), transparent 60%)'
                                : 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.12), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.1), transparent 60%)'
                        }}
                    />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <motion.p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: colors.text.muted }}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                Dashboard Insights
                            </motion.p>
                            <motion.h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent"
                                style={{ backgroundImage: theme === 'dark' ? 'linear-gradient(180deg, #ffffff 25%, #9ca3af 100%)' : 'linear-gradient(180deg, #111827 25%, #4b5563 100%)' }}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                                Analytics
                            </motion.h1>
                            <motion.p className="mt-2 text-sm md:text-base" style={{ color: colors.text.secondary }}
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
                                Track your business performance and customer behavior by time range.
                            </motion.p>
                        </div>
                        <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border p-1" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                            {periods.map(period => (
                                <button key={period} onClick={() => setSelectedPeriod(period)}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                                    style={{ backgroundColor: selectedPeriod === period ? '#3b82f6' : 'transparent', color: selectedPeriod === period ? '#ffffff' : colors.text.secondary }}>
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Key Metrics */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { modal: 'revenue' as ModalType, title: 'Total Revenue', value: `₱${data.revenue.total.toLocaleString()}`, growth: data.revenue.growth, icon: revenueIcon, color: '#10b981' },
                        { modal: 'orders' as ModalType, title: 'Total Orders', value: data.orders.total.toLocaleString(), growth: data.orders.growth, icon: ordersIcon, color: '#3b82f6' },
                        { modal: 'customers' as ModalType, title: 'Total Customers', value: data.customers.total.toLocaleString(), growth: data.customers.growth, icon: customersIcon, color: '#8b5cf6' },
                        { modal: 'traffic' as ModalType, title: 'Total Traffic', value: data.traffic.total.toLocaleString(), growth: undefined, icon: trafficIcon, color: '#f59e0b' },
                    ].map((item, i) => (
                        <motion.div key={item.modal} onClick={() => setOpenModal(item.modal)} className="cursor-pointer"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                            <MetricCard title={item.title} value={item.value} growth={item.growth} icon={item.icon} color={item.color} colors={colors} />
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── CHECKOUT TRACKING SECTION ─────────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Buyer Checkouts</h2>
                        <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>Track checkout flow, abandonment, and payment behavior</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full border font-medium"
                        style={{ color: colors.text.secondary, borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                        {selectedPeriod}
                    </span>
                </div>

                {/* Checkout KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            modal: 'checkouts' as ModalType,
                            label: 'Checkouts Initiated',
                            value: data.checkouts.totalInitiated.toLocaleString(),
                            sub: `${data.checkouts.totalCompleted} completed`,
                            icon: <ShoppingCart className="w-4 h-4" />,
                            color: '#6366f1',
                            growth: data.checkouts.growth,
                        },
                        {
                            modal: 'checkoutConversion' as ModalType,
                            label: 'Conversion Rate',
                            value: `${data.checkouts.conversionRate}%`,
                            sub: 'Of initiated checkouts',
                            icon: <CheckCircle className="w-4 h-4" />,
                            color: '#10b981',
                            growth: null,
                        },
                        {
                            modal: 'checkoutAbandonment' as ModalType,
                            label: 'Abandonment Rate',
                            value: `${data.checkouts.abandonmentRate}%`,
                            sub: `${data.checkouts.totalInitiated - data.checkouts.totalCompleted} carts lost`,
                            icon: <AlertCircle className="w-4 h-4" />,
                            color: '#ef4444',
                            growth: null,
                        },
                        {
                            modal: 'recoveredCarts' as ModalType,
                            label: 'Recovered Carts',
                            value: data.checkouts.recoveredCarts.toLocaleString(),
                            sub: `₱${(data.checkouts.recoveredCarts * data.checkouts.avgOrderValue).toFixed(0)} recovered`,
                            icon: <Package className="w-4 h-4" />,
                            color: '#f59e0b',
                            growth: null,
                        },
                    ].map((item, i) => (
                        <motion.div key={item.modal} onClick={() => setOpenModal(item.modal)} className="cursor-pointer"
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                            <div className="rounded-xl border p-4 transition-all hover:scale-[1.01]"
                                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 4px 20px rgba(2,6,23,0.25)' : '0 2px 10px rgba(0,0,0,0.06)' }}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + '20', color: item.color }}>
                                        {item.icon}
                                    </div>
                                    {item.growth !== null && item.growth !== undefined && (
                                        <span className="text-xs font-medium flex items-center gap-1"
                                            style={{ color: item.growth >= 0 ? '#10b981' : '#ef4444' }}>
                                            {item.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {Math.abs(item.growth)}%
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{item.value}</p>
                                <p className="text-xs mt-1" style={{ color: colors.text.muted }}>{item.label}</p>
                                <p className="text-xs mt-0.5 font-medium" style={{ color: item.color + 'cc' }}>{item.sub}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Checkout Funnel + Payment Methods + Abandon Reasons */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Checkout Funnel Steps */}
                    <motion.div className="xl:col-span-2 rounded-2xl border p-6"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-base font-semibold" style={{ color: colors.text.primary }}>Checkout Funnel</h3>
                                <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>Step-by-step buyer drop-off analysis</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs" style={{ color: colors.text.muted }}>
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Visitors</span>
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Drop-off</span>
                            </div>
                        </div>
                        <CheckoutFunnelBar steps={data.checkouts.steps} colors={colors} theme={theme} />

                        {/* Step connector arrows */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                            {data.checkouts.steps.map((step, i) => (
                                <React.Fragment key={i}>
                                    <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: colors.bg.elevated, color: colors.text.muted }}>{step.step}</span>
                                    {i < data.checkouts.steps.length - 1 && (
                                        <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: colors.text.muted }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>

                    {/* Payment Methods + Abandon Reasons stacked */}
                    <div className="space-y-4">
                        <motion.div className="rounded-2xl border p-5"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="w-4 h-4" style={{ color: '#3b82f6' }} />
                                <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Payment Methods</h3>
                            </div>
                            <PaymentMethodsChart methods={data.checkouts.paymentMethods} colors={colors} />
                        </motion.div>

                        <motion.div className="rounded-2xl border p-5"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                                <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Abandon Reasons</h3>
                            </div>
                            <AbandonReasons reasons={data.checkouts.abandonReasons} colors={colors} />
                        </motion.div>
                    </div>
                </div>

                {/* Hourly Checkout Activity */}
                <motion.div className="rounded-2xl border p-6"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-semibold" style={{ color: colors.text.primary }}>Checkout Activity by Hour</h3>
                            <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>Green = completed, total bar = all initiated</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: colors.text.muted }}>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Completed</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: colors.bg.elevated, border: `1px solid ${colors.border.faint}` }} /> Total</span>
                        </div>
                    </div>
                    <HourlyChart hourly={data.checkouts.hourlyCheckouts} colors={colors} theme={theme} />
                </motion.div>
            </section>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl border p-6"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold" style={{ color: colors.text.primary }}>Revenue Trend</h3>
                        <span className="text-xs px-2 py-1 rounded-md" style={{ color: colors.text.muted, backgroundColor: colors.bg.elevated }}>{selectedPeriod}</span>
                    </div>
                    {hasRevenueData ? (
                        <AreaChart data={revenueChartData} color="#3b82f6" colors={colors} />
                    ) : (
                        <div className="h-[250px] rounded-xl border flex items-center justify-center text-sm"
                            style={{ borderColor: colors.border.faint, color: colors.text.muted, backgroundColor: colors.bg.elevated }}>
                            No revenue data yet for this period.
                        </div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl border p-6"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <h3 className="text-base font-semibold mb-6" style={{ color: colors.text.primary }}>Order Status</h3>
                    <RadialProgressChart data={orderStatusData} colors={statusColors} themeColors={colors} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-2xl border p-6"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <h3 className="text-base font-semibold mb-6" style={{ color: colors.text.primary }}>Customer Journey</h3>
                    <FunnelChart colors={colors} />
                </motion.div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="rounded-2xl border p-6"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <h3 className="text-base font-semibold mb-6" style={{ color: colors.text.primary }}>Top Selling Products</h3>
                    {hasProducts ? (
                        <div className="space-y-3">
                            {data.products.topSelling.map((product, index) => (
                                <div key={index} className="flex items-center justify-between py-2" style={{ borderColor: colors.border.faint }}>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium line-clamp-1" style={{ color: colors.text.primary }}>{product.name}</p>
                                        <p className="text-xs" style={{ color: colors.text.muted }}>{product.sales} units sold</p>
                                    </div>
                                    <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>₱{product.revenue.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[120px] rounded-xl border flex items-center justify-center text-sm"
                            style={{ borderColor: colors.border.faint, color: colors.text.muted, backgroundColor: colors.bg.elevated }}>
                            No product sales data available yet.
                        </div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="rounded-2xl border p-6"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <h3 className="text-base font-semibold mb-6" style={{ color: colors.text.primary }}>Traffic Sources</h3>
                    {hasTrafficSources ? (
                        <div className="space-y-3">
                            {data.traffic.sources.map((source, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-medium" style={{ color: colors.text.primary }}>{source.source}</p>
                                            <span className="text-sm" style={{ color: colors.text.secondary }}>{source.percentage}%</span>
                                        </div>
                                        <div className="w-full rounded-full h-2" style={{ backgroundColor: colors.border.faint }}>
                                            <div className="h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${source.percentage}%`, backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][index] }} />
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: colors.text.muted }}>{source.visitors.toLocaleString()} visitors</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[120px] rounded-xl border flex items-center justify-center text-sm"
                            style={{ borderColor: colors.border.faint, color: colors.text.muted, backgroundColor: colors.bg.elevated }}>
                            No traffic source data available yet.
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Additional Insights */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Additional Insights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { modal: 'newCustomers' as ModalType, value: data.customers.new, label: 'New Customers', delay: 0.65 },
                        { modal: 'returningCustomers' as ModalType, value: data.customers.returning, label: 'Returning Customers', delay: 0.7 },
                        { modal: 'uniqueVisitors' as ModalType, value: data.traffic.unique.toLocaleString(), label: 'Unique Visitors', delay: 0.75 },
                        { modal: 'bounceRate' as ModalType, value: `${data.traffic.bounce}%`, label: 'Bounce Rate', delay: 0.8 },
                    ].map(item => (
                        <div key={item.modal} onClick={() => setOpenModal(item.modal)} className="cursor-pointer">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: item.delay }}
                                className="rounded-xl border p-4 text-center transition-all"
                                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{item.value}</p>
                                <p className="text-xs mt-1" style={{ color: colors.text.muted }}>{item.label}</p>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Modal */}
            <AnimatePresence>
                {openModal && modalDetails[openModal] && (
                    <>
                        <motion.div onClick={() => setOpenModal(null)}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl border p-8 z-50 max-h-[85vh] overflow-y-auto"
                            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{
                                            backgroundColor:
                                                openModal === 'revenue' ? '#10b98120' :
                                                openModal === 'orders' ? '#3b82f620' :
                                                (openModal === 'customers' || openModal === 'newCustomers' || openModal === 'returningCustomers') ? '#8b5cf620' :
                                                (openModal === 'checkouts' || openModal === 'checkoutConversion') ? '#6366f120' :
                                                (openModal === 'checkoutAbandonment') ? '#ef444420' :
                                                (openModal === 'recoveredCarts') ? '#f59e0b20' :
                                                '#f59e0b20'
                                        }}>
                                        <div style={{
                                            color:
                                                openModal === 'revenue' ? '#10b981' :
                                                openModal === 'orders' ? '#3b82f6' :
                                                (openModal === 'customers' || openModal === 'newCustomers' || openModal === 'returningCustomers') ? '#8b5cf6' :
                                                (openModal === 'checkouts' || openModal === 'checkoutConversion') ? '#6366f1' :
                                                (openModal === 'checkoutAbandonment') ? '#ef4444' :
                                                (openModal === 'recoveredCarts') ? '#f59e0b' :
                                                '#f59e0b'
                                        }}>
                                            {modalDetails[openModal]?.icon}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{modalDetails[openModal]?.title}</h2>
                                        <p className="text-sm mt-1" style={{ color: colors.text.muted }}>Detailed breakdown and analysis</p>
                                    </div>
                                </div>
                                <button onClick={() => setOpenModal(null)} className="p-2 rounded-lg hover:bg-opacity-50 transition-colors" style={{ backgroundColor: colors.bg.elevated }}>
                                    <X className="w-5 h-5" style={{ color: colors.text.secondary }} />
                                </button>
                            </div>

                            <div className="mb-8 p-6 rounded-xl border" style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint }}>
                                <p className="text-sm mb-2" style={{ color: colors.text.muted }}>Current Value</p>
                                <p className="text-4xl font-bold" style={{ color: colors.text.primary }}>{modalDetails[openModal]?.value}</p>
                                {modalDetails[openModal]?.growth !== undefined && modalDetails[openModal]?.growth !== 0 && (
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="flex items-center gap-1 text-sm font-medium"
                                            style={{ color: modalDetails[openModal]!.growth >= 0 ? '#10b981' : '#ef4444' }}>
                                            {modalDetails[openModal]!.growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            {Math.abs(modalDetails[openModal]!.growth)}% from last period
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Detailed Breakdown</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {modalDetails[openModal]?.details.map((detail, idx) => (
                                        <div key={idx} className="p-4 rounded-lg border"
                                            style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint }}>
                                            <p className="text-sm mb-1" style={{ color: colors.text.muted }}>{detail.label}</p>
                                            <p className="text-lg font-bold" style={{ color: colors.text.primary }}>{detail.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Checkout modal: also show funnel steps inline */}
                            {openModal === 'checkouts' && (
                                <div className="mb-6">
                                    <h3 className="text-base font-semibold mb-3" style={{ color: colors.text.primary }}>Funnel Steps</h3>
                                    <CheckoutFunnelBar steps={data.checkouts.steps} colors={colors} theme={theme} />
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-6 border-t" style={{ borderColor: colors.border.faint }}>
                                <button onClick={() => setOpenModal(null)} className="px-6 py-2.5 rounded-lg border hover:bg-opacity-50 transition-colors font-medium"
                                    style={{ borderColor: colors.border.faint, color: colors.text.primary }}>
                                    Close
                                </button>
                                <button className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                                    Export Report
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}