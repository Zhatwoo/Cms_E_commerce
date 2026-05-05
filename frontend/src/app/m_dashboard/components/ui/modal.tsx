'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  disableClose?: boolean;
  size?: ModalSize;
  className?: string;
  overlayClassName?: string;
  panelClassName?: string;
};

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-5xl',
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

type ModalTheme = 'light' | 'dark';

type ModalCardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

type ModalSectionProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

type ModalActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  theme: ModalTheme;
  variant?: 'primary' | 'secondary';
};

export function ModalCard({ children, className, style }: ModalCardProps) {
  return (
    <div className={joinClasses('rounded-4xl overflow-hidden border', className)} style={style}>
      {children}
    </div>
  );
}

export function ModalHeader({ children, className, style }: ModalSectionProps) {
  return (
    <div className={joinClasses('px-8 pt-8 pb-6 border-b', className)} style={style}>
      {children}
    </div>
  );
}

export function ModalBody({ children, className, style }: ModalSectionProps) {
  return (
    <div className={joinClasses('p-8', className)} style={style}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className, style }: ModalSectionProps) {
  return (
    <div className={joinClasses('px-6 py-4 border-t flex justify-end gap-3', className)} style={style}>
      {children}
    </div>
  );
}

export function ModalActionButton({
  theme,
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ModalActionButtonProps) {
  const variantClass =
    variant === 'secondary'
      ? (theme === 'dark'
        ? 'text-[#8A8FC4] hover:bg-white/5'
        : 'text-slate-500 hover:text-slate-800')
      : (theme === 'dark'
        ? 'bg-[#FFCE00] text-[#121241] hover:bg-[#FFD740] shadow-[0_15px_40px_rgba(255,206,0,0.15)] hover:shadow-[0_22px_56px_rgba(255,206,0,0.35)]'
        : 'bg-linear-to-r from-[#9333ea] to-[#ec4899] text-white shadow-[0_8px_24px_rgba(217,70,239,0.4)] hover:shadow-[0_12px_28px_rgba(217,70,239,0.5)]');

  const baseClass =
    variant === 'secondary'
      ? 'px-5 h-11 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed'
      : 'px-8 h-11 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      type={type}
      className={joinClasses('cursor-pointer inline-flex items-center justify-center', baseClass, variantClass, className)}
      {...props}
    />
  );
}

export function Modal({
  open,
  onClose,
  children,
  closeOnBackdrop = true,
  disableClose = false,
  size = 'md',
  className,
  overlayClassName,
  panelClassName,
}: ModalProps) {
  if (typeof document === 'undefined') return null;

  const canClose = !disableClose;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className={joinClasses(
            'fixed inset-0 flex items-center justify-center bg-black/70 p-4',
            overlayClassName
          )}
          style={{ zIndex: 2147483000 }}
          onClick={() => {
            if (canClose && closeOnBackdrop) onClose();
          }}
          role="presentation"
        >
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32, mass: 0.75 }}
            className={joinClasses('w-full [font-family:var(--font-outfit),sans-serif]', SIZE_CLASS[size], panelClassName, className)}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
