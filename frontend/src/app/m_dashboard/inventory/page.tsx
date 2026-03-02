'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowDownUp,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Minus,
} from 'lucide-react';
import { useTheme } from '../components/context/theme-context';
import {
  adjustInventoryStock,
  getInventorySummary,
  listInventory,
  listInventoryMovements,
  type ApiProduct,
  type InventoryMovement,
  type InventorySummary,
} from '@/lib/api';
import { useRouter } from 'next/navigation';

type StockStatus = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';

const STAT_CARDS = [
  { id: 'total', label: 'Total Products', icon: Package, valueKey: 'total' as const },
  { id: 'low', label: 'Low Stock', icon: AlertTriangle, valueKey: 'lowStock' as const },
  { id: 'out', label: 'Out of Stock', icon: ArrowDownUp, valueKey: 'outOfStock' as const },
  { id: 'value', label: 'Stock Value', icon: TrendingUp, valueKey: 'stockValue' as const },
];

export default function InventoryPage() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus>('all');
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const formatStat = (value: string | number) => (typeof value === 'number' ? String(value) : value);
  const stockValueLabel = useMemo(() => `$${(summary?.stockValue || 0).toLocaleString()}`, [summary?.stockValue]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, summaryRes, movementRes] = await Promise.all([
        listInventory({ limit: 500, search: search || undefined }),
        getInventorySummary({ search: search || undefined }),
        listInventoryMovements({ limit: 12 }),
      ]);

      const inventoryItems = Array.isArray(invRes.items) ? invRes.items : [];
      setItems(inventoryItems);
      setSummary(summaryRes.data || null);
      setMovements(Array.isArray(movementRes.items) ? movementRes.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStockNumbers = useCallback((p: ApiProduct) => {
    const onHand = Number(p.onHandStock ?? p.stock ?? 0);
    const reserved = Number(p.reservedStock ?? 0);
    const available = Number(p.availableStock ?? Math.max(0, onHand - reserved));
    const lowThreshold = Number(p.lowStockThreshold ?? 5);
    return { onHand, reserved, available, lowThreshold };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      const sku = String(p.sku || '').toLowerCase();
      const category = String(p.category || '').toLowerCase();
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || name.includes(q) || sku.includes(q) || category.includes(q);

      const { onHand, lowThreshold } = getStockNumbers(p);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'out-of-stock' && onHand <= 0) ||
        (statusFilter === 'low-stock' && onHand > 0 && onHand <= lowThreshold) ||
        (statusFilter === 'in-stock' && onHand > lowThreshold);

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter, getStockNumbers]);

  const handleAdjust = useCallback(
    async (product: ApiProduct, movementType: 'IN' | 'OUT') => {
      const qtyText = window.prompt(
        `${movementType === 'IN' ? 'Add' : 'Deduct'} stock for ${product.name}\nEnter quantity:`,
        '1'
      );
      if (!qtyText) return;
      const qty = parseInt(qtyText, 10);
      if (!Number.isFinite(qty) || qty <= 0) {
        window.alert('Please enter a valid quantity.');
        return;
      }

      try {
        setAdjustingId(product.id);
        await adjustInventoryStock({
          productId: product.id,
          movementType,
          quantity: qty,
          notes: movementType === 'IN' ? 'Manual stock-in from inventory page' : 'Manual stock-out from inventory page',
        });
        await loadData();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Failed to adjust stock');
      } finally {
        setAdjustingId(null);
      }
    },
    [loadData]
  );

  return (
    <div className="space-y-6 md:space-y-8 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: colors.text.primary }}>
            Inventory Management
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            Track stock levels, movements, and alerts across your catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.alert('CSV import endpoint is not yet wired in this build.')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-90"
            style={{ borderColor: colors.border.default, color: colors.text.primary, backgroundColor: colors.bg.elevated }}
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            type="button"
            onClick={() => window.alert('CSV export endpoint is not yet wired in this build.')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-90"
            style={{ borderColor: colors.border.default, color: colors.text.primary, backgroundColor: colors.bg.elevated }}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => router.push('/m_dashboard/products')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-xl border p-5 flex flex-col gap-2"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>
                  {card.label}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.bg.elevated }}
                >
                  <Icon className="w-4 h-4" style={{ color: colors.text.muted }} />
                </div>
              </div>
              <span className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                {formatStat(
                  card.valueKey === 'total'
                    ? summary?.totalProducts ?? 0
                    : card.valueKey === 'lowStock'
                      ? summary?.lowStock ?? 0
                      : card.valueKey === 'outOfStock'
                        ? summary?.outOfStock ?? 0
                        : stockValueLabel
                )}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border p-4"
        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            style={{ borderColor: colors.border.default, color: colors.text.primary }}
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'in-stock', 'low-stock', 'out-of-stock'] as StockStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize"
              style={{
                borderColor: statusFilter === status ? 'transparent' : colors.border.default,
                backgroundColor: statusFilter === status ? (theme === 'dark' ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)') : 'transparent',
                color: statusFilter === status ? colors.status.info : colors.text.secondary,
              }}
            >
              {status === 'all' ? 'All' : status.replace('-', ' ')}
            </button>
          ))}
          <button
            type="button"
            onClick={() => window.alert('Additional filters can be added here (warehouse, category, date).')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{ borderColor: colors.border.default, color: colors.text.secondary }}
          >
            <Filter className="w-3.5 h-3.5" />
            More Filters
          </button>
        </div>
      </div>

      {/* Inventory Table Placeholder */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
      >
        {/* Table Header */}
        <div
          className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
          style={{ color: colors.text.muted, borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}
        >
          <span>Product</span>
          <span>SKU</span>
          <span>Stock</span>
          <span>Reserved</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm" style={{ color: colors.text.muted }}>
            Loading inventory...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm" style={{ color: '#ef4444' }}>
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.bg.elevated }}
            >
              <Package className="w-8 h-8" style={{ color: colors.text.muted }} />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold" style={{ color: colors.text.primary }}>
                No inventory items yet
              </p>
              <p className="text-sm mt-1 max-w-sm" style={{ color: colors.text.muted }}>
                Add your first product or import a CSV to start tracking stock levels, movements, and alerts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/m_dashboard/products')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.border.faint }}>
            {filteredItems.map((product) => {
              const { onHand, reserved, lowThreshold } = getStockNumbers(product);
              const statusLabel = onHand <= 0 ? 'Out of stock' : onHand <= lowThreshold ? 'Low stock' : 'In stock';
              const statusColor = onHand <= 0 ? '#ef4444' : onHand <= lowThreshold ? '#f59e0b' : '#10b981';
              return (
                <div
                  key={product.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-3 items-center text-sm"
                >
                  <span className="font-medium" style={{ color: colors.text.primary }}>
                    {product.name || 'Untitled Product'}
                  </span>
                  <span style={{ color: colors.text.secondary }}>{product.sku || '—'}</span>
                  <span style={{ color: colors.text.primary }}>{onHand}</span>
                  <span style={{ color: colors.text.secondary }}>{reserved}</span>
                  <span style={{ color: statusColor }}>{statusLabel}</span>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleAdjust(product, 'IN')}
                      disabled={adjustingId === product.id}
                      className="p-1.5 rounded border"
                      style={{ borderColor: colors.border.default, color: colors.text.secondary }}
                      title="Add stock"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjust(product, 'OUT')}
                      disabled={adjustingId === product.id}
                      className="p-1.5 rounded border"
                      style={{ borderColor: colors.border.default, color: colors.text.secondary }}
                      title="Deduct stock"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stock Movements Section */}
      <div
        className="rounded-xl border p-5"
        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              Recent Stock Movements
            </h2>
            <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>
              Audit trail of all inventory changes.
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:opacity-90"
            style={{ borderColor: colors.border.default, color: colors.text.secondary }}
          >
            View All
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm" style={{ color: colors.text.muted }}>
            Loading movement feed...
          </div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <ArrowDownUp className="w-8 h-8" style={{ color: colors.text.muted }} />
            <p className="text-sm" style={{ color: colors.text.muted }}>
              No stock movements recorded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {movements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}
              >
                <div>
                  <div style={{ color: colors.text.primary }}>
                    {m.productName || 'Product'} · {m.type}
                  </div>
                  <div style={{ color: colors.text.muted }}>
                    {m.notes || 'Inventory movement'}
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ color: colors.text.primary }}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</div>
                  <div style={{ color: colors.text.muted }}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
