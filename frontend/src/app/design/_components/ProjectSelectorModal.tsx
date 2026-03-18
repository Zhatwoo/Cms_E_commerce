"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  listTrashedProjects,
  restoreProject,
  permanentDeleteProject,
  getStoredUser,
  type Project,
} from '@/lib/api';
import { ensureProjectStorageFolder } from '@/lib/firebaseStorage';
import { getLimits } from '@/lib/subscriptionLimits';
import { INDUSTRY_OPTIONS } from '@/lib/industryCatalog';
import { DraftPreviewThumbnail } from '@/app/m_dashboard/components/projects/DraftPreviewThumbnail';
import { useTheme } from '@/app/m_dashboard/components/context/theme-context';

function formatEdited(dateStr?: string) {
  if (!dateStr) return 'Edited recently';
  const diffMs = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 60) return `${mins || 1} min${mins === 1 ? '' : 's'} ago`;
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  return `${days || 1} day${days === 1 ? '' : 's'} ago`;
}

interface Props {
  asPage?: boolean;
}
type View = 'select' | 'create';

export function ProjectSelectorModal({ asPage = false }: Props) {
  const router = useRouter();
  const { theme } = useTheme();

  const [view, setView] = useState<View>('select');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningProjectId, setActioningProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubdomain, setEditSubdomain] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null);

  const [projectTab, setProjectTab] = useState<'active' | 'trash'>('active');
  const [trashedProjects, setTrashedProjects] = useState<Project[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant?: 'danger' | 'primary' | 'warning';
    action: () => void;
  }>({ isOpen: false, title: '', message: '', confirmText: '', action: () => { } });

  const [title, setTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  // Loads the user's active projects for the selector list.
  const loadActiveProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProjects();
      if (res.success && res.projects) setProjects(res.projects);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveProjects();
  }, [loadActiveProjects]);

  useEffect(() => {
    if (!activeMenuProjectId) return;
    // Close any open per-project menu when clicking outside.
    const closeMenu = () => setActiveMenuProjectId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [activeMenuProjectId]);

  useEffect(() => {
    if (projectTab !== 'trash') return;
    // Trash data is loaded lazily only when the Trash tab is opened.
    let cancelled = false;
    setTrashLoading(true);
    listTrashedProjects()
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.projects) {
          setTrashedProjects(res.projects);
        } else {
          setTrashedProjects([]);
        }
      })
      .catch(() => { if (!cancelled) setTrashedProjects([]); })
      .finally(() => { if (!cancelled) setTrashLoading(false); });
    return () => { cancelled = true; };
  }, [projectTab]);

  const openProject = (projectId: string) => router.push(`/design?projectId=${projectId}`);

  const startEditProject = (project: Project) => {
    setActiveMenuProjectId(null);
    setEditingProjectId(project.id);
    setEditTitle(project.title || '');
    setEditSubdomain(project.subdomain || '');
    setEditError('');
  };

  const cancelEditProject = () => {
    setEditingProjectId(null);
    setEditTitle('');
    setEditSubdomain('');
    setEditError('');
  };

  const handleSaveProjectEdit = async (project: Project) => {
    const trimmedTitle = editTitle.trim() || 'Untitled Project';
    const trimmedSubdomain = editSubdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    try {
      setSavingEdit(true);
      setEditError('');
      const res = await updateProject(project.id, { title: trimmedTitle, subdomain: trimmedSubdomain || null });
      if (!res.success) {
        setEditError(res.message || 'Failed to update project.');
        return;
      }
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, ...(res.project || { title: trimmedTitle, subdomain: trimmedSubdomain || null, updatedAt: new Date().toISOString() }) } : p));
      if (!res.project) await loadActiveProjects();
      cancelEditProject();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setEditError(msg || 'Failed to update project. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedTitle = title.trim() || 'Untitled Project';
    const trimmedIndustry = industry.trim();
    const trimmedSub = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    if (!trimmedIndustry) return setError('Please select your store industry.');

    try {
      setCreating(true);
      const user = getStoredUser();
      const plan = user?.subscriptionPlan || 'free';
      const limits = getLimits(plan);

      // Enforce subscription-based project limits before creating.
      if (projects.length >= limits.projects) return setError(`Your ${plan} plan allows up to ${limits.projects} projects. Upgrade to unlock more.`);

      const res = await createProject({ title: trimmedTitle, industry: trimmedIndustry, subdomain: trimmedSub || undefined, templateId: null });
      if (!res.success || !res.project) return setError(res.message || 'Failed to create project. Please try again.');

      const clientName = (user?.name || user?.username || 'client').trim() || 'client';
      ensureProjectStorageFolder(clientName, res.project.title || 'website').catch(() => { });
      router.push(`/design?projectId=${res.project.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.includes('fetch') ? 'Cannot reach server. Make sure the backend is running.' : 'Failed to create project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleMoveToTrash = (project: Project) => {
    const normalizedStatus = String(project.status || '').trim().toLowerCase();
    // Prevent trashing projects that are currently live/published.
    if (normalizedStatus === 'published' || normalizedStatus === 'live') {
      setConfirmModal({
        isOpen: true,
        title: 'Cannot Delete Project',
        message: 'Published projects cannot be deleted. Please take down (unpublish) the website first.',
        confirmText: 'Got it',
        variant: 'warning',
        action: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
      });
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Move to Trash',
      message: `Are you sure you want to move "${project.title || 'Untitled Project'}" to the trash?`,
      confirmText: 'Move to Trash',
      variant: 'danger',
      action: async () => {
        try {
          setActioningProjectId(project.id);
          setActionError('');
          const res = await deleteProject(project.id);
          if (res.success) setProjects((prev) => prev.filter((p) => p.id !== project.id));
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (msg.includes('Project not found')) {
            setProjects((prev) => prev.filter((p) => p.id !== project.id));
          } else {
            setActionError(msg || 'Failed to move to trash.');
            setTimeout(() => setActionError(''), 4000);
          }
        } finally {
          setActioningProjectId(null);
          setActiveMenuProjectId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleRestoreProject = (project: Project) => {
    setConfirmModal({
      isOpen: true,
      title: 'Restore Project',
      message: `Are you sure you want to restore "${project.title || 'Untitled Project'}"? It will move back to your active projects.`,
      confirmText: 'Restore Project',
      variant: 'primary',
      action: async () => {
        try {
          setActioningProjectId(project.id);
          setActionError('');
          const res = await restoreProject(project.id);
          if (res.success) {
            setTrashedProjects((prev) => prev.filter((p) => p.id !== project.id));
            loadActiveProjects();
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (msg.includes('Project not found')) {
            setTrashedProjects((prev) => prev.filter((p) => p.id !== project.id));
          } else {
            setActionError(msg || 'Failed to restore project.');
            setTimeout(() => setActionError(''), 4000);
          }
        } finally {
          setActioningProjectId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handlePermanentDeleteProject = (project: Project) => {
    const projectId = project.id;
    const projectTitle = project.title || 'Untitled Project';
    // Two-step confirmation to reduce accidental permanent deletion.
    setConfirmModal({
      isOpen: true,
      title: 'Delete Permanently?',
      message: `Are you sure you want to permanently delete "${projectTitle}"? This action cannot be undone.`,
      confirmText: 'Yes, delete',
      variant: 'danger',
      action: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setConfirmModal({
          isOpen: true,
          title: 'Final Confirmation',
          message: `This will permanently remove "${projectTitle}" from the database. This cannot be undone. Delete anyway?`,
          confirmText: 'Delete Permanently',
          variant: 'danger',
          action: async () => {
            try {
              setActioningProjectId(projectId);
              setActionError('');
              const res = await permanentDeleteProject(projectId);
              if (!res.success) return;
              setTrashedProjects((prev) => prev.filter((p) => p.id !== projectId));
            } catch (err) {
              const msg = err instanceof Error ? err.message : '';
              if (msg.includes('Project not found') || msg.includes('not found')) {
                setTrashedProjects((prev) => prev.filter((p) => p.id !== projectId));
              } else {
                setActionError(msg || 'Failed to delete permanently.');
                setTimeout(() => setActionError(''), 4000);
              }
            } finally {
              setActioningProjectId(null);
              setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            }
          }
        });
      }
    });
  };

  const filteredProjects = projects.filter((p) => (p.title || 'Untitled Project').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTrashedProjects = trashedProjects.filter((p) => (p.title || 'Untitled Project').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={asPage ? 'project-selector-page dashboard-landing-light w-full py-1' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4'}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }} className={asPage ? 'relative w-full flex flex-col' : 'relative w-full max-w-2xl rounded-2xl border border-[#1F1F51] bg-[#0E0C30] shadow-2xl overflow-hidden flex flex-col'} style={asPage ? undefined : { maxHeight: '85vh' }}>
        <div className={`px-7 pt-7 pb-5 shrink-0 ${asPage ? 'relative' : 'flex items-start justify-between border-b border-[#1F1F51]'}`}>
          <div className={asPage ? 'w-full max-w-4xl mx-auto text-center' : 'flex-1 pr-4'}>
            {asPage ? (
              <>
                {/* Page variant uses dashboard-like hero typography for visual consistency. */}
                <h2 className="text-4xl sm:text-6xl lg:text-[76px] font-black leading-tight tracking-tight [font-family:var(--font-outfit),sans-serif]">
                  <span className={`block ${theme === 'dark' ? 'text-white' : 'text-[#120533]'}`}>
                    {view === 'select' ? 'Open a' : 'Create new'}{' '}
                    <span
                      style={{
                        backgroundImage: theme === 'dark'
                          ? 'linear-gradient(90deg, #7c3aed 0%, #d946ef 50%, #ffcc00 100%)'
                          : 'linear-gradient(90deg, #7c3aed 0%, #d946ef 50%, #f5a213 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent',
                        display: 'inline-block'
                      }}
                    >
                      Project
                    </span>
                  </span>
                </h2>
                <p className={`text-base sm:text-lg mt-2 ${theme === 'dark' ? 'text-[#8A8FC4]' : 'text-[#120533]/70'}`}>
                  {view === 'select' ? 'Select an existing project or start a new one.' : 'Give your project a name and an optional subdomain.'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{view === 'select' ? 'Open a project' : 'Create new project'}</h2>
                <p className="text-base sm:text-lg text-[#8A8FC4] mt-1.5">{view === 'select' ? 'Select an existing project or start a new one.' : 'Give your project a name and an optional subdomain.'}</p>
              </>
            )}
            {view === 'select' && (
              <div className={`w-full ${asPage ? 'mt-8 space-y-8' : 'mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'}`}>
                {asPage ? (
                  <>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {/* Active / Trash tab switcher: matches dashboard hero tab gradient active state. */}
                      <div className="flex items-center gap-8 text-xs uppercase font-bold tracking-widest [font-family:var(--font-outfit),sans-serif]">
                        {([
                          { id: 'active', label: 'ACTIVE' },
                          { id: 'trash', label: 'TRASH' }
                        ] as const).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setProjectTab(tab.id)}
                            className={`
                              cursor-pointer relative pb-1 transition-all duration-300
                              ${projectTab === tab.id
                                ? (theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#120533]')
                                : (theme === 'dark' ? 'text-[#807FAF]' : 'text-[#120533]/50')
                              }
                              hover:opacity-70
                            `}
                          >
                            {tab.label}
                            {projectTab === tab.id && (
                              <motion.span
                                layoutId="project-selector-tab-underline"
                                className="absolute left-0 right-0 -bottom-0.5 h-[2.5px] rounded-full"
                                style={{
                                  background: theme === 'dark'
                                    ? 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)'
                                    : 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)'
                                }}
                                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`
                        m-dashboard-search-shadow w-full max-w-4xl rounded-2xl px-5 py-3.5 flex items-center gap-3 border
                        transition-all duration-500
                        ${theme === 'dark'
                          ? 'bg-[#141446] border-[#1F1F51]'
                          : 'admin-dashboard-panel-soft border-0'}
                        ${theme === 'light' && 'shadow-[0_0_15px_rgba(139,92,246,0.1),0_0_1px_rgba(139,92,246,0.2)]'}
                        ${theme === 'dark' && 'shadow-[0_0_12px_rgba(31,31,81,0.4)]'}
                      `}
                    >
                      <div className="relative">
                        {theme === 'light' && (
                          <div className="absolute inset-0 bg-[#8B5CF6] blur-md opacity-20 scale-150 rounded-full" />
                        )}
                        <svg
                          viewBox="0 0 20 20"
                          className={`h-4 w-4 shrink-0 relative z-10 transition-all duration-300 ${theme === 'dark' ? 'text-[#FFCE00] filter-[drop-shadow(0_0_5px_rgba(255,206,0,0.6))]' : 'text-[#8B5CF6]'}`}
                          fill="none"
                        >
                          <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full bg-transparent outline-none text-sm font-medium ${theme === 'dark' ? 'text-white placeholder:text-[#6F70A8]' : 'text-[#120533] placeholder:text-[#120533]/30'}`}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Modal: compact Active / Trash tab switcher */}
                    <div className="inline-flex items-center gap-6 text-[11px] uppercase font-bold tracking-widest [font-family:var(--font-outfit),sans-serif]">
                      {([
                        { id: 'active', label: 'ACTIVE' },
                        { id: 'trash', label: 'TRASH' }
                      ] as const).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setProjectTab(tab.id)}
                          className={`
                            cursor-pointer relative pb-1 transition-all duration-300
                            ${projectTab === tab.id
                              ? (theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#120533]')
                              : (theme === 'dark' ? 'text-[#807FAF]' : 'text-[#120533]/50')
                            }
                            hover:opacity-70
                          `}
                        >
                          {tab.label}
                          {projectTab === tab.id && (
                            <motion.span
                              layoutId="project-selector-tab-underline"
                              className="absolute left-0 right-0 -bottom-0.5 h-[2.5px] rounded-full"
                              style={{
                                background: theme === 'dark'
                                  ? 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)'
                                  : 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)'
                              }}
                              transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Modal: compact search bar and view mode toggle */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8FC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-3 py-1.5 rounded-lg bg-[#0F0D3A] border border-[#2A2A60] text-xs text-white placeholder:text-[#8A8FC4] focus:outline-none focus:border-[#6B72D8] w-full sm:w-48 transition-colors" />
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-lg border border-[#2A2A60] bg-[#0F0D3A] p-1 shrink-0">
                        <button onClick={() => setViewMode('grid')} className={`p-1 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#2D3A90] text-white' : 'text-[#8A8FC4] hover:text-white hover:bg-white/5'}`} title="Grid View">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-1 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#2D3A90] text-white' : 'text-[#8A8FC4] hover:text-white hover:bg-white/5'}`} title="List View">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action error banner: briefly shown after a failed project action (trash, restore, etc.) */}
        {actionError && (
          <div className="mx-7 mb-0 px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-sm">
            {actionError}
          </div>
        )}

        <div className={`flex-1 overflow-y-auto min-h-0 ${asPage ? 'px-0 pb-2 border-[#1F1F51] pt-6' : 'p-7 pt-4'}`}>
          <div className={asPage ? 'w-full px-4 lg:px-[120px]' : ''}>
            <AnimatePresence mode="wait">
              {view === 'select' && (
                <motion.div key="select" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
                  {projectTab === 'active' && !asPage && (
                    // Quick entry point to switch from selection flow to creation flow.
                    <div role="button" tabIndex={0} onClick={() => setView('create')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setView('create'); } }}
                      className={`${(viewMode === 'list' || !asPage) ? 'w-full' : 'w-full sm:w-[260px]'} ${viewMode === 'list' ? 'h-[96px]' : 'h-[72px] sm:h-[76px]'} flex items-center gap-4 px-5 rounded-xl border border-dashed border-[#3A3A7A] bg-[#14113A] hover:bg-[#1A1750] hover:border-[#FFCE00]/50 transition-all group mb-6`}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FFCE00]/10 group-hover:bg-[#FFCE00]/20 transition-colors shrink-0"><svg className="w-5 h-5 text-[#FFCE00]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></div>
                      <div className="text-left py-2"><p className="text-sm font-semibold text-white">Create new project</p><p className="text-xs text-[#8A8FC4]">Start from a blank canvas or a template</p></div>
                    </div>
                  )}

                  {/* Project list: shows a loading spinner, empty state, or the grid/list of project cards */}
                  {loading && projectTab === 'active' ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3"><div className="w-6 h-6 border-2 border-[#FFCE00] border-t-transparent rounded-full animate-spin" /><p className="text-sm text-[#8A8FC4]">Loading projects…</p></div>
                  ) : projectTab === 'active' && filteredProjects.length === 0 && !asPage ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                      <svg className={`w-10 h-10 ${theme === 'dark' ? 'text-[#3A3A7A]' : 'text-[#8B5CF6]/40'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                      <p className={`text-sm ${theme === 'dark' ? 'text-[#8A8FC4]' : 'text-[#120533]/70'}`}>{searchQuery ? 'No projects match your search.' : 'No projects yet. Create your first one!'}</p>
                      {!searchQuery && (
                        <button
                          type="button"
                          onClick={() => setView('create')}
                          className={`
                            inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5
                            ${theme === 'dark'
                              ? 'bg-[#FFCE00] text-[#11134D] hover:shadow-[0_8px_24px_rgba(255,206,0,0.35)]'
                              : 'bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white hover:shadow-[0_8px_24px_rgba(147,51,234,0.35)]'
                            }
                          `}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          Create project
                        </button>
                      )}
                    </div>
                  ) : trashLoading && projectTab === 'trash' ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 gap-3"><div className="w-6 h-6 border-2 border-[#FFCE00] border-t-transparent rounded-full animate-spin" /><p className="text-sm text-[#8A8FC4]">Loading trash…</p></div>
                  ) : projectTab === 'trash' && filteredTrashedProjects.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 gap-2 text-center"><svg className="w-10 h-10 text-[#3A3A7A]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg><p className="text-sm text-[#8A8FC4]">{searchQuery ? 'No templates match your search.' : 'Trash is empty.'}</p></div>
                  ) : (
                    // Unified renderer for active/trash collections; source list switches by tab.
                    <div className={`grid ${asPage ? 'gap-4 sm:gap-5' : 'gap-4'} ${viewMode === 'grid' ? (asPage ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3') : 'grid-cols-1'}`}>
                      {asPage && projectTab === 'active' && (
                        <button
                          type="button"
                          onClick={() => setView('create')}
                          className={`
                            group relative flex flex-col overflow-hidden
                            w-full rounded-[32px] border transition-all duration-500 hover:-translate-y-1
                            ${theme === 'dark'
                              ? 'bg-[#15093E] border-[#272261] shadow-[0_20px_40px_rgba(0,0,0,0.3)]'
                              : 'admin-dashboard-panel border-0'}
                          `}
                        >
                          <div className={`absolute top-6 right-6 transition-opacity duration-500 group-hover:opacity-100 opacity-20 z-10 ${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'}`}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 0V14M0 7H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                          </div>
                          <div className="w-full aspect-video flex items-center justify-center relative">
                            <div className={`h-18 w-18 rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 ${theme === 'dark' ? 'bg-[#FFCE00] text-[#11134D] shadow-[0_0_30px_rgba(255,206,0,0.2)]' : 'bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white shadow-[0_8px_24px_rgba(217,70,239,0.4)]'}`}>
                              <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>
                            </div>
                          </div>
                          <div className="p-6 flex flex-col items-center gap-1">
                            <span className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#120533]'}`}>New Project</span>
                            <span className={`h-1 w-8 rounded-full transition-all duration-500 scale-x-0 group-hover:scale-x-100 ${theme === 'dark' ? 'bg-[#FFCE00]' : 'bg-[#8B5CF6]'}`} />
                            {/* Spacer to simulate the metadata line in project cards for perfect height matching */}
                            <div className="h-5" /> 
                          </div>
                        </button>
                      )}
                      {(projectTab === 'active' ? filteredProjects : filteredTrashedProjects).map((project) => {
                        const daysLeft = Number.isFinite(project.daysLeft) ? Number(project.daysLeft) : null;
                        return (
                          <div key={project.id} className={`group relative border overflow-hidden ${asPage ? `rounded-[32px] ${theme === 'dark' ? 'bg-[#15093E] border-[#272261] shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-[#FFCE00]/50' : 'admin-dashboard-panel border-0 hover:shadow-[0_20px_40px_rgba(123,78,192,0.2)]'} hover:-translate-y-1` : 'rounded-2xl border-[#2A2A60] bg-[#141140] hover:bg-[#1A1750] hover:border-[#6B72D8]'} transition-all ${activeMenuProjectId === project.id ? 'z-40' : 'z-0'} 
                            ${editingProjectId === project.id ? 'flex flex-col h-auto p-0 overflow-visible' : (viewMode === 'list' ? 'flex flex-row items-center h-[96px] p-0' : 'flex flex-col h-full p-0')}`}>
                            {/* Three-dot context menu (⋮): mirrors dashboard card action menu and keeps trash cards compact. */}
                            {editingProjectId !== project.id && (projectTab === 'trash' || !project.isShared) && (
                              <div className="absolute top-3 right-3 z-50" onClick={(e) => e.stopPropagation()}>
                                {/* Three-dot button (⋮): toggles the dropdown */}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setActiveMenuProjectId((prev) => (prev === project.id ? null : project.id)); }}
                                  aria-label="Open project actions"
                                  title="Open project actions"
                                  className={asPage
                                    ? `cursor-pointer h-8 w-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${theme === 'dark' ? 'bg-black/20 text-white/40 hover:text-white' : 'bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white'}`
                                    : 'h-8 w-8 rounded-md bg-[#0E0D3D]/80 backdrop-blur-md text-[#8A8FC4] border border-[#2A2A60] hover:text-[#FFCE00] hover:border-[#6B72D8] transition-colors flex items-center justify-center'}
                                >
                                  <svg className={asPage ? 'w-5 h-5' : 'w-4 h-4'} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="6" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="18" r="1.8" /></svg>
                                </button>
                                {activeMenuProjectId === project.id && (
                                  <div className={asPage ? `absolute right-0 mt-2 w-44 rounded-2xl border p-1 shadow-xl animate-in fade-in zoom-in duration-200 z-50 ${theme === 'dark' ? 'bg-[#15093E] border-[#272261] text-white' : 'bg-white border-[#8B5CF6]/20 text-slate-700'}` : 'absolute right-0 mt-2 w-40 rounded-xl border border-[#2A2A60] bg-[#0F0D38] py-1 shadow-2xl z-50'}>
                                    {projectTab === 'active' ? (
                                      <>
                                        {/* Dropdown item: edit project name and subdomain */}
                                        <button type="button" onClick={(e) => { e.stopPropagation(); startEditProject(project); }} className={asPage ? 'w-full px-3 py-2 rounded-xl text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors' : 'w-full px-4 py-2 text-left text-sm text-white flex items-center gap-2 hover:bg-white/5'}><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a1.875 1.875 0 1 1 2.652 2.652L8.25 17.403 4.5 18.75l1.347-3.75L16.862 3.487Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 4.5l3.75 3.75" /></svg> Edit Details</button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveToTrash(project); }} disabled={actioningProjectId === project.id} className={asPage ? 'w-full px-3 py-2 rounded-xl text-left text-sm !text-[#BE123C] bg-[#FFF1F2] border border-[#FDA4AF] font-semibold flex items-center gap-2 hover:bg-[#FFE4E6] transition-colors disabled:!text-[#BE123C] disabled:bg-[#FFF1F2] disabled:border-[#FDA4AF] disabled:opacity-100' : 'w-full px-4 py-2 text-left text-sm text-red-400 flex items-center gap-2 hover:bg-red-500/10 disabled:opacity-80 disabled:text-red-300'}>
                                          {actioningProjectId === project.id ? <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V1C6.477 1 2 5.477 2 11h2z" /></svg> : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}<span className="truncate !text-[#BE123C]">Move to trash</span>
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleRestoreProject(project); }} disabled={actioningProjectId === project.id} className={asPage ? 'w-full px-3 py-2 rounded-xl text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50' : 'w-full px-4 py-2 text-left text-sm text-white flex items-center gap-2 hover:bg-white/5 disabled:opacity-50'}>
                                          {actioningProjectId === project.id ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V1C6.477 1 2 5.477 2 11h2z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>} Restore
                                        </button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); handlePermanentDeleteProject(project); }} disabled={actioningProjectId === project.id} className={asPage ? 'w-full px-3 py-2 rounded-xl text-left text-sm !text-[#BE123C] bg-[#FFF1F2] border border-[#FDA4AF] font-semibold flex items-center gap-2 hover:bg-[#FFE4E6] transition-colors disabled:!text-[#BE123C] disabled:bg-[#FFF1F2] disabled:border-[#FDA4AF] disabled:opacity-100' : 'w-full px-4 py-2 text-left text-sm text-red-400 flex items-center gap-2 hover:bg-red-500/10 disabled:opacity-80 disabled:text-red-300'}>
                                          {actioningProjectId === project.id ? <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V1C6.477 1 2 5.477 2 11h2z" /></svg> : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}<span className="truncate !text-[#BE123C]">Delete Permanently</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Card content: inline edit form when editing a project, otherwise the standard project card */}
                            {editingProjectId === project.id ? (
                              <div className="w-full space-y-4 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Text fields for renaming the project and updating the subdomain */}
                                <div className="space-y-3">
                                  <div><label className="block text-xs font-medium text-[#8A8FC4] mb-1.5">Project Name</label><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#2A2A60] bg-[#0A0826] text-white text-sm focus:outline-none focus:border-[#6B72D8] transition-colors" placeholder="Untitled Project" autoFocus /></div>
                                  <div><label className="block text-xs font-medium text-[#8A8FC4] mb-1.5">Subdomain</label><input type="text" value={editSubdomain} onChange={(e) => setEditSubdomain(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#2A2A60] bg-[#0A0826] text-white text-sm focus:outline-none focus:border-[#6B72D8] transition-colors" placeholder="mystore" /><p className="text-[10px] text-[#6B6FA0] mt-1.5">Letters, numbers, and hyphens only.</p></div>
                                </div>
                                {editError && <p className="text-xs text-red-400">{editError}</p>}
                                <div className="flex justify-end gap-2 pt-2 border-t border-[#2A2A60]/50"><button type="button" onClick={cancelEditProject} disabled={savingEdit} className="px-4 py-2 rounded-lg text-xs font-medium text-[#8A8FC4] hover:text-white hover:bg-white/5 disabled:opacity-50 transition-colors">Cancel</button><button type="button" onClick={() => handleSaveProjectEdit(project)} disabled={savingEdit} className="px-4 py-2 rounded-lg text-xs font-medium text-[#121241] bg-[#FFCE00] hover:bg-[#FFD740] disabled:opacity-50 transition-all shadow-md active:scale-95">{savingEdit ? 'Saving…' : 'Save Changes'}</button></div>
                              </div>
                            ) : (
                              <div role="button" tabIndex={0} onClick={() => projectTab === 'active' && openProject(project.id)} className={`${projectTab === 'trash' ? 'cursor-default' : 'cursor-pointer'} ${viewMode === 'list' ? 'flex flex-row items-center w-full h-full' : 'w-full text-left flex flex-col h-full'}`}>
                                <div className={`${viewMode === 'list' ? 'w-40 h-full border-r border-[#2A2A60] shrink-0' : `${asPage ? 'w-full aspect-video' : 'w-full aspect-[16/10] border-b border-[#2A2A60]'}`} overflow-hidden ${asPage ? (theme === 'dark' ? 'bg-[#0A0A26]' : 'bg-white') : 'bg-[#0A0826]'} ${projectTab === 'trash' ? 'grayscale opacity-75' : ''}`}>
                                  {/* Project thumbnail: shows a saved screenshot, or auto-generates a draft preview */}
                                  {project.thumbnail ? (
                                    <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                  ) : (
                                    <DraftPreviewThumbnail projectId={project.id} borderColor="transparent" bgColor={asPage ? (theme === 'dark' ? '#0A0A26' : '#ffffff') : '#0A0826'} className={`w-full h-full !aspect-auto !rounded-none object-cover ${projectTab !== 'trash' && 'transition-transform duration-700 group-hover:scale-105'}`} />
                                  )}
                                </div>
                                <div className={`${viewMode === 'list' ? 'px-6 py-4 flex-1 flex flex-row items-center justify-between min-w-0' : `${asPage ? 'p-6' : 'px-5 py-4'} flex flex-col flex-1`}`}>
                                  {/* Project info: title, status badge (Published/Draft/Shared), and metadata */}
                                  <div className={`${viewMode === 'list' ? 'flex-1 min-w-0 pr-4' : 'w-full'}`}>
                                    {/* Project title and status badges (Published / Draft / Shared with me) */}
                                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                                      <p className={`text-[17px] font-bold leading-tight truncate transition-colors ${asPage ? (theme === 'dark' ? 'text-white group-hover:text-[#FFCE00]' : 'text-[#120533] group-hover:text-[#8B5CF6]') : 'text-white group-hover:text-[#FFCE00]'}`}>{project.title || 'Untitled Project'}</p>
                                      {(project.status === 'published' || project.status === 'live') ? <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20">Published</span> : <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#3A3A7A]/30 text-[#8A8FC4] border border-[#3A3A7A]/40">Draft</span>}
                                      {project.isShared && <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">Shared with me</span>}
                                    </div>
                                    {/* Subtitle: owner name (shared), days-until-deletion (trash), or last edit time (active) */}
                                    <p className={`text-[13px] truncate ${asPage ? (theme === 'dark' ? 'text-[#6F70A8]' : 'text-[#8B5CF6]/70') : 'text-[#6B6FA0]'}`}>
                                      {project.isShared ? `by ${project.ownerName || 'Unknown'}` : (projectTab === 'trash' ? (daysLeft == null ? 'Unavailable' : `${daysLeft} days until permanent deletion`) : formatEdited(project.updatedAt ?? project.createdAt))}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {view === 'create' && (
                <motion.div key="create" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>
                  <form onSubmit={handleCreate} className={`${asPage ? `space-y-5 max-w-3xl mx-auto p-6 sm:p-8 rounded-4xl border ${theme === 'dark' ? 'bg-[#15093E] border-[#272261] shadow-[0_20px_40px_rgba(0,0,0,0.3)]' : 'admin-dashboard-panel border-0'}` : 'space-y-5 max-w-xl mx-auto'}`}>
                    {/* Project title input */}
                    <div><label className={`block text-sm font-medium mb-1.5 ${asPage ? (theme === 'dark' ? 'text-[#C4C6E8]' : 'text-[#120533]') : 'text-[#C4C6E8]'}`}>Project title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Store" autoFocus className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${asPage ? (theme === 'dark' ? 'border-[#2A2A60] bg-[#0A0826] text-white placeholder:text-[#4A4A7E] focus:border-[#6B72D8]' : 'border-[#8B5CF6]/30 bg-[#F8F7FF] text-[#120533] placeholder:text-[#8B5CF6]/50 focus:border-[#8B5CF6]') : 'border-[#2A2A60] bg-[#0A0826] text-white placeholder:text-[#4A4A7E] focus:border-[#6B72D8]'} focus:outline-none shadow-inner`} /></div>
                    {/* Industry / store type dropdown */}
                    <div>
                      <label htmlFor="project-industry" className={`block text-sm font-medium mb-1.5 ${asPage ? (theme === 'dark' ? 'text-[#C4C6E8]' : 'text-[#120533]') : 'text-[#C4C6E8]'}`}>Industry / Store type</label>
                      <select id="project-industry" data-industry-select="true" value={industry} onChange={(e) => setIndustry(e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${asPage ? (theme === 'dark' ? 'border-[#2A2A60] bg-[#0A0826] text-white focus:border-[#6B72D8]' : 'border-[#8B5CF6]/30 bg-[#F8F7FF] text-[#120533] focus:border-[#8B5CF6]') : 'border-[#2A2A60] bg-[#0A0826] text-white focus:border-[#6B72D8]'} focus:outline-none shadow-inner`} required>
                        <option value="" disabled>Select industry</option>
                        {INDUSTRY_OPTIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                      </select>
                    </div>
                    {/* Optional subdomain input - e.g. "mystore" becomes mystore.yourdomain.com */}
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${asPage ? (theme === 'dark' ? 'text-[#C4C6E8]' : 'text-[#120533]') : 'text-[#C4C6E8]'}`}>Preferred subdomain <span className={`${asPage ? (theme === 'dark' ? 'text-[#6B6FA0]' : 'text-[#8B5CF6]/70') : 'text-[#6B6FA0]'} font-normal`}>(optional)</span></label>
                      <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="mystore" className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${asPage ? (theme === 'dark' ? 'border-[#2A2A60] bg-[#0A0826] text-white placeholder:text-[#4A4A7E] focus:border-[#6B72D8]' : 'border-[#8B5CF6]/30 bg-[#F8F7FF] text-[#120533] placeholder:text-[#8B5CF6]/50 focus:border-[#8B5CF6]') : 'border-[#2A2A60] bg-[#0A0826] text-white placeholder:text-[#4A4A7E] focus:border-[#6B72D8]'} focus:outline-none shadow-inner`} />
                      <p className={`text-xs mt-2 ${asPage ? (theme === 'dark' ? 'text-[#6B6FA0]' : 'text-[#8B5CF6]/70') : 'text-[#6B6FA0]'}`}>Only letters, numbers, and hyphens. e.g. <span className={`${asPage ? (theme === 'dark' ? 'text-[#8A8FC4]' : 'text-[#8B5CF6]') : 'text-[#8A8FC4]'}`}>mystore → mystore.yourdomain.com</span></p>
                    </div>
                    {/* Error message: shown when project creation fails (e.g. plan limit reached, server error) */}
                    {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 shadow-sm"><p className="text-sm text-red-400">{error}</p></div>}
                    {/* Form actions: Cancel returns to project list; Submit creates the project and opens it in the editor */}
                    <div className={`flex justify-end gap-3 pt-4 border-t mt-6 ${asPage ? (theme === 'dark' ? 'border-[#272261]' : 'border-[#8B5CF6]/20') : 'border-[#1F1F51]'}`}>
                      <button type="button" onClick={() => { setView('select'); setError(''); }} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${asPage ? (theme === 'dark' ? 'text-[#8A8FC4] hover:text-white hover:bg-white/5' : 'text-[#8B5CF6] hover:bg-[#8B5CF6]/10') : 'text-[#8A8FC4] hover:text-white hover:bg-white/5'}`}>Cancel</button>
                      <button type="submit" disabled={creating} className={`px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[140px] ${asPage ? (theme === 'dark' ? 'bg-[#FFCE00] text-[#121241] hover:bg-[#FFD740] shadow-lg shadow-[#FFCE00]/20' : 'bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white shadow-[0_8px_24px_rgba(217,70,239,0.4)]') : 'bg-[#FFCE00] text-[#121241] hover:bg-[#FFD740] shadow-lg shadow-[#FFCE00]/20'}`}>{creating ? <span className="flex items-center gap-2"><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</span> : 'Create & open'}</button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal Overlay */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ duration: 0.2, type: 'spring', bounce: 0.25 }} className={`w-full max-w-100 rounded-3xl border ${confirmModal.variant === 'danger' ? 'border-red-500/30' : confirmModal.variant === 'primary' ? 'border-[#2D3A90]/50' : 'border-yellow-500/30'} bg-[#0A0826] shadow-2xl overflow-hidden flex flex-col`}>
              <div className="px-7 pt-7 pb-4">
                <div className={`w-12 h-12 rounded-2xl ${confirmModal.variant === 'danger' ? 'bg-red-500/10 border-red-500/20' : confirmModal.variant === 'primary' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-yellow-500/10 border-yellow-500/20'} border flex items-center justify-center mb-5`}>
                  {confirmModal.variant === 'danger' ? (
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  ) : confirmModal.variant === 'primary' ? (
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  ) : (
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{confirmModal.title}</h3>
                <p className="text-[#8A8FC4] text-sm leading-relaxed">{confirmModal.message}</p>
              </div>
              <div className="px-7 py-5 flex items-center gap-3 bg-[#110E33] border-t border-[#1F1F51]">
                {confirmModal.variant !== 'warning' && (
                  <button type="button" onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#8A8FC4] bg-[#0A0826] border border-[#2A2A60] hover:text-white hover:bg-[#1A1750] transition-colors">Cancel</button>
                )}
                <button type="button" onClick={confirmModal.action} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white ${confirmModal.variant === 'danger' ? 'bg-red-500 hover:bg-red-400 shadow-red-500/20' : confirmModal.variant === 'primary' ? 'bg-[#2D3A90] hover:bg-[#3E4AA3] shadow-blue-500/20' : 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/20'} border border-transparent transition-colors shadow-lg`}>{confirmModal.confirmText}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
