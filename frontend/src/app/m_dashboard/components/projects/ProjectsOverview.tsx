// eto yung overview ng mga projects ni user, dito nya makikita yung mga sites na ginawa nya

'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/theme-context';
import CreateSite from './CreateSite';
import TemplatesLibrary from '../templates/TemplatesLibrary';
import { FilterIcon } from '../dashboard/DashboardIcons';
import { listProjects, createProject, type Project } from '@/lib/api';
import { useAlert } from '../context/alert-context';

export function ProjectsOverview() {
  const { theme, colors } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [showCreateSite, setShowCreateSite] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((res) => {
        if (!cancelled && res.success && res.projects) setProjects(res.projects);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setProjectsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCreateSite = async (data: { name: string; domain: string; template?: string }) => {
    try {
      const res = await createProject({ title: data.name || 'New Site' });
      if (res.success && res.project) {
        setShowCreateSite(false);
        setProjects((prev) => [res.project!, ...prev]);
        router.push(`/design?projectId=${res.project!.id}`);
      } else {
        showAlert('Failed to create project.');
      }
    } catch (e) {
      showAlert('Failed to create project.');
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: colors.text.primary }}>
            Projects & websites
          </h2>
          <p className="mt-1 text-sm" style={{ color: colors.text.muted }}>
            Most active workspaces overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setShowCreateSite(true)}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: colors.border.default,
              color: colors.text.secondary,
              backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.card,
            }}
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(0,0,0,0.55)' }}
            whileTap={{ scale: 0.97 }}
          >
            Create site
          </motion.button>

          <motion.button
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: colors.border.default,
              color: colors.text.secondary,
              backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.card,
            }}
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(0,0,0,0.55)' }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="rounded-lg p-1.5" style={{ backgroundColor: colors.bg.elevated }}>
              <FilterIcon />
            </span>
            Filters
          </motion.button>
        </div>
      </div>

      {/* Featured preview placeholder */}
      <motion.div
        className="rounded-2xl p-6 min-h-[180px] flex items-center justify-between gap-8 border"
        style={{
          background: `linear-gradient(135deg, ${colors.bg.card}, ${theme === 'dark' ? colors.bg.dark : colors.bg.elevated})`,
          borderColor: colors.border.default,
        }}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="space-y-3 max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
            Featured preview
          </p>
          <p className="text-xl font-semibold" style={{ color: colors.text.primary }}>
            eCommerce – "Mercato Modern"
          </p>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            Stage & review changes before going live — perfect for A/B tests and seasonal layouts.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium border" style={{ backgroundColor: 'rgba(163,230,53,0.1)', borderColor: colors.status.good, color: colors.status.good }}>
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
              Preview ready
            </span>
            <span className="text-xs" style={{ color: colors.text.subtle }}>Last deploy: 7 min ago</span>
          </div>
        </div>

        {/* Mini browser mockup (simplified) */}
        <div className="hidden md:block relative w-72 h-44 rounded-xl border overflow-hidden shadow-2xl" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(243,244,246,0.06),transparent_60%)]" />
          <div className="relative p-3 text-[11px]" style={{ color: colors.text.muted }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.status.good }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.status.warning }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.status.error }} />
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ borderColor: colors.border.default, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)' }}>Staging</span>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 rounded-full" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)' }}>
                <div className="h-full w-4/5 rounded-full" style={{ backgroundColor: colors.text.muted }} />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="h-2.5 rounded-full" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)' }} />
                <div className="h-2.5 rounded-full" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)' }} />
                <div className="h-2.5 rounded-full" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)' }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Templates library */}
      <motion.div
        className="rounded-2xl p-6 border"
        style={{ background: `linear-gradient(135deg, ${colors.bg.card}, ${theme === 'dark' ? colors.bg.dark : colors.bg.elevated})`, borderColor: colors.border.default }}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>Templates</p>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Quick-start templates for new sites</p>
          </div>
        </div>
        <TemplatesLibrary onUse={(t) => console.log('Use template', t)} />
      </motion.div>

      {/* Projects table placeholder */}
      <motion.div
        className="rounded-2xl border overflow-hidden shadow-2xl"
        style={{
          backgroundColor: colors.bg.card,
          borderColor: colors.border.default,
          boxShadow: theme === 'dark' ? '0 18px 60px rgba(0,0,0,0.65)' : '0 10px 40px rgba(0,0,0,0.08)',
        }}
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="px-5 py-3.5 border-b flex items-center justify-between text-xs font-medium uppercase tracking-wider" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
          <span>Most active projects</span>
          <a href="/m_dashboard/projects" className="text-xs hover:underline" style={{ color: colors.status.info }}>View all →</a>
        </div>
        <div className="divide-y" style={{ borderColor: colors.border.faint }}>
          {projectsLoading && <div className="p-6 text-center text-sm" style={{ color: colors.text.muted }}>Loading…</div>}
          {!projectsLoading && projects.length === 0 && <div className="p-8 text-center text-sm" style={{ color: colors.text.muted }}>No projects yet. Create a site to get started.</div>}
          {!projectsLoading && projects.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="px-5 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => router.push(`/design?projectId=${p.id}`)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: colors.text.primary }}>{p.title}</p>
                <p className="text-xs" style={{ color: colors.text.muted }}>{p.status} · {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}</p>
              </div>
              <span className="text-xs font-medium" style={{ color: colors.status.info }}>Edit →</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Create Site Modal */}
      <CreateSite
        show={showCreateSite}
        onClose={() => setShowCreateSite(false)}
        onCreate={handleCreateSite}
      />
    </section>
  );
}
