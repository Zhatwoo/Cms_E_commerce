'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const HERO_ROTATING_TEXT = [
  'Your Way.',
  'Your Brand.',
  'Your Rules.',
  'Your Growth.',
];

export function Hero({ isDarkMode = false }: { isDarkMode?: boolean }) {
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
        if (typedCount < activeText.length) {
          setTypedCount((count) => count + 1);
        } else {
          setIsDeleting(true);
        }
        return;
      }

      if (typedCount > 0) {
        setTypedCount((count) => count - 1);
        return;
      }

      setIsDeleting(false);
      setTextIndex((index) => (index + 1) % HERO_ROTATING_TEXT.length);
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [activeText, isDeleting, typedCount]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0a0141] px-4 pb-0 pt-24 text-white md:px-8 md:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(139,92,246,0.3),transparent_60%)]" />
      <div className="pointer-events-none absolute -bottom-36 left-1/2 h-80 w-[92%] -translate-x-1/2 rounded-[100%] border border-[#6b4ee6]/20 bg-[#14065f]/28 blur-2xl" />
      {isDarkMode && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent via-[#0a0141]/80 to-[#0a0141]" />
      )}

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex rounded-full border border-[#ffcc00]/20 bg-[#ffcc00]/8 px-5 py-1 text-xs font-semibold text-[#ffcc00]"
        >
          Introducing Centric Web Builder
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-5xl font-black leading-[0.95] tracking-tight md:text-8xl"
        >
          Your Store,
          <br />
          <span className="inline-flex items-baseline">
            <span className="bg-gradient-to-r from-[#7c3aed] via-[#d946ef] to-[#ffcc00] bg-clip-text text-transparent">
              {typedText}
            </span>
            <span className="ml-1 inline-block animate-pulse text-white/85">|</span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl text-base leading-relaxed text-white/65 md:text-xl"
        >
          Centric is where teams design, manage, and publish stunning enterprise
          storefronts without writing a single line of backend code.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 rounded-full bg-[#ffcc00] px-10 py-3 text-lg font-extrabold text-[#120533] shadow-[0_0_22px_rgba(255,204,0,0.6)] transition hover:-translate-y-0.5 hover:bg-[#ffe147]"
          suppressHydrationWarning
        >
          Start for Free
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 h-[300px] w-full max-w-[1100px] overflow-hidden rounded-t-2xl border border-b-0 border-[#5f45d5]/55 bg-[#11065a]/95 shadow-[0_-30px_80px_rgba(24,5,90,0.85)] md:mt-16 md:h-[390px]"
        >
          <div className="flex h-10 items-center gap-2 border-b border-white/10 bg-[#1c0d72] px-5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="ml-2 text-xs text-white/50">Project_Frontend_v1</span>
          </div>

          <div className="flex h-[calc(100%-2.5rem)] bg-[#13075f]">
            <div className="hidden w-[230px] flex-col gap-4 border-r border-white/10 bg-[#0f0551] p-5 lg:flex">
              <div className="h-3 w-[88%] rounded bg-white/10" />
              <div className="h-3 w-[62%] rounded bg-white/10" />
              <div className="grid h-10 place-items-center rounded-lg border border-white/10 bg-white/10 text-xs font-medium text-white/70">Header Block</div>
              <div className="grid h-10 place-items-center rounded-lg border border-white/10 bg-white/10 text-xs font-medium text-white/70">Hero Section</div>
              <div className="grid h-10 place-items-center rounded-lg border border-white/10 bg-white/10 text-xs font-medium text-white/70">Feature Grid</div>
            </div>

            <div className="relative flex flex-1 flex-col gap-4 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:20px_20px] p-5 md:p-7">
              <div className="h-9 rounded-lg border border-white/10 bg-white/5 landing-snap-in" />
              <div
                className="relative grid h-24 place-items-center rounded-xl border border-[#5a42bf] bg-[#1a0f78] opacity-0 md:h-32 landing-snap-in"
                style={{ animationDelay: '0.5s' }}
              >
                <span className="text-sm font-extrabold text-[#ffcc00] md:text-base">UI Component Dropped</span>
                <span
                  className="pointer-events-none absolute left-[calc(50%+132px)] top-1/2 z-12 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-[8deg] place-items-center drop-shadow-[0_0_10px_rgba(255,204,0,0.72)] landing-cursor-pop"
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" className="h-full w-full" role="presentation">
                    <path d="M3 2L20 10L12.8 11.8L16.4 21L12.3 22.5L8.6 13.3L3 19V2Z" fill="#ffcc00" stroke="#120533" strokeWidth="1.1" />
                  </svg>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-5">
                <div
                  className="h-20 rounded-xl border border-[#5a42bf] bg-[#15096a] opacity-0 md:h-24 landing-snap-in"
                  style={{ animationDelay: '1s' }}
                />
                <div
                  className="h-20 rounded-xl border border-[#5a42bf] bg-[#15096a] opacity-0 md:h-24 landing-snap-in"
                  style={{ animationDelay: '1.5s' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
