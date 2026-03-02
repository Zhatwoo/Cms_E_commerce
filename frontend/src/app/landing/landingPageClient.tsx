'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LandingHeader } from './components/header';
import { AuthModal } from './components/authModal';
import { LandingScrollRoot } from './components/scrolling';

type AuthMode = 'login' | 'register';

export function LandingPageClient({ children }: { children: React.ReactNode }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isThemeSwitching, setIsThemeSwitching] = useState(false);
  const lastScrollAtRef = useRef(0);

  const handleAuthClick = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

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
    setIsDarkMode(next);
    window.localStorage.setItem('landing-theme', next ? 'dark' : 'light');
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

    return React.cloneElement(child as React.ReactElement<{ isDarkMode?: boolean }>, {
      isDarkMode,
    });
  });

  return (
    <>
      <LandingScrollRoot
        headerSlot={<LandingHeader onAuthClick={handleAuthClick} isDarkMode={isDarkMode} onThemeToggle={toggleTheme} isThemeSwitching={isThemeSwitching} />}
      >
        {themedChildren}
      </LandingScrollRoot>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
