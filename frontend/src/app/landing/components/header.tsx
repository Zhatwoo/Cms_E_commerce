'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

interface LandingHeaderProps {
  onAuthClick?: (mode: 'login' | 'register') => void;
  isDarkMode?: boolean;
  onThemeToggle?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function LandingHeader({ onAuthClick, isDarkMode = false, onThemeToggle }: LandingHeaderProps) {
  const loginRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="absolute left-0 right-0 top-0 z-30 px-4 pt-6 md:px-10">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between rounded-full border border-white/10 bg-[#190765]/95 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[#1a0a62] ring-1 ring-white/10">
            <Image
              src="/img/centric-logo.svg"
              alt="Centric logo"
              width={20}
              height={20}
              className="h-5 w-5"
              priority
            />
          </span>
          <span className="text-[1.9rem] font-semibold leading-none tracking-tight">Centric</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-white/85 md:flex">
          <Link href="#" className="transition hover:text-white">Home</Link>
          <Link href="#" className="transition hover:text-white">About</Link>
          <Link href="#" className="transition hover:text-white">Company</Link>
        </nav>

        <div className="flex items-center gap-3">
        <button
          ref={loginRef}
          onClick={() => onAuthClick?.('login')}
          className="rounded-full border border-white/25 bg-[#1a0f63]/80 px-5 py-1.5 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/10"
          suppressHydrationWarning
        >
          Sign In
        </button>
        <button
          onClick={onThemeToggle}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-[#1a0f63] text-base text-[#facc15] transition hover:bg-[#221178]"
          suppressHydrationWarning
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? '☀' : '☾'}
        </button>
        </div>
      </div>
    </header>
  );
}
