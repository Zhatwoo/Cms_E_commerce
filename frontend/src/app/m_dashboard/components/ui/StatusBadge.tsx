import type { ReactNode } from 'react';
import { useTheme } from '../../components/context/theme-context';

/// Reusable status badge component for displaying project status 
/// with consistent styling across the dashboard. Supports 'published', 'live', 'draft', 
// and 'shared' statuses.
///
/// Parameters:
/// - [status]: The raw status string (e.g., 'live', 'draft').
/// - [label]: Optional override for the display text.
/// - [size]: Controls the padding and typography scale.
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