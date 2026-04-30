'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/theme-context';
import { useAlert } from '../context/alert-context';
import { useProject } from '../context/project-context';
import { createProject, updateProject, deleteProject, type Project } from '@/lib/api';
import { INDUSTRY_OPTIONS } from '@/lib/industryCatalog';
import { DraftPreviewThumbnail } from '../projects/DraftPreviewThumbnail';

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
  const { selectedProject, setSelectedProjectId, loading: contextLoading, projects: contextProjects, refreshProjects } = useProject();
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createIndustry, setCreateIndustry] = useState('');
  const [createSubdomain, setCreateSubdomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    setProjectsLoading(contextLoading);
  }, [contextLoading]);

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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setOpenMenuProjectId(null);
      }
    };

    if (openMenuProjectId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [openMenuProjectId]);

  const handleCreateFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const title = createTitle.trim() || 'Untitled Project';
      const industry = createIndustry.trim();
      const subdomain = createSubdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

      if (!industry) {
        showAlert('Please select your store industry first.');
        return;
      }

      const res = await createProject({
        title,
        industry,
        subdomain: subdomain || undefined,
      });

      if (!res.success || !res.project) {
        showAlert('Failed to create project. Please try again.');
        return;
      }

      setCreateModalOpen(false);
      setCreateTitle('');
      setCreateIndustry('');
      setCreateSubdomain('');
      // Only treat as a new website/instance if none is currently selected.
      if (!selectedProject) {
        setSelectedProjectId(res.project.id);
      }
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

  const projects = contextProjects ?? [];
  const visibleProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 3),
    [projects]
  );

  const handleEditProject = async (projectId: string, currentTitle?: string | null) => {
    const nextTitle = window.prompt('Edit project title', (currentTitle || '').trim() || 'Untitled Project');
    if (nextTitle === null) return;

    const trimmedTitle = nextTitle.trim();
    if (!trimmedTitle) {
      showAlert('Project title cannot be empty.');
      return;
    }

    try {
      const res = await updateProject(projectId, { title: trimmedTitle });
      if (!res.success) {
        showAlert(res.message || 'Failed to update project.');
        return;
      }

      await refreshProjects();
      showAlert('Project updated.');
    } catch {
      showAlert('Failed to update project. Please try again.');
    } finally {
      setOpenMenuProjectId(null);
    }
  };

  const handleDeleteProject = async (projectId: string, projectTitle?: string | null) => {
    const confirmed = window.confirm(`Move "${projectTitle || 'Untitled Project'}" to trash?`);
    if (!confirmed) return;

    try {
      const res = await deleteProject(projectId);
      if (!res.success) {
        showAlert(res.message || 'Failed to delete project.');
        return;
      }

      await refreshProjects();
      showAlert('Project moved to trash.');
    } catch {
      showAlert('Failed to delete project. Please try again.');
    } finally {
      setOpenMenuProjectId(null);
    }
  };
  return (
    <div className="mb-8 md:mb-12 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
          Recent Projects
        </h2>
        <button
          onClick={() => router.push('/m_dashboard/projects#projects-section')}
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

      {contextLoading || projectsLoading ? (
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
              className="relative cursor-pointer group/card flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[240px] lg:w-[240px]"
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
              <div className="absolute right-2 top-2 z-20" ref={openMenuProjectId === project.id ? menuRef : null}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuProjectId((prev) => (prev === project.id ? null : project.id));
                  }}
                  aria-label="Project actions"
                  title="Project actions"
                  className="h-8 w-8 rounded-md border flex items-center justify-center transition-colors"
                  style={{
                    borderColor: colors.border.faint,
                    backgroundColor: colors.bg.card,
                    color: colors.text.primary,
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="6" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                    <circle cx="12" cy="18" r="1.8" />
                  </svg>
                </button>

                {openMenuProjectId === project.id && (
                  <div
                    className="absolute right-0 mt-1 w-36 rounded-lg border py-1 shadow-xl"
                    style={{
                      borderColor: colors.border.faint,
                      backgroundColor: colors.bg.card,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleEditProject(project.id, project.title)}
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-90"
                      style={{ color: colors.text.primary }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a1.875 1.875 0 1 1 2.652 2.652L8.25 17.403 4.5 18.75l1.347-3.75L16.862 3.487Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 4.5l3.75 3.75" />
                      </svg>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project.id, project.title)}
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-90"
                      style={{ color: '#f87171' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Thumbnail */}
              <div
                className="relative rounded-lg overflow-hidden mb-3 transition-all group-hover/card:shadow-2xl h-[180px] w-full flex items-center justify-center"
                style={{
                  background: colors.bg.elevated,
                  boxShadow: theme === 'dark'
                    ? '0 2px 8px rgba(0,0,0,0.4)'
                    : '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                <DraftPreviewThumbnail
                  projectId={project.id}
                  borderColor={colors.border.faint}
                  bgColor={colors.bg.elevated}
                  className="w-full h-full rounded-lg"
                />
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
                <label className="block text-sm font-medium mb-1.5" style={{ color: colors.text.primary }}>Industry / Store type</label>
                <select
                  data-industry-select="true"
                  value={createIndustry}
                  onChange={(e) => setCreateIndustry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border bg-transparent focus:outline-none focus:ring-2"
                  style={{ borderColor: colors.border.default, color: colors.text.primary }}
                  required
                >
                  <option value="" disabled>Select industry</option>
                  {INDUSTRY_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
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
