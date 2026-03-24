'use client';

import React, { useRef, useEffect } from 'react';
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

    const labels = revenueOverTime?.labels ?? [];
    const data = revenueOverTime?.data ?? [];

    useEffect(() => {
        if (!revenueChartRef.current) return;

        if (revenueChartInstanceRef.current) {
            revenueChartInstanceRef.current.destroy();
            revenueChartInstanceRef.current = null;
        }

        const ctx = revenueChartRef.current.getContext('2d');
        if (!ctx) return;

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
                        },
                    },
                },
            },
        });

        return () => {
            if (revenueChartInstanceRef.current) {
                revenueChartInstanceRef.current.destroy();
            }
        };
    }, [labels, data]);

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
                    <div className="admin-dashboard-inset-panel flex gap-1 rounded-xl p-1">
                        {[
                            { id: '7days' as const, label: 'Last 7 days' },
                            { id: '30days' as const, label: 'Last 30 days' },
                            { id: '3months' as const, label: 'Last 3 months' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => onPeriodChange(p.id)}
                                disabled={loading}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                    period === p.id
                                        ? 'admin-dashboard-yellow-fill admin-dashboard-purple shadow-sm'
                                        : 'admin-dashboard-soft-text hover:admin-dashboard-purple'
                                } disabled:opacity-50`}
                                suppressHydrationWarning
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="admin-dashboard-inset-panel rounded-[20px] p-6 sm:p-8 w-full">
                    <canvas ref={revenueChartRef} height="110" className="w-full"></canvas>
                </div>
            </div>
        </motion.div>
    );
}
