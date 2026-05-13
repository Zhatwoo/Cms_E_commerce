'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

type Period = '7days' | '30days' | '3months';

type Props = {
    period: Period;
    onPeriodChange: (p: Period) => void;
    revenueOverTime?: { labels: string[]; data: number[] };
    loading?: boolean;
};

export default function RevenueGrowth({ period, onPeriodChange, revenueOverTime, loading }: Props) {
    const revenueChartRef = useRef<HTMLCanvasElement>(null);
    const revenueChartInstanceRef = useRef<Chart | null>(null);

    const labels = useMemo(() => revenueOverTime?.labels ?? [], [revenueOverTime?.labels]);
    const data = useMemo(() => revenueOverTime?.data ?? [], [revenueOverTime?.data]);

    useEffect(() => {
        if (!revenueChartRef.current) return;

        const ctx = revenueChartRef.current.getContext('2d');
        if (!ctx) return;

        if (revenueChartInstanceRef.current) {
            revenueChartInstanceRef.current.destroy();
        }

        revenueChartInstanceRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Revenue',
                        data,
                        backgroundColor: 'rgba(255, 204, 0, 0.82)',
                        borderColor: '#471396',
                        borderWidth: 1.2,
                        borderRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Performance optimization
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'rgba(71, 19, 150, 0.78)',
                            usePointStyle: true,
                            boxWidth: 16,
                            boxHeight: 6,
                        },
                    },
                    tooltip: {
                        enabled: true,
                        animation: { duration: 0 } // Performance optimization
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(71, 19, 150, 0.12)',
                        },
                        ticks: {
                            color: 'rgba(71, 19, 150, 0.64)',
                            callback: function(value) {
                                return '₱' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            color: 'rgba(71, 19, 150, 0.64)',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: period === '7days' ? 7 : 12
                        },
                    },
                },
            },
        });

        return () => {
            if (revenueChartInstanceRef.current) {
                revenueChartInstanceRef.current.destroy();
                revenueChartInstanceRef.current = null;
            }
        };
    }, [labels, data, period]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="admin-dashboard-purple text-[2rem] font-semibold leading-tight">Revenue Growth</h2>
                        <p className="admin-dashboard-soft-text mt-1 text-sm">Revenue over time (orders)</p>
                    </div>
                    <div className="relative flex gap-1 rounded-xl border border-[rgba(166,61,255,0.2)] bg-white p-1 shadow-[0_8px_20px_rgba(103,2,191,0.08)]">
                        {[
                            { id: '7days' as const, label: 'Last 7 days' },
                            { id: '30days' as const, label: 'Last 30 days' },
                            { id: '3months' as const, label: 'Last 3 months' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => onPeriodChange(p.id)}
                                disabled={loading}
                                className={`relative z-10 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                                    period === p.id ? 'admin-dashboard-purple' : 'admin-dashboard-soft-text hover:admin-dashboard-purple'
                                } disabled:opacity-50`}
                                suppressHydrationWarning
                            >
                                {period === p.id && (
                                    <motion.div
                                        layoutId="periodTabBackgroundRec"
                                        className="absolute inset-0 rounded-lg admin-dashboard-yellow-fill shadow-sm"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{p.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full rounded-[20px] border border-[rgba(166,61,255,0.2)] bg-white p-6 shadow-[0_14px_30px_rgba(103,2,191,0.09)] sm:p-8">
                    <canvas ref={revenueChartRef} height="110" className="w-full"></canvas>
                </div>
            </div>
        </motion.div>
    );
}
