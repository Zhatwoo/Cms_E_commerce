"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  listProjects,
  updateProject,
  deleteProject,
  listTrashedProjects,
  restoreProject,
  permanentDeleteProject,
  type Project,
} from '@/lib/api';
import { ProjectCardContainer } from '@/app/m_dashboard/container/ProjectCardContainer';
import { useAlert } from '@/app/m_dashboard/components/context/alert-context';
import { useTheme } from '@/app/m_dashboard/components/context/theme-context';
import { TabBar, type TabBarItem } from '@/app/m_dashboard/components/ui/tabbar';
import { NewProjectButton } from '@/app/m_dashboard/components/buttons/NewProjectButton';
import { PopMenuOption } from '@/app/m_dashboard/components/buttons/PopMenuButton';
import { EditProjectModal } from '@/app/m_dashboard/components/projects/EditProjectModal';

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
type ProjectTabId = 'active' | 'trash';

const PROJECT_TABS: readonly TabBarItem<ProjectTabId>[] = [
  { id: 'active', label: 'ACTIVE' },
  { id: 'trash', label: 'TRASH' },
];

export function ProjectSelectorModal({ asPage = false }: Props) {
  const router = useRouter();
  const { showAlert, showConfirm } = useAlert();
  const { theme } = useTheme();

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

  const handleMoveToTrash = async (project: Project) => {
    if (actioningProjectId) return;
    const normalizedStatus = String(project.status || '').trim().toLowerCase();
    // Prevent trashing projects that are currently live/published.
    if (normalizedStatus === 'published' || normalizedStatus === 'live') {
      await showAlert('Published projects cannot be deleted. Please take down (unpublish) the website first.', 'Cannot Delete Project');
      return;
    }
    const confirmed = await showConfirm(
      `Are you sure you want to move "${project.title || 'Untitled Project'}" to the trash?`,
      'Move to Trash',
      { confirmText: 'Move to Trash', cancelText: 'Cancel' }
    );
    if (!confirmed) return;

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
    }
  };

  const handleRestoreProject = async (project: Project) => {
    if (actioningProjectId) return;
    const confirmed = await showConfirm(
      `Are you sure you want to restore "${project.title || 'Untitled Project'}"? It will move back to your active projects.`,
      'Restore Project',
      { confirmText: 'Restore Project', cancelText: 'Cancel' }
    );
    if (!confirmed) return;

    try {
      setActioningProjectId(project.id);
      setActionError('');
      const res = await restoreProject(project.id);
      if (res.success) {
        setTrashedProjects((prev) => prev.filter((p) => p.id !== project.id));
        await loadActiveProjects();
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
      setActiveMenuProjectId(null);
    }
  };

  const handlePermanentDeleteProject = async (project: Project) => {
    if (actioningProjectId) return;
    const projectId = project.id;
    const projectTitle = project.title || 'Untitled Project';
    // Two-step confirmation to reduce accidental permanent deletion.
    const firstConfirm = await showConfirm(
      `Are you sure you want to permanently delete "${projectTitle}"? This action cannot be undone.`,
      'Delete Permanently?',
      { confirmText: 'Yes, delete', cancelText: 'Cancel' }
    );
    if (!firstConfirm) return;

    const finalConfirm = await showConfirm(
      `This will permanently remove "${projectTitle}" from the database. This cannot be undone. Delete anyway?`,
      'Final Confirmation',
      { confirmText: 'Delete Permanently', cancelText: 'Cancel' }
    );
    if (!finalConfirm) return;

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
      setActiveMenuProjectId(null);
    }
  };

  const filteredProjects = projects.filter((p) => (p.title || 'Untitled Project').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTrashedProjects = trashedProjects.filter((p) => (p.title || 'Untitled Project').toLowerCase().includes(searchQuery.toLowerCase()));
  const editingProject = editingProjectId ? projects.find((p) => p.id === editingProjectId) ?? null : null;

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
                    Open a{' '}
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
                  Select an existing project or start a new one.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Open a project</h2>
                <p className="text-base sm:text-lg text-[#8A8FC4] mt-1.5">Select an existing project or start a new one.</p>
              </>
            )}
            <div className={`w-full ${asPage ? 'mt-8 space-y-8' : 'mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'}`}>
              {asPage ? (
                <>
                  <div className="flex items-center justify-center">
                    {/* Page variant: use custom TabBar component */}
                    <TabBar<ProjectTabId>
                      tabs={PROJECT_TABS}
                      activeTab={projectTab}
                      onTabChange={setProjectTab}
                      theme={theme as 'light' | 'dark'}
                      underlineLayoutId="project-selector-tab-underline"
                    />
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
                  {/* Modal: use custom TabBar component */}
                  <TabBar<ProjectTabId>
                    tabs={PROJECT_TABS}
                    activeTab={projectTab}
                    onTabChange={setProjectTab}
                    theme={theme as 'light' | 'dark'}
                    className="text-[11px]"
                    underlineLayoutId="project-selector-tab-underline-modal"
                  />
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
              <motion.div key="select" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
                  {projectTab === 'active' && !asPage && (
                    // Quick entry point to switch from selection flow to creation flow.
                    <div role="button" tabIndex={0} onClick={() => router.push('/m_dashboard/projects/new')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/m_dashboard/projects/new'); } }}
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
                          onClick={() => router.push('/m_dashboard/projects/new')}
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
                        <NewProjectButton
                          theme={theme}
                          onCreateProject={() => router.push('/m_dashboard/projects/new')}
                        />
                      )}
                      {(projectTab === 'active' ? filteredProjects : filteredTrashedProjects).map((project) => {
                        const daysLeft = Number.isFinite(project.daysLeft) ? Number(project.daysLeft) : null;
                        const isProjectActioning = actioningProjectId === project.id;
                        
                        // Build context-aware menu options based on active vs trash tab
                        const buildMenuOptions = (proj: Project): PopMenuOption[] => {
                          if (projectTab === 'active') {
                            return [
                              {
                                key: 'edit',
                                label: isProjectActioning ? 'Working...' : 'Edit Details',
                                onSelect: () => startEditProject(proj),
                                disabled: isProjectActioning,
                                icon: (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a1.875 1.875 0 1 1 2.652 2.652L8.25 17.403 4.5 18.75l1.347-3.75L16.862 3.487Z" />
                                  </svg>
                                ),
                              },
                              {
                                key: 'delete',
                                label: isProjectActioning ? 'Working...' : 'Move to trash',
                                onSelect: () => handleMoveToTrash(proj),
                                className: 'text-red-500',
                                disabled: isProjectActioning,
                                icon: (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                ),
                              },
                            ];
                          } else {
                            // Trash tab menu options
                            return [
                              {
                                key: 'restore',
                                label: isProjectActioning ? 'Working...' : 'Restore',
                                onSelect: () => handleRestoreProject(proj),
                                disabled: isProjectActioning,
                                icon: (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                ),
                              },
                              {
                                key: 'delete_permanent',
                                label: isProjectActioning ? 'Working...' : 'Delete Permanently',
                                onSelect: () => handlePermanentDeleteProject(proj),
                                className: 'text-red-500',
                                disabled: isProjectActioning,
                                icon: (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                ),
                              },
                            ];
                          }
                        };

                        // Use ProjectCardContainer for display mode
                        return (
                          <ProjectCardContainer
                            key={project.id}
                            theme={asPage ? theme : 'dark'}
                            project={project}
                            isMenuOpen={activeMenuProjectId === project.id}
                            onOpenDesign={() => {
                              if (projectTab === 'active' && !isProjectActioning) {
                                openProject(project.id);
                              }
                            }}
                            onToggleMenu={(projectId) => {
                              if (isProjectActioning) {
                                return;
                              }
                              setActiveMenuProjectId((prev) => (prev === projectId ? null : projectId));
                            }}
                            onEditProject={startEditProject}
                            onDeleteProject={handleMoveToTrash}
                            menuOptionsBuilder={buildMenuOptions}
                            formatEditedDate={(dateStr) => projectTab === 'trash' && daysLeft != null ? `${daysLeft} days until permanent deletion` : formatEdited(dateStr)}
                          />
                        );
                      })}
                    </div>
                  )}
                </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <EditProjectModal
        isOpen={Boolean(editingProject)}
        theme={asPage ? theme : 'dark'}
        projectName={editingProject?.title || 'Untitled Project'}
        title={editTitle}
        subdomain={editSubdomain}
        error={editError}
        saving={savingEdit}
        onTitleChange={setEditTitle}
        onSubdomainChange={setEditSubdomain}
        onCancel={cancelEditProject}
        onSave={() => {
          if (editingProject) {
            void handleSaveProjectEdit(editingProject);
          }
        }}
      />

    </div>
  );
}
