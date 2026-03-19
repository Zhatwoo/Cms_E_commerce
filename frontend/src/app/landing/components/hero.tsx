'use client';

import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';

const HERO_ROTATING_TEXT = [
  'Your Way.',
  'Your Brand.',
  'Your Rules.',
  'Your Growth.',
];

// Blocks that appear on cursor click, sequentially
const BUILDER_BLOCKS = [
  {
    id: 'header',
    label: 'Header Block',
    delay: 0,
    className:
      'h-9 rounded-lg border border-white/10 bg-white/5',
    full: false,
  },
  {
    id: 'hero',
    label: 'UI Component Dropped',
    delay: 0,
    className:
      'relative grid h-24 md:h-32 place-items-center rounded-xl border border-[#5a42bf] bg-[#1a0f78]',
    full: true,
    isHero: true,
  },
  {
    id: 'card1',
    label: '',
    delay: 0,
    className: 'h-20 md:h-24 rounded-xl border border-[#5a42bf] bg-[#15096a]',
    full: false,
    isCard: true,
  },
  {
    id: 'card2',
    label: '',
    delay: 0,
    className: 'h-20 md:h-24 rounded-xl border border-[#5a42bf] bg-[#15096a]',
    full: false,
    isCard: true,
  },
];

function useCursorState() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const springConfig = { damping: 22, stiffness: 280, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const [isClicking, setIsClicking] = useState(false);
  const [trail, setTrail] = useState<{ id: number; x: number; y: number }[]>([]);
  const trailId = useRef(0);

  return { x, y, springX, springY, isClicking, setIsClicking, trail, setTrail, trailId };
}

// Deterministic pseudo-random seeded generator (no Math.random on server)
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

type Star = { w: number; h: number; left: number; top: number; opacity: number; dur: number; delay: number };

function generateStars(count: number): Star[] {
  const rand = seededRand(42);
  return Array.from({ length: count }, () => ({
    w: rand() * 1.5 + 0.5,
    h: rand() * 1.5 + 0.5,
    left: rand() * 100,
    top: rand() * 60,
    opacity: rand() * 0.4 + 0.05,
    dur: 2 + rand() * 4,
    delay: rand() * 3,
  }));
}

// Pre-generate stable stars (same on server & client since seeded)
const STARS = generateStars(36);

