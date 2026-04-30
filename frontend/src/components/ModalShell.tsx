"use client";

import React, { useEffect } from "react";

type ModalShellProps = {
  isOpen: boolean;
  onClose: () => void;
  /** When true, backdrop click and Escape are ignored — useful while the modal is performing a long-running action. */
  disabled?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /** Override classes for the backdrop wrapper. When provided, replaces the default backdrop styling entirely. Use for custom z-index or background colour. */
  className?: string;
  /** Inline styles for the backdrop wrapper. Use when CSS cannot express the styling through Tailwind alone (e.g. custom `backdrop-filter` values). */
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const DEFAULT_BACKDROP =
  "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm";

/**
 * Backdrop wrapper for modal dialogs. Owns the three concerns that
 * every modal repeats: fixed-inset positioning + flex centering,
 * click-outside-to-close, and Escape-to-close. The card and any
 * enter/exit animations remain owned by the consumer.
 *
 * Children should NOT call stopPropagation themselves — this
 * component already prevents click events on the card from reaching
 * the backdrop.
 */
export function ModalShell({
  isOpen,
  onClose,
  disabled = false,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
  style,
  children,
}: ModalShellProps) {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disabled) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, disabled, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={className ?? DEFAULT_BACKDROP}
      style={style}
      onClick={() => {
        if (closeOnBackdrop && !disabled) onClose();
      }}
    >
      <div onClick={(e) => e.stopPropagation()} className="contents">
        {children}
      </div>
    </div>
  );
}
