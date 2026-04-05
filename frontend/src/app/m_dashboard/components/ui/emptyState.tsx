'use client';

import React from 'react';

export type EmptyStateTone = 'light' | 'dark';

export type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

export type EmptyStateProps = {
  badgeText?: string;
  title: string;
  description?: string | null;
  tone?: EmptyStateTone;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  footerNote?: string;
  className?: string;
};

export function EmptyState({
  badgeText,
  title,
  description,
  tone = 'light',
  primaryAction,
  secondaryAction,
  footerNote,
  className = '',
}: EmptyStateProps) {
  const isDark = tone === 'dark';
  const hasActions = !!(primaryAction || secondaryAction);

  return (
    <section className={`w-full max-w-5xl mx-auto py-24 px-4 transition-all duration-700 [font-family:var(--font-outfit),sans-serif] ${className}`}>
      <div 
        className={`
          flex flex-col border-t border-slate-500/10 pt-12 transition-all duration-700
          ${hasActions ? 'md:flex-row md:items-end justify-between gap-12' : 'items-center text-center'}
        `}
      >
        <div className={hasActions ? 'max-w-xl' : 'max-w-2xl'}>
          {badgeText ? (
            <div className={`flex items-center gap-3 mb-8 ${hasActions ? 'justify-start' : 'justify-center'}`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-[#FFCE00]' : 'bg-[#8B5CF6]'}`} />
              <span
                className={`text-[10px] font-black uppercase tracking-[0.4em] opacity-40 ${isDark ? 'text-white' : 'text-[#120533]'}`}
              >
                {badgeText}
              </span>
            </div>
          ) : null}

          <h3 className={`text-5xl sm:text-6xl font-black tracking-tighter leading-[0.85] mb-8 ${isDark ? 'text-white' : 'text-[#120533]'}`}>
            {title}
          </h3>

          {description ? (
            <p className={`text-sm font-medium leading-relaxed opacity-50 mx-auto ${hasActions ? 'max-w-sm ml-0' : 'max-w-md'} ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {description}
            </p>
          ) : null}
        </div>

        {hasActions ? (
          <div className="flex flex-col items-start md:items-end gap-6 mt-12 md:mt-0">
            {primaryAction ? (
              <button
                type="button"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className={`
                  cursor-pointer relative px-10 h-16 rounded-3xl text-xs font-black uppercase tracking-[0.3em] transition-all duration-500
                  active:scale-95 disabled:opacity-40
                  ${isDark
                    ? 'bg-[#FFCE00] text-[#121241] shadow-[0_15px_40px_rgba(255,206,0,0.15)] hover:shadow-[0_22px_56px_rgba(255,206,0,0.35)]'
                    : 'bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white shadow-[0_8px_24px_rgba(217,70,239,0.4)] hover:shadow-[0_12px_28px_rgba(217,70,239,0.5)]'
                  }
                `}
              >
                {primaryAction.label}
              </button>
            ) : null}

            {secondaryAction ? (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
                className={`
                  px-8 py-4 border rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all
                  ${isDark
                    ? 'border-white/10 text-white hover:bg-white/5'
                    : 'border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm'
                  }
                  ${secondaryAction.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                {secondaryAction.label}
              </button>
            ) : null}

            {footerNote ? (
              <span className="text-[9px] font-black uppercase tracking-widest opacity-30 animate-pulse">
                {footerNote}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-20 w-full h-px bg-gradient-to-r from-transparent via-slate-500/10 to-transparent" />
    </section>
  );
}