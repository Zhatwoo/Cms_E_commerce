'use client';

/**
 * ============================================================================
 * View Mode Toggle Component
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains a toggle component for switching between list and grid
 * view modes in the dashboard projects display.
 *
 * The component provides:
 * - Theme-aware styling for light and dark modes
 * - Smooth animated transitions between modes
 * - Visual feedback with gradient highlights in light mode
 * - Glowing yellow highlight in dark mode
 * - Accessible toggle interaction
 * - Icon-based mode representation
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Renders a toggle rail with list and grid view options
 * - Displays animated selection indicator
 * - Calls onChange callback when view mode is toggled
 * - Adapts colors based on light/dark theme
 * - Shows smooth animations for mode switching
 * - Provides distinct visual styling per theme
 *
 * ----------------------------------------------------------------------------
 * Props / Parameters:
 * ----------------------------------------------------------------------------
 *
 * value: ViewMode
 * - The currently selected view mode.
 * - Values: 'list' | 'grid'
 * - REQUIRED
 *
 * onChange: (value: ViewMode) => void
 * - Callback triggered when view mode changes.
 * - Returns the new selected view mode.
 * - REQUIRED
 *
 * theme: 'light' | 'dark'
 * - The current application theme.
 * - Determines button and background colors.
 * - REQUIRED
 *
 * className?: string
 * - Optional additional Tailwind classes for styling.
 * - Default: empty string
 *
 * ----------------------------------------------------------------------------
 * Type Definitions:
 * ----------------------------------------------------------------------------
 *
 * ViewMode
 * - Union type for view modes.
 * - Values: 'list' | 'grid'
 *
 * ViewModeToggleProps
 * - Props interface for the component
 *
 * ----------------------------------------------------------------------------
 * How to Use:
 * ----------------------------------------------------------------------------
 *
 * Example Usage:
 *
 * const [viewMode, setViewMode] = useState<ViewMode>('grid');
 *
 * <ViewModeToggle
 *   value={viewMode}
 *   onChange={setViewMode}
 *   theme="dark"
 * />
 *
 * ============================================================================
 */

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ViewMode = 'list' | 'grid';

type ViewModeToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  theme: 'light' | 'dark';
  className?: string;
};

export function ViewModeToggle({ value, onChange, theme, className = '' }: ViewModeToggleProps) {
  const isDark = theme === 'dark';

  // --- Exact Color Imitation from Screenshots ---

  // 1. Light Mode Active: Pink-to-Purple Gradient
  const lightGradient = 'linear-gradient(135deg, #BD34FE 0%, #F13797 100%)';

  // 2. Dark Mode Active: Glowing Yellow
  const darkYellow = '#FFCE00';

  // Container Styles
  const railBg = isDark ? 'rgba(20, 20, 70, 0.4)' : '#FFFFFF';
  const railBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const railShadow = isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.04)';

  const modes: { id: ViewMode; icon: ReactNode }[] = [
    {
      id: 'list',
      icon: (
        <svg className="h-4 w-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path d="M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'grid',
      icon: (
        <svg className="h-4 w-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={`relative flex items-center p-1.5 rounded-[1.2rem] border transition-all duration-500 ${railShadow} ${className}`}
      style={{ backgroundColor: railBg, borderColor: railBorder }}
    >
      {modes.map((mode) => {
        const isActive = value === mode.id;

        // Dynamic Icon Color
        let iconColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
        if (isActive) {
          iconColor = isDark ? darkYellow : '#FFFFFF';
        }

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className="relative h-9 w-12 sm:h-10 sm:w-14 rounded-[0.9rem] inline-flex items-center justify-center transition-colors duration-300 outline-none"
            style={{ color: iconColor }}
          >
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 rounded-[0.8rem]"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  style={{
                    // Light mode uses the purple/pink gradient
                    // Dark mode uses a subtle transparent glow to let the yellow icon pop
                    background: isDark ? 'rgba(255, 206, 0, 0.05)' : lightGradient,
                    boxShadow: isDark
                      ? `0 0 15px rgba(255, 206, 0, 0.1)`
                      : '0 4px 12px rgba(189, 52, 254, 0.2)',
                    border: isDark ? `1px solid rgba(255, 206, 0, 0.15)` : 'none'
                  }}
                />
              )}
            </AnimatePresence>
            {mode.icon}
          </button>
        );
      })}
    </div>
  );
}