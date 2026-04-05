'use client';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { DomainCard } from '@/app/m_dashboard/domains/card/domainCard';
import { DomainListRow } from '@/app/m_dashboard/domains/list/domainListRow';
import { DomainDetailsSidebar } from '@/app/m_dashboard/domains/sidebar/domainDetailsSidebar';
import { SearchBar } from '../components/ui/searchbar';
import { StatsAnalytics } from '../components/ui/statsAnalytics';
import { ViewModeToggle } from '../components/buttons/viewModeToggle';
import { EmptyState } from '../components/ui/emptyState';
import {
  Globe, Plus, Check, Clock,
} from 'lucide-react';
import { getSubdomainSiteUrl } from '@/lib/siteUrls';

// ─── Constants ────────────────────────────────────────────────────────────────

const GRAD = 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)';
const ADD_SITE_BG = 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)';
const VISIT_BG = 'linear-gradient(135deg, #22c55e 0%, #16a34a 55%, #15803d 100%)';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

type DomainEntry = { project: Project; subdomain: string | null };

export default function DomainsPage() {
  const router = useRouter();
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

  const statCards = [
    { id: 'total-sites', label: 'TOTAL SITES', value: stats.total, icon: Globe, accent: '#a78bfa' },
    { id: 'published-sites', label: 'PUBLISHED', value: stats.published, icon: Check, accent: '#4ade80' },
    { id: 'draft-sites', label: 'IN DRAFT', value: stats.draft, icon: Clock, accent: '#fb923c' },
  ];

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
  }, [selectedDomain?.project.id, selectedDomain?.project.status]);

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
  const tableHeaderBg = theme === 'dark' ? '#1E1B4B' : '#803BED';

  return (
    <div className="dashboard-landing-light relative min-h-[calc(1  00vh-176px)] px-3 py-3 sm:px-5 sm:py-4 lg:px-25 [font-family:var(--font-outfit),sans-serif] space-y-5">

      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/3 w-[600px] h-[500px] rounded-full opacity-[0.06] blur-[120px]"
          style={{ background: 'radial-gradient(circle,#7C3AED,transparent)' }} />
        <div className="absolute top-[300px] right-0 w-[400px] h-[350px] rounded-full opacity-[0.04] blur-[100px]"
          style={{ background: 'radial-gradient(circle,#FFCC00,transparent)' }} />
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <section className="text-center py-4">
        <h1
            className="text-4xl sm:text-6xl lg:text-[76px] font-black tracking-[-1.8px] leading-[1.2] [font-family:var(--font-outfit),sans-serif]"
            style={{ color: colors.text.primary }}
          >
            My{' '}
            <span
              className={`inline-block bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
              style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}
            >
              Sites
            </span>
          </h1>
          {/* Subtitle */}
          <p className={`text-base sm:text-lg mt-2 ${theme === 'dark' ? 'text-[#8A8FC4]' : 'text-[#120533]/70'}`}>
            Manage and publish your websites
          </p>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          theme={theme as 'light' | 'dark'}
          placeholder="Search by title or subdomain..."
          className="mx-auto mt-6 max-w-[860px]"
        />

      </section>

      {/* ── STAT STRIP ─────────────────────────────────────────────────────── */}
      {!loading && domainsList.length > 0 && (
        <StatsAnalytics cards={statCards} gridCols="grid-cols-1 sm:grid-cols-3" gap="gap-3" />
      )}

      {!loading && domainsList.length > 0 && (
        <div className="flex items-center justify-between mt-1">
          <button
            type="button"
            onClick={handleAddDomainClick}
            disabled={addSiteLoading}
            className="inline-flex h-10 items-center gap-2 px-5 py-5.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-1 hover:brightness-110 active:scale-95 disabled:opacity-70"
            style={{
              background: theme === 'dark' ? '#FACC15' : ADD_SITE_BG,
              color: theme === 'dark' ? '#120533' : '#FFFFFF',
              boxShadow: theme === 'dark'
                ? '0 8px 24px rgba(255, 206, 0, 0.42)'
                : '0 8px 24px rgba(217,70,239,0.4)',
            }}
          >
            {addSiteLoading ? 'loading...' : <><Plus className="w-3.5 h-3.5" /> Add Site</>}
          </button>

          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            theme={theme as 'light' | 'dark'}
          />
        </div>
      )}

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="rounded-2xl p-10 text-center text-sm" style={{ color: colors.text.muted, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          Loading…
        </div>
      ) : domainsList.length === 0 ? (
        <EmptyState
          tone={theme as 'light' | 'dark'}
          badgeText="Domains"
          title="No sites yet"
          description="Publish your first website from the Web Builder."
          primaryAction={{
            label: addSiteLoading ? 'Loading...' : 'Add Site',
            onClick: handleAddDomainClick,
            disabled: addSiteLoading,
          }}
          secondaryAction={{
            label: 'Web Builder',
            onClick: () => router.push('/m_dashboard/web-builder'),
          }}
          className="max-w-none! mx-0! py-10!"
        />
      ) : (
        <div
          className="flex flex-col md:flex-row gap-4 rounded-3xl py-3">
          {/* List/Grid column */}
          <div className="flex-1 min-w-0 space-y-3">

            {filtered.length === 0 ? (
              <p className="text-xs py-8 text-center" style={{ color: colors.text.muted }}>
                {searchQuery.trim() ? 'No sites match your search.' : 'No sites yet.'}
              </p>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(({ project, subdomain }) => (
                  <DomainCard
                    key={project.id}
                    project={project}
                    subdomain={subdomain}
                    origin={origin}
                    theme={theme as 'light' | 'dark'}
                    colors={colors}
                    selected={selectedDomain?.project.id === project.id}
                    unpublishingId={unpublishingId}
                    onSelect={(selectedProject: Project, selectedSubdomain: string | null) => setSelectedDomain({ project: selectedProject, subdomain: selectedSubdomain })}
                    onUnpublish={handleUnpublish}
                  />
                ))}
              </div>
            ) : (
              <div
                className="overflow-hidden rounded-3xl border"
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(180deg, rgba(24,32,88,0.5), rgba(14,18,58,0.68))'
                    : '#FFFFFF',
                  borderColor: theme === 'dark' ? 'rgba(148,163,184,0.18)' : colors.border.faint,
                  boxShadow: theme === 'dark' ? '0 12px 30px rgba(7,10,34,0.18)' : '0 8px 24px rgba(21,9,62,0.06)',
                }}
              >
                <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                  <table className="w-full min-w-[980px] border-collapse">
                    <colgroup>
                      <col style={{ width: '34%' }} />
                      <col style={{ width: '28%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '22%' }} />
                    </colgroup>
                    <thead>
                      <tr
                        style={{
                          color: '#FFFFFF',
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                        }}
                      >
                        <th
                          className="sticky top-0 z-10 px-5 py-4 text-left"
                          style={{ background: tableHeaderBg }}
                        >
                          Site
                        </th>
                        <th
                          className="sticky top-0 z-10 px-5 py-4 text-left"
                          style={{ background: tableHeaderBg }}
                        >
                          URL
                        </th>
                        <th
                          className="sticky top-0 z-10 px-5 py-4 text-center"
                          style={{ background: tableHeaderBg }}
                        >
                          Status
                        </th>
                        <th
                          className="sticky top-0 z-10 px-5 py-4 text-center"
                          style={{ background: tableHeaderBg }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-14 text-center">
                            <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                              {searchQuery.trim() ? 'No sites match your search.' : 'No sites yet.'}
                            </p>
                            <p className="mt-1 text-xs" style={{ color: colors.text.muted }}>
                              Add a site to start managing domains.
                            </p>
                          </td>
                        </tr>
                      ) : filtered.map(({ project, subdomain }) => (
                        <DomainListRow
                          key={project.id}
                          project={project}
                          subdomain={subdomain}
                          origin={origin}
                          theme={theme as 'light' | 'dark'}
                          colors={colors}
                          selected={selectedDomain?.project.id === project.id}
                          unpublishingId={unpublishingId}
                          onSelect={(selectedProject: Project, selectedSubdomain: string | null) => setSelectedDomain({ project: selectedProject, subdomain: selectedSubdomain })}
                          onUnpublish={handleUnpublish}
                          onCopyUrl={(url: string) => navigator.clipboard.writeText(url).then(() => showAlert('URL copied to clipboard', 'Copied'), () => showAlert('Failed to copy URL', 'Error'))}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ─── SIDEBAR ─── */}
          <AnimatePresence>
            <DomainDetailsSidebar
              selectedDomain={selectedDomain}
              theme={theme as 'light' | 'dark'}
              colors={colors}
              origin={origin}
              scheduleInfo={scheduleInfo}
              publishHistory={publishHistory}
              unpublishingId={unpublishingId}
              historyExpanded={historyExpanded}
              setHistoryExpanded={setHistoryExpanded}
              customDomains={customDomains}
              dnsInstructions={dnsInstructions}
              verifying={verifying}
              removingDomain={removingDomain}
              onClose={() => setSelectedDomain(null)}
              onOpenEditSubdomain={() => {
                if (!selectedDomain) return;
                setEditSubdomainVal(selectedDomain.subdomain ?? '');
                setEditSubdomainErr('');
                setShowEditSubdomain(true);
              }}
              onCopyUrl={handleCopyUrl}
              onUnpublish={handleUnpublish}
              onVerifyDomain={handleVerifyDomain}
              onRemoveCustomDomain={handleRemoveCustomDomain}
              onOpenCustomDomainModal={() => {
                setCustomDomainInput('');
                setCustomDomainErr('');
                setDnsInstructions(null);
                setShowCustomModal(true);
              }}
            />
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