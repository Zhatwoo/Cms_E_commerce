'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, type Variants } from 'framer-motion';

const BriefcaseIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const ArrowUpIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
    </svg>
);

const RefreshIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const FilterIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);

type DashboardInfraMetrics = {
    activeRegions: number;
    regionsDelta: number;
    uptimePercent: number;
    avgLatencyMs: number;
    errorRatePercent: number;
};

/**
 * Lightweight Three.js scene:
 * - Rotating wireframe sphere whose color reflects uptime
 * - Particle ring whose density & color respond to regions & error rate
 * - Soft camera movement scaled by latency “instability”
 */
const Dashboard3DScene: React.FC<{ metrics: DashboardInfraMetrics }> = ({ metrics }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        const handleVisibility = () => setIsVisible(!document.hidden);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    useEffect(() => {
        if (!containerRef.current || !isVisible) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight || 360;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x020617, 0.06);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 1.4, 4);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        // ── Metric → visual mapping ───────────────────────────────────────
        const clampedUptime = Math.max(0, Math.min(100, metrics.uptimePercent));
        const clampedError = Math.max(0, Math.min(100, metrics.errorRatePercent));
        const latencyFactorBase = Math.min(1.8, Math.max(0.6, metrics.avgLatencyMs / 120));

        let sphereColor = 0x22d3ee; // default teal
        if (clampedUptime >= 99.9 && clampedError < 0.5) sphereColor = 0x22c55e;
        else if (clampedUptime < 99.5 || clampedError > 2) sphereColor = 0xf97316;
        if (clampedUptime < 98.5 || clampedError > 5) sphereColor = 0xef4444;

        const particleCount = Math.min(900, 260 + metrics.activeRegions * 20);

        // Sphere
        const sphereGeometry = new THREE.SphereGeometry(1.1, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(sphereColor),
            wireframe: true,
            transparent: true,
            opacity: 0.7,
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(sphere);

        // Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const radius = 2.2;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.25;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.45;
            positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.25;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        let particleColor = 0x38bdf8;
        if (clampedError > 1 && clampedError <= 3) particleColor = 0xfacc15;
        else if (clampedError > 3) particleColor = 0xf97316;

        const particlesMaterial = new THREE.PointsMaterial({
            color: new THREE.Color(particleColor),
            size: 0.03,
            transparent: true,
            opacity: 0.9,
        });
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        scene.add(new THREE.AmbientLight(0x38bdf8, 0.35));

        const dirLight = new THREE.DirectionalLight(0x22d3ee, 1.1);
        dirLight.position.set(3, 4, 2);
        scene.add(dirLight);


        // ── Animation ──────────────────────────────────────────────────────
        let frameId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            if (!isVisible) {
                frameId = requestAnimationFrame(animate);
                return;
            }

            const elapsed = clock.getElapsedTime();
            const motionFactor = reducedMotion ? 0.08 : latencyFactorBase;

            sphere.rotation.y = elapsed * 0.25 * motionFactor;
            sphere.rotation.x = reducedMotion ? 0 : Math.sin(elapsed * 0.18 * motionFactor) * 0.25;

            particles.rotation.y = elapsed * 0.08 * motionFactor;
            particles.rotation.x = reducedMotion ? 0 : Math.sin(elapsed * 0.12 * motionFactor) * 0.08;

            if (!reducedMotion) {
                camera.position.x = Math.sin(elapsed * 0.15 * motionFactor) * 0.6;
                camera.position.z = 4 + Math.cos(elapsed * 0.18 * motionFactor) * 0.4;
            }
            camera.lookAt(0, 0.6, 0);

            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
        };
        animate();

        // Resize
        const onResize = () => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight || 360;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', onResize);
            container.removeChild(renderer.domElement);
            sphereGeometry.dispose();
            sphereMaterial.dispose();
            particlesGeometry.dispose();
            particlesMaterial.dispose();
            renderer.dispose();
        };
    }, [metrics, isVisible, reducedMotion]);

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-[4/3] min-h-[320px] max-h-[480px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            aria-label="Live 3D infrastructure visualization"
            role="img"
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_60%)] mix-blend-screen" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-sky-300">
                            Live Infrastructure Map
                        </p>
                        <p className="mt-1 text-lg sm:text-xl font-semibold text-white">
                            Global deployment health
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1.5 border border-sky-500/30 shadow-lg shadow-sky-900/30">
                        <span
                            className={`h-1.5 w-1.5 rounded-full bg-emerald-400 ${reducedMotion ? '' : 'animate-ping'}`}
                            aria-hidden="true"
                        />
                        <span className="text-[11px] font-medium text-emerald-200">Real-time</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md text-xs sm:text-[13px] text-slate-200/90">
                    <div className="rounded-xl bg-slate-950/60 border border-sky-500/25 px-3 py-2.5 backdrop-blur-md">
                        <p className="text-[11px] font-medium text-slate-300 uppercase tracking-[0.16em]">
                            Active regions
                        </p>
                        <p className="mt-1 text-base font-semibold text-sky-100">{metrics.activeRegions}</p>
                        <p className="text-[11px] text-emerald-300 mt-0.5">
                            {metrics.regionsDelta > 0 ? `+${metrics.regionsDelta}` : metrics.regionsDelta} this week
                        </p>
                    </div>
                    <div className="rounded-xl bg-slate-950/60 border border-slate-700/60 px-3 py-2.5 backdrop-blur-md">
                        <p className="text-[11px] font-medium text-slate-300 uppercase tracking-[0.16em]">
                            Uptime
                        </p>
                        <p className="mt-1 text-base font-semibold text-emerald-200">
                            {metrics.uptimePercent.toFixed(3)}%
                        </p>
                        <p className="text-[11px] text-emerald-300 mt-0.5">
                            {metrics.uptimePercent >= 99.9 ? 'SLA on track' : 'Investigating blips'}
                        </p>
                    </div>
                    <div className="rounded-xl bg-slate-950/60 border border-slate-700/60 px-3 py-2.5 backdrop-blur-md">
                        <p className="text-[11px] font-medium text-slate-300 uppercase tracking-[0.16em]">
                            Avg latency
                        </p>
                        <p className="mt-1 text-base font-semibold text-sky-100">{metrics.avgLatencyMs} ms</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">p95 worldwide</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 16, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1 },
};

