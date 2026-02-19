'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/theme-context';
import { listProjects, type Project } from '@/lib/api';

interface ProjectWithViews extends Project {
  views?: number;
  clicks?: number;
}

export function PopularProjects() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithViews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((res) => {
        if (!cancelled && res.success && res.projects) {
          // Mock popularity data - in real app, this would come from analytics
          const withMockViews = res.projects.map((p) => ({
            ...p,
            views: Math.floor(Math.random() * 10000) + 500,
            clicks: Math.floor(Math.random() * 5000) + 100,
          }));
          
          // Sort by views (popularity)
          const sorted = [...withMockViews].sort((a, b) => (b.views || 0) - (a.views || 0));
          setProjects(sorted.slice(0, 4));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <motion.div
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: colors.bg.card,
        borderColor: colors.border.default,
        boxShadow: theme === 'dark' ? '0 18px 60px rgba(0,0,0,0.6)' : '0 10px 40px rgba(0,0,0,0.08)',
      }}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold tracking-tight" style={{ color: colors.text.primary }}>
          Popular projects
        </h3>
        <span
          className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
          style={{ borderColor: colors.border.faint, color: colors.text.muted }}
        >
          By views
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-14 rounded-xl" style={{ backgroundColor: colors.bg.elevated }} />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: colors.text.muted }}>
            No projects to display yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              className="rounded-xl border p-3 cursor-pointer transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.elevated,
                borderColor: colors.border.faint,
              }}
              onClick={() => router.push(`/design?projectId=${project.id}`)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: idx === 0 ? colors.status.good : theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(156,163,175,0.2)',
                    color: idx === 0 ? colors.bg.dark : colors.text.muted,
                  }}
                >
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: colors.text.primary }}>
                    {project.title || 'Untitled Project'}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs" style={{ color: colors.text.muted }}>
                      👁️ {formatNumber(project.views || 0)} views
                    </span>
                    <span className="text-xs" style={{ color: colors.text.muted }}>
                      🖱️ {formatNumber(project.clicks || 0)} clicks
                    </span>
                  </div>
                </div>
                {project.status === 'published' && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: 'rgba(163,230,53,0.1)',
                      color: colors.status.good,
                    }}
                  >
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
                    Live
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
