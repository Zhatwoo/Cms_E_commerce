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
                        backgroundColor: '#3B82F6',
                        borderColor: '#1D4ED8',
                        borderWidth: 1,
                        borderRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(226, 232, 240, 0.5)',
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
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
                        <h2 className="text-2xl font-semibold text-slate-900">Revenue Growth</h2>
                        <p className="text-sm text-slate-500 mt-1">Revenue over time (orders)</p>
                    </div>
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                        {[
                            { id: '7days' as const, label: 'Last 7 days' },
                            { id: '30days' as const, label: 'Last 30 days' },
                            { id: '3months' as const, label: 'Last 3 months' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => onPeriodChange(p.id)}
                                disabled={loading}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    period === p.id
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                } disabled:opacity-50`}
                                suppressHydrationWarning
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-8 border border-slate-200">
                    <canvas ref={revenueChartRef} height="80"></canvas>
                </div>
            </div>
        </motion.div>
    );
}
