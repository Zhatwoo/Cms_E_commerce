'use client';

/**
 * ============================================================================
 * CustomDropdown Component
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains a reusable custom dropdown/select component designed
 * for category selection or option picking inside the application.
 *
 * The component provides:
 * - Animated dropdown interactions using Framer Motion
 * - Dark mode support through Theme Context
 * - Custom UI styling that matches the application's design system
 * - Click outside detection to automatically close the dropdown
 * - Fully customizable options and labels
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Displays a dropdown trigger button
 * - Shows the currently selected option label
 * - Opens a dropdown panel containing selectable options
 * - Allows users to select an option
 * - Calls the `onChange` callback when an option is selected
 * - Automatically closes when clicking outside the component
 * - Supports light and dark themes
 * - Uses smooth animations for opening/closing interactions
 *
 * ----------------------------------------------------------------------------
 * Props / Parameters:
 * ----------------------------------------------------------------------------
 *
 * value: string
 * - The currently selected option ID.
 * - Used to determine which option is active.
 *
 * onChange: (value: string) => void
 * - Callback function triggered when the user selects an option.
 * - Returns the selected option ID.
 *
 * options: readonly OrderCategoryOption[]
 * - Array of dropdown options.
 * - Each option must contain:
 *    {
 *      id: string;
 *      label: string;
 *    }
 *
 * title?: string
 * - Optional dropdown title/placeholder.
 * - Default value: "Category"
 *
 * className?: string
 * - Optional additional Tailwind classes for styling customization.
 *
 * ----------------------------------------------------------------------------
 * Type Definitions:
 * ----------------------------------------------------------------------------
 *
 * OrderCategoryOption
 * - Represents a single dropdown option.
 *
 * Example:
 * {
 *   id: "pending",
 *   label: "Pending Orders"
 * }
 *
 * ----------------------------------------------------------------------------
 * How to Use:
 * ----------------------------------------------------------------------------
 *
 * Example Usage:
 *
 * const categoryOptions = [
 *   { id: 'all', label: 'All Orders' },
 *   { id: 'pending', label: 'Pending' },
 *   { id: 'completed', label: 'Completed' },
 * ];
 *
 * const [selectedCategory, setSelectedCategory] = useState('all');
 *
 * <CustomDropdown
 *   value={selectedCategory}
 *   onChange={setSelectedCategory}
 *   options={categoryOptions}
 *   title="Order Status"
 * />
 *
 * ============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/theme-context';

export type OrderCategoryOption = {
  id: string;
  label: string;
};

type CustomDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly OrderCategoryOption[];
  title?: string;
  className?: string;
};

export function CustomDropdown({ value, onChange, options, title = 'Category', className = '' }: CustomDropdownProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const selected = options.find((opt: OrderCategoryOption) => opt.id === value);
  const triggerLabel = selected?.label ?? `Select ${title}`;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative w-full md:w-60 font-[outfit] antialiased ${className}`}>
      {/* TRIGGER: Matching SearchBar Style */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          w-full h-[52px] rounded-2xl px-6 flex items-center justify-between border
          transition-all duration-500 outline-none

          ${isDark
            ? 'bg-[#141446] border-[#1F1F51] text-white shadow-[0_0_12px_rgba(31,31,81,0.4)]'
            : 'bg-white border-slate-100 text-[#120533] shadow-[0_0_15px_rgba(139,92,246,0.1)]'
          }

          ${isDark
            ? 'hover:border-[#2a2a6e] focus:border-[#3b3b8a]'
            : 'hover:border-[#8B5CF6]/40 focus:border-[#8B5CF6]'
          }
        `}
      >
        <span className={`min-w-0 truncate text-sm font-medium tracking-tight ${isDark ? 'text-white' : 'text-[#120533]'}`}>
          {triggerLabel}
        </span>

        <div className="relative flex items-center justify-center">
          {/* Subtle Glow behind the arrow */}
          {isDark ? (
             <div className="absolute inset-0 bg-[#FFCE00] blur-md opacity-20 scale-150 rounded-full" />
          ) : (
             <div className="absolute inset-0 bg-[#8B5CF6] blur-md opacity-20 scale-150 rounded-full" />
          )}

          <motion.svg
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className={`
              h-3.5 w-3.5 relative z-10 transition-all duration-300
              ${isDark ? 'text-[#FFCE00] drop-shadow-[0_0_5px_rgba(255,206,0,0.6)]' : 'text-[#8B5CF6]'}
            `}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.3 8L10 12.3L5.7 8" />
          </motion.svg>
        </div>
      </button>

      {/* DROPDOWN PANEL: Matching SearchBox Shadow/Border Logic */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className={`
              absolute left-0 top-full mt-3 w-full rounded-2xl border p-2 z-50 backdrop-blur-xl
              ${isDark
                ? 'bg-[#141446] border-[#1F1F51] shadow-[0_30px_60px_rgba(0,0,0,0.4)]'
                : 'bg-white border-slate-100 shadow-[0_25px_50px_rgba(139,92,246,0.15)]'
              }
            `}
          >
            <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
              {options.map((option) => {
                const isActive = value === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => { onChange(option.id); setOpen(false); }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-200
                      ${isActive
                        ? (isDark ? 'bg-[#FFCE00]/10 text-[#FFCE00]' : 'bg-[#8B5CF6]/10 text-[#8B5CF6]')
                        : (isDark ? 'text-[#6F70A8] hover:text-white hover:bg-white/[0.03]' : 'text-slate-500 hover:bg-slate-50')
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {isActive && (
                      <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-[#FFCE00]' : 'bg-[#8B5CF6]'} shadow-[0_0_8px_currentColor]`} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}