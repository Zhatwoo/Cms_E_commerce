'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createProject, deleteProject, updateProject, type Project } from '@/lib/api';
import { useProject } from '../components/context/project-context';
import { useAlert } from '../components/context/alert-context';
import { DraftPreviewThumbnail } from '../components/projects/DraftPreviewThumbnail';

export default function InstancesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert, showConfirm } = useAlert();
  const { projects, loading, selectedProjectId, setSelectedProjectId, refreshProjects } = useProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingInstanceId, setEditingInstanceId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingInstanceId, setDeletingInstanceId] = useState<string | null>(null);
  const hasShownPromptRef = useRef(false);

  useEffect(() => {
    const requireInstance = searchParams?.get('requireInstance');
    if (requireInstance !== '1' || hasShownPromptRef.current) return;

    hasShownPromptRef.current = true;
    const from = searchParams?.get('from');
    const source = from ? ` (${from})` : '';
    void showAlert(`Please select a website instance first before opening this page${source}.`, 'Select Instance Required');

    const nextParams = new URLSearchParams(searchParams?.toString() ?? '');
    nextParams.delete('requireInstance');
    nextParams.delete('from');
    const query = nextParams.toString();
    router.replace(query ? `/m_dashboard/instances?${query}` : '/m_dashboard/instances');
  }, [searchParams, showAlert, router]);

  const handleChooseProject = (project: Project) => {
    setSelectedProjectId(project.id);
    router.push('/m_dashboard');
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const cleanTitle = title.trim() || 'Untitled Project';
      const cleanSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

      const res = await createInstance({
        title: cleanTitle,
        subdomain: cleanSubdomain || undefined,
      });

      if (!res.success || !res.project) {
        showAlert('Failed to create website instance. Please try again.');
        return;
      }

      await refreshProjects();
      setSelectedProjectId(res.project.id);
      setCreateOpen(false);
      setTitle('');
      setSubdomain('');
      router.push('/m_dashboard');
    } catch {
      showAlert('Failed to create website instance. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (instance: Project) => {
    setEditingInstanceId(instance.id);
    setTitle(instance.title || '');
    setSubdomain(instance.subdomain || '');
    setEditOpen(true);
  };

  const handleEditInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstanceId) return;

    try {
      setUpdating(true);
      const cleanTitle = title.trim() || 'Untitled Project';
      const cleanSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

      const res = await updateProject(editingInstanceId, {
        title: cleanTitle,
        subdomain: cleanSubdomain || undefined,
      });

      if (!res.success || !res.project) {
        showAlert('Failed to update website instance. Please try again.');
        return;
      }

      await refreshProjects();
      setEditOpen(false);
      setEditingInstanceId(null);
      setTitle('');
      setSubdomain('');
      showAlert('Website instance updated successfully.', 'Instance Updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update website instance. Please try again.';
      showAlert(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteInstance = async (instance: Project) => {
    const confirmed = await showConfirm(
      `Delete "${instance.title || 'Untitled website'}"? This action cannot be undone.`,
      'Delete Instance'
    );
    if (!confirmed) return;

    try {
      setDeletingInstanceId(instance.id);
      const res = await deleteProject(instance.id);
      if (!res.success) {
        showAlert('Failed to delete website instance. Please try again.');
        return;
      }

      if (selectedProjectId === instance.id) {
        setSelectedProjectId(null);
      }

      await refreshProjects();
      showAlert('Website instance deleted.', 'Instance Deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete website instance. Please try again.';
      showAlert(message);
    } finally {
      setDeletingInstanceId(null);
    }
  };

  return (
    <section className="min-h-[calc(100vh-176px)] px-3 sm:px-6 py-5 sm:py-8 space-y-6 [font-family:var(--font-outfit),sans-serif]">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Select Website Instance
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#A8AED6]">
          Pick a website instance to manage its dedicated projects, designs, and domain setup.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#8D93BE]">
          {loading ? 'Loading instances…' : `${projects.length} instance${projects.length === 1 ? '' : 's'} found`}
        </p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg px-4 py-2 text-sm font-semibold bg-[#FFCE00] text-[#121241]"
        >
          + New Instance
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[rgba(132,142,201,0.35)] p-6 text-center text-[#A8AED6]">
          Loading website instances…
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-[rgba(132,142,201,0.35)] p-8 text-center text-[#A8AED6]">
          No website instance yet. Create your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl border border-[rgba(132,142,201,0.35)] overflow-hidden text-left hover:translate-y-[-1px] transition-transform bg-[#1A1A58]"
            >
              <button
                type="button"
                onClick={() => handleChooseProject(project)}
                className="w-full text-left"
              >
                <div className="w-full aspect-[16/10] overflow-hidden bg-[#12144A]">
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.title || 'Website instance'} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <DraftPreviewThumbnail
                      projectId={project.id}
                      borderColor="rgba(132,142,201,0.35)"
                      bgColor="#12144A"
                      className="w-full h-full !aspect-[16/10] !rounded-none"
                    />
                  )}
                </div>
                <div className="px-4 py-3.5">
                  <p className="font-semibold text-lg truncate text-white">{project.title || 'Untitled website'}</p>
                  <p className="text-xs mt-1 truncate text-[#8D93BE]">
                    {project.subdomain ? `/${project.subdomain}` : 'No subdomain yet'}
                  </p>
                </div>
              </button>
              <div className="px-4 pb-3.5">
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      openEditModal(project);
                    }}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[rgba(132,142,201,0.2)] text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteInstance(project);
                    }}
                    disabled={deletingInstanceId === project.id}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-60 bg-[rgba(255,99,132,0.2)] text-[#FFBBC9]"
                  >
                    {deletingInstanceId === project.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCreateOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-[rgba(132,142,201,0.45)] overflow-hidden bg-[#1A1A58]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[rgba(132,142,201,0.35)]">
              <h2 className="text-xl font-semibold text-white">Create Website Instance</h2>
            </div>
            <form onSubmit={handleCreateInstance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white">Instance title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(132,142,201,0.45)] px-4 py-2.5 bg-transparent text-white"
                  placeholder="My Website"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white">Preferred subdomain</label>
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(132,142,201,0.45)] px-4 py-2.5 bg-transparent text-white"
                  placeholder="mywebsite"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 bg-[#FFCE00] text-[#121241]"
                >
                  {creating ? 'Creating…' : 'Create & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[rgba(132,142,201,0.45)] overflow-hidden bg-[#1A1A58]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[rgba(132,142,201,0.35)]">
              <h2 className="text-xl font-semibold text-white">Edit Website Instance</h2>
            </div>
            <form onSubmit={handleEditInstance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white">Instance title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(132,142,201,0.45)] px-4 py-2.5 bg-transparent text-white"
                  placeholder="My Website"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white">Preferred subdomain</label>
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(132,142,201,0.45)] px-4 py-2.5 bg-transparent text-white"
                  placeholder="mywebsite"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 bg-[#FFCE00] text-[#121241]"
                >
                  {updating ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
