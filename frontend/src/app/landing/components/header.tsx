'use client';

import Link from 'next/link';
import { useLandingScroll } from './scrolling';

export function LandingHeader() {
  const { isScrolled } = useLandingScroll();

  return (
    <header
      className={`absolute left-0 right-0 top-0 flex w-full items-center justify-between pl-30 pr-30 py-4 transition-[background-color,backdrop-filter] duration-300 ease-out md:pl-60 md:pr-60 md:py-5 ${
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
        <Link
          href="/auth/login"
          className="text-sm font-medium text-white/95 transition hover:text-white"
        >
          Log in
        </Link>
        <Link
          href="/auth/register"
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-white/95"
        >
          Start for free
        </Link>
      </nav>
    </header>
  );
}
