'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getPlanDotClass, getPlanLabel, getPlanSolidColor } from '@/lib/config/planConfig';

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

type Distribution = { free: number; basic: number; pro: number };

type Props = {
    distribution?: Distribution | null;
    loading?: boolean;
};

export default function SubscriptionDistribution({ distribution, loading }: Props) {
    const raw = [
        { label: getPlanLabel('free'), value: distribution?.free ?? 0, color: getPlanSolidColor('free'), dotClass: getPlanDotClass('free') },
        { label: getPlanLabel('basic'), value: distribution?.basic ?? 0, color: getPlanSolidColor('basic'), dotClass: getPlanDotClass('basic') },
        { label: getPlanLabel('pro'), value: distribution?.pro ?? 0, color: getPlanSolidColor('pro'), dotClass: getPlanDotClass('pro') },
    ];
    const totalSubscriptions = raw.reduce((sum, item) => sum + item.value, 0);
    const subscriptionData = totalSubscriptions > 0
        ? raw.map((item) => ({ ...item, value: Math.round((item.value / totalSubscriptions) * 100) }))
        : raw.map((item) => ({ ...item, value: 0 }));

    let cumulativeAngle = 0;
    const subscriptionSegments = subscriptionData.map((item) => {
        const totalPct = subscriptionData.reduce((s, i) => s + i.value, 0) || 1;
        const startAngle = (cumulativeAngle / totalPct) * 360;
        cumulativeAngle += item.value;
        const endAngle = (cumulativeAngle / totalPct) * 360;
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
                        <h2 className="admin-dashboard-purple text-[2rem] font-semibold leading-tight">Subscription Distribution</h2>
                        <p className="admin-dashboard-soft-text mt-1 text-sm">Current plan mix across the platform</p>
                    </div>
                </div>

                <div className="admin-dashboard-inset-panel rounded-[20px] p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row items-center gap-10">
                        <svg viewBox="0 0 360 360" className="w-full max-w-[280px] aspect-square">
                            {subscriptionSegments.map((segment) => {
                                const span = segment.endAngle - segment.startAngle;
                                if (span < 0.01) return null;
                                if (span >= 359.99) {
                                    return <circle key={segment.label} cx="180" cy="180" r="120" fill={segment.color} />;
                                }
                                return (
                                    <path
                                        key={segment.label}
                                        d={describeArc(180, 180, 120, segment.startAngle, segment.endAngle)}
                                        fill={segment.color}
                                    />
                                );
                            })}
                            <circle cx="180" cy="180" r="68" fill="#ffffff" />
                            <text x="180" y="175" fontSize="16" fill="#471396" textAnchor="middle" fontWeight="600">
                                {loading ? '…' : 'Clients'}
                            </text>
                            <text x="180" y="200" fontSize="20" fill="#471396" textAnchor="middle" fontWeight="700">
                                {loading ? '—' : totalSubscriptions}
                            </text>
                        </svg>

                        <div className="space-y-4 w-full">
                            {subscriptionSegments.map((segment) => (
                                <div key={`legend-${segment.label}`} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`h-3 w-3 rounded-full ${segment.dotClass}`} />
                                        <span className="admin-dashboard-soft-text text-sm font-medium">{segment.label}</span>
                                    </div>
                                    <span className="admin-dashboard-purple text-sm font-semibold">{segment.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
