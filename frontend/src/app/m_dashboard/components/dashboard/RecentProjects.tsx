'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/theme-context';
import { listProjects, type Project } from '@/lib/api';

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export function RecentProjects() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((res) => {
        if (!cancelled && res.success && res.projects) {
          // Get top 3 recent projects sorted by update time
          const sorted = [...res.projects].sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          setProjects(sorted.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Edited recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (minutes < 60) return `Edited ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `Edited ${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days === 1) return 'Edited 1 day ago';
    if (days < 30) return `Edited ${days} days ago`;
    if (months === 1) return 'Edited 1 month ago';
    if (months < 12) return `Edited ${months} months ago`;
    if (years === 1) return 'Edited 1 year ago';
    return `Edited ${years} years ago`;
  };

  const getStatusColor = (idx: number) => {
    const colors = ['#FF8A3D', '#9333EA', '#3B82F6', '#10B981', '#F59E0B'];
    return colors[idx % colors.length];
  };

  return (
    <div className="mb-8 md:mb-12 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
          Recent Projects
        </h2>
        <button
          onClick={() => router.push('/m_dashboard/web-builder')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: colors.bg.elevated,
            color: colors.text.primary,
            border: `1px solid ${colors.border.default}`
          }}
        >
          See all
        </button>
      </div>

      {loading ? (
        <div className="flex gap-4 md:gap-5 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex-shrink-0 w-[240px]">
              <div 
                className="h-[180px] rounded-xl mb-3" 
                style={{ backgroundColor: colors.bg.elevated }} 
              />
              <div className="h-4 rounded w-3/4 mb-2" style={{ backgroundColor: colors.bg.elevated }} />
              <div className="h-3 rounded w-1/2" style={{ backgroundColor: colors.bg.elevated }} />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4" style={{ color: colors.text.muted, opacity: 0.3 }}>
            <ImageIcon />
          </div>
          <p className="text-base font-semibold mb-2" style={{ color: colors.text.primary }}>
            No projects yet
          </p>
          <p className="text-sm" style={{ color: colors.text.muted }}>
            Create your first project to get started!
          </p>
        </div>
      ) : (
        <div className="flex gap-4 md:gap-5 flex-wrap lg:flex-nowrap">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              className="cursor-pointer group/card flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[240px] lg:w-[240px]"
              onClick={() => router.push(`/design?projectId=${project.id}`)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: idx * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
            >
              {/* Preview Thumbnail */}
              <div
                className="relative rounded-lg overflow-hidden mb-3 transition-all group-hover/card:shadow-2xl h-[180px]"
                style={{
                  background: project.thumbnail ? '#f5f5f5' : '#f8f8f8',
                  boxShadow: theme === 'dark' 
                    ? '0 2px 8px rgba(0,0,0,0.4)' 
                    : '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                {project.thumbnail ? (
                  <img
                    src={project.thumbnail}
                    alt={project.title || 'Project preview'}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white">
                      <div className="h-4 sm:h-5 bg-white" />
                      <div className="h-full bg-[#e5e7eb]" />
                    </div>
                    <div className="absolute top-2 left-2 text-[10px] font-medium text-zinc-400">
                      Page Name
                    </div>
                  </>
                )}
              </div>

              {/* Project Info */}
              <div>
                <p
                  className="font-semibold text-base truncate mb-1.5"
                  style={{ color: colors.text.primary }}
                >
                  {project.title || 'Untitled Project'}
                </p>
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: getStatusColor(idx) }}
                  >
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                    </svg>
                  </div>
                  <p className="text-sm truncate" style={{ color: colors.text.muted }}>
                    {formatDate(project.updatedAt || project.createdAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
