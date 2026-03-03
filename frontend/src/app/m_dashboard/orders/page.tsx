'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { listMyOrders, updateOrderStatus, type ApiOrder } from '@/lib/api';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Returned'] as const;

const STATUS_COLOR: Record<string, string> = {
  Pending: '#f59e0b',
  Processing: '#3b82f6',
  Paid: '#10b981',
  Shipped: '#8b5cf6',
  Delivered: '#16a34a',
  Cancelled: '#ef4444',
  Returned: '#f97316',
};

function orderNumber(order: ApiOrder): string {
  return `ORD-${order.id.slice(-8).toUpperCase()}`;
}

function statusColor(status: string): string {
  return STATUS_COLOR[status] || '#6b7280';
}

export default function OrdersPage() {
  const { colors } = useTheme();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    return orders.filter((o) => {
      const num = orderNumber(o).toLowerCase();
      const itemText = (o.items || [])
        .map((i) => `${i.name || ''} ${i.sku || ''}`)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || num.includes(query) || itemText.includes(query);
      const matchesStatus = statusFilter === 'All' || String(o.status || '') === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => String(o.status) === 'Paid').length;
    const shippedOrders = orders.filter((o) => String(o.status) === 'Shipped').length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { totalOrders, paidOrders, shippedOrders, totalRevenue };
  }, [orders]);

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

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.card }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text.primary }}>
              Orders
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
              Manage your orders and update fulfillment status.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="px-3 py-2 rounded-lg border text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{ borderColor: colors.border.default, color: colors.text.primary }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: colors.border.default, backgroundColor: colors.bg.card, color: colors.text.primary }}
            >
              <option value="All">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.totalOrders },
          { label: 'Paid Orders', value: stats.paidOrders },
          { label: 'Shipped Orders', value: stats.shippedOrders },
          { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}` },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="rounded-xl border p-4"
            style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.card }}
          >
            <p className="text-xs uppercase tracking-wider" style={{ color: colors.text.muted }}>
              {card.label}
            </p>
            <p className="text-2xl font-semibold mt-1" style={{ color: colors.text.primary }}>
              {card.value}
            </p>
          </motion.div>
        ))}
      </section>

      <section className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.card }}>
        <div
          className="grid grid-cols-[140px_1fr_120px_120px_170px] gap-3 px-4 py-3 border-b text-xs font-semibold uppercase tracking-wider"
          style={{ borderColor: colors.border.faint, color: colors.text.muted, backgroundColor: colors.bg.elevated }}
        >
          <span>Order</span>
          <span>Items</span>
          <span>Total</span>
          <span>Status</span>
          <span className="text-right">Update</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: colors.text.muted }}>
            Loading orders...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm" style={{ color: '#ef4444' }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: colors.text.muted }}>
            No orders found.
          </div>
        ) : (
          filtered.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[140px_1fr_120px_120px_170px] gap-3 px-4 py-3 border-b items-center text-sm"
              style={{ borderColor: colors.border.faint }}
            >
              <div>
                <div className="font-semibold" style={{ color: colors.text.primary }}>
                  {orderNumber(order)}
                </div>
                <div className="text-xs" style={{ color: colors.text.muted }}>
                  {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                </div>
              </div>
              <div style={{ color: colors.text.secondary }}>
                {(order.items || []).slice(0, 2).map((item, idx) => (
                  <div key={`${order.id}-${idx}`}>
                    {item.quantity}x {item.name || item.sku || 'Item'}
                  </div>
                ))}
                {(order.items || []).length > 2 ? (
                  <div className="text-xs" style={{ color: colors.text.muted }}>
                    +{(order.items || []).length - 2} more
                  </div>
                ) : null}
              </div>
              <div className="font-medium" style={{ color: colors.text.primary }}>
                ${Number(order.total || 0).toFixed(2)}
              </div>
              <div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs text-white"
                  style={{ backgroundColor: statusColor(String(order.status || '')) }}
                >
                  {order.status}
                </span>
              </div>
              <div className="text-right">
                <select
                  value={String(order.status || 'Pending')}
                  onChange={(e) => void handleStatusUpdate(order, e.target.value)}
                  disabled={updatingId === order.id}
                  className="px-2 py-1.5 rounded-lg border text-xs"
                  style={{
                    borderColor: colors.border.default,
                    backgroundColor: colors.bg.card,
                    color: colors.text.primary,
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

