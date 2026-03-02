'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/theme-context';
import { useAlert } from '../context/alert-context';
import { listProjects, createProject, getStoredUser, type Project } from '@/lib/api';
import { ensureProjectStorageFolder } from '@/lib/firebaseStorage';

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
  const { showAlert } = useAlert();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createSubdomain, setCreateSubdomain] = useState('');
  const [creating, setCreating] = useState(false);

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

  const handleCreateFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const title = createTitle.trim() || 'Untitled Project';
      const subdomain = createSubdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

      const res = await createProject({
        title,
        subdomain: subdomain || undefined,
      });

      if (!res.success || !res.project) {
        showAlert('Failed to create project. Please try again.');
        return;
      }

      const user = getStoredUser();
      const clientName = (user?.name || user?.username || 'client').trim() || 'client';
      ensureProjectStorageFolder(clientName, res.project.title || 'website').catch(() => {});

      setCreateModalOpen(false);
      setCreateTitle('');
      setCreateSubdomain('');
      router.push(`/design?projectId=${res.project.id}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Route not found') || msg.includes('404')) {
        showAlert('Project API not found. Make sure the backend is running and restart it.');
      } else {
        showAlert('Failed to create project. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mb-8 md:mb-12 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
          Recent Projects
        </h2>
        <button
          onClick={() => router.push('/m_dashboard/web-builder#projects-section')}
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
          <motion.button
            type="button"
            className="group/add cursor-pointer flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[240px] lg:w-[240px] text-left"
            onClick={() => setCreateModalOpen(true)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0,
              type: 'spring',
              stiffness: 100,
              damping: 15,
            }}
          >
            <div
              className="relative rounded-lg mb-3 h-[180px] border-2 border-dashed flex items-center justify-center transition-all duration-200 group-hover/add:scale-[1.01]"
              style={{
                borderColor: colors.border.default,
                backgroundColor: colors.bg.card,
              }}
            >
              <div className="w-16 h-16 rounded-2xl border flex items-center justify-center" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.text.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>

            <div>
              <p className="font-semibold text-base truncate mb-1.5" style={{ color: colors.text.primary }}>
                New Project
              </p>
              <p className="text-sm truncate" style={{ color: colors.text.muted }}>
                Create a project and open it in builder
              </p>
            </div>
          </motion.button>

          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              className="cursor-pointer group/card flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[240px] lg:w-[240px]"
              onClick={() => router.push(`/design?projectId=${project.id}`)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: (idx + 1) * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
            >
              {/* Preview Thumbnail */}
              <div
                className="relative rounded-lg overflow-hidden mb-3 transition-all group-hover/card:shadow-2xl h-[180px]"
                style={{
                  backgroundColor: project.thumbnail ? colors.bg.elevated : colors.bg.card,
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
                    <div className="absolute inset-0" style={{ backgroundColor: colors.bg.card }}>
                      <div className="h-4 sm:h-5" style={{ backgroundColor: colors.bg.card }} />
                      <div className="h-full" style={{ backgroundColor: colors.bg.elevated }} />
                    </div>
                    <div className="absolute top-2 left-2 text-[10px] font-medium" style={{ color: colors.text.subtle }}>
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

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCreateModalOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.default }}
          >
            <div className="p-6 border-b" style={{ borderColor: colors.border.faint }}>
              <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>Create project</h3>
              <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                Set a title and preferred subdomain. The subdomain will be ready when you deploy.
              </p>
            </div>

            <form onSubmit={handleCreateFromModal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: colors.text.primary }}>Project title</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="My Store"
                  className="w-full px-4 py-2.5 rounded-lg border bg-transparent focus:outline-none focus:ring-2"
                  style={{ borderColor: colors.border.default, color: colors.text.primary }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: colors.text.primary }}>Preferred subdomain</label>
                <input
                  type="text"
                  value={createSubdomain}
                  onChange={(e) => setCreateSubdomain(e.target.value)}
                  placeholder="mystore"
                  className="w-full px-4 py-2.5 rounded-lg border bg-transparent focus:outline-none focus:ring-2"
                  style={{ borderColor: colors.border.default, color: colors.text.primary }}
                />
                <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                  Only letters, numbers, and hyphens. Example: mystore → mystore.yourdomain.com
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80" style={{ color: colors.text.primary }}>
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                  {creating ? 'Creating…' : 'Create & open'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
