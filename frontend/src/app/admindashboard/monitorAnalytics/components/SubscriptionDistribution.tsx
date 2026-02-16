'use client';

import React from 'react';
import { motion } from 'framer-motion';

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
};

const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
};

export default function SubscriptionDistribution() {
    const subscriptionData = [
        { label: 'Free', value: 35, color: '#94a3b8' },
        { label: 'Basic', value: 30, color: '#2563eb' },
        { label: 'Pro', value: 25, color: '#22c55e' },
        { label: 'Enterprise', value: 10, color: '#f59e0b' },
    ];

    const totalSubscriptions = subscriptionData.reduce((sum, item) => sum + item.value, 0);
    let cumulativeAngle = 0;
    const subscriptionSegments = subscriptionData.map((item) => {
        const startAngle = (cumulativeAngle / totalSubscriptions) * 360;
        cumulativeAngle += item.value;
        const endAngle = (cumulativeAngle / totalSubscriptions) * 360;
        return { ...item, startAngle, endAngle };
    });

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
                        <h2 className="text-2xl font-semibold text-slate-900">Subscription Distribution</h2>
                        <p className="text-sm text-slate-500 mt-1">Current plan mix across the platform</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-8 border border-slate-200">
                    <div className="flex flex-col lg:flex-row items-center gap-10">
                        <svg viewBox="0 0 360 360" className="w-full max-w-[280px]" style={{ aspectRatio: '360/360' }}>
                            {subscriptionSegments.map((segment) => (
                                <path
                                    key={segment.label}
                                    d={describeArc(180, 180, 120, segment.startAngle, segment.endAngle)}
                                    fill={segment.color}
                                />
                            ))}
                            <circle cx="180" cy="180" r="68" fill="#ffffff" />
                            <text x="180" y="175" fontSize="16" fill="#0f172a" textAnchor="middle" fontWeight="600">
                                Total
                            </text>
                            <text x="180" y="200" fontSize="20" fill="#0f172a" textAnchor="middle" fontWeight="700">
                                {totalSubscriptions}%
                            </text>
                        </svg>

                        <div className="space-y-4 w-full">
                            {subscriptionSegments.map((segment) => (
                                <div key={`legend-${segment.label}`} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                                        <span className="text-sm font-medium text-slate-700">{segment.label}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">{segment.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
