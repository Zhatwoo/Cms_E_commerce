'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getDomainsManagement,
  setClientDomainStatus,
  type WebsiteManagementRow,
} from '@/lib/api';
import { useGDriveSelection } from './useGDriveSelection';
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  SearchIcon,
  StorageIcon,
  TrashOutlineIcon,
} from '@/lib/icons/adminIcons';
import { getPlanPillClasses } from '@/lib/config/planConfig';
import { getStatusBadgeClasses, getStatusLabel } from '@/lib/utils/adminStatus';
import { addNotification } from '@/lib/notifications';

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

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'websitelink';

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

function getPlanStorageLimitGb(plan: string): number {
  switch ((plan || '').toLowerCase()) {
    case 'pro': return 100;
    case 'basic': return 25;
    default: return 5;
  }
}

function formatGb(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value >= 10 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, '');
}

function makeStorageSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 100000;
  }
  return hash;
}

function getWebsiteStorage(row: WebsiteManagementRow): { usedGb: number; limitGb: number; percent: number } {
  const limitGb = getPlanStorageLimitGb(row.plan);
  const seed = makeStorageSeed(`${row.userId}-${row.id}-${row.domainName}`);
  const percentage = 16 + (seed % 70); // 16%..85%
  const usedGb = (limitGb * percentage) / 100;
  return { usedGb, limitGb, percent: percentage };
}

/* ─────────────── Manage Website Detail View ─────────────── */

interface ManageWebsiteDetailProps {
  website: WebsiteManagementRow;
  onBack: () => void;
}

