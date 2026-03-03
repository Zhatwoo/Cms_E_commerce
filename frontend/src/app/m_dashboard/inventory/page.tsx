'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  importInventoryCsv,
  listInventory,
  listInventoryMovements,
  type ApiProduct,
  type ImportInventoryRow,
  type InventoryMovement,
  type InventorySummary,
} from '@/lib/api';
import { useRouter } from 'next/navigation';

const EXPORT_COLUMNS = ['name', 'sku', 'category', 'onHandStock', 'reservedStock', 'lowStockThreshold', 'status'] as const;

function escapeCsvValue(val: string | number | undefined | null): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function productsToCsv(items: ApiProduct[]): string {
  const header = EXPORT_COLUMNS.join(',');
  const rows = items.map((p) => {
    const onHand = p.onHandStock ?? p.stock ?? 0;
    const reserved = p.reservedStock ?? 0;
    const low = p.lowStockThreshold ?? 5;
    return [
      escapeCsvValue(p.name),
      escapeCsvValue(p.sku),
      escapeCsvValue(p.category),
      escapeCsvValue(onHand),
      escapeCsvValue(reserved),
      escapeCsvValue(low),
      escapeCsvValue(p.status),
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

function parseCsvToRows(text: string): ImportInventoryRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headerCols = parseCsvLine(lines[0]).map((c) => c.trim().toLowerCase().replace(/_/g, ''));
  const skuIdx = headerCols.findIndex((c) => c === 'sku');
  const onHandIdx = headerCols.findIndex((c) =>
    ['onhandstock', 'stock'].includes(c)
  );
  const reservedIdx = headerCols.findIndex((c) =>
    ['reservedstock', 'reserved'].includes(c)
  );
  const lowIdx = headerCols.findIndex((c) =>
    ['lowstockthreshold', 'lowthreshold'].includes(c)
  );

  const rows: ImportInventoryRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const sku = skuIdx >= 0 ? (cols[skuIdx] ?? '').trim() : '';
    if (!sku) continue;

    const row: ImportInventoryRow = { sku };
    if (onHandIdx >= 0) {
      const v = parseInt(String(cols[onHandIdx] ?? '0'), 10);
      if (Number.isFinite(v)) row.onHandStock = Math.max(0, v);
    }
    if (reservedIdx >= 0) {
      const v = parseInt(String(cols[reservedIdx] ?? '0'), 10);
      if (Number.isFinite(v)) row.reservedStock = Math.max(0, v);
    }
    if (lowIdx >= 0) {
      const v = parseInt(String(cols[lowIdx] ?? '5'), 10);
      if (Number.isFinite(v)) row.lowStockThreshold = Math.max(0, v);
    }
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let cell = '';
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            cell += '"';
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          cell += line[i];
          i++;
        }
      }
      result.push(cell);
    } else {
      let cell = '';
      while (i < line.length && line[i] !== ',') {
        cell += line[i];
        i++;
      }
      result.push(cell.trim());
      if (line[i] === ',') i++;
    }
  }
  return result;
}

type StockStatus = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type StockAdjustmentType = 'IN' | 'OUT';

type StockAdjustmentModalState = {
  open: boolean;
  product: ApiProduct | null;
  movementType: StockAdjustmentType;
  quantity: string;
  notes: string;
  error: string | null;
};

const getDefaultAdjustmentNote = (movementType: StockAdjustmentType) =>
  movementType === 'IN' ? 'Manual stock-in from inventory page' : 'Manual stock-out from inventory page';

const STAT_CARDS = [
  { id: 'total', label: 'Total Products', icon: Package, valueKey: 'total' as const },
  { id: 'low', label: 'Low Stock', icon: AlertTriangle, valueKey: 'lowStock' as const },
  { id: 'out', label: 'Out of Stock', icon: ArrowDownUp, valueKey: 'outOfStock' as const },
  { id: 'value', label: 'Stock Value', icon: TrendingUp, valueKey: 'stockValue' as const },
];
const RECENT_MOVEMENTS_LIMIT = 5;
const ALL_MOVEMENTS_LIMIT = 500;

