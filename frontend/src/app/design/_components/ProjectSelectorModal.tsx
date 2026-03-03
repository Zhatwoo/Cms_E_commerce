'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  getStoredUser,
  type Project,
} from '@/lib/api';
import { ensureProjectStorageFolder } from '@/lib/firebaseStorage';
import { getLimits } from '@/lib/subscriptionLimits';
import { DraftPreviewThumbnail } from '@/app/m_dashboard/components/projects/DraftPreviewThumbnail';

// ─── tiny helpers ────────────────────────────────────────────────────────────

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

// ─── ProjectSelectorModal ────────────────────────────────────────────────────

interface Props {
  /** Instance (selected website) id — used to scope project listing */
  instanceId?: string | null;
  /** Render as dedicated page instead of modal overlay */
  asPage?: boolean;
}

type View = 'select' | 'create';

export function ProjectSelectorModal({ instanceId, asPage = false }: Props) {
  const router = useRouter();

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

  // create-form state
  const [title, setTitle] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const goToDashboard = () => {
    router.push('/m_dashboard');
  };

  const loadActiveProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProjects(instanceId ? { instanceId } : {});
      if (res.success && res.projects) {
        setProjects(res.projects);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  // ── load projects ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadActiveProjects();
  }, [loadActiveProjects]);

  useEffect(() => {
    if (!activeMenuProjectId) return;
    const closeMenu = () => setActiveMenuProjectId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [activeMenuProjectId]);

  // ── open project ─────────────────────────────────────────────────────────
  const openProject = (projectId: string) => {
    router.push(`/design?projectId=${projectId}`);
  };

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
    const trimmedSubdomain = editSubdomain
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');

    try {
      setSavingEdit(true);
      setEditError('');

      const res = await updateProject(project.id, {
        title: trimmedTitle,
        subdomain: trimmedSubdomain || null,
      });

      if (!res.success) {
        setEditError(res.message || 'Failed to update project.');
        return;
      }

      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id
            ? {
                ...p,
                ...(res.project || {
                  title: trimmedTitle,
                  subdomain: trimmedSubdomain || null,
                  updatedAt: new Date().toISOString(),
                }),
              }
            : p
        )
      );

      if (!res.project) {
        await loadActiveProjects();
      }

      cancelEditProject();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setEditError(msg || 'Failed to update project. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── create project ────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedTitle = title.trim() || 'Untitled Project';
    const trimmedSub = subdomain
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');

    try {
      setCreating(true);

      const user = getStoredUser();
      const plan = user?.subscriptionPlan || 'free';
      const limits = getLimits(plan);

      if (projects.length >= limits.projects) {
        setError(
          `Your ${plan} plan allows up to ${limits.projects} projects. Upgrade to unlock more.`
        );
        return;
      }

      const res = await createProject({
        title: trimmedTitle,
        instanceId: instanceId ?? undefined,
        subdomain: trimmedSub || undefined,
        templateId: null,
      });

      if (!res.success || !res.project) {
        setError(res.message || 'Failed to create project. Please try again.');
        return;
      }

      const clientName =
        (user?.name || user?.username || 'client').trim() || 'client';
      ensureProjectStorageFolder(
        clientName,
        res.project.title || 'website'
      ).catch(() => {});

      router.push(`/design?projectId=${res.project.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (
        msg.includes('Route not found') ||
        msg.includes('404') ||
        msg.includes('Backend is unreachable') ||
        msg.includes('Failed to fetch')
      ) {
        setError('Cannot reach server. Make sure the backend is running.');
      } else {
        setError('Failed to create project. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleMoveToTrash = async (project: Project) => {
    const confirmed = window.confirm(`Move "${project.title || 'Untitled Project'}" to trash?`);
    if (!confirmed) return;
    try {
      setActioningProjectId(project.id);
      const res = await deleteProject(project.id);
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
      }
    } finally {
      setActioningProjectId(null);
      setActiveMenuProjectId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={asPage ? 'w-full py-1' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={asPage
          ? 'relative w-full flex flex-col'
          : 'relative w-full max-w-2xl rounded-2xl border border-[#1F1F51] bg-[#0E0C30] shadow-2xl overflow-hidden flex flex-col'}
        style={asPage ? undefined : { maxHeight: '85vh' }}
      >
        {/* ── header ── */}
        <div className={`px-7 pt-7 pb-5 flex items-start justify-between shrink-0 ${asPage ? '' : 'border-b border-[#1F1F51]'}`}>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {view === 'select' ? 'Open a project' : 'Create new project'}
            </h2>
            <p className="text-base sm:text-lg text-[#8A8FC4] mt-1.5">
              {view === 'select'
                ? 'Select an existing project or start a new one.'
                : 'Give your project a name and an optional subdomain.'}
            </p>
          </div>

          {/* back / close */}
          {view === 'create' ? (
            <button
              onClick={() => {
                setView('select');
                setError('');
              }}
              className="flex items-center gap-1.5 text-sm text-[#8A8FC4] hover:text-white transition-colors mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : (
            <button
              onClick={goToDashboard}
              className="flex items-center gap-1.5 text-sm text-[#8A8FC4] hover:text-white transition-colors mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to dashboard
            </button>
          )}
        </div>

        {/* ── body ── */}
        <div className={`flex-1 overflow-y-auto min-h-0 ${asPage ? 'px-0 pb-2' : 'p-7'}`}>
          <div className={asPage ? 'w-full px-2 sm:px-4 lg:px-[150px]' : ''}>
          <AnimatePresence mode="wait">
            {/* SELECT VIEW */}
            {view === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                {/* create new button */}
                <button
                  onClick={() => setView('create')}
                  className={`${asPage
                    ? 'w-full sm:w-[260px] h-[72px] sm:h-[76px] flex items-center gap-4 px-4 sm:px-5 rounded-xl border border-dashed border-[#3A3A7A] bg-[#14113A] hover:bg-[#1A1750] hover:border-[#FFCE00]/50 transition-all group mb-5'
                    : 'w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-dashed border-[#3A3A7A] bg-[#14113A] hover:bg-[#1A1750] hover:border-[#FFCE00]/50 transition-all group mb-6'}`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FFCE00]/10 group-hover:bg-[#FFCE00]/20 transition-colors shrink-0">
                    <svg className="w-5 h-5 text-[#FFCE00]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Create new project</p>
                    <p className="text-xs text-[#8A8FC4]">Start from a blank canvas or a template</p>
                  </div>
                </button>

                {/* project list */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-6 h-6 border-2 border-[#FFCE00] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[#8A8FC4]">Loading projects…</p>
                  </div>
                  ) : projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                    <svg className="w-10 h-10 text-[#3A3A7A]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <p className="text-sm text-[#8A8FC4]">No projects yet. Create your first one!</p>
                  </div>
                  ) : (
                  <div className={`grid gap-3 ${asPage ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`relative border border-[#1F1F51] bg-[#141140] ${asPage ? 'rounded-[26px] p-0 overflow-hidden' : 'rounded-xl p-3.5 overflow-visible'} hover:bg-[#1C1855] hover:border-[#6B72D8] transition-all ${activeMenuProjectId === project.id ? 'z-40' : 'z-0'}`}
                      >
                        {editingProjectId !== project.id && (
                          <div className="absolute top-2.5 right-2.5 z-50" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuProjectId((prev) => (prev === project.id ? null : project.id));
                              }}
                              aria-label="Project actions"
                              title="Project actions"
                              className={asPage
                                ? 'h-8 w-8 rounded-md border border-[#2D3A90] bg-[#0E0D3D]/90 text-white flex items-center justify-center hover:text-[#FFCE00] hover:border-[#6B72D8] transition-colors'
                                : 'p-2 rounded-md text-[#8A8FC4] border border-[#2A2A60] hover:text-[#FFCE00] hover:border-[#6B72D8] hover:bg-[#1A1750] transition-colors'}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <circle cx="12" cy="6" r="1.8" />
                                <circle cx="12" cy="12" r="1.8" />
                                <circle cx="12" cy="18" r="1.8" />
                              </svg>
                            </button>

                            {activeMenuProjectId === project.id && (
                              <div className="absolute right-0 mt-1 w-36 rounded-lg border border-[#2A2A60] bg-[#0F0D38] py-1 shadow-xl z-50">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditProject(project);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-white flex items-center gap-2 hover:bg-white/5"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a1.875 1.875 0 1 1 2.652 2.652L8.25 17.403 4.5 18.75l1.347-3.75L16.862 3.487Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 4.5l3.75 3.75" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToTrash(project);
                                  }}
                                  disabled={actioningProjectId === project.id}
                                  className="w-full px-3 py-2 text-left text-sm text-red-300 flex items-center gap-2 hover:bg-red-500/10 disabled:opacity-50"
                                >
                                  {actioningProjectId === project.id ? (
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V1C6.477 1 2 5.477 2 11h2z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {editingProjectId === project.id ? (
                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-xs text-[#8A8FC4] mb-1">Project name</label>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-[#2A2A60] bg-[#111036] text-white text-sm focus:outline-none focus:border-[#6B72D8]"
                                placeholder="Untitled Project"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[#8A8FC4] mb-1">Subdomain</label>
                              <input
                                type="text"
                                value={editSubdomain}
                                onChange={(e) => setEditSubdomain(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-[#2A2A60] bg-[#111036] text-white text-sm focus:outline-none focus:border-[#6B72D8]"
                                placeholder="mystore"
                              />
                              <p className="text-[11px] text-[#6B6FA0] mt-1">Only letters, numbers, and hyphens.</p>
                            </div>

                            {editError && (
                              <p className="text-xs text-red-400">{editError}</p>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={cancelEditProject}
                                disabled={savingEdit}
                                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-[#8A8FC4] hover:text-white hover:bg-white/5 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveProjectEdit(project)}
                                disabled={savingEdit}
                                className="px-3 py-1.5 rounded-md text-xs font-medium text-[#121241] bg-[#FFCE00] hover:bg-[#FFD740] disabled:opacity-50"
                              >
                                {savingEdit ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          asPage ? (
                            <button
                              type="button"
                              onClick={() => openProject(project.id)}
                              className="w-full text-left group"
                            >
                              <div className="w-full aspect-[16/10] overflow-hidden border-b border-[#2A2A60] bg-[#0a0d14]">
                                {project.thumbnail ? (
                                  <img
                                    src={project.thumbnail}
                                    alt={project.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <DraftPreviewThumbnail
                                    projectId={project.id}
                                    borderColor="rgba(45,58,144,0.9)"
                                    bgColor="#120F46"
                                    className="w-full h-full !aspect-[16/10] !rounded-none"
                                  />
                                )}
                              </div>

                              <div className="px-4 py-3.5">
                                <p className="text-xl font-extrabold text-white leading-tight truncate group-hover:text-[#FFCE00] transition-colors">
                                  {project.title || 'Untitled Project'}
                                </p>
                                <p className="text-xs text-[#8A8FC4] mt-1 truncate">
                                  {formatEdited(project.updatedAt ?? project.createdAt)}
                                </p>
                              </div>
                            </button>
                          ) : (
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => openProject(project.id)}
                                className="flex-1 min-w-0 flex items-center gap-4 text-left group"
                              >
                                <div className="shrink-0 rounded-lg overflow-hidden border border-[#2A2A60] bg-[#0a0d14] w-14 h-10">
                                  {project.thumbnail ? (
                                    <img
                                      src={project.thumbnail}
                                      alt={project.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <DraftPreviewThumbnail
                                      projectId={project.id}
                                      borderColor="transparent"
                                      bgColor="#0a0d14"
                                      className="w-full h-full !aspect-auto !rounded-none"
                                    />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate group-hover:text-[#FFCE00] transition-colors">
                                    {project.title || 'Untitled Project'}
                                  </p>
                                  <p className="text-xs text-[#6B6FA0] truncate mt-0.5">
                                    {formatEdited(project.updatedAt ?? project.createdAt)}
                                  </p>
                                </div>
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                  )}
              </motion.div>
            )}

            {/* CREATE VIEW */}
            {view === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
              >
                <form onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#C4C6E8] mb-1.5">
                      Project title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="My Awesome Store"
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-lg border border-[#2A2A60] bg-[#141140] text-white text-sm placeholder:text-[#4A4A7E] focus:outline-none focus:border-[#6B72D8] focus:ring-1 focus:ring-[#6B72D8] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#C4C6E8] mb-1.5">
                      Preferred subdomain <span className="text-[#6B6FA0] font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value)}
                      placeholder="mystore"
                      className="w-full px-4 py-2.5 rounded-lg border border-[#2A2A60] bg-[#141140] text-white text-sm placeholder:text-[#4A4A7E] focus:outline-none focus:border-[#6B72D8] focus:ring-1 focus:ring-[#6B72D8] transition-colors"
                    />
                    <p className="text-xs text-[#6B6FA0] mt-1.5">
                      Only letters, numbers, and hyphens. e.g.{' '}
                      <span className="text-[#8A8FC4]">mystore → mystore.yourdomain.com</span>
                    </p>
                  </div>

                  {error && (
                    <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setView('select');
                        setError('');
                      }}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#8A8FC4] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#FFCE00] text-[#121241] hover:bg-[#FFD740] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#FFCE00]/20"
                    >
                      {creating ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Creating…
                        </span>
                      ) : (
                        'Create & open'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
