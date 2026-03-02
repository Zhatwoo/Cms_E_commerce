'use client';
import React, { useState } from 'react';
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
} from 'lucide-react';
import { useTheme } from '../components/context/theme-context';

type StockStatus = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';

const STAT_CARDS = [
  { id: 'total', label: 'Total Products', icon: Package, valueKey: 'total' as const },
  { id: 'low', label: 'Low Stock', icon: AlertTriangle, valueKey: 'lowStock' as const },
  { id: 'out', label: 'Out of Stock', icon: ArrowDownUp, valueKey: 'outOfStock' as const },
  { id: 'value', label: 'Stock Value', icon: TrendingUp, valueKey: 'stockValue' as const },
];

export default function InventoryPage() {
  const { colors, theme } = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus>('all');

  const stats = { total: 0, lowStock: 0, outOfStock: 0, stockValue: '$0.00' };

  const formatStat = (value: string | number) => (typeof value === 'number' ? String(value) : value);

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-90"
            style={{ borderColor: colors.border.default, color: colors.text.primary, backgroundColor: colors.bg.elevated }}
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-90"
            style={{ borderColor: colors.border.default, color: colors.text.primary, backgroundColor: colors.bg.elevated }}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
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
                {formatStat(stats[card.valueKey])}
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

        {/* Empty State */}
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
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Your First Product
          </button>
        </div>
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
            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:opacity-90"
            style={{ borderColor: colors.border.default, color: colors.text.secondary }}
          >
            View All
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <ArrowDownUp className="w-8 h-8" style={{ color: colors.text.muted }} />
          <p className="text-sm" style={{ color: colors.text.muted }}>
            No stock movements recorded yet.
          </p>
        </div>
      </div>
    </div>
  );
}
