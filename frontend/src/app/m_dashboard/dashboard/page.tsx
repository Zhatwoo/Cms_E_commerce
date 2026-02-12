// Eto yung mismong dashboard page

'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { useTheme } from '../components/context/theme-context';
import { InfrastructureVisualization } from '../components/dashboard/InfrastructureVisualizations';
import { DashboardMetrics } from '../components/dashboard/DashboardMetrics';
import { ProjectsOverview } from '../components/projects/ProjectsOverview';

// ── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardContent({ userName = 'User' }: { userName?: string }) {
  const { theme, colors } = useTheme();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <motion.h1
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ color: colors.text.primary }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            Welcome back, {userName}
          </motion.h1>
          <motion.p
            className="text-sm sm:text-base max-w-xl"
            style={{ color: colors.text.muted }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            Monitor deployments, domains and templates — live health & usage at a glance.
          </motion.p>
        </div>
      </div>

      {/* Summary Cards */}
      <DashboardMetrics />

      {/* Analytics + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          className="lg:col-span-2 rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            borderColor: colors.border.default,
            boxShadow: theme === 'dark' ? '0 24px 80px rgba(0,0,0,0.7)' : '0 15px 50px rgba(0,0,0,0.1)',
          }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <InfrastructureVisualization />
        </motion.div>

        {/* Usage summary */}
        <motion.div
          className="rounded-2xl p-6 border flex flex-col gap-5"
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.default,
            boxShadow: theme === 'dark' ? '0 18px 60px rgba(0,0,0,0.6)' : '0 10px 40px rgba(0,0,0,0.08)',
          }}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold tracking-tight" style={{ color: colors.text.primary }}>
              Usage summary
            </h3>
            <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
              30 days
            </span>
          </div>

          <div className="flex items-center justify-center py-4">
            <div className="relative w-44 h-44">
              <svg className="-rotate-90" width="176" height="176">
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
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>
                  Plan capacity
                </p>
                <p className="mt-1 text-3xl font-semibold" style={{ color: colors.text.primary }}>76%</p>
                <p className="text-sm mt-1" style={{ color: colors.status.good }}>Healthy</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border px-4 py-3" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.elevated }}>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Bandwidth</p>
              <p className="mt-1 text-base font-semibold" style={{ color: colors.text.primary }}>3.2 TB</p>
              <p className="text-[11px] mt-1" style={{ color: colors.text.subtle }}>of 5 TB included</p>
            </div>
            <div className="rounded-xl border px-4 py-3" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.elevated }}>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Builds</p>
              <p className="mt-1 text-base font-semibold" style={{ color: colors.text.primary }}>428</p>
              <p className="text-[11px] mt-1" style={{ color: colors.status.good }}>+38 automated</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Projects section */}
      <ProjectsOverview />

      {/* Activity feed */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <ActivityFeed />
      </motion.div>

    </div>
  );
}

/*
Gud Luck guyss
Kaya nyo yan
Fighting!!
*/