'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useLandingScroll } from './scrolling';

interface LandingHeaderProps {
  onAuthClick?: (mode: 'login' | 'register') => void;
}

export function LandingHeader({ onAuthClick }: LandingHeaderProps) {
  const { isScrolled } = useLandingScroll();
  const loginRef = useRef<HTMLButtonElement>(null);
  const signupRef = useRef<HTMLButtonElement>(null);

  return (
    <header
      className={`absolute left-0 right-0 top-0 flex w-full items-center justify-between pl-30 pr-30 py-4 transition-[background-color,backdrop-filter] duration-300 ease-out md:pl-60 md:pr-60 md:py-5 z-30 ${
        isScrolled ? 'bg-neutral-900/90 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <Link
        href="/"
        className="text-2xl font-medium tracking-wide text-white md:text-3xl"
        style={{ fontFamily: "'Great Vibes', cursive" }}
      >
        Mercato
      </Link>
      <nav className="flex items-center gap-6">
        <button
          ref={loginRef}
          onClick={() => onAuthClick?.('login')}
          className="text-sm font-medium text-white/95 transition hover:text-white cursor-pointer"
          suppressHydrationWarning
        >
          Log in
        </button>
        <button
          ref={signupRef}
          onClick={() => onAuthClick?.('register')}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-white/95 cursor-pointer"
          suppressHydrationWarning
        >
          Start for free
        </button>
      </nav>
    </header>
  );
}
