'use client';
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const SAMPLE = [
  { id: 'p1', name: 'Mercato Launch 01', domain: 'ecommerce-01.mercato.tools', status: 'Live', visitors: '12.4k', lastDeploy: '7m' },
  { id: 'p2', name: 'Mercato Launch 02', domain: 'ecommerce-02.mercato.tools', status: 'Staging', visitors: '9.8k', lastDeploy: '1h' },
  { id: 'p3', name: 'Mercato Launch 03', domain: 'ecommerce-03.mercato.tools', status: 'Under review', visitors: '7.2k', lastDeploy: '3h' },
];

export default function ProjectsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All'|'Live'|'Staging'|'Under review'>('All');
  const [selected, setSelected] = useState<string | null>(SAMPLE[0].id);

  const projects = useMemo(() => SAMPLE.filter(p => {
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q);
  }), [query, statusFilter]);

  const sel = SAMPLE.find(p => p.id === selected) || projects[0] || null;

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted">Monitor and manage workspace projects</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search projects or domain"
              className="flex-1 rounded-md p-2 border bg-white dark:bg-[#0b0b0b] text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="rounded-md p-2 border bg-white dark:bg-[#0b0b0b] text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <option>All</option>
              <option>Live</option>
              <option>Staging</option>
              <option>Under review</option>
            </select>
          </div>

          <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#0b0b10] text-gray-900 dark:text-gray-100" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <div className="p-4 border-b bg-white dark:bg-[#0b0b10] text-gray-900 dark:text-gray-100" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>Most active projects</div>
            <div className="divide-y">
              {projects.length === 0 && <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No projects found</div>}
              {projects.map(p => (
                <motion.button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`w-full text-left p-4 flex items-center justify-between text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#0b0b0b] ${selected === p.id ? 'bg-gray-50 dark:bg-[#111]' : ''}`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{p.domain}</div>
                  </div>
                  <div className="text-sm font-medium">{p.visitors}</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {sel ? (
            <div className="rounded-2xl border p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{sel.name}</h2>
                  <div className="text-sm text-muted">{sel.domain}</div>
                </div>
                <div className="text-sm">Status: <span className="font-medium">{sel.status}</span></div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-md p-3 border">Visitors<br/><span className="font-semibold">{sel.visitors}</span></div>
                <div className="rounded-md p-3 border">Last deploy<br/><span className="font-semibold">{sel.lastDeploy} ago</span></div>
                <div className="rounded-md p-3 border">Template<br/><span className="font-semibold">Mercato Modern</span></div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold">Recent deployments</h3>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="p-3 rounded-md border">Deployment #324 — <span className="font-medium">Succeeded</span> — 7m ago</div>
                  <div className="p-3 rounded-md border">Deployment #323 — <span className="font-medium">Failed</span> — 1d ago</div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="px-3 py-2 rounded-md border">Open preview</button>
                <button className="px-3 py-2 rounded-md bg-blue-600 text-white">Deploy</button>
                <button className="px-3 py-2 rounded-md border">Manage domains</button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border p-6 text-center text-sm">Select a project to see details</div>
          )}
        </div>
      </div>
    </main>
  );
}
