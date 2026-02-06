'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function PlatformTraffic() {
    const [timePeriod, setTimePeriod] = useState('7days');
    const trafficChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (!trafficChartRef.current) return;

        const getChartData = () => {
            if (timePeriod === '7days') {
                return {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    visitors: [270, 300, 360, 330, 410, 380, 450],
                    signups: [120, 150, 180, 170, 210, 200, 240],
                };
            } else if (timePeriod === '30days') {
                return {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    visitors: [2100, 2450, 2890, 3200],
                    signups: [850, 980, 1120, 1350],
                };
            } else {
                return {
                    labels: ['Jan', 'Feb', 'Mar'],
                    visitors: [8500, 9200, 10100],
                    signups: [3200, 3800, 4200],
                };
            }
        };

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const chartData = getChartData();
        const ctx = trafficChartRef.current.getContext('2d');
        if (!ctx) return;

        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Visitors',
                        data: chartData.visitors,
                        borderColor: '#1d4ed8',
                        backgroundColor: 'rgba(29, 78, 216, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: 'Signups',
                        data: chartData.signups,
                        borderColor: '#64748b',
                        backgroundColor: 'rgba(100, 116, 139, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
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
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [timePeriod]);

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
                        <h2 className="text-2xl font-semibold text-slate-900">Platform Traffic</h2>
                        <p className="text-sm text-slate-500 mt-1">Visitors and signups performance</p>
                    </div>
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1" suppressHydrationWarning>
                        {[
                            { id: '7days', label: 'Last 7 days' },
                            { id: '30days', label: 'Last 30 days' },
                            { id: '3months', label: 'Last 3 months' },
                        ].map((period) => (
                            <button
                                key={period.id}
                                onClick={() => setTimePeriod(period.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    timePeriod === period.id
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
                    <canvas ref={trafficChartRef} height="80"></canvas>
                </div>
            </div>
        </motion.div>
    );
}
