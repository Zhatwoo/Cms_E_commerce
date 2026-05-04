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

type ProjectTabId = 'active' | 'trash';

const PROJECT_TABS: readonly TabBarItem<ProjectTabId>[] = [
  { id: 'active', label: 'ACTIVE' },
  { id: 'trash', label: 'TRASH' },
];

/**
 * Project picker rendered as a full page from /m_dashboard/projects.
 *
 * The legacy `asPage` prop and modal-mode rendering have been
 * removed because the only caller passed `asPage=true`. The
 * component name is kept for stability — renaming it would touch
 * the import in /m_dashboard/projects/page.tsx.
 */
export function ProjectSelectorModal() {
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
    <div className="project-selector-page dashboard-landing-light w-full py-1">
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }} className="relative w-full flex flex-col">
        <div className="px-7 pt-7 pb-5 shrink-0 relative">
          <div className="w-full max-w-4xl mx-auto text-center">
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
            <div className="w-full mt-8 space-y-8">
              <div className="flex items-center justify-center">
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
            </div>
          </div>
        </div>

        {/* Action error banner: briefly shown after a failed project action (trash, restore, etc.) */}
        {actionError && (
          <div className="mx-7 mb-0 px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-sm">
            {actionError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 px-0 pb-2 border-[#1F1F51] pt-6">
          <div className="w-full px-4 lg:px-[120px]">
            <AnimatePresence mode="wait">
              <motion.div key="select" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
                  {/* Project list: shows a loading spinner, empty state, or the grid/list of project cards */}
                  {loading && projectTab === 'active' ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3"><div className="w-6 h-6 border-2 border-[#FFCE00] border-t-transparent rounded-full animate-spin" /><p className="text-sm text-[#8A8FC4]">Loading projects…</p></div>
                  ) : trashLoading && projectTab === 'trash' ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 gap-3"><div className="w-6 h-6 border-2 border-[#FFCE00] border-t-transparent rounded-full animate-spin" /><p className="text-sm text-[#8A8FC4]">Loading trash…</p></div>
                  ) : projectTab === 'trash' && filteredTrashedProjects.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 gap-2 text-center"><svg className="w-10 h-10 text-[#3A3A7A]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg><p className="text-sm text-[#8A8FC4]">{searchQuery ? 'No templates match your search.' : 'Trash is empty.'}</p></div>
                  ) : (
                    // Unified renderer for active/trash collections; source list switches by tab.
                    <div className={`grid gap-4 sm:gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                      {projectTab === 'active' && (
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
                            theme={theme}
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
        theme={theme}
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
