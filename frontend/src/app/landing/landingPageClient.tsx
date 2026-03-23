'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LandingHeader } from './components/header';
import { AuthModal } from './components/authModal';
import { LandingScrollRoot } from './components/scrolling';

type AuthMode = 'login' | 'register' | 'check-email';
const LANDING_THEME_KEY = 'landing-theme';
const THEME_EVENT_NAME = 'landing-theme-change';

const subscribeTheme = (onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(THEME_EVENT_NAME, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(THEME_EVENT_NAME, onStoreChange);
  };
};

const getThemeSnapshot = () => window.localStorage.getItem(LANDING_THEME_KEY) === 'dark';
const getThemeServerSnapshot = () => false;

export function LandingPageClient({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isThemeSwitching, setIsThemeSwitching] = useState(false);
  const lastScrollAtRef = useRef(0);
  const [suspensionNotice, setSuspensionNotice] = useState<string>('');

  const handleAuthClick = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthEmail('');
    setAuthModalOpen(true);
  };

  useEffect(() => {
    const auth = searchParams.get('auth');
    const email = searchParams.get('email') || '';

    if (auth === 'login' || auth === 'register' || auth === 'check-email') {
      setAuthMode(auth);
      setAuthEmail(auth === 'check-email' ? email : '');
      setAuthModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const suspendedFlag = searchParams.get('suspended');
    let notice = '';

    try {
      notice = window.sessionStorage.getItem('mercato_suspension_notice') || '';
      if (notice) {
        window.sessionStorage.removeItem('mercato_suspension_notice');
      }
    } catch {
      // ignore sessionStorage read errors
    }

    if (!notice && suspendedFlag === '1') {
      notice = 'Your account is currently suspended. Please contact admin for assistance.';
    }

    if (notice) {
      setSuspensionNotice(notice);
    }
  }, [searchParams]);

  useEffect(() => {
    const styleId = 'landing-view-transition-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('landing-theme');
    setIsDarkMode(savedTheme ? savedTheme === 'dark' : true);
  }, []);

  useEffect(() => {
    const markScroll = () => {
      lastScrollAtRef.current = performance.now();
    };

    markScroll();
    window.addEventListener('scroll', markScroll, { passive: true });
    return () => window.removeEventListener('scroll', markScroll);
  }, []);

  const setThemeState = (next: boolean) => {
    window.localStorage.setItem(LANDING_THEME_KEY, next ? 'dark' : 'light');
    setIsDarkMode(next);
    window.dispatchEvent(new Event(THEME_EVENT_NAME));
  };

  const runAnimatedThemeTransition = (next: boolean, x: number, y: number) => {
    const supportsTransition = (document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    }).startViewTransition;

    if (!supportsTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setThemeState(next);
      window.setTimeout(() => setIsThemeSwitching(false), 120);
      return;
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = (document as Document & {
      startViewTransition: (cb: () => void) => { ready: Promise<void> };
    }).startViewTransition(() => setThemeState(next));

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        { clipPath },
        {
          duration: 850,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      );
      window.setTimeout(() => setIsThemeSwitching(false), 220);
    }).catch(() => {
      setThemeState(next);
      setIsThemeSwitching(false);
    });
  };

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isThemeSwitching) {
      return;
    }

    setIsThemeSwitching(true);
    const next = !isDarkMode;
    const isActivelyScrolling = performance.now() - lastScrollAtRef.current < 160;
    const x = e.clientX;
    const y = e.clientY;

    if (isActivelyScrolling) {
      const startedAt = performance.now();
      const waitForScrollIdle = () => {
        const stillScrolling = performance.now() - lastScrollAtRef.current < 110;
        const timedOut = performance.now() - startedAt > 550;

        if (!stillScrolling || timedOut) {
          runAnimatedThemeTransition(next, x, y);
          return;
        }

        requestAnimationFrame(waitForScrollIdle);
      };

      requestAnimationFrame(waitForScrollIdle);
      return;
    }

    runAnimatedThemeTransition(next, x, y);
  };

  const themedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    if (typeof child.type === 'string') {
      return child;
    }

    return React.cloneElement(child as React.ReactElement<{ isDarkMode?: boolean; onAuthClick?: (mode: AuthMode) => void }>, {
      isDarkMode,
      onAuthClick: handleAuthClick,
    });
  });

  return (
    <>
      {suspensionNotice && (
        <div className="fixed left-1/2 top-6 z-[120] w-[min(92vw,560px)] -translate-x-1/2 rounded-xl border border-red-300 bg-white p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-700">Account Suspended</p>
              <p className="mt-1 text-sm text-gray-700">{suspensionNotice}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuspensionNotice('')}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100"
              aria-label="Close suspension notice"
            >
              x
            </button>
          </div>
        </div>
      )}
      <LandingScrollRoot
        headerSlot={<LandingHeader onAuthClick={handleAuthClick} isDarkMode={isDarkMode} onThemeToggle={toggleTheme} isThemeSwitching={isThemeSwitching} />}
      >
        {themedChildren}
      </LandingScrollRoot>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        initialEmail={authEmail}
        isDarkMode={isDarkMode}
      />
    </>
  );
}
