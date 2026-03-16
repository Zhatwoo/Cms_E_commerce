'use client';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../components/context/theme-context';
import { useAuth } from '../components/context/auth-context';
import { useProject } from '../components/context/project-context';
import { useAlert } from '../components/context/alert-context';
import {
  listProjects, getSchedule, getPublishHistory, unpublishProject,
  updateDomainSubdomain, addCustomDomain as apiAddCustomDomain,
  verifyCustomDomain as apiVerifyCustomDomain, removeCustomDomain as apiRemoveCustomDomain,
  listCustomDomains,
  type Project, type PublishHistoryEntry, type DnsInstructions,
} from '@/lib/api';
import { subscribeUserProjectSubdomains, type ProjectSubdomainEntry } from '@/lib/firebase';
import { PublishModal } from '../components/PublishModal';
import { DraftPreviewThumbnail } from '../components/projects/DraftPreviewThumbnail';
import {
  Globe, Plus, Search, ExternalLink, Copy, Pencil, Check, Clock, X,
  Calendar, FileText, ArrowDownToLine, ChevronDown, ChevronUp,
  Link2, Unlink, ShieldCheck, AlertTriangle, Loader2, LayoutGrid, List,
} from 'lucide-react';
import { getSubdomainSiteUrl } from '@/lib/siteUrls';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'websitelink';
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST ?? 'localhost:3000';
const GRAD = 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)';
const ADD_SITE_BG = 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)';
const VISIT_BG = 'linear-gradient(135deg, #22c55e 0%, #16a34a 55%, #15803d 100%)';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(s: string) { return s.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || ''; }

function getDisplayUrl(subdomain: string, origin: string | null) {
  const slug = toSlug(subdomain);
  return origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))
    ? `${slug}/${SITE_HOST}`
    : `${slug}.${BASE_DOMAIN}`;
}

function isPublished(status?: string | null) {
  return (status || '').trim().toLowerCase() === 'published';
}

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
function validateSubdomain(v: string) {
  const t = v.trim().toLowerCase();
  if (!t) return 'Subdomain is required';
  if (t.length > 63) return 'Max 63 characters';
  if (!SUBDOMAIN_RE.test(t)) return 'Letters, numbers, hyphens only. No leading/trailing hyphens.';
  return null;
}

// ─── Small atoms ──────────────────────────────────────────────────────────────

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{
        backgroundColor: published ? 'rgba(74,222,128,0.12)' : 'rgba(251,146,60,0.12)',
        color: published ? '#4ade80' : '#fb923c',
      }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: published ? '#4ade80' : '#fb923c' }} />
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

