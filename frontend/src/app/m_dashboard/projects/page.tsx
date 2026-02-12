'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { useRouter } from 'next/navigation';
import { listProjects, createProject, type Project } from '@/lib/api';
import { useAlert } from '../components/context/alert-context';

export default function ProjectsPage() {
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'draft' | 'published'>('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((res) => {
        if (!cancelled && res.success && res.projects) {
          setProjects(res.projects);
          if (res.projects.length > 0 && !selected) setSelected(res.projects[0].id);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (p.title || '').toLowerCase().includes(q);
    });
  }, [projects, query, statusFilter]);

  const sel = selected ? projects.find((p) => p.id === selected) || filtered[0] : filtered[0] || null;

  const handleNewProject = async () => {
    try {
      setCreating(true);
      const res = await createProject({ title: 'Untitled Project' });
      if (res.success && res.project) {
        setProjects((prev) => [res.project!, ...prev]);
        setSelected(res.project.id);
        router.push(`/design?projectId=${res.project.id}`);
      } else {
        showAlert('Failed to create project.');
      }
    } catch (e) {
      showAlert('Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
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
          disabled={creating}
          onClick={handleNewProject}
          className="px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-60"
          style={{ backgroundColor: '#3b82f6', color: 'white' }}
        >
          {creating ? 'Creating…' : 'New Project'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: projects.length, color: '#3b82f6' },
          { label: 'Draft', value: projects.filter((p) => p.status === 'draft').length, color: '#f59e0b' },
          { label: 'Published', value: projects.filter((p) => p.status === 'published').length, color: '#10b981' },
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
                <p className="text-sm font-medium" style={{ color: colors.text.muted }}>{stat.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: colors.text.primary }}>{stat.value}</p>
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.faint,
              color: colors.text.primary,
            }}
          />
        </div>
        <div className="flex gap-2">
          {(['All', 'draft', 'published'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status ? 'shadow-md' : 'hover:opacity-70'}`}
              style={{
                backgroundColor: statusFilter === status ? colors.bg.elevated : 'transparent',
                color: statusFilter === status ? colors.text.primary : colors.text.muted,
                border: `1px solid ${statusFilter === status ? colors.border.default : 'transparent'}`,
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
            <div className="p-4 border-b" style={{ borderColor: colors.border.faint }}>
              <h3 className="font-semibold" style={{ color: colors.text.primary }}>Active Projects</h3>
            </div>
            <div className="divide-y" style={{ borderColor: colors.border.faint }}>
              {loading && <div className="p-4 text-sm text-center" style={{ color: colors.text.muted }}>Loading…</div>}
              {!loading && filtered.length === 0 && <div className="p-4 text-sm text-center" style={{ color: colors.text.muted }}>No projects found</div>}
              {!loading && filtered.map((p) => (
                <motion.button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`w-full text-left p-4 flex items-center justify-between transition-colors ${selected === p.id ? '' : 'hover:bg-opacity-50'}`}
                  style={{
                    backgroundColor: selected === p.id ? colors.bg.elevated : 'transparent',
                    color: colors.text.primary,
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium mb-1 truncate">{p.title}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: p.status === 'published' ? `${colors.status.good}20` : `${colors.status.warning}20`,
                          color: p.status === 'published' ? colors.status.good : colors.status.warning,
                        }}
                      >
                        {p.status}
                      </span>
                      <span className="text-xs" style={{ color: colors.text.muted }}>
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {sel ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
            >
              <div className="p-6 border-b" style={{ borderColor: colors.border.faint }}>
                <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>{sel.title}</h2>
                <div className="flex items-center gap-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: sel.status === 'published' ? `${colors.status.good}20` : `${colors.status.warning}20`,
                      color: sel.status === 'published' ? colors.status.good : colors.status.warning,
                    }}
                  >
                    {sel.status}
                  </span>
                  <span className="text-sm" style={{ color: colors.text.muted }}>
                    Updated {sel.updatedAt ? new Date(sel.updatedAt).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
              <div className="p-6 border-t flex gap-3" style={{ borderColor: colors.border.faint }}>
                <button
                  onClick={() => router.push(`/design?projectId=${sel.id}`)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
                  style={{ backgroundColor: '#3b82f6', color: 'white' }}
                >
                  Edit in Web Builder
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-xl border p-12 text-center" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>Select a Project</h3>
              <p style={{ color: colors.text.secondary }}>Choose a project from the list or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
