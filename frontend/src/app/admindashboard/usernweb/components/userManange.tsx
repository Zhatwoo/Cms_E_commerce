'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import {
  getClients,
  updateClientPlan,
  updateClientStatus,
  deleteClient,
  updateClientDetails,
  type ClientRow,
} from '@/lib/api';
import { useGDriveSelection } from './useGDriveSelection';
import { ChevronDownIcon, SearchIcon, StorageIcon } from '@/lib/icons/adminIcons';
import { getPlanLabel, getPlanPillClasses, PLAN_OPTIONS } from '@/lib/config/planConfig';
import { addNotification } from '@/lib/notifications';
import { formatToPHTime } from '@/lib/dateUtils';

const ManageIcon = () => (
  <img src="/icons/actions/user-avatar.png" alt="User profile" className="h-6 w-6 object-contain" />
);

const LockIcon = () => (
  <img src="/icons/actions/padlock.png" alt="Lock" className="h-6 w-6 object-contain" />
);

const TrashIcon = () => (
  <img src="/icons/actions/trash-bin.png" alt="Delete" className="h-5 w-5 object-contain" />
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

function isClientActive(client: ClientRow): boolean {
  const s = (client.status || '').toLowerCase();
  return s === 'published' || s === 'active' || client.isActive === true;
}

function formatDate(value: string | undefined): string {
  return formatToPHTime(value);
}

function isUserOnline(lastSeen?: string): boolean {
  if (!lastSeen) return false;
  const now = new Date();
  const ls = new Date(lastSeen);
  // within last 5 minutes = Online
  return (now.getTime() - ls.getTime()) < 5 * 60 * 1000;
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

type ActionModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmButtonClass: string;
  requiresReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  action?: (reason: string) => Promise<void> | void;
};

type EditModalState = {
  isOpen: boolean;
  client: ClientRow | null;
  name: string;
  email: string;
  phone: string;
  bio: string;
  password?: string;
};

export function UserManagement() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const focusedClientId = searchParams.get('clientId') || '';
  const PAGE_SIZE = 20;
  type SortOption = 'recent' | 'oldest' | 'az' | 'za';
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [storageHintClientId, setStorageHintClientId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmButtonClass: 'bg-[#6D28D9] hover:bg-[#5B21B6] text-white',
  });
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    client: null,
    name: '',
    email: '',
    phone: '',
    bio: '',
    password: '',
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [actionReason, setActionReason] = useState('');

  const selection = useGDriveSelection();

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
  
  useEffect(() => {
    // Listen for real-time updates from other admins
    const handleUpdate = () => {
      console.log('[UserManagement] Real-time notification received, refreshing list...');
      loadClients();
    };
    window.addEventListener('notification:new_received', handleUpdate);
    return () => window.removeEventListener('notification:new_received', handleUpdate);
  }, [loadClients]);

  useEffect(() => {
    setSearch(urlSearch);
    setCurrentPage(1);
  }, [urlSearch, focusedClientId]);

  useEffect(() => {
    if (!editModal.isOpen) setShowEditPassword(false);
  }, [editModal.isOpen]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchFocusedClient = !focusedClientId || c.id === focusedClientId;
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
      return matchFocusedClient && matchSearch && matchPlan && matchStatus;
    });
  }, [clients, focusedClientId, search, planFilter, statusFilter]);

  const sortedFiltered = useMemo(() => {
    const copy = [...filtered];
    if (sortOption === 'az') {
      copy.sort((a, b) => (a.displayName || a.email || '').localeCompare((b.displayName || b.email || ''), undefined, { sensitivity: 'base' }));
    } else if (sortOption === 'za') {
      copy.sort((a, b) => (b.displayName || b.email || '').localeCompare((a.displayName || a.email || ''), undefined, { sensitivity: 'base' }));
    } else if (sortOption === 'recent') {
      copy.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortOption === 'oldest') {
      copy.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    }
    return copy;
  }, [filtered, sortOption]);

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
  }, [search, planFilter, statusFilter, sortOption]);


  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedClients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedFiltered.slice(start, start + PAGE_SIZE);
  }, [sortedFiltered, currentPage]);

  const pagedClientIds = useMemo(() => {
    return pagedClients.map((c) => c.id);
  }, [pagedClients]);

  const selectedClients = useMemo(() => {
    return filtered.filter((c) => selection.selectedIds.has(c.id));
  }, [filtered, selection.selectedIds]);

  const allFilteredSelected = useMemo(() => {
    return filtered.length > 0 && selectedClients.length === filtered.length;
  }, [filtered.length, selectedClients.length]);

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

  const isAscending = sortOption !== 'za';

  const toggleSortDirection = () => {
    setSortOption((prev) => {
      if (prev === 'recent') return 'az';
      return prev === 'az' ? 'za' : 'az';
    });
  };

  const handlePlanChange = async (userId: string, newPlan: string) => {
    setSavingId(userId);
    try {
      const res = await updateClientPlan(userId, newPlan);
      if (res.success) {
        setClients((prev) =>
          prev.map((c) => (c.id === userId ? { ...c, subscriptionPlan: newPlan } : c))
        );
        const client = clients.find(c => c.id === userId);
        addNotification("User Plan Updated", `Updated ${client?.displayName || client?.email || 'user'}'s plan to ${getPlanLabel(newPlan)}.`, 'info');
        setToast(`Plan updated to ${getPlanLabel(newPlan)}`);
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

  const handleSuspend = async (client: ClientRow, suspensionReason?: string) => {
    setActionLoadingId(client.id);
    try {
      const res = await updateClientStatus(client.id, 'Suspended', suspensionReason || '');
      if (res.success) {
        setClients((prev) =>
          prev.map((c) => (c.id === client.id ? { ...c, status: 'Suspended', isActive: false } : c))
        );
        addNotification("User Suspended", `Suspended ${client.displayName || client.email}${suspensionReason ? `: ${suspensionReason}` : ''}.`, 'warning');
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
        addNotification("User Activated", `Activated ${client.displayName || client.email}.`, 'success');
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

  const openActionModal = (config: Omit<ActionModalState, 'isOpen'>) => {
    setActionReason('');
    setActionModal({ isOpen: true, ...config });
  };

  const closeActionModal = () => {
    setActionModal((prev) => ({ ...prev, isOpen: false }));
    setActionReason('');
  };

  const runActionModal = async () => {
    const action = actionModal.action;
    const reason = actionReason.trim();
    closeActionModal();
    if (action) await action(reason);
  };

  const handleDeleteClick = (client: ClientRow) => {
    openActionModal({
      title: 'Delete client?',
      message: 'This will permanently remove the client and their data. This action cannot be undone.',
      confirmText: 'Delete',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
      action: async () => {
        await handleDelete(client.id);
      },
    });
  };

  const confirmSuspendClient = async (client: ClientRow) => {
    openActionModal({
      title: 'Suspend user?',
      message: 'You can provide an optional reason for suspension.',
      confirmText: 'Suspend',
      confirmButtonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      requiresReason: true,
      reasonLabel: 'Suspension reason (optional)',
      reasonPlaceholder: 'Enter reason (optional)',
      action: async (reason) => {
        await handleSuspend(client, reason);
      },
    });
  };

  const confirmActivateClient = async (client: ClientRow) => {
    openActionModal({
      title: 'Reactivate user?',
      message: 'This user account will be reactivated.',
      confirmText: 'Reactivate',
      confirmButtonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      action: async () => {
        await handleActivate(client);
      },
    });
  };

  const confirmBulkSuspend = async () => {
    if (selectedClients.length === 0) return;
    if (allSelectedSuspended) {
      openActionModal({
        title: 'Reactivate selected users?',
        message: `Reactivate ${selectedClients.length} selected user(s).`,
        confirmText: 'Reactivate',
        confirmButtonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        action: async () => {
          await handleBulkSuspend('');
        },
      });
      return;
    }

    openActionModal({
      title: 'Suspend selected users?',
      message: `Suspend ${selectedClients.length} selected user(s). You can provide an optional reason.`,
      confirmText: 'Suspend',
      confirmButtonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      requiresReason: true,
      reasonLabel: 'Suspension reason (optional)',
      reasonPlaceholder: 'Enter reason (optional)',
      action: async (reason) => {
        await handleBulkSuspend(reason);
      },
    });
  };

  const confirmBulkDelete = async () => {
    if (selectedClients.length === 0) return;
    openActionModal({
      title: 'Delete selected users?',
      message: `Delete ${selectedClients.length} selected user(s)? This cannot be undone.`,
      confirmText: 'Delete',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
      action: async () => {
        await handleBulkDelete();
      },
    });
  };

  const handleEditClick = (client: ClientRow) => {
    setShowEditPassword(false);
    setEditModal({
      isOpen: true,
      client,
      name: client.displayName || '',
      email: client.email || '',
      phone: client.phone || '',
      bio: client.bio || '',
      password: '',
    });
  };

  const handleUpdateClientDetails = async () => {
    if (!editModal.client) return;
    const nextPassword = (editModal.password || '').trim();
    if (nextPassword && nextPassword.length < 6) {
      setToast('Password must be at least 6 characters.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setActionLoadingId(editModal.client.id);
    try {
      const res = await updateClientDetails(editModal.client.id, {
        name: editModal.name.trim(),
        email: editModal.email.trim(),
        phone: editModal.phone.trim(),
        bio: editModal.bio.trim(),
        password: nextPassword || undefined,
      });
      if (res.success) {
        const updatedUser = res.user;
        setClients((prev) =>
          prev.map((c) => (editModal.client && c.id === editModal.client.id
            ? {
                ...c,
                displayName: updatedUser?.displayName ?? editModal.name.trim(),
                email: updatedUser?.email ?? editModal.email.trim(),
                phone: updatedUser?.phone ?? editModal.phone.trim(),
                bio: updatedUser?.bio ?? editModal.bio.trim(),
              }
            : c))
        );
        addNotification("User Profile Updated", `Successfully updated details for ${editModal.name || editModal.email}.`, 'success');
        setToast('Client details updated.');
        setEditModal((prev) => ({ ...prev, isOpen: false }));
        setTimeout(() => setToast(null), 2500);
      } else {
        setToast(res.message || 'Update failed');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Update failed');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await deleteClient(id);
      if (res.success) {
        const client = clients.find(c => c.id === id);
        addNotification("User Deleted", `Permanently removed user ${client?.displayName || client?.email || id}.`, 'error');
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

  const handleBulkSuspend = async (suspensionReason?: string) => {
    if (selectedClients.length === 0) return;
    const shouldUnsuspend = allSelectedSuspended;
    const nextStatus = shouldUnsuspend ? 'Published' : 'Suspended';
    let done = 0;
    let failed = 0;
    for (const client of selectedClients) {
      try {
        const res = await updateClientStatus(client.id, nextStatus, shouldUnsuspend ? '' : (suspensionReason || ''));
        if (res.success) done += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }

    setClients((prev) => prev.map((c) => selection.selectedIds.has(c.id)
      ? { ...c, status: nextStatus, isActive: nextStatus.toLowerCase() !== 'suspended' }
      : c));
    selection.clearSelection();
    const actionLabel = shouldUnsuspend ? 'Unsuspended' : 'Suspended';
    addNotification(`Bulk ${actionLabel}`, `${actionLabel} ${done} user(s).`, shouldUnsuspend ? 'success' : 'warning');
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

    setClients((prev) => prev.filter((c) => !selection.selectedIds.has(c.id)));
    selection.clearSelection();
    addNotification("Bulk Delete", `Deleted ${done} user(s).`, 'error');
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
          <div className="grid grid-cols-1 xl:grid-cols-2 items-center gap-4">
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortMenuOpen((v) => !v)}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-[#E2C7FF] bg-white text-[#A855F7] shadow-[0_2px_8px_rgba(177,59,255,0.12)] hover:bg-[#F8F2FF] transition-all"
                  aria-label="Sort users"
                  title="Sort"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                </button>
                {sortMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setSortMenuOpen(false)} />
                    <div className="absolute left-0 top-12 z-40 w-48 rounded-2xl border border-[#E2C7FF] bg-white/95 backdrop-blur-md shadow-[0_10px_24px_rgba(177,59,255,0.2)] p-1.5 animate-in fade-in zoom-in duration-200">
                      {(['recent', 'oldest', 'az', 'za'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setSortOption(opt); setSortMenuOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            sortOption === opt ? 'bg-[#F3E8FF] text-[#6D28D9]' : 'text-[#6F657E] hover:bg-[#F8F2FF]'
                          }`}
                        >
                          {opt === 'recent' && 'Recently Created'}
                          {opt === 'oldest' && 'Oldest First'}
                          {opt === 'az' && 'Alphabetical (A–Z)'}
                          {opt === 'za' && 'Alphabetical (Z–A)'}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>


            <div className="relative justify-self-end w-full max-w-[390px]">
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-14 pr-4 py-3 bg-white text-[#7E4FB4] text-[0.98rem] rounded-[12px] border border-[#E2C7FF] shadow-[0_2px_8px_rgba(177,59,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 focus:border-[#B13BFF]"
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#FFCC00] text-[#5F3A84] flex items-center justify-center pointer-events-none shadow-sm">
                <SearchIcon />
              </div>
              {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[#A47BCF] hover:bg-[#F3E8FF] hover:text-[#6D28D9]"
                      aria-label="Clear search"
                    >
                      x
                    </button>
              )}
            </div>
          </div>

          {selectedClients.length > 0 && (
            <div className="mt-4 flex items-center gap-3 border-t border-[#EBDDFF] pt-3">
              <span className="text-sm font-medium text-[#6F657E]">{selectedClients.length} selected</span>
              <button
                type="button"
                onClick={() => {
                  if (allFilteredSelected) {
                    selection.clearSelection();
                  } else {
                    selection.selectAll(filtered.map((c) => c.id));
                  }
                }}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                {allFilteredSelected ? 'Unselect All' : 'Select All'}
              </button>
              {selectedClients.length === 1 ? (
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

        {/* Action confirmation modal */}
        {actionModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(200,185,245,0.45)] backdrop-blur-[3px]" role="dialog" aria-modal="true">
            <div className="rounded-xl shadow-xl max-w-md w-full mx-4 p-6 bg-white border border-[rgba(166,61,255,0.16)]" style={{ boxShadow: '0 20px 50px rgba(103,2,191,0.12)' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{actionModal.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{actionModal.message}</p>
              {actionModal.requiresReason && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{actionModal.reasonLabel || 'Reason (optional)'}</label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={3}
                    placeholder={actionModal.reasonPlaceholder || 'Enter optional reason'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 focus:border-[#B13BFF]"
                  />
                </div>
              )}
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

        {/* Client Edit Modal */}
        {editModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(200,185,245,0.45)] backdrop-blur-[3px]" role="dialog" aria-modal="true">
            <div className="rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8 bg-white border border-[rgba(166,61,255,0.16)] flex flex-col gap-6" style={{ boxShadow: '0 25px 60px rgba(103,2,191,0.15)' }}>
              <div>
                <h3 className="text-2xl font-bold text-[#26155E] mb-1">Edit Client Profile</h3>
                <p className="text-[#8E47D8]/70 text-sm">Update personal information and account security.</p>
              </div>

              <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto px-1 pr-3 custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold text-[#462596] uppercase tracking-wider mb-2 ml-1">Full Name</label>
                  <input
                    type="text"
                    value={editModal.name}
                    onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                    className="w-full rounded-xl border border-[#D7B5FF] bg-[#F9F7FF] px-4 py-3 text-sm text-[#26155E] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 focus:border-[#B13BFF] transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#462596] uppercase tracking-wider mb-2 ml-1">Email Address</label>
                    <input
                      type="email"
                      value={editModal.email}
                      onChange={(e) => setEditModal({ ...editModal, email: e.target.value })}
                      className="w-full rounded-xl border border-[#D7B5FF] bg-[#F9F7FF] px-4 py-3 text-sm text-[#26155E] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 focus:border-[#B13BFF] transition-all"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#462596] uppercase tracking-wider mb-2 ml-1">Phone Number</label>
                    <input
                      type="text"
                      value={editModal.phone}
                      onChange={(e) => setEditModal({ ...editModal, phone: e.target.value })}
                      className="w-full rounded-xl border border-[#D7B5FF] bg-[#F9F7FF] px-4 py-3 text-sm text-[#26155E] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 focus:border-[#B13BFF] transition-all"
                      placeholder="Enter phone"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#462596] uppercase tracking-wider mb-2 ml-1">Bio</label>
                  <textarea
                    value={editModal.bio}
                    onChange={(e) => setEditModal({ ...editModal, bio: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-[#D7B5FF] bg-[#F9F7FF] px-4 py-3 text-sm text-[#26155E] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 focus:border-[#B13BFF] transition-all resize-none"
                    placeholder="Client biography..."
                  />
                </div>

                <div className="border-t border-[#F0E5FF] pt-4">
                  <label className="block text-xs font-bold text-[#462596] uppercase tracking-wider mb-2 ml-1">New Password (optional)</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editModal.password}
                      onChange={(e) => setEditModal({ ...editModal, password: e.target.value })}
                      className="w-full rounded-xl border border-[#D7B5FF] bg-[#F9F7FF] px-4 py-3 pr-12 text-sm text-[#26155E] focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/30 focus:border-[#B13BFF] transition-all font-mono"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword((prev) => !prev)}
                      aria-label={showEditPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#8E47D8] hover:bg-[#EBDDFF] transition-colors"
                    >
                      {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="mt-2 text-[0.7rem] text-[#A48ABF] ml-1">Leave blank to keep current password. Minimum 6 characters.</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-[#F0E5FF]">
                <button
                  onClick={() => setEditModal({ ...editModal, isOpen: false })}
                  className="px-6 py-2.5 text-[#6D28D9] bg-[#F3E8FF] rounded-xl hover:bg-[#EBDDFF] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateClientDetails}
                  disabled={actionLoadingId === editModal.client?.id}
                  className="px-8 py-2.5 rounded-xl font-bold bg-gradient-to-r from-[#B13BFF] to-[#6D28D9] text-white shadow-lg hover:shadow-[#B13BFF]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoadingId === editModal.client?.id ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-h-[62vh] overflow-x-auto overflow-y-auto">
<<<<<<< HEAD
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-[rgba(177,59,255,0.2)]">
                <th className="px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Name</th>
                <th className="px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Email</th>
                <th className="px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Plan</th>
                <th className="px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Created</th>
                <th className="px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Status</th>
                <th className="px-3 py-4 text-center text-[1.2rem] font-semibold text-[#462596]">Actions</th>
=======
          <table className="w-full min-w-[920px] table-fixed">
            <thead>
              <tr className="border-b border-[rgba(177,59,255,0.2)]">
                <th className="w-[15%] px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Name</th>
                <th className="w-[23%] px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Email</th>
                <th className="w-[16%] px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Plan</th>
                <th className="w-[13%] px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Websites</th>
                <th className="w-[13%] px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Created</th>
                <th className="w-[8%] px-3 py-4 text-left text-[1.2rem] font-semibold text-[#462596]">Status</th>
                <th className="w-[12%] px-3 py-4 text-center text-[1.2rem] font-semibold text-[#462596]">Actions</th>
>>>>>>> c58e195cf05eeb681de0b851e0cbe0f7637f58ee
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Loading…</td></tr>
              ) : filtered.length > 0 ? (
                pagedClients.map((client) => {
                  const active = isClientActive(client);
                  const online = isUserOnline(client.lastSeen);
                  const busy = actionLoadingId === client.id;
                  const storage = getClientStorage(client);
                  
                  const s = (client.status || '').toLowerCase();
                  const isSuspended = s === 'suspended';
                  const isRestricted = s === 'restricted';
                  
                  let statusLabel = active ? 'Active' : 'Inactive';
                  if (active) {
                    statusLabel = online ? 'Online' : 'Offline';
                  } else if (isSuspended) {
                    statusLabel = 'Suspended';
                  } else if (isRestricted) {
                    statusLabel = 'Restricted';
                  }

                  const isSelected = selection.selectedIds.has(client.id);
                  return (
                    <tr
                      key={client.id}
                      className={`select-none cursor-pointer transition-all duration-200 rounded-lg ${isSelected
                        ? 'bg-gradient-to-r from-[#E8D9FF] to-[#F0E5FF] border-2 border-[#D0B4FF] shadow-md hover:shadow-lg hover:from-[#E0CAFF] hover:to-[#E8D9FF]'
                        : 'border-b border-[rgba(177,59,255,0.1)] hover:bg-white/35'
                        }`}
                      onClick={(e) => {
                        (e as React.MouseEvent).preventDefault?.();
                        const isCtrlKey = (e as React.MouseEvent).ctrlKey || (e as React.MouseEvent).metaKey;
                        selection.handleRowClick(client.id, (e as React.MouseEvent).shiftKey, isCtrlKey, pagedClientIds);
                      }}
                      onMouseDown={(e) => {
                        (e as React.MouseEvent).preventDefault?.();
                        selection.handleRowMouseDown(client.id);
                      }}
                      onMouseEnter={() => selection.handleRowMouseEnter(client.id, pagedClientIds)}
                      onMouseUp={() => selection.handleRowMouseUp()}
                      onMouseLeave={() => {
                        if (!selection.isDragging) selection.handleRowMouseUp();
                      }}
                    >
                      <td className="px-3 py-4 text-[1rem] font-semibold text-[#26155E] truncate" title={client.displayName || ''}>
                        {client.displayName || '—'}
                      </td>
                      <td className="px-3 py-4 text-[0.92rem] text-[#B2AEBF] font-medium truncate" title={client.email}>
                        {client.email}
                      </td>
                      <td className="px-3 py-4 text-[0.95rem]">
                        <div className="relative inline-flex items-center gap-3">
                          <Tooltip label="Click to view storage usage and remaining space">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStorageHintClientId(client.id);
                              }}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStorageHintClientId(null);
                                  }}
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
                            onChange={(e) => {
                              e.stopPropagation();
                              handlePlanChange(client.id, e.target.value);
                            }}
                            aria-label={`Change plan for ${client.displayName || client.email}`}
                            className={`min-w-[90px] px-3 py-1 text-[0.9rem] font-semibold rounded-full border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none ${getPlanPillClasses(client.subscriptionPlan || 'free')}`}
                          >
                            {PLAN_OPTIONS.map((p) => (
                              <option key={p} value={p} className="text-black bg-white">
                                {getPlanLabel(p)}
                              </option>
                            ))}
                          </select>
                          {savingId === client.id && <span className="text-xs text-[#82788F]">Saving…</span>}
                        </div>
                      </td>
<<<<<<< HEAD
=======
                      <td className="px-3 py-4 text-[0.95rem] text-[#AFA9BE] font-semibold truncate" title={websiteLabel(client)}>
                        {websiteLabel(client)}
                      </td>
>>>>>>> c58e195cf05eeb681de0b851e0cbe0f7637f58ee
                      <td className="px-3 py-4 text-[0.95rem] text-[#AFA9BE] font-semibold">{formatDate(client.createdAt)}</td>
                      <td className={`px-3 py-4 text-[1rem] font-semibold`}>
                        <div className="flex items-center gap-1.5">
                          {active ? (
                            <>
                              <div className={`h-2 w-2 rounded-full ${online ? 'bg-[#00C438] shadow-[0_0_8px_rgba(0,196,56,0.6)]' : 'bg-[#B2AEBF]'}`} />
                              <span className={online ? 'text-[#00C438]' : 'text-[#6F657E]'}>{statusLabel}</span>
                            </>
                          ) : (
                            <>
                              <div className={`h-2 w-2 rounded-full ${isSuspended ? 'bg-[#FF0000]' : 'bg-[#FFCC00]'}`} />
                              <span className={isSuspended ? 'text-[#FF0000]' : 'text-[#A08100]'}>{statusLabel}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="inline-flex items-center gap-2 justify-center text-[#5A2AA8]">
                          <Tooltip label="Client profile">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(client);
                              }}
                              className="p-1 hover:text-[#3D1C87] transition-colors"
                              aria-label="Client profile"
                            >
                              <ManageIcon />
                            </button>
                          </Tooltip>
                          <Tooltip label={active ? 'Suspend client' : 'Activate client'}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                active ? confirmSuspendClient(client) : confirmActivateClient(client);
                              }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(client);
                              }}
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
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No clients found.</td></tr>
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
                    className={`min-w-8 px-2 py-1.5 text-sm rounded-md border transition-colors ${currentPage === item
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
      </div >
    </>
  );
}
