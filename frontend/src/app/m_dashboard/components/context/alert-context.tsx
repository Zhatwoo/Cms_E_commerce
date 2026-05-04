'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useThemeOptional } from './theme-context';
import { THEMES } from './theme-context';

export type AlertTone = 'success' | 'error' | 'warning' | 'info';

type AlertState = {
  open: true;
  message: string;
  title?: string;
  tone: AlertTone;
  variant: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  resolve: (value: boolean) => void;
} | {
  open: false;
  message: string;
  title?: string;
  tone: AlertTone;
  variant: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  resolve?: (value: boolean) => void;
};

type ConfirmOptions = {
  confirmText?: string;
  cancelText?: string;
  tone?: AlertTone;
};

type AlertContextType = {
  showAlert: (message: string, title?: string, tone?: AlertTone) => void;
  showConfirm: (message: string, title?: string, options?: ConfirmOptions) => Promise<boolean>;
};

// Heuristic so existing callers that use titles like "Error", "Verified", "Removed"
// pick up the right colour without needing to pass an explicit tone.
function inferTone(title?: string, message?: string): AlertTone {
  const haystack = `${title ?? ''} ${message ?? ''}`.toLowerCase();
  if (/(error|fail|cannot|unable|invalid)/.test(haystack)) return 'error';
  if (/(warn|caution|careful|are you sure)/.test(haystack)) return 'warning';
  if (/(success|added|verified|saved|published|removed|taken down|applied|completed|ok\b)/.test(haystack)) return 'success';
  return 'info';
}

const TONE_STYLES: Record<AlertTone, { icon: React.ComponentType<{ size?: number; className?: string }>; iconColor: string; iconBg: string; button: string }> = {
  success: {
    icon: CheckCircle2,
    iconColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.12)',
    button: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  },
  error: {
    icon: AlertCircle,
    iconColor: '#EF4444',
    iconBg: 'rgba(239,68,68,0.12)',
    button: 'bg-red-500 hover:bg-red-600 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    button: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  info: {
    icon: Info,
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.12)',
    button: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

function getColors(): typeof THEMES.dark {
  if (typeof document === 'undefined') return THEMES.dark;
  return document.documentElement.classList.contains('light') ? THEMES.light : THEMES.dark;
}

function AlertModalBackdrop({
  state,
  colors,
  onClose,
  onConfirm,
}: {
  state: AlertState;
  colors: typeof THEMES.dark;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!state.open) return null;

  const toneStyle = TONE_STYLES[state.tone];
  const Icon = toneStyle.icon;

  return (
    <div
      className="fixed inset-0 z-[2147483000] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: colors.bg.card,
          borderColor: colors.border.default,
        }}
      >
        <div className="h-1 w-full" style={{ backgroundColor: toneStyle.iconColor }} />
        <div className="p-6 flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: toneStyle.iconBg, color: toneStyle.iconColor }}
            aria-hidden
          >
            <Icon size={24} />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            {state.title && (
              <h3 className="text-base font-semibold mb-1.5" style={{ color: colors.text.primary }}>
                {state.title}
              </h3>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: colors.text.secondary }}>
              {state.message}
            </p>
          </div>
        </div>
        <div
          className="px-6 py-4 flex justify-end gap-3 border-t"
          style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}
        >
          {state.variant === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: colors.text.primary }}
              >
                {state.cancelText ?? 'No'}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${toneStyle.button}`}
              >
                {state.confirmText ?? 'Yes'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${toneStyle.button}`}
            >
              OK
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const themeOptional = useThemeOptional();
  const [fallbackColors, setFallbackColors] = useState<typeof THEMES.dark>(THEMES.dark);
  useEffect(() => {
    setFallbackColors(getColors());
  }, []);
  const colors = themeOptional?.colors ?? fallbackColors;
  const [state, setState] = useState<AlertState>({ open: false, message: '', variant: 'alert', tone: 'info' });

  const showAlert = useCallback((message: string, title?: string, tone?: AlertTone) => {
    return new Promise<void>((resolve) => {
      setState({
        open: true,
        message,
        title,
        tone: tone ?? inferTone(title, message),
        variant: 'alert',
        resolve: () => {
          setState((s) => ({ ...s, open: false }));
          resolve();
        },
      });
    });
  }, []);

  const showConfirm = useCallback((message: string, title?: string, options?: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        message,
        title,
        tone: options?.tone ?? inferTone(title, message),
        variant: 'confirm',
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        resolve: (value: boolean) => {
          setState((s) => ({ ...s, open: false }));
          resolve(value);
        },
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    if (state.open && state.resolve) {
      state.resolve(state.variant === 'confirm' ? false : true);
    }
    setState((s) => ({ ...s, open: false }));
  }, [state.open, state.variant, state.resolve]);

  const handleConfirm = useCallback(() => {
    if (state.open && state.resolve) {
      state.resolve(true);
    }
    setState((s) => ({ ...s, open: false }));
  }, [state.open, state.resolve]);

  const value: AlertContextType = { showAlert, showConfirm };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {state.open && (
              <AlertModalBackdrop
                state={state}
                colors={colors}
                onClose={handleClose}
                onConfirm={handleConfirm}
              />
            )}
          </AnimatePresence>,
          document.body
        )}
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextType {
  const ctx = useContext(AlertContext);
  if (ctx === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return ctx;
}
