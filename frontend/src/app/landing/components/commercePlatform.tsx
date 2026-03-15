'use client';

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';

function Reveal({
  children,
  className,
  delay = 0,
  x = 0,
  y = 28,
  duration = 0.72,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  x?: number;
  y?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: false, amount: 0.12 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Subtle 3-D tilt card on hover
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [6, -6]), { stiffness: 260, damping: 24 });
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-6, 6]), { stiffness: 260, damping: 24 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current!.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onLeave() { rawX.set(0); rawY.set(0); }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}

export function CommercePlatform({ isDarkMode = false, onAuthClick }: { isDarkMode?: boolean; onAuthClick?: (mode: 'login' | 'register') => void }) {
  const sectionClass = isDarkMode ? 'bg-[#0a0141] text-white' : 'bg-white text-[#120533]';
  const descriptionClass = isDarkMode ? 'text-white/50' : 'text-[#616170]';

  const cardBase = isDarkMode
    ? 'border border-[#2a2075]/80 bg-gradient-to-b from-[#13106a]/90 to-[#0d0a55]/90 shadow-[0_20px_60px_rgba(5,2,38,0.65)]'
    : 'border border-[#c1c1cd] bg-white shadow-[0_16px_40px_rgba(20,20,50,0.06)]';

  const featuredCard = isDarkMode
    ? 'border-2 border-[#6b3fd4]/70 bg-gradient-to-b from-[#16126e]/95 to-[#0e0b58]/95 shadow-[0_24px_70px_rgba(5,2,38,0.7),0_0_0_1px_rgba(107,63,212,0.25)]'
    : 'border border-[#4ade80] bg-white shadow-[0_24px_60px_rgba(74,222,128,0.12)]';

  const tagClass = isDarkMode
    ? 'bg-[#1b1f6e]/80 text-[#8d9bdc] border border-[#2d3580]/50'
    : 'bg-[#f0f0f4] text-[#616170] border border-[#c1c1cd]';

  const chipClass = (color: string) =>
    isDarkMode
      ? `bg-[#141860]/80 border border-[#252c7a]/60 text-[#8da0e4]`
      : color;

  const gridCellClass = isDarkMode
    ? 'bg-gradient-to-br from-[#182070] to-[#111660] border border-[#252c85]/50'
    : 'bg-[#f8f8fb] border border-[#c1c1cd]';

  const dotRow = isDarkMode
    ? ['bg-[#ff5f57]', 'bg-[#febc2e]', 'bg-[#28c840]']
    : ['bg-[#ff6b6b]', 'bg-[#ffd166]', 'bg-[#6bcb77]'];

  return (
    <section className={`relative overflow-hidden px-4 pb-24 pt-16 md:px-8 md:pb-32 md:pt-24 ${sectionClass} ${isDarkMode ? '-mt-px' : ''}`}>
      {/* Background glow accents — dark only */}
      {isDarkMode && (
        <>
          <div className="pointer-events-none absolute left-[-8%] top-[10%] h-[500px] w-[500px] rounded-full bg-[#4c1d95]/12 blur-[140px]" />
          <div className="pointer-events-none absolute bottom-[-5%] right-[-5%] h-[400px] w-[400px] rounded-full bg-[#7c3aed]/10 blur-[120px]" />

        </>
      )}

      <div className="relative z-10 mx-auto max-w-[1100px]">
        {/* Section header */}
        <Reveal className="mx-auto max-w-[780px] text-center">
          {/* Eyebrow */}
          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-bold uppercase tracking-widest ${isDarkMode
              ? 'border-[#3d2fa0]/60 bg-[#1a1572]/40 text-[#a78bfa]'
              : 'border-[#d8d0f7] bg-[#f3f0ff] text-[#7c5cba]'
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isDarkMode ? 'bg-[#a78bfa]' : 'bg-[#8b3dff]'} animate-pulse`} />
            Commerce Platform
          </span>

          <h2 className="mt-5 text-[38px] font-black leading-[1.08] tracking-[-0.025em] sm:text-[48px] md:text-[60px]">
            The commerce platform
            <br />
            <span className={isDarkMode
              ? 'bg-gradient-to-r from-[#a78bfa] via-[#d946ef] to-[#ffcc00] bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#8b3dff] bg-clip-text text-transparent'
            }>
              behind everything we build
            </span>
          </h2>

          <p className={`mx-auto mt-5 max-w-[560px] text-sm leading-relaxed sm:text-[15px] ${descriptionClass}`}>
            Build, customize, and scale e-commerce websites with total control —
            a flexible, modern system for creating powerful online stores.
          </p>

          {/* Stats row */}
          <div className={`mx-auto mt-8 flex max-w-[480px] items-center justify-center gap-0 divide-x rounded-2xl border p-1 ${isDarkMode
              ? 'divide-[#2a2075]/60 border-[#2a2075]/60 bg-[#0f0c5a]/50'
              : 'divide-[#c1c1cd] border-[#c1c1cd] bg-white/80'
            }`}>
            {[
              { n: '2.4k+', label: 'Stores built' },
              { n: '99.9%', label: 'Uptime' },
              { n: '4.9★', label: 'Average rating' },
            ].map(({ n, label }) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-0.5 px-3 py-2.5">
                <span className={`text-lg font-black leading-none ${isDarkMode ? 'text-white' : 'text-[#120533]'}`}>{n}</span>
                <span className={`text-[10px] font-medium ${descriptionClass}`}>{label}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Cards grid */}
        <div className="mt-14 grid items-start gap-4 sm:gap-5 md:mt-16 md:grid-cols-3 md:gap-6">

          {/* ── Card 1: Stock photo / tags ── */}
          <Reveal delay={0.07} x={-24}>
            <TiltCard className={`group relative overflow-hidden rounded-2xl p-5 md:mt-14 ${cardBase}`}>
              {/* Subtle inner glow on hover */}
              {isDarkMode && (
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: 'radial-gradient(circle at 50% 0%, rgba(107,63,212,0.12) 0%, transparent 70%)' }}
                />
              )}

              {/* Window dots */}
              <div className="mb-4 flex items-center gap-1.5">
                {dotRow.map((c, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${c}`} />)}
                <span className={`ml-2 text-[10px] font-medium ${descriptionClass}`}>store-builder.tsx</span>
              </div>

              <p className={`text-lg font-bold leading-snug sm:text-xl ${isDarkMode ? 'text-white' : 'text-[#120533]'}`}>
                Drag and drop pre-built e-commerce components to assemble your storefront
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {[
                  { tag: 'Hero', color: isDarkMode ? '' : 'text-[#f43f5e] bg-[#ffe4e6] border-[#fecdd3]' },
                  { tag: 'Product Grid', color: isDarkMode ? '' : 'text-[#0284c7] bg-[#e0f2fe] border-[#bae6fd]' },
                  { tag: 'Cart', color: isDarkMode ? '' : 'text-[#d97706] bg-[#fef3c7] border-[#fde68a]' },
                  { tag: 'Checkout', color: isDarkMode ? '' : 'text-[#c026d3] bg-[#fae8ff] border-[#f5d0fe]' }
                ].map(({ tag, color }) => (
                  <span key={tag} className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${isDarkMode ? tagClass : color
                    }`}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Avatar placeholders */}
              <div className="mt-6 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-8 w-8 rounded-full border-2 ${isDarkMode ? 'border-[#13106a] bg-[#1e2a7a]' : 'border-white bg-[#eceef6]'
                        }`}
                    />
                  ))}
                </div>
                <span className={`text-[11px] font-medium ${descriptionClass}`}>+128 blocks available</span>
              </div>

              {/* Progress bar */}
              <div className={`mt-4 h-1.5 w-full overflow-hidden rounded-full ${isDarkMode ? 'bg-[#1b1f6e]/60' : 'bg-[#eef0f8]'}`}>
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#d946ef]"
                  initial={{ width: 0 }}
                  whileInView={{ width: '72%' }}
                  viewport={{ once: false }}
                  transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="mt-1 flex justify-between">
                <span className={`text-[10px] ${descriptionClass}`}>Build progress</span>
                <span className={`text-[10px] font-bold ${isDarkMode ? 'text-[#a78bfa]' : 'text-[#8b3dff]'}`}>72%</span>
              </div>
            </TiltCard>
          </Reveal>

          {/* ── Card 2: Design — featured / taller ── */}
          <Reveal delay={0.14}>
            <TiltCard className={`group relative overflow-hidden rounded-2xl p-5 ${featuredCard}`}>
              {/* Glow orb */}
              {isDarkMode && (
                <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#7c3aed]/20 blur-3xl" />
              )}

              <div className="mb-4 flex items-center gap-1.5">
                {dotRow.map((c, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${c}`} />)}
                <span className={`ml-2 text-[10px] font-medium ${descriptionClass}`}>theme-editor.tsx</span>
              </div>

              <p className={`text-xl font-bold leading-snug sm:text-2xl ${isDarkMode ? 'text-white' : 'text-[#120533]'}`}>
                What will you{' '}
                <span className={isDarkMode ? "bg-gradient-to-r from-[#9d3fff] to-[#d946ef] bg-clip-text text-transparent" : "text-[#f97316]"}>
                  build
                </span>{' '}
                today?
              </p>

              <p className={`mt-2 text-sm leading-relaxed sm:text-[15px] ${descriptionClass}`}>
                Design, configure, preview, and deploy your online store — all in one unified builder environment.
              </p>

              <button
                type="button"
                onClick={() => onAuthClick?.('register')}
                suppressHydrationWarning
                className={`mt-5 inline-block rounded-full px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97] ${isDarkMode
                    ? 'bg-gradient-to-r from-[#7c3aed] to-[#9d3fff] shadow-[0_4px_20px_rgba(139,61,255,0.5)] hover:shadow-[0_6px_28px_rgba(139,61,255,0.65)]'
                    : 'bg-[#f43f5e] shadow-[0_4px_20px_rgba(244,63,94,0.4)] hover:shadow-[0_6px_28px_rgba(244,63,94,0.5)]'
                  }`}
              >
                Start designing
              </button>

              {/* Template chips */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { label: 'Research Doc', light: 'bg-[#eaf5ec] text-[#4a7c59] border-[#cce8d4]' },
                  { label: 'Presentation', light: 'bg-[#fdf6e8] text-[#8a6f3a] border-[#f0ddb0]' },
                  { label: 'Websites', light: 'bg-[#eaecfb] text-[#5460a0] border-[#cfd3f0]' },
                ].map(({ label, light }) => (
                  <span
                    key={label}
                    className={`rounded-xl border px-2 py-2.5 text-center text-[11px] font-semibold transition-all hover:scale-105 ${chipClass(light)}`}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Mini feature list */}
              <div className="mt-5 flex flex-col gap-2">
                {['AI-powered layout engine', 'One-click publishing', 'Team collaboration'].map((feat) => (
                  <div key={feat} className="flex items-center gap-2">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${isDarkMode ? 'bg-[#7c3aed]/30 text-[#a78bfa]' : 'bg-[#ede8ff] text-[#8b3dff]'
                      }`}>✓</span>
                    <span className={`text-[11px] font-medium ${descriptionClass}`}>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Bottom accent line */}
              <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-[#7c3aed]/40 to-transparent" />
              <p className={`mt-3 text-center text-[10px] font-medium ${descriptionClass}`}>
                ✦ Trusted by 2,400+ creative teams
              </p>
            </TiltCard>
          </Reveal>

          {/* ── Card 3: Photo grid / gallery ── */}
          <Reveal delay={0.21} x={24}>
            <TiltCard className={`group relative overflow-hidden rounded-2xl p-5 md:-mt-6 ${cardBase}`}>
              {isDarkMode && (
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: 'radial-gradient(circle at 50% 100%, rgba(217,70,239,0.08) 0%, transparent 70%)' }}
                />
              )}

              <div className="mb-4 flex items-center gap-1.5">
                {dotRow.map((c, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${c}`} />)}
                <span className={`ml-2 text-[10px] font-medium ${descriptionClass}`}>gallery.tsx</span>
              </div>

              {/* 2×3 grid with staggered reveal */}
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className={`aspect-square overflow-hidden rounded-lg border ${gridCellClass} relative`}
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.45, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* Shimmer highlight */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${i % 3 === 0
                        ? 'from-[#7c3aed]/15 to-transparent'
                        : i % 3 === 1
                          ? 'from-[#d946ef]/10 to-transparent'
                          : 'from-[#ffcc00]/8 to-transparent'
                      }`} />
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className={`text-xs font-medium ${descriptionClass}`}>
                  Visual asset library
                </p>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${isDarkMode
                    ? 'border-[#2d3580]/50 bg-[#1b1f6e]/60 text-[#8da0e4]'
                    : 'border-[#e2e4f0] bg-[#eef0f8] text-[#7f7ca1]'
                  }`}>
                  1,240 assets
                </span>
              </div>

              {/* Upload CTA */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 transition-colors ${isDarkMode
                    ? 'border-[#2d3580]/70 bg-[#141860]/40 hover:border-[#7c3aed]/50 hover:bg-[#1a1d7a]/40'
                    : 'border-[#d8d8ee] bg-[#f7f7fd] hover:border-[#c0aff5] hover:bg-[#f3f0ff]'
                  }`}
              >
                <span className={`text-base ${isDarkMode ? 'text-white/30' : 'text-[#c0b8e0]'}`}>⊕</span>
                <span className={`text-[11px] font-semibold ${descriptionClass}`}>Upload or generate</span>
              </motion.div>
            </TiltCard>
          </Reveal>
        </div>


      </div>
    </section>
  );
}