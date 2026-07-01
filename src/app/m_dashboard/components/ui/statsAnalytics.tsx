'use client';

/**
 * ============================================================================
 * StatsAnalytics Component System
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains a reusable analytics/statistics card system used for
 * displaying dashboard metrics, summaries, counters, and analytical data.
 *
 * It includes:
 * - StatsAnalytics grid container
 * - Internal StatCard component
 *
 * The component system is designed for:
 * - Dashboard statistics
 * - Admin analytics
 * - Inventory summaries
 * - Order counts
 * - Revenue tracking
 * - User statistics
 * - KPI monitoring
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Displays animated metric cards
 * - Renders statistics inside responsive grid layouts
 * - Supports loading skeleton states
 * - Uses configurable accent colors
 * - Supports staggered card animations
 * - Provides reusable dashboard analytics UI
 *
 * ----------------------------------------------------------------------------
 * Dependencies:
 * ----------------------------------------------------------------------------
 *
 * Required Packages:
 * - react
 * - framer-motion
 * - lucide-react
 *
 * Installation:
 *
 * npm install framer-motion lucide-react
 *
 * ----------------------------------------------------------------------------
 * Main Features:
 * ----------------------------------------------------------------------------
 * ✓ Animated stat cards
 * ✓ Responsive grid layout
 * ✓ Skeleton loading states
 * ✓ Theme-aware styling
 * ✓ Memoized card rendering
 * ✓ Configurable grid columns
 * ✓ Custom accent colors
 * ✓ Hover animations
 * ✓ Reusable dashboard UI
 *
 * ----------------------------------------------------------------------------
 * Component Structure:
 * ----------------------------------------------------------------------------
 *
 * StatsAnalytics
 * └── StatCard (internal reusable card component)
 *
 * ----------------------------------------------------------------------------
 * Type Definitions:
 * ----------------------------------------------------------------------------
 *
 * StatCardProps
 * ----------------------------------------------------------------------------
 *
 * id: string
 * - Unique identifier for the card.
 * - Used as React key.
 *
 * label: string
 * - Metric title or label.
 *
 * Example:
 * - "TOTAL PRODUCTS"
 * - "TOTAL ORDERS"
 * - "REVENUE"
 *
 * value: string | number
 * - Main metric value displayed.
 *
 * icon: LucideIcon
 * - Lucide React icon component.
 *
 * Example:
 * - Package
 * - ShoppingCart
 * - DollarSign
 *
 * accent: string
 * - Accent hex color used for:
 *   - Icon
 *   - Borders
 *   - Glow effects
 *
 * Example:
 * - "#86a8ff"
 * - "#10B981"
 *
 * animationDelay?: number
 * - Stagger animation delay in seconds.
 * - Default: 0
 *
 * isSkeleton?: boolean
 * - Enables loading skeleton UI.
 * - Default: false
 *
 * ----------------------------------------------------------------------------
 * StatsAnalyticsProps
 * ----------------------------------------------------------------------------
 *
 * cards: StatCardProps[]
 * - Array of card configurations.
 * - REQUIRED
 *
 * gridCols?: string
 * - Tailwind grid column classes.
 *
 * Default:
 * - 'grid-cols-2'
 *
 * Example:
 * - 'grid-cols-2 md:grid-cols-4'
 *
 * gap?: string
 * - Tailwind gap utility class.
 *
 * Default:
 * - 'gap-[10px]'
 *
 * ----------------------------------------------------------------------------
 * How to Use:
 * ----------------------------------------------------------------------------
 *
 * Basic Example:
 *
 * import {
 *   Package,
 *   ShoppingCart,
 *   DollarSign,
 * } from 'lucide-react';
 *
 * const statCards = [
 *   {
 *     id: 'products',
 *     label: 'TOTAL PRODUCTS',
 *     value: 125,
 *     icon: Package,
 *     accent: '#86a8ff',
 *   },
 *   {
 *     id: 'orders',
 *     label: 'TOTAL ORDERS',
 *     value: 42,
 *     icon: ShoppingCart,
 *     accent: '#10B981',
 *   },
 * ];
 *
 * <StatsAnalytics
 *   cards={statCards}
 * />
 *
 * ----------------------------------------------------------------------------
 * Example with Responsive Layout:
 * ----------------------------------------------------------------------------
 *
 * <StatsAnalytics
 *   cards={statCards}
 *   gridCols="grid-cols-2 md:grid-cols-4"
 *   gap="gap-4"
 * />
 *
 * ----------------------------------------------------------------------------
 * Example Skeleton Loading:
 * ----------------------------------------------------------------------------
 *
 * const loadingCards = [
 *   {
 *     id: 'loading-1',
 *     label: '',
 *     value: '',
 *     icon: Package,
 *     accent: '#86a8ff',
 *     isSkeleton: true,
 *   },
 * ];
 *
 * <StatsAnalytics cards={loadingCards} />
 *
 * ============================================================================
 */


