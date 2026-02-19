// Eto yung mismong dashboard page

'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { RecentProjects } from '../components/dashboard/RecentProjects';
import { TopSellingProducts } from '../components/dashboard/TopSellingProducts';

// ── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardContent({ userName = 'User' }: { userName?: string }) {
  const { theme, colors } = useTheme();

  return (
    <div className="space-y-6 md:space-y-10 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="relative flex flex-col gap-3">
          <div
            className="absolute -inset-x-6 -inset-y-4 rounded-3xl opacity-70 blur-2xl"
            style={{
              background: theme === 'dark'
                ? 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.22), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.18), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.16), transparent 60%)'
                : 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.14), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.12), transparent 60%)'
            }}
          />
          <div
            className="absolute -top-6 -left-8 h-24 w-24 rounded-full blur-2xl opacity-40"
            style={{
              background: theme === 'dark'
                ? 'radial-gradient(circle, rgba(120,150,255,0.35) 0%, rgba(0,0,0,0) 70%)'
                : 'radial-gradient(circle, rgba(120,150,255,0.25) 0%, rgba(255,255,255,0) 70%)'
            }}
          />
          <motion.h1
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight bg-clip-text text-transparent"
            style={{
              backgroundImage: theme === 'dark' 
                ? 'linear-gradient(180deg, #ffffff 25%, #888888 100%)'
                : 'linear-gradient(180deg, #1a1a1a 25%, #555555 100%)'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            What website will you build?
          </motion.h1>
          <motion.p
            className="text-sm sm:text-base max-w-xl"
            style={{ color: colors.text.muted }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            Monitor deployments, domains and templates live health &amp; usage at a glance.
          </motion.p>
        </div>
      </div>

      {/* Recent Projects - Full Width Horizontal Scroll */}
      <RecentProjects />

      {/* Top Selling Products + Usage Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
        <TopSellingProducts />
        
        {/* Usage summary */}
        <motion.div
          className="rounded-2xl p-4 md:p-6 border flex flex-col gap-4 md:gap-5 col-span-1 lg:col-span-1"
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.default,
            boxShadow: theme === 'dark' ? '0 18px 60px rgba(0,0,0,0.6)' : '0 10px 40px rgba(0,0,0,0.08)',
          }}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h3 className="text-base md:text-lg font-semibold tracking-tight" style={{ color: colors.text.primary }}>
              Usage summary
            </h3>
            <span className="rounded-full border px-2 py-0.5 md:px-2.5 md:py-1 text-[9px] md:text-[11px] font-medium" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
              30 days
            </span>
          </div>

          <div className="flex items-center justify-center py-3 md:py-4 overflow-x-auto md:overflow-x-visible">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 flex-shrink-0">
              <svg className="-rotate-90" width="100%" height="100%" viewBox="0 0 176 176">
                <circle cx="88" cy="88" r="78" fill="none" stroke={colors.border.faint} strokeWidth="14" />
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="14"
                  strokeDasharray={`${2 * Math.PI * 78 * 0.76} ${2 * Math.PI * 78}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.status.good} />           {/* #A3E635 */}
                    <stop offset="50%" stopColor={theme === 'dark' ? "#D1D1D6" : "#9CA3AF"} />
                    <stop offset="100%" stopColor={colors.text.muted} />          {/* #9999A1 */}
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[10px] md:text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>
                  Plan capacity
                </p>
                <p className="mt-0.5 md:mt-1 text-2xl md:text-3xl font-semibold" style={{ color: colors.text.primary }}>76%</p>
                <p className="text-xs md:text-sm mt-0.5 md:mt-1" style={{ color: colors.status.good }}>Healthy</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs">
            <div className="rounded-xl border px-3 py-2 md:px-4 md:py-3" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.elevated }}>
              <p className="text-[10px] md:text-[11px] font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Bandwidth</p>
              <p className="mt-0.5 md:mt-1 text-sm md:text-base font-semibold" style={{ color: colors.text.primary }}>3.2 TB</p>
              <p className="text-[9px] md:text-[11px] mt-0.5 md:mt-1" style={{ color: colors.text.subtle }}>of 5 TB included</p>
            </div>
            <div className="rounded-xl border px-3 py-2 md:px-4 md:py-3" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.elevated }}>
              <p className="text-[10px] md:text-[11px] font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Builds</p>
              <p className="mt-0.5 md:mt-1 text-sm md:text-base font-semibold" style={{ color: colors.text.primary }}>428</p>
              <p className="text-[9px] md:text-[11px] mt-0.5 md:mt-1" style={{ color: colors.status.good }}>+38 automated</p>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

// Default page export for Next.js app router
export default function Page() {
  return <DashboardContent />;
}

/*
Gud Luck guyss
Kaya nyo yan
Fighting!!
*/