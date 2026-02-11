'use client';
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';

const SAMPLE = [
  { id: 'p1', name: 'Mercato Launch 01', domain: 'ecommerce-01.mercato.tools', status: 'Live', visitors: '12.4k', lastDeploy: '7m', growth: 12.5, revenue: 45678 },
  { id: 'p2', name: 'Mercato Launch 02', domain: 'ecommerce-02.mercato.tools', status: 'Staging', visitors: '9.8k', lastDeploy: '1h', growth: -3.2, revenue: 34234 },
  { id: 'p3', name: 'Mercato Launch 03', domain: 'ecommerce-03.mercato.tools', status: 'Under review', visitors: '7.2k', lastDeploy: '3h', growth: 8.7, revenue: 28901 },
];

export default function ProjectsPage() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Live' | 'Staging' | 'Under review'>('All');
  const [selected, setSelected] = useState<string | null>(SAMPLE[0].id);

  const projects = useMemo(() => SAMPLE.filter(p => {
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q);
  }), [query, statusFilter]);

  const sel = SAMPLE.find(p => p.id === selected) || projects[0] || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text.primary }}>
            Projects
          </h1>
          <p className="mt-2 text-base" style={{ color: colors.text.secondary }}>
            Monitor and manage workspace projects
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
          style={{ backgroundColor: '#3b82f6', color: 'white' }}
        >
          New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: SAMPLE.length, color: '#3b82f6' },
          { label: 'Live', value: SAMPLE.filter(p => p.status === 'Live').length, color: '#10b981' },
          { label: 'Staging', value: SAMPLE.filter(p => p.status === 'Staging').length, color: '#f59e0b' },
          { label: 'Total Visitors', value: '29.4k', color: '#8b5cf6' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border p-6"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: colors.text.muted }}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: colors.text.primary }}>
                  {stat.value}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
              >
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects or domain..."
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.faint,
              color: colors.text.primary
            }}
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Live', 'Staging', 'Under review'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status ? 'shadow-md' : 'hover:opacity-70'
                }`}
              style={{
                backgroundColor: statusFilter === status ? colors.bg.elevated : 'transparent',
                color: statusFilter === status ? colors.text.primary : colors.text.muted,
                border: `1px solid ${statusFilter === status ? colors.border.default : 'transparent'}`
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
            <div className="p-4 border-b" style={{ borderColor: colors.border.faint }}>
              <h3 className="font-semibold" style={{ color: colors.text.primary }}>Active Projects</h3>
            </div>
            <div className="divide-y" style={{ borderColor: colors.border.faint }}>
              {projects.length === 0 && <div className="p-4 text-sm text-center" style={{ color: colors.text.muted }}>No projects found</div>}
              {projects.map(p => (
                <motion.button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`w-full text-left p-4 flex items-center justify-between transition-colors ${selected === p.id ? '' : 'hover:bg-opacity-50'
                    }`}
                  style={{
                    backgroundColor: selected === p.id ? colors.bg.elevated : 'transparent',
                    color: colors.text.primary
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex-1">
                    <div className="font-medium mb-1">{p.name}</div>
                    <div className="text-xs" style={{ color: colors.text.muted }}>{p.domain}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: p.status === 'Live' ? `${colors.status.good}20` :
                            p.status === 'Staging' ? `${colors.status.warning}20` :
                              `${colors.status.info}20`,
                          color: p.status === 'Live' ? colors.status.good :
                            p.status === 'Staging' ? colors.status.warning :
                              colors.status.info
                        }}
                      >
                        {p.status}
                      </span>
                      <span className="text-xs" style={{ color: colors.text.muted }}>{p.lastDeploy} ago</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: colors.text.primary }}>{p.visitors}</div>
                    <div className="text-xs" style={{ color: colors.text.muted }}>visitors</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="lg:col-span-2">
          {sel ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
            >
              {/* Header */}
              <div className="p-6 border-b" style={{ borderColor: colors.border.faint }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>{sel.name}</h2>
                    <div className="flex items-center gap-4">
                      <span className="text-sm" style={{ color: colors.text.muted }}>{sel.domain}</span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: sel.status === 'Live' ? `${colors.status.good}20` :
                            sel.status === 'Staging' ? `${colors.status.warning}20` :
                              `${colors.status.info}20`,
                          color: sel.status === 'Live' ? colors.status.good :
                            sel.status === 'Staging' ? colors.status.warning :
                              colors.status.info
                        }}
                      >
                        {sel.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sel.growth !== undefined && (
                      <div className={`flex items-center gap-1 text-sm font-medium ${sel.growth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={sel.growth >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}
                          />
                        </svg>
                        {Math.abs(sel.growth)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.bg.elevated }}>
                  <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{sel.visitors}</p>
                  <p className="text-sm mt-1" style={{ color: colors.text.muted }}>Visitors</p>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.bg.elevated }}>
                  <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{sel.lastDeploy}</p>
                  <p className="text-sm mt-1" style={{ color: colors.text.muted }}>Last Deploy</p>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.bg.elevated }}>
                  <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>${sel.revenue.toLocaleString()}</p>
                  <p className="text-sm mt-1" style={{ color: colors.text.muted }}>Revenue</p>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.bg.elevated }}>
                  <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>Modern</p>
                  <p className="text-sm mt-1" style={{ color: colors.text.muted }}>Template</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-6 border-t" style={{ borderColor: colors.border.faint }}>
                <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>Recent Deployments</h3>
                <div className="space-y-3">
                  {[
                    { id: '#324', status: 'Succeeded', time: '7m ago', color: colors.status.good },
                    { id: '#323', status: 'Failed', time: '1d ago', color: colors.status.error },
                    { id: '#322', status: 'Succeeded', time: '3d ago', color: colors.status.good }
                  ].map((deployment) => (
                    <div key={deployment.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.bg.elevated }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: deployment.color }}
                        />
                        <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                          Deployment {deployment.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: `${deployment.color}20`,
                            color: deployment.color
                          }}
                        >
                          {deployment.status}
                        </span>
                        <span className="text-xs" style={{ color: colors.text.muted }}>{deployment.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t flex gap-3" style={{ borderColor: colors.border.faint }}>
                <button
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors border"
                  style={{
                    borderColor: colors.border.faint,
                    color: colors.text.primary,
                    backgroundColor: 'transparent'
                  }}
                >
                  Open Preview
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
                  style={{ backgroundColor: '#3b82f6', color: 'white' }}
                >
                  Deploy
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors border"
                  style={{
                    borderColor: colors.border.faint,
                    color: colors.text.primary,
                    backgroundColor: 'transparent'
                  }}
                >
                  Manage Domains
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-xl border p-12 text-center" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>Select a Project</h3>
              <p style={{ color: colors.text.secondary }}>Choose a project from the list to view details and manage settings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
