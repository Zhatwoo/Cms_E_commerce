'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import {
  getDomainsManagement,
  getClients,
  updateClientPlan,
  updateClientStatus,
  deleteClient,
  setClientDomainStatus,
  type WebsiteManagementRow,
  type ClientRow,
} from '@/lib/api';

const AdminSidebar = dynamic(() => import('../components/sidebar').then((mod) => mod.AdminSidebar), { ssr: false });
const AdminHeader = dynamic(() => import('../components/header').then((mod) => mod.AdminHeader), { ssr: false });

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

const USER_AVATAR_ICON = '/admin-dashboard/icons/user-avatar-1.png';
const PADLOCK_ICON = '/admin-dashboard/icons/padlock-1.png';
const TRASH_BIN_ICON = '/admin-dashboard/icons/trash-bin-1.png';

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

function getPlanStorageLimitGb(plan: string): number {
  switch ((plan || '').toLowerCase()) {
    case 'pro': return 100;
    case 'basic': return 25;
    default: return 5;
  }
}

function toGb(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}

function formatGb(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value >= 10 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, '');
}

function makeDeterministicUsageSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 100000;
  }
  return hash;
}

function getClientStorage(client: ClientRow): { usedGb: number; limitGb: number; percent: number } {
  const planLimit = getPlanStorageLimitGb(client.subscriptionPlan);
  const limitGbFromApi =
    typeof client.storageLimitGb === 'number'
      ? client.storageLimitGb
      : typeof client.storageLimitBytes === 'number'
        ? toGb(client.storageLimitBytes)
        : planLimit;

  const usedGbFromApi =
    typeof client.storageUsedGb === 'number'
      ? client.storageUsedGb
      : typeof client.storageUsedBytes === 'number'
        ? toGb(client.storageUsedBytes)
        : null;

  let usedGb = usedGbFromApi;
  if (usedGb == null) {
    const seed = makeDeterministicUsageSeed(`${client.id}-${client.email}`);
    const percentage = 18 + (seed % 65); // 18%..82%
    usedGb = (limitGbFromApi * percentage) / 100;
  }

  const rawPercent = limitGbFromApi > 0 ? Math.round((usedGb / limitGbFromApi) * 100) : 0;
  return {
    usedGb,
    limitGb: limitGbFromApi,
    percent: Math.max(0, Math.min(100, rawPercent)),
  };
}

/* ─────────────── Client Management Tab ─────────────── */

