/*
Overview lang den ng mga projects ni store owner
*/

'use client';
import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { useTheme } from '../context/theme-context';
import { BriefcaseIcon, ArrowUpIcon, RefreshIcon } from './DashboardIcons';

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export function DashboardMetrics() {
  const { theme, colors } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Total Projects */}
      <motion.div
        className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between border shadow-2xl"
        style={{
          backgroundColor: colors.bg.card,
          borderColor: colors.border.default,
          boxShadow: theme === 'dark' ? '0 18px 65px rgba(0,0,0,0.65)' : '0 10px 40px rgba(0,0,0,0.08)',
        }}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -4, scale: 1.01 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(243,244,246,0.05),transparent_70%)] pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
            Total projects
          </p>
          <p className="mt-2 text-3xl font-semibold" style={{ color: colors.text.primary }}>123,456</p>
          <p className="mt-1.5 text-xs" style={{ color: colors.text.subtle }}>
            +1,204 new <span style={{ color: colors.status.good }}>this week</span>
          </p>
        </div>
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg" style={{ backgroundColor: theme === 'dark' ? colors.text.muted : colors.bg.elevated, color: theme === 'dark' ? colors.bg.dark : colors.text.primary }}>
          <BriefcaseIcon />
        </div>
      </motion.div>

      {/* Published Sites */}
      <motion.div
        className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between border shadow-2xl"
        style={{
          backgroundColor: colors.bg.card,
          borderColor: colors.border.default,
          boxShadow: theme === 'dark' ? '0 18px 65px rgba(0,0,0,0.65)' : '0 10px 40px rgba(0,0,0,0.08)',
        }}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(147,197,253,0.06),transparent_70%)] pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
            Published sites
          </p>
          <p className="mt-2 text-3xl font-semibold" style={{ color: colors.text.primary }}>123,456</p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(163,230,53,0.1)', borderColor: colors.status.good, color: colors.status.good }}>
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
              98.6% live
            </span>
            <span style={{ color: colors.text.subtle }}>+6.4% vs last week</span>
          </div>
        </div>
        <div
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
          style={{ backgroundColor: theme === 'dark' ? colors.text.muted : colors.bg.elevated, color: theme === 'dark' ? colors.bg.dark : colors.text.primary }}
        >
          <ArrowUpIcon />
        </div>
      </motion.div>

      {/* Under Review */}
      <motion.div
        className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between border shadow-2xl"
        style={{
          backgroundColor: colors.bg.card,
          borderColor: colors.border.default,
          boxShadow: theme === 'dark' ? '0 18px 65px rgba(0,0,0,0.65)' : '0 10px 40px rgba(0,0,0,0.08)',
        }}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ delay: 0.2 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(243,244,246,0.04),transparent_70%)] pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
            Under review
          </p>
          <p className="mt-2 text-3xl font-semibold" style={{ color: colors.text.primary }}>8,204</p>
          <p className="mt-1.5 text-xs" style={{ color: colors.text.subtle }}>
            Awaiting publish / rollback
          </p>
        </div>
        <div
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
          style={{ backgroundColor: theme === 'dark' ? colors.text.muted : colors.bg.elevated, color: theme === 'dark' ? colors.bg.dark : colors.text.primary }}
        >
          <RefreshIcon />
        </div>
      </motion.div>
    </div>
  );
}