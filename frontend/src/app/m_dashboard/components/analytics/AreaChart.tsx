/*
Eto yung mukhang Line graph, ngayon ay optimized na with smooth curves and proper scaling.
*/

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AreaChartProps {
    data: Array<{ month: string; revenue: number }>;
    color: string;
    colors: any;
}

export const AreaChart = ({ data, color, colors }: AreaChartProps) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!data || data.length === 0) return null;

    const maxRevenue = Math.max(...data.map(item => item.revenue));
    const minRevenue = 0; // Or Math.min(...data.map(item => item.revenue)) * 0.8 for dynamic floor

    // Chart Dimensions (Internal Coordinate System for SVG)
    // Using a wider aspect ratio to minimize distortion if we used preservedAspectRatio="none"
    // But since we want perfect circles, we will separate the chart logic slightly or overlay markers.
    // For simplicity and performance, we'll use a responsive SVG with percentage-based points calculation.

    // We will render the SVG as 100% width/height, but calculate points based on a virtual viewBox
    // matching the approximate aspect ratio to keep curves nice.
    const viewBoxWidth = 800;
    const viewBoxHeight = 300;
    const paddingX = 40;
    const paddingY = 40;

    const chartWidth = viewBoxWidth - paddingX * 2;
    const chartHeight = viewBoxHeight - paddingY * 2;

    // Helper to get coordinates
    const getX = (index: number) => paddingX + (index / (data.length - 1)) * chartWidth;
    const getY = (val: number) => viewBoxHeight - paddingY - ((val / maxRevenue) * chartHeight);

    // Generate Points
    const points = data.map((item, index) => ({
        x: getX(index),
        y: getY(item.revenue),
        ...item
    }));

    // Generate Smooth Path (Catmull-Rom like spline or simple cubic bezier)
    // For simplicity, a basic smoothing function:
    const generateSmoothPath = (pts: typeof points) => {
        if (pts.length === 0) return "";
        let d = `M ${pts[0].x} ${pts[0].y}`;

        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i == 0 ? i : i - 1];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2] || p2;

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;

            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
        return d;
    };

    const linePath = generateSmoothPath(points);
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${viewBoxHeight} L ${points[0].x} ${viewBoxHeight} Z`;

    return (
        <div className="relative w-full min-h-[250px] flex flex-col font-sans">
            {/* Chart Container */}
            <div className="relative flex-1 w-full overflow-hidden">
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                    preserveAspectRatio="none"
                    className="overflow-visible"
                    style={{ minHeight: '100%' }}
                >
                    <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                            <stop offset="60%" stopColor={color} stopOpacity="0.1" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                        {/* Glow Filter */}
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Grid Lines (Horizontal) */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                        const y = viewBoxHeight - paddingY - (tick * chartHeight);
                        return (
                            <line
                                key={tick}
                                x1={0}
                                y1={y}
                                x2={viewBoxWidth}
                                y2={y}
                                stroke={colors.border.faint}
                                strokeWidth="1"
                                strokeDasharray="4,4"
                                opacity="0.3"
                            />
                        );
                    })}

                    {/* Area Fill */}
                    <motion.path
                        d={areaPath}
                        fill="url(#areaGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    />

                    {/* Stroke Line */}
                    <motion.path
                        d={linePath}
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                </svg>

                {/* DOM Overlay for Tooltips & Markers (To keep them perfectly circular and interactive properties clean) */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* We map the SVG coordinates back to percentage to position HTML elements */}
                    {points.map((point, index) => {
                        const left = (point.x / viewBoxWidth) * 100 + '%';
                        const top = (point.y / viewBoxHeight) * 100 + '%';

                        return (
                            <div
                                key={index}
                                className="absolute flex items-center justify-center group pointer-events-auto"
                                style={{
                                    left,
                                    top,
                                    transform: 'translate(-50%, -50%)',
                                    width: '24px',
                                    height: '24px'
                                }}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* Core Dot */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1 + index * 0.1 }}
                                    className="w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 shadow-sm z-10 transition-transform duration-200 ease-out group-hover:scale-125"
                                    style={{ backgroundColor: color }}
                                />

                                {/* Halo (Visible on Hover) */}
                                <div
                                    className={`absolute inset-0 rounded-full opacity-30 scale-0 transition-transform duration-200 group-hover:scale-150`}
                                    style={{ backgroundColor: color }}
                                />

                                {/* Tooltip */}
                                {hoveredIndex === index && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: -28 }}
                                        className="absolute bottom-full whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl backdrop-blur-md z-20 pointer-events-none"
                                        style={{
                                            backgroundColor: colors.bg.elevated,
                                            color: colors.text.primary,
                                            border: `1px solid ${colors.border.faint}`
                                        }}
                                    >
                                        ${point.revenue.toLocaleString()}
                                        <div
                                            className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b"
                                            style={{
                                                backgroundColor: colors.bg.elevated,
                                                borderColor: colors.border.faint,
                                                borderRight: '1px solid',
                                                borderBottom: '1px solid',
                                                borderLeft: 'none',
                                                borderTop: 'none'
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* X Axis Labels */}
            <div className="relative w-full h-6 mt-3 border-t pt-2" style={{ borderColor: colors.border.faint }}>
                {points.map((point, index) => {
                    const left = (point.x / viewBoxWidth) * 100 + '%';
                    return (
                        <span
                            key={index}
                            className="absolute top-2 text-xs font-medium uppercase tracking-wide transition-colors transform -translate-x-1/2"
                            style={{
                                left,
                                color: hoveredIndex === index ? color : colors.text.muted,
                                opacity: hoveredIndex === index ? 1 : 0.7
                            }}
                        >
                            {point.month}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
