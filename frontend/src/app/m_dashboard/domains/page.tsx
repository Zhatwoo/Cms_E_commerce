'use client';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../components/context/theme-context';
import { useAuth } from '../components/context/auth-context';
import { useProject } from '../components/context/project-context';
import { useAlert } from '../components/context/alert-context';
import { listProjects, getSchedule, getPublishHistory, unpublishProject, updateDomainSubdomain, type Project, type PublishHistoryEntry } from '@/lib/api';
import { subscribeUserProjectSubdomains, type ProjectSubdomainEntry } from '@/lib/firebase';
import { PublishModal } from '../components/PublishModal';
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Pencil,
  Check,
  Clock,
  X,
  Calendar,
  FileText,
  ArrowDownToLine,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'websitelink';
/** Host for subdomain display (e.g. panes/localhost:3000 or panes.websitelink) */
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST ?? 'localhost:3000';

/** Normalized subdomain slug for URLs. */
function toSubdomainSlug(subdomain: string): string {
  return subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || '';
}

/**
 * Full URL to open the published site (subdomain-based, like Vercel).
 * In dev: http://subdomain.localhost:3000. In production: https://subdomain.websitelink (or your BASE_DOMAIN).
 */
function getSubdomainSiteUrl(subdomain: string, origin: string | null): string {
  const slug = toSubdomainSlug(subdomain);
  if (!slug) return '#';
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    const port = typeof window !== 'undefined' ? window.location.port || '3000' : '3000';
    return `http://${slug}.localhost:${port}`;
  }
  return `https://${slug}.${BASE_DOMAIN}`;
}

/** Display URL: subdomain/host format e.g. panes/localhost:3000, or subdomain.base in production */
function getSiteDisplayUrl(subdomain: string, origin: string | null): string {
  const slug = toSubdomainSlug(subdomain);
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return `${slug}/${SITE_HOST}`;
  }
  return `${slug}.${BASE_DOMAIN}`;
}

function isPublishedStatus(status?: string | null): boolean {
  return (status || '').trim().toLowerCase() === 'published';
}

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
function validateSubdomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return 'Subdomain is required';
  if (trimmed.length > 63) return 'Subdomain must be 63 characters or less';
  if (!SUBDOMAIN_REGEX.test(trimmed)) return 'Use only letters, numbers, and hyphens. No leading or trailing hyphens.';
  return null;
}

