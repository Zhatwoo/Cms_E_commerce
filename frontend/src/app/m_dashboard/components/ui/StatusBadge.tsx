import type { ReactNode } from 'react';
import { useTheme } from '../../components/context/theme-context';

/**
 * ============================================================================
 * StatusBadge Component
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains a reusable StatusBadge component used to visually display
 * project statuses throughout the dashboard or management system.
 *
 * The component provides:
 * - Consistent status styling
 * - Theme-aware appearance
 * - Animated live indicators
 * - Reusable UI for project states
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Displays project status labels
 * - Applies color-coded visual states
 * - Supports dark and light themes
 * - Shows animated live/published indicators
 * - Handles dynamic status normalization
 * - Provides reusable badge styling
 *
 * ----------------------------------------------------------------------------
 * Supported Statuses:
 * ----------------------------------------------------------------------------
 *
 * published
 * - Green success styling
 * - Animated pulse indicator
 *
 * live
 * - Same styling behavior as published
 * - Animated pulse indicator
 *
 * shared
 * - Blue informational styling
 *
 * draft
 * - Amber/yellow warning styling
 *
 * Unknown statuses
 * - Automatically fallback to Draft styling
 *
 * ----------------------------------------------------------------------------
 * Type Definitions:
 * ----------------------------------------------------------------------------
 *
 * ProjectStatus
 * ----------------------------------------------------------------------------
 * Defines all supported project statuses.
 *
 * Supported values:
 * - 'published'
 * - 'live'
 * - 'draft'
 * - 'shared'
 *
 * Also accepts:
 * - Any string value
 *
 * ----------------------------------------------------------------------------
 * StatusBadgeProps
 * ----------------------------------------------------------------------------
 *
 * status: ProjectStatus | null | undefined
 * ----------------------------------------------------------------------------
 * Current project status.
 *
 * Determines:
 * - Badge color
 * - Glow effect
 * - Label
 * - Pulse animation
 *
 * REQUIRED
 *
 * ----------------------------------------------------------------------------
 * label?: string
 * ----------------------------------------------------------------------------
 * Optional custom label override.
 *
 * If provided:
 * - Replaces default status text
 *
 * Example:
 * - "ACTIVE"
 * - "IN REVIEW"
 *
 * ----------------------------------------------------------------------------
 * size?: 'sm' | 'md'
 * ----------------------------------------------------------------------------
 * Controls badge padding and typography scale.
 *
 * Available values:
 * - 'sm'
 * - 'md'
 *
 * Default:
 * - 'sm'
 *
 * ----------------------------------------------------------------------------
 * Internal Helper:
 * ----------------------------------------------------------------------------
 *
 * getStatusStyles()
 * ----------------------------------------------------------------------------
 * Internal utility function responsible for:
 * - Resolving status styles
 * - Applying theme-aware colors
 * - Returning visual tokens
 *
 * Returns:
 * - glow
 * - text color
 * - border color
 * - dot color
 * - default label
 *
 * ----------------------------------------------------------------------------
 * How to Use:
 * ----------------------------------------------------------------------------
 *
 * Basic Example:
 *
 * <StatusBadge status="published" />
 *
 * ----------------------------------------------------------------------------
 * Example with Custom Label:
 * ----------------------------------------------------------------------------
 *
 * <StatusBadge
 *   status="shared"
 *   label="TEAM SHARED"
 * />
 *
 * ----------------------------------------------------------------------------
 * Example with Medium Size:
 * ----------------------------------------------------------------------------
 *
 * <StatusBadge
 *   status="draft"
 *   size="md"
 * />
 *
 * ----------------------------------------------------------------------------
 * Example Inside a Project Card:
 * ----------------------------------------------------------------------------
 *
 * <div className="flex items-center justify-between">
 *   <h2>Inventory Dashboard</h2>
 *
 *   <StatusBadge
 *     status={project.status}
 *   />
 * </div>
 *
 */

export type ProjectStatus = 'published' | 'live' | 'draft' | 'shared' | string;

interface StatusBadgeProps {
  status: ProjectStatus | null | undefined;
  label?: string;
  size?: 'sm' | 'md';
}

/**
 * Internal helper to define visual tokens based on status and active theme.
 */
function getStatusStyles(status: ProjectStatus | null | undefined, isDark: boolean) {
  const normalizedStatus = String(status || '').trim().toLowerCase();

  switch (normalizedStatus) {
    case 'published':
    case 'live':
      return {
        glow: 'bg-emerald-500/40',
        text: isDark ? 'text-emerald-400' : 'text-emerald-600',
        border: isDark ? 'border-emerald-500/50' : 'border-emerald-400/60',
        dot: 'bg-emerald-500',
        label: 'Published'
      };
    case 'shared':
      return {
        glow: 'bg-blue-500/40',
        text: isDark ? 'text-blue-400' : 'text-blue-600',
        border: isDark ? 'border-blue-500/50' : 'border-blue-400/60',
        dot: 'bg-blue-500',
        label: 'Shared'
      };
    default:
      return {
        glow: 'bg-amber-500/40',
        text: isDark ? 'text-amber-400' : 'text-amber-600',
        border: isDark ? 'border-amber-500/50' : 'border-amber-400/60',
        dot: 'bg-amber-500',
        label: 'Draft'
      };
  }
}

export function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  if (!status) return null;

  const styles = getStatusStyles(status, isDark);
  const displayLabel = label || styles.label;

  const sizeClasses = size === 'md'
    ? 'px-3.5 py-1.5 text-[10px]'
    : 'px-2.5 py-1 text-[9px]';

  return (
    <div className="relative group/badge">
      {/* 1. THE REINFORCEMENT: A localized shadow that creates contrast on light images */}
      <div className="absolute inset-0 bg-black/40 blur-xl rounded-full -z-20 opacity-0 group-hover/badge:opacity-100 transition-opacity" />

      {/* 2. THE GLOW: The status-specific aura */}
      <div className={`absolute -inset-1 blur-lg rounded-full -z-10 opacity-20 ${styles.glow}`} />

      <span
        className={`
          inline-flex items-center gap-2 rounded-full font-black tracking-[0.2em]
          transition-all duration-500 select-none uppercase border-2
          backdrop-blur-2xl shadow-2xl
          ${sizeClasses}
          ${isDark
            ? `bg-[#0A0A26]/80 ${styles.text} ${styles.border}`
            : `bg-white/90 ${styles.text} ${styles.border}`
          }
          shrink-0 whitespace-nowrap
        `}
      >
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {(status === 'live' || status === 'published') && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${styles.dot}`} />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${styles.dot}`} />
        </span>

        <span className="leading-none">{displayLabel}</span>
      </span>
    </div>
  );
}