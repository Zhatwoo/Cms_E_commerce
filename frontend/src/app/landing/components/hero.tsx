'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LandingHeader } from './header';

const SCROLL_RANGE = 400; // px over which each element's fade/slide completes
const SLIDE_AMOUNT = 120; // px to slide left
const CHAIN_OFFSET = 80; // px scroll delay between each element

function getChainProgress(scrollY: number, index: number): number {
  const start = index * CHAIN_OFFSET;
  const progress = (scrollY - start) / SCROLL_RANGE;
  return Math.min(Math.max(progress, 0), 1);
}

export function Hero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(typeof window !== 'undefined' ? window.scrollY : 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const h1Progress = getChainProgress(scrollY, 0);
  const pProgress = getChainProgress(scrollY, 1);
  const linkProgress = getChainProgress(scrollY, 2);

  const h1Style = {
    opacity: 1 - h1Progress,
    transform: `translateX(${-h1Progress * SLIDE_AMOUNT}px)`,
  };
  const pStyle = {
    opacity: 1 - pProgress,
    transform: `translateX(${-pProgress * SLIDE_AMOUNT}px)`,
  };
  const linkStyle = {
    opacity: 1 - linkProgress,
    transform: `translateX(${-linkProgress * SLIDE_AMOUNT}px)`,
  };

  return (
    <section className="sticky top-0 z-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-neutral-900">
      <LandingHeader />
      {/* Background image with dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070')`,
        }}
      />
      <div className="absolute inset-0 bg-black/60" aria-hidden />

      {/* Main content - chained parallax: h1 → p → Link */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 pl-30 -translate-y-[10%] md:pl-60 md:pb-32">
        <h1
          className="max-w-2xl text-4xl font-semibold uppercase tracking-tight text-white md:text-5xl lg:text-6xl"
          style={h1Style}
        >
          Build your website
        </h1>
        <p
          className="mt-4 max-w-lg text-lg text-white/95 md:text-xl"
          style={pStyle}
        >
          Build powerful e-commerce websites without the complexity.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex w-fit rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-white/95"
          style={linkStyle}
        >
          Start for free
        </Link>
      </div>
    </section>
  );
}
