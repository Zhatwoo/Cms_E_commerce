'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

type Period = '7days' | '30days' | '3months';

type Props = {
    period: Period;
    onPeriodChange: (p: Period) => void;
    signupsOverTime?: { labels: string[]; signups: number[] };
    loading?: boolean;
};

export default function PlatformTraffic({ period, onPeriodChange, signupsOverTime, loading }: Props) {
    const trafficChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    const labels = useMemo(() => signupsOverTime?.labels ?? [], [signupsOverTime?.labels]);
    const signups = useMemo(() => signupsOverTime?.signups ?? [], [signupsOverTime?.signups]);

    useEffect(() => {
        if (!trafficChartRef.current) return;

        const ctx = trafficChartRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Signups',
                        data: signups,
                        borderColor: '#8A78FF',
                        backgroundColor: 'rgba(138, 120, 255, 0.12)',
                        borderWidth: 2.2,
                        pointRadius: labels.length > 31 ? 0 : 2.5, // Remove points for large datasets
                        pointHoverRadius: 4,
                        pointBackgroundColor: '#FFFFFF',
                        pointBorderColor: '#8A78FF',
                        pointBorderWidth: 1.4,
                        fill: true,
                        tension: 0.35,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Performance optimization
                elements: {
                    line: {
                        capBezierPoints: false // Performance optimization for large datasets
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
                            boxWidth: 18,
                            boxHeight: 4,
                        },
                    },
                    tooltip: {
                        enabled: true,
                        animation: { duration: 0 } // Disable tooltip animation for speed
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
                        },
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            color: 'rgba(71, 19, 150, 0.58)',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: period === '7days' ? 7 : 12
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
    }, [labels, signups, period]);

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
                        <h2 className="admin-dashboard-purple text-[2rem] font-semibold leading-tight">Platform Traffic</h2>
                        <p className="admin-dashboard-soft-text mt-1 text-sm">New client signups overtime</p>
                    </div>
                    <div className="admin-dashboard-inset-panel flex gap-1 rounded-xl p-1 relative" suppressHydrationWarning>
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
                                        layoutId="periodTabBackground"
                                        className="absolute inset-0 rounded-lg admin-dashboard-yellow-fill shadow-sm"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{p.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="admin-dashboard-inset-panel rounded-[20px] p-6 sm:p-8 w-full">
                    <canvas ref={trafficChartRef} height="110" className="w-full"></canvas>
                </div>
            </div>
        </motion.div>
    );
}
