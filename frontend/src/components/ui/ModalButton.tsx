'use client';

import React from 'react';
import { useThemeOptional } from '@/app/m_dashboard/components/context/theme-context';

export type ModalButtonProps = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
};

export type ModalButtonGroupProps = {
  buttons: ModalButtonProps[];
  primaryColor?: string;
};

/**
 * Standard button group for modal footers.
 * Provides consistent styling across all modals with dark/light theme support.
 * 
 * Example:
 * ```tsx
 * <ModalButtonGroup
 *   buttons={[
 *     { label: 'Cancel', onClick: onClose, variant: 'secondary' },
 *     { label: 'Save', onClick: onSave, variant: 'primary' },
 *   ]}
 * />
 * ```
 */
export function ModalButtonGroup({
  buttons,
  primaryColor = '#6C3BFF',
}: ModalButtonGroupProps) {
  return (
    <>
      {buttons.map((btn, idx) => (
        <ModalButton
          key={idx}
          {...btn}
          primaryColor={primaryColor}
        />
      ))}
    </>
  );
}

export function ModalButton({
  label,
  onClick,
  variant = 'secondary',
  disabled = false,
  loading = false,
  primaryColor = '#6C3BFF',
}: ModalButtonProps & { primaryColor?: string }) {
  const themeOptional = useThemeOptional();
  const isLight = (themeOptional?.theme ?? 'dark') === 'light';

  const baseClasses = 'rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50';

  if (variant === 'primary') {
    // Match the modal's signature top-border gradient for light mode so
    // primary modal actions remain visually consistent across the app.
    const defaultLightGradient = 'linear-gradient(90deg, #7C3AED 0%, #F472B6 100%)';

    // Defensive: `primaryColor` may be undefined or an object (theme.accent). Ensure
    // we only operate on strings. Support three cases:
    // 1) a full `linear-gradient(...)` string — use as-is
    // 2) a hex color like `#7C3AED` — build a gradient using it as the left stop
    // 3) anything else or non-string — fall back to the default gradient
    const colorStr = typeof primaryColor === 'string' ? primaryColor.trim() : '';
    let lightGradient = defaultLightGradient;
    if (colorStr.startsWith('linear-gradient')) {
      lightGradient = colorStr;
    } else if (/^#([0-9A-F]{3}){1,2}$/i.test(colorStr)) {
      lightGradient = `linear-gradient(90deg, ${colorStr} 0%, #F472B6 100%)`;
    }

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} shadow-lg`}
        style={{
          background: isLight ? lightGradient : '#FACC15',
          color: isLight ? '#FFFFFF' : '#09002C',
        }}
      >
        {loading ? 'Loading…' : label}
      </button>
    );
  }

  if (variant === 'danger') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} text-white bg-red-500 hover:bg-red-600 shadow-md`}
      >
        {loading ? 'Loading…' : label}
      </button>
    );
  }

  const secondaryStyles = isLight
    ? {
        backgroundColor: 'rgba(103, 2, 191, 0.05)',
        color: '#14034A',
        borderColor: 'rgba(103, 2, 191, 0.1)',
      }
    : {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '#FFFFFF',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} border backdrop-blur-sm hover:bg-opacity-80`}
      style={secondaryStyles}
    >
      {loading ? 'Loading…' : label}
    </button>
  );
}
