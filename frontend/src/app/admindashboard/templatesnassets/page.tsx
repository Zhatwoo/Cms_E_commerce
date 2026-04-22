'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import BuiltInTemplates from './components/BuiltInTemplates';
import UserTemplates from './components/UserTemplates';
import { useAdminLoading } from '../components/LoadingProvider';
import {
  deleteProject,
  listTemplateLibrary,
  updateProject,
  type Project,
} from '@/lib/api';

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

  const loadUserTemplates = useCallback(async () => {
    setUserTemplatesLoading(true);
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
      setUserTemplatesLoading(false);
    }
  }, [mapProjectToTemplate]);

  useEffect(() => {
    void loadUserTemplates();
  }, [loadUserTemplates]);

  const handleTabChange = (tab: 'builtin' | 'user') => {
    if (tab === activeTab) return;
    startLoading();
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/admindashboard/templatesnassets?${params.toString()}`, { scroll: false });
  };

  const builtInTemplates: Template[] = [];

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

  const handleRenameTemplate = async (template: Template) => {
    const nextName = window.prompt('Rename template', template.name)?.trim();
    if (!nextName || nextName === template.name) return;

    setRenamingTemplateId(template.id);
    try {
      await updateProject(template.id, { templateName: nextName });
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename template.';
      setUserTemplatesError(message);
    } finally {
      setRenamingTemplateId(null);
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    const confirmed = window.confirm(`Delete template \"${template.name}\"?`);
    if (!confirmed) return;

    setDeletingTemplateId(template.id);
    try {
      await deleteProject(template.id);
      setUserTemplates((prev) => prev.filter((item) => item.id !== template.id));
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
                    onSuspend={handleSuspendTemplate}
                    onRename={handleRenameTemplate}
                    onDelete={handleDeleteTemplate}
                    onReload={() => {
                      void loadUserTemplates();
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