function SidebarRow({ icon, label, children, action }: {
  icon: React.ReactNode; label: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          {icon}{label}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type DomainEntry = { project: Project; subdomain: string | null };

export default function DomainsPage() {
  const { colors, theme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { selectedProject, refreshProjects: refreshContextProjects } = useProject();
  const { showAlert } = useAlert();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [subdomainsByProject, setSubdomainsByProject] = useState<Record<string, ProjectSubdomainEntry>>({});
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => { setOrigin(typeof window !== 'undefined' ? window.location.origin : null); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listProjects();
        if (!cancelled && res.success && res.projects) setProjects(res.projects);
      } catch { if (!cancelled) setProjects([]); }
      finally { if (!cancelled) setProjectsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [selectedProject?.id]);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) { setSubdomainsByProject({}); return; }
    const unsub = subscribeUserProjectSubdomains(uid, setSubdomainsByProject);
    return () => { unsub?.(); };
  }, [user?.id]);

  const loading = authLoading || projectsLoading;
  const domainsList: DomainEntry[] = projects.map(p => ({
    project: p,
    subdomain: subdomainsByProject[p.id]?.subdomain ?? p.subdomain ?? null,
  }));

  const stats = {
    total: domainsList.length,
    published: domainsList.filter(d => isPublished(d.project.status)).length,
    draft: domainsList.filter(d => !isPublished(d.project.status)).length,
  };

  // UI state
  const [selectedDomain, setSelectedDomain] = useState<DomainEntry | null>(null);
  const [scheduleInfo, setScheduleInfo] = useState<{ scheduledAt: string; subdomain: string | null } | null>(null);
  const [publishHistory, setPublishHistory] = useState<PublishHistoryEntry[]>([]);
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalProjectId, setAddModalProjectId] = useState('');
  const [addSiteLoading, setAddSiteLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [showEditSubdomain, setShowEditSubdomain] = useState(false);
  const [editSubdomainVal, setEditSubdomainVal] = useState('');
  const [editSubdomainErr, setEditSubdomainErr] = useState('');
  const [updatingSubdomain, setUpdatingSubdomain] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Custom domain state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [customDomainErr, setCustomDomainErr] = useState('');
  const [customDomainLoading, setCustomDomainLoading] = useState(false);
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstructions | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [removingDomain, setRemovingDomain] = useState(false);
  const [customDomains, setCustomDomains] = useState<Record<string, { domain: string; domainStatus: string; verifiedAt?: string | null }>>({});

  const filtered = searchQuery.trim()
    ? domainsList.filter(d =>
      (d.project.title || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (d.subdomain || '').toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : domainsList;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUnpublish = async (projectId: string, e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    setUnpublishingId(projectId);
    try {
      const res = await unpublishProject(projectId);
      if (res.success) {
        const res2 = await listProjects();
        if (res2.success && res2.projects) setProjects(res2.projects);
        if (selectedDomain?.project.id === projectId) {
          const updated = res2.projects?.find(p => p.id === projectId);
          setSelectedDomain(updated ? { project: updated, subdomain: selectedDomain.subdomain } : null);
        }
        await refreshContextProjects?.();
        showAlert('Site taken offline.', 'Take down');
      } else showAlert(res.message || 'Failed to take down', 'Error');
    } catch { showAlert('Failed to take down. Please try again.', 'Error'); }
    finally { setUnpublishingId(null); }
  };

  const handleAddDomainClick = async () => {
    setAddSiteLoading(true);
    try {
      if (projects.length === 0) {
        showAlert('Create a project first from the Web Builder.', 'No Projects');
        return;
      }
      const draft = projects.find(p => (p.status || '').toLowerCase() !== 'published') ?? projects[0];
      setAddModalProjectId(draft?.id ?? projects[0]?.id ?? '');
      setShowAddModal(true);
    } finally {
      setAddSiteLoading(false);
    }
  };

  const refreshProjects = async () => {
    const res = await listProjects();
    if (res.success && res.projects) setProjects(res.projects);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listCustomDomains();
        if (!cancelled && res.success && res.data) {
          const map: Record<string, { domain: string; domainStatus: string; verifiedAt?: string | null }> = {};
          for (const d of res.data) if (d.projectId) map[d.projectId] = { domain: d.domain, domainStatus: d.domainStatus, verifiedAt: d.verifiedAt };
          setCustomDomains(map);
        }
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [selectedDomain?.project.id]);

  const handleAddCustomDomain = async () => {
    if (!selectedDomain) return;
    const trimmed = customDomainInput.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('.')) { setCustomDomainErr('Enter a valid domain. Example: mybusiness.com'); return; }
    setCustomDomainErr(''); setCustomDomainLoading(true);
    try {
      const res = await apiAddCustomDomain(selectedDomain.project.id, trimmed);
      if (res.success) {
        setDnsInstructions(res.dnsInstructions || null);
        setCustomDomains(prev => ({ ...prev, [selectedDomain.project.id]: { domain: trimmed, domainStatus: 'pending' } }));
        showAlert('Custom domain added! Configure your DNS next.', 'Domain Added');
      } else setCustomDomainErr(res.message || 'Failed to add domain');
    } catch (e) { setCustomDomainErr(e instanceof Error ? e.message : 'Failed'); }
    finally { setCustomDomainLoading(false); }
  };

  const handleVerifyDomain = async () => {
    if (!selectedDomain) return;
    setVerifying(true);
    try {
      const res = await apiVerifyCustomDomain(selectedDomain.project.id);
      if (res.success && res.data?.status === 'verified') {
        setCustomDomains(prev => ({ ...prev, [selectedDomain.project.id]: { ...prev[selectedDomain.project.id], domainStatus: 'verified', verifiedAt: new Date().toISOString() } }));
        setDnsInstructions(null);
        showAlert('Domain verified! Your custom domain is now active.', 'Verified ✓');
      } else showAlert(res.message || 'DNS not configured yet. Try again in a few minutes.', 'Not Verified');
    } catch (e) { showAlert(e instanceof Error ? e.message : 'Verification failed', 'Error'); }
    finally { setVerifying(false); }
  };

  const handleRemoveCustomDomain = async () => {
    if (!selectedDomain) return;
    setRemovingDomain(true);
    try {
      const res = await apiRemoveCustomDomain(selectedDomain.project.id);
      if (res.success) {
        setCustomDomains(prev => { const c = { ...prev }; delete c[selectedDomain.project.id]; return c; });
        setDnsInstructions(null);
        showAlert('Custom domain removed.', 'Removed');
      } else showAlert(res.message || 'Failed to remove', 'Error');
    } catch { showAlert('Failed to remove domain', 'Error'); }
    finally { setRemovingDomain(false); }
  };

  const handleEditSubdomainConfirm = async () => {
    if (!selectedDomain) return;
    const err = validateSubdomain(editSubdomainVal);
    if (err) { setEditSubdomainErr(err); return; }
    const normalized = editSubdomainVal.trim().toLowerCase();
    if (normalized === (selectedDomain.subdomain || '').trim().toLowerCase()) { setShowEditSubdomain(false); return; }
    setEditSubdomainErr(''); setUpdatingSubdomain(true);
    try {
      const res = await updateDomainSubdomain(selectedDomain.project.id, normalized);
      if (res.success) {
        const res2 = await listProjects();
        if (res2.success && res2.projects) setProjects(res2.projects);
        const updated = res2.projects?.find(p => p.id === selectedDomain.project.id);
        setSelectedDomain(updated ? { project: updated, subdomain: normalized } : { ...selectedDomain, subdomain: normalized });
        setShowEditSubdomain(false);
        showAlert('Subdomain updated.', 'Updated');
      } else setEditSubdomainErr(res.message || 'Update failed');
    } catch (e) { setEditSubdomainErr(e instanceof Error ? e.message : 'Update failed'); }
    finally { setUpdatingSubdomain(false); }
  };

  const handleCopyUrl = () => {
    if (!siteUrl) return;
    navigator.clipboard.writeText(siteUrl).then(
      () => showAlert('URL copied to clipboard', 'Copied'),
      () => showAlert('Failed to copy URL', 'Error'),
    );
  };

  useEffect(() => {
    if (!selectedDomain?.project.id) { setScheduleInfo(null); setPublishHistory([]); return; }
    let cancelled = false;
    const pid = selectedDomain.project.id;
    getSchedule(pid).then(res => { if (!cancelled) setScheduleInfo(res.success && res.data ? res.data : null); });
    getPublishHistory(pid).then(res => { if (!cancelled) setPublishHistory(res.success && res.data?.history ? res.data.history : []); });
    return () => { cancelled = true; };
  }, [selectedDomain?.project.id, selectedDomain?.project.status]);

  const siteUrl = selectedDomain?.subdomain && isPublished(selectedDomain.project.status)
    ? getSubdomainSiteUrl(selectedDomain.subdomain, origin)
    : '';

  // ── Modal helpers
  const cardBg = 'rgba(14,8,50,0.98)';
  const cardBdr = '1px solid rgba(255,255,255,0.1)';

  return (
    <div className="dashboard-landing-light relative [font-family:var(--font-outfit),sans-serif] space-y-5">

      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/3 w-[600px] h-[500px] rounded-full opacity-[0.06] blur-[120px]"
          style={{ background: 'radial-gradient(circle,#7C3AED,transparent)' }} />
        <div className="absolute top-[300px] right-0 w-[400px] h-[350px] rounded-full opacity-[0.04] blur-[100px]"
          style={{ background: 'radial-gradient(circle,#FFCC00,transparent)' }} />
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <section className="text-center py-4">
        <motion.h1
          className={`inline-block text-[42px] sm:text-[58px] font-extrabold leading-[0.95] tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          My Sites
        </motion.h1>
        <motion.p className="mt-2.5 text-sm" style={{ color: colors.text.muted }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
          Manage and publish your websites
        </motion.p>
        <motion.div className="mt-5 inline-flex"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <button type="button" onClick={handleAddDomainClick} disabled={addSiteLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-85"
            style={{ background: ADD_SITE_BG, boxShadow: '0 10px 24px rgba(217,70,239,0.42)' }}>
            {addSiteLoading ? 'loading...' : <><Plus className="w-3.5 h-3.5" /> Add Site</>}
          </button>
        </motion.div>
      </section>

      {/* ── STAT STRIP ─────────────────────────────────────────────────────── */}
      {!loading && domainsList.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Sites', value: stats.total, icon: Globe, accent: '#a78bfa' },
            { label: 'Published', value: stats.published, icon: Check, accent: '#4ade80' },
            { label: 'In Draft', value: stats.draft, icon: Clock, accent: '#fb923c' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${s.accent}18` }}>
                  <Icon className="w-4 h-4" style={{ color: s.accent }} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold leading-none" style={{ color: colors.text.primary }}>{s.value}</p>
                  <p className="text-[10px] mt-0.5 uppercase tracking-wider font-semibold" style={{ color: colors.text.muted }}>{s.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="rounded-2xl p-10 text-center text-sm" style={{ color: colors.text.muted, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          Loading…
        </div>
      ) : domainsList.length === 0 ? (
        <div className="rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>No sites yet</p>
            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>Publish your first website from the Web Builder.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/m_dashboard/web-builder"
              className="px-4 py-2 text-xs font-semibold rounded-xl border transition-opacity hover:opacity-75"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: colors.text.secondary }}>
              Web Builder
            </Link>
            <button type="button" onClick={handleAddDomainClick} disabled={addSiteLoading}
              className="px-4 py-2 text-xs font-bold rounded-xl text-white"
              style={{ background: ADD_SITE_BG }}>
              {addSiteLoading ? 'loading...' : 'Add site'}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col md:flex-row gap-4 rounded-3xl p-3"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(180deg, rgba(18,22,74,0.52), rgba(11,14,49,0.5))'
              : 'linear-gradient(180deg, #FFFFFF, #F8F8FB)',
            border: theme === 'dark' ? '1px solid rgba(148,163,184,0.18)' : `1px solid ${colors.border.faint}`,
          }}
        >

          {/* List/Grid column */}
          <div className="flex-1 min-w-0 space-y-3">

            {/* Search + view toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                <input type="text" placeholder="Search by title or subdomain…"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : colors.bg.searchBar,
                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${colors.border.faint}`,
                    color: colors.text.primary,
                  }} />
              </div>
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : colors.bg.searchBar, border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${colors.border.faint}` }}>
                {([['grid', LayoutGrid], ['list', List]] as const).map(([mode, Icon]) => (
                  <button key={mode} type="button" onClick={() => setViewMode(mode)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ backgroundColor: viewMode === mode ? (theme === 'dark' ? 'rgba(255,255,255,0.1)' : colors.bg.card) : 'transparent', color: viewMode === mode ? colors.text.primary : colors.text.muted }}>
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="text-xs py-8 text-center" style={{ color: colors.text.muted }}>
                {searchQuery.trim() ? 'No sites match your search.' : 'No sites yet.'}
              </p>
            ) : viewMode === 'grid' ? (

              /* ─── GRID ─── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map(({ project, subdomain }) => {
                  const pub = isPublished(project.status);
                  const canVisit = Boolean(subdomain && pub);
                  const isSelected = selectedDomain?.project.id === project.id;
                  return (
                    <motion.div key={project.id}
                      className="relative rounded-2xl overflow-hidden cursor-pointer transition-all"
                      style={{
                        background: theme === 'dark'
                          ? 'linear-gradient(180deg, rgba(24,32,88,0.55), rgba(14,18,58,0.78))'
                          : 'linear-gradient(180deg, #FFFFFF, #F8F8FB)',
                        border: isSelected
                          ? `1px solid ${theme === 'dark' ? 'rgba(96,165,250,0.6)' : colors.accent.purple}`
                          : `1px solid ${theme === 'dark' ? 'rgba(148,163,184,0.18)' : colors.border.faint}`,
                        boxShadow: isSelected
                          ? (theme === 'dark' ? '0 0 0 1px rgba(96,165,250,0.28), 0 10px 24px rgba(7,10,34,0.28)' : '0 8px 24px rgba(103,2,191,0.15)')
                          : (theme === 'dark' ? '0 8px 18px rgba(7,10,34,0.22)' : '0 6px 18px rgba(21,9,62,0.08)'),
                      }}
                      whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDomain({ project, subdomain })}>
                      {/* Thumbnail */}
                      <div className="relative w-full" style={{ borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.07)' : `1px solid ${colors.border.faint}` }}>
                        <DraftPreviewThumbnail projectId={project.id} borderColor={theme === 'dark' ? 'rgba(255,255,255,0.07)' : colors.border.faint} bgColor={theme === 'dark' ? 'rgba(255,255,255,0.03)' : colors.bg.searchBar} />
                        <div className="absolute top-2 right-2"><StatusBadge published={pub} /></div>
                      </div>
                      {/* Content */}
                      <div className="p-3 space-y-2.5">
                        <div>
                          <h3 className="font-semibold text-sm truncate" style={{ color: colors.text.primary }}>{project.title}</h3>
                          <p className="text-[10px] font-mono truncate mt-0.5" style={{ color: colors.text.muted }}>
                            {subdomain ? getDisplayUrl(subdomain, origin) : 'No subdomain'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {canVisit ? (
                            <a href={getSubdomainSiteUrl(subdomain as string, origin)} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-semibold text-white transition-opacity hover:opacity-85"
                              style={{ background: VISIT_BG }}>
                              <ExternalLink size={11} /> Visit
                            </a>
                          ) : (
                            <a href={`/design?projectId=${project.id}`} onClick={e => e.stopPropagation()}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-semibold text-white transition-opacity hover:opacity-85"
                              style={{ background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)' }}>
                              <ExternalLink size={11} /> Publish to go live
                            </a>
                          )}
                          {pub && (
                            <button type="button" onClick={e => handleUnpublish(project.id, e)}
                              disabled={unpublishingId === project.id}
                              className="flex items-center justify-center p-1.5 rounded-xl border disabled:opacity-40 hover:opacity-75 transition-opacity"
                              style={{ borderColor: 'rgba(248,113,113,0.3)', backgroundColor: 'rgba(248,113,113,0.08)', color: '#f87171' }}>
                              <ArrowDownToLine size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

            ) : (

              /* ─── LIST ─── */
              <div className="space-y-2">
                {filtered.map(({ project, subdomain }) => {
                  const pub = isPublished(project.status);
                  const canVisit = Boolean(subdomain && pub);
                  const cardUrl = canVisit ? getSubdomainSiteUrl(subdomain as string, origin) : '';
                  const isSelected = selectedDomain?.project.id === project.id;
                  return (
                    <motion.div key={project.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition-all hover:bg-white/[0.02]"
                      style={{
                        background: theme === 'dark'
                          ? 'linear-gradient(180deg, rgba(24,32,88,0.5), rgba(14,18,58,0.68))'
                          : 'linear-gradient(180deg, #FFFFFF, #F8F8FB)',
                        border: isSelected
                          ? `1px solid ${theme === 'dark' ? 'rgba(96,165,250,0.55)' : colors.accent.purple}`
                          : `1px solid ${theme === 'dark' ? 'rgba(148,163,184,0.18)' : colors.border.faint}`,
                      }}
                      onClick={() => setSelectedDomain({ project, subdomain })}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: colors.text.primary }}>{project.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[11px] font-mono truncate" style={{ color: colors.text.muted }}>
                            {subdomain ? getDisplayUrl(subdomain, origin) : 'No subdomain'}
                          </p>
                          {cardUrl && (
                            <button type="button" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(cardUrl).then(() => showAlert('Copied', 'Copied'), () => { }); }}
                              className="p-0.5 rounded hover:opacity-70 flex-shrink-0" style={{ color: colors.text.muted }}>
                              <Copy size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge published={pub} />
                        <a href={canVisit ? getSubdomainSiteUrl(subdomain as string, origin) : `/design?projectId=${project.id}`}
                          target={canVisit ? '_blank' : '_self'} rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl transition-opacity hover:opacity-85"
                          style={{ background: canVisit ? VISIT_BG : GRAD, color: '#fff' }}>
                          <ExternalLink size={12} />{canVisit ? 'Visit' : 'Publish'}
                        </a>
                        {pub && (
                          <button type="button" onClick={e => handleUnpublish(project.id, e)}
                            disabled={unpublishingId === project.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-xl border disabled:opacity-40 hover:opacity-75 transition-opacity"
                            style={{ borderColor: 'rgba(248,113,113,0.3)', color: '#f87171' }}>
                            <ArrowDownToLine size={12} />
                            {unpublishingId === project.id ? 'Taking down…' : 'Take down'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── SIDEBAR ─── */}
          <AnimatePresence>
            {selectedDomain && (
              <motion.aside
                key="sidebar"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="w-full md:w-80 shrink-0 rounded-2xl overflow-hidden flex flex-col"
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(180deg, rgba(20,26,84,0.62), rgba(12,16,56,0.74))'
                    : 'linear-gradient(180deg, #FFFFFF, #F8F8FB)',
                  border: theme === 'dark' ? '1px solid rgba(148,163,184,0.22)' : `1px solid ${colors.border.faint}`,
                  boxShadow: theme === 'dark' ? '0 12px 30px rgba(7,10,34,0.28)' : '0 8px 24px rgba(21,9,62,0.08)',
                  maxHeight: 700,
                }}>

                {/* Sidebar header */}
                <div className="px-4 py-3.5 flex items-center justify-between flex-shrink-0"
                  style={{ borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.07)' : `1px solid ${colors.border.faint}` }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: colors.text.primary }}>Website Details</p>
                    <p className="text-[10px] mt-0.5 truncate max-w-[200px]" style={{ color: colors.text.muted }}>{selectedDomain.project.title}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedDomain(null)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : colors.bg.searchBar, color: colors.text.muted }}>
                    <X size={14} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                  <SidebarRow icon={<FileText size={10} />} label="Title">
                    <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>{selectedDomain.project.title}</p>
                  </SidebarRow>

                  <SidebarRow icon={<Globe size={10} />} label="Subdomain"
                    action={selectedDomain.subdomain ? (
                      <button onClick={() => { setEditSubdomainVal(selectedDomain.subdomain ?? ''); setEditSubdomainErr(''); setShowEditSubdomain(true); }}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold hover:opacity-70 transition-opacity"
                        style={{ color: colors.text.muted }}>
                        <Pencil size={10} /> Edit
                      </button>
                    ) : undefined}>
                    <p className="text-xs font-mono" style={{ color: colors.text.primary }}>
                      {selectedDomain.subdomain ? getDisplayUrl(selectedDomain.subdomain, origin) : 'No subdomain'}
                    </p>
                  </SidebarRow>

                  <SidebarRow icon={<ExternalLink size={10} />} label="Live URL"
                    action={siteUrl ? (
                      <button onClick={handleCopyUrl} className="inline-flex items-center gap-1 text-[10px] font-semibold hover:opacity-70" style={{ color: colors.text.muted }}>
                        <Copy size={10} /> Copy
                      </button>
                    ) : undefined}>
                    {siteUrl ? (
                      <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-mono break-all hover:underline" style={{ color: '#a78bfa' }}>
                        {siteUrl}
                      </a>
                    ) : (
                      <p className="text-xs" style={{ color: colors.text.muted }}>—</p>
                    )}
                  </SidebarRow>

                  <SidebarRow icon={<Check size={10} />} label="Status">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge published={isPublished(selectedDomain.project.status)} />
                      {isPublished(selectedDomain.project.status) && (
                        <button type="button" onClick={() => handleUnpublish(selectedDomain.project.id)}
                          disabled={unpublishingId === selectedDomain.project.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg border disabled:opacity-40 hover:opacity-75 transition-opacity"
                          style={{ borderColor: 'rgba(248,113,113,0.3)', color: '#f87171' }}>
                          <ArrowDownToLine size={11} />
                          {unpublishingId === selectedDomain.project.id ? 'Taking down…' : 'Take down'}
                        </button>
                      )}
                    </div>
                  </SidebarRow>

                  {/* Custom domain */}
                  {isPublished(selectedDomain.project.status) && (
                    <div className="pt-3.5 space-y-2.5" style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.07)' : `1px solid ${colors.border.faint}` }}>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <Link2 size={10} /> Custom Domain
                      </div>

                      {customDomains[selectedDomain.project.id] ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono flex-1 truncate" style={{ color: colors.text.primary }}>
                              {customDomains[selectedDomain.project.id].domain}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold"
                              style={{
                                backgroundColor: customDomains[selectedDomain.project.id].domainStatus === 'verified' ? 'rgba(74,222,128,0.12)' : 'rgba(251,146,60,0.12)',
                                color: customDomains[selectedDomain.project.id].domainStatus === 'verified' ? '#4ade80' : '#fb923c',
                              }}>
                              {customDomains[selectedDomain.project.id].domainStatus === 'verified'
                                ? <><ShieldCheck size={10} /> Verified</>
                                : <><AlertTriangle size={10} /> Pending</>}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {customDomains[selectedDomain.project.id].domainStatus !== 'verified' && (
                              <button type="button" onClick={handleVerifyDomain} disabled={verifying}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-xl text-white disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg,#15803d,#22c55e)' }}>
                                {verifying ? <><Loader2 size={11} className="animate-spin" /> Verifying…</> : <><ShieldCheck size={11} /> Verify DNS</>}
                              </button>
                            )}
                            <button type="button" onClick={handleRemoveCustomDomain} disabled={removingDomain}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-semibold rounded-xl border disabled:opacity-40 hover:opacity-75 transition-opacity"
                              style={{ borderColor: 'rgba(248,113,113,0.3)', color: '#f87171' }}>
                              {removingDomain ? <Loader2 size={11} className="animate-spin" /> : <><Unlink size={11} /> Remove</>}
                            </button>
                          </div>
                          {customDomains[selectedDomain.project.id].domainStatus !== 'verified' && dnsInstructions && (
                            <div className="p-3 rounded-xl text-[11px] space-y-2"
                              style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : colors.bg.searchBar, border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${colors.border.faint}` }}>
                              <p className="font-bold" style={{ color: colors.text.primary }}>DNS Setup</p>
                              <p style={{ color: colors.text.secondary }}>{dnsInstructions.message}</p>
                              {[['Option A — A Record', dnsInstructions.optionA], ['Option B — CNAME', dnsInstructions.optionB]].map(([label, opt]: any) => (
                                <div key={label} className="space-y-1">
                                  <p className="font-semibold" style={{ color: colors.text.primary }}>{label}</p>
                                  <div className="font-mono p-2 rounded-lg text-[10px] space-y-0.5"
                                    style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : colors.bg.card, color: colors.text.secondary }}>
                                    <p>Type: {opt.type}</p><p>Host: {opt.host}</p><p>Value: {opt.value}</p>
                                  </div>
                                </div>
                              ))}
                              <p style={{ color: colors.text.muted }}>DNS changes can take up to 48h. Click &quot;Verify DNS&quot; once configured.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button type="button"
                          onClick={() => { setCustomDomainInput(''); setCustomDomainErr(''); setDnsInstructions(null); setShowCustomModal(true); }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-semibold rounded-xl border border-dashed hover:opacity-75 transition-opacity"
                          style={{ borderColor: 'rgba(255,255,255,0.15)', color: colors.text.muted }}>
                          <Link2 size={13} /> Connect custom domain
                        </button>
                      )}
                    </div>
                  )}

                  {/* Dates */}
                  {[['Created', selectedDomain.project.createdAt], ['Last updated', selectedDomain.project.updatedAt]].map(([label, val]) =>
                    val ? (
                      <SidebarRow key={label as string} icon={<Calendar size={10} />} label={label as string}>
                        <p className="text-xs" style={{ color: colors.text.primary }}>
                          {new Date(val as string).toLocaleString()}
                        </p>
                      </SidebarRow>
                    ) : null
                  )}

                  {/* Publish history */}
                  <div className="pt-3.5" style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.07)' : `1px solid ${colors.border.faint}` }}>
                    <button type="button" onClick={() => setHistoryExpanded(!historyExpanded)}
                      className="flex items-center gap-2 w-full text-left text-xs font-bold hover:opacity-75 transition-opacity"
                      style={{ color: colors.text.primary }}>
                      <Calendar size={13} /> Publish History
                      <span className="ml-auto">{historyExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
                    </button>
                    <AnimatePresence>
                      {historyExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-2 overflow-hidden">
                          <div className="flex items-center justify-between text-[11px]">
                            <span style={{ color: colors.text.muted }}>Status</span>
                            <StatusBadge published={isPublished(selectedDomain.project.status)} />
                          </div>
                          {scheduleInfo?.scheduledAt && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span style={{ color: colors.text.muted }}>Next scheduled</span>
                              <span style={{ color: colors.text.primary }}>{new Date(scheduleInfo.scheduledAt).toLocaleString()}</span>
                            </div>
                          )}
                          <p className="text-[10px] uppercase tracking-wider font-bold mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            Last 10 changes
                          </p>
                          {publishHistory.length > 0 ? (
                            <ul className="space-y-1 max-h-40 overflow-y-auto">
                              {publishHistory.map((entry, i) => (
                                <li key={`${entry.at}-${i}`}
                                  className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-xl text-[10px]"
                                  style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : colors.bg.searchBar, borderLeft: theme === 'dark' ? '2px solid rgba(167,139,250,0.5)' : `2px solid ${colors.accent.purple}` }}>
                                  <span className="capitalize font-semibold" style={{ color: colors.text.secondary }}>{entry.type}</span>
                                  <span style={{ color: colors.text.muted }}>{new Date(entry.at).toLocaleString()}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px]" style={{ color: colors.text.muted }}>No history yet.</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      <PublishModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => { showAlert('Site published!', 'Published'); refreshProjects(); setShowAddModal(false); }}
        projectId={addModalProjectId}
        projectTitle={projects.find(p => p.id === addModalProjectId)?.title ?? ''}
        existingSubdomain={projects.find(p => p.id === addModalProjectId)?.subdomain}
        projects={projects.length > 1 ? projects.map(p => ({ id: p.id, title: p.title, subdomain: p.subdomain })) : undefined}
        onProjectChange={projects.length > 1 ? id => setAddModalProjectId(id) : undefined}
      />

      <AnimatePresence>
        {/* Edit Subdomain */}
        {showEditSubdomain && selectedDomain && (
          <motion.div key="edit-sub-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
            onClick={() => !updatingSubdomain && setShowEditSubdomain(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: cardBg, border: cardBdr }}>
              <div className="h-px" style={{ background: GRAD }} />
              <div className="px-6 py-5">
                <h3 className="text-base font-bold mb-1" style={{ color: colors.text.primary }}>Edit Subdomain</h3>
                <p className="text-xs mb-5" style={{ color: colors.text.muted }}>Update the subdomain for <strong style={{ color: colors.text.secondary }}>{selectedDomain.project.title}</strong></p>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: colors.text.muted }}>New subdomain</label>
                <input type="text" placeholder="e.g. newsite" value={editSubdomainVal}
                  onChange={e => { setEditSubdomainVal(e.target.value); setEditSubdomainErr(''); }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${editSubdomainErr ? '#f87171' : 'rgba(255,255,255,0.1)'}`, color: colors.text.primary }} />
                {editSubdomainErr && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{editSubdomainErr}</p>}
                <div className="flex gap-2 mt-5">
                  <button type="button" onClick={() => !updatingSubdomain && setShowEditSubdomain(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold border hover:opacity-75"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: colors.text.secondary }}>Cancel</button>
                  <button type="button" onClick={handleEditSubdomainConfirm} disabled={updatingSubdomain}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 hover:opacity-85"
                    style={{ background: GRAD }}>
                    {updatingSubdomain ? 'Updating…' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Custom Domain */}
        {showCustomModal && selectedDomain && (
          <motion.div key="custom-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
            onClick={() => !customDomainLoading && setShowCustomModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: cardBg, border: cardBdr }}>
              <div className="h-px" style={{ background: GRAD }} />
              <div className="px-6 py-5">
                <h3 className="text-base font-bold mb-1" style={{ color: colors.text.primary }}>Connect Custom Domain</h3>
                <p className="text-xs mb-5" style={{ color: colors.text.muted }}>
                  Link your own domain to <strong style={{ color: colors.text.secondary }}>{selectedDomain.project.title}</strong>
                </p>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: colors.text.muted }}>Domain</label>
                <input type="text" placeholder="e.g. mybusiness.com" value={customDomainInput}
                  onChange={e => { setCustomDomainInput(e.target.value); setCustomDomainErr(''); }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${customDomainErr ? '#f87171' : 'rgba(255,255,255,0.1)'}`, color: colors.text.primary }} />
                <p className="text-[11px] mt-1.5" style={{ color: colors.text.muted }}>You&apos;ll configure DNS records after.</p>
                {customDomainErr && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{customDomainErr}</p>}
                <div className="flex gap-2 mt-5">
                  <button type="button" onClick={() => !customDomainLoading && setShowCustomModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold border hover:opacity-75"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: colors.text.secondary }}>Cancel</button>
                  <button type="button" onClick={async () => { await handleAddCustomDomain(); if (!customDomainErr) setShowCustomModal(false); }}
                    disabled={customDomainLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 hover:opacity-85"
                    style={{ background: GRAD }}>
                    {customDomainLoading ? 'Connecting…' : 'Connect Domain'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}