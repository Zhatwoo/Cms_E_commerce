/*
Eto naman literal order status, para lang den may idea agad si store owner kung madami ba syang successfull na orders
or madaming bumalik sa kanya which is very bad for business   
*/

import React from 'react';
import { motion } from 'framer-motion';

interface RadialProgressChartProps {
    data: Array<{ label: string; value: number; percentage: number }>;
    colors: string[];
    themeColors: any;
}

export const RadialProgressChart = ({ data, colors: chartColors, themeColors }: RadialProgressChartProps) => {
    const size = 60;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    return (
        <div className="flex flex-wrap gap-6 justify-center">
            {data.map((item, index) => {
                const offset = circumference - (item.percentage / 100) * circumference;
                const color = chartColors[index % chartColors.length];

                return (
                    <motion.div
                        key={index}
                        className="flex flex-col items-center gap-3"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <div className="relative">
                            <svg width={size * 2} height={size * 2} className="transform -rotate-90">
                                {/* Background Circle */}
                                <circle
                                    cx={size}
                                    cy={size}
                                    r={radius}
                                    fill="none"
                                    stroke={themeColors.border.faint}
                                    strokeWidth={strokeWidth}
                                />

                                {/* Progress Circle */}
                                <motion.circle
                                    cx={size}
                                    cy={size}
                                    r={radius}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: offset }}
                                    transition={{ duration: 1.5, ease: "easeInOut", delay: index * 0.2 }}
                                />
                            </svg>

                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-lg font-bold" style={{ color: themeColors.text.primary }}>
                                        {item.percentage}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-sm font-medium" style={{ color: themeColors.text.primary }}>
                                {item.label}
                            </p>
                            <p className="text-xs" style={{ color: themeColors.text.muted }}>
                                {item.value} orders
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
