'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function RevenueGrowth() {
    const [revenueTimePeriod, setRevenueTimePeriod] = useState('7days');
    const revenueChartRef = useRef<HTMLCanvasElement>(null);
    const revenueChartInstanceRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (!revenueChartRef.current) return;

        const getRevenueData = () => {
            if (revenueTimePeriod === '7days') {
                return {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    free: [3200, 3800, 4200, 3900, 4500, 4100, 5000],
                    basic: [4500, 5200, 5800, 5400, 6200, 5700, 6800],
                    pro: [3100, 4000, 5200, 4800, 6500, 6100, 7500],
                    enterprise: [1700, 2300, 3000, 2700, 4200, 3600, 5000],
                };
            } else if (revenueTimePeriod === '30days') {
                return {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    free: [28500, 31200, 34800, 38200],
                    basic: [38200, 41500, 45600, 50200],
                    pro: [26800, 30400, 35200, 40800],
                    enterprise: [11900, 15300, 19500, 24000],
                };
            } else {
                return {
                    labels: ['Jan', 'Feb', 'Mar'],
                    free: [98500, 108200, 119500],
                    basic: [157800, 173200, 189800],
                    pro: [124500, 137800, 152200],
                    enterprise: [44200, 59800, 79500],
                };
            }
        };

        if (revenueChartInstanceRef.current) {
            revenueChartInstanceRef.current.destroy();
        }

        const revenueData = getRevenueData();
        const ctx = revenueChartRef.current.getContext('2d');
        if (!ctx) return;

        revenueChartInstanceRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: revenueData.labels,
                datasets: [
                    {
                        label: 'Free',
                        data: revenueData.free,
                        backgroundColor: '#DBEAFE',
                        borderColor: '#93C5FD',
                        borderWidth: 1,
                        borderRadius: 6,
                    },
                    {
                        label: 'Basic',
                        data: revenueData.basic,
                        backgroundColor: '#93C5FD',
                        borderColor: '#60A5FA',
                        borderWidth: 1,
                        borderRadius: 6,
                    },
                    {
                        label: 'Pro',
                        data: revenueData.pro,
                        backgroundColor: '#3B82F6',
                        borderColor: '#1D4ED8',
                        borderWidth: 1,
                        borderRadius: 6,
                    },
                    {
                        label: 'Enterprise',
                        data: revenueData.enterprise,
                        backgroundColor: '#1E40AF',
                        borderColor: '#1E3A8A',
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
    }, [revenueTimePeriod]);

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
                        <p className="text-sm text-slate-500 mt-1">Revenue by subscription plan</p>
                    </div>
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                        {[
                            { id: '7days', label: 'Last 7 days' },
                            { id: '30days', label: 'Last 30 days' },
                            { id: '3months', label: 'Last 3 months' },
                        ].map((period) => (
                            <button
                                key={period.id}
                                onClick={() => setRevenueTimePeriod(period.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    revenueTimePeriod === period.id
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                                suppressHydrationWarning
                            >
                                {period.label}
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
