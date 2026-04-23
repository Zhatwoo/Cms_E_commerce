'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import BuiltInTemplates from './components/BuiltInTemplates';
import UserTemplates from './components/UserTemplates';
import { useAdminLoading } from '../components/LoadingProvider';
import { TEMPLATE_LIBRARY_CHANGED_EVENT, templateService } from '@/lib/templateService';
import {
  deleteProject,
  listTemplateLibrary,
  updateProject,
  type Project,
} from '@/lib/api';
import {
  removeTemplateProjectEntry,
  updateTemplateProjectEntry,
} from '@/lib/templateProjectRegistry';

interface Template {
  id: string;
  name: string;
  category: string;
  status?: string;
  username?: string;
  ownerId?: string;
  domainName?: string;
  createdAt?: string;
  updatedAt?: string;
  thumbnail: string;
}

type TemplateActionMode = 'rename' | 'suspend' | 'delete';

type TemplateActionModalState = {
  open: boolean;
  mode: TemplateActionMode;
  template: Template | null;
  nextName: string;
};

const SearchIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function TemplatesAssetsPage() {
  const { startLoading } = useAdminLoading();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeTab = useMemo<'builtin' | 'user'>(() => {
    const tab = searchParams.get('tab');
    return tab === 'user' ? 'user' : 'builtin';
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [userTemplatesLoading, setUserTemplatesLoading] = useState(false);
  const [userTemplatesError, setUserTemplatesError] = useState('');
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [renamingTemplateId, setRenamingTemplateId] = useState<string | null>(null);
  const [suspendingTemplateId, setSuspendingTemplateId] = useState<string | null>(null);
  const [builtInTemplates, setBuiltInTemplates] = useState<Template[]>([]);
  const [actionModal, setActionModal] = useState<TemplateActionModalState>({
    open: false,
    mode: 'rename',
    template: null,
    nextName: '',
  });

  const mapProjectToTemplate = useCallback((project: Project): Template => {
    const statusLabel = String(project.status || '').trim() || 'Template';
    return {
      id: project.id,
      name: (project.templateName || project.title || 'Untitled Template').trim(),
      category: statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1),
      status: project.status,
      username: project.ownerName || undefined,
      ownerId: project.ownerId || undefined,
      domainName: project.subdomain || undefined,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      thumbnail: project.thumbnail || '',
    };
  }, []);

  const mapLibraryTemplateToTemplate = useCallback((template: ReturnType<typeof templateService.getTemplates>[number]): Template => {
    return {
      id: String(template.id),
      name: (template.name || template.title || 'Untitled Template').trim(),
      category: String(template.category || 'General').trim() || 'General',
      status: template.status,
      username: template.username || undefined,
      ownerId: undefined,
      domainName: template.domainName || undefined,
      createdAt: template.createdAt instanceof Date ? template.createdAt.toISOString() : undefined,
      updatedAt: template.updatedAt instanceof Date ? template.updatedAt.toISOString() : undefined,
      thumbnail: template.thumbnail || '',
    };
  }, []);

  const loadBuiltInTemplates = useCallback(() => {
    const templates = templateService
      .getTemplates()
      .filter((template) => template.isBuiltIn)
      .map(mapLibraryTemplateToTemplate);
    setBuiltInTemplates(templates);
  }, [mapLibraryTemplateToTemplate]);

  const loadUserTemplates = useCallback(async (silent = false) => {
    if (!silent) setUserTemplatesLoading(true);
    setUserTemplatesError('');
    try {
      const res = await listTemplateLibrary(200);
      const mapped = (res.templates || []).map(mapProjectToTemplate);
      setUserTemplates(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load user templates.';
      setUserTemplatesError(message);
      setUserTemplates([]);
    } finally {
      if (!silent) setUserTemplatesLoading(false);
    }
  }, [mapProjectToTemplate]);

  useEffect(() => {
    loadBuiltInTemplates();
    void loadUserTemplates();

    const onTemplatesChanged = () => {
      loadBuiltInTemplates();
      void loadUserTemplates(true);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onTemplatesChanged();
      }
    };

    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        onTemplatesChanged();
      }
    }, 15000);

    window.addEventListener(TEMPLATE_LIBRARY_CHANGED_EVENT, onTemplatesChanged);
    window.addEventListener('storage', onTemplatesChanged);
    window.addEventListener('focus', onTemplatesChanged);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener(TEMPLATE_LIBRARY_CHANGED_EVENT, onTemplatesChanged);
      window.removeEventListener('storage', onTemplatesChanged);
      window.removeEventListener('focus', onTemplatesChanged);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadBuiltInTemplates, loadUserTemplates]);

  const handleTabChange = (tab: 'builtin' | 'user') => {
    if (tab === activeTab) return;
    startLoading();
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/admindashboard/templatesnassets?${params.toString()}`, { scroll: false });
  };

  const filteredBuiltInTemplates = builtInTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUserTemplates = userTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.domainName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openTemplateActionModal = (template: Template, mode: TemplateActionMode) => {
    setActionModal({
      open: true,
      mode,
      template,
      nextName: template.name,
    });
  };

  const closeTemplateActionModal = () => {
    if (actionModal.template) {
      const targetId = actionModal.template.id;
      if (targetId === deletingTemplateId || targetId === renamingTemplateId || targetId === suspendingTemplateId) {
        return;
      }
    }

    setActionModal({
      open: false,
      mode: 'rename',
      template: null,
      nextName: '',
    });
  };

  const handleTemplateActionConfirm = async () => {
    if (!actionModal.template) return;
    const template = actionModal.template;

    if (actionModal.mode === 'rename') {
      const nextName = actionModal.nextName.trim();
      if (!nextName) {
        setUserTemplatesError('Template name is required.');
        return;
      }
      if (nextName === template.name) {
        closeTemplateActionModal();
        return;
      }

      setRenamingTemplateId(template.id);
      try {
        await updateProject(template.id, { templateName: nextName });
        updateTemplateProjectEntry(template.id, { name: nextName });
        setUserTemplates((prev) =>
          prev.map((item) =>
            item.id === template.id
              ? {
                  ...item,
                  name: nextName,
                }
              : item
          )
        );
        window.dispatchEvent(new CustomEvent(TEMPLATE_LIBRARY_CHANGED_EVENT));
        closeTemplateActionModal();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to rename template.';
        setUserTemplatesError(message);
      } finally {
        setRenamingTemplateId(null);
      }
      return;
    }

    if (actionModal.mode === 'suspend') {
      setSuspendingTemplateId(template.id);
      try {
        await updateProject(template.id, { status: 'suspended' });
        setUserTemplates((prev) => prev.filter((item) => item.id !== template.id));
        closeTemplateActionModal();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to suspend template.';
        setUserTemplatesError(message);
      } finally {
        setSuspendingTemplateId(null);
      }
      return;
    }

    if (actionModal.mode === 'delete') {
      setDeletingTemplateId(template.id);
      try {
        await deleteProject(template.id);
        setUserTemplates((prev) => prev.filter((item) => item.id !== template.id));
        window.dispatchEvent(new CustomEvent(TEMPLATE_LIBRARY_CHANGED_EVENT));
        closeTemplateActionModal();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete template.';
        setUserTemplatesError(message);
      } finally {
        setDeletingTemplateId(null);
      }
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    const confirmed = window.confirm(`Delete template \"${template.name}\"?`);
    if (!confirmed) return;

    setDeletingTemplateId(template.id);
    try {
      await deleteProject(template.id);
      setUserTemplates((prev) => prev.filter((item) => item.id !== template.id));
      closeTemplateActionModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete template.';
      setUserTemplatesError(message);
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handleSuspendTemplate = async (template: Template) => {
    const confirmed = window.confirm(`Suspend template \"${template.name}\"?`);
    if (!confirmed) return;

    setSuspendingTemplateId(template.id);
    try {
      await updateProject(template.id, { status: 'suspended' });
      // Suspended templates are removed from the active user template list.
      setUserTemplates((prev) => prev.filter((item) => item.id !== template.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to suspend template.';
      setUserTemplatesError(message);
    } finally {
      setSuspendingTemplateId(null);
    }
  };

  const handlePreviewTemplate = (template: Template) => {
    router.push(`/design/preview?projectId=${encodeURIComponent(template.id)}`);
  };

  return (
    <div className="admin-dashboard-shell flex h-screen overflow-hidden" suppressHydrationWarning>
      <AdminSidebar forcedActiveItemId="templates" forcedActiveChildId={activeTab === 'builtin' ? 'builtin-templates' : 'user-templates'} />

      <AnimatePresence>
        {sidebarOpen && (
          <div className="lg:hidden">
            <AdminSidebar
              mobile
              onClose={() => setSidebarOpen(false)}
              forcedActiveItemId="templates"
              forcedActiveChildId={activeTab === 'builtin' ? 'builtin-templates' : 'user-templates'}
            />
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-h-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-6 p-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <h1 className="mb-2 text-3xl font-bold text-[#B13BFF] sm:text-4xl">Templates &amp; Assets</h1>
              <p className="text-sm font-medium text-[#A78BFA]">Templates &amp; Assets</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="relative flex-1 min-w-[17rem]">
                <input
                  type="text"
                  placeholder="Search templates or assets"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  suppressHydrationWarning
                  className="admin-dashboard-panel-soft h-12 w-full rounded-2xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] pl-12 pr-4 text-sm font-medium text-[#471396] outline-none placeholder:text-[#82788F]"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB800] flex items-center justify-center pointer-events-none">
                  <SearchIcon className="h-5 w-5" />
                </div>
              </div>

              <div className="ml-auto flex gap-1 rounded-xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] p-1 relative">
                <button
                  type="button"
                  onClick={() => handleTabChange('builtin')}
                  className={`relative z-10 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === 'builtin' ? 'text-[#471396]' : 'text-[#6F657E] hover:text-[#471396]'
                  }`}
                >
                  {activeTab === 'builtin' && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 rounded-lg bg-[#FFCC00] shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">Built-in Templates</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('user')}
                  className={`relative z-10 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === 'user' ? 'text-[#471396]' : 'text-[#6F657E] hover:text-[#471396]'
                  }`}
                >
                  {activeTab === 'user' && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 rounded-lg bg-[#FFCC00] shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">User Templates</span>
                </button>
              </div>
            </motion.div>

            <div>
              {activeTab === 'user' && userTemplatesError ? (
                <div className="mb-4 rounded-xl border border-[#FCA5A5] bg-[#FFF1F2] px-4 py-3 text-sm font-medium text-[#9F1239]">
                  {userTemplatesError}
                </div>
              ) : null}

              <AnimatePresence mode="wait">
                {activeTab === 'builtin' && <BuiltInTemplates templates={filteredBuiltInTemplates} />}
                {activeTab === 'user' && (
                  <UserTemplates
                    templates={filteredUserTemplates}
                    loading={userTemplatesLoading}
                    deletingTemplateId={deletingTemplateId}
                    renamingTemplateId={renamingTemplateId}
                    suspendingTemplateId={suspendingTemplateId}
                    onPreview={handlePreviewTemplate}
                    onSuspend={(template) => openTemplateActionModal(template, 'suspend')}
                    onRename={(template) => openTemplateActionModal(template, 'rename')}
                    onDelete={(template) => openTemplateActionModal(template, 'delete')}
                    onReload={() => {
                      void loadUserTemplates();
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {actionModal.open && actionModal.template && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                  style={{ background: 'rgba(72, 40, 128, 0.28)', backdropFilter: 'blur(4px)' }}
                  onClick={closeTemplateActionModal}
                >
                  <motion.div
                    initial={{ y: 18, scale: 0.98, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    exit={{ y: 12, scale: 0.98, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md rounded-[24px] border border-[rgba(177,59,255,0.2)] bg-white p-6 shadow-[0_20px_54px_rgba(71,19,150,0.18)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <h3 className="text-xl font-bold text-[#4A1A8A]">
                      {actionModal.mode === 'rename'
                        ? 'Rename Template'
                        : actionModal.mode === 'suspend'
                          ? 'Suspend Template'
                          : 'Delete Template'}
                    </h3>

                    <p className="mt-2 text-sm text-[#7A6AA0]">
                      {actionModal.mode === 'rename'
                        ? `Update the template name for ${actionModal.template.name}.`
                        : actionModal.mode === 'suspend'
                          ? `Suspend ${actionModal.template.name}? This removes it from active templates.`
                          : `Delete ${actionModal.template.name}? This moves it to trash.`}
                    </p>

                    {actionModal.mode === 'rename' && (
                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#7A6AA0]">
                          Template Name
                        </label>
                        <input
                          type="text"
                          value={actionModal.nextName}
                          onChange={(event) => setActionModal((prev) => ({ ...prev, nextName: event.target.value }))}
                          className="h-11 w-full rounded-xl border border-[rgba(177,59,255,0.24)] bg-[#F7F3FF] px-3 text-sm font-medium text-[#3A1F73] outline-none focus:border-[#B13BFF]"
                          placeholder="Enter template name"
                        />
                      </div>
                    )}

                    <div className="mt-6 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeTemplateActionModal}
                        className="rounded-xl border border-[rgba(177,59,255,0.2)] px-4 py-2 text-sm font-semibold text-[#7A6AA0] hover:bg-[#F7F3FF]"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void handleTemplateActionConfirm();
                        }}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                          actionModal.mode === 'delete'
                            ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                            : actionModal.mode === 'suspend'
                              ? 'bg-[#C2410C] hover:bg-[#9A3412]'
                              : 'bg-[#7B1DE8] hover:bg-[#6619C4]'
                        }`}
                      >
                        {actionModal.mode === 'rename'
                          ? renamingTemplateId === actionModal.template.id
                            ? 'Saving...'
                            : 'Save Name'
                          : actionModal.mode === 'suspend'
                            ? suspendingTemplateId === actionModal.template.id
                              ? 'Suspending...'
                              : 'Confirm Suspend'
                            : deletingTemplateId === actionModal.template.id
                              ? 'Deleting...'
                              : 'Confirm Delete'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
