'use client';

'use client';

/**
 * ============================================================================
 * Sidebar Row Component
 * ============================================================================
 *
 * Purpose of this File:
 * This is a reusable sidebar row component that organizes labeled sections
 * with icon, label, content, and optional action buttons.
 *
 * The component provides:
 * - Icon display
 * - Section label
 * - Main content area
 * - Optional action button area
 * - Theme-aware text colors
 * - Uppercase label formatting
 * - Consistent spacing and layout
 *
 * What this Component Does:
 * - Renders labeled sidebar section
 * - Shows icon and label header
 * - Displays content area
 * - Shows optional action button
 * - Applies theme-specific colors
 * - Provides consistent styling
 * - Supports flexible content
 *
 * Props / Parameters:
 *
 * icon: ReactNode
 * - Icon to display next to label
 *
 * label: string
 * - Section label text
 *
 * children: ReactNode
 * - Main content
 *
 * action?: ReactNode
 * - Optional action button/element
 *
 * theme: 'light' | 'dark'
 * - Current theme
 *
 * ============================================================================
 */

import { type ReactNode } from 'react';

type SidebarRowProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  action?: ReactNode;
  theme: 'light' | 'dark';
};

export function SidebarRow({ icon, label, children, action, theme }: SidebarRowProps) {
  const isDark = theme === 'dark';
  return (
    <div className="flex flex-col gap-1.5 transition-all">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] opacity-40 ${isDark ? 'text-white' : 'text-[#12193A]'}`}>
          <span className="opacity-70">{icon}</span>
          {label}
        </div>
        {action}
      </div>
      <div className="pl-0">
        {children}
      </div>
    </div>
  );
}