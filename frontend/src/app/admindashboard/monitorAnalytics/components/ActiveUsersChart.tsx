'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

type Period = '7days' | '30days' | '3months';

type Props = {
    period: Period;
    onPeriodChange: (p: Period) => void;
    actualUsers?: number[];
    maxUsers?: number[];
    labels?: string[];
    loading?: boolean;
};

export default function ActiveUsersChart({ 
    period, 
    onPeriodChange, 
    actualUsers = [], 
    maxUsers = [],
    labels = [],
    loading 
}: Props) {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    const chartLabels = useMemo(() => labels.length > 0 ? labels : 
        period === '7days' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
        period === '30days' ? Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`) :
        Array.from({ length: 12 }, (_, i) => ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'][i]),
    [labels, period]);

    const actualData = useMemo(() => actualUsers.length > 0 ? actualUsers : [], [actualUsers]);
    const maxData = useMemo(() => maxUsers.length > 0 ? maxUsers : [], [maxUsers]);

    useEffect(() => {
        if (!chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Peak Active Users',
                        data: maxData,
                        borderColor: '#B13BFF',
                        backgroundColor: 'rgba(177, 59, 255, 0.12)',
                        borderWidth: 2.5,
                        pointRadius: chartLabels.length > 31 ? 0 : 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#FFFFFF',
                        pointBorderColor: '#B13BFF',
                        pointBorderWidth: 2,
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: 'Actual Active Users',
                        data: actualData,
                        borderColor: '#FFB800',
                        backgroundColor: 'rgba(255, 184, 0, 0.12)',
                        borderWidth: 2.5,
                        pointRadius: chartLabels.length > 31 ? 0 : 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#FFFFFF',
                        pointBorderColor: '#FFB800',
                        pointBorderWidth: 2,
                        fill: true,
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                elements: {
                    line: {
                        capBezierPoints: false
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: 'rgba(71, 19, 150, 0.72)',
                            usePointStyle: true,
                            pointStyle: 'line',
                            boxWidth: 20,
                            boxHeight: 4,
                            padding: 16,
                            font: {
                                size: 13,
                                weight: 'bold'
                            }
                        },
                    },
                    tooltip: {
                        enabled: true,
                        animation: { duration: 0 },
                        backgroundColor: 'rgba(71, 19, 150, 0.95)',
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF',
                        borderColor: 'rgba(177, 59, 255, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const yValue = context.parsed.y !== null ? Math.round(context.parsed.y) : 0;
                                label += yValue;
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(71, 19, 150, 0.10)',
                        },
                        ticks: {
                            color: 'rgba(71, 19, 150, 0.58)',
                            font: {
                                size: 12
                            }
                        },
                        title: {
                            display: true,
                            text: 'Active Users Count',
                            color: 'rgba(71, 19, 150, 0.72)',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            color: 'rgba(71, 19, 150, 0.58)',
                            maxRotation: period === '7days' ? 0 : 45,
                            autoSkip: true,
                            maxTicksLimit: period === '7days' ? 7 : period === '30days' ? 15 : 12,
                            font: {
                                size: 12
                            }
                        },
                    },
                },
            },
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [chartLabels, actualData, maxData, period]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <div className="rounded-[28px] border border-[rgba(177,59,255,0.18)] bg-gradient-to-br from-[#FDFBFF] via-[#F8F2FF] to-[#F3E8FF] p-5 shadow-[0_10px_32px_rgba(177,59,255,0.12)] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="admin-dashboard-purple text-[2rem] font-semibold leading-tight">Active Users Performance</h2>
                        <p className="admin-dashboard-soft-text mt-1 text-sm">Peak vs. actual daily active users trend</p>
                    </div>
                    <div className="relative flex gap-1 rounded-xl border border-[rgba(166,61,255,0.2)] bg-white p-1 shadow-[0_8px_20px_rgba(103,2,191,0.08)]" suppressHydrationWarning>
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
                                        layoutId="periodTabBackgroundActiveUsers"
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
                    <canvas ref={chartRef} height="110" className="w-full"></canvas>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-[16px] border border-[rgba(166,61,255,0.2)] bg-white p-4 shadow-[0_10px_22px_rgba(103,2,191,0.08)]">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                        <div>
                            <p className="admin-dashboard-soft-text text-xs font-bold uppercase tracking-widest">Peak Active Users</p>
                            <p className="admin-dashboard-purple text-xl font-bold mt-1">
                                {maxData.length > 0 ? Math.max(...maxData) : '—'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="rounded-[16px] border border-[rgba(255,184,0,0.32)] bg-white p-4 shadow-[0_10px_22px_rgba(103,2,191,0.08)]">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                        <div>
                            <p className="admin-dashboard-soft-text text-xs font-bold uppercase tracking-widest">Current Active Users</p>
                            <p className="admin-dashboard-purple text-xl font-bold mt-1">
                                {actualData.length > 0 ? actualData[actualData.length - 1] : '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
