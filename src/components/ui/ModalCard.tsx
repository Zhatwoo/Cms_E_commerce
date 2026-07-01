'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useThemeOptional } from '@/app/m_dashboard/components/context/theme-context';

export type ModalCardProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
};

/**
 * Unified modal card design based on FeedbackMessage.
 * Provides consistent dark/light theme styling, Outfit font, animations,
 * and a structured layout for all modals in the application.
 * 
 * Should be used inside ModalShell for the backdrop.
 * 
 * Example:
 * ```tsx
 * <ModalShell isOpen={open} onClose={onClose}>
 *   <ModalCard
 *     footer={
 *       <>
 *         <button onClick={onCancel}>Cancel</button>
 *         <button onClick={onSave}>Save</button>
 *       </>
 *     }
 *   >
 *     <h2>Modal Title</h2>
 *     <p>Modal content here</p>
 *   </ModalCard>
 * </ModalShell>
 * ```
 */
export function ModalCard({
  children,
  footer,
  title,
  subtitle,
  className = '',
}: ModalCardProps) {
  const themeOptional = useThemeOptional();
  const isLight = (themeOptional?.theme ?? 'dark') === 'light';

  // Keep the gradient in light mode; use a solid yellow accent in dark mode.
  const topBorderStyle = isLight
    ? { background: 'linear-gradient(90deg, #7C3AED 0%, #F472B6 100%)' }
    : { background: '#FACC15' };
  
  const surfaceStyles = isLight
    ? {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(103, 2, 191, 0.1)',
        boxShadow: '0 40px 80px -20px rgba(20, 3, 74, 0.15)',
      }
    : {
        backgroundColor: '#09002C', // Signature Deep Navy
        borderColor: 'rgba(124, 58, 237, 0.15)',
        boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.8)',
      };

  const headerBg = isLight ? 'rgba(124, 58, 237, 0.02)' : 'rgba(255, 255, 255, 0.02)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 15 }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      className={`relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border ${className}`}
      style={{ fontFamily: 'Outfit, sans-serif', ...surfaceStyles }}
    >
      {/* 4px Signature Top Border */}
      <div className="h-1 w-full shrink-0" style={topBorderStyle} />

      {/* Structured Header Section */}
      <div 
        className="px-10 pb-6 pt-10 border-b" 
        style={{ 
          backgroundColor: headerBg,
          borderColor: isLight ? 'rgba(103, 2, 191, 0.05)' : 'rgba(255, 255, 255, 0.05)' 
        }}
      >
        <div className="flex flex-col gap-1">
          <h2 
            className="text-3xl font-black tracking-tighter leading-tight" 
            style={{ color: isLight ? '#14034A' : '#FFFFFF' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p 
              className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" 
              style={{ color: isLight ? '#14034A' : '#FFFFFF' }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Dense Content Area */}
      <div 
        className="px-10 py-8" 
        style={{ color: isLight ? '#120533' : '#FFFFFF' }}
      >
        {children}
      </div>

      {/* Professional Structural Footer */}
      {footer && (
        <div
          className="flex justify-end gap-4 border-t px-10 py-6"
          style={{ 
            backgroundColor: headerBg,
            borderColor: isLight ? 'rgba(103, 2, 191, 0.08)' : 'rgba(255, 255, 255, 0.06)' 
          }}
        >
          {footer}
        </div>
      )}
    </motion.div>
  );
}