export function DashboardContent() {
    const infraMetrics: DashboardInfraMetrics = {
        activeRegions: 18,
        regionsDelta: 3,
        uptimePercent: 99.982,
        avgLatencyMs: 82,
        errorRatePercent: 0.4,
    };

    return (
        <main className="flex-1 text-white overflow-y-auto">
            <div className="p-6 space-y-8">
                {/* Dashboard Title + subtitle */}
                <div className="flex flex-col gap-2">
                    <motion.h1
                        className="text-3xl sm:text-4xl font-semibold tracking-tight text-white"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        Dashboard
                    </motion.h1>
                    <motion.p
                        className="text-sm sm:text-base text-slate-300 max-w-xl"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.08, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        Monitor every deployment, domain, and template in one place with live health and usage
                        insights.
                    </motion.p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Projects Card */}
                    <motion.div
                        className="relative overflow-hidden bg-white/10 backdrop-blur-2xl rounded-2xl p-5 flex items-center justify-between border border-white/20 shadow-[0_18px_65px_rgba(15,23,42,0.9)]"
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ y: -4, scale: 1.01 }}
                        transition={{
                            delay: 0.1,
                            duration: 0.38,
                            ease: [0.23, 0.82, 0.25, 1],
                            type: 'spring',
                            stiffness: 260,
                            damping: 24,
                        }}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.24),transparent_60%)] opacity-80 pointer-events-none" />
                        <div className="relative">
                            <p className="text-xs font-semibold text-slate-900/80 uppercase tracking-[0.18em]">
                                Total projects
                            </p>
                            <p className="mt-2 text-3xl font-semibold text-slate-950">123,456</p>
                            <p className="mt-1 text-xs text-slate-800">
                                +1,204 new workspaces <span className="text-emerald-700 font-medium">this week</span>
                            </p>
                        </div>
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 shadow-lg shadow-amber-500/60 text-slate-950">
                            <BriefcaseIcon />
                        </div>
                    </motion.div>

                    {/* Published Sites Card */}
                    <motion.div
                        className="relative overflow-hidden bg-slate-900/70 backdrop-blur-2xl rounded-2xl p-5 flex items-center justify-between border border-sky-500/30 shadow-[0_18px_65px_rgba(8,47,73,0.85)]"
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ y: -4, scale: 1.01 }}
                        transition={{
                            delay: 0.18,
                            duration: 0.38,
                            ease: [0.23, 0.82, 0.25, 1],
                            type: 'spring',
                            stiffness: 260,
                            damping: 24,
                        }}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),transparent_55%),radial-gradient(circle_at_bottom,_rgba(8,47,73,0.9),transparent_60%)] opacity-80 pointer-events-none" />
                        <div className="relative">
                            <p className="text-xs font-semibold text-sky-200 uppercase tracking-[0.18em]">
                                Published sites
                            </p>
                            <p className="mt-2 text-3xl font-semibold text-white">123,456</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-sky-100/90">
                                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-400/30">
                                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    98.6% live
                                </span>
                                <span>+6.4% vs last week</span>
                            </div>
                        </div>
                        <motion.div
                            className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/90 shadow-lg shadow-sky-700/60 text-slate-950"
                            animate={{ y: [-4, 4, -4] }}
                            transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}
                        >
                            <ArrowUpIcon />
                        </motion.div>
                    </motion.div>

                    {/* Under Review Card */}
                    <motion.div
                        className="relative overflow-hidden bg-slate-950/80 backdrop-blur-2xl rounded-2xl p-5 flex items-center justify-between border border-violet-500/35 shadow-[0_18px_65px_rgba(30,64,175,0.9)]"
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ y: -4, scale: 1.01 }}
                        transition={{
                            delay: 0.26,
                            duration: 0.38,
                            ease: [0.23, 0.82, 0.25, 1],
                            type: 'spring',
                            stiffness: 260,
                            damping: 24,
                        }}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.24),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.98),transparent_60%)] opacity-90 pointer-events-none" />
                        <div className="relative">
                            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-[0.18em]">
                                Under review
                            </p>
                            <p className="mt-2 text-3xl font-semibold text-white">8,204</p>
                            <p className="mt-1 text-xs text-indigo-100/90">Waiting for final publish or rollback</p>
                        </div>
                        <motion.div
                            className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/90 shadow-lg shadow-indigo-700/60 text-slate-950"
                            animate={{ rotate: [0, 360] }}
                            transition={{ repeat: Infinity, duration: 6.4, ease: 'linear' }}
                        >
                            <RefreshIcon />
                        </motion.div>
                    </motion.div>
                </div>

                {/* Analytics and Usage Summary Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Three.js Analytics Block */}
                    <motion.div
                        className="lg:col-span-2 relative rounded-2xl border border-sky-500/25 bg-gradient-to-br from-slate-950 via-slate-950/70 to-slate-900/80 shadow-[0_24px_80px_rgba(8,47,73,0.9)] overflow-hidden"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 0.84, 0.25, 1] }}
                    >
                        <Dashboard3DScene metrics={infraMetrics} />
                    </motion.div>

                    {/* Usage Summary Block */}
                    <motion.div
                        className="bg-slate-950/80 backdrop-blur-2xl rounded-2xl p-5 border border-slate-700/70 shadow-[0_18px_60px_rgba(15,23,42,0.85)] flex flex-col gap-4"
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 0.84, 0.25, 1] }}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold text-white tracking-tight">Usage summary</h3>
                            <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                                30 days
                            </span>
                        </div>

                        <div className="flex items-center justify-center">
                            <div className="relative w-40 h-40">
                                <svg className="-rotate-90" width="160" height="160">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="14"
                                        className="text-slate-800/70"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="none"
                                        stroke="url(#usageGradient)"
                                        strokeWidth="14"
                                        strokeDasharray={`${2 * Math.PI * 70 * 0.76} ${2 * Math.PI * 70}`}
                                        strokeLinecap="round"
                                    />
                                    <defs>
                                        <linearGradient id="usageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#22c55e" />
                                            <stop offset="55%" stopColor="#22d3ee" />
                                            <stop offset="100%" stopColor="#6366f1" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-[0.16em]">
                                        Plan capacity
                                    </p>
                                    <p className="mt-1 text-2xl font-semibold text-white">76%</p>
                                    <p className="text-[11px] text-emerald-300 mt-1">Healthy</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs text-slate-200/90">
                            <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2.5">
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.16em]">
                                    Bandwidth
                                </p>
                                <p className="mt-1 text-base font-semibold text-sky-100">3.2 TB</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Of 5 TB included</p>
                            </div>
                            <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2.5">
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.16em]">
                                    Builds
                                </p>
                                <p className="mt-1 text-base font-semibold text-sky-100">428</p>
                                <p className="text-[11px] text-emerald-300 mt-0.5">+38 automated</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Projects/Websites Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h2 className="text-2xl font-semibold text-white tracking-tight">
                                Projects &amp; websites
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Quick overview of your most active workspaces.
                            </p>
                        </div>
                        <motion.button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 hover:border-sky-500/70 hover:text-sky-100 hover:bg-slate-900/90 transition-all shadow-[0_10px_30px_rgba(15,23,42,0.9)]"
                            whileHover={{ y: -1, scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            aria-label="Filter"
                        >
                            <span className="rounded-lg bg-slate-800/80 p-1.5 text-slate-300">
                                <FilterIcon />
                            </span>
                            Filters
                        </motion.button>
                    </div>

                    {/* Web Preview Block */}
                    <motion.div
                        className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 rounded-2xl p-5 sm:p-6 min-h-[200px] flex items-center justify-between gap-6 border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.45)]"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        <div className="space-y-2 max-w-md">
                            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-500">
                                Featured preview
                            </p>
                            <p className="text-lg sm:text-xl font-semibold text-slate-900">
                                eCommerce storefront – &ldquo;Mercato Modern&rdquo;
                            </p>
                            <p className="text-sm text-slate-600">
                                Quickly stage and review changes before pushing anything live. Ideal for A/B testing
                                new layouts or seasonal campaigns.
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Preview ready
                                </span>
                                <span className="text-[11px] text-slate-500">Last deploy: 7 min ago</span>
                            </div>
                        </div>
                        <div className="hidden md:flex relative w-60 h-36 rounded-xl border border-slate-300/80 bg-slate-900/95 overflow-hidden shadow-[0_18px_40px_rgba(15,23,42,0.95)]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.14),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.95),transparent_55%)]" />
                            <div className="relative flex flex-col justify-between p-3 text-[11px] text-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                    </div>
                                    <span className="rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px]">
                                        Staging
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="h-2 rounded-full bg-slate-700/70">
                                        <div className="h-2 w-4/5 rounded-full bg-sky-400/90" />
                                    </div>
                                    <div className="flex gap-1.5">
                                        <span className="h-1.5 flex-1 rounded-full bg-slate-700/80" />
                                        <span className="h-1.5 flex-1 rounded-full bg-slate-700/80" />
                                        <span className="h-1.5 flex-1 rounded-full bg-slate-700/80" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-300">
                                    <span>Viewport: 1440×900</span>
                                    <span>Perf score: 96</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Table/Grid Structure */}
                    <motion.div
                        className="bg-slate-950/80 backdrop-blur-2xl rounded-2xl border border-slate-800 shadow-[0_18px_60px_rgba(15,23,42,0.9)] overflow-hidden"
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
                    >
                        <div className="px-4 py-3 border-b border-slate-800/90 flex items-center justify-between text-xs text-slate-400">
                            <span>Most active projects</span>
                            <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300">
                                Sorted by activity
                            </span>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-4 gap-4 border-b border-slate-800 pb-2 mb-2 text-[11px] font-medium text-slate-400 uppercase tracking-[0.18em]">
                                <div>Project</div>
                                <div>Status</div>
                                <div>Last deploy</div>
                                <div>Visitors</div>
                            </div>
                            <div className="space-y-1">
                                {[1, 2, 3].map((row) => (
                                    <motion.div
                                        key={row}
                                        className="grid grid-cols-4 gap-4 py-2.5 border-b border-slate-800/60 last:border-b-0 text-sm text-slate-200"
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.2 }}
                                        transition={{
                                            duration: 0.35,
                                            delay: 0.06 * row,
                                            ease: [0.25, 0.8, 0.25, 1],
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-50">
                                                Mercato Launch {row}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                ecommerce-{row.toString().padStart(2, '0')}.mercato.tools
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                            <span className="text-emerald-300">Live</span>
                                        </div>
                                        <div className="text-xs text-slate-400">~{4 + row} min ago</div>
                                        <div className="text-xs text-slate-200">
                                            {['12.4k', '9.8k', '7.2k'][row - 1]} / 24h
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </section>
            </div>
        </main>
    );
}
// sample