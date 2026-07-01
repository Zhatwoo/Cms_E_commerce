'use client';

/**
 * ============================================================================
 * Modal Component System
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains a reusable modal/dialog component system used for
 * displaying overlays, dialogs, confirmation windows, forms, alerts,
 * and other focused UI interactions.
 *
 * The system includes:
 * - Main Modal container
 * - ModalCard wrapper
 * - ModalHeader section
 * - ModalBody section
 * - ModalFooter section
 * - ModalActionButton component
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Displays content inside an overlay dialog
 * - Blocks background interaction
 * - Supports animated open/close transitions
 * - Uses React Portals for proper layering
 * - Allows configurable modal sizes
 * - Supports backdrop closing behavior
 * - Provides reusable modal layout sections
 *
 * ----------------------------------------------------------------------------
 * Main Features:
 * ----------------------------------------------------------------------------
 * ✓ Animated modal transitions
 * ✓ Portal rendering
 * ✓ Configurable modal sizes
 * ✓ Backdrop closing support
 * ✓ Disable close support
 * ✓ Reusable layout sections
 * ✓ Theme-aware action buttons
 * ✓ Responsive design
 * ✓ Accessibility support
 *
 * ----------------------------------------------------------------------------
 * Type Definitions:
 * ----------------------------------------------------------------------------
 *
 * ModalSize
 * - Defines modal width sizing.
 *
 * Available values:
 *   'sm'
 *   'md'
 *   'lg'
 *   'xl'
 *   'full'
 *
 * ModalTheme
 * - Defines action button theme mode.
 *
 * Available values:
 *   'light'
 *   'dark'
 *
 * ----------------------------------------------------------------------------
 * Props / Parameters:
 * ----------------------------------------------------------------------------
 *
 * ModalProps
 * ----------------------------------------------------------------------------
 *
 * open: boolean
 * - Controls modal visibility.
 * - REQUIRED
 *
 * onClose: () => void
 * - Function triggered when modal closes.
 * - REQUIRED
 *
 * children: React.ReactNode
 * - Modal content.
 * - REQUIRED
 *
 * closeOnBackdrop?: boolean
 * - Allows closing modal when clicking outside.
 * - Default: true
 *
 * disableClose?: boolean
 * - Completely disables modal closing.
 * - Default: false
 *
 * size?: ModalSize
 * - Controls modal width.
 * - Default: 'md'
 *
 * className?: string
 * - Additional wrapper classes.
 *
 * overlayClassName?: string
 * - Additional overlay classes.
 *
 * panelClassName?: string
 * - Additional modal panel classes.
 *
 * ----------------------------------------------------------------------------
 * ModalCardProps
 * ----------------------------------------------------------------------------
 *
 * children: React.ReactNode
 * className?: string
 * style?: React.CSSProperties
 *
 * ----------------------------------------------------------------------------
 * ModalSectionProps
 * ----------------------------------------------------------------------------
 *
 * Used by:
 * - ModalHeader
 * - ModalBody
 * - ModalFooter
 *
 * children: React.ReactNode
 * className?: string
 * style?: React.CSSProperties
 *
 * ----------------------------------------------------------------------------
 * ModalActionButtonProps
 * ----------------------------------------------------------------------------
 *
 * Extends native HTML button props.
 *
 * Additional Props:
 *
 * theme: ModalTheme
 * - Controls button theme styling.
 *
 * variant?: 'primary' | 'secondary'
 * - Controls button appearance.
 * - Default: 'primary'
 *
 * ----------------------------------------------------------------------------
 * How to Use:
 * ----------------------------------------------------------------------------
 *
 * Basic Example:
 *
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 * >
 *   <ModalCard className="bg-white">
 *     <ModalHeader>
 *       <h2>Delete Item</h2>
 *     </ModalHeader>
 *
 *     <ModalBody>
 *       Are you sure you want to delete this item?
 *     </ModalBody>
 *
 *     <ModalFooter>
 *       <ModalActionButton
 *         theme="light"
 *         variant="secondary"
 *         onClick={() => setIsOpen(false)}
 *       >
 *         Cancel
 *       </ModalActionButton>
 *
 *       <ModalActionButton
 *         theme="light"
 *         variant="primary"
 *         onClick={handleDelete}
 *       >
 *         Confirm
 *       </ModalActionButton>
 *     </ModalFooter>
 *   </ModalCard>
 * </Modal>
 *
 * ----------------------------------------------------------------------------
 * Example Full Width Modal:
 * ----------------------------------------------------------------------------
 *
 * <Modal
 *   open={open}
 *   onClose={closeModal}
 *   size="full"
 * >
 *   <ModalCard className="bg-[#181A59]">
 *     <ModalBody>
 *       Dashboard Content
 *     </ModalBody>
 *   </ModalCard>
 * </Modal>
 *
 * ============================================================================
 */

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
