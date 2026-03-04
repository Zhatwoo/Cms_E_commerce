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
      primary: '#F5F6FA',
      primaryEnd: '#ECEFF6',
      dark: '#23206D',
      card: '#23206D',
      elevated: '#30367C',
      fog: '#898AC2',
      sidebar: '#1A1A4C',
      searchBar: '#1B1F63',
    },
    text: {
      primary: '#F8F8FF',
      secondary: '#D7D9F3',
      muted: '#B7BCE8',
      subtle: '#898AC2',
    },
    border: {
      default: 'rgba(137, 138, 194, 0.55)',
      faint: 'rgba(137, 138, 194, 0.35)',
    },
    accent: {
      yellow: '#EAB308',
      yellowBright: '#FACC15',
      purple: '#898AC2',
      purpleDeep: '#5861A2',
    },
    status: {
      good: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      info: '#C7CCFF',
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
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const storedTheme = window.sessionStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
      return;
    }

    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    (document.documentElement.style as any).colorScheme = theme;

    try {
      window.sessionStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore sessionStorage errors
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
