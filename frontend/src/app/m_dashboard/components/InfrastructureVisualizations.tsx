'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme, THEMES } from './theme-context';

type DashboardInfraMetrics = {
    activeRegions: number;
    regionsDelta: number;
    uptimePercent: number;
    avgLatencyMs: number;
    errorRatePercent: number;
};

const infraMetrics: DashboardInfraMetrics = {
    activeRegions: 18,
    regionsDelta: 3,
    uptimePercent: 99.982,
    avgLatencyMs: 82,
    errorRatePercent: 0.4,
};

export function InfrastructureVisualization() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme, colors } = useTheme();
    const [reducedMotion, setReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        const onVis = () => setIsVisible(!document.hidden);
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, []);

    useEffect(() => {
        if (!containerRef.current || !isVisible) return;
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight || 360;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(colors.bg.fog, 0.065);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 1.4, 4.2);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        // Metric mapping
        const clampedUptime = Math.max(0, Math.min(100, infraMetrics.uptimePercent));
        const clampedError = Math.max(0, Math.min(100, infraMetrics.errorRatePercent));
        const latencyFactor = Math.min(1.6, Math.max(0.5, infraMetrics.avgLatencyMs / 120));

        let sphereHex = colors.status.info;
        if (clampedUptime >= 99.9 && clampedError < 0.5) sphereHex = colors.status.good;
        else if (clampedUptime < 99.5 || clampedError > 2) sphereHex = colors.status.warning;
        if (clampedUptime < 98.5 || clampedError > 5) sphereHex = colors.status.error;

        const particleCount = Math.min(900, 260 + infraMetrics.activeRegions * 20);

        // Sphere
        const sphereGeo = new THREE.SphereGeometry(1.1, 32, 32);
        const sphereMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(sphereHex),
            wireframe: true,
            transparent: true,
            opacity: 0.65,
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        scene.add(sphere);

        // Particles ring
        const particlesGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const radius = 2.3;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.3;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.3;
        }
        particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        let particleHex = colors.status.info;
        if (clampedError > 1 && clampedError <= 3) particleHex = colors.status.warning;
        else if (clampedError > 3) particleHex = colors.status.error;

        const particlesMat = new THREE.PointsMaterial({
            color: new THREE.Color(particleHex),
            size: 0.032,
            transparent: true,
            opacity: 0.8,
        });
        const particles = new THREE.Points(particlesGeo, particlesMat);
        scene.add(particles);

        scene.add(new THREE.AmbientLight(theme === 'dark' ? 0x66666e : 0xffffff, 0.7));
        const dirLight = new THREE.DirectionalLight(0xaaaaaa, 1.0);
        dirLight.position.set(3, 4, 2);
        scene.add(dirLight);

        // Animation loop
        let frameId: number;
        const clock = new THREE.Clock();
        const animate = () => {
            if (!isVisible) {
                frameId = requestAnimationFrame(animate);
                return;
            }
            const t = clock.getElapsedTime();
            const motion = reducedMotion ? 0.07 : latencyFactor;

            sphere.rotation.y = t * 0.22 * motion;
            sphere.rotation.x = reducedMotion ? 0 : Math.sin(t * 0.16 * motion) * 0.22;

            particles.rotation.y = t * 0.07 * motion;
            particles.rotation.x = reducedMotion ? 0 : Math.sin(t * 0.11 * motion) * 0.07;

            if (!reducedMotion) {
                camera.position.x = Math.sin(t * 0.14 * motion) * 0.55;
                camera.position.z = 4.2 + Math.cos(t * 0.17 * motion) * 0.35;
            }
            camera.lookAt(0, 0.6, 0);

            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
        };
        animate();

        // Resize handler
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
            sphereGeo.dispose();
            sphereMat.dispose();
            particlesGeo.dispose();
            particlesMat.dispose();
            renderer.dispose();
        };
    }, [isVisible, reducedMotion, colors, theme]);

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-[4/3] min-h-[320px] max-h-[480px] rounded-2xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${colors.bg.card} 0%, ${colors.bg.dark} 100%)` }}
            aria-label="Live 3D infrastructure visualization"
            role="img"
        >
            <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,244,246,0.055),transparent_68%)] ${theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-multiply opacity-50'}`} />
            <div
                className="pointer-events-none absolute inset-0"
                style={{ background: `linear-gradient(to top, ${theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'}, transparent)` }}
            />

            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.text.muted }}>
                            Live Infrastructure
                        </p>
                        <p className="mt-1 text-lg sm:text-xl font-semibold" style={{ color: colors.text.primary }}>
                            Global deployment health
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 border shadow-lg" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)', borderColor: colors.border.faint }}>
                        <span className={`h-1.5 w-1.5 rounded-full bg-[#A3E635] ${reducedMotion ? '' : 'animate-ping'}`} />
                        <span className="text-[11px] font-medium" style={{ color: colors.text.muted }}>Real-time</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md text-xs sm:text-[13px]" style={{ color: colors.text.secondary }}>
                    <div className="rounded-xl border px-3 py-2.5 backdrop-blur-md" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)' }}>
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: colors.text.muted }}>
                            Active regions
                        </p>
                        <p className="mt-1 text-base font-semibold" style={{ color: colors.text.primary }}>{infraMetrics.activeRegions}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: colors.status.good }}>
                            {infraMetrics.regionsDelta > 0 ? `+${infraMetrics.regionsDelta}` : infraMetrics.regionsDelta} this week
                        </p>
                    </div>

                    <div className="rounded-xl border px-3 py-2.5 backdrop-blur-md" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)' }}>
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: colors.text.muted }}>
                            Uptime
                        </p>
                        <p className="mt-1 text-base font-semibold" style={{ color: colors.status.good }}>
                            {infraMetrics.uptimePercent.toFixed(3)}%
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: colors.text.muted }}>
                            SLA compliant
                        </p>
                    </div>

                    <div className="rounded-xl border px-3 py-2.5 backdrop-blur-md" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)' }}>
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: colors.text.muted }}>
                            Avg latency
                        </p>
                        <p className="mt-1 text-base font-semibold" style={{ color: colors.text.primary }}>{infraMetrics.avgLatencyMs} ms</p>
                        <p className="text-[11px] mt-0.5" style={{ color: colors.text.muted }}>p95 global</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
