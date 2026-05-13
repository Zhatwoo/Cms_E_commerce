'use client';

/**
 * ============================================================================
 * Theme Context
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file provides a global theme context for managing the application's
 * light and dark mode throughout the dashboard, with color palette definitions
 * and theme persistence.
 *
 * The context provides:
 * - Global theme state management (light/dark mode)
 * - Persistent theme selection in local storage
 * - Comprehensive color palette for both themes
 * - Theme colors object with categorized color values
 * - Theme toggle functionality
 *
 * ----------------------------------------------------------------------------
 * What this Context Does:
 * ----------------------------------------------------------------------------
 * - Manages current application theme (light or dark)
 * - Loads saved theme preference from local storage on mount
 * - Persists theme selection across sessions
 * - Provides color palette for current theme
 * - Allows toggling between light and dark modes
 * - Syncs theme with localStorage changes
 * - Provides useTheme hook for easy access
 *
 * ----------------------------------------------------------------------------
 * Props / Parameters (ThemeProvider):
 * ----------------------------------------------------------------------------
 *
 * children: React.ReactNode\n * - React components to be wrapped by the theme provider.\n * - REQUIRED\n *
 * Context Values:\n *
 * theme: 'light' | 'dark'\n * - The currently active theme mode.\n * - Defaults to 'dark'.\n *
 * colors: ThemeColors\n * - Color palette object for the current theme.\n * - Includes background, text, border, accent, and status colors.\n *
 * toggleTheme: () => void\n * - Function to toggle between light and dark modes.\n * - Persists selection to localStorage.\n *
 * setTheme: (theme: 'light' | 'dark') => void\n * - Function to set a specific theme.\n * - Persists selection to localStorage.\n *
 * ----------------------------------------------------------------------------
 * Type Definitions:
 * ----------------------------------------------------------------------------\n *
 * THEMES Object\n * - Contains complete color definitions for both light and dark modes.\n *
 * ThemeColors\n * - Color palette for a specific theme with categories:\n *   - bg: Background colors (primary, dark, card, etc.)\n *   - text: Text colors (primary, secondary, muted)\n *   - border: Border colors (default, faint)\n *   - accent: Accent colors (yellow, purple variants)\n *   - status: Status colors (good, warning, error, info)\n *
 * ThemeContextType\n * - Context type with theme, colors, and setter functions.\n *
 * useThemeOptional\n * - Hook that returns theme context or null if not wrapped.\n *
 * useTheme\n * - Hook that requires theme context (throws if not wrapped).\n *
 * ============================================================================\n */

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'm_dashboard_theme';

/* Reference: Color Palette 1 & 2 – deep indigo/purple, yellow accent, Outfit font */
export const THEMES = {
  dark: {
    bg: {
      primary: '#110248',
      primaryEnd: '#090029',
      dark: '#191E2D',
      card: '#141446',
      elevated: '#141446',
      fog: '#191E2D',
      sidebar: '#0A002D',
      searchBar: '#141446',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8799C0',
      muted: '#8799C0',
      subtle: '#4C597D',
    },
    border: {
      default: '#4C597D',
      faint: '#1F1F51',
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
      primary: '#f5f4ff',
      primaryEnd: '#dadcff',
      dark: '#dadcff',
      card: 'rgba(249, 247, 255, 0.92)',
      elevated: 'rgba(255, 255, 255, 0.38)',
      fog: '#F4F4F7',
      sidebar: 'rgba(255, 255, 255, 0.42)', // Semi-transparent for blur effect
      searchBar: '#F7F7FA',
    },
    text: {
      primary: '#120533',
      secondary: '#4C3F75',
      muted: '#736A99',
      subtle: '#B8B2CF',
    },
    border: {
      default: 'rgba(147, 96, 255, 0.18)',
      faint: 'rgba(147, 96, 255, 0.12)',
    },
    accent: {
      yellow: '#FFCC00',
      yellowBright: '#FFCC00',
      purple: '#6702BF',
      purpleDeep: '#6702BF',
    },
    status: {
      good: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      info: '#9333ea',
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
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const storedTheme = window.sessionStorage.getItem(THEME_STORAGE_KEY)
      || window.localStorage.getItem('builder_theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
      return;
    }

    setTheme('light');
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    (document.documentElement.style as any).colorScheme = theme;

    try {
      window.sessionStorage.setItem(THEME_STORAGE_KEY, theme);
      // Keep builder theme in sync so the design editor reads the correct initial value
      window.localStorage.setItem('builder_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    const styleId = 'view-transition-style';
    if (document.getElementById(styleId)) return;

    // Keep the old snapshot static (visible) as the background.
    // The new snapshot expands over it via clip-path circle animation.
    // This prevents any flash — at all times either old or new is visible.
    const css = `
      ::view-transition-old(root) {
        animation: none;
        mix-blend-mode: normal;
      }
      ::view-transition-new(root) {
        mix-blend-mode: normal;
        animation: none;
      }
      ::view-transition-image-pair(root) {
        isolation: isolate;
      }
    `;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }, []);

  const toggleTheme = useCallback((e?: React.MouseEvent) => {
    const newTheme = theme === "dark" ? "light" : "dark";

    // No event, no API, or reduced motion — skip animation
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

    const transition = (document as any).startViewTransition(() => {
      setTheme(newTheme);
    });

    transition.ready
      .then(() => {
        // New snapshot (the target theme) expands from the click point over the old snapshot.
        // Old snapshot stays fully visible underneath — no flash, no blank frame.
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 600,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
            fill: 'forwards',
          }
        );
      })
      .catch(() => {
        // Transition was skipped or aborted — state is already set, nothing to do
      });
  }, [theme]);

  const value = useMemo(
    () => ({ theme, toggleTheme, colors: THEMES[theme] }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
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