import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
export interface StatCardProps {
  id: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
  animationDelay?: number;
  isSkeleton?: boolean;
}

/**
 * @typedef {Object} StatsAnalyticsProps
 * @property {StatCardProps[]} cards - Array of stat cards to render
 * @property {string} [gridCols='grid-cols-2'] - Tailwind grid column class
 * @property {string} [gap='gap-[10px]'] - Tailwind gap class for spacing
 */
export interface StatsAnalyticsProps {
  cards: StatCardProps[];
  gridCols?: string;
  gap?: string;
}

/**
 * StatCard - A premium, reusable metric card component.
 *
 * Kept in the same file as StatsAnalytics so the whole reusable UI can be imported
 * from one file while preserving clear parent/child separation in code.
 */
const StatCard = React.memo(
  ({
    id,
    label,
    value,
    icon: Icon,
    accent,
    animationDelay = 0,
    isSkeleton = false,
  }: StatCardProps) => {
    return (
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: animationDelay,
          ease: [0.23, 1, 0.32, 1],
          duration: 0.5,
        }}
        className="relative overflow-hidden rounded-3xl border transition-all duration-500 hover:shadow-xl group"
        style={{
          backgroundColor: 'var(--dashboard-light-surface, #141446)',
          borderColor: `${accent}25`,
          minHeight: 100,
          padding: '20px 24px',
          boxShadow: '0 4px 20px -12px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="absolute -right-4 -top-4 w-20 h-20 opacity-[0.05] blur-2xl rounded-full transition-opacity duration-500 group-hover:opacity-[0.08]"
          style={{ backgroundColor: accent }}
        />

        <div className="flex items-center gap-5 relative z-10">
          <div
            className="flex items-center justify-center shrink-0 w-12 h-12 rounded-2xl transition-all duration-300 group-hover:scale-110"
            style={{
              backgroundColor: `${accent}10`,
              border: `1px solid ${accent}20`,
            }}
          >
            {isSkeleton ? (
              <div className="w-6 h-6 rounded bg-linear-to-r from-gray-700 to-gray-800 animate-pulse" />
            ) : (
              <Icon className="w-6 h-6 transition-colors duration-300" style={{ color: accent }} />
            )}
          </div>

          <div className="flex flex-col gap-1 flex-1">
            {isSkeleton ? (
              <div className="h-3 w-24 rounded bg-gray-700 animate-pulse" />
            ) : (
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 transition-opacity duration-300 group-hover:opacity-80"
                style={{
                  color: 'var(--dashboard-light-muted, rgba(219,212,255,0.45))',
                  fontFamily: 'var(--font-outfit), sans-serif',
                }}
              >
                {label}
              </span>
            )}

            {isSkeleton ? (
              <div className="h-7 w-20 rounded bg-gray-700 animate-pulse" />
            ) : (
              <span
                className="text-2xl font-black leading-none transition-colors duration-300"
                style={{
                  color: 'var(--dashboard-light-text, #ffffff)',
                  letterSpacing: '-1px',
                  fontFamily: 'var(--font-outfit), sans-serif',
                }}
              >
                {String(value)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

StatCard.displayName = 'StatCard';

/**
 * StatsAnalytics - Generic stats grid renderer
 *
 * This component receives precomputed card data and renders it using a
 * consistent animated tile UI. Business logic stays in the caller page.
 *
 * Features:
 * - Dynamic stat cards with configurable layout
 * - Responsive grid that adapts to screen size
 * - Skeleton loading state for data fetching UX
 * - Memoized rendering for performance optimization
 * - Theme-aware styling with CSS variables
 * - Staggered animation for cards on mount
 *
 * @component
 * @example
 * ```tsx
 * <StatsAnalytics
 *   cards={statCards}
 *   gridCols="grid-cols-2 md:grid-cols-4"
 *   gap="gap-4"
 * />
 * ```
 *
 * @param {StatsAnalyticsProps} props - Component props
 * @returns {JSX.Element} Rendered stats container with animated cards
 */
export function StatsAnalytics({
  cards,
  gridCols = 'grid-cols-2',
  gap = 'gap-[10px]',
}: StatsAnalyticsProps) {
  return (
    <div className={`w-full grid ${gridCols} ${gap}`}>
      {cards.map((card) => (
        <StatCard key={card.id} {...card} />
      ))}
    </div>
  );
}

export default StatsAnalytics;
