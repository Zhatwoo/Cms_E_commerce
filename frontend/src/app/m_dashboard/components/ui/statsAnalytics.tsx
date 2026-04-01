'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

/**
 * @typedef {Object} StatCardProps
 * @property {string} id - Unique identifier for the stat card
 * @property {string} label - Display label (e.g., "TOTAL PRODUCTS")
 * @property {string | number} value - The metric value to display
 * @property {LucideIcon} icon - Lucide React icon component
 * @property {string} accent - Hex color for accents and highlights (e.g., "#86a8ff")
 * @property {number} [animationDelay=0] - Stagger animation delay in seconds
 * @property {boolean} [isSkeleton=false] - Show skeleton loading state
 */
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
