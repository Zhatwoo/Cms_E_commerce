'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useThemeOptional } from './theme-context';
import { THEMES } from './theme-context';
import { FeedbackMessage, type FeedbackTone } from '../ui/feedbackMessage';
import { ModalButton } from '@/components/ui/ModalButton';

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

const AlertContext = createContext<AlertContextType | undefined>(undefined);

function getColors(): typeof THEMES.dark {
  if (typeof document === 'undefined') return THEMES.dark;
  return document.documentElement.classList.contains('light') ? THEMES.light : THEMES.dark;
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
        tone: options?.tone ?? 'warning',
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

  const footer = state.variant === 'confirm' ? (
    <>
      <ModalButton label={state.cancelText ?? 'No'} onClick={handleClose} variant="secondary" />
      <ModalButton label={state.confirmText ?? 'Yes'} onClick={handleConfirm} variant="primary" />
    </>
  ) : undefined;

  return (
    <AlertContext.Provider value={value}>
      {children}
      <FeedbackMessage
        open={state.open}
        tone={state.tone as FeedbackTone}
        title={state.title}
        message={state.message}
        variant={state.variant === 'confirm' ? 'modal' : 'toast'}
        onClose={handleClose}
        onBackdropClick={handleClose}
        footer={footer}
      />
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