export function Hero({ isDarkMode = false, onAuthClick }: { isDarkMode?: boolean; onAuthClick?: (mode: 'login' | 'register') => void }) {
  /* ── typewriter ── */
  const [textIndex, setTextIndex] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const activeText = HERO_ROTATING_TEXT[textIndex];
  const typedText = activeText.slice(0, typedCount);

  useEffect(() => {
    const isFullyTyped = typedCount === activeText.length;
    const isFullyDeleted = typedCount === 0;
    let timeoutMs = isDeleting ? 55 : 95;
    if (isFullyTyped && !isDeleting) timeoutMs = 1200;
    if (isFullyDeleted && isDeleting) timeoutMs = 280;

    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        if (typedCount < activeText.length) { setTypedCount(c => c + 1); }
        else { setIsDeleting(true); }
        return;
      }
      if (typedCount > 0) { setTypedCount(c => c - 1); return; }
      setIsDeleting(false);
      setTextIndex(i => (i + 1) % HERO_ROTATING_TEXT.length);
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [activeText, isDeleting, typedCount]);

  /* ── custom cursor ── */
  const cursor = useCursorState();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [visibleBlocks, setVisibleBlocks] = useState<string[]>([]);
  const [clickRipples, setClickRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);

  // Queue-based: each click reveals the next block
  const blockQueue = ['header', 'hero', 'card1', 'card2'];
  const nextBlockIndex = visibleBlocks.length;

  const placeBlockAtPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;

    cursor.x.set(cx);
    cursor.y.set(cy);

    // Ripple effect
    const id = ++rippleId.current;
    setClickRipples(prev => [...prev, { id, x: cx, y: cy }]);
    setTimeout(() => setClickRipples(prev => prev.filter(r => r.id !== id)), 700);

    // Reveal next block
    if (nextBlockIndex < blockQueue.length) {
      setVisibleBlocks(prev => [...prev, blockQueue[nextBlockIndex]]);
    }
  }, [nextBlockIndex, cursor.x, cursor.y]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    placeBlockAtPoint(e.clientX, e.clientY);
  }, [placeBlockAtPoint]);

  const handleCanvasTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    placeBlockAtPoint(touch.clientX, touch.clientY);
    cursor.setIsClicking(true);
  }, [placeBlockAtPoint, cursor.setIsClicking]);

  const handleCanvasTouchEnd = useCallback(() => {
    cursor.setIsClicking(false);
  }, [cursor.setIsClicking]);

  // Track cursor inside the canvas
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    cursor.x.set(e.clientX - rect.left);
    cursor.y.set(e.clientY - rect.top);

    // Small sparkle trail
    const id = ++cursor.trailId.current;
    cursor.setTrail(prev => [...prev.slice(-8), { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => cursor.setTrail(prev => prev.filter(t => t.id !== id)), 350);
  }, []);

  const handleMouseLeave = () => {
    cursor.x.set(-200);
    cursor.y.set(-200);
    cursor.setTrail([]);
  };

  const allRevealed = visibleBlocks.length >= blockQueue.length;

  const isVisible = (id: string) => visibleBlocks.includes(id);

  return (
    <section id="home" className={`relative min-h-screen overflow-hidden px-4 pb-0 pt-24 md:px-8 md:pt-32 2xl:px-12 ${
      isDarkMode ? 'bg-[#0a0141] text-white' : 'bg-white text-[#120533]'
    }`}>
      {/* Ambient bg glows */}
      <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_${isDarkMode ? 'rgba(139,92,246,0.28)' : 'rgba(240,230,190,0.6)'},transparent_60%)]`} />
      <div className={`pointer-events-none absolute left-[-10%] top-[20%] h-96 w-96 rounded-full blur-[120px] ${isDarkMode ? 'bg-[#7c3aed]/10' : 'bg-[#e9d5ff]/40'}`} />
      <div className={`pointer-events-none absolute right-[-5%] top-[40%] h-80 w-80 rounded-full blur-[100px] ${isDarkMode ? 'bg-[#d946ef]/8' : 'bg-[#fbcfe8]/40'}`} />
      <div className={`pointer-events-none absolute -bottom-36 left-1/2 h-80 w-[92%] -translate-x-1/2 rounded-[100%] border blur-2xl ${isDarkMode ? 'border-[#6b4ee6]/20 bg-[#14065f]/28' : 'border-[#e5e7eb] bg-[#f8fafc]'}`} />
      {isDarkMode && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent via-[#0a0141]/80 to-[#0a0141]" />
      )}

      {/* Stable star field — seeded so SSR & client match */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {STARS.map((s, i) => (
          <span
            key={i}
            className={`absolute rounded-full ${isDarkMode ? 'bg-white' : 'hidden'}`}
            style={{
              width: `${s.w}px`,
              height: `${s.h}px`,
              left: `${s.left}%`,
              top: `${s.top}%`,
              opacity: s.opacity,
              animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-7xl flex-col items-center px-4 text-center sm:px-6">
        {/* Badge */}
        <motion.span
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-flex items-center gap-2 rounded-full border px-5 py-1.5 text-xs font-semibold backdrop-blur-sm ${
            isDarkMode 
              ? 'border-[#ffcc00]/25 bg-[#ffcc00]/8 text-[#ffcc00]' 
              : 'border-[#dfbdf8]/60 bg-[#e8cffc] text-[#120533]'
          }`}
        >
          {isDarkMode && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ffcc00] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ffcc00]" />
            </span>
          )}
          Introducing Centric Web Builder
        </motion.span>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-[clamp(2.6rem,7.8vw,5.5rem)] font-black leading-[1.1] tracking-tight"
        >
          <span className="block">Your Store,</span>
          <span className="inline-flex items-baseline">
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isDarkMode ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}>
              {typedText}
            </span>
            <span
              className={`ml-1.5 inline-block h-[0.85em] w-[0.12em] rounded-sm animate-pulse bg-gradient-to-b ${isDarkMode ? 'from-[#ffcc00] via-[#d946ef] to-[#7c3aed]' : 'from-[#f5a213] via-[#d946ef] to-[#7c3aed]'}`}
              aria-hidden
            />
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className={`mt-6 max-w-[90vw] text-sm leading-relaxed sm:text-base md:max-w-2xl md:text-lg xl:max-w-4xl ${isDarkMode ? 'text-white/60' : 'text-[#616170]'}`}
        >
          Centric is where teams design, manage, and publish stunning enterprise
          storefronts without writing a single line of backend code.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          {isDarkMode ? (
            <button
              onClick={() => onAuthClick?.('register')}
              suppressHydrationWarning
              className="group relative overflow-hidden rounded-full bg-[#ffcc00] px-8 py-3 text-base font-extrabold text-[#120533] shadow-[0_0_28px_rgba(255,204,0,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(255,204,0,0.75)] active:scale-95 sm:px-10 sm:text-lg"
            >
              <span className="relative z-10">Start for Free</span>
              <span className="absolute inset-0 translate-y-full bg-[#ffe147] transition-transform duration-200 group-hover:translate-y-0" />
            </button>
          ) : (
            <button
              onClick={() => onAuthClick?.('register')}
              suppressHydrationWarning
              className="relative overflow-hidden rounded-full px-8 py-3 text-base font-extrabold text-white shadow-[0_8px_24px_rgba(217,70,239,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(217,70,239,0.5)] active:scale-95 sm:px-10 sm:text-lg bg-gradient-to-r from-[#9333ea] to-[#ec4899]"
            >
              <span className="relative z-10">Start for Free</span>
            </button>
          )}
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={`mt-6 flex items-center gap-2 text-xs ${isDarkMode ? 'text-white/35' : 'text-[#888899]'}`}
        >
          <span>Trusted by</span>
          <span className={`font-semibold ${isDarkMode ? 'text-white/55' : 'text-[#616170]'}`}>2,400+ teams</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            {'★★★★★'.split('').map((s, i) => <span key={i} className={isDarkMode ? 'text-[#ffcc00]/70' : 'text-[#f5a213]'}>{s}</span>)}
          </span>
          <span className={`font-semibold ${isDarkMode ? 'text-white/55' : 'text-[#616170]'}`}>4.9 / 5</span>
        </motion.div>

        {/* ─── Builder Preview ─── */}
        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`mt-12 h-[clamp(300px,46vh,520px)] w-full max-w-[1100px] overflow-hidden rounded-t-2xl border border-b-0 shadow-2xl md:mt-16 xl:max-w-[1300px] ${
            isDarkMode 
              ? 'border-[#5f45d5]/55 bg-[#11065a]/95 shadow-[0_-30px_80px_rgba(24,5,90,0.85)]' 
              : 'border-[#c1c1cd] bg-[#fdfdfd] shadow-[0_-30px_80px_rgba(20,20,50,0.05)]'
          }`}
        >
          {/* Window chrome */}
          <div className={`flex h-10 items-center gap-2 border-b px-5 ${isDarkMode ? 'border-white/10 bg-[#1c0d72]' : 'border-[#c1c1cd] bg-[#f2f2f5]'}`}>
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className={`mx-auto flex items-center gap-1.5 rounded-md border px-3 py-0.5 text-[10px] ${
              isDarkMode ? 'border-white/10 bg-white/5 text-white/40' : 'border-[#c1c1cd] bg-white text-[#888899]'
            }`}>
              <span>⚡</span> centric.app/builder/project-frontend
            </span>
          </div>

          {/* Main layout */}
          <div className="flex h-[calc(100%-2.5rem)]">
            {/* Sidebar */}
            <div className={`hidden w-[200px] flex-col gap-3 border-r p-4 lg:flex xl:w-[250px] xl:p-5 ${isDarkMode ? 'border-white/10 bg-[#0f0551]' : 'border-[#c1c1cd] bg-[#fdfdfd]'}`}>
              <p className={`mb-1 text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-[#888899]'}`}>Layers</p>
              {['Header Block', 'Hero Section', 'Feature Grid', 'Footer'].map((name, i) => (
                <div
                  key={name}
                  className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors ${
                    i < visibleBlocks.length
                      ? isDarkMode ? 'border-[#7c3aed]/60 bg-[#7c3aed]/15 text-white/90' : 'border-[#a855f7]/40 bg-[#a855f7]/10 text-[#a855f7]'
                      : isDarkMode ? 'border-white/10 bg-white/5 text-white/40' : 'border-[#c1c1cd] bg-white text-[#888899]'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${i < visibleBlocks.length ? (isDarkMode ? 'bg-[#ffcc00]' : 'bg-[#a855f7]') : (isDarkMode ? 'bg-white/20' : 'bg-[#d0d0dc]')}`} />
                  {name}
                </div>
              ))}

              <div className={`mt-auto rounded-lg border border-dashed p-3 text-center text-[10px] ${isDarkMode ? 'border-white/15 text-white/30' : 'border-[#d0d0dc] text-[#888899]'}`}>
                {allRevealed ? '✓ All blocks placed' : `${blockQueue.length - visibleBlocks.length} block${blockQueue.length - visibleBlocks.length !== 1 ? 's' : ''} left`}
              </div>
            </div>

            {/* Canvas */}
            <div
              ref={canvasRef}
              className={`relative flex flex-1 cursor-none select-none flex-col gap-3 overflow-hidden bg-[size:18px_18px] p-4 md:gap-4 md:p-6 xl:justify-between xl:gap-5 xl:p-7 ${
                isDarkMode 
                  ? 'bg-[radial-gradient(rgba(255,255,255,0.055)_1px,transparent_1px)]' 
                  : 'bg-[radial-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[#fdfdfd]'
              }`}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleMouseLeave}
              onMouseDown={() => cursor.setIsClicking(true)}
              onMouseUp={() => cursor.setIsClicking(false)}
              onClick={handleCanvasClick}
              onTouchStart={handleCanvasTouchStart}
              onTouchEnd={handleCanvasTouchEnd}
              onTouchCancel={handleCanvasTouchEnd}
            >
              {/* Click hint */}
              <AnimatePresence>
                {!allRevealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center"
                  >
                    {visibleBlocks.length === 0 && (
                      <div className="flex flex-col items-center gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.12, 1] }}
                          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                          className={`flex h-11 w-11 items-center justify-center rounded-full border ${isDarkMode ? 'border-[#ffcc00]/30 bg-[#ffcc00]/10' : 'border-[#f5a213]/40 bg-[#f5a213]/10'}`}
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill={isDarkMode ? "#ffcc00" : "#f5a213"}>
                            <path d="M3 2L20 10L12.8 11.8L16.4 21L12.3 22.5L8.6 13.3L3 19V2Z" stroke={isDarkMode ? "#120533" : "#fff"} strokeWidth="1" />
                          </svg>
                        </motion.div>
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-white/40' : 'text-[#888899]'}`}>Click to place blocks</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reveal: Header bar */}
              <AnimatePresence>
                {isVisible('header') && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0.6, y: -10 }}
                    animate={{ opacity: 1, scaleX: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    className={`flex h-9 items-center gap-2 rounded-lg border px-4 xl:h-10 ${
                      isDarkMode ? 'border-white/10 bg-white/5' : 'border-[#c1c1cd] bg-white'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-[#d1d1dd]'}`} />
                    <span className={`h-2 w-16 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-[#f0f0f4]'}`} />
                    <span className={`ml-auto h-2 w-10 rounded-full ${isDarkMode ? 'bg-[#ffcc00]/25' : 'bg-[#f5a213]/25'}`} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reveal: Hero block */}
              <AnimatePresence>
                {isVisible('hero') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.88, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                    className={`relative grid h-24 place-items-center rounded-xl border md:h-32 xl:h-36 ${
                      isDarkMode 
                        ? 'border-[#5a42bf] bg-gradient-to-br from-[#1a0f78] to-[#0f0551] shadow-[0_0_30px_rgba(90,66,191,0.3),_inset_0_1px_0_rgba(255,255,255,0.08)]' 
                        : 'border-[#dfbdf8]/50 bg-white shadow-[0_0_30px_rgba(217,70,239,0.05)]'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed]/80 md:text-xs">Hero Section</span>
                      <span className={`text-sm font-extrabold md:text-base ${isDarkMode ? 'text-[#ffcc00] drop-shadow-[0_0_12px_rgba(255,204,0,0.6)]' : 'text-[#f5a213]'}`}>UI Component Dropped</span>
                    </div>
                    {/* Selection outline glow */}
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                      className={`pointer-events-none absolute inset-0 rounded-xl border-2 ${isDarkMode ? 'border-[#ffcc00]/60 shadow-[0_0_20px_rgba(255,204,0,0.25)]' : 'border-[#f5a213]/60 shadow-[0_0_20px_rgba(245,162,19,0.15)]'}`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reveal: 2-col cards */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <AnimatePresence>
                  {isVisible('card1') && (
                    <motion.div
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                      className={`h-16 rounded-xl border md:h-24 xl:h-28 ${
                        isDarkMode 
                          ? 'border-[#5a42bf] bg-gradient-to-br from-[#15096a] to-[#0f0551] shadow-[0_0_20px_rgba(90,66,191,0.2)]'
                          : 'border-[#c1c1cd] bg-white shadow-sm'
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between p-3">
                        <div className={`h-1.5 w-1/2 rounded-full ${isDarkMode ? 'bg-white/15' : 'bg-[#d1d1dd]'}`} />
                        <div className={`h-1.5 w-3/4 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-[#f0f0f4]'}`} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {isVisible('card2') && (
                    <motion.div
                      initial={{ opacity: 0, x: 20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                      className={`h-16 rounded-xl border md:h-24 xl:h-28 ${
                        isDarkMode 
                          ? 'border-[#5a42bf] bg-gradient-to-br from-[#15096a] to-[#0f0551] shadow-[0_0_20px_rgba(90,66,191,0.2)]'
                          : 'border-[#c1c1cd] bg-white shadow-sm'
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between p-3">
                        <div className={`h-1.5 w-2/3 rounded-full ${isDarkMode ? 'bg-white/15' : 'bg-[#d1d1dd]'}`} />
                        <div className={`h-1.5 w-1/2 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-[#f0f0f4]'}`} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Click ripples */}
              <AnimatePresence>
                {clickRipples.map(r => (
                  <motion.span
                    key={r.id}
                    initial={{ opacity: 0.7, scale: 0, x: r.x - 24, y: r.y - 24 }}
                    animate={{ opacity: 0, scale: 3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className={`pointer-events-none absolute h-12 w-12 rounded-full border ${isDarkMode ? 'border-[#ffcc00]/50 bg-[#ffcc00]/8' : 'border-[#f5a213]/50 bg-[#f5a213]/8'}`}
                    style={{ left: 0, top: 0 }}
                  />
                ))}
              </AnimatePresence>

              {/* Sparkle trail */}
              <AnimatePresence>
                {cursor.trail.map((t, i) => (
                  <motion.span
                    key={t.id}
                    initial={{ opacity: 0.6, scale: 1 }}
                    animate={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.35 }}
                    className={`pointer-events-none absolute h-1 w-1 rounded-full ${isDarkMode ? 'bg-[#ffcc00]' : 'bg-[#f5a213]'}`}
                    style={{
                      left: t.x - 2,
                      top: t.y - 2,
                      filter: 'blur(0.5px)',
                      opacity: (i / cursor.trail.length) * 0.5,
                    }}
                  />
                ))}
              </AnimatePresence>

              {/* Custom cursor */}
              <motion.div
                className="pointer-events-none absolute z-30"
                style={{ x: cursor.springX, y: cursor.springY, translateX: '-50%', translateY: '-50%' }}
              >
                {/* Outer ring */}
                <motion.div
                  animate={cursor.isClicking ? { scale: 0.6, opacity: 0.9 } : { scale: 1, opacity: 0.5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`absolute -left-4 -top-4 h-8 w-8 rounded-full border ${isDarkMode ? 'border-[#ffcc00]/60' : 'border-[#f5a213]/60'}`}
                />
                {/* Cursor SVG */}
                <motion.div
                  animate={cursor.isClicking ? { scale: 0.75, rotate: -10 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                >
                  <svg viewBox="0 0 24 24" className={`h-6 w-6 ${isDarkMode ? 'drop-shadow-[0_0_10px_rgba(255,204,0,0.8)]' : 'drop-shadow-[0_0_8px_rgba(245,162,19,0.5)]'}`}>
                    <path
                      d="M3 2L20 10L12.8 11.8L16.4 21L12.3 22.5L8.6 13.3L3 19V2Z"
                      fill={isDarkMode ? "#ffcc00" : "#f5a213"}
                      stroke={isDarkMode ? "#120533" : "#fff"}
                      strokeWidth="1.1"
                    />
                  </svg>
                </motion.div>
                {/* Click label */}
                <AnimatePresence>
                  {!allRevealed && (
                    <motion.span
                      initial={{ opacity: 0, x: 8, scale: 0.85 }}
                      animate={{ opacity: 0.7, x: 12, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`absolute top-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm ${
                        isDarkMode ? 'bg-[#ffcc00]/15 text-[#ffcc00]' : 'bg-[#f5a213]/15 text-[#f5a213]'
                      }`}
                    >
                      Click to place
                    </motion.span>
                  )}
                  {allRevealed && (
                    <motion.span
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 0.7, x: 12 }}
                      className="absolute top-0 whitespace-nowrap rounded-md bg-[#28c840]/15 px-2 py-0.5 text-[9px] font-bold text-[#28c840] backdrop-blur-sm"
                    >
                      All done ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Twinkle keyframes */}
      <style>{`
        @keyframes twinkle {
          from { opacity: 0.05; transform: scale(0.8); }
          to   { opacity: 0.4;  transform: scale(1.2); }
        }
      `}</style>
    </section>
  );
}