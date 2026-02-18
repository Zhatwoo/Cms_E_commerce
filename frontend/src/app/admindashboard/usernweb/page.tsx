'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import {
  getDomainsManagement,
  getClients,
  updateClientPlan,
  updateClientStatus,
  deleteClient,
  type WebsiteManagementRow,
  type ClientRow,
} from '@/lib/api';

const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const TrashIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PauseIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlayIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span
        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10"
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}

type TabId = 'clients' | 'domains';

const PLAN_OPTIONS = ['free', 'basic', 'pro'] as const;

function planLabel(plan: string) {
  const p = (plan || 'free').toLowerCase();
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function planBadgeColor(plan: string) {
  switch ((plan || '').toLowerCase()) {
    case 'pro': return 'bg-purple-100 text-purple-800';
    case 'basic': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-900';
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'Live': return 'text-green-600';
    case 'Flagged': return 'text-red-600';
    default: return 'text-yellow-600';
  }
}

/** Normalize backend status to display label (Active / Suspended / Restricted). */
function clientStatusLabel(status: string, isActive?: boolean): string {
  const s = (status || '').toLowerCase();
  if (s === 'suspended') return 'Suspended';
  if (s === 'restricted') return 'Restricted';
  if (s === 'published' || s === 'active' || isActive === true) return 'Active';
  return status || 'Active';
}

function isClientActive(client: ClientRow): boolean {
  const s = (client.status || '').toLowerCase();
  return s === 'published' || s === 'active' || client.isActive === true;
}

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

/* ─────────────── Client Management Tab ─────────────── */

function ClientManagementTab() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getClients();
      if (res.success && Array.isArray(res.users)) {
        setClients(res.users);
      } else {
        setClients([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch = !search ||
        (c.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase());
      const matchPlan = !planFilter || (c.subscriptionPlan || 'free').toLowerCase() === planFilter.toLowerCase();
      const active = isClientActive(c);
      const matchStatus =
        !statusFilter ||
        (statusFilter === 'active' && active) ||
        (statusFilter === 'suspended' && (c.status || '').toLowerCase() === 'suspended') ||
        (statusFilter === 'restricted' && (c.status || '').toLowerCase() === 'restricted');
      return matchSearch && matchPlan && matchStatus;
    });
  }, [clients, search, planFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = clients.length;
    const free = clients.filter((c) => (c.subscriptionPlan || 'free').toLowerCase() === 'free').length;
    const basic = clients.filter((c) => (c.subscriptionPlan || '').toLowerCase() === 'basic').length;
    const pro = clients.filter((c) => (c.subscriptionPlan || '').toLowerCase() === 'pro').length;
    const active = clients.filter((c) => isClientActive(c)).length;
    const suspended = clients.filter((c) => (c.status || '').toLowerCase() === 'suspended').length;
    return { total, free, basic, pro, active, suspended };
  }, [clients]);

  const handlePlanChange = async (userId: string, newPlan: string) => {
    setSavingId(userId);
    try {
      const res = await updateClientPlan(userId, newPlan);
      if (res.success) {
        setClients((prev) =>
          prev.map((c) => (c.id === userId ? { ...c, subscriptionPlan: newPlan } : c))
        );
        setToast(`Plan updated to ${planLabel(newPlan)}`);
        setTimeout(() => setToast(null), 2500);
      } else {
        setToast(res.message || 'Update failed');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Update failed');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSavingId(null);
    }
  };

  const handleSuspend = async (client: ClientRow) => {
    setActionLoadingId(client.id);
    try {
      const res = await updateClientStatus(client.id, 'Suspended');
      if (res.success) {
        setClients((prev) =>
          prev.map((c) => (c.id === client.id ? { ...c, status: 'Suspended', isActive: false } : c))
        );
        setToast('Client suspended.');
        setTimeout(() => setToast(null), 2500);
      } else {
        setToast(res.message || 'Failed to suspend');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to suspend');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActivate = async (client: ClientRow) => {
    setActionLoadingId(client.id);
    try {
      const res = await updateClientStatus(client.id, 'Published');
      if (res.success) {
        setClients((prev) =>
          prev.map((c) => (c.id === client.id ? { ...c, status: 'Published', isActive: true } : c))
        );
        setToast('Client activated.');
        setTimeout(() => setToast(null), 2500);
      } else {
        setToast(res.message || 'Failed to activate');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to activate');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteClick = (client: ClientRow) => setDeleteConfirmId(client.id);
  const handleDeleteConfirm = async () => {
    const id = deleteConfirmId;
    if (!id) return;
    setDeleteConfirmId(null);
    setActionLoadingId(id);
    try {
      const res = await deleteClient(id);
      if (res.success) {
        setClients((prev) => prev.filter((c) => c.id !== id));
        setToast('Client removed.');
        setTimeout(() => setToast(null), 2500);
      } else {
        setToast(res.message || 'Delete failed');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Delete failed');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <>
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Clients</p>
          <p className="text-4xl font-bold text-gray-900">{loading ? '—' : stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Active</p>
          <p className="text-4xl font-bold text-green-600">{loading ? '—' : stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Suspended</p>
          <p className="text-4xl font-bold text-red-600">{loading ? '—' : stats.suspended}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Free</p>
          <p className="text-4xl font-bold text-gray-600">{loading ? '—' : stats.free}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Basic</p>
          <p className="text-4xl font-bold text-blue-600">{loading ? '—' : stats.basic}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Pro</p>
          <p className="text-4xl font-bold text-purple-600">{loading ? '—' : stats.pro}</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Use <strong>Status</strong> and <strong>Plan</strong> filters to narrow the list. Change plan from the dropdown; use <strong>Suspend</strong> / <strong>Activate</strong> or <strong>Delete</strong> in Actions (delete is permanent).
      </p>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-80 relative">
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2"><SearchIcon /></div>
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px]"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="restricted">Restricted</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDownIcon /></div>
            </div>
            <div className="relative">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px]"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDownIcon /></div>
            </div>
          </div>
        </div>

        {/* Delete confirmation modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete client?</h3>
              <p className="text-gray-600 text-sm mb-6">
                This will permanently remove the client and their data. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Plan</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="px-4 py-5 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Loading…</td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((client) => {
                  const active = isClientActive(client);
                  const busy = actionLoadingId === client.id;
                  return (
                    <tr key={client.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-5 text-sm font-medium text-gray-900">{client.displayName || '—'}</td>
                      <td className="px-4 py-5 text-sm text-gray-900">{client.email}</td>
                      <td className="px-4 py-5 text-sm">
                        <span className={`font-medium ${
                          active ? 'text-green-600' :
                          (client.status || '').toLowerCase() === 'suspended' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {clientStatusLabel(client.status, client.isActive)}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-sm">
                        <span className="inline-flex items-center gap-2">
                          <select
                            value={(client.subscriptionPlan || 'free').toLowerCase()}
                            disabled={savingId === client.id}
                            onChange={(e) => handlePlanChange(client.id, e.target.value)}
                            className="min-w-[100px] px-3 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {PLAN_OPTIONS.map((p) => (
                              <option key={p} value={p} className="text-gray-900 bg-white">
                                {planLabel(p)}
                              </option>
                            ))}
                          </select>
                          {savingId === client.id && <span className="text-xs text-gray-500">Saving…</span>}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-sm text-gray-600">{formatDate(client.createdAt)}</td>
                      <td className="px-4 py-5 text-sm text-right">
                        <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                          {active ? (
                            <Tooltip label="Suspend client">
                              <button
                                onClick={() => handleSuspend(client)}
                                disabled={busy}
                                className="p-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
                                aria-label="Suspend client"
                              >
                                {busy ? <span className="text-xs">…</span> : <PauseIcon className="h-5 w-5" />}
                              </button>
                            </Tooltip>
                          ) : (
                            <Tooltip label="Activate client">
                              <button
                                onClick={() => handleActivate(client)}
                                disabled={busy}
                                className="p-2 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                                aria-label="Activate client"
                              >
                                {busy ? <span className="text-xs">…</span> : <PlayIcon className="h-5 w-5" />}
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip label="Delete client (permanent)">
                            <button
                              onClick={() => handleDeleteClick(client)}
                              disabled={busy}
                              className="p-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                              aria-label="Delete client"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No clients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ─────────────── Domain Management Tab ─────────────── */

function DomainManagementTab() {
  const router = useRouter();
  const [websites, setWebsites] = useState<WebsiteManagementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, live: 0, underReview: 0, flagged: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [domainTypeFilter, setDomainTypeFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getDomainsManagement();
        if (cancelled) return;
        if (res.success) {
          setWebsites(Array.isArray(res.data) ? res.data : []);
          if (res.stats) setStats(res.stats);
        } else {
          setWebsites([]);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load data');
          setWebsites([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return websites.filter((w) => {
      const matchSearch = !search ||
        w.domainName.toLowerCase().includes(search.toLowerCase()) ||
        w.owner.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || w.status === statusFilter;
      const matchPlan = !planFilter || w.plan === planFilter;
      const matchType = !domainTypeFilter || w.domainType === domainTypeFilter;
      return matchSearch && matchStatus && matchPlan && matchType;
    });
  }, [websites, search, statusFilter, planFilter, domainTypeFilter]);

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Websites</p>
          <p className="text-4xl font-bold text-gray-900">{loading ? '—' : stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Live</p>
          <p className="text-4xl font-bold text-green-600">{loading ? '—' : stats.live}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Under Review</p>
          <p className="text-4xl font-bold text-yellow-500">{loading ? '—' : stats.underReview}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Flagged</p>
          <p className="text-4xl font-bold text-red-600">{loading ? '—' : stats.flagged}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-80 relative">
              <input
                type="text"
                placeholder="Search domain or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2"><SearchIcon /></div>
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px]">
                <option value="">Status</option>
                <option value="Live">Live</option>
                <option value="Draft">Draft</option>
                <option value="Flagged">Flagged</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDownIcon /></div>
            </div>
            <div className="relative">
              <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px]">
                <option value="">Plan</option>
                <option value="Free">Free</option>
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDownIcon /></div>
            </div>
            <div className="relative">
              <select value={domainTypeFilter} onChange={(e) => setDomainTypeFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[160px]">
                <option value="">Domain Type</option>
                <option value="Subdomain">Subdomain</option>
                <option value="Custom">Custom</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDownIcon /></div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Domain</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Owner</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Plan</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Domain Type</th>
                <th className="px-4 py-5 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Loading…</td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((w) => (
                  <tr key={w.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-5 text-sm font-medium text-gray-900">{w.domainName}</td>
                    <td className="px-4 py-5 text-sm text-gray-900">{w.owner}</td>
                    <td className="px-4 py-5 text-sm"><span className={`font-medium ${statusColor(w.status)}`}>{w.status}</span></td>
                    <td className="px-4 py-5 text-sm font-medium text-gray-900">{w.plan}</td>
                    <td className="px-4 py-5 text-sm text-gray-900">{w.domainType}</td>
                    <td className="px-4 py-5 text-sm text-center">
                      <button
                        onClick={() => router.push(`/admindashboard/usernweb/webmng?${new URLSearchParams({
                          id: w.id,
                          userId: w.userId,
                          domainName: w.domainName,
                          owner: w.owner,
                          status: w.status,
                          plan: w.plan,
                        })}`)}
                        className="text-green-600 hover:text-green-800 hover:underline font-medium transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No websites found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ─────────────── Main Page with Tabs ─────────────── */

const UserWebsiteManagement = () => {
  const [activeTab, setActiveTab] = useState<TabId>('clients');

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User and Website Management</h1>
              <p className="text-gray-600 mb-6">Oversee all user accounts and published websites</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-white rounded-lg shadow p-1 w-fit">
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'clients'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Client Management
              </button>
              <button
                onClick={() => setActiveTab('domains')}
                className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'domains'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Domain Management
              </button>
            </div>

            {activeTab === 'clients' && <ClientManagementTab />}
            {activeTab === 'domains' && <DomainManagementTab />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserWebsiteManagement;
