'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const PRODUCT_INSIGHT_CARDS = [
  { id: 'active', label: 'Active', icon: CheckCircle },
  { id: 'inactive', label: 'Inactive', icon: AlertTriangle },
] as const;

/**
 * Displays product status metrics as animated metric cards.
 *
 * Features:
 * - Two cards showing counts of active and inactive products.
 * - Staggered fade-in animation on mount.
 * - Color-coded icons (green for active, red for inactive).
 * - Responsive grid layout that spans full width.
 * - Dark theme styling with glassmorphic appearance.
 *
 * Parameters:
 * - `productInsights`: Object with `active` and `inactive` product counts.
 */
export function StatsAnalytics({ productInsights }: {
  productInsights: { active: number; inactive: number };
}) {
  return (
    <div className="w-full grid grid-cols-2 gap-[10px]">
      {PRODUCT_INSIGHT_CARDS.map((card, idx) => {
        const Icon = card.icon;
        const accentColor = card.id === 'active' ? '#22d3a4' : '#ff4f8c';
        const value = card.id === 'active' ? productInsights.active : productInsights.inactive;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="rounded-2xl border"
            style={{ backgroundColor: '#141446', borderColor: '#2D3A90', minHeight: 72, padding: '10px 14px 12px' }}
          >
            <div className="flex items-center gap-[7px] mb-1">
              <Icon className="w-3 h-3" style={{ color: accentColor }} />
              <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: '#7e72a9', letterSpacing: '0.8px' }}>
                {card.label}
              </span>
            </div>
            <span className="text-2xl font-bold" style={{ color: '#f2ecff', letterSpacing: '-0.8px', lineHeight: 1.2 }}>
              {String(value)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
