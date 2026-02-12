/*
Etong funnel chart ginagamet to visualize yung traffic and activities ng mga user sa website. 
Very useful na chart to para makita agad ni store owner yung overall activity ng website nya
*/

import React from 'react';
import { motion } from 'framer-motion';

interface FunnelChartProps {
    colors: any;
}

export const FunnelChart = ({ colors }: FunnelChartProps) => {
    const funnelData = [
        { stage: 'Visits', count: 45678, percentage: 100, color: '#3b82f6' },
        { stage: 'Add to Cart', count: 12890, percentage: 28.2, color: '#8b5cf6' },
        { stage: 'Checkout', count: 8234, percentage: 18.0, color: '#f59e0b' },
        { stage: 'Purchase', count: 342, percentage: 7.5, color: '#10b981' }
    ];

    const maxCount = funnelData[0].count;
    const funnelHeight = 240;
    const stageHeight = 50;
    const maxWidth = 300;
    const minWidth = 80;

    return (
        <div className="relative w-full flex flex-col items-center">
            <div className="relative" style={{ width: maxWidth + 180, height: funnelHeight }}>
                {/* SVG Funnel */}
                <svg width={maxWidth + 180} height={funnelHeight} className="overflow-visible">
                    {/* Funnel Shape */}
                    {funnelData.map((stage, index) => {
                        const y = index * stageHeight;
                        const width = minWidth + (maxWidth - minWidth) * (stage.count / maxCount);
                        const x = (maxWidth - width) / 2;

                        if (index === funnelData.length - 1) {
                            // Last stage - create trapezoid
                            const nextWidth = minWidth;
                            const nextX = (maxWidth - nextWidth) / 2;

                            return (
                                <motion.g key={stage.stage}>
                                    <motion.path
                                        d={`M ${x} ${y} L ${x + width} ${y} L ${nextX + nextWidth} ${y + stageHeight} L ${nextX} ${y + stageHeight} Z`}
                                        fill={stage.color}
                                        fillOpacity={0.15}
                                        stroke={stage.color}
                                        strokeWidth="2"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 0.8, delay: index * 0.2 }}
                                    />
                                    <motion.path
                                        d={`M ${x} ${y} L ${x + width} ${y} L ${nextX + nextWidth} ${y + stageHeight} L ${nextX} ${y + stageHeight} Z`}
                                        fill={stage.color}
                                        fillOpacity={0.8}
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                                    />
                                </motion.g>
                            );
                        } else {
                            // Create trapezoid segments
                            const nextWidth = minWidth + (maxWidth - minWidth) * (funnelData[index + 1].count / maxCount);
                            const nextX = (maxWidth - nextWidth) / 2;

                            return (
                                <motion.g key={stage.stage}>
                                    <motion.path
                                        d={`M ${x} ${y} L ${x + width} ${y} L ${nextX + nextWidth} ${y + stageHeight} L ${nextX} ${y + stageHeight} Z`}
                                        fill={stage.color}
                                        fillOpacity={0.15}
                                        stroke={stage.color}
                                        strokeWidth="2"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 0.8, delay: index * 0.2 }}
                                    />
                                    <motion.path
                                        d={`M ${x} ${y} L ${x + width} ${y} L ${nextX + nextWidth} ${y + stageHeight} L ${nextX} ${y + stageHeight} Z`}
                                        fill={stage.color}
                                        fillOpacity={0.8}
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                                    />
                                    {/* Percentage Text Inside Funnel */}
                                    <motion.text
                                        x={x + width / 2}
                                        y={y + stageHeight / 2}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-white font-bold"
                                        style={{ fontSize: '14px' }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5, delay: index * 0.2 + 0.6 }}
                                    >
                                        {stage.percentage}%
                                    </motion.text>
                                </motion.g>
                            );
                        }
                    })}

                    {/* Connector Lines */}
                    {funnelData.map((stage, index) => {
                        const y = index * stageHeight + stageHeight / 2;
                        const width = minWidth + (maxWidth - minWidth) * (stage.count / maxCount);
                        const x = (maxWidth - width) / 2;
                        const labelX = maxWidth + 20;

                        return (
                            <motion.line
                                key={`line-${stage.stage}`}
                                x1={x + width}
                                y1={y}
                                x2={labelX}
                                y2={y}
                                stroke={stage.color}
                                strokeWidth="1"
                                strokeDasharray="4,2"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.6 }}
                                transition={{ duration: 0.5, delay: index * 0.2 + 0.8 }}
                            />
                        );
                    })}
                </svg>

                {/* Stage Labels on the Right */}
                {funnelData.map((stage, index) => {
                    const y = index * stageHeight + stageHeight / 2;
                    const width = minWidth + (maxWidth - minWidth) * (stage.count / maxCount);
                    const x = (maxWidth - width) / 2;
                    const labelX = maxWidth + 30;
                    const dropoff = index > 0 ?
                        ((funnelData[index - 1].count - stage.count) / funnelData[index - 1].count * 100) : 0;

                    return (
                        <motion.div
                            key={stage.stage}
                            className="absolute"
                            style={{
                                top: y - 15,
                                left: labelX,
                                width: 140
                            }}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.2 + 0.6 }}
                        >
                            <div className="flex items-start gap-2">
                                <div>
                                    <div className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                                        {stage.stage}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary Stats Below */}
            <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-sm mx-auto">
                <div className="text-center p-4 rounded-xl border" style={{
                    backgroundColor: colors.bg.elevated,
                    borderColor: colors.border.faint
                }}>
                    <p className="text-2xl font-bold text-green-500">
                        7.5%
                    </p>
                    <p className="text-sm mt-1" style={{ color: colors.text.muted }}>Conversion Rate</p>
                </div>
                <div className="text-center p-4 rounded-xl border" style={{
                    backgroundColor: colors.bg.elevated,
                    borderColor: colors.border.faint
                }}>
                    <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                        $367
                    </p>
                    <p className="text-sm mt-1" style={{ color: colors.text.muted }}>Avg Order Value</p>
                </div>
            </div>
        </div>
    );
};
