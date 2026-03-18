'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';

interface LandingHeaderProps {
  onAuthClick?: (mode: 'login' | 'register') => void;
  isDarkMode?: boolean;
  onThemeToggle?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isThemeSwitching?: boolean;
}

export function LandingHeader({ onAuthClick, isDarkMode = false, onThemeToggle, isThemeSwitching = false }: LandingHeaderProps) {
  const loginRef = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on resize to md+
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'About', href: '#' },
    { label: 'Company', href: '#' },
  ];

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 px-3 transition-all duration-500 ease-out sm:px-5 md:px-10 ${
          scrolled ? 'pt-3' : 'pt-5 md:pt-6'
        }`}
      >
        <div
          className={`mx-auto flex h-14 w-full max-w-7xl items-center justify-between rounded-full border px-3 transition-all duration-500 ease-out sm:px-5 md:px-6 ${
            scrolled
              ? 'border-white/15 bg-[#0d0548]/75 shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl backdrop-saturate-150'
              : 'border-white/10 bg-[#190765]/90 shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md'
          }`}
          style={{
            WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(1.5)' : 'blur(12px)',
          }}
        >
          <Link href="/" className="flex shrink-0 items-center gap-2 text-white">
            <Image
              src={isDarkMode ? "/img/centric-logo.svg" : "/img/centric-logo.svg"}
              alt="Centric logo"
              width={36}
              height={36}
              className="h-8 w-8 sm:h-9 sm:w-9"
              priority
            />
            <span className="text-[1.65rem] font-semibold leading-none tracking-tight sm:text-[1.9rem]">
              Centric
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="relative rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 text-white/70 hover:bg-white/8 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Sign In — desktop */}
            <button
              ref={loginRef}
              onClick={() => onAuthClick?.('login')}
              className="hidden rounded-full px-5 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 sm:block border border-white/20 bg-white/5 text-white/90 backdrop-blur-sm hover:border-white/40 hover:bg-white/12 hover:text-white"
              suppressHydrationWarning
            >
              Sign In
            </button>

            {/* Theme toggle */}
            <button
              onClick={onThemeToggle}
              disabled={isThemeSwitching}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm backdrop-blur-sm transition-all duration-200 active:scale-90 disabled:cursor-not-allowed disabled:opacity-70 sm:h-9 sm:w-9 sm:text-base border-white/15 bg-white/5 text-[#facc15] hover:border-[#facc15]/40 hover:bg-[#facc15]/10"
              suppressHydrationWarning
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="transition-transform duration-300" style={{ display: 'block', transform: isDarkMode ? 'rotate(0deg)' : 'rotate(-30deg)' }}>
                {isDarkMode ? '☀' : '☾'}
              </span>
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border backdrop-blur-sm transition-all duration-200 active:scale-90 md:hidden border-white/15 bg-white/5 hover:bg-white/10"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <span className="flex flex-col gap-[5px]">
                <span
                  className="block h-[1.5px] w-4 rounded-full transition-all duration-300 origin-center bg-white/80"
                  style={{ transform: mobileOpen ? 'translateY(6.5px) rotate(45deg)' : 'none' }}
                />
                <span
                  className="block h-[1.5px] w-4 rounded-full transition-all duration-300 bg-white/80"
                  style={{ opacity: mobileOpen ? 0 : 1, transform: mobileOpen ? 'scaleX(0)' : 'none' }}
                />
                <span
                  className="block h-[1.5px] w-4 rounded-full transition-all duration-300 origin-center bg-white/80"
                  style={{ transform: mobileOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none' }}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div
          className={`mx-auto mt-2 w-full max-w-7xl overflow-hidden rounded-2xl border shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 ease-out md:hidden ${
            mobileOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          } border-white/10 bg-[#0d0548]/85`}
          style={{ WebkitBackdropFilter: 'blur(20px)' }}
        >
          <nav className="flex flex-col px-3 py-3">
            {navLinks.map((link, i) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 text-white/70 hover:bg-white/8 hover:text-white"
                style={{ transitionDelay: mobileOpen ? `${i * 40}ms` : '0ms' }}
              >
                <span className="h-1 w-1 rounded-full bg-[#7c3aed]/70" />
                {link.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-white/8" />
            <button
              onClick={() => { onAuthClick?.('login'); setMobileOpen(false); }}
              className="mx-1 rounded-xl py-2.5 text-sm font-semibold transition-all border border-white/15 bg-white/5 text-white/90 hover:bg-white/10"
              suppressHydrationWarning
            >
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* Overlay to close mobile menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}