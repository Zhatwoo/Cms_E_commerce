'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// ── Simple count-up component ───────────────────────────────────────────────
function CountUpNumber({
    end,
    duration = 1600,
    className = '',
}: {
    end: number;
    duration?: number;
    className?: string;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-40px' });

    const count = React.useRef(0);

    React.useEffect(() => {
        if (!isInView || !ref.current) return;

        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const value = Math.floor(end * progress);

            if (ref.current) {
                ref.current.textContent = value.toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [isInView, end, duration]);

    return (
        <span ref={ref} className={className}>
            0
        </span>
    );
}

// ── Variants ─────────────────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.13,
            delayChildren: 0.08,
        },
    },
};

// ── Main component ───────────────────────────────────────────────────────────
export function DashboardContent() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    // Progress percentage (you can make this dynamic later)
    const usagePercent = 68;

    const circumference = 2 * Math.PI * 70;
    const offset = circumference * (1 - usagePercent / 100);

    return (
        <main className="flex-1 overflow-y-auto text-gray-100">
            <div ref={ref} className="p-6 lg:p-8 space-y-10 lg:space-y-16 max-w-[1600px] mx-auto">

                {/* Title */}
                <motion.h1
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={fadeUp}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="text-3xl lg:text-4xl font-bold tracking-tight"
                >
                    Dashboard
                </motion.h1>

                {/* KPI Cards – staggered */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6"
                >
                    {/* Card 1 */}
                    <motion.div
                        variants={fadeUp}
                        transition={{ duration: 0.75 }}
                        className="group bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-gray-800 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:bg-black/50"
                    >
                        <p className="text-sm text-gray-400 font-medium mb-1">Total Projects</p>
                        <CountUpNumber
                            end={123456}
                            className="text-3xl lg:text-4xl font-bold tracking-tight"
                        />
                        <div className="mt-2">
                            <span className="inline-flex items-center text-xs text-gray-500">
                                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 14l5-5 5 5z" />
                                </svg>
                                +12.4% from last month
                            </span>
                        </div>
                    </motion.div>

                    {/* Card 2 */}
                    <motion.div
                        variants={fadeUp}
                        transition={{ duration: 0.75 }}
                        className="group bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-gray-800 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:bg-black/50"
                    >
                        <p className="text-sm text-gray-400 font-medium mb-1">Published Sites</p>
                        <CountUpNumber
                            end={87421}
                            className="text-3xl lg:text-4xl font-bold tracking-tight"
                        />
                        <div className="mt-2">
                            <span className="inline-flex items-center text-xs text-emerald-400">
                                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 14l5-5 5 5z" />
                                </svg>
                                +8.7% this week
                            </span>
                        </div>
                    </motion.div>

                    {/* Card 3 */}
                    <motion.div
                        variants={fadeUp}
                        transition={{ duration: 0.75 }}
                        className="group bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-gray-800 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:bg-black/50"
                    >
                        <p className="text-sm text-gray-400 font-medium mb-1">Under Review</p>
                        <CountUpNumber
                            end={5623}
                            className="text-3xl lg:text-4xl font-bold tracking-tight"
                        />
                        <div className="mt-2">
                            <span className="inline-flex items-center text-xs text-amber-400">
                                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                14 pending
                            </span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Analytics + Usage Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Main chart area */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.9, delay: 0.15 }}
                        className="lg:col-span-2 bg-black/35 backdrop-blur-xl rounded-xl border border-gray-800 shadow-xl p-6 min-h-[340px] lg:min-h-[420px] flex items-center justify-center"
                    >
                        <p className="text-gray-500 text-lg font-medium">Main Analytics / Chart Placeholder</p>
                    </motion.div>

                    {/* Usage Summary – animated ring */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.9, delay: 0.3 }}
                        className="bg-black/35 backdrop-blur-xl rounded-xl border border-gray-800 shadow-xl p-6 flex flex-col items-center justify-center min-h-[340px]"
                    >
                        <h3 className="text-lg font-semibold mb-8">Usage Summary</h3>

                        <div className="relative w-44 h-44">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                {/* Background ring */}
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="14"
                                    className="text-gray-800/70"
                                />
                                {/* Animated progress */}
                                <motion.circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="14"
                                    strokeDasharray={circumference}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={isInView ? { strokeDashoffset: offset } : {}}
                                    transition={{
                                        duration: 1.5,
                                        ease: 'easeOut',
                                        delay: 0.4,
                                    }}
                                    strokeLinecap="round"
                                    className="text-gray-300"
                                />
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-4xl lg:text-5xl font-bold">
                                    {usagePercent}
                                    <span className="text-2xl">%</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Storage Used</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Projects / Websites Section */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.9, delay: 0.5 }}
                    className="space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
                            Projects / Websites
                        </h2>
                        {/* Filter button – can add later */}
                    </div>

                    {/* Web preview placeholder */}
                    <div className="bg-black/35 backdrop-blur-xl rounded-xl p-8 min-h-[240px] flex items-center justify-center border border-gray-800 shadow-xl">
                        <p className="text-gray-500 text-lg font-medium">Web Preview / Selected Project</p>
                    </div>

                    {/* Table placeholder */}
                    <div className="bg-black/35 backdrop-blur-xl rounded-xl border border-gray-800 shadow-xl overflow-hidden">
                        <div className="p-6">
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-gray-700/50" />
                                            <div>
                                                <div className="font-medium">Project {i}</div>
                                                <div className="text-sm text-gray-500">example-domain.com</div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-400">Active</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.section>
            </div>
        </main>
    );
}