export default function DomainsPage() {
  const { colors, theme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { selectedProject } = useProject();
  const { showAlert } = useAlert();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [subdomainsByProject, setSubdomainsByProject] = useState<Record<string, ProjectSubdomainEntry>>({});
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : null);
  }, []);

  // Load projects from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listProjects();
        if (!cancelled && res.success && res.projects) setProjects(res.projects);
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedProject?.id]);

  // Subscribe to Firebase subdomains at /user/roles/client/{uid}/projects
  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setSubdomainsByProject({});
      return undefined;
    }
    const unsub = subscribeUserProjectSubdomains(uid, setSubdomainsByProject);
    return () => { unsub?.(); };
  }, [user?.id]);

  const loading = authLoading || projectsLoading;
  const domainsList = projects
    .map((p) => ({
      project: p,
      subdomain: subdomainsByProject[p.id]?.subdomain ?? p.subdomain ?? null,
    }));

  const publishedCount = projects.filter((project) => isPublishedStatus(project.status)).length;
  const draftCount = projects.length - publishedCount;

  const stats = {
    total: domainsList.length,
    active: domainsList.filter(d => (d.project.status || '').trim().toLowerCase() === 'published').length,
    draft: domainsList.filter(d => (d.project.status || '').trim().toLowerCase() !== 'published').length,
  };

  type DomainEntry = { project: Project; subdomain: string | null };
  const [selectedDomain, setSelectedDomain] = useState<DomainEntry | null>(null);
  const [scheduleInfo, setScheduleInfo] = useState<{ scheduledAt: string; subdomain: string | null } | null>(null);
  const [publishHistory, setPublishHistory] = useState<PublishHistoryEntry[]>([]);
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalProjectId, setAddModalProjectId] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [showEditSubdomainModal, setShowEditSubdomainModal] = useState(false);
  const [editSubdomainValue, setEditSubdomainValue] = useState('');
  const [editSubdomainError, setEditSubdomainError] = useState('');
  const [updatingSubdomain, setUpdatingSubdomain] = useState(false);

  const filteredDomains = searchQuery.trim()
    ? domainsList.filter(
        (d) =>
          (d.project.title || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          (d.subdomain || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : domainsList;

  const handleUnpublish = async (projectId: string, e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    setUnpublishingId(projectId);
    try {
      const res = await unpublishProject(projectId);
      if (res.success) {
        const res2 = await listProjects();
        if (res2.success && res2.projects) setProjects(res2.projects);
        if (selectedDomain?.project.id === projectId) {
          const updated = res2.projects?.find((p) => p.id === projectId);
          setSelectedDomain(updated ? { project: updated, subdomain: selectedDomain.subdomain } : null);
        }
        showAlert('Site taken offline. You can publish again anytime.', 'Take down');
      } else {
        showAlert(res.message || 'Failed to take down', 'Error');
      }
    } catch {
      showAlert('Failed to take down. Please try again.', 'Error');
    } finally {
      setUnpublishingId(null);
    }
  };

  const handleAddDomainClick = () => {
    if (projects.length === 0) {
      showAlert('Create a project first from the Web Builder, then publish it here.', 'No Projects');
      return;
    }
    const draftProject = projects.find((p) => (p.status || '').toLowerCase() !== 'published') ?? projects[0];
    setAddModalProjectId(draftProject?.id ?? projects[0]?.id ?? '');
    setShowAddModal(true);
  };

  const refreshProjects = async () => {
    const res = await listProjects();
    if (res.success && res.projects) setProjects(res.projects);
  };

  const handleEditSubdomainClick = () => {
    setEditSubdomainValue(selectedDomain?.subdomain ?? '');
    setEditSubdomainError('');
    setShowEditSubdomainModal(true);
  };

  const handleEditSubdomainConfirm = async () => {
    if (!selectedDomain) return;
    const err = validateSubdomain(editSubdomainValue);
    if (err) {
      setEditSubdomainError(err);
      return;
    }
    const normalized = editSubdomainValue.trim().toLowerCase();
    if (normalized === (selectedDomain.subdomain || '').trim().toLowerCase()) {
      setShowEditSubdomainModal(false);
      return;
    }
    setEditSubdomainError('');
    setUpdatingSubdomain(true);
    try {
      const res = await updateDomainSubdomain(selectedDomain.project.id, normalized);
      if (res.success) {
        const res2 = await listProjects();
        if (res2.success && res2.projects) setProjects(res2.projects);
        const updated = res2.projects?.find((p) => p.id === selectedDomain.project.id);
        setSelectedDomain(updated ? { project: updated, subdomain: normalized } : { ...selectedDomain, subdomain: normalized });
        setShowEditSubdomainModal(false);
        showAlert('Subdomain updated successfully.', 'Updated');
      } else {
        setEditSubdomainError(res.message || 'Update failed');
      }
    } catch (e) {
      setEditSubdomainError(e instanceof Error ? e.message : 'Update failed');
      showAlert('Failed to update subdomain.', 'Error');
    } finally {
      setUpdatingSubdomain(false);
    }
  };

  const handleCopyUrl = () => {
    if (!siteUrl) return;
    navigator.clipboard.writeText(siteUrl).then(
      () => showAlert('URL copied to clipboard', 'Copied'),
      () => showAlert('Failed to copy URL', 'Error')
    );
  };

  useEffect(() => {
    if (!selectedDomain?.project.id) {
      setScheduleInfo(null);
      setPublishHistory([]);
      return;
    }
    let cancelled = false;
    const pid = selectedDomain.project.id;
    getSchedule(pid).then((res) => {
      if (!cancelled && res.success && res.data) setScheduleInfo(res.data);
      else if (!cancelled) setScheduleInfo(null);
    });
    getPublishHistory(pid).then((res) => {
      if (!cancelled && res.success && res.data?.history) setPublishHistory(res.data.history);
      else if (!cancelled) setPublishHistory([]);
    });
    return () => { cancelled = true; };
  }, [selectedDomain?.project.id, selectedDomain?.project.status]);

  const siteUrl = selectedDomain?.subdomain
    ? getSubdomainSiteUrl(selectedDomain.subdomain, origin)
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{
          backgroundColor: colors.bg.card,
          borderColor: colors.border.faint,
          boxShadow: theme === 'dark'
            ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 50px rgba(2,6,23,0.55)'
            : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 30px rgba(15,23,42,0.12)',
        }}
      >
        <div className="relative">
          <div
            className="absolute -inset-x-6 -inset-y-4 rounded-3xl opacity-70 blur-2xl"
            style={{
              background: theme === 'dark'
                ? 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.16), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.14), transparent 60%)'
                : 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.12), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.1), transparent 60%)'
            }}
          />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <motion.p
                className="text-xs uppercase tracking-[0.2em] mb-2"
                style={{ color: colors.text.muted }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Dashboard Insights
              </motion.p>
              <motion.h1
                className="text-3xl font-bold tracking-tight bg-clip-text text-transparent"
                style={{
                  backgroundImage: theme === 'dark'
                    ? 'linear-gradient(180deg, #ffffff 25%, #9ca3af 100%)'
                    : 'linear-gradient(180deg, #111827 25%, #4b5563 100%)'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                My Sites
              </motion.h1>
              <motion.p
                className="mt-2 text-sm md:text-base"
                style={{ color: colors.text.secondary }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
              >
                Manage and publish your websites
              </motion.p>
            </div>
            <button
              type="button"
              onClick={handleAddDomainClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add site
            </button>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      {!loading && domainsList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border p-4"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                  {stats.total}
                </p>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  Total Sites
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border p-4"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                  {stats.active}
                </p>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  Published Sites
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border p-4"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Clock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                  {stats.draft}
                </p>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  In Draft
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:gap-6">
        {loading ? (
          <div
            className="rounded-2xl border p-6 shadow-lg flex-1"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <p className="text-sm" style={{ color: colors.text.muted }}>Loading…</p>
          </div>
        ) : domainsList.length === 0 ? (
          <div
            className="rounded-2xl border p-6 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-1"
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.faint,
            }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: colors.text.primary }}>No sites yet</p>
              <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                Publish your first website from the Web Builder or add one below.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href="/m_dashboard/web-builder"
                className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                style={{
                  borderColor: colors.border.faint,
                  color: colors.text.primary,
                }}
              >
                Go to Web Builder
              </Link>
              <button
                type="button"
                onClick={handleAddDomainClick}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.text.primary,
                  color: colors.bg.primary,
                }}
              >
                Add site
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
                <input
                  type="text"
                  placeholder="Search by title or subdomain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: colors.bg.primary,
                    borderColor: colors.border.faint,
                    color: colors.text.primary,
                  }}
                />
              </div>
              {filteredDomains.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: colors.text.muted }}>
                  {searchQuery.trim() ? 'No domains match your search.' : 'No domains yet.'}
                </p>
              ) : (
                filteredDomains.map(({ project, subdomain }) => {
                  const isPublished = isPublishedStatus(project.status);
                  const cardUrl = subdomain ? getSubdomainSiteUrl(subdomain, origin) : '';
                  return (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDomain({ project, subdomain })}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedDomain({ project, subdomain })}
                  className="rounded-2xl border p-4 shadow-sm flex items-center justify-between gap-3 transition-colors cursor-pointer hover:opacity-95"
                  style={{
                    backgroundColor: colors.bg.card,
                    borderColor: colors.border.faint,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: colors.text.primary }}>{project.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-xs font-mono truncate" style={{ color: colors.text.secondary }}>
                        {subdomain ? getSiteDisplayUrl(subdomain, origin) : 'Empty'}
                      </p>
                      {cardUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(cardUrl).then(
                              () => showAlert('URL copied to clipboard', 'Copied'),
                              () => showAlert('Failed to copy', 'Error')
                            );
                          }}
                          className="p-0.5 rounded hover:opacity-80 shrink-0"
                          style={{ color: colors.text.muted }}
                          aria-label="Copy URL"
                        >
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-xs px-2 py-1 rounded-full capitalize"
                      style={{
                        backgroundColor: isPublished ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                        color: isPublished ? 'rgb(22,163,74)' : 'rgb(220,38,38)',
                      }}
                    >
                      {isPublished ? 'Published' : 'Draft'}
                    </span>
                    <a
                      href={subdomain ? getSubdomainSiteUrl(subdomain, origin) : `/design?projectId=${project.id}`}
                      target={subdomain ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0"
                      style={{
                        backgroundColor: colors.text.primary,
                        color: colors.bg.primary,
                      }}
                    >
                      <ExternalLink size={14} />
                      {subdomain ? 'Visit' : 'Publish to go live'}
                    </a>
                    {isPublished && (
                      <button
                        type="button"
                        onClick={(e) => handleUnpublish(project.id, e)}
                        disabled={unpublishingId === project.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 border"
                        style={{
                          borderColor: 'rgba(239,68,68,0.5)',
                          color: 'rgb(239,68,68)',
                          backgroundColor: 'transparent',
                        }}
                      >
                        <ArrowDownToLine size={14} />
                        {unpublishingId === project.id ? 'Taking down…' : 'Take down'}
                      </button>
                    )}
                  </div>
                </div>
                  );
                })
              )}
            </div>

            {/* Right sidebar: website details + publish history */}
            {selectedDomain && (
              <aside
                className="w-full md:w-96 shrink-0 rounded-2xl border overflow-hidden flex flex-col"
                style={{
                  backgroundColor: colors.bg.card,
                  borderColor: colors.border.faint,
                }}
              >
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.border.faint }}>
                  <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Website details</h2>
                  <button
                    type="button"
                    onClick={() => setSelectedDomain(null)}
                    className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ color: colors.text.secondary }}
                    aria-label="Close sidebar"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-5">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                      <FileText size={16} />
                      Title
                    </div>
                    <p className="text-base font-medium" style={{ color: colors.text.primary }}>{selectedDomain.project.title}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                      <span className="flex items-center gap-2">
                        <Globe size={16} />
                        Subdomain
                      </span>
                      {selectedDomain.subdomain && (
                        <button
                          type="button"
                          onClick={handleEditSubdomainClick}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded hover:opacity-80"
                          style={{ color: colors.text.secondary }}
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                      )}
                    </div>
                    <p className="text-sm font-mono" style={{ color: colors.text.primary }}>
                      {selectedDomain.subdomain
                        ? getSiteDisplayUrl(selectedDomain.subdomain, origin)
                        : 'No subdomain'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                      Link
                      {siteUrl && (
                        <button
                          type="button"
                          onClick={handleCopyUrl}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded hover:opacity-80"
                          style={{ color: colors.text.secondary }}
                          aria-label="Copy URL"
                        >
                          <Copy size={12} />
                          Copy
                        </button>
                      )}
                    </div>
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium break-all hover:underline"
                      style={{ color: colors.text.primary }}
                    >
                      {siteUrl || '—'}
                      {siteUrl && <ExternalLink size={14} className="shrink-0" />}
                    </a>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>Status</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-xs px-2 py-1 rounded-full capitalize"
                        style={{
                          backgroundColor: selectedDomain.project.status === 'published' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                          color: selectedDomain.project.status === 'published' ? 'rgb(22,163,74)' : 'rgb(180,83,9)',
                        }}
                      >
                        {selectedDomain.project.status || 'draft'}
                      </span>
                      {isPublishedStatus(selectedDomain.project.status) && (
                        <button
                          type="button"
                          onClick={() => handleUnpublish(selectedDomain.project.id)}
                          disabled={unpublishingId === selectedDomain.project.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors"
                          style={{
                            borderColor: 'rgba(239,68,68,0.5)',
                            color: 'rgb(239,68,68)',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <ArrowDownToLine size={14} />
                          {unpublishingId === selectedDomain.project.id ? 'Taking down…' : 'Take down'}
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedDomain.project.createdAt && (
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>Created</div>
                      <p className="text-sm" style={{ color: colors.text.primary }}>
                        {new Date(selectedDomain.project.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedDomain.project.updatedAt && (
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>Last updated</div>
                      <p className="text-sm" style={{ color: colors.text.primary }}>
                        {new Date(selectedDomain.project.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t space-y-3" style={{ borderColor: colors.border.faint }}>
                    <button
                      type="button"
                      onClick={() => setHistoryExpanded(!historyExpanded)}
                      className="flex items-center gap-2 text-sm font-semibold w-full text-left"
                      style={{ color: colors.text.primary }}
                    >
                      <Calendar size={16} />
                      Publish history
                      {historyExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {historyExpanded && (
                    <>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center justify-between gap-2">
                        <span style={{ color: colors.text.secondary }}>Status</span>
                        <span
                          className="capitalize px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: isPublishedStatus(selectedDomain.project.status) ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                            color: isPublishedStatus(selectedDomain.project.status) ? 'rgb(22,163,74)' : 'rgb(220,38,38)',
                          }}
                        >
                          {isPublishedStatus(selectedDomain.project.status) ? 'Published' : 'Draft'}
                        </span>
                      </li>
                      {scheduleInfo?.scheduledAt && (
                        <li className="flex items-center justify-between gap-2">
                          <span style={{ color: colors.text.secondary }}>Next scheduled</span>
                          <span style={{ color: colors.text.primary }}>
                            {new Date(scheduleInfo.scheduledAt).toLocaleString()}
                          </span>
                        </li>
                      )}
                    </ul>
                    <div>
                      <div className="text-xs font-medium mb-2" style={{ color: colors.text.secondary }}>Last 10 changes (newest first)</div>
                      {publishHistory.length > 0 ? (
                        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                          {publishHistory.map((entry, i) => (
                            <li
                              key={`${entry.at}-${i}`}
                              className="flex items-center justify-between gap-2 py-1.5 px-2 rounded text-xs"
                              style={{
                                backgroundColor: colors.bg.primary,
                                color: colors.text.primary,
                                borderLeft: '3px solid rgba(56, 189, 248, 0.6)',
                              }}
                            >
                              <span className="capitalize" style={{ color: colors.text.secondary }}>{entry.type}</span>
                              <span>{new Date(entry.at).toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs py-1" style={{ color: colors.text.muted }}>
                          No publish history yet. History is recorded each time you publish.
                        </p>
                      )}
                    </div>
                    {!scheduleInfo?.scheduledAt && selectedDomain.project.status === 'published' && (
                      <p className="text-xs" style={{ color: colors.text.muted }}>
                        No upcoming scheduled publish.
                      </p>
                    )}
                    </>
                    )}
                  </div>
                </div>
              </aside>
            )}
          </>
        )}
      </div>

      {/* Add Site Modal (PublishModal) */}
      <PublishModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(subdomain) => {
          showAlert('Site published successfully!', 'Published');
          refreshProjects();
          setShowAddModal(false);
        }}
        projectId={addModalProjectId}
        projectTitle={projects.find((p) => p.id === addModalProjectId)?.title ?? ''}
        existingSubdomain={projects.find((p) => p.id === addModalProjectId)?.subdomain}
        projects={projects.length > 1 ? projects.map((p) => ({ id: p.id, title: p.title, subdomain: p.subdomain })) : undefined}
        onProjectChange={projects.length > 1 ? (id) => setAddModalProjectId(id) : undefined}
      />

      {/* Edit Subdomain Modal */}
      <AnimatePresence>
        {showEditSubdomainModal && selectedDomain && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => !updatingSubdomain && setShowEditSubdomainModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border p-6 w-full max-w-md shadow-xl"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Edit Subdomain</h3>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>New subdomain</label>
                <input
                  type="text"
                  placeholder="e.g. newsite"
                  value={editSubdomainValue}
                  onChange={(e) => {
                    setEditSubdomainValue(e.target.value);
                    setEditSubdomainError('');
                  }}
                  className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
                  style={{
                    backgroundColor: colors.bg.primary,
                    borderColor: editSubdomainError ? 'rgb(239,68,68)' : colors.border.faint,
                    color: colors.text.primary,
                  }}
                />
                {editSubdomainError && (
                  <p className="text-xs mt-1" style={{ color: 'rgb(239,68,68)' }}>{editSubdomainError}</p>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => !updatingSubdomain && setShowEditSubdomainModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium"
                  style={{ borderColor: colors.border.faint, color: colors.text.secondary }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditSubdomainConfirm}
                  disabled={updatingSubdomain}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {updatingSubdomain ? 'Updating…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
