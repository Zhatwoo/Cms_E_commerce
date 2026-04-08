'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../components/context/theme-context';
import { useProject } from '../components/context/project-context';
import { TabBar, type TabBarItem } from '../components/ui/tabbar';
import { SearchBar } from '../components/ui/searchbar';
import { Pagination } from '../components/ui/Pagination';
import { ViewModeToggle } from '../components/buttons/viewModeToggle';
import { EmptyState } from '../components/ui/emptyState';
import { listMyPublishedOrders, updatePublishedOrderStatus, type ApiPublishedOrder } from '@/lib/api';
import { CustomDropdown } from '../components/ui/customDropdown';

type OrderStatus = 'Pending' | 'Processing' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

const THUMBNAILS = ['/images/template-saas.jpg', '/images/template-fashion.jpg', '/images/template-portfolio.jpg'];

// ─── Payment mode config ─────────────────────────────────────────────────────
type PaymentMode = 'COD' | 'Bank Transfer' | 'Stripe' | 'PayPal' | 'GCash' | 'Maya';
const PAYMENT_ICONS: Record<PaymentMode, { icon: string; bg: string; color: string }> = {
  COD:           { icon: '💵', bg: '#FFCC0022', color: '#FFCC00' },
  'Bank Transfer':{ icon: '🏦', bg: '#6702BF22', color: '#A855F7' },
  Stripe:        { icon: '💳', bg: '#635BFF22', color: '#635BFF' },
  PayPal:        { icon: '🅿', bg: '#003087' + '22', color: '#009CDE' },
  GCash:         { icon: '📱', bg: '#007DFF22', color: '#007DFF' },
  Maya:          { icon: '💚', bg: '#00C27722', color: '#00C277' },
};

// Map the stored payment_method string from the DB to a display PaymentMode
function resolvePaymentMode(order: ApiPublishedOrder): PaymentMode {
  const raw = String(
    (order as any).paymentMethod ||
    (order as any).payment_method ||
    ''
  ).toLowerCase().trim();
  if (raw === 'stripe') return 'Stripe';
  if (raw === 'paypal') return 'PayPal';
  if (raw === 'gcash') return 'GCash';
  if (raw === 'maya') return 'Maya';
  if (raw === 'cod') return 'COD';
  if (raw === 'bank_transfer' || raw === 'bank transfer') return 'Bank Transfer';
  // Fallback: no payment method stored yet → show COD
  return 'COD';
}

type CheckoutTab = 'all' | 'pending' | 'transit' | 'completed';
type ViewMode = 'list' | 'grid';

const CHECKOUT_TABS: readonly TabBarItem<CheckoutTab>[] = [
  { id: 'all', label: 'ALL CHECKOUTS' },
  { id: 'pending', label: 'PENDING' },
  { id: 'transit', label: 'IN TRANSIT' },
  { id: 'completed', label: 'COMPLETED' },
];

const ORDER_CATEGORIES = [
  { id: 'fashion-apparel', label: 'Fashion & Apparel', keywords: ['fashion', 'apparel', 'clothing', 'wear', 'shirt', 'dress', 'shoe', 'bag'] },
  { id: 'electronics-tech', label: 'Electronics & Tech', keywords: ['electronics', 'tech', 'gadget', 'laptop', 'phone', 'tablet', 'headset', 'camera'] },
  { id: 'home-living', label: 'Home & Living', keywords: ['home', 'living', 'furniture', 'kitchen', 'decor', 'bed', 'sofa', 'lamp'] },
  { id: 'food-beverages', label: 'Food & Beverages', keywords: ['food', 'beverage', 'drink', 'snack', 'coffee', 'tea', 'milk', 'juice'] },
  { id: 'beauty', label: 'Beauty', keywords: ['beauty', 'cosmetic', 'skincare', 'makeup', 'perfume', 'lotion', 'serum'] },
  { id: 'kids-toys-hobbies', label: 'Kids, Toys & Hobbies', keywords: ['kids', 'toy', 'hobby', 'game', 'puzzle', 'doll', 'lego'] },
  { id: 'pets', label: 'Pets', keywords: ['pet', 'dog', 'cat', 'aquarium', 'leash', 'petfood'] },
  { id: 'automotive', label: 'Automotive', keywords: ['auto', 'automotive', 'car', 'motor', 'tire', 'engine', 'helmet'] },
  { id: 'sports-fitness', label: 'Sports & Fitness', keywords: ['sports', 'fitness', 'gym', 'workout', 'running', 'yoga', 'dumbbell'] },
  { id: 'creative-handmade', label: 'Creative & Handmade', keywords: ['creative', 'handmade', 'craft', 'art', 'custom', 'diy'] },
] as const;

