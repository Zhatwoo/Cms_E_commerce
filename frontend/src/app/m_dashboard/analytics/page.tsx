'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

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
}

const emptyAnalyticsData: AnalyticsData = {
    revenue: {
        total: 0,
        growth: 0,
        monthly: []
    },
    orders: {
        total: 0,
        growth: 0,
        status: {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        }
    },
    customers: {
        total: 0,
        new: 0,
        returning: 0,
        growth: 0
    },
    products: {
        total: 0,
        topSelling: [],
        lowStock: 0
    },
    traffic: {
        total: 0,
        unique: 0,
        bounce: 0,
        sources: []
    }
};

import { AreaChart } from '../components/analytics/AreaChart';
import { FunnelChart } from '../components/analytics/FunnelChart';
import { MetricCard } from '../components/analytics/MetricCard';
import { RadialProgressChart } from '../components/analytics/RadialProgressChart';

type ModalType = 'revenue' | 'orders' | 'customers' | 'traffic' | 'newCustomers' | 'returningCustomers' | 'uniqueVisitors' | 'bounceRate';

interface MetricDetails {
    title: string;
    value: string;
    growth: number;
    icon: React.ReactNode;
    details: { label: string; value: string | number }[];
    chart?: React.ReactNode;
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

    // Modal Detail Data
    const modalDetails: Record<ModalType, MetricDetails | null> = {
        revenue: {
            title: 'Total Revenue',
            value: `$${data.revenue.total.toLocaleString()}`,
            growth: data.revenue.growth,
            icon: revenueIcon,
            details: [
                { label: 'Average Order Value', value: data.revenue.total > 0 ? `$${(data.revenue.total / Math.max(data.orders.total, 1)).toFixed(2)}` : '$0.00' },
                { label: 'Monthly Average', value: data.revenue.monthly.length > 0 ? `$${(data.revenue.total / data.revenue.monthly.length).toFixed(2)}` : '$0.00' },
                { label: 'Best Month', value: data.revenue.monthly.length > 0 ? `$${Math.max(...data.revenue.monthly.map(m => m.revenue)).toLocaleString()}` : '$0' },
                { label: 'Period', value: selectedPeriod }
            ],
        },
        orders: {
            title: 'Total Orders',
            value: data.orders.total.toLocaleString(),
            growth: data.orders.growth,
            icon: ordersIcon,
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
            title: 'Total Customers',
            value: data.customers.total.toLocaleString(),
            growth: data.customers.growth,
            icon: customersIcon,
            details: [
                { label: 'New Customers', value: data.customers.new },
                { label: 'Returning Customers', value: data.customers.returning },
                { label: 'Retention Rate', value: data.customers.total > 0 ? `${((data.customers.returning / data.customers.total) * 100).toFixed(1)}%` : '0%' },
                { label: 'Average Customer Value', value: data.customers.total > 0 ? `$${(data.revenue.total / data.customers.total).toFixed(2)}` : '$0.00' }
            ],
        },
        traffic: {
            title: 'Total Traffic',
            value: data.traffic.total.toLocaleString(),
            growth: 0,
            icon: trafficIcon,
            details: [
                { label: 'Unique Visitors', value: data.traffic.unique.toLocaleString() },
                { label: 'Bounce Rate', value: `${data.traffic.bounce}%` },
                { label: 'Avg. Session Duration', value: '2m 34s' },
                { label: 'Pages per Session', value: '3.2' }
            ],
        },
        newCustomers: {
            title: 'New Customers',
            value: data.customers.new.toLocaleString(),
            growth: 0,
            icon: customersIcon,
            details: [
                { label: 'This Period', value: data.customers.new },
                { label: 'Percentage of Total', value: data.customers.total > 0 ? `${((data.customers.new / data.customers.total) * 100).toFixed(1)}%` : '0%' },
                { label: 'Conversion Rate', value: data.traffic.total > 0 ? `${((data.customers.new / data.traffic.total) * 100).toFixed(2)}%` : '0%' },
                { label: 'Avg. Acquisition Cost', value: '$0.00' }
            ],
        },
        returningCustomers: {
            title: 'Returning Customers',
            value: data.customers.returning.toLocaleString(),
            growth: 0,
            icon: customersIcon,
            details: [
                { label: 'Returning Count', value: data.customers.returning },
                { label: 'Retention Rate', value: data.customers.total > 0 ? `${((data.customers.returning / data.customers.total) * 100).toFixed(1)}%` : '0%' },
                { label: 'Repeat Purchase Rate', value: '0%' },
                { label: 'Avg. Customer Lifetime Value', value: '$0.00' }
            ],
        },
        uniqueVisitors: {
            title: 'Unique Visitors',
            value: data.traffic.unique.toLocaleString(),
            growth: 0,
            icon: trafficIcon,
            details: [
                { label: 'Total Visitors', value: data.traffic.total.toLocaleString() },
                { label: 'Total vs Unique', value: data.traffic.unique > 0 ? `${((data.traffic.total / data.traffic.unique) * 100).toFixed(1)}%` : '0%' },
                { label: 'Returning Visitor %', value: '0%' },
                { label: 'New Visitor %', value: '100%' }
            ],
        },
        bounceRate: {
            title: 'Bounce Rate',
            value: `${data.traffic.bounce}%`,
            growth: 0,
            icon: trafficIcon,
            details: [
                { label: 'Bounce Rate', value: `${data.traffic.bounce}%` },
                { label: 'Bounced Visitors', value: data.traffic.total > 0 ? Math.round((data.traffic.total * data.traffic.bounce) / 100) : 0 },
                { label: 'Engaged Visitors', value: data.traffic.total > 0 ? Math.round(data.traffic.total * (100 - data.traffic.bounce) / 100) : 0 },
                { label: 'Top Bounce Page', value: '/home' }
            ],
        },
    };

