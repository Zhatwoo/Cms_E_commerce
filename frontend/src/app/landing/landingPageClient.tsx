'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { LandingHeader } from './components/header';
import { AuthModal } from './components/authModal';
import { LandingScrollRoot } from './components/scrolling';

type AuthMode = 'login' | 'register';
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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const isDarkMode = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);

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
    window.localStorage.setItem(LANDING_THEME_KEY, next ? 'dark' : 'light');
    window.dispatchEvent(new Event(THEME_EVENT_NAME));
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