function normalizeSubdomain(value?: string | null): string {
  return (value || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function orderNumber(order: ApiPublishedOrder): string {
  return `ORD-${order.id.slice(-8).toUpperCase()}`;
}

function statusCategory(status: string): CheckoutTab {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending' || normalized === 'processing') return 'pending';
  if (normalized === 'shipped') return 'transit';
  if (normalized === 'delivered' || normalized === 'paid') return 'completed';
  return 'all';
}

function formatPayout(amount: number): string {
  return `₱${Number(amount || 0).toLocaleString()}`;
}

function statusLabel(status: string): string {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'shipped') return 'In Transit';
  return status || 'Pending';
}

function normalizeOrderStatus(status: string): OrderStatus {
  const matched = ORDER_STATUSES.find(
    (value) => value.toLowerCase() === String(status || '').toLowerCase()
  );
  return matched || 'Pending';
}

function shippingSummary(address: ApiPublishedOrder['shippingAddress']): string {
  if (!address || typeof address !== 'object') return 'No shipping address provided.';
  const source = address as Record<string, unknown>;
  const fields = [
    source.addressLine1, source.addressLine2, source.street,
    source.city, source.state, source.province, source.zip, source.country,
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);
  if (!fields.length) return 'No shipping address provided.';
  return fields.join(', ');
}

function contactSummary(address: ApiPublishedOrder['shippingAddress']): string {
  if (!address || typeof address !== 'object') return 'No contact details';
  const source = address as Record<string, unknown>;
  const name = typeof source.fullName === 'string' ? source.fullName : typeof source.name === 'string' ? source.name : '';
  const phone = typeof source.phone === 'string' ? source.phone : '';
  const email = typeof source.email === 'string' ? source.email : '';
  return [name, phone, email].filter(Boolean).join(' • ') || 'No contact details';
}

function rowBadge(status: string, colors: ReturnType<typeof useTheme>['colors']) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending' || normalized === 'processing') {
    return { label: statusLabel(status), bg: `${colors.accent.yellow}22`, color: colors.accent.yellow };
  }
  if (normalized === 'shipped') {
    return { label: 'In Transit', bg: `${colors.accent.purple}33`, color: colors.text.primary };
  }
  if (normalized === 'delivered' || normalized === 'paid') {
    return { label: 'Completed', bg: `${colors.status.good}2A`, color: colors.status.good };
  }
  return { label: status || 'Unknown', bg: `${colors.text.muted}2D`, color: colors.text.muted };
}

// ─── Payment mode pill ────────────────────────────────────────────────────────
function PaymentModePill({ mode, compact = false }: { mode: PaymentMode; compact?: boolean }) {
  const cfg = PAYMENT_ICONS[mode];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-semibold"
      style={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontSize: compact ? '10px' : '11px',
        padding: compact ? '2px 8px' : '3px 10px',
        border: `1px solid ${cfg.color}33`,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: compact ? '10px' : '12px' }}>{cfg.icon}</span>
      {mode}
    </span>
  );
}