    return (
        <div className="space-y-8">
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
                            <motion.p
                                className="text-xs uppercase tracking-[0.2em] mb-2"
                                style={{ color: colors.text.muted }}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                Dashboard Insights
                            </motion.p>
                            <motion.h1
                                className="text-3xl font-bold tracking-tight bg-clip-text text-transparent"
                                style={{
                                    backgroundImage: theme === 'dark'
                                        ? 'linear-gradient(180deg, #ffffff 25%, #9ca3af 100%)'
                                        : 'linear-gradient(180deg, #111827 25%, #4b5563 100%)'
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45 }}
                            >
                                Analytics
                            </motion.h1>
                            <motion.p
                                className="mt-2 text-sm md:text-base"
                                style={{ color: colors.text.secondary }}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: 0.08 }}
                            >
                                Track your business performance and customer behavior by time range.
                            </motion.p>
                        </div>

                        <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border p-1" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                            {periods.map(period => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                                    style={{
                                        backgroundColor: selectedPeriod === period ? '#3b82f6' : 'transparent',
                                        color: selectedPeriod === period ? '#ffffff' : colors.text.secondary,
                                    }}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Key Metrics */}
            <section id="overview-section" className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Overview</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div onClick={() => setOpenModal('revenue')} className="cursor-pointer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <MetricCard
                            title="Total Revenue"
                            value={`$${data.revenue.total.toLocaleString()}`}
                            growth={data.revenue.growth}
                            icon={revenueIcon}
                            color="#10b981"
                            colors={colors}
                        />
                    </motion.div>
                    <motion.div onClick={() => setOpenModal('orders')} className="cursor-pointer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <MetricCard
                            title="Total Orders"
                            value={data.orders.total.toLocaleString()}
                            growth={data.orders.growth}
                            icon={ordersIcon}
                            color="#3b82f6"
                            colors={colors}
                        />
                    </motion.div>
                    <motion.div onClick={() => setOpenModal('customers')} className="cursor-pointer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <MetricCard
                            title="Total Customers"
                            value={data.customers.total.toLocaleString()}
                            growth={data.customers.growth}
                            icon={customersIcon}
                            color="#8b5cf6"
                            colors={colors}
                        />
                    </motion.div>
                    <motion.div onClick={() => setOpenModal('traffic')} className="cursor-pointer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <MetricCard
                            title="Total Traffic"
                            value={data.traffic.total.toLocaleString()}
                            icon={trafficIcon}
                            color="#f59e0b"
                            colors={colors}
                        />
                    </motion.div>
                </div>
            </section>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border p-6"
                    style={{
                        backgroundColor: colors.bg.card,
                        borderColor: colors.border.faint,
                        boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
                    }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold" style={{ color: colors.text.primary }}>Revenue Trend</h3>
                        <span className="text-xs px-2 py-1 rounded-md" style={{ color: colors.text.muted, backgroundColor: colors.bg.elevated }}>{selectedPeriod}</span>
                    </div>
                    {hasRevenueData ? (
                        <AreaChart data={revenueChartData} color="#3b82f6" colors={colors} />
                    ) : (
                        <div className="h-[250px] rounded-xl border flex items-center justify-center text-sm" style={{ borderColor: colors.border.faint, color: colors.text.muted, backgroundColor: colors.bg.elevated }}>
                            No revenue data yet for this period.
                        </div>
                    )}
                </motion.div>

                {/* Order Status Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl border p-6"
                    style={{
                        backgroundColor: colors.bg.card,
                        borderColor: colors.border.faint,
                        boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
                    }}
                >
                    <h3 className="text-base font-semibold mb-6" style={{ color: colors.text.primary }}>Order Status</h3>
                    <RadialProgressChart data={orderStatusData} colors={statusColors} themeColors={colors} />
                </motion.div>

                {/* Customer Journey Funnel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-2xl border p-6"
                    style={{
                        backgroundColor: colors.bg.card,
                        borderColor: colors.border.faint,
                        boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
                    }}
                >
                    <h3 className="text-base font-semibold mb-6" style={{ color: colors.text.primary }}>Customer Journey</h3>
                    <FunnelChart colors={colors} />
                </motion.div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Products */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl border p-6"
                    style={{
                        backgroundColor: colors.bg.card,
                        borderColor: colors.border.faint,
                        boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
                    }}
                >
                    <h3 className="text-base font-semibold mb-6" style={{ color: colors.text.primary }}>Top Selling Products</h3>
                    {hasProducts ? (
                        <div className="space-y-3">
                            {data.products.topSelling.map((product, index) => (
                                <div key={index} className="flex items-center justify-between py-2 last:border-0" style={{ borderColor: colors.border.faint }}>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium line-clamp-1" style={{ color: colors.text.primary }}>{product.name}</p>
                                        <p className="text-xs" style={{ color: colors.text.muted }}>{product.sales} units sold</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>${product.revenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[120px] rounded-xl border flex items-center justify-center text-sm" style={{ borderColor: colors.border.faint, color: colors.text.muted, backgroundColor: colors.bg.elevated }}>
                            No product sales data available yet.
                        </div>
                    )}
                </motion.div>

                {/* Traffic Sources */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-2xl border p-6"
                    style={{
                        backgroundColor: colors.bg.card,
                        borderColor: colors.border.faint,
                        boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
                    }}
                >
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
                                            <div
                                                className="h-2 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${source.percentage}%`,
                                                    backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][index]
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: colors.text.muted }}>{source.visitors.toLocaleString()} visitors</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[120px] rounded-xl border flex items-center justify-center text-sm" style={{ borderColor: colors.border.faint, color: colors.text.muted, backgroundColor: colors.bg.elevated }}>
                            No traffic source data available yet.
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Additional Insights */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Additional Insights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div onClick={() => setOpenModal('newCustomers')} className="cursor-pointer">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.65 }}
                            className="rounded-xl border p-4 text-center transition-all"
                            style={{
                                backgroundColor: colors.bg.card,
                                borderColor: colors.border.faint,
                                boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
                            }}
                        >
                            <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{data.customers.new}</p>
                            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>New Customers</p>
                        </motion.div>
                    </div>
                    <div onClick={() => setOpenModal('returningCustomers')} className="cursor-pointer">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="rounded-xl border p-4 text-center transition-all"
                            style={{
                                backgroundColor: colors.bg.card,
                                borderColor: colors.border.faint,
                                boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
                            }}
                        >
                            <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{data.customers.returning}</p>
                            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>Returning Customers</p>
                        </motion.div>
                    </div>
                    <div onClick={() => setOpenModal('uniqueVisitors')} className="cursor-pointer">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.75 }}
                            className="rounded-xl border p-4 text-center transition-all"
                            style={{
                                backgroundColor: colors.bg.card,
                                borderColor: colors.border.faint,
                                boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
                            }}
                        >
                            <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{data.traffic.unique.toLocaleString()}</p>
                            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>Unique Visitors</p>
                        </motion.div>
                    </div>
                    <div onClick={() => setOpenModal('bounceRate')} className="cursor-pointer">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="rounded-xl border p-4 text-center transition-all"
                            style={{
                                backgroundColor: colors.bg.card,
                                borderColor: colors.border.faint,
                                boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
                            }}
                        >
                            <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{data.traffic.bounce}%</p>
                            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>Bounce Rate</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Modal */}
            <AnimatePresence>
                {openModal && modalDetails[openModal] && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            onClick={() => setOpenModal(null)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl border p-8 z-50 max-h-[85vh] overflow-y-auto"
                            style={{
                                backgroundColor: colors.bg.card,
                                borderColor: colors.border.faint,
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{
                                            backgroundColor:
                                                openModal === 'revenue' ? '#10b98120' :
                                                    openModal === 'orders' ? '#3b82f620' :
                                                        (openModal === 'customers' || openModal === 'newCustomers' || openModal === 'returningCustomers') ? '#8b5cf620' :
                                                            '#f59e0b20'
                                        }}
                                    >
                                        <div
                                            style={{
                                                color:
                                                    openModal === 'revenue' ? '#10b981' :
                                                        openModal === 'orders' ? '#3b82f6' :
                                                            (openModal === 'customers' || openModal === 'newCustomers' || openModal === 'returningCustomers') ? '#8b5cf6' :
                                                                '#f59e0b'
                                            }}
                                        >
                                            {modalDetails[openModal]?.icon}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                                            {modalDetails[openModal]?.title}
                                        </h2>
                                        <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
                                            Detailed breakdown and analysis
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setOpenModal(null)}
                                    className="p-2 rounded-lg hover:bg-opacity-50 transition-colors"
                                    style={{ backgroundColor: colors.bg.elevated }}
                                >
                                    <X className="w-5 h-5" style={{ color: colors.text.secondary }} />
                                </button>
                            </div>

                            {/* Main Value */}
                            <div className="mb-8 p-6 rounded-xl border" style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint }}>
                                <p className="text-sm mb-2" style={{ color: colors.text.muted }}>Current Value</p>
                                <p className="text-4xl font-bold" style={{ color: colors.text.primary }}>
                                    {modalDetails[openModal]?.value}
                                </p>
                                {modalDetails[openModal]?.growth !== undefined && modalDetails[openModal]?.growth !== 0 && (
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="flex items-center gap-1 text-sm font-medium" style={{
                                            color: modalDetails[openModal]!.growth >= 0 ? '#10b981' : '#ef4444'
                                        }}>
                                            {modalDetails[openModal]!.growth >= 0 ? (
                                                <TrendingUp className="w-4 h-4" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4" />
                                            )}
                                            {Math.abs(modalDetails[openModal]!.growth)}% from last period
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
                                    Detailed Breakdown
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {modalDetails[openModal]?.details.map((detail, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 rounded-lg border"
                                            style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint }}
                                        >
                                            <p className="text-sm mb-1" style={{ color: colors.text.muted }}>
                                                {detail.label}
                                            </p>
                                            <p className="text-lg font-bold" style={{ color: colors.text.primary }}>
                                                {detail.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-end pt-6 border-t" style={{ borderColor: colors.border.faint }}>
                                <button
                                    onClick={() => setOpenModal(null)}
                                    className="px-6 py-2.5 rounded-lg border hover:bg-opacity-50 transition-colors font-medium"
                                    style={{ borderColor: colors.border.faint, color: colors.text.primary }}
                                >
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


