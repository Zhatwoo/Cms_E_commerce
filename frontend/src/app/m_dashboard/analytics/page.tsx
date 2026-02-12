'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';

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

const mockAnalyticsData: AnalyticsData = {
    revenue: {
        total: 125450,
        growth: 12.5,
        monthly: [
            { month: 'Jan', revenue: 8500 },
            { month: 'Feb', revenue: 9200 },
            { month: 'Mar', revenue: 10100 },
            { month: 'Apr', revenue: 9800 },
            { month: 'May', revenue: 11200 },
            { month: 'Jun', revenue: 12800 }
        ]
    },
    orders: {
        total: 342,
        growth: 8.3,
        status: {
            pending: 28,
            processing: 45,
            shipped: 67,
            delivered: 189,
            cancelled: 13
        }
    },
    customers: {
        total: 1847,
        new: 234,
        returning: 1613,
        growth: 15.2
    },
    products: {
        total: 156,
        topSelling: [
            { name: 'Premium Wireless Headphones', sales: 89, revenue: 26711 },
            { name: 'Smart Watch Pro', sales: 67, revenue: 30149 },
            { name: 'Organic Cotton T-Shirt', sales: 234, revenue: 7017 },
            { name: 'Leather Backpack', sales: 45, revenue: 4050 },
            { name: 'Ceramic Coffee Mug Set', sales: 123, revenue: 4304 }
        ],
        lowStock: 8
    },
    traffic: {
        total: 45678,
        unique: 32145,
        bounce: 32.5,
        sources: [
            { source: 'Organic Search', visitors: 15234, percentage: 47.4 },
            { source: 'Direct', visitors: 8923, percentage: 27.8 },
            { source: 'Social Media', visitors: 5432, percentage: 16.9 },
            { source: 'Referral', visitors: 2345, percentage: 7.3 },
            { source: 'Email', visitors: 211, percentage: 0.6 }
        ]
    }
};

import { AreaChart } from '../components/analytics/AreaChart';
import { FunnelChart } from '../components/analytics/FunnelChart';
import { MetricCard } from '../components/analytics/MetricCard';
import { RadialProgressChart } from '../components/analytics/RadialProgressChart';

export default function AnalyticsPage() {
    const { colors } = useTheme();
    const [selectedPeriod, setSelectedPeriod] = useState('6M');
    const data = mockAnalyticsData;

    const periods = ['1D', '1W', '1M', '3M', '6M', '1Y'];

    const revenueChartData = data.revenue.monthly;
    const maxRevenue = Math.max(...revenueChartData.map(item => item.revenue));

    const orderStatusData = [
        { label: 'Pending', value: data.orders.status.pending, percentage: Math.round((data.orders.status.pending / data.orders.total) * 100) },
        { label: 'Processing', value: data.orders.status.processing, percentage: Math.round((data.orders.status.processing / data.orders.total) * 100) },
        { label: 'Shipped', value: data.orders.status.shipped, percentage: Math.round((data.orders.status.shipped / data.orders.total) * 100) },
        { label: 'Delivered', value: data.orders.status.delivered, percentage: Math.round((data.orders.status.delivered / data.orders.total) * 100) },
        { label: 'Cancelled', value: data.orders.status.cancelled, percentage: Math.round((data.orders.status.cancelled / data.orders.total) * 100) }
    ];

    const statusColors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text.primary }}>
                        Analytics
                    </h1>
                    <p className="mt-2 text-base" style={{ color: colors.text.secondary }}>
                        Track your business performance and insights
                    </p>
                </div>
                <div className="flex gap-2">
                    {periods.map(period => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === period ? 'shadow-md' : 'hover:opacity-70'
                                }`}
                            style={{
                                backgroundColor: selectedPeriod === period ? '#3b82f6' : 'transparent',
                                color: selectedPeriod === period ? 'white' : '#6b7280',
                                border: `1px solid ${selectedPeriod === period ? '#3b82f6' : '#e5e7eb'}`
                            }}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Revenue"
                    value={`$${data.revenue.total.toLocaleString()}`}
                    growth={data.revenue.growth}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    color="#10b981"
                    colors={colors}
                />
                <MetricCard
                    title="Total Orders"
                    value={data.orders.total.toLocaleString()}
                    growth={data.orders.growth}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    }
                    color="#3b82f6"
                    colors={colors}
                />
                <MetricCard
                    title="Total Customers"
                    value={data.customers.total.toLocaleString()}
                    growth={data.customers.growth}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                    color="#8b5cf6"
                    colors={colors}
                />
                <MetricCard
                    title="Total Traffic"
                    value={data.traffic.total.toLocaleString()}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    }
                    color="#f59e0b"
                    colors={colors}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border p-6 shadow-sm"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                >
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text.primary }}>Revenue Trend</h3>
                    <AreaChart data={revenueChartData} color="#3b82f6" colors={colors} />
                </motion.div>

                {/* Order Status Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border p-6 shadow-sm"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                >
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text.primary }}>Order Status</h3>
                    <RadialProgressChart data={orderStatusData} colors={statusColors} themeColors={colors} />
                </motion.div>

                {/* Customer Journey Funnel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl border p-6 shadow-sm"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                >
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text.primary }}>Customer Journey</h3>
                    <FunnelChart colors={colors} />
                </motion.div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Products */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl border p-6 shadow-sm"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                >
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text.primary }}>Top Selling Products</h3>
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
                </motion.div>

                {/* Traffic Sources */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-xl border p-6 shadow-sm"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                >
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text.primary }}>Traffic Sources</h3>
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
                </motion.div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-xl border p-4 text-center"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                >
                    <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{data.customers.new}</p>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>New Customers</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="rounded-xl border p-4 text-center"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                >
                    <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{data.customers.returning}</p>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>Returning Customers</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="rounded-xl border p-4 text-center"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                >
                    <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{data.traffic.unique.toLocaleString()}</p>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>Unique Visitors</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="rounded-xl border p-4 text-center"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                >
                    <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{data.traffic.bounce}%</p>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>Bounce Rate</p>
                </motion.div>
            </div>
        </div>
    );
}


