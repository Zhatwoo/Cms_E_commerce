// c:\Users\echob\OJT\Cms_E_commerce\frontend\src\app\m_dashboard\theme-context.tsx
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
      primary: '#F3F4F6',
      dark: '#FFFFFF',
      card: '#FFFFFF',
      elevated: '#F9FAFB',
      fog: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#374151',
      muted: '#6B7280',
      subtle: '#9CA3AF',
    },
    border: {
      default: '#E5E7EB',
      faint: '#D1D5DB',
    },
    status: {
      good: '#65A30D',
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
