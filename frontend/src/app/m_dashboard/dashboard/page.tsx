'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, type Variants } from 'framer-motion';
import CreateSite from '../components/CreateSite';
import TemplatesLibrary from '../components/TemplatesLibrary';
import ActivityFeed from '../components/ActivityFeed';
import { useTheme, THEMES } from '../components/theme-context';

// ── Icons (unchanged) ────────────────────────────────────────────────────────
const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const FilterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

// ── Types & data ─────────────────────────────────────────────────────────────
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

// ── 3D Scene ─────────────────────────────────────────────────────────────────
const Dashboard3DScene: React.FC<{ metrics: DashboardInfraMetrics; colors: typeof THEMES.dark; theme: 'dark' | 'light' }> = ({ metrics, colors, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
    const clampedUptime = Math.max(0, Math.min(100, metrics.uptimePercent));
    const clampedError = Math.max(0, Math.min(100, metrics.errorRatePercent));
    const latencyFactor = Math.min(1.6, Math.max(0.5, metrics.avgLatencyMs / 120));

    let sphereHex = colors.status.info;
    if (clampedUptime >= 99.9 && clampedError < 0.5) sphereHex = colors.status.good;
    else if (clampedUptime < 99.5 || clampedError > 2) sphereHex = colors.status.warning;
    if (clampedUptime < 98.5 || clampedError > 5) sphereHex = colors.status.error;

    const particleCount = Math.min(900, 260 + metrics.activeRegions * 20);

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
      positions[i * 3    ] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.3;
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
  }, [metrics, isVisible, reducedMotion, colors, theme]);

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
};

// ── Card animation variants ──────────────────────────────────────────────────
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

// ── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardContent() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showCreateSite, setShowCreateSite] = useState(false);
  const colors = THEMES[theme];

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    (document.documentElement.style as CSSStyleDeclaration & { colorScheme: string }).colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    // Inject CSS to disable the default browser fade animation for view transitions.
    const styleId = 'view-transition-style';
    if (document.getElementById(styleId)) return;

    const css = `
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }
    `;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }, []);

  const toggleTheme = useCallback((e: React.MouseEvent) => {
    const newTheme = theme === "dark" ? "light" : "dark";

    if (
      !('startViewTransition' in document) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(newTheme);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as Document & { startViewTransition: (cb: () => void) => { ready: Promise<void> } }).startViewTransition(() => setTheme(newTheme));

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        { clipPath },
        { duration: 1000, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    });
  }, [theme]);

  return (
    <main className="flex-1 overflow-y-auto" style={{ backgroundColor: theme === 'dark' ? colors.bg.dark : colors.bg.primary, color: colors.text.primary }}>
      <div className="p-6 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <motion.h1
              className="text-3xl sm:text-4xl font-semibold tracking-tight"
              style={{ color: colors.text.primary }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              Dashboard
            </motion.h1>
            <motion.p
              className="text-sm sm:text-base max-w-xl"
              style={{ color: colors.text.muted }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              Monitor deployments, domains and templates — live health & usage at a glance.
            </motion.p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Total Projects */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between border shadow-2xl"
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.default,
              boxShadow: theme === 'dark' ? '0 18px 65px rgba(0,0,0,0.65)' : '0 10px 40px rgba(0,0,0,0.08)',
            }}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, scale: 1.01 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(243,244,246,0.05),transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                Total projects
              </p>
              <p className="mt-2 text-3xl font-semibold" style={{ color: colors.text.primary }}>123,456</p>
              <p className="mt-1.5 text-xs" style={{ color: colors.text.subtle }}>
                +1,204 new <span style={{ color: colors.status.good }}>this week</span>
              </p>
            </div>
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg" style={{ backgroundColor: theme === 'dark' ? colors.text.muted : colors.bg.elevated, color: theme === 'dark' ? colors.bg.dark : colors.text.primary }}>
              <BriefcaseIcon />
            </div>
          </motion.div>

          {/* Published Sites */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between border shadow-2xl"
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.default,
              boxShadow: theme === 'dark' ? '0 18px 65px rgba(0,0,0,0.65)' : '0 10px 40px rgba(0,0,0,0.08)',
            }}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(147,197,253,0.06),transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                Published sites
              </p>
              <p className="mt-2 text-3xl font-semibold" style={{ color: colors.text.primary }}>123,456</p>
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(163,230,53,0.1)', borderColor: colors.status.good, color: colors.status.good }}>
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                  98.6% live
                </span>
                <span style={{ color: colors.text.subtle }}>+6.4% vs last week</span>
              </div>
            </div>
            <motion.div
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
              style={{ backgroundColor: theme === 'dark' ? colors.text.muted : colors.bg.elevated, color: theme === 'dark' ? colors.bg.dark : colors.text.primary }}
              animate={{ y: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            >
              <ArrowUpIcon />
            </motion.div>
          </motion.div>

          {/* Under Review */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between border shadow-2xl"
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.default,
              boxShadow: theme === 'dark' ? '0 18px 65px rgba(0,0,0,0.65)' : '0 10px 40px rgba(0,0,0,0.08)',
            }}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(243,244,246,0.04),transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                Under review
              </p>
              <p className="mt-2 text-3xl font-semibold" style={{ color: colors.text.primary }}>8,204</p>
              <p className="mt-1.5 text-xs" style={{ color: colors.text.subtle }}>
                Awaiting publish / rollback
              </p>
            </div>
            <motion.div
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
              style={{ backgroundColor: theme === 'dark' ? colors.text.muted : colors.bg.elevated, color: theme === 'dark' ? colors.bg.dark : colors.text.primary }}
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            >
              <RefreshIcon />
            </motion.div>
          </motion.div>
        </div>

        {/* Analytics + Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div
            className="lg:col-span-2 rounded-2xl border shadow-2xl overflow-hidden"
            style={{
              borderColor: colors.border.default,
              boxShadow: theme === 'dark' ? '0 24px 80px rgba(0,0,0,0.7)' : '0 15px 50px rgba(0,0,0,0.1)',
            }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <Dashboard3DScene metrics={infraMetrics} colors={colors} theme={theme} />
          </motion.div>

          {/* Usage summary */}
          <motion.div
            className="rounded-2xl p-6 border flex flex-col gap-5"
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.default,
              boxShadow: theme === 'dark' ? '0 18px 60px rgba(0,0,0,0.6)' : '0 10px 40px rgba(0,0,0,0.08)',
            }}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold tracking-tight" style={{ color: colors.text.primary }}>
                Usage summary
              </h3>
              <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                30 days
              </span>
            </div>

            <div className="flex items-center justify-center py-4">
              <div className="relative w-44 h-44">
                <svg className="-rotate-90" width="176" height="176">
                  <circle cx="88" cy="88" r="78" fill="none" stroke={colors.border.faint} strokeWidth="14" />
                  <circle
                    cx="88"
                    cy="88"
                    r="78"
                    fill="none"
                    stroke="url(#grad)"
                    strokeWidth="14"
                    strokeDasharray={`${2 * Math.PI * 78 * 0.76} ${2 * Math.PI * 78}`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.status.good} />           {/* #A3E635 */}
                    <stop offset="50%" stopColor={theme === 'dark' ? "#D1D1D6" : "#9CA3AF"} />
                    <stop offset="100%" stopColor={colors.text.muted} />          {/* #9999A1 */}
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>
                    Plan capacity
                  </p>
                  <p className="mt-1 text-3xl font-semibold" style={{ color: colors.text.primary }}>76%</p>
                  <p className="text-sm mt-1" style={{ color: colors.status.good }}>Healthy</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border px-4 py-3" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.elevated }}>
                <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Bandwidth</p>
                <p className="mt-1 text-base font-semibold" style={{ color: colors.text.primary }}>3.2 TB</p>
                <p className="text-[11px] mt-1" style={{ color: colors.text.subtle }}>of 5 TB included</p>
              </div>
              <div className="rounded-xl border px-4 py-3" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.elevated }}>
                <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Builds</p>
                <p className="mt-1 text-base font-semibold" style={{ color: colors.text.primary }}>428</p>
                <p className="text-[11px] mt-1" style={{ color: colors.status.good }}>+38 automated</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Projects section */}
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight" style={{ color: colors.text.primary }}>
                Projects & websites
              </h2>
              <p className="mt-1 text-sm" style={{ color: colors.text.muted }}>
                Most active workspaces overview
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setShowCreateSite(true)}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  borderColor: colors.border.default,
                  color: colors.text.secondary,
                  backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.card,
                }}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(0,0,0,0.55)' }}
                whileTap={{ scale: 0.97 }}
              >
                Create site
              </motion.button>

              <motion.button
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  borderColor: colors.border.default,
                  color: colors.text.secondary,
                  backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.card,
                }}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(0,0,0,0.55)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="rounded-lg p-1.5" style={{ backgroundColor: colors.bg.elevated }}>
                  <FilterIcon />
                </span>
                Filters
              </motion.button>
            </div>
          </div>

          {/* Featured preview placeholder */}
          <motion.div
            className="rounded-2xl p-6 min-h-[180px] flex items-center justify-between gap-8 border"
            style={{
              background: `linear-gradient(135deg, ${colors.bg.card}, ${theme === 'dark' ? colors.bg.dark : colors.bg.elevated})`,
              borderColor: colors.border.default,
            }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="space-y-3 max-w-lg">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                Featured preview
              </p>
              <p className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                eCommerce – “Mercato Modern”
              </p>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Stage & review changes before going live — perfect for A/B tests and seasonal layouts.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium border" style={{ backgroundColor: 'rgba(163,230,53,0.1)', borderColor: colors.status.good, color: colors.status.good }}>
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                  Preview ready
                </span>
                <span className="text-xs" style={{ color: colors.text.subtle }}>Last deploy: 7 min ago</span>
              </div>
            </div>

            {/* Mini browser mockup (simplified) */}
            <div className="hidden md:block relative w-72 h-44 rounded-xl border overflow-hidden shadow-2xl" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(243,244,246,0.06),transparent_60%)]" />
              <div className="relative p-3 text-[11px]" style={{ color: colors.text.muted }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.status.good }} />
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.status.warning }} />
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.status.error }} />
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ borderColor: colors.border.default, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)' }}>Staging</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 rounded-full" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)' }}>
                    <div className="h-full w-4/5 rounded-full" style={{ backgroundColor: colors.text.muted }} />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="h-2.5 rounded-full" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)' }} />
                    <div className="h-2.5 rounded-full" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)' }} />
                    <div className="h-2.5 rounded-full" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)' }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Templates library */}
          <motion.div
            className="rounded-2xl p-6 border"
            style={{ background: `linear-gradient(135deg, ${colors.bg.card}, ${theme === 'dark' ? colors.bg.dark : colors.bg.elevated})`, borderColor: colors.border.default }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>Templates</p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>Quick-start templates for new sites</p>
              </div>
            </div>
            <TemplatesLibrary onUse={(t) => console.log('Use template', t)} />
          </motion.div>

          {/* Projects table */}
          <motion.div
            className="rounded-2xl border overflow-hidden shadow-2xl"
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.default,
              boxShadow: theme === 'dark' ? '0 18px 60px rgba(0,0,0,0.65)' : '0 10px 40px rgba(0,0,0,0.08)',
            }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="px-5 py-3.5 border-b flex items-center justify-between text-xs font-medium uppercase tracking-wider" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
              <span>Most active projects</span>
              <span className="rounded-full px-2.5 py-1 text-[10px] border" style={{ borderColor: colors.border.faint }}>Sorted by activity</span>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-4 gap-6 pb-3 border-b text-[11px] font-medium uppercase tracking-wider" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                <div>Project</div>
                <div>Status</div>
                <div>Last deploy</div>
                <div>Visitors</div>
              </div>

              <div className="space-y-2 mt-2">
                {[
                  { name: 'Mercato Launch 01', domain: 'ecommerce-01.mercato.tools', visitors: '12.4k' },
                  { name: 'Mercato Launch 02', domain: 'ecommerce-02.mercato.tools', visitors: '9.8k' },
                  { name: 'Mercato Launch 03', domain: 'ecommerce-03.mercato.tools', visitors: '7.2k' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="grid grid-cols-4 gap-6 py-3 border-b last:border-b-0 text-sm"
                    style={{ borderColor: colors.border.faint }}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.06 * i }}
                  >
                    <div>
                      <div className="font-medium" style={{ color: colors.text.secondary }}>{item.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: colors.text.subtle }}>{item.domain}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.status.good }} />
                      <span style={{ color: colors.status.good }}>Live</span>
                    </div>
                    <div className="text-xs" style={{ color: colors.text.muted }}>~{4 + i} min ago</div>
                    <div className="text-sm font-medium" style={{ color: colors.text.primary }}>{item.visitors} / 24h</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Activity feed */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ActivityFeed />
          </motion.div>
        </section>
        
        <CreateSite show={showCreateSite} onClose={() => setShowCreateSite(false)} onCreate={(d) => console.log('Created site', d)} />
      </div>
    </main>
  );
}