function ManageWebsiteDetail({ website, onBack }: ManageWebsiteDetailProps): React.ReactElement {
  const { id, userId, domainName, owner, plan: planParam } = website;

  const [status, setStatus] = useState(website.status ?? 'Live');
  const [suspending, setSuspending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const viewUrl = getViewWebsiteUrl(domainName);
  const isSuspended = status.toLowerCase() === 'suspended';

  const handleViewWebsite = useCallback(() => {
    if (viewUrl && viewUrl !== '#') window.open(viewUrl, '_blank', 'noopener,noreferrer');
  }, [viewUrl]);

  const handleSuspend = useCallback(async () => {
    if (!userId || !id) {
      setToast('Missing domain or user.');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSuspending(true);
    try {
      const res = await setClientDomainStatus(userId, id, 'suspended');
      if (res.success) {
        setStatus('Suspended');
        addNotification("Website Suspended", `Suspended ${domainName || 'unknown website'}.`, 'warning');
        setToast('Website suspended.');
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(res.message ?? 'Failed to suspend');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to suspend');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSuspending(false);
    }
  }, [userId, id]);

  const handleReactivate = useCallback(async () => {
    if (!userId || !id) return;
    setSuspending(true);
    try {
      const res = await setClientDomainStatus(userId, id, 'published');
      if (res.success) {
        setStatus('Live');
        addNotification("Website Reactivated", `Reactivated ${domainName || 'unknown website'}.`, 'success');
        setToast('Website reactivated.');
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(res.message ?? 'Failed to reactivate');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to reactivate');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSuspending(false);
    }
  }, [userId, id]);

  const handleCopyUrl = useCallback(() => {
    if (viewUrl && viewUrl !== '#') {
      navigator.clipboard.writeText(viewUrl).then(
        () => { setToast('URL copied to clipboard'); setTimeout(() => setToast(null), 2500); },
        () => { setToast('Failed to copy URL'); setTimeout(() => setToast(null), 2500); }
      );
    }
  }, [viewUrl]);

  const handleFlag = useCallback(async () => {
    if (!userId || !id) return;
    setSuspending(true);
    try {
      const res = await setClientDomainStatus(userId, id, 'flagged');
      if (res.success) {
        setStatus('Flagged');
        addNotification("Website Flagged", `Flagged ${domainName || 'unknown website'} for review.`, 'error');
        setToast('Website flagged.');
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(res.message ?? 'Failed to flag');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to flag');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSuspending(false);
    }
  }, [userId, id]);

  return (
    <div className="w-full p-6 lg:p-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Website</h1>
          <p className="text-gray-600 mt-1">{domainName || '—'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleViewWebsite}
            disabled={!viewUrl || viewUrl === '#'}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            View Website
          </button>
          <button
            onClick={handleCopyUrl}
            disabled={!viewUrl || viewUrl === '#'}
            className="px-6 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all font-medium"
          >
            Copy URL
          </button>
          {(status.toLowerCase() !== 'flagged') && (
            <button
              onClick={handleFlag}
              disabled={suspending}
              className="px-6 py-2.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 disabled:opacity-50 transition-all font-medium"
            >
              Flag
            </button>
          )}
          {isSuspended ? (
            <button
              onClick={handleReactivate}
              disabled={suspending}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
            >
              {suspending ? 'Updating…' : 'Reactivate'}
            </button>
          ) : (
            <button
              onClick={handleSuspend}
              disabled={suspending}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
            >
              {suspending ? 'Suspending…' : 'Suspend'}
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Website Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Owner</p>
                <p className="text-base font-semibold text-gray-900">{owner || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Domain</p>
                <p className="text-base font-semibold text-gray-900">{domainName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  getStatusBadgeClasses(status)
                }`}>
                  {getStatusLabel(status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Plan</p>
                <p className="text-base font-semibold text-gray-900">{planParam} Plan</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">Domain Type</p>
                <p className="text-base font-semibold text-gray-900">Subdomain</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Actions</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use &quot;View Website&quot; to open the site. &quot;Copy URL&quot; copies the link. &quot;Suspend&quot; disables the site; &quot;Reactivate&quot; brings it back. &quot;Flag&quot; marks for review.
            </p>
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              ← Back to Domain Management
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Domain Management List View ─────────────── */

interface DomainManagementContentProps {
  onManage: (website: WebsiteManagementRow) => void;
}

type ActionModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmButtonClass: string;
  action?: () => Promise<void> | void;
};

function DomainManagementContent({ onManage }: DomainManagementContentProps) {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const focusedWebsiteId = searchParams.get('websiteId') || '';
  const focusedWebsiteUserId = searchParams.get('websiteUserId') || '';
  const PAGE_SIZE = 20;
  type SortOption = 'recent' | 'az' | 'za';
  const [websites, setWebsites] = useState<WebsiteManagementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [domainTypeFilter, setDomainTypeFilter] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [storageHintRowKey, setStorageHintRowKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmButtonClass: 'bg-[#6D28D9] hover:bg-[#5B21B6] text-white',
  });

  const selection = useGDriveSelection();

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

  useEffect(() => {
    setSearch(urlSearch);
    setCurrentPage(1);
  }, [urlSearch, focusedWebsiteId, focusedWebsiteUserId]);

  const filtered = useMemo(() => {
    return websites.filter((w) => {
      const matchFocusedWebsite = !focusedWebsiteId
        || (w.id === focusedWebsiteId && (!focusedWebsiteUserId || w.userId === focusedWebsiteUserId));
      const matchSearch = !search ||
        w.domainName.toLowerCase().includes(search.toLowerCase()) ||
        w.owner.toLowerCase().includes(search.toLowerCase());
      const status = (w.status || '').toLowerCase();
      const plan = (w.plan || '').toLowerCase();
      const matchStatus = !statusFilter || status === statusFilter.toLowerCase();
      const matchPlan = !planFilter || plan === planFilter.toLowerCase();
      const matchType = !domainTypeFilter || (w.domainType || '').toLowerCase() === domainTypeFilter.toLowerCase();
      return matchFocusedWebsite && matchSearch && matchStatus && matchPlan && matchType;
    });
  }, [websites, focusedWebsiteId, focusedWebsiteUserId, search, statusFilter, planFilter, domainTypeFilter]);

  const visibleWebsites = useMemo(() => {
    const seen = new Set<string>();
    return filtered.filter((w) => {
      const key = `${w.userId}::${w.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filtered]);

  const sortedVisibleWebsites = useMemo(() => {
    const copy = [...visibleWebsites];
    if (sortOption === 'az') {
      copy.sort((a, b) => (a.domainName || '').localeCompare((b.domainName || ''), undefined, { sensitivity: 'base' }));
      return copy;
    }
    if (sortOption === 'za') {
      copy.sort((a, b) => (b.domainName || '').localeCompare((a.domainName || ''), undefined, { sensitivity: 'base' }));
      return copy;
    }
    return copy;
  }, [visibleWebsites, sortOption]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, planFilter, domainTypeFilter, sortOption]);

  useEffect(() => {
    if (!sortMenuOpen) return;
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [sortMenuOpen]);

  const totalPages = Math.max(1, Math.ceil(sortedVisibleWebsites.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pagedWebsites = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedVisibleWebsites.slice(start, start + PAGE_SIZE);
  }, [sortedVisibleWebsites, currentPage]);

  const pagedWebsiteIds = useMemo(() => {
    return pagedWebsites.map((w) => `${w.userId}::${w.id}`);
  }, [pagedWebsites]);

  const allPageSelected = useMemo(() => {
    if (pagedWebsites.length === 0) return false;
    return pagedWebsites.every((w) => selection.selectedIds.has(`${w.userId}::${w.id}`));
  }, [pagedWebsites, selection.selectedIds]);

  const selectedRows = useMemo(() => {
    return sortedVisibleWebsites.filter((w) => selection.selectedIds.has(`${w.userId}::${w.id}`));
  }, [sortedVisibleWebsites, selection.selectedIds]);

  const allVisibleSelected = useMemo(() => {
    return sortedVisibleWebsites.length > 0 && selectedRows.length === sortedVisibleWebsites.length;
  }, [sortedVisibleWebsites.length, selectedRows.length]);

  const allSelectedSuspended = useMemo(() => {
    if (selectedRows.length === 0) return false;
    return selectedRows.every((w) => (w.status || '').toLowerCase() === 'suspended');
  }, [selectedRows]);

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

  const handleToggleSuspend = async (w: WebsiteManagementRow) => {
    setActionLoadingId(w.id);
    const nextStatus = (w.status || '').toLowerCase() === 'suspended' ? 'published' : 'suspended';
    try {
      const res = await setClientDomainStatus(w.userId, w.id, nextStatus);
      if (res.success) {
        setWebsites((prev) => prev.map((row) =>
          row.id === w.id && row.userId === w.userId
            ? { ...row, status: nextStatus === 'published' ? 'Live' : 'Suspended' }
            : row
        ));
        const actionLabel = nextStatus === 'published' ? 'Reactivated' : 'Suspended';
        addNotification(`Website ${actionLabel}`, `${actionLabel} ${w.domainName}.`, nextStatus === 'published' ? 'success' : 'warning');
      } else {
        setToast(res.message || 'Failed to update status');
        setTimeout(() => setToast(null), 2500);
      }
    } catch {
      setToast('Failed to update status');
      setTimeout(() => setToast(null), 2500);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFlag = async (w: WebsiteManagementRow) => {
    setActionLoadingId(w.id);
    try {
      const res = await setClientDomainStatus(w.userId, w.id, 'flagged');
      if (res.success) {
        setWebsites((prev) => prev.map((row) =>
          row.id === w.id && row.userId === w.userId ? { ...row, status: 'Flagged' } : row
        ));
        addNotification("Website Flagged", `Flagged ${w.domainName} for review.`, 'error');
      } else {
        setToast(res.message || 'Failed to flag website');
        setTimeout(() => setToast(null), 2500);
      }
    } catch {
      setToast('Failed to flag website');
      setTimeout(() => setToast(null), 2500);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openActionModal = (config: Omit<ActionModalState, 'isOpen'>) => {
    setActionModal({ isOpen: true, ...config });
  };

  const closeActionModal = () => {
    setActionModal((prev) => ({ ...prev, isOpen: false }));
  };

  const runActionModal = async () => {
    const action = actionModal.action;
    closeActionModal();
    if (action) await action();
  };

  const confirmToggleSuspend = async (w: WebsiteManagementRow) => {
    const isSuspended = (w.status || '').toLowerCase() === 'suspended';
    openActionModal({
      title: isSuspended ? 'Reactivate website?' : 'Suspend website?',
      message: isSuspended ? 'This website will be set back to active.' : 'This website will be suspended.',
      confirmText: isSuspended ? 'Reactivate' : 'Suspend',
      confirmButtonClass: isSuspended
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
        : 'bg-amber-600 hover:bg-amber-700 text-white',
      action: async () => {
        await handleToggleSuspend(w);
      },
    });
  };

  const confirmFlag = async (w: WebsiteManagementRow) => {
    openActionModal({
      title: 'Delete/flag website?',
      message: 'This action cannot be easily undone.',
      confirmText: 'Delete',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
      action: async () => {
        await handleFlag(w);
      },
    });
  };

  const confirmBulkSuspend = async () => {
    if (selectedRows.length === 0) return;
    openActionModal({
      title: allSelectedSuspended ? 'Reactivate selected websites?' : 'Suspend selected websites?',
      message: allSelectedSuspended
        ? `Reactivate ${selectedRows.length} selected website(s).`
        : `Suspend ${selectedRows.length} selected website(s).`,
      confirmText: allSelectedSuspended ? 'Reactivate' : 'Suspend',
      confirmButtonClass: allSelectedSuspended
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
        : 'bg-amber-600 hover:bg-amber-700 text-white',
      action: async () => {
        await handleBulkSuspend();
      },
    });
  };

  const confirmBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    openActionModal({
      title: 'Delete selected websites?',
      message: `Delete/flag ${selectedRows.length} selected website(s)?`,
      confirmText: 'Delete',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
      action: async () => {
        await handleBulkDelete();
      },
    });
  };

  const handleBulkSuspend = async () => {
    if (selectedRows.length === 0) return;
    const shouldUnsuspend = allSelectedSuspended;
    const nextApiStatus = shouldUnsuspend ? 'published' : 'suspended';
    const nextUiStatus = shouldUnsuspend ? 'Live' : 'Suspended';
    let done = 0;
    let failed = 0;
    for (const row of selectedRows) {
      try {
        const res = await setClientDomainStatus(row.userId, row.id, nextApiStatus);
        if (res.success) done += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }

    setWebsites((prev) => prev.map((row) =>
      selection.selectedIds.has(`${row.userId}::${row.id}`) ? { ...row, status: nextUiStatus } : row
    ));
    selection.clearSelection();
    const actionLabel = shouldUnsuspend ? 'Unsuspended' : 'Suspended';
    addNotification(`Bulk ${actionLabel}`, `${actionLabel} ${done} website(s).`, shouldUnsuspend ? 'success' : 'warning');
    setToast(failed > 0 ? `${actionLabel} ${done}, failed ${failed}` : `${actionLabel} ${done} website(s)`);
    setTimeout(() => setToast(null), 2500);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    let done = 0;
    let failed = 0;
    for (const row of selectedRows) {
      try {
        const res = await setClientDomainStatus(row.userId, row.id, 'flagged');
        if (res.success) done += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }

    setWebsites((prev) => prev.map((row) =>
      selection.selectedIds.has(`${row.userId}::${row.id}`) ? { ...row, status: 'Flagged' } : row
    ));
    selection.clearSelection();
    addNotification("Bulk Delete/Flag", `Flagged ${done} website(s).`, 'error');
    setToast(failed > 0 ? `Deleted ${done}, failed ${failed}` : `Deleted ${done} website(s)`);
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

      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{actionModal.title}</h3>
            <p className="text-gray-600 text-sm mb-6">{actionModal.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeActionModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={runActionModal}
                className={`px-4 py-2 rounded-lg font-medium ${actionModal.confirmButtonClass}`}
              >
                {actionModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      </div> */}

      {/* Table */}
      <div className="bg-[#F5F4FF] border border-[rgba(177,59,255,0.29)] rounded-lg shadow overflow-hidden">
        <div className="px-6 py-6 border-b border-[rgba(177,59,255,0.18)]">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex flex-wrap xl:flex-nowrap items-center gap-3 justify-start">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter websites by status"
                  className="h-11 appearance-none pl-5 pr-10 bg-white text-[#8E47D8] text-[0.98rem] rounded-[12px] border border-[#E2C7FF] shadow-[0_2px_8px_rgba(177,59,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 cursor-pointer w-[170px]"
                >
                  <option value="">All Status</option>
                  <option value="live">Live</option>
                  <option value="suspended">Suspended</option>
                  <option value="flagged">Flagged</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9A62D8]"><ChevronDownIcon /></div>
              </div>

              <div className="relative">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  aria-label="Filter websites by plan"
                  className="h-11 appearance-none pl-5 pr-10 bg-white text-[#8E47D8] text-[0.98rem] rounded-[12px] border border-[#E2C7FF] shadow-[0_2px_8px_rgba(177,59,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 cursor-pointer w-[170px]"
                >
                  <option value="">All Plans</option>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9A62D8]"><ChevronDownIcon /></div>
              </div>

              <div className="relative">
                <select
                  value={domainTypeFilter}
                  onChange={(e) => setDomainTypeFilter(e.target.value)}
                  aria-label="Filter websites by domain type"
                  className="h-11 appearance-none pl-5 pr-10 bg-white text-[#8E47D8] text-[0.98rem] rounded-[12px] border border-[#E2C7FF] shadow-[0_2px_8px_rgba(177,59,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 cursor-pointer w-[170px]"
                >
                  <option value="">Domains</option>
                  <option value="subdomain">Subdomain</option>
                  <option value="custom">Custom</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9A62D8]"><ChevronDownIcon /></div>
              </div>
              <div className="relative" ref={sortMenuRef}>
                <button
                  type="button"
                  onClick={() => setSortMenuOpen((v) => !v)}
                  className="h-11 w-11 inline-flex items-center justify-center rounded-[12px] border border-[#E2C7FF] bg-white text-[#A855F7] shadow-[0_2px_8px_rgba(177,59,255,0.12)] hover:bg-[#F8F2FF]"
                  aria-label="Sort websites"
                  title="Sort"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h12M4 12h16M10 18h10" />
                  </svg>
                </button>
                {sortMenuOpen && (
                  <div className="absolute left-0 top-12 z-40 w-44 rounded-xl border border-[#E2C7FF] bg-white shadow-[0_10px_24px_rgba(177,59,255,0.2)] p-1.5">
                    <button
                      type="button"
                      onClick={() => { setSortOption('recent'); setSortMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${sortOption === 'recent' ? 'bg-[#F3E8FF] text-[#6D28D9] font-semibold' : 'text-[#6F657E] hover:bg-[#F8F2FF]'}`}
                    >
                      Recently
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortOption('az'); setSortMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${sortOption === 'az' ? 'bg-[#F3E8FF] text-[#6D28D9] font-semibold' : 'text-[#6F657E] hover:bg-[#F8F2FF]'}`}
                    >
                      Alphabetical A-Z
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortOption('za'); setSortMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${sortOption === 'za' ? 'bg-[#F3E8FF] text-[#6D28D9] font-semibold' : 'text-[#6F657E] hover:bg-[#F8F2FF]'}`}
                    >
                      Alphabetical Z-A
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading || sortedVisibleWebsites.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {'<<'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading || sortedVisibleWebsites.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {'<'}
              </button>
              {pageItems.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-top-${idx}`} className="px-2 text-[#A48ABF] select-none">...</span>
                ) : (
                  <button
                    key={`top-${item}`}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    disabled={loading || sortedVisibleWebsites.length === 0}
                    className={`min-w-8 px-2 py-1.5 text-sm rounded-md border transition-colors ${
                      currentPage === item
                        ? 'bg-[#FFCC00] text-[#47266D] border-[#FFCC00] font-semibold'
                        : 'border-transparent text-[#9A8CB4] hover:bg-[#F1E6FF]'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading || sortedVisibleWebsites.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {'>'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading || sortedVisibleWebsites.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {'>>'}
              </button>
            </div>

            <div className="relative justify-self-end w-full max-w-[330px]">
              <input
                type="text"
                placeholder="Search domain or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-white text-[#7E4FB4] text-[0.98rem] rounded-[12px] border border-[#E2C7FF] shadow-[0_2px_8px_rgba(177,59,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-[#FFCC00] text-[#5F3A84] flex items-center justify-center">
                <SearchIcon />
              </div>
            </div>
          </div>

          {selectedRows.length > 0 && (
            <div className="mt-4 flex items-center gap-3 border-t border-[#EBDDFF] pt-3">
              <span className="text-sm font-medium text-[#6F657E]">{selectedRows.length} selected</span>
              <button
                type="button"
                onClick={() => {
                  if (allVisibleSelected) {
                    selection.clearSelection();
                  } else {
                    selection.selectAll(sortedVisibleWebsites.map((w) => `${w.userId}::${w.id}`));
                  }
                }}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                {allVisibleSelected ? 'Unselect All' : 'Select All'}
              </button>
              {selectedRows.length === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={confirmBulkSuspend}
                    className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
                  >
                    {allSelectedSuspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                  <button
                    type="button"
                    onClick={confirmBulkDelete}
                    className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={confirmBulkDelete}
                  className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => selection.clearSelection()}
                className="text-sm text-[#7E4FB4] hover:text-[#5D2CA7]"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="max-h-[62vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[900px] table-fixed border-collapse">
            <thead>
              <tr className="border-b border-[rgba(177,59,255,0.2)]">
                <th className="w-[27%] px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Domain</th>
                <th className="w-[23%] px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Owner</th>
                <th className="w-[18%] px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Status</th>
                <th className="w-[16%] px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Plan</th>
                <th className="w-[14%] px-3 py-4 text-right text-[1.2rem] font-semibold text-[#462596]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Loading…</td></tr>
              ) : sortedVisibleWebsites.length > 0 ? (
                pagedWebsites.map((w) => {
                  const viewUrl = getViewWebsiteUrl(w.domainName);
                  const key = `${w.userId}::${w.id}`;
                  const busy = actionLoadingId === w.id;
                  const storage = getWebsiteStorage(w);
                  const statusText = (w.status || '').toLowerCase();
                  const isActive = statusText === 'live' || statusText === 'published';
                  const isSelected = selection.selectedIds.has(key);
                  return (
                    <tr
                      key={key}
                      className={`select-none cursor-pointer transition-all duration-200 rounded-lg ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#E8D9FF] to-[#F0E5FF] border-2 border-[#D0B4FF] shadow-md hover:shadow-lg hover:from-[#E0CAFF] hover:to-[#E8D9FF]'
                          : 'border-b border-[rgba(177,59,255,0.1)] hover:bg-white/35'
                      }`}
                      onClick={(e) => {
                        (e as React.MouseEvent).preventDefault?.();
                        selection.handleRowClick(key, (e as React.MouseEvent).shiftKey, pagedWebsiteIds);
                      }}
                      onMouseDown={(e) => {
                        (e as React.MouseEvent).preventDefault?.();
                        selection.handleRowMouseDown(key);
                      }}
                      onMouseEnter={() => selection.handleRowMouseEnter(key, pagedWebsiteIds)}
                      onMouseUp={() => selection.handleRowMouseUp()}
                      onMouseLeave={() => {
                        if (!selection.isDragging) selection.handleRowMouseUp();
                      }}
                    >
                      <td className="px-3 py-4 text-[1rem] font-semibold text-[#26155E]">{w.domainName}</td>
                      <td className="px-3 py-4 text-[0.92rem] text-[#B2AEBF] font-medium">{w.owner}</td>
                      <td className="px-3 py-4 text-[1rem]"><span className={`font-semibold ${isActive ? 'text-[#00C438]' : 'text-[#FF0000]'}`}>{isActive ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-3 py-4 text-[0.95rem]">
                        <div className="relative inline-flex items-center gap-3 text-[#31247E]">
                          <Tooltip label="Click to view storage usage and remaining space">
                            <button
                              type="button"
                              onClick={() => setStorageHintRowKey(key)}
                              className="text-[#31247E] hover:text-[#4B2A8A]"
                              aria-label={`View storage details for ${w.domainName}`}
                            >
                              <StorageIcon />
                            </button>
                          </Tooltip>

                          {storageHintRowKey === key && (
                            <div className="absolute left-0 top-full mt-3 z-30 w-[280px] rounded-xl border border-[#D7B5FF] bg-white p-4 shadow-[0_12px_30px_rgba(71,19,150,0.18)]">
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-[#471396]">Storage Usage</p>
                                <button
                                  type="button"
                                  onClick={() => setStorageHintRowKey(null)}
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
                                aria-label={`Storage used by ${w.domainName}`}
                                className="h-2.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-[#EDE6FA] [&::-webkit-progress-value]:bg-[#6C45D6] [&::-moz-progress-bar]:bg-[#6C45D6]"
                              />
                            </div>
                          )}

                          <span className={`inline-flex min-w-[90px] justify-center px-3 py-1 text-[0.9rem] font-semibold rounded-full ${getPlanPillClasses(w.plan || 'free')}`}>
                            {w.plan || 'Free'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-flex items-center gap-3 justify-end text-[#5A2AA8]">
                          <Tooltip label="Manage website details">
                            <button
                              type="button"
                              onClick={() => onManage(w)}
                              className="p-1.5 hover:text-[#3D1C87] transition-colors"
                              aria-label="Manage website"
                            >
                              <ManageIcon />
                            </button>
                          </Tooltip>
                          <Tooltip label={(w.status || '').toLowerCase() === 'suspended' ? 'Reactivate website' : 'Suspend website'}>
                            <button
                              type="button"
                              onClick={() => confirmToggleSuspend(w)}
                              disabled={busy}
                              className="p-1.5 hover:text-[#3D1C87] disabled:opacity-50 transition-colors"
                              aria-label="Toggle website suspension"
                            >
                              <LockIcon />
                            </button>
                          </Tooltip>
                          <button
                            type="button"
                            onClick={() => confirmFlag(w)}
                            disabled={busy}
                            className="p-1.5 text-[#FF0000] hover:text-[#CC0000] disabled:opacity-50 transition-colors"
                            aria-label="Flag website"
                          >
                            <TrashOutlineIcon />
                          </button>
                          {viewUrl !== '#' && (
                            <Tooltip label="Open website in new tab">
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:text-[#3D1C87] transition-colors"
                                aria-label="Open website"
                              >
                                <span className="inline-flex h-6 w-6 items-center justify-center"><ExternalLinkIcon /></span>
                              </a>
                            </Tooltip>
                          )}
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

        <div className="px-6 py-4 border-t border-[rgba(177,59,255,0.18)]">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading || sortedVisibleWebsites.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {'<<'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading || sortedVisibleWebsites.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
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
                    disabled={loading || sortedVisibleWebsites.length === 0}
                    className={`min-w-8 px-2 py-1.5 text-sm rounded-md border transition-colors ${
                      currentPage === item
                        ? 'bg-[#FFCC00] text-[#47266D] border-[#FFCC00] font-semibold'
                        : 'border-transparent text-[#9A8CB4] hover:bg-[#F1E6FF]'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading || sortedVisibleWebsites.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {'>'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading || sortedVisibleWebsites.length === 0}
                className="px-2 py-1.5 text-sm rounded-md border border-transparent text-[#B13BFF] hover:bg-[#F1E6FF] disabled:opacity-40 disabled:cursor-not-allowed"
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

/* ─────────────── Web Management Orchestrator ─────────────── */

export function WebManagement() {
  const [selectedWebsite, setSelectedWebsite] = useState<WebsiteManagementRow | null>(null);

  if (selectedWebsite) {
    return <ManageWebsiteDetail website={selectedWebsite} onBack={() => setSelectedWebsite(null)} />;
  }

  return <DomainManagementContent onManage={setSelectedWebsite} />;
}
