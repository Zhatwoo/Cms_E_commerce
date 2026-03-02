/*
Etong theme-context.tsx naman na to eh yung sa theme ng application. 
*/

'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'm_dashboard_theme';

/* Reference: Color Palette 1 & 2 – deep indigo/purple, yellow accent, Outfit font */
export const THEMES = {
  dark: {
    bg: {
      primary: '#1A1A4C',
      primaryEnd: '#191E2D',
      dark: '#191E2D',
      card: '#2C354F',
      elevated: '#2C354F',
      fog: '#191E2D',
      sidebar: '#1A1A4C',
      searchBar: '#2C354F',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8799C0',
      muted: '#8799C0',
      subtle: '#4C597D',
    },
    border: {
      default: '#4C597D',
      faint: 'rgba(135, 153, 192, 0.35)',
    },
    accent: {
      yellow: '#FFCE00',
      yellowBright: '#FFCE00',
      purple: '#A64CD9',
      purpleDeep: '#5C1D8F',
    },
    status: {
      good: '#A3E635',
      warning: '#FFB800',
      error: '#FDA4AF',
      info: '#29265C',
    },
  },
  light: {
    bg: {
      primary: '#F0F2F5',
      primaryEnd: '#F0F2F5',
      dark: '#FFFFFF',
      card: '#FFFFFF',
      elevated: '#F1F5F9',
      fog: '#FFFFFF',
      sidebar: '#1C172B',
      searchBar: '#E2E8F0',
    },
    text: {
      primary: '#0F172A',
      secondary: '#334155',
      muted: '#64748B',
      subtle: '#94A3B8',
    },
    border: {
      default: '#CBD5E1',
      faint: '#E2E8F0',
    },
    accent: {
      yellow: '#D97706',
      yellowBright: '#FCD34D',
      purple: '#6B2DC0',
      purpleDeep: '#5B21B6',
    },
    status: {
      good: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB',
    },
  },
};

type Theme = 'dark' | 'light';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: (e?: React.MouseEvent) => void;
  colors: typeof THEMES.dark;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    (document.documentElement.style as any).colorScheme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore localStorage errors
    }
  }, [theme]);

  useEffect(() => {
    // Inject CSS to disable the default browser fade animation for view transitions.
    const styleId = 'view-transition-style';
    if (document.getElementById(styleId)) return;

    const css = `
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }
    `;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }, []);

  const toggleTheme = useCallback((e?: React.MouseEvent) => {
    const newTheme = theme === "dark" ? "light" : "dark";

    if (
      !e ||
      !(document as any).startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(newTheme);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => setTheme(newTheme));

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        { clipPath },
        { duration: 1000, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: THEMES[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/** Use theme colors when inside ThemeProvider; undefined otherwise (for use in AlertModal fallback). */
export function useThemeOptional(): ThemeContextType | undefined {
  return useContext(ThemeContext);
}
