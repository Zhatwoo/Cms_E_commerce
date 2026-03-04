'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../components/context/theme-context';
import { listMyOrders, updateOrderStatus, type ApiOrder } from '@/lib/api';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Returned'] as const;

const THUMBNAILS = ['/images/template-saas.jpg', '/images/template-fashion.jpg', '/images/template-portfolio.jpg'];

type CheckoutTab = 'all' | 'pending' | 'transit' | 'completed';
type ViewMode = 'list' | 'grid';

const CHECKOUT_TABS: { id: CheckoutTab; label: string }[] = [
  { id: 'all', label: 'All Checkouts' },
  { id: 'pending', label: 'Pending' },
  { id: 'transit', label: 'In Transit' },
  { id: 'completed', label: 'Completed' },
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

function orderNumber(order: ApiOrder): string {
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

function shippingSummary(address: ApiOrder['shippingAddress']): string {
  if (!address || typeof address !== 'object') return 'No shipping address provided.';
  const source = address as Record<string, unknown>;
  const fields = [
    source.addressLine1,
    source.addressLine2,
    source.street,
    source.city,
    source.state,
    source.province,
    source.zip,
    source.country,
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);
  if (!fields.length) return 'No shipping address provided.';
  return fields.join(', ');
}

function contactSummary(address: ApiOrder['shippingAddress']): string {
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
    return {
      label: statusLabel(status),
      bg: `${colors.accent.yellow}22`,
      color: colors.accent.yellow,
    };
  }
  if (normalized === 'shipped') {
    return {
      label: 'In Transit',
      bg: `${colors.accent.purple}33`,
      color: colors.text.primary,
    };
  }
  if (normalized === 'delivered' || normalized === 'paid') {
    return {
      label: 'Completed',
      bg: `${colors.status.good}2A`,
      color: colors.status.good,
    };
  }
  return {
    label: status || 'Unknown',
    bg: `${colors.text.muted}2D`,
    color: colors.text.muted,
  };
}

export default function OrdersPage() {
  const { colors } = useTheme();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<CheckoutTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const tabRefs = useRef<Record<CheckoutTab, HTMLButtonElement | null>>({
    all: null,
    pending: null,
    transit: null,
    completed: null,
  });
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0, ready: false });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listMyOrders({ limit: 200, page: 1 });
      setOrders(Array.isArray(res.items) ? res.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selectedCategory = ORDER_CATEGORIES.find((category) => category.id === categoryFilter);
    return orders.filter((o) => {
      const num = orderNumber(o).toLowerCase();
      const buyer = String(o.shippingAddress && typeof o.shippingAddress === 'object' ? (o.shippingAddress as Record<string, unknown>).fullName || (o.shippingAddress as Record<string, unknown>).name || '' : '').toLowerCase();
      const itemText = (o.items || [])
        .map((i) => `${i.name || ''} ${i.sku || ''}`)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || num.includes(query) || buyer.includes(query) || itemText.includes(query);
      const tab = statusCategory(String(o.status || ''));
      const matchesTab = activeTab === 'all' || tab === activeTab;
      const matchesCategory =
        categoryFilter === 'all' ||
        (selectedCategory ? selectedCategory.keywords.some((keyword) => itemText.includes(keyword)) : false);
      return matchesSearch && matchesTab && matchesCategory;
    });
  }, [orders, search, activeTab, categoryFilter]);

  const pageSize = viewMode === 'grid' ? 6 : 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedOrders = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginationItems =
    totalPages <= 6
      ? Array.from({ length: totalPages }, (_, idx) => idx + 1)
      : [1, 2, 3, 4, 5, 'ellipsis', totalPages];

  const handleStatusUpdate = useCallback(
    async (order: ApiOrder, nextStatus: string) => {
      if (!nextStatus || nextStatus === order.status) return;
      try {
        setUpdatingId(order.id);
        await updateOrderStatus(order.id, nextStatus as (typeof STATUS_OPTIONS)[number]);
        await loadOrders();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Unable to update order status');
      } finally {
        setUpdatingId(null);
      }
    },
    [loadOrders]
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, viewMode, categoryFilter]);

  const updateTabIndicator = useCallback(() => {
    const activeEl = tabRefs.current[activeTab];
    if (!activeEl) return;
    setTabIndicator({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
      ready: true,
    });
  }, [activeTab]);

  useLayoutEffect(() => {
    updateTabIndicator();
  }, [updateTabIndicator, activeTab]);

  useEffect(() => {
    window.addEventListener('resize', updateTabIndicator);
    return () => window.removeEventListener('resize', updateTabIndicator);
  }, [updateTabIndicator]);

  const actionButtonClass = 'h-8 min-w-8 px-2 rounded-md border inline-flex items-center justify-center transition-opacity disabled:opacity-60';

  const renderIcon = (type: 'eye' | 'check' | 'close') => {
    if (type === 'eye') {
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    }
    if (type === 'check') {
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div className="relative mx-auto w-full max-w-[1220px] px-0.5 sm:px-1 [font-family:var(--font-outfit),sans-serif]">
      <div
        className="pointer-events-none absolute top-24 right-6 h-56 w-56 opacity-20"
        style={{ background: `radial-gradient(circle at center, ${colors.accent.purple} 0%, transparent 72%)` }}
      />

      <section className="relative z-10 mb-6 sm:mb-7 text-center">
        <h1 className="text-[38px] max-[390px]:text-[34px] sm:text-5xl md:text-7xl lg:text-[78px] font-extrabold leading-[0.96] tracking-tight">
          <span className="block text-white">Track Buyer</span>
          <span
            className="block text-transparent bg-clip-text"
            style={{
              backgroundImage: 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)',
            }}
          >
            Checkouts
          </span>
        </h1>

        <div className="mt-5 sm:mt-6 flex justify-center">
          <div className="relative inline-flex items-center gap-x-4 max-[390px]:gap-x-3 md:gap-x-10">
            {CHECKOUT_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative whitespace-nowrap px-1 pb-2 text-[11px] max-[390px]:text-[10px] sm:text-[12px] font-semibold transition-colors duration-200"
                  style={{ color: isActive ? colors.accent.yellow : colors.text.muted }}
                >
                  {tab.label}
                </button>
              );
            })}
            <span
              className="pointer-events-none absolute bottom-[-3px] h-[3px] rounded-full transition-all duration-300 ease-out"
              style={{
                left: tabIndicator.left,
                width: tabIndicator.width,
                opacity: tabIndicator.ready ? 1 : 0,
                background: 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)',
                boxShadow: '0 0 12px rgba(177, 59, 255, 0.35)',
              }}
            />
          </div>
        </div>

        <div className="mx-auto mt-7 sm:mt-8 max-w-[760px] rounded-xl sm:rounded-2xl border px-3 max-[390px]:px-2.5 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-[0_10px_34px_rgba(16,11,62,0.36)]" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.card }}>
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" style={{ color: colors.accent.yellow }}>
            <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates, designs, or actions"
            className="w-full bg-transparent text-[13px] sm:text-sm outline-none placeholder:opacity-70"
            style={{ color: colors.text.primary }}
          />
        </div>
      </section>

      <section className="relative z-10 mb-4 sm:mb-5 grid grid-cols-1 md:grid-cols-[180px_auto_180px] items-center gap-2.5 sm:gap-3">
        <div className="justify-self-center md:justify-self-start w-full md:w-auto">
          <div className="relative w-full md:w-[178px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-12 w-full appearance-none rounded-2xl border pl-6 pr-10 text-[12px] font-semibold leading-none"
              style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.card, color: colors.text.primary }}
            >
              <option value="all">Category</option>
              {ORDER_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" style={{ color: colors.text.secondary }}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>

        <div className="justify-self-center flex items-center gap-1 sm:gap-2 text-xs" style={{ color: colors.text.secondary }}>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border text-[12px]"
            style={{ borderColor: colors.border.faint }}
            aria-label="Previous page"
          >
            ‹
          </button>
          {paginationItems.map((item, idx) => {
            if (item === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-0.5 text-[10px] sm:text-[11px]" style={{ color: colors.text.muted }}>
                  ...
                </span>
              );
            }
            const value = item as number;
            const active = currentPage === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPage(value)}
                className="h-6 min-w-6 sm:h-7 sm:min-w-7 px-1 max-[390px]:px-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px]"
                style={{
                  backgroundColor: active ? `${colors.text.muted}55` : 'transparent',
                  color: active ? colors.text.primary : colors.text.secondary,
                }}
              >
                {value}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border text-[12px]"
            style={{ borderColor: colors.border.faint }}
            aria-label="Next page"
          >
            ›
          </button>
        </div>

        <div className="justify-self-center md:justify-self-end flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg border inline-flex items-center justify-center"
            style={{
              borderColor: colors.border.faint,
              backgroundColor: viewMode === 'list' ? colors.accent.purple : colors.bg.card,
              color: colors.text.primary,
            }}
            aria-label="List view"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg border inline-flex items-center justify-center"
            style={{
              borderColor: colors.border.faint,
              backgroundColor: viewMode === 'grid' ? colors.accent.purple : colors.bg.card,
              color: colors.text.primary,
            }}
            aria-label="Grid view"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="4" y="4" width="6" height="6" rx="1" />
              <rect x="14" y="4" width="6" height="6" rx="1" />
              <rect x="4" y="14" width="6" height="6" rx="1" />
              <rect x="14" y="14" width="6" height="6" rx="1" />
            </svg>
          </button>
        </div>
      </section>

      {loading ? (
        <div className="py-14 text-center text-sm" style={{ color: colors.text.muted }}>
          Loading checkouts...
        </div>
      ) : error ? (
        <div className="py-14 text-center text-sm" style={{ color: colors.status.error }}>
          {error}
        </div>
      ) : pagedOrders.length === 0 ? (
        <div className="py-14 text-center text-sm" style={{ color: colors.text.muted }}>
          No checkouts found for the selected filters.
        </div>
      ) : viewMode === 'list' ? (
        <section
          className="relative z-10 rounded-2xl border overflow-hidden"
          style={{
            borderColor: colors.border.faint,
            background: 'linear-gradient(90deg, #110248 0%, #090029 100%)',
          }}
        >
          <div className="grid grid-cols-[1.2fr_1.05fr_1fr_0.8fr_0.9fr_0.9fr] px-4 py-3 text-[10px] uppercase font-semibold tracking-[0.16em] border-b" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
            <span>Product</span>
            <span>Identity</span>
            <span>Buyer</span>
            <span>Payout</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {pagedOrders.map((order, idx) => {
            const badge = rowBadge(String(order.status || 'Pending'), colors);
            const isExpanded = idx === 0;
            return (
              <div key={order.id} className="px-2.5 max-[390px]:px-2 sm:px-4 py-3.5 sm:py-4 border-b" style={{ borderColor: colors.border.faint }}>
                <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.05fr_1fr_0.8fr_0.9fr_0.9fr] items-start md:items-center gap-2.5 md:gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={THUMBNAILS[idx % THUMBNAILS.length]}
                      alt="Order preview"
                      className="h-11 w-[68px] sm:h-12 sm:w-[74px] rounded-md object-cover border shrink-0"
                      style={{ borderColor: colors.border.faint }}
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold" style={{ color: colors.accent.yellow }}>{orderNumber(order)}</p>
                      <p className="text-[12px] sm:text-[13px] font-semibold truncate" style={{ color: colors.text.primary }}>
                        {order.items?.[0]?.name || 'Product Name 0001'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs truncate md:mt-0" style={{ color: colors.text.secondary }}>{order.id}</p>
                  <p className="text-[13px] sm:text-sm" style={{ color: colors.text.primary }}>{contactSummary(order.shippingAddress).split(' • ')[0] || 'John David'}</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>{formatPayout(Number(order.total || 0))}</p>

                  <span className="justify-self-start px-3 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>

                  <div className="flex items-center gap-1.5 sm:gap-2 pt-1 md:pt-0">
                    <button
                      type="button"
                      className={actionButtonClass}
                      title="Inspect"
                      style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: `${colors.bg.elevated}CC` }}
                    >
                      {renderIcon('eye')}
                    </button>
                    <button
                      type="button"
                      className={actionButtonClass}
                      title="Mark completed"
                      disabled={updatingId === order.id}
                      onClick={() => void handleStatusUpdate(order, 'Delivered')}
                      style={{ borderColor: colors.border.faint, color: colors.status.good, backgroundColor: `${colors.bg.elevated}CC` }}
                    >
                      {renderIcon('check')}
                    </button>
                    <button
                      type="button"
                      className={actionButtonClass}
                      title="Cancel"
                      disabled={updatingId === order.id}
                      onClick={() => void handleStatusUpdate(order, 'Cancelled')}
                      style={{ borderColor: colors.border.faint, color: colors.status.error, backgroundColor: `${colors.bg.elevated}CC` }}
                    >
                      {renderIcon('close')}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3.5 sm:mt-4 grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr] gap-2.5 sm:gap-3 text-xs">
                    <div>
                      <p className="uppercase text-[10px] mb-1" style={{ color: colors.text.muted }}>Delivery Address</p>
                      <p style={{ color: colors.text.secondary }}>{shippingSummary(order.shippingAddress)}</p>
                      <p className="mt-1" style={{ color: colors.text.secondary }}>{contactSummary(order.shippingAddress)}</p>
                    </div>
                    <div>
                      <p className="uppercase text-[10px] mb-1" style={{ color: colors.text.muted }}>Order Specification</p>
                      {(order.items || []).slice(0, 3).map((item, itemIdx) => (
                        <p key={`${order.id}-spec-${itemIdx}`} style={{ color: colors.text.secondary }}>
                          Variant: {item.name || item.sku || 'Item'} • Qty {item.quantity}
                        </p>
                      ))}
                    </div>
                    <div className="rounded-xl border p-3" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                      <p className="uppercase text-[10px]" style={{ color: colors.text.muted }}>Payment Details</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between" style={{ color: colors.text.secondary }}>
                          <span>Base Price</span>
                          <span>{formatPayout(Number(order.total || 0) + 300)}</span>
                        </div>
                        <div className="flex items-center justify-between" style={{ color: colors.text.secondary }}>
                          <span>Voucher</span>
                          <span>-₱300</span>
                        </div>
                        <div className="flex items-center justify-between" style={{ color: colors.text.secondary }}>
                          <span>Shipping</span>
                          <span>₱0</span>
                        </div>
                        <div className="mt-2 pt-2 border-t flex items-center justify-between font-bold" style={{ color: colors.accent.yellow, borderColor: colors.border.faint }}>
                          <span>Total Amount</span>
                          <span>{formatPayout(Number(order.total || 0))}</span>
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
        <section className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {pagedOrders.map((order, idx) => {
            const badge = rowBadge(String(order.status || 'Pending'), colors);
            return (
              <article
                key={order.id}
                className="rounded-2xl border p-3 sm:p-3.5"
                style={{
                  borderColor: colors.border.faint,
                  background: 'linear-gradient(90deg, #110248 0%, #090029 100%)',
                }}
              >
                <div className="relative overflow-hidden rounded-xl border" style={{ borderColor: colors.border.faint }}>
                  <img
                    src={THUMBNAILS[idx % THUMBNAILS.length]}
                    alt="Order card preview"
                    className="h-28 sm:h-32 w-full object-cover"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>

                <div className="mt-2.5 sm:mt-3 space-y-1">
                  <p className="text-[10px] font-semibold" style={{ color: colors.accent.yellow }}>{orderNumber(order)}</p>
                  <p className="text-[13px] sm:text-sm font-semibold" style={{ color: colors.text.primary }}>{order.items?.[0]?.name || 'Product Name 0001'}</p>
                  <div className="flex items-center justify-between text-[11px] sm:text-xs" style={{ color: colors.text.secondary }}>
                    <span className="truncate pr-2">{contactSummary(order.shippingAddress).split(' • ')[0] || 'John David'}</span>
                    <span className="font-bold" style={{ color: colors.accent.yellow }}>{formatPayout(Number(order.total || 0))}</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className={`${actionButtonClass} w-full`}
                    title="Inspect"
                    style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: `${colors.bg.elevated}CC` }}
                  >
                    {renderIcon('eye')}
                  </button>
                  <button
                    type="button"
                    className={`${actionButtonClass} w-full`}
                    title="Mark in transit"
                    disabled={updatingId === order.id}
                    onClick={() => void handleStatusUpdate(order, 'Shipped')}
                    style={{ borderColor: colors.border.faint, color: colors.text.primary, backgroundColor: `${colors.bg.elevated}CC` }}
                  >
                    {renderIcon('check')}
                  </button>
                  <button
                    type="button"
                    className={`${actionButtonClass} w-full`}
                    title="Cancel"
                    disabled={updatingId === order.id}
                    onClick={() => void handleStatusUpdate(order, 'Cancelled')}
                    style={{ borderColor: colors.border.faint, color: colors.status.error, backgroundColor: `${colors.bg.elevated}CC` }}
                  >
                    {renderIcon('close')}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