export default function InventoryPage() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus>('all');
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [allMovements, setAllMovements] = useState<InventoryMovement[]>([]);
  const [showAllMovementsModal, setShowAllMovementsModal] = useState(false);
  const [loadingAllMovements, setLoadingAllMovements] = useState(false);
  const [allMovementsError, setAllMovementsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [stockModal, setStockModal] = useState<StockAdjustmentModalState>({
    open: false,
    product: null,
    movementType: 'IN',
    quantity: '1',
    notes: getDefaultAdjustmentNote('IN'),
    error: null,
  });
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatStat = (value: string | number) => (typeof value === 'number' ? String(value) : value);
  const stockValueLabel = useMemo(() => `$${(summary?.stockValue || 0).toLocaleString()}`, [summary?.stockValue]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, summaryRes, movementRes] = await Promise.all([
        listInventory({ limit: 500, search: search || undefined }),
        getInventorySummary({ search: search || undefined }),
        listInventoryMovements({ limit: RECENT_MOVEMENTS_LIMIT }),
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

  const loadAllMovements = useCallback(async () => {
    setLoadingAllMovements(true);
    setAllMovementsError(null);
    try {
      const res = await listInventoryMovements({ limit: ALL_MOVEMENTS_LIMIT });
      setAllMovements(Array.isArray(res.items) ? res.items : []);
    } catch (err) {
      setAllMovementsError(err instanceof Error ? err.message : 'Failed to load movement history');
    } finally {
      setLoadingAllMovements(false);
    }
  }, []);

  const openAllMovementsModal = useCallback(() => {
    setShowAllMovementsModal(true);
    void loadAllMovements();
  }, [loadAllMovements]);

  const closeAllMovementsModal = useCallback(() => {
    setShowAllMovementsModal(false);
  }, []);

  useEffect(() => {
    if (!showAllMovementsModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAllMovementsModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAllMovementsModal, closeAllMovementsModal]);

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
        (statusFilter === 'low-stock' && onHand > 0 && onHand < lowThreshold) ||
        (statusFilter === 'in-stock' && onHand >= lowThreshold);

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter, getStockNumbers]);

  const openStockModal = useCallback((product: ApiProduct, movementType: StockAdjustmentType) => {
    setStockModal({
      open: true,
      product,
      movementType,
      quantity: '1',
      notes: getDefaultAdjustmentNote(movementType),
      error: null,
    });
  }, []);

  const closeStockModal = useCallback(() => {
    if (adjustingId) return;
    setStockModal((prev) => ({ ...prev, open: false, product: null, error: null }));
  }, [adjustingId]);

  useEffect(() => {
    if (!stockModal.open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeStockModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stockModal.open, closeStockModal]);

  const submitStockAdjustment = useCallback(async () => {
    if (!stockModal.product) return;
    const qty = parseInt(stockModal.quantity, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      setStockModal((prev) => ({ ...prev, error: 'Please enter a valid quantity greater than zero.' }));
      return;
    }

    const { onHand } = getStockNumbers(stockModal.product);
    if (stockModal.movementType === 'OUT' && qty > onHand) {
      setStockModal((prev) => ({ ...prev, error: `Cannot deduct ${qty}. Current stock is ${onHand}.` }));
      return;
    }

    try {
      setAdjustingId(stockModal.product.id);
      setStockModal((prev) => ({ ...prev, error: null }));
      await adjustInventoryStock({
        productId: stockModal.product.id,
        movementType: stockModal.movementType,
        quantity: qty,
        notes: stockModal.notes.trim() || getDefaultAdjustmentNote(stockModal.movementType),
      });
      await loadData();
      if (showAllMovementsModal) {
        await loadAllMovements();
      }
      setStockModal((prev) => ({ ...prev, open: false, product: null, error: null }));
    } catch (err) {
      setStockModal((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to adjust stock',
      }));
    } finally {
      setAdjustingId(null);
    }
  }, [stockModal, getStockNumbers, loadData, showAllMovementsModal, loadAllMovements]);

  const isAdjustingFromModal = Boolean(stockModal.product && adjustingId === stockModal.product.id);
  const modalOnHand = stockModal.product ? getStockNumbers(stockModal.product).onHand : 0;

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await listInventory({ limit: 5000, search: search || undefined });
      const data = Array.isArray(res.items) ? res.items : [];
      if (data.length === 0) {
        window.alert('No inventory to export.');
        return;
      }
      const csv = productsToCsv(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [search]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      setImporting(true);
      try {
        const text = await file.text();
        const rows = parseCsvToRows(text);
        if (rows.length === 0) {
          window.alert(
            'No valid rows in CSV. Ensure file has a header with "sku" and optionally "onHandStock", "reservedStock", "lowStockThreshold".'
          );
          return;
        }

        const result = await importInventoryCsv({ rows });

        if (result.updated && result.updated > 0) {
          await loadData();
        }

        const msg =
          result.errors && result.errors.length > 0
            ? `${result.message}\n\nErrors: ${result.errors
                .slice(0, 5)
                .map((e) => `Row ${e.row} (${e.sku}): ${e.message}`)
                .join('; ')}${result.errors.length > 5 ? ` ... and ${result.errors.length - 5} more` : ''}`
            : result.message ?? `Updated ${result.updated ?? 0} product(s).`;
        window.alert(msg);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Import failed');
      } finally {
        setImporting(false);
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ borderColor: colors.border.default, color: colors.text.primary, backgroundColor: colors.bg.elevated }}
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ borderColor: colors.border.default, color: colors.text.primary, backgroundColor: colors.bg.elevated }}
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export'}
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
          const labelColor = card.id === 'low'
            ? '#f97316'
            : card.id === 'out'
              ? '#ef4444'
              : card.id === 'value'
                ? '#16a34a'
                : colors.text.muted;
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
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: labelColor }}>
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
              const statusLabel = onHand <= 0 ? 'Out of stock' : onHand < lowThreshold ? 'Low stock' : 'In stock';
              const statusColor = onHand <= 0 ? '#ef4444' : onHand < lowThreshold ? '#f97316' : '#16a34a';
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
                      onClick={() => openStockModal(product, 'IN')}
                      disabled={adjustingId === product.id}
                      className="p-1.5 rounded border"
                      style={{ borderColor: colors.border.default, color: colors.text.secondary }}
                      title="Add stock"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openStockModal(product, 'OUT')}
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
            onClick={openAllMovementsModal}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:opacity-90"
            style={{ borderColor: colors.border.default, color: colors.text.secondary }}
          >
            See All
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
            {movements.map((m) => {
              const isIn = String(m.type || '').toUpperCase() === 'IN';
              const isOut = String(m.type || '').toUpperCase() === 'OUT';
              const typeColor = isIn ? '#16a34a' : isOut ? '#ef4444' : colors.text.primary;
              const quantityColor = m.quantity > 0 ? '#16a34a' : m.quantity < 0 ? '#ef4444' : colors.text.primary;

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                  style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}
                >
                  <div>
                    <div style={{ color: colors.text.primary }}>
                      {m.productName || 'Product'} - <span style={{ color: typeColor }}>{m.type}</span>
                    </div>
                    <div style={{ color: colors.text.muted }}>
                      {m.notes || 'Inventory movement'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ color: quantityColor }}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</div>
                    <div style={{ color: colors.text.muted }}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAllMovementsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={closeAllMovementsModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-2xl border overflow-hidden"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.default }}
            >
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.border.faint }}>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                    All Stock Movements
                  </h3>
                  <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                    Complete movement history (latest first)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAllMovementsModal}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: colors.text.muted }}
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-5">
                {loadingAllMovements ? (
                  <div className="py-8 text-center text-sm" style={{ color: colors.text.muted }}>
                    Loading movement history...
                  </div>
                ) : allMovementsError ? (
                  <div className="py-8 text-center text-sm" style={{ color: '#ef4444' }}>
                    {allMovementsError}
                  </div>
                ) : allMovements.length === 0 ? (
                  <div className="py-8 text-center text-sm" style={{ color: colors.text.muted }}>
                    No stock movements recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allMovements.map((m) => {
                      const isIn = String(m.type || '').toUpperCase() === 'IN';
                      const isOut = String(m.type || '').toUpperCase() === 'OUT';
                      const typeColor = isIn ? '#16a34a' : isOut ? '#ef4444' : colors.text.primary;
                      const quantityColor = m.quantity > 0 ? '#16a34a' : m.quantity < 0 ? '#ef4444' : colors.text.primary;

                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                          style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}
                        >
                          <div>
                            <div style={{ color: colors.text.primary }}>
                              {m.productName || 'Product'} - <span style={{ color: typeColor }}>{m.type}</span>
                            </div>
                            <div style={{ color: colors.text.muted }}>
                              {m.notes || 'Inventory movement'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div style={{ color: quantityColor }}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</div>
                            <div style={{ color: colors.text.muted }}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {stockModal.open && stockModal.product && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={closeStockModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border overflow-hidden"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.default }}
            >
              <div className="px-6 py-5 border-b" style={{ borderColor: colors.border.faint }}>
                <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                  {stockModal.movementType === 'IN' ? 'Add stock' : 'Deduct stock'} for {stockModal.product.name}
                </h3>
                <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                  Current on-hand stock: {modalOnHand}
                </p>
              </div>

              <form
                className="px-6 py-5 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitStockAdjustment();
                }}
              >
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.text.muted }}>
                    Quantity
                  </label>
                  <input
                    autoFocus
                    type="number"
                    min={1}
                    step={1}
                    value={stockModal.quantity}
                    onChange={(e) =>
                      setStockModal((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                        error: null,
                      }))
                    }
                    className="w-full rounded-lg border px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    style={{ borderColor: colors.border.default, color: colors.text.primary }}
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.text.muted }}>
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={stockModal.notes}
                    onChange={(e) =>
                      setStockModal((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                    style={{ borderColor: colors.border.default, color: colors.text.primary }}
                    placeholder="Reason for this adjustment"
                  />
                </div>

                {stockModal.error && (
                  <p className="text-sm" style={{ color: '#ef4444' }}>
                    {stockModal.error}
                  </p>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeStockModal}
                    disabled={isAdjustingFromModal}
                    className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-90 disabled:opacity-60"
                    style={{ borderColor: colors.border.default, color: colors.text.secondary }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdjustingFromModal}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isAdjustingFromModal
                      ? 'Saving...'
                      : stockModal.movementType === 'IN'
                        ? 'Add Stock'
                        : 'Deduct Stock'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

