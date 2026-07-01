'use client';

/**
 * ============================================================================
 * FeedbackMessage Component
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains a reusable feedback/notification component system
 * used for displaying:
 *
 * - Success messages
 * - Error alerts
 * - Warning notifications
 * - Informational messages
 *
 * The component supports two display variants:
 * - Toast notifications
 * - Modal dialogs
 *
 * It also supports:
 * - Auto-dismiss behavior
 * - Theme-aware styling
 * - Animated transitions
 * - Portal rendering
 * - Custom footer actions
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Displays feedback messages to the user
 * - Shows contextual icons depending on message tone
 * - Automatically closes toast notifications after a delay
 * - Renders notifications above all UI layers using portals
 * - Supports both modal and toast layouts
 * - Adapts to dark/light theme automatically
 * - Prevents background interaction in modal mode
 *
 * ----------------------------------------------------------------------------
 * Feedback Tones:
 * ----------------------------------------------------------------------------
 *
 * success
 * - Green styling
 * - Used for completed actions
 *
 * error
 * - Red styling
 * - Used for failed actions/errors
 *
 * warning
 * - Orange styling
 * - Used for risky actions or warnings
 *
 * info
 * - Blue styling
 * - Used for informational notices
 *
 * ----------------------------------------------------------------------------
 * Type Definitions:
 * ----------------------------------------------------------------------------
 *
 * FeedbackTone
 * - Determines feedback style and icon.
 *
 * Available values:
 *   'success'
 *   'error'
 *   'warning'
 *   'info'
 *
 * ThemeMode
 * - Internal helper type for theme tracking.
 *
 * Available values:
 *   'light'
 *   'dark'
 *
 * ----------------------------------------------------------------------------
 * Props / Parameters:
 * ----------------------------------------------------------------------------
 *
 * open: boolean
 * - Controls component visibility.
 * - REQUIRED
 *
 * message: string
 * - Main feedback message text.
 * - REQUIRED
 *
 * tone: FeedbackTone
 * - Determines icon and color styling.
 * - REQUIRED
 *
 * title?: string
 * - Optional message heading/title.
 *
 * variant?: 'toast' | 'modal'
 * - Determines feedback layout type.
 * - Default: 'toast'
 *
 * onClose?: () => void
 * - Callback triggered when message closes.
 *
 * onBackdropClick?: () => void
 * - Custom handler when clicking modal backdrop.
 *
 * footer?: React.ReactNode
 * - Optional custom modal footer content.
 *
 * autoCloseMs?: number
 * - Custom toast auto-dismiss duration in milliseconds.
 *
 * ----------------------------------------------------------------------------
 * Default Auto-Close Durations:
 * ----------------------------------------------------------------------------
 *
 * success -> 1800ms
 * error   -> 3000ms
 * warning -> 2600ms
 * info    -> 2200ms
 *
 * ----------------------------------------------------------------------------
 * How to Use:
 * ----------------------------------------------------------------------------
 *
 * Basic Toast Example:
 *
 * <FeedbackMessage
 *   open={showToast}
 *   message="Product created successfully."
 *   tone="success"
 *   onClose={() => setShowToast(false)}
 * />
 *
 * ----------------------------------------------------------------------------
 * Modal Example:
 * ----------------------------------------------------------------------------
 *
 * <FeedbackMessage
 *   open={showModal}
 *   variant="modal"
 *   title="Delete Confirmation"
 *   message="Are you sure you want to delete this item?"
 *   tone="warning"
 *   onClose={() => setShowModal(false)}
 * />
 *
 * ----------------------------------------------------------------------------
 * Example with Custom Footer:
 * ----------------------------------------------------------------------------
 *
 * <FeedbackMessage
 *   open={showError}
 *   variant="modal"
 *   title="Upload Failed"
 *   message="Something went wrong during upload."
 *   tone="error"
 *   footer={
 *     <div className="flex gap-2">
 *       <button onClick={retryUpload}>Retry</button>
 *       <button onClick={() => setShowError(false)}>Cancel</button>
 *     </div>
 *   }
 * />
 *
 * ============================================================================
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useThemeOptional } from '../context/theme-context';
import { ModalCard } from '@/components/ui/ModalCard';
import { ModalButton } from '@/components/ui/ModalButton';

export type FeedbackTone = 'success' | 'error' | 'warning' | 'info';

type FeedbackMessageProps = {
  open: boolean;
  message: string;
  tone: FeedbackTone;
  title?: string;
  variant?: 'toast' | 'modal';
  onClose?: () => void;
  onBackdropClick?: () => void;
  footer?: React.ReactNode;
  autoCloseMs?: number;
};

type ThemeMode = 'light' | 'dark';

function getDocumentTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

const TONE_META: Record<FeedbackTone, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  iconBg: string;
  bannerBorder: string;
}> = {
  success: {
    icon: CheckCircle2,
    iconColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.12)',
    bannerBorder: 'rgba(16,185,129,0.2)',
  },
  error: {
    icon: AlertCircle,
    iconColor: '#EF4444',
    iconBg: 'rgba(239,68,68,0.12)',
    bannerBorder: 'rgba(239,68,68,0.2)',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    bannerBorder: 'rgba(245,158,11,0.2)',
  },
  info: {
    icon: Info,
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.12)',
    bannerBorder: 'rgba(59,130,246,0.2)',
  },
};

function FeedbackCard({
  open,
  message,
  title,
  tone,
  variant = 'toast',
  onClose,
  onBackdropClick,
  footer,
  autoCloseMs,
}: FeedbackMessageProps) {
  const closeTimerRef = useRef<number | null>(null);
  const themeOptional = useThemeOptional();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getDocumentTheme());
  const toneMeta = TONE_META[tone];
  const Icon = toneMeta.icon;
  const isLight = themeMode === 'light';
  const resolvedAutoCloseMs = autoCloseMs ?? (tone === 'success' ? 1800 : tone === 'error' ? 3000 : tone === 'warning' ? 2600 : 2200);

  useEffect(() => {
    if (themeOptional?.theme) {
      setThemeMode(themeOptional.theme);
    }
  }, [themeOptional?.theme]);

  useEffect(() => {
    if (themeOptional?.theme || typeof document === 'undefined') return;
    const root = document.documentElement;
    const syncTheme = () => setThemeMode(getDocumentTheme());
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [themeOptional?.theme]);

  const toastCardStyles = isLight
    ? {
        borderColor: 'rgba(103,2,191,0.18)',
        backgroundColor: 'rgba(255,255,255,0.98)',
        boxShadow: '0 18px 45px rgba(17, 2, 72, 0.18)',
      }
    : {
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#16193D',
        boxShadow: '0 18px 45px rgba(0,0,0,0.42)',
      };

  const modalSurfaceStyles = isLight
    ? {
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderColor: 'rgba(103,2,191,0.15)',
        boxShadow: '0 20px 60px rgba(18, 5, 51, 0.22)',
      }
    : {
        backgroundColor: '#181A59',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
      };

  const footerSurfaceStyles = isLight
    ? {
        borderColor: 'rgba(103,2,191,0.12)',
        backgroundColor: 'rgba(103,2,191,0.03)',
      }
    : {
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
      };

  useEffect(() => {
    if (variant !== 'toast' || !open || !onClose) return;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      onClose();
      closeTimerRef.current = null;
    }, resolvedAutoCloseMs);
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [onClose, open, resolvedAutoCloseMs, variant]);

  if (!open) return null;

  if (variant === 'toast') {
    const toast = (
      <div className="fixed right-4 top-4 z-9999999999 w-[min(92vw,22rem)]">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="overflow-hidden rounded-2xl border shadow-2xl"
            style={{ zIndex: 9999999999, fontFamily: 'Outfit, sans-serif', ...toastCardStyles }}
          >
            <div className="h-1 w-full" style={{ backgroundColor: toneMeta.iconColor }} />
            <div className="flex items-center gap-3 px-4 py-4">
              <div
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: toneMeta.iconBg, color: toneMeta.iconColor }}
              >
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                {title && (
                  <p
                    className="mb-1 text-[10px] font-black uppercase tracking-[0.24em]"
                    style={{ color: isLight ? 'rgba(18,5,51,0.55)' : 'rgba(255,255,255,0.55)' }}
                  >
                    {title}
                  </p>
                )}
                <p
                  className="text-sm font-semibold leading-relaxed"
                  style={{ color: isLight ? '#120533' : '#FFFFFF' }}
                >
                  {message}
                </p>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-1 rounded-full px-2 py-1 text-xs font-semibold opacity-75 transition hover:opacity-100"
                  style={{ color: isLight ? '#120533' : '#FFFFFF' }}
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );

    return typeof document !== 'undefined' ? createPortal(toast, document.body) : toast;
  }

  const modal = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-9999999999 flex items-center justify-center p-4"
        style={{
          zIndex: 9999999999,
          backgroundColor: isLight ? 'rgba(15,23,42,0.18)' : 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onBackdropClick ?? onClose}
      >
        <motion.div onClick={(event) => event.stopPropagation()}>
          <ModalCard
            title={title ?? 'Message'}
            subtitle="Review this action before continuing"
            footer={footer ?? (onClose ? (
              <ModalButton
                label="OK"
                onClick={onClose}
                variant="primary"
              />
            ) : undefined)}
          >
            <div className="flex items-center gap-4 text-left">
              <div
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: toneMeta.iconBg, color: toneMeta.iconColor }}
              >
                <Icon size={24} />
              </div>
              <p
                className="whitespace-pre-wrap text-base leading-relaxed"
                style={{ color: isLight ? 'rgba(18,5,51,0.78)' : 'rgba(255,255,255,0.8)' }}
              >
                {message}
              </p>
            </div>
          </ModalCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}

export function FeedbackMessage(props: FeedbackMessageProps) {
  return <FeedbackCard {...props} />;
}