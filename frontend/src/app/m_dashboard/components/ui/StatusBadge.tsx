import type { ReactNode } from 'react';
import { useTheme } from '../../components/context/theme-context';

/// Reusable status badge component for displaying project status 
/// with high-end editorial styling and theme-aware contrast.
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
        // Light mode: Vibrant green | Dark mode: Soft emerald glow
        bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
        text: isDark ? 'text-emerald-400' : 'text-emerald-700',
        border: isDark ? 'border-emerald-500/20' : 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Live'
      };
    case 'shared':
      return {
        bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
        text: isDark ? 'text-blue-400' : 'text-blue-700',
        border: isDark ? 'border-blue-500/20' : 'border-blue-200',
        dot: 'bg-blue-500',
        label: 'Shared'
      };
    default:
      return {
        bg: isDark ? 'bg-slate-500/10' : 'bg-slate-100',
        text: isDark ? 'text-slate-400' : 'text-slate-600',
        border: isDark ? 'border-slate-500/20' : 'border-slate-200',
        dot: 'bg-slate-400',
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

  // Editorial typography: small, bold, and slightly wider tracking
  const sizeClasses = size === 'md'
    ? 'px-2.5 py-1 text-[11px]'
    : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`
        inline-flex items-center gap-2 rounded-full font-bold tracking-tight
        transition-all duration-300 select-none border
        ${sizeClasses} ${styles.bg} ${styles.text} ${styles.border}
        shrink-0 whitespace-nowrap
      `}
    >
      {/* Precision Indicator Dot - More "Editorial" than a standard icon */}
      <span className={`relative flex h-1.5 w-1.5 shrink-0`}>
        {/* Pulsing effect for Live status only */}
        {(status === 'live' || status === 'published') && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${styles.dot}`} />
      </span>

      <span className="uppercase tracking-[0.05em]">{displayLabel}</span>
    </span>
  );
}