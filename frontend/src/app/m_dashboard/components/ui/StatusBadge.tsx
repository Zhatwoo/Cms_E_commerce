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
        bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
        text: isDark ? 'text-emerald-400' : 'text-emerald-700',
        border: isDark ? 'border-emerald-500/20' : 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Published' 
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
        bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
        text: isDark ? 'text-amber-500' : 'text-amber-700',
        border: isDark ? 'border-amber-500/20' : 'border-amber-200',
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