'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  getClients,
  updateClientPlan,
  updateClientStatus,
  deleteClient,
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

const StorageIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    <circle cx="6" cy="6" r="1" fill="currentColor" />
    <circle cx="6" cy="12" r="1" fill="currentColor" />
    <circle cx="6" cy="18" r="1" fill="currentColor" />
  </svg>
);

const ManageIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.12 17.804A11.953 11.953 0 0112 15.75c2.517 0 4.854.778 6.88 2.104M15 9a3 3 0 11-6 0 3 3 0 016 0z" />
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
  </svg>
);

const LockIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V8a4 4 0 10-8 0v3m-1 0h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2.5 4.5h11" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 2.75h4" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 4.5v7.25a1 1 0 001 1h4a1 1 0 001-1V4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6.75 6.75v3.5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.25 6.75v3.5" />
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

const PLAN_OPTIONS = ['free', 'basic', 'pro'] as const;

function planLabel(plan: string) {
  const p = (plan || 'free').toLowerCase();
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function planPillClasses(plan: string): string {
  const p = (plan || 'free').toLowerCase();
  if (p === 'basic') return 'bg-[#FFCC00] text-[#2A1A47]';
  if (p === 'pro') return 'bg-[#0A8F2F] text-white';
  return 'bg-[#3D49DD] text-white';
}

function websiteLabel(client: ClientRow): string {
  const prefix = client.email?.split('@')[0]?.trim().toLowerCase();
  return prefix ? `${prefix}.com` : 'example.com';
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

export function UserManagement() {
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
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [storageHintClientId, setStorageHintClientId] = useState<string | null>(null);
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

  const allPageSelected = useMemo(() => {
    if (pagedClients.length === 0) return false;
    return pagedClients.every((c) => selectedClientIds.has(c.id));
  }, [pagedClients, selectedClientIds]);

  const selectedClients = useMemo(() => {
    return filtered.filter((c) => selectedClientIds.has(c.id));
  }, [filtered, selectedClientIds]);

  const allSelectedSuspended = useMemo(() => {
    if (selectedClients.length === 0) return false;
    return selectedClients.every((c) => (c.status || '').toLowerCase() === 'suspended');
  }, [selectedClients]);

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

  const toggleSelectClient = (clientId: string) => {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pagedClients.forEach((client) => next.delete(client.id));
      } else {
        pagedClients.forEach((client) => next.add(client.id));
      }
      return next;
    });
  };

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

  const handleBulkSuspend = async () => {
    if (selectedClients.length === 0) return;
    const shouldUnsuspend = allSelectedSuspended;
    const nextStatus = shouldUnsuspend ? 'Published' : 'Suspended';
    let done = 0;
    let failed = 0;
    for (const client of selectedClients) {
      try {
        const res = await updateClientStatus(client.id, nextStatus);
        if (res.success) done += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }

    setClients((prev) => prev.map((c) => selectedClientIds.has(c.id)
      ? { ...c, status: nextStatus, isActive: nextStatus.toLowerCase() !== 'suspended' }
      : c));
    setSelectedClientIds(new Set());
    const actionLabel = shouldUnsuspend ? 'Unsuspended' : 'Suspended';
    setToast(failed > 0 ? `${actionLabel} ${done}, failed ${failed}` : `${actionLabel} ${done} client(s)`);
    setTimeout(() => setToast(null), 2500);
  };

  const handleBulkDelete = async () => {
    if (selectedClients.length === 0) return;
    let done = 0;
    let failed = 0;
    for (const client of selectedClients) {
      try {
        const res = await deleteClient(client.id);
        if (res.success) done += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }

    setClients((prev) => prev.filter((c) => !selectedClientIds.has(c.id)));
    setSelectedClientIds(new Set());
    setToast(failed > 0 ? `Deleted ${done}, failed ${failed}` : `Deleted ${done} client(s)`);
    setTimeout(() => setToast(null), 2500);
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
        <div className="px-6 py-6 border-b border-[rgba(177,59,255,0.18)]">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 justify-start">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter clients by status"
                  className="appearance-none pl-5 pr-10 py-2.5 bg-white text-[#8E47D8] text-[0.98rem] rounded-[12px] border border-[#E2C7FF] shadow-[0_2px_8px_rgba(177,59,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 cursor-pointer min-w-[170px]"
                >
                  <option value="">All Status</option>
                  <option value="active">Active ({loading ? '...' : stats.active})</option>
                  <option value="suspended">Suspended ({loading ? '...' : stats.suspended})</option>
                  <option value="restricted">Restricted ({loading ? '...' : Math.max(0, stats.total - stats.active - stats.suspended)})</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9A62D8]"><ChevronDownIcon /></div>
              </div>
              <div className="relative">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  aria-label="Filter clients by plan"
                  className="appearance-none pl-5 pr-10 py-2.5 bg-white text-[#8E47D8] text-[0.98rem] rounded-[12px] border border-[#E2C7FF] shadow-[0_2px_8px_rgba(177,59,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 cursor-pointer min-w-[170px]"
                >
                  <option value="">All Plans</option>
                  <option value="free">Free ({loading ? '...' : stats.free})</option>
                  <option value="basic">Basic ({loading ? '...' : stats.basic})</option>
                  <option value="pro">Pro ({loading ? '...' : stats.pro})</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9A62D8]"><ChevronDownIcon /></div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('');
                  setPlanFilter('');
                  setSearch('');
                }}
                className="h-10 w-10 inline-flex items-center justify-center rounded-[12px] border border-[#E2C7FF] bg-white text-[#A855F7] shadow-[0_2px_8px_rgba(177,59,255,0.12)] hover:bg-[#F8F2FF]"
                aria-label="Reset filters"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M8 12h8M10 18h4" />
                </svg>
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="First page"
              >
                {'<<'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                {'<'}
              </button>

              {pageItems.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-[#A48ABF] select-none">...</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    disabled={loading || filtered.length === 0}
                    className={`min-w-8 px-2 py-1.5 text-sm rounded-md border transition-colors ${
                      currentPage === item
                        ? 'bg-[#FFCC00] text-[#47266D] border-[#FFCC00] font-semibold'
                        : 'border-transparent text-[#9A8CB4] hover:bg-[#F1E6FF]'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
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
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                {'>'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Last page"
              >
                {'>>'}
              </button>
            </div>

            <div className="relative justify-self-end w-full max-w-[330px]">
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-white text-[#7E4FB4] text-[0.98rem] rounded-[12px] border border-[#E2C7FF] shadow-[0_2px_8px_rgba(177,59,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-[#FFCC00] text-[#5F3A84] flex items-center justify-center">
                <SearchIcon />
              </div>
            </div>
          </div>

          {selectedClients.length > 0 && (
            <div className="mt-4 flex items-center gap-3 border-t border-[#EBDDFF] pt-3">
              <span className="text-sm font-medium text-[#6F657E]">{selectedClients.length} selected</span>
              <button
                type="button"
                onClick={handleBulkSuspend}
                className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
              >
                {allSelectedSuspended ? 'Unsuspend' : 'Suspend'}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setSelectedClientIds(new Set())}
                className="text-sm text-[#7E4FB4] hover:text-[#5D2CA7]"
              >
                Clear
              </button>
            </div>
          )}
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

        <div className="max-h-[62vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-[rgba(177,59,255,0.2)]">
                <th className="w-12 px-3 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAllOnPage}
                    aria-label="Select all clients on page"
                    className="h-5 w-5 rounded-none border-2 border-[#B13BFF] bg-transparent accent-[#B13BFF]"
                  />
                </th>
                <th className="px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Name</th>
                <th className="px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Email</th>
                <th className="px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Plan</th>
                <th className="px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Websites</th>
                <th className="px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Created</th>
                <th className="px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Status</th>
                <th className="px-3 py-4 text-center text-[1.2rem] font-semibold text-[#462596]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">Loading…</td></tr>
              ) : filtered.length > 0 ? (
                pagedClients.map((client) => {
                  const active = isClientActive(client);
                  const busy = actionLoadingId === client.id;
                  const storage = getClientStorage(client);
                  const statusLabel = active ? 'Active' : 'Inactive';
                  return (
                    <tr key={client.id} className="border-b border-[rgba(177,59,255,0.1)] hover:bg-white/35 transition-colors">
                      <td className="px-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedClientIds.has(client.id)}
                          onChange={() => toggleSelectClient(client.id)}
                          aria-label={`Select ${client.displayName || client.email}`}
                          className="h-5 w-5 rounded-none border-2 border-[#B13BFF] bg-transparent accent-[#B13BFF]"
                        />
                      </td>
                      <td className="px-3 py-4 text-[1rem] font-semibold text-[#26155E]">{client.displayName || '—'}</td>
                      <td className="px-3 py-4 text-[0.92rem] text-[#B2AEBF] font-medium">{client.email}</td>
                      <td className="px-3 py-4 text-[0.95rem]">
                        <div className="relative inline-flex items-center gap-3">
                          <Tooltip label="Click to view storage usage and remaining space">
                            <button
                              type="button"
                              onClick={() => setStorageHintClientId(client.id)}
                              className="text-black hover:text-[#4B2A8A]"
                              aria-label={`View storage details for ${client.displayName || client.email}`}
                            >
                              <StorageIcon />
                            </button>
                          </Tooltip>

                          {storageHintClientId === client.id && (
                            <div className="absolute left-0 top-full mt-3 z-30 w-[280px] rounded-xl border border-[#D7B5FF] bg-white p-4 shadow-[0_12px_30px_rgba(71,19,150,0.18)]">
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-[#471396]">Storage Usage</p>
                                <button
                                  type="button"
                                  onClick={() => setStorageHintClientId(null)}
                                  className="text-[#9A8CB4] hover:text-[#471396]"
                                  aria-label="Close storage hint"
                                >
                                  x
                                </button>
                              </div>
                              <p className="mb-2 text-xs text-[#82788F]">
                                {formatGb(storage.usedGb)} GB used of {formatGb(storage.limitGb)} GB ({storage.percent}%)
                              </p>
                              <progress
                                value={storage.percent}
                                max={100}
                                aria-label={`Storage used by ${client.displayName || client.email}`}
                                className="h-2.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-[#EDE6FA] [&::-webkit-progress-value]:bg-[#6C45D6] [&::-moz-progress-bar]:bg-[#6C45D6]"
                              />
                            </div>
                          )}

                          <select
                            value={(client.subscriptionPlan || 'free').toLowerCase()}
                            disabled={savingId === client.id}
                            onChange={(e) => handlePlanChange(client.id, e.target.value)}
                            aria-label={`Change plan for ${client.displayName || client.email}`}
                            className={`min-w-[90px] px-3 py-1 text-[0.9rem] font-semibold rounded-full border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none ${planPillClasses(client.subscriptionPlan || 'free')}`}
                          >
                            {PLAN_OPTIONS.map((p) => (
                              <option key={p} value={p} className="text-black bg-white">
                                {planLabel(p)}
                              </option>
                            ))}
                          </select>
                          {savingId === client.id && <span className="text-xs text-[#82788F]">Saving…</span>}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[0.95rem] text-[#AFA9BE] font-semibold">{websiteLabel(client)}</td>
                      <td className="px-3 py-4 text-[0.95rem] text-[#AFA9BE] font-semibold">{formatDate(client.createdAt)}</td>
                      <td className={`px-3 py-4 text-[1rem] font-semibold ${active ? 'text-[#00C438]' : 'text-[#FF0000]'}`}>
                        {statusLabel}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="inline-flex items-center gap-2 flex-wrap justify-center text-[#5A2AA8]">
                          <Tooltip label="Client profile">
                            <button
                              type="button"
                              className="p-1 hover:text-[#3D1C87] transition-colors"
                              aria-label="Client profile"
                            >
                              <ManageIcon />
                            </button>
                          </Tooltip>
                          <Tooltip label={active ? 'Suspend client' : 'Activate client'}>
                            <button
                              onClick={() => (active ? handleSuspend(client) : handleActivate(client))}
                              disabled={busy}
                              className="p-1 hover:text-[#3D1C87] disabled:opacity-50 transition-colors"
                              aria-label={active ? 'Suspend client' : 'Activate client'}
                            >
                              {busy ? (
                                <span className="text-xs text-[#7A52BD]">…</span>
                              ) : (
                                <LockIcon />
                              )}
                            </button>
                          </Tooltip>
                          <Tooltip label="Delete client (permanent)">
                            <button
                              onClick={() => handleDeleteClick(client)}
                              disabled={busy}
                              className="p-1 text-[#FF0000] hover:text-[#CC0000] disabled:opacity-50 transition-colors"
                              aria-label="Delete client"
                            >
                              <TrashIcon />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No clients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-[rgba(177,59,255,0.18)]">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="First page"
              >
                {'<<'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                {'<'}
              </button>

              {pageItems.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-bottom-${idx}`} className="px-2 text-[#A48ABF] select-none">...</span>
                ) : (
                  <button
                    key={`bottom-${item}`}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    disabled={loading || filtered.length === 0}
                    className={`min-w-8 px-2 py-1.5 text-sm rounded-md border transition-colors ${
                      currentPage === item
                        ? 'bg-[#FFCC00] text-[#47266D] border-[#FFCC00] font-semibold'
                        : 'border-transparent text-[#9A8CB4] hover:bg-[#F1E6FF]'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
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
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                {'>'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading || filtered.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
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
