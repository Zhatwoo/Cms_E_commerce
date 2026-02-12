/*
Etong theme-context.tsx naman na to eh yung sa theme ng application. 
*/

'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const THEMES = {
  dark: {
    bg: {
      primary: '#1D1D21',
      dark: '#000000',
      card: '#1D1D21',
      elevated: '#26262C',
      fog: '#0a0a0f',
    },
    text: {
      primary: '#F4F4F6',
      secondary: '#E6E6E9',
      muted: '#9999A1',
      subtle: '#66666E',
    },
    border: {
      default: '#66666E',
      faint: '#4A4A52',
    },
    status: {
      good: '#A3E635',
      warning: '#FCD34D',
      error: '#FDA4AF',
      info: '#93C5FD',
    },
  },
  light: {
    bg: {
      primary: '#F0F2F5', // Cool gray background for better separation
      dark: '#FFFFFF',
      card: '#FFFFFF',
      elevated: '#F1F5F9', // Slate 100 - Better visibility against white
      fog: '#FFFFFF',
    },
    text: {
      primary: '#0F172A', // Slate 900 - High contrast
      secondary: '#334155', // Slate 700 - Readable secondary
      muted: '#64748B', // Slate 500
      subtle: '#94A3B8', // Slate 400
    },
    border: {
      default: '#CBD5E1', // Slate 300 - Visible borders
      faint: '#E2E8F0', // Slate 200 - Subtle styling
    },
    status: {
      good: '#16A34A', // Green 600
      warning: '#D97706', // Amber 600
      error: '#DC2626', // Red 600
      info: '#2563EB', // Blue 600
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
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    (document.documentElement.style as any).colorScheme = theme;
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