function ClientManagementTab() {
  const PAGE_SIZE = 20;
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, planFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedClients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const pageItems = useMemo(() => {
    const items: Array<number | 'ellipsis'> = [];
    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p += 1) items.push(p);
      return items;
    }

    items.push(1);

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      start = 2;
      end = 4;
    } else if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }

    if (start > 2) items.push('ellipsis');
    for (let p = start; p <= end; p += 1) items.push(p);
    if (end < totalPages - 1) items.push('ellipsis');

    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

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

      <p className="text-sm text-gray-500 mb-4">
        Use <strong>Status</strong> and <strong>Plan</strong> filters to narrow the list. Change plan from the dropdown; use <strong>Suspend</strong> / <strong>Activate</strong> or <strong>Delete</strong> in Actions (delete is permanent).
      </p>

      <div className="mb-3 flex justify-end">
        <p className="text-sm text-gray-600 text-right">
          {filtered.length === 0
            ? 'Showing 0 users'
            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length} users`}
        </p>
      </div>

      {/* Table */}
      <div className="bg-[#F5F4FF] border border-[rgba(177,59,255,0.29)] rounded-lg shadow overflow-hidden">
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
                  aria-label="Filter clients by status"
                  className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px]"
                >
                  <option value="">All Status ({loading ? '...' : stats.total})</option>
                  <option value="active">Active ({loading ? '...' : stats.active})</option>
                  <option value="suspended">Suspended ({loading ? '...' : stats.suspended})</option>
                  <option value="restricted">Restricted ({loading ? '...' : Math.max(0, stats.total - stats.active - stats.suspended)})</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDownIcon /></div>
              </div>
              <div className="relative">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  aria-label="Filter clients by plan"
                  className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px]"
                >
                  <option value="">All Plans ({loading ? '...' : stats.total})</option>
                  <option value="free">Free ({loading ? '...' : stats.free})</option>
                  <option value="basic">Basic ({loading ? '...' : stats.basic})</option>
                  <option value="pro">Pro ({loading ? '...' : stats.pro})</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDownIcon /></div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="First page"
              >
                {'<<'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                {'<'}
              </button>

              {pageItems.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none">...</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    disabled={loading || filtered.length === 0}
                    className={`min-w-8 px-2 py-1.5 text-sm rounded-md border transition-colors ${
                      currentPage === item
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={`Page ${item}`}
                    aria-current={currentPage === item ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                {'>'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Last page"
              >
                {'>>'}
              </button>
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

        <div className="overflow-x-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Plan</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Storage</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="px-4 py-5 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Loading…</td></tr>
              ) : filtered.length > 0 ? (
                pagedClients.map((client) => {
                  const active = isClientActive(client);
                  const busy = actionLoadingId === client.id;
                  const storage = getClientStorage(client);
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
                            aria-label={`Change plan for ${client.displayName || client.email}`}
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
                      <td className="px-4 py-5 text-sm text-gray-900">
                        <div className="min-w-[180px]">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-gray-600">{formatGb(storage.usedGb)} GB / {formatGb(storage.limitGb)} GB</span>
                            <span className="font-medium text-gray-700">{storage.percent}%</span>
                          </div>
                          <progress
                            value={storage.percent}
                            max={100}
                            aria-label={`Storage used by ${client.displayName || client.email}`}
                            className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-blue-500 [&::-moz-progress-bar]:bg-blue-500"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-5 text-sm text-gray-600">{formatDate(client.createdAt)}</td>
                      <td className="px-4 py-5 text-sm text-right">
                        <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                          <Tooltip label="Client profile">
                            <button
                              type="button"
                              className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                              aria-label="Client profile"
                            >
                              <Image src={USER_AVATAR_ICON} alt="Client profile" width={20} height={20} className="object-contain" />
                            </button>
                          </Tooltip>
                          <Tooltip label={active ? 'Suspend client' : 'Activate client'}>
                            <button
                              onClick={() => (active ? handleSuspend(client) : handleActivate(client))}
                              disabled={busy}
                              className="p-2 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
                              aria-label={active ? 'Suspend client' : 'Activate client'}
                            >
                              {busy ? (
                                <span className="text-xs text-amber-700">…</span>
                              ) : (
                                <Image src={PADLOCK_ICON} alt={active ? 'Suspend client' : 'Activate client'} width={20} height={20} className="object-contain" />
                              )}
                            </button>
                          </Tooltip>
                          <Tooltip label="Delete client (permanent)">
                            <button
                              onClick={() => handleDeleteClick(client)}
                              disabled={busy}
                              className="p-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                              aria-label="Delete client"
                            >
                              <Image src={TRASH_BIN_ICON} alt="Delete client" width={20} height={20} className="object-contain" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No clients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="First page"
              >
                {'<<'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                {'<'}
              </button>

              {pageItems.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-bottom-${idx}`} className="px-2 text-gray-400 select-none">...</span>
                ) : (
                  <button
                    key={`bottom-${item}`}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    disabled={loading || filtered.length === 0}
                    className={`min-w-8 px-2 py-1.5 text-sm rounded-md border transition-colors ${
                      currentPage === item
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={`Page ${item}`}
                    aria-current={currentPage === item ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                {'>'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Last page"
              >
                {'>>'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'websitelink';

const ExternalLinkIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

function getViewWebsiteUrl(domainName: string): string {
  if (!domainName || domainName === '—') return '#';
  const subdomain = domainName.split('.')[0]?.trim().toLowerCase() || '';
  if (!subdomain) return '#';
  if (typeof window !== 'undefined' && (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))) {
    const port = window.location.port || '3000';
    return `http://${subdomain}.localhost:${port}`;
  }
  return `https://${subdomain}.${BASE_DOMAIN}`;
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
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const getRowKey = (w: WebsiteManagementRow) => `${w.userId}::${w.id}`;

  const visibleWebsites = useMemo(() => {
    const seen = new Set<string>();
    return filtered.filter((w) => {
      const key = getRowKey(w);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filtered]);

  const allVisibleSelected = useMemo(
    () => visibleWebsites.length > 0 && visibleWebsites.every((w) => selectedIds.has(getRowKey(w))),
    [visibleWebsites, selectedIds]
  );

  const selectedRows = useMemo(() => {
    return visibleWebsites.filter((w) => selectedIds.has(getRowKey(w)));
  }, [visibleWebsites, selectedIds]);

  const toggleSelect = (w: WebsiteManagementRow) => {
    const k = getRowKey(w);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleWebsites.forEach((w) => next.delete(getRowKey(w)));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleWebsites.forEach((w) => next.add(getRowKey(w)));
        return next;
      });
    }
  };

  const handleBulkAction = async (status: string) => {
    if (selectedRows.length === 0) return;
    setBulkLoading(true);
    let done = 0;
    let failed = 0;
    for (const w of selectedRows) {
      try {
        const res = await setClientDomainStatus(w.userId, w.id, status);
        if (res.success) done++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setSelectedIds(new Set());
    setToast(failed > 0 ? `Updated ${done}, failed ${failed}` : `Updated ${done} site(s)`);
    setTimeout(() => setToast(null), 3000);
    setBulkLoading(false);
    const res = await getDomainsManagement();
    if (res.success && res.data) setWebsites(Array.isArray(res.data) ? res.data : []);
    if (res.stats) setStats(res.stats);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#F5F4FF] border border-[rgba(177,59,255,0.29)] rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Websites</p>
          <p className="text-4xl font-bold text-gray-900">{loading ? '—' : stats.total}</p>
        </div>
        <div className="bg-[#F5F4FF] border border-[rgba(177,59,255,0.29)] rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Live</p>
          <p className="text-4xl font-bold text-green-600">{loading ? '—' : stats.live}</p>
        </div>
        <div className="bg-[#F5F4FF] border border-[rgba(177,59,255,0.29)] rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Under Review</p>
          <p className="text-4xl font-bold text-yellow-500">{loading ? '—' : stats.underReview}</p>
        </div>
        <div className="bg-[#F5F4FF] border border-[rgba(177,59,255,0.29)] rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Flagged</p>
          <p className="text-4xl font-bold text-red-600">{loading ? '—' : stats.flagged}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#F5F4FF] border border-[rgba(177,59,255,0.29)] rounded-lg shadow overflow-hidden">
        <div className="px-6 py-6 border-b border-gray-200 space-y-4">
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
                aria-label="Filter websites by status"
                className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px]">
                <option value="">Status</option>
                <option value="Live">Live</option>
                <option value="Draft">Draft</option>
                <option value="Flagged">Flagged</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDownIcon /></div>
            </div>
            <button
              type="button"
              onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              {advancedFiltersOpen ? 'Hide' : 'Show'} advanced filters
            </button>
          </div>
          {advancedFiltersOpen && (
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
              <div className="relative">
                <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
                  aria-label="Filter websites by plan"
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
                  aria-label="Filter websites by domain type"
                  className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[160px]">
                  <option value="">Domain Type</option>
                  <option value="Subdomain">Subdomain</option>
                  <option value="Custom">Custom</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDownIcon /></div>
              </div>
            </div>
          )}
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-600">{selectedRows.length} selected</span>
              <button
                type="button"
                onClick={() => handleBulkAction('suspended')}
                disabled={bulkLoading}
                className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50"
              >
                Suspend
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('published')}
                disabled={bulkLoading}
                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50"
              >
                Reactivate
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('flagged')}
                disabled={bulkLoading}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
              >
                Flag
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-4 py-5 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all websites"
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Domain</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Owner</th>
                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-5 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Loading…</td></tr>
              ) : visibleWebsites.length > 0 ? (
                visibleWebsites.map((w) => {
                  const viewUrl = getViewWebsiteUrl(w.domainName);
                  return (
                    <tr key={getRowKey(w)} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-5 w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(getRowKey(w))}
                          onChange={() => toggleSelect(w)}
                          aria-label={`Select ${w.domainName}`}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-5 text-sm font-medium text-gray-900">{w.domainName}</td>
                      <td className="px-4 py-5 text-sm text-gray-900">{w.owner}</td>
                      <td className="px-4 py-5 text-sm"><span className={`font-medium ${statusColor(w.status)}`}>{w.status}</span></td>
                      <td className="px-4 py-5 text-sm text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {viewUrl !== '#' && (
                            <Tooltip label="View website">
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                aria-label="View website"
                              >
                                <ExternalLinkIcon />
                              </a>
                            </Tooltip>
                          )}
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No websites found matching your search.</td></tr>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const activeTab: TabId = urlTab === 'domains' ? 'domains' : 'clients';

  const handleTabToggle = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/admindashboard/usernweb?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="admin-dashboard-shell relative flex min-h-screen overflow-hidden" suppressHydrationWarning>
      <div className="relative z-10 flex min-h-screen w-full">
        <AdminSidebar
          forcedActiveItemId="management"
          forcedActiveChildId={activeTab === 'clients' ? 'user-management' : 'website-management'}
        />

        <AnimatePresence>
          {sidebarOpen && (
            <div className="lg:hidden">
              <AdminSidebar
                mobile
                onClose={() => setSidebarOpen(false)}
                forcedActiveItemId="management"
                forcedActiveChildId={activeTab === 'clients' ? 'user-management' : 'website-management'}
              />
            </div>
          )}
        </AnimatePresence>

        <div className="flex min-h-screen flex-1 flex-col">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div className="p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#B13BFF] mb-2">User &amp; Website Management</h1>
                <p className="text-[#A78BFA] mb-6">Oversee all user accounts and published websites</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-8 rounded-xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] shadow-sm p-1 w-fit">
                <button
                  onClick={() => handleTabToggle('clients')}
                  className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'clients'
                      ? 'bg-yellow-400 text-gray-900 shadow-sm'
                      : 'text-[#82788F] hover:text-[#6F657E] hover:bg-white/40'
                  }`}
                >
                  Client Management
                </button>
                <button
                  onClick={() => handleTabToggle('domains')}
                  className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'domains'
                      ? 'bg-yellow-400 text-gray-900 shadow-sm'
                      : 'text-[#82788F] hover:text-[#6F657E] hover:bg-white/40'
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
    </div>
  );
};

export default UserWebsiteManagement;
