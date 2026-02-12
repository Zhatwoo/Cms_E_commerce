'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeOptional } from './theme-context';
import { THEMES } from './theme-context';

type AlertState = {
  open: true;
  message: string;
  title?: string;
  variant: 'alert' | 'confirm';
  resolve: (value: boolean) => void;
} | { open: false; message: string; title?: string; variant: 'alert' | 'confirm'; resolve?: (value: boolean) => void };

type AlertContextType = {
  showAlert: (message: string, title?: string) => void;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: colors.bg.card,
          borderColor: colors.border.default,
        }}
      >
        <div className="p-6">
          {state.title && (
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              {state.title}
            </h3>
          )}
          <p
            className="text-sm whitespace-pre-wrap"
            style={{ color: colors.text.secondary }}
          >
            {state.message}
          </p>
        </div>
        <div
          className="px-6 py-4 flex justify-end gap-3 border-t"
          style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}
        >
          {state.variant === 'confirm' && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: colors.text.primary }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={state.variant === 'confirm' ? onConfirm : onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{
              backgroundColor: state.variant === 'confirm' ? colors.status.error : colors.status.info,
            }}
          >
            OK
          </button>
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
  const [state, setState] = useState<AlertState>({ open: false, message: '', variant: 'alert' });

  const showAlert = useCallback((message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      setState({
        open: true,
        message,
        title,
        variant: 'alert',
        resolve: () => {
          setState((s) => ({ ...s, open: false }));
          resolve();
        },
      });
    });
  }, []);

  const showConfirm = useCallback((message: string, title?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        message,
        title,
        variant: 'confirm',
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
