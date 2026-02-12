/*
Eto naman wala lang, cards lang to na may icon, value, growth, color, at colors.
Overview lang den for store owner
*/

import React from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
    title: string;
    value: string | number;
    growth?: number;
    icon: React.ReactNode;
    color: string;
    colors: any;
}

export const MetricCard = ({ title, value, growth, icon, color, colors }: MetricCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6 shadow-sm hover:shadow-lg transition-all duration-300"
        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
    >
        <div className="flex items-center justify-between mb-4">
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}20` }}
            >
                <div style={{ color }}>{icon}</div>
            </div>
            {growth !== undefined && (
                <div className={`flex items-center gap-1 text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={growth >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}
                        />
                    </svg>
                    {Math.abs(growth)}%
                </div>
            )}
        </div>
        <div>
            <p className="text-sm font-medium mb-1" style={{ color: colors.text.muted }}>{title}</p>
            <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{value}</p>
        </div>
    </motion.div>
);
