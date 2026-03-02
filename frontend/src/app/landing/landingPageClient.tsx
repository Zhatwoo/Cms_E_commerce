'use client';

import React, { useEffect, useState } from 'react';
import { LandingHeader } from './components/header';
import { AuthModal } from './components/authModal';
import { LandingScrollRoot } from './components/scrolling';

type AuthMode = 'login' | 'register';

export function LandingPageClient({ children }: { children: React.ReactNode }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('landing-theme') === 'dark';
  });

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

  const setThemeState = (next: boolean) => {
    setIsDarkMode(next);
    window.localStorage.setItem('landing-theme', next ? 'dark' : 'light');
  };

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = !isDarkMode;

    if (
      !(document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }).startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setThemeState(next);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = (document as Document & { startViewTransition: (cb: () => void) => { ready: Promise<void> } })
      .startViewTransition(() => setThemeState(next));

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        { clipPath },
        {
          duration: 1000,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  };

  const themedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    return React.cloneElement(child as React.ReactElement<{ isDarkMode?: boolean }>, {
      isDarkMode,
    });
  });

  return (
    <>
      <LandingScrollRoot
        headerSlot={<LandingHeader onAuthClick={handleAuthClick} isDarkMode={isDarkMode} onThemeToggle={toggleTheme} />}
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