export default function OrdersPage() {
  const { colors, theme } = useTheme();
  const { selectedProject, loading: projectLoading } = useProject();
  const selectedSubdomain = normalizeSubdomain(selectedProject?.subdomain);
  const [orders, setOrders] = useState<ApiPublishedOrder[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<CheckoutTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<OrderStatus>('Pending');

  const loadOrders = useCallback(async () => {
    if (projectLoading) { setLoading(true); return; }
    setLoading(true);
    setError(null);
    if (!selectedSubdomain) { setOrders([]); setLoading(false); return; }
    try {
      const res = await listMyPublishedOrders({ subdomain: selectedSubdomain || undefined, limit: 200, page: 1 });
      setOrders(Array.isArray(res.items) ? res.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [projectLoading, selectedSubdomain]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selectedCategory = ORDER_CATEGORIES.find((c) => c.id === categoryFilter);
    return orders.filter((o) => {
      const num = orderNumber(o).toLowerCase();
      const buyer = String(o.shippingAddress && typeof o.shippingAddress === 'object'
        ? (o.shippingAddress as Record<string, unknown>).fullName || (o.shippingAddress as Record<string, unknown>).name || '' : '').toLowerCase();
      const itemText = (o.items || []).map((i) => `${i.name || ''} ${i.sku || ''}`).join(' ').toLowerCase();
      const matchesSearch = !query || num.includes(query) || buyer.includes(query) || itemText.includes(query);
      const tab = statusCategory(String(o.status || ''));
      const matchesTab = activeTab === 'all' || tab === activeTab;
      const matchesCategory = categoryFilter === 'all' ||
        (selectedCategory ? selectedCategory.keywords.some((kw) => itemText.includes(kw)) : false);
      return matchesSearch && matchesTab && matchesCategory;
    });
  }, [orders, search, activeTab, categoryFilter]);

  const pageSize = viewMode === 'grid' ? 6 : 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedOrders = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginationItems =
    totalPages <= 6
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : [1, 2, 3, 4, 5, 'ellipsis', totalPages];

  const handleStatusUpdate = useCallback(async (order: ApiPublishedOrder, nextStatus: string) => {
    if (!nextStatus || nextStatus === order.status) return true;
    if (!order.subdomain) { window.alert('Cannot update status for order without subdomain.'); return false; }
    try {
      setUpdatingId(order.id);
      await updatePublishedOrderStatus(order.subdomain, order.id, nextStatus as OrderStatus);
      await loadOrders();
      return true;
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Unable to update order status');
      return false;
    } finally {
      setUpdatingId(null);
    }
  }, [loadOrders]);

  const toggleDetails = useCallback((orderId: string) => {
    setExpandedOrderId((cur) => {
      if (cur === orderId) { setEditingOrderId((e) => (e === orderId ? null : e)); return null; }
      return orderId;
    });
  }, []);

  const startEditStatus = useCallback((order: ApiPublishedOrder) => {
    setExpandedOrderId(order.id);
    setEditingOrderId(order.id);
    setDraftStatus(normalizeOrderStatus(String(order.status || 'Pending')));
  }, []);

  const saveEditedStatus = useCallback(async (order: ApiPublishedOrder) => {
    const ok = await handleStatusUpdate(order, draftStatus);
    if (ok) setEditingOrderId(null);
  }, [draftStatus, handleStatusUpdate]);

  useEffect(() => {
    setPage(1);
    setExpandedOrderId(null);
    setEditingOrderId(null);
  }, [activeTab, search, viewMode, categoryFilter]);

  const actionButtonClass = 'h-8 min-w-8 px-2 rounded-md border inline-flex items-center justify-center transition-opacity disabled:opacity-60';

  const renderIcon = (type: 'eye' | 'check' | 'close') => {
    if (type === 'eye') return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
      </svg>
    );
    if (type === 'check') return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div className="dashboard-landing-light relative min-h-[calc(100vh-176px)] px-3 py-3 sm:px-5 sm:py-4 lg:px-25 [font-family:var(--font-outfit),sans-serif]">

      {/* ── Header ── */}
      <section className="max-w-[1090px] mx-auto pt-6 pb-2">
        <div className="text-center">
          <h1
            className="text-4xl sm:text-6xl lg:text-[76px] font-black tracking-[-1.8px] leading-[1.2] [font-family:var(--font-outfit),sans-serif]"
            style={{ color: colors.text.primary }}
          >
            <span className={theme === 'dark' ? 'text-white' : 'text-[#120533]'}>Track your buyer</span>
            <br />
            <span
              className={`inline-block bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
              style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}
            >
              order flow
            </span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="mt-7 sm:mt-8 flex justify-center">
          <TabBar<CheckoutTab>
            tabs={CHECKOUT_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            theme={theme as 'light' | 'dark'}
            underlineLayoutId="orders-checkout-tab-underline"
          />
        </div>

        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          theme={theme as 'light' | 'dark'}
          placeholder="Search templates, designs, or actions"
          className="mx-auto mt-7 sm:mt-8 max-w-[860px]"
        />
      </section>

      {/* ── Controls ── */}
      <section className="relative z-10 mt-7 sm:mt-8 mb-4 sm:mb-5 flex flex-col gap-2.5 sm:gap-3 md:flex-row md:items-center md:justify-between">
        {/* Category filter */}
        <div className="w-full md:w-auto md:flex-none">
          <CustomDropdown
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={ORDER_CATEGORIES}
            title="Category"
          />
        </div>

        {/* Pagination */}
        {/* <Pagination
          theme={theme as 'light' | 'dark'}
          colors={colors}
          paginationItems={paginationItems}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(value) => setPage(value)}
          onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
          onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
        /> */}

        {/* View toggle */}
        <div className="w-full md:w-auto md:flex-none md:ml-auto">
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            theme={theme as 'light' | 'dark'}
          />
        </div>
      </section>

      {/* ── States ── */}
      {loading ? (
        <div className="py-14 text-center text-sm" style={{ color: colors.text.muted }}>Loading checkouts...</div>
      ) : error ? (
        <div className="py-14 text-center text-sm" style={{ color: colors.status.error }}>{error}</div>
      ) : pagedOrders.length === 0 ? (
        <EmptyState
          tone={theme === 'dark' ? 'dark' : 'light'}
          badgeText="No Checkouts"
          title="No Orders Yet"
          description="No checkouts found for the selected filters. Try changing your search or category."
          className="pt-6 pb-2"
        />
      ) : viewMode === 'list' ? (

        /* ══════════════════════════════════════════════════════
           LIST VIEW — now 7 cols including Mode of Payment
           ══════════════════════════════════════════════════════ */
        <section
          className={`relative z-10 rounded-2xl border overflow-hidden ${theme === 'dark' ? '' : 'admin-dashboard-panel border-0'}`}
          style={{
            borderColor: theme === 'dark' ? colors.border.faint : undefined,
            backgroundImage: theme === 'dark' ? 'linear-gradient(135deg, #110248 0%, #090029 100%)' : 'none',
          }}
        >
          {/* Header row */}
          <div
            className="grid px-4 py-3 text-[10px] uppercase font-semibold tracking-[0.16em] border-b"
            style={{
              gridTemplateColumns: '1.15fr 0.95fr 0.85fr 0.7fr 0.85fr 0.85fr 0.85fr',
              borderColor: colors.border.faint,
              color: colors.text.muted,
            }}
          >
            <span>Product</span>
            <span>Identity</span>
            <span>Buyer</span>
            <span>Payout</span>
            <span>Payment</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {pagedOrders.map((order, idx) => {
            const badge = rowBadge(String(order.status || 'Pending'), colors);
            const paymentMode = resolvePaymentMode(order);
            const isExpanded = expandedOrderId === order.id;
            const isEditing = editingOrderId === order.id;

            return (
              <div
                key={order.id}
                className="px-2.5 max-[390px]:px-2 sm:px-4 py-3.5 sm:py-4 border-b transition-colors duration-150"
                style={{
                  borderColor: colors.border.faint,
                  backgroundColor: isExpanded
                    ? theme === 'dark' ? 'rgba(103,2,191,0.07)' : 'rgba(139,92,246,0.04)'
                    : 'transparent',
                }}
              >
                <div
                  className="grid items-start md:items-center gap-2.5 md:gap-3"
                  style={{
                    gridTemplateColumns: 'repeat(1, 1fr)',
                    // On md+, 7 columns
                  }}
                >
                  {/* Mobile: stack everything, Desktop: 7-col grid */}
                  <div
                    className="hidden md:grid w-full items-center gap-3"
                    style={{ gridTemplateColumns: '1.15fr 0.95fr 0.85fr 0.7fr 0.85fr 0.85fr 0.85fr' }}
                  >
                    {/* Product */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={THUMBNAILS[idx % THUMBNAILS.length]}
                          alt="Order preview"
                          className="h-11 w-[68px] sm:h-12 sm:w-[74px] rounded-md object-cover border"
                          style={{ borderColor: colors.border.faint }}
                        />
                        {/* subtle shimmer overlay */}
                        <div className="absolute inset-0 rounded-md" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-widest" style={{ color: colors.accent.yellow }}>{orderNumber(order)}</p>
                        <p className="text-[12px] sm:text-[13px] font-semibold truncate" style={{ color: colors.text.primary }}>
                          {order.items?.[0]?.name || 'Product Name 0001'}
                        </p>
                        <button type="button" onClick={() => toggleDetails(order.id)}
                          className="mt-0.5 text-[10px] font-semibold underline-offset-2 hover:underline"
                          style={{ color: colors.accent.purple }}>
                          {isExpanded ? 'Close details' : 'See details'}
                        </button>
                      </div>
                    </div>

                    {/* Identity */}
                    <p className="text-[11px] truncate font-mono opacity-70" style={{ color: colors.text.secondary }}>{order.id}</p>

                    {/* Buyer */}
                    <p className="text-[13px] sm:text-sm" style={{ color: colors.text.primary }}>
                      {contactSummary(order.shippingAddress).split(' • ')[0] || 'John David'}
                    </p>

                    {/* Payout */}
                    <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
                      {formatPayout(Number(order.total || 0))}
                    </p>

                    {/* Payment mode — NEW COLUMN */}
                    <div>
                      <PaymentModePill mode={paymentMode} />
                    </div>

                    {/* Status */}
                    <span className="justify-self-start px-3 py-1 rounded-full text-[11px] font-semibold"
                      style={{ backgroundColor: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button type="button" className={actionButtonClass} title={isExpanded ? 'Close' : 'View'} onClick={() => toggleDetails(order.id)}
                        style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: `${colors.bg.elevated}CC` }}>
                        {renderIcon('eye')}
                      </button>
                      <button type="button" className={actionButtonClass} title="Mark completed" disabled={updatingId === order.id}
                        onClick={() => void handleStatusUpdate(order, 'Delivered')}
                        style={{ borderColor: colors.border.faint, color: colors.status.good, backgroundColor: `${colors.bg.elevated}CC` }}>
                        {renderIcon('check')}
                      </button>
                      <button type="button" className={actionButtonClass} title="Cancel" disabled={updatingId === order.id}
                        onClick={() => void handleStatusUpdate(order, 'Cancelled')}
                        style={{ borderColor: colors.border.faint, color: colors.status.error, backgroundColor: `${colors.bg.elevated}CC` }}>
                        {renderIcon('close')}
                      </button>
                    </div>
                  </div>

                  {/* ── Mobile layout (< md) ── */}
                  <div className="flex md:hidden items-start gap-3">
                    <div className="relative shrink-0">
                      <img src={THUMBNAILS[idx % THUMBNAILS.length]} alt="Order preview"
                        className="h-14 w-20 rounded-md object-cover border" style={{ borderColor: colors.border.faint }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold tracking-widest" style={{ color: colors.accent.yellow }}>{orderNumber(order)}</p>
                      <p className="text-[13px] font-semibold truncate" style={{ color: colors.text.primary }}>{order.items?.[0]?.name || 'Product'}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
                        <PaymentModePill mode={paymentMode} compact />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <p className="text-lg font-bold" style={{ color: colors.text.primary }}>{formatPayout(Number(order.total || 0))}</p>
                        <div className="flex gap-1">
                          <button type="button" className={actionButtonClass} onClick={() => toggleDetails(order.id)}
                            style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: `${colors.bg.elevated}CC` }}>{renderIcon('eye')}</button>
                          <button type="button" className={actionButtonClass} disabled={updatingId === order.id}
                            onClick={() => void handleStatusUpdate(order, 'Delivered')}
                            style={{ borderColor: colors.border.faint, color: colors.status.good, backgroundColor: `${colors.bg.elevated}CC` }}>{renderIcon('check')}</button>
                          <button type="button" className={actionButtonClass} disabled={updatingId === order.id}
                            onClick={() => void handleStatusUpdate(order, 'Cancelled')}
                            style={{ borderColor: colors.border.faint, color: colors.status.error, backgroundColor: `${colors.bg.elevated}CC` }}>{renderIcon('close')}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Expanded details ── */}
                {isExpanded && (
                  <div className="mt-4 rounded-xl border p-3 sm:p-4" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: colors.text.muted }}>Product details</span>
                      {/* Payment mode in details */}
                      <PaymentModePill mode={paymentMode} />
                      {!isEditing ? (
                        <button type="button" onClick={() => startEditStatus(order)}
                          className="h-8 px-3 rounded-md border text-[11px] font-semibold"
                          style={{ borderColor: colors.border.faint, color: colors.text.primary, backgroundColor: `${colors.bg.elevated}CC` }}>
                          Edit status
                        </button>
                      ) : (
                        <>
                          <label className="text-[11px]" style={{ color: colors.text.secondary }}>Status</label>
                          <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as OrderStatus)}
                            disabled={updatingId === order.id}
                            className="h-8 rounded-md border px-2.5 text-[11px] outline-none"
                            style={{ borderColor: colors.border.faint, color: colors.text.primary, backgroundColor: `${colors.bg.elevated}CC` }}>
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button type="button" onClick={() => void saveEditedStatus(order)} disabled={updatingId === order.id}
                            className="h-8 px-3 rounded-md border text-[11px] font-semibold disabled:opacity-60"
                            style={{ borderColor: colors.border.faint, color: colors.status.good, backgroundColor: `${colors.bg.elevated}CC` }}>Save</button>
                          <button type="button" onClick={() => setEditingOrderId(null)}
                            className="h-8 px-3 rounded-md border text-[11px] font-semibold"
                            style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: `${colors.bg.elevated}CC` }}>Cancel</button>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="uppercase text-[10px] mb-1" style={{ color: colors.text.muted }}>Delivery Address</p>
                        <p style={{ color: colors.text.secondary }}>{shippingSummary(order.shippingAddress)}</p>
                        <p className="mt-1" style={{ color: colors.text.secondary }}>{contactSummary(order.shippingAddress)}</p>
                      </div>
                      <div>
                        <p className="uppercase text-[10px] mb-1" style={{ color: colors.text.muted }}>Order Specification</p>
                        {(order.items || []).slice(0, 3).map((item, iIdx) => (
                          <p key={`${order.id}-spec-${iIdx}`} style={{ color: colors.text.secondary }}>
                            Variant: {item.name || item.sku || 'Item'} • Qty {item.quantity}
                          </p>
                        ))}
                      </div>
                      <div className="rounded-xl border p-3" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                        <p className="uppercase text-[10px]" style={{ color: colors.text.muted }}>Payment Details</p>
                        <div className="mt-1.5 mb-2">
                          <PaymentModePill mode={paymentMode} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between" style={{ color: colors.text.secondary }}>
                            <span>Base Price</span><span>{formatPayout(Number(order.total || 0) + 300)}</span>
                          </div>
                          <div className="flex items-center justify-between" style={{ color: colors.text.secondary }}>
                            <span>Voucher</span><span>-₱300</span>
                          </div>
                          <div className="flex items-center justify-between" style={{ color: colors.text.secondary }}>
                            <span>Shipping</span><span>₱0</span>
                          </div>
                          <div className="mt-2 pt-2 border-t flex items-center justify-between font-bold"
                            style={{ color: colors.accent.yellow, borderColor: colors.border.faint }}>
                            <span>Total Amount</span><span>{formatPayout(Number(order.total || 0))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

      ) : (
        /* ══════════════════════════════════════════════════════
           GRID VIEW — enhanced cards with payment mode
           ══════════════════════════════════════════════════════ */
        <section className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {pagedOrders.map((order, idx) => {
            const badge = rowBadge(String(order.status || 'Pending'), colors);
            const paymentMode = resolvePaymentMode(order);
            const paymentCfg = PAYMENT_ICONS[paymentMode];
            const isExpanded = expandedOrderId === order.id;
            const isEditing = editingOrderId === order.id;

            return (
              <article
                key={order.id}
                className={`rounded-2xl border overflow-hidden transition-all duration-200 ${theme === 'dark' ? '' : 'admin-dashboard-panel border-0'}`}
                style={{
                  borderColor: isExpanded ? `${colors.accent.purple}66` : (theme === 'dark' ? colors.border.faint : undefined),
                  backgroundImage: theme === 'dark' ? 'linear-gradient(135deg, #110248 0%, #0D0035 100%)' : 'none',
                  boxShadow: isExpanded
                    ? theme === 'dark' ? '0 0 0 1px rgba(103,2,191,0.3), 0 8px 32px rgba(103,2,191,0.15)' : '0 0 0 1px rgba(139,92,246,0.2), 0 8px 24px rgba(139,92,246,0.08)'
                    : undefined,
                }}
              >
                {/* Card image + status badge */}
                <div className="relative overflow-hidden">
                  <img
                    src={THUMBNAILS[idx % THUMBNAILS.length]}
                    alt="Order card preview"
                    className="h-32 sm:h-36 w-full object-cover"
                    style={{ display: 'block' }}
                  />
                  {/* gradient scrim */}
                  <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to top, rgba(9,0,41,0.6) 0%, transparent 55%)' }} />
                  {/* Status badge — top right */}
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow"
                    style={{ backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.color}33`, backdropFilter: 'blur(6px)' }}>
                    {badge.label}
                  </span>
                  {/* Order number — bottom left */}
                  <p className="absolute bottom-2.5 left-3 text-[10px] font-bold tracking-widest drop-shadow"
                    style={{ color: colors.accent.yellow }}>
                    {orderNumber(order)}
                  </p>
                </div>

                {/* Card body */}
                <div className="p-3 sm:p-3.5">
                  <p className="text-[13px] sm:text-sm font-semibold leading-snug" style={{ color: colors.text.primary }}>
                    {order.items?.[0]?.name || 'Product Name 0001'}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[12px] truncate pr-2" style={{ color: colors.text.secondary }}>
                      {contactSummary(order.shippingAddress).split(' • ')[0] || 'John David'}
                    </p>
                    <p className="text-base font-bold shrink-0" style={{ color: colors.accent.yellow }}>
                      {formatPayout(Number(order.total || 0))}
                    </p>
                  </div>

                  {/* Payment mode pill */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: colors.text.muted }}>via</span>
                    <PaymentModePill mode={paymentMode} compact />
                  </div>

                  {/* Divider */}
                  <div className="mt-3 mb-2.5 h-px" style={{ backgroundImage: `linear-gradient(90deg, ${colors.border.faint} 0%, transparent 100%)` }} />

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" className={`${actionButtonClass} w-full`} title={isExpanded ? 'Close' : 'View'}
                      onClick={() => toggleDetails(order.id)}
                      style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: `${colors.bg.elevated}CC` }}>
                      {renderIcon('eye')}
                    </button>
                    <button type="button" className={`${actionButtonClass} w-full`} title="Mark in transit"
                      disabled={updatingId === order.id}
                      onClick={() => void handleStatusUpdate(order, 'Shipped')}
                      style={{ borderColor: colors.border.faint, color: colors.status.good, backgroundColor: `${colors.bg.elevated}CC` }}>
                      {renderIcon('check')}
                    </button>
                    <button type="button" className={`${actionButtonClass} w-full`} title="Cancel"
                      disabled={updatingId === order.id}
                      onClick={() => void handleStatusUpdate(order, 'Cancelled')}
                      style={{ borderColor: colors.border.faint, color: colors.status.error, backgroundColor: `${colors.bg.elevated}CC` }}>
                      {renderIcon('close')}
                    </button>
                  </div>

                  <button type="button" onClick={() => toggleDetails(order.id)}
                    className="mt-2 text-[11px] font-semibold underline-offset-2 hover:underline"
                    style={{ color: colors.accent.purple }}>
                    {isExpanded ? 'Close product details' : 'See product details'}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-2.5 rounded-xl border p-2.5 text-xs"
                      style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <p className="uppercase text-[10px] font-semibold tracking-wider" style={{ color: colors.text.muted }}>Order details</p>
                        {!isEditing ? (
                          <button type="button" onClick={() => startEditStatus(order)}
                            className="h-7 px-2.5 rounded-md border text-[11px] font-semibold"
                            style={{ borderColor: colors.border.faint, color: colors.text.primary }}>
                            Edit status
                          </button>
                        ) : (
                          <>
                            <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as OrderStatus)}
                              disabled={updatingId === order.id}
                              className="h-7 rounded-md border px-2 text-[11px] outline-none"
                              style={{ borderColor: colors.border.faint, color: colors.text.primary, backgroundColor: `${colors.bg.elevated}CC` }}>
                              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button type="button" onClick={() => void saveEditedStatus(order)} disabled={updatingId === order.id}
                              className="h-7 px-2.5 rounded-md border text-[11px] font-semibold disabled:opacity-60"
                              style={{ borderColor: colors.border.faint, color: colors.status.good }}>Save</button>
                            <button type="button" onClick={() => setEditingOrderId(null)}
                              className="h-7 px-2.5 rounded-md border text-[11px] font-semibold"
                              style={{ borderColor: colors.border.faint, color: colors.text.secondary }}>Cancel</button>
                          </>
                        )}
                      </div>
                      <p style={{ color: colors.text.secondary }}>{shippingSummary(order.shippingAddress)}</p>
                      {(order.items || []).slice(0, 3).map((item, iIdx) => (
                        <p key={`${order.id}-grid-spec-${iIdx}`} className="mt-1" style={{ color: colors.text.secondary }}>
                          Variant: {item.name || item.sku || 'Item'} • Qty {item.quantity}
                        </p>
                      ))}
                      {/* Payment in expanded card */}
                      <div className="mt-2 pt-2 border-t flex items-center gap-2"
                        style={{ borderColor: colors.border.faint }}>
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: colors.text.muted }}>Payment:</span>
                        <PaymentModePill mode={paymentMode} compact />
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}