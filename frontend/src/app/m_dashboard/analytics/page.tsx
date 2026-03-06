'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../components/context/theme-context';
import { useProject } from '../components/context/project-context';
import {
  getInventorySummary,
  listMyOrders,
  listProducts,
  type ApiOrder,
  type ApiProduct,
  type InventorySummary,
} from '@/lib/api';
import { AreaChart } from '../components/analytics/AreaChart';

type PeriodKey = '7D' | '30D' | '90D' | '180D';

const PERIOD_DAYS: Record<PeriodKey, number> = {
  '7D': 7,
  '30D': 30,
  '90D': 90,
  '180D': 180,
};

const SECTION_TABS = ['OVERVIEW', 'SALES TREND', 'PURCHASE SUCCESS', 'CATEGORY SALES', 'SALES HISTORY'] as const;
type SectionTab = (typeof SECTION_TABS)[number];

function formatPeso(value: number) {
  return `₱${Number(value || 0).toLocaleString()}`;
}

function formatOrderId(id: string) {
  return `#${id.slice(-8).toUpperCase()}`;
}

function toBuyerName(order: ApiOrder) {
  const address = order.shippingAddress;
  if (!address || typeof address !== 'object') return 'Unknown Buyer';
  const source = address as Record<string, unknown>;
  const fullName = typeof source.fullName === 'string' ? source.fullName.trim() : '';
  const name = typeof source.name === 'string' ? source.name.trim() : '';
  return fullName || name || 'Unknown Buyer';
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toMonthLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'short' });
}

function toTitleCase(label: string) {
  return label
    .toLowerCase()
    .split(' ')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

function normalizeCategory(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || raw === '-' || raw === '—') return 'Uncategorized';
  return raw;
}

function toInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function statusPill(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'delivered' || normalized === 'paid') {
    return { label: 'Successful', bg: '#16a34a22', color: '#22c55e' };
  }
  if (normalized === 'pending' || normalized === 'processing') {
    return { label: 'Pending', bg: '#f59e0b22', color: '#fbbf24' };
  }
  if (normalized === 'shipped') {
    return { label: 'In Transit', bg: '#3b82f622', color: '#60a5fa' };
  }
  return { label: status || 'Unknown', bg: '#64748b22', color: '#94a3b8' };
}

function isSuccessfulStatus(status: string) {
  const normalized = status.toLowerCase();
  return normalized === 'paid' || normalized === 'shipped' || normalized === 'delivered';
}

function isFailedStatus(status: string) {
  const normalized = status.toLowerCase();
  return normalized === 'cancelled' || normalized === 'returned';
}

function percentDelta(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function buildLinePath(values: number[], width: number, height: number, padX: number, padY: number, maxValue: number) {
  if (!values.length) return '';
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const safeMax = Math.max(maxValue, 1);
  const points = values.map((value, idx) => {
    const x = padX + (idx / Math.max(values.length - 1, 1)) * chartW;
    const y = height - padY - (value / safeMax) * chartH;
    return { x, y };
  });

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function AnalyticsPage() {
  const { colors } = useTheme();
  const { selectedProject } = useProject();

  const [period, setPeriod] = useState<PeriodKey>('30D');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>('OVERVIEW');

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const sectionTabRefs = useRef<Record<SectionTab, HTMLButtonElement | null>>({
    OVERVIEW: null,
    'SALES TREND': null,
    'PURCHASE SUCCESS': null,
    'CATEGORY SALES': null,
    'SALES HISTORY': null,
  });
  const [sectionIndicator, setSectionIndicator] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const orderPromise = listMyOrders({
          page: 1,
          limit: 500,
          projectId: selectedProject?.id,
        });

        const productPromise = listProducts({
          page: 1,
          limit: 500,
          subdomain: selectedProject?.subdomain || undefined,
        });

        const inventoryPromise = getInventorySummary({
          subdomain: selectedProject?.subdomain || undefined,
        }).catch(() => ({ success: false as const, data: null }));

        const [ordersRes, productsRes, inventoryRes] = await Promise.all([
          orderPromise,
          productPromise,
          inventoryPromise,
        ]);

        if (cancelled) return;

        setOrders(Array.isArray(ordersRes.items) ? ordersRes.items : []);
        setProducts(Array.isArray(productsRes.items) ? productsRes.items : []);
        setInventorySummary(inventoryRes && 'data' in inventoryRes ? inventoryRes.data : null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load analytics');
          setOrders([]);
          setProducts([]);
          setInventorySummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedProject?.id, selectedProject?.subdomain]);

  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const maxAgeMs = PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;

    return orders.filter((order) => {
      if (!order.createdAt) return false;
      const timestamp = new Date(order.createdAt).getTime();
      if (Number.isNaN(timestamp)) return false;
      const withinWindow = now - timestamp <= maxAgeMs;
      if (!withinWindow) return false;
      if (!search.trim()) return true;

      const q = search.trim().toLowerCase();
      const buyer = toBuyerName(order).toLowerCase();
      const status = String(order.status || '').toLowerCase();
      const id = formatOrderId(order.id).toLowerCase();
      return buyer.includes(q) || status.includes(q) || id.includes(q);
    });
  }, [orders, period, search]);

  const analytics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const completedOrders = filteredOrders.filter((order) => {
      const s = String(order.status || '').toLowerCase();
      return s === 'paid' || s === 'shipped' || s === 'delivered';
    }).length;

    const pendingOrders = filteredOrders.filter((order) => {
      const s = String(order.status || '').toLowerCase();
      return s === 'pending' || s === 'processing';
    }).length;

    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    const monthMap = new Map<string, number>();
    filteredOrders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = toMonthKey(date);
      monthMap.set(key, (monthMap.get(key) || 0) + Number(order.total || 0));
    });

    const revenueTrend = Array.from(monthMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-6)
      .map(([key, revenue]) => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, (month || 1) - 1, 1);
        return { month: toMonthLabel(date), revenue };
      });

    const topPerformanceMap = new Map<string, { name: string; units: number; revenue: number }>();
    filteredOrders.forEach((order) => {
      const buyer = toBuyerName(order);
      const existing = topPerformanceMap.get(buyer) || { name: buyer, units: 0, revenue: 0 };
      const units = Array.isArray(order.items)
        ? order.items.reduce((s, item) => s + Number(item.quantity || 0), 0)
        : 0;
      existing.units += units;
      existing.revenue += Number(order.total || 0);
      topPerformanceMap.set(buyer, existing);
    });

    const topPerformance = Array.from(topPerformanceMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const productCategoryById = new Map<string, string>();
    products.forEach((product) => {
      if (!product.id) return;
      const category = normalizeCategory(product.category);
      productCategoryById.set(product.id, category);
    });

    const categoryRevenue = new Map<string, number>();
    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const productId = item.productId || '';
        const category = productCategoryById.get(productId) || 'Uncategorized';
        const lineAmount = Number(item.price || 0) * Number(item.quantity || 0);
        categoryRevenue.set(category, (categoryRevenue.get(category) || 0) + lineAmount);
      });
    });

    const categoryRows = Array.from(categoryRevenue.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    const totalCategoryValue = categoryRows.reduce((s, row) => s + row.value, 0);
    const donutStops = categoryRows.length
      ? (() => {
          const palette = ['#AA62FF', '#15E4C3', '#FFCF25'];
          let start = 0;
          return categoryRows.map((row, idx) => {
            const pct = totalCategoryValue > 0 ? (row.value / totalCategoryValue) * 100 : 0;
            const stop = {
              color: palette[idx % palette.length],
              from: start,
              to: start + pct,
            };
            start += pct;
            return stop;
          });
        })()
      : [];

    const donutGradient = donutStops.length
      ? `conic-gradient(${donutStops
          .map((stop) => `${stop.color} ${stop.from}% ${stop.to}%`)
          .join(', ')})`
      : undefined;

    const recentTransactions = [...filteredOrders]
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 7);

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      completionRate,
      completedOrders,
      pendingOrders,
      revenueTrend,
      topPerformance,
      categoryRows,
      donutGradient,
      recentTransactions,
    };
  }, [filteredOrders, products]);

  const kpiCards = [
    { label: 'Revenue', value: formatPeso(analytics.totalRevenue) },
    { label: 'Net Profit', value: formatPeso(Math.max(0, analytics.totalRevenue * 0.32)) },
    { label: 'Orders', value: analytics.totalOrders.toLocaleString() },
    { label: 'Completion', value: `${analytics.completionRate.toFixed(1)}%` },
    { label: 'Avg. Value', value: formatPeso(analytics.avgOrderValue) },
  ];

  const salesTrendData = useMemo(() => {
    const dailyRevenueMap = new Map<string, { date: Date; revenue: number }>();

    filteredOrders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const existing = dailyRevenueMap.get(dayKey) || { date, revenue: 0 };
      existing.revenue += Number(order.total || 0);
      dailyRevenueMap.set(dayKey, existing);
    });

    const dailyRows = Array.from(dailyRevenueMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());

    const peakDays = [...dailyRows]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item) => ({
        dateLabel: item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        revenue: item.revenue,
      }));

    const slowDays = [...dailyRows]
      .filter((item) => item.revenue > 0)
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 5)
      .map((item) => ({
        dateLabel: item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        revenue: item.revenue,
      }));

    const monthlyGrowth = analytics.revenueTrend
      .slice(-3)
      .map((item) => ({
        label: item.month,
        value: item.revenue,
      }));

    const maxMonthlyValue = Math.max(...monthlyGrowth.map((row) => row.value), 1);

    const categoryPerformance = analytics.categoryRows.map((row) => ({
      label: row.category,
      value: row.value,
    }));
    const maxCategoryValue = Math.max(...categoryPerformance.map((row) => row.value), 1);

    return {
      peakDays,
      slowDays,
      monthlyGrowth,
      maxMonthlyValue,
      categoryPerformance,
      maxCategoryValue,
    };
  }, [analytics.revenueTrend, analytics.categoryRows, filteredOrders]);

  const purchaseSuccessData = useMemo(() => {
    const now = Date.now();
    const periodMs = PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;

    const matchesSearch = (order: ApiOrder) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const buyer = toBuyerName(order).toLowerCase();
      const status = String(order.status || '').toLowerCase();
      const id = formatOrderId(order.id).toLowerCase();
      return buyer.includes(q) || status.includes(q) || id.includes(q);
    };

    const currentOrders = orders.filter((order) => {
      if (!order.createdAt) return false;
      const t = new Date(order.createdAt).getTime();
      if (Number.isNaN(t)) return false;
      return now - t <= periodMs && matchesSearch(order);
    });

    const previousOrders = orders.filter((order) => {
      if (!order.createdAt) return false;
      const t = new Date(order.createdAt).getTime();
      if (Number.isNaN(t)) return false;
      const diff = now - t;
      return diff > periodMs && diff <= periodMs * 2 && matchesSearch(order);
    });

    const summarize = (source: ApiOrder[]) => {
      const total = source.length;
      const successful = source.filter((order) => isSuccessfulStatus(String(order.status || '')));
      const failed = source.filter((order) => isFailedStatus(String(order.status || '')));
      const cancelled = source.filter((order) => String(order.status || '').toLowerCase() === 'cancelled');
      const returned = source.filter((order) => String(order.status || '').toLowerCase() === 'returned');

      const successRevenue = successful.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const successRate = total > 0 ? (successful.length / total) * 100 : 0;
      const avgSuccessfulOrder = successful.length > 0 ? successRevenue / successful.length : 0;

      return {
        total,
        successfulCount: successful.length,
        failedCount: failed.length,
        cancelledCount: cancelled.length,
        returnedCount: returned.length,
        successRevenue,
        successRate,
        avgSuccessfulOrder,
      };
    };

    const current = summarize(currentOrders);
    const previous = summarize(previousOrders);

    const monthMap = new Map<string, number>();
    currentOrders
      .filter((order) => isSuccessfulStatus(String(order.status || '')))
      .forEach((order) => {
        if (!order.createdAt) return;
        const d = new Date(order.createdAt);
        if (Number.isNaN(d.getTime())) return;
        const key = toMonthKey(d);
        monthMap.set(key, (monthMap.get(key) || 0) + Number(order.total || 0));
      });

    const trend = Array.from(monthMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-6)
      .map(([key, revenue]) => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, (month || 1) - 1, 1);
        return { month: toMonthLabel(date), revenue };
      });

    return {
      ...current,
      trend,
      successRateDelta: percentDelta(current.successRate, previous.successRate),
      successRevenueDelta: percentDelta(current.successRevenue, previous.successRevenue),
      successOrdersDelta: percentDelta(current.successfulCount, previous.successfulCount),
      avgOrderDelta: percentDelta(current.avgSuccessfulOrder, previous.avgSuccessfulOrder),
    };
  }, [orders, period, search]);

  const categorySalesData = useMemo(() => {
    const now = Date.now();
    const periodMs = PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;

    const matchesSearch = (order: ApiOrder) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const buyer = toBuyerName(order).toLowerCase();
      const status = String(order.status || '').toLowerCase();
      const id = formatOrderId(order.id).toLowerCase();
      return buyer.includes(q) || status.includes(q) || id.includes(q);
    };

    const inCurrentWindow = (order: ApiOrder) => {
      if (!order.createdAt) return false;
      const t = new Date(order.createdAt).getTime();
      if (Number.isNaN(t)) return false;
      return now - t <= periodMs;
    };

    const inPreviousWindow = (order: ApiOrder) => {
      if (!order.createdAt) return false;
      const t = new Date(order.createdAt).getTime();
      if (Number.isNaN(t)) return false;
      const diff = now - t;
      return diff > periodMs && diff <= periodMs * 2;
    };

    const currentOrders = orders.filter((order) => inCurrentWindow(order) && matchesSearch(order));
    const previousOrders = orders.filter((order) => inPreviousWindow(order) && matchesSearch(order));

    const categoryByProductId = new Map<string, string>();
    const productNameById = new Map<string, string>();
    products.forEach((product) => {
      if (!product.id) return;
      categoryByProductId.set(product.id, normalizeCategory(product.category));
      productNameById.set(product.id, String(product.name || 'Unnamed Product'));
    });

    const summarizeByCategory = (source: ApiOrder[]) => {
      const map = new Map<string, { revenue: number; sales: number }>();
      source.forEach((order) => {
        (order.items || []).forEach((item) => {
          const category = categoryByProductId.get(item.productId || '') || 'Uncategorized';
          const qty = Number(item.quantity || 0);
          const lineRevenue = qty * Number(item.price || 0);
          const existing = map.get(category) || { revenue: 0, sales: 0 };
          existing.revenue += lineRevenue;
          existing.sales += qty;
          map.set(category, existing);
        });
      });
      return map;
    };

    const summarizeByProduct = (source: ApiOrder[]) => {
      const map = new Map<string, { name: string; revenue: number; sales: number }>();
      source.forEach((order) => {
        (order.items || []).forEach((item) => {
          const key = item.productId || item.name || 'unknown-product';
          const qty = Number(item.quantity || 0);
          const lineRevenue = qty * Number(item.price || 0);
          const displayName = productNameById.get(item.productId || '') || item.name || 'Unnamed Product';
          const existing = map.get(key) || { name: displayName, revenue: 0, sales: 0 };
          existing.revenue += lineRevenue;
          existing.sales += qty;
          map.set(key, existing);
        });
      });
      return map;
    };

    const currentCategoryMap = summarizeByCategory(currentOrders);
    const previousCategoryMap = summarizeByCategory(previousOrders);
    const currentProductMap = summarizeByProduct(currentOrders);
    const previousProductMap = summarizeByProduct(previousOrders);

    const categoryRows = Array.from(currentCategoryMap.entries())
      .map(([category, stats]) => {
        const prevRevenue = previousCategoryMap.get(category)?.revenue || 0;
return {
          category,
          revenue: stats.revenue,
          sales: stats.sales,
          growth: percentDelta(stats.revenue, prevRevenue),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const topCategories = categoryRows.slice(0, 6);

    const topSellingProducts = Array.from(currentProductMap.entries())
      .map(([key, stats]) => {
        const prevRevenue = previousProductMap.get(key)?.revenue || 0;
        return {
          product: stats.name,
          sales: stats.sales,
          revenue: stats.revenue,
          growth: percentDelta(stats.revenue, prevRevenue),
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const totalRevenue = categoryRows.reduce((sum, row) => sum + row.revenue, 0);
    const totalOrders = currentOrders.length;
    const prevTotalRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    const donutRows = categoryRows.slice(0, 3);
    const donutTotal = donutRows.reduce((sum, row) => sum + row.revenue, 0);
    const donutPalette = ['#12E2C8', '#AA62FF', '#FFCF25'];
    let start = 0;
    const donutStops = donutRows.map((row, idx) => {
      const pct = donutTotal > 0 ? (row.revenue / donutTotal) * 100 : 0;
      const stop = { color: donutPalette[idx % donutPalette.length], from: start, to: start + pct };
      start += pct;
      return stop;
    });
    const donutGradient = donutStops.length
      ? `conic-gradient(${donutStops.map((stop) => `${stop.color} ${stop.from}% ${stop.to}%`).join(', ')})`
      : undefined;

    const topTrendCategories = categoryRows.slice(0, 4).map((row) => row.category);
    const monthKeyMap = new Map<string, { key: string; label: string; date: Date }>();
    currentOrders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = toMonthKey(date);
      monthKeyMap.set(key, { key, label: toMonthLabel(date), date });
    });
    const months = Array.from(monthKeyMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6);

    const categoryMonthlyMap = new Map<string, Map<string, number>>();
    currentOrders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const monthKey = toMonthKey(date);
      (order.items || []).forEach((item) => {
        const category = categoryByProductId.get(item.productId || '') || 'Uncategorized';
        if (!topTrendCategories.includes(category)) return;
        const lineRevenue = Number(item.quantity || 0) * Number(item.price || 0);
        const categoryMap = categoryMonthlyMap.get(category) || new Map<string, number>();
        categoryMap.set(monthKey, (categoryMap.get(monthKey) || 0) + lineRevenue);
        categoryMonthlyMap.set(category, categoryMap);
      });
    });

    const linePalette = ['#3B82F6', '#22C55E', '#A855F7', '#FACC15'];
    const trendSeries = topTrendCategories.map((category, idx) => {
      const monthRevenue = categoryMonthlyMap.get(category) || new Map<string, number>();
      const values = months.map((month) => monthRevenue.get(month.key) || 0);
      return {
        label: category,
        color: linePalette[idx % linePalette.length],
        values,
      };
    });
    const trendMax = Math.max(1, ...trendSeries.flatMap((series) => series.values));

    return {
      totalRevenue,
      totalOrders,
      topCategory: categoryRows[0]?.category || 'Uncategorized',
      growthRate: percentDelta(totalRevenue, prevTotalRevenue),
      donutRows,
      donutGradient,
      topCategories,
      topSellingProducts,
      trendMonths: months.map((month) => month.label),
      trendSeries,
      trendMax,
    };
  }, [orders, products, period, search]);

  const salesHistoryData = useMemo(() => {
    const sortedOrders = [...filteredOrders].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    const successfulOrders = sortedOrders.filter((order) => isSuccessfulStatus(String(order.status || ''))).length;
    const totalRevenue = sortedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const completionRate = sortedOrders.length > 0 ? (successfulOrders / sortedOrders.length) * 100 : 0;

    const categoryByProductId = new Map<string, string>();
    products.forEach((product) => {
      if (!product.id) return;
      categoryByProductId.set(product.id, normalizeCategory(product.category));
    });

    const categoryRevenueMap = new Map<string, number>();
    sortedOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const category = categoryByProductId.get(item.productId || '') || 'Uncategorized';
        const lineRevenue = Number(item.quantity || 0) * Number(item.price || 0);
        categoryRevenueMap.set(category, (categoryRevenueMap.get(category) || 0) + lineRevenue);
      });
    });

    const topCategoryRow = Array.from(categoryRevenueMap.entries())
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue)[0];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - PERIOD_DAYS[period] + 1);
    const dateRangeLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    return {
      rows: sortedOrders,
      totalRevenue,
      totalOrders: sortedOrders.length,
      completionRate,
      topCategory: topCategoryRow?.category || 'Uncategorized',
      topCategoryRevenue: topCategoryRow?.revenue || 0,
      dateRangeLabel,
    };
  }, [filteredOrders, products, period]);

  const updateSectionIndicator = useCallback(() => {
    const activeEl = sectionTabRefs.current[activeSectionTab];
    if (!activeEl) return;
    setSectionIndicator({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
      ready: true,
    });
  }, [activeSectionTab]);

  useLayoutEffect(() => {
    updateSectionIndicator();
  }, [updateSectionIndicator, activeSectionTab]);

  useEffect(() => {
    window.addEventListener('resize', updateSectionIndicator);
    return () => window.removeEventListener('resize', updateSectionIndicator);
  }, [updateSectionIndicator]);

  return (
    <div className="relative mx-auto w-full max-w-[1240px] 2xl:max-w-[1320px] px-1 sm:px-2 [font-family:var(--font-outfit),sans-serif]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[90px] h-[480px] w-[480px] -translate-x-1/2 rounded-full opacity-25 blur-3xl" style={{ backgroundColor: colors.accent.purpleDeep }} />
      </div>

      <section className="mb-6 text-center">
        <h1 className="text-[42px] sm:text-[56px] lg:text-[74px] 2xl:text-[82px] font-extrabold leading-[0.98] tracking-tight">
          <span className="block text-white">Analytics</span>
          <span
            className="block text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(90deg, #7E22CE 0%, #B7675A 50%, #FFD700 100%)' }}
          >
            {toTitleCase(activeSectionTab)}
          </span>
        </h1>

        <div className="mt-5 sm:mt-6 flex justify-center">
          <div className="relative inline-flex items-center gap-x-4 sm:gap-x-6 lg:gap-x-8 text-[9px] sm:text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em]">
            {SECTION_TABS.map((tab) => {
              const isActive = activeSectionTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  ref={(el) => {
                    sectionTabRefs.current[tab] = el;
                  }}
                  onClick={() => setActiveSectionTab(tab)}
                  className="relative whitespace-nowrap px-1 pb-2 transition-colors duration-200"
                  style={{ color: isActive ? colors.accent.yellow : colors.text.muted }}
                >
                  {tab}
                </button>
              );
            })}
            <span
              className="pointer-events-none absolute bottom-[-3px] h-[3px] rounded-full transition-all duration-300 ease-out"
              style={{
                left: sectionIndicator.left,
                width: sectionIndicator.width,
                opacity: sectionIndicator.ready ? 1 : 0,
                background: 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)',
                boxShadow: '0 0 12px rgba(177, 59, 255, 0.35)',
              }}
            />
          </div>
        </div>

        <div className="mx-auto mt-4 sm:mt-5 flex w-full max-w-[860px] flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div
            className="flex-1 rounded-2xl border px-4 py-3 flex items-center gap-2"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" style={{ color: colors.accent.yellow }}>
              <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search orders or buyers"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: colors.text.primary }}
            />
          </div>

          <button
            type="button"
            className="rounded-xl w-full sm:w-auto min-w-[112px] px-5 py-3 text-xs font-bold flex items-center justify-center gap-2"
            style={{ backgroundColor: '#B14CFF', color: '#fff' }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export
          </button>
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#ef4444', color: '#fecaca' }}>
          {error}
        </div>
      )}

      {activeSectionTab === 'OVERVIEW' ? (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border px-4 py-3 lg:py-3.5 min-h-[88px]"
                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
              >
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: colors.text.muted }}>{card.label}</p>
                <p className="mt-1 text-[24px] lg:text-[26px] 2xl:text-[28px] leading-none font-extrabold" style={{ color: colors.text.primary }}>{loading ? '—' : card.value}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mb-4">
            <div className="rounded-[28px] border p-5 lg:p-6" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Revenue Trend</h2>
                <div className="rounded-lg border p-1 flex items-center gap-1" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                  {(Object.keys(PERIOD_DAYS) as PeriodKey[]).map((key) => {
                    const active = key === period;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPeriod(key)}
                        className="rounded-md px-2.5 py-1 text-[10px] font-semibold"
                        style={{
                          color: active ? '#fff' : colors.text.muted,
                          backgroundColor: active ? '#A54BFA' : 'transparent',
                        }}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
              </div>

              {analytics.revenueTrend.length > 0 ? (
                <AreaChart data={analytics.revenueTrend} color={colors.accent.purple} colors={colors} />
              ) : (
                <div className="h-[260px] rounded-xl border flex items-center justify-center text-sm" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                  No revenue trend yet.
                </div>
              )}

              <div className="mt-4 grid grid-cols-3 gap-4 text-xs lg:text-sm">
                <div>
                  <p style={{ color: colors.text.muted }}>Revenue</p>
                  <p className="text-lg lg:text-xl font-extrabold" style={{ color: colors.text.primary }}>{formatPeso(analytics.totalRevenue)}</p>
                </div>
                <div>
                  <p style={{ color: colors.text.muted }}>Orders</p>
                  <p className="text-lg lg:text-xl font-extrabold" style={{ color: colors.text.primary }}>{analytics.totalOrders}</p>
                </div>
                <div>
                  <p style={{ color: colors.text.muted }}>Avg. Order</p>
                  <p className="text-lg lg:text-xl font-extrabold" style={{ color: colors.text.primary }}>{formatPeso(analytics.avgOrderValue)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border p-5 lg:p-6" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Top Performance</h2>

              {analytics.topPerformance.length === 0 ? (
                <div className="h-[320px] rounded-xl border flex items-center justify-center text-sm" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                  No buyer performance data yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.topPerformance.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="min-w-0 flex items-center gap-3">
                        <span className="h-10 w-10 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor: '#E9EAF0', color: '#111827' }}>
                          {toInitials(entry.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" style={{ color: colors.text.primary }}>{entry.name}</p>
                          <p className="text-[11px]" style={{ color: colors.text.muted }}>{entry.units} Units</p>
                        </div>
                      </div>
                      <p className="text-sm font-extrabold" style={{ color: colors.accent.yellow }}>{formatPeso(entry.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-4 pb-3">
            <div className="rounded-[28px] border p-5 lg:p-6" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Sales by Category</h2>

              {analytics.categoryRows.length === 0 ? (
                <div className="h-[220px] rounded-xl border flex items-center justify-center text-sm" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                  No category sales data yet.
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-4 h-[170px] w-[170px] rounded-full p-8" style={{ background: analytics.donutGradient }}>
                    <div className="h-full w-full rounded-full" style={{ backgroundColor: colors.bg.primary }} />
                  </div>

                  <div className="space-y-2">
                    {analytics.categoryRows.map((row, idx) => {
                      const dotColors = ['#AA62FF', '#15E4C3', '#FFCF25'];
                      return (
                        <div key={row.category} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColors[idx % dotColors.length] }} />
                            <span className="truncate" style={{ color: colors.text.secondary }}>{row.category}</span>
                          </div>
                          <span className="font-semibold" style={{ color: colors.text.primary }}>{formatPeso(row.value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-[28px] border p-5 lg:p-6" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Recent Transactions</h2>

              {analytics.recentTransactions.length === 0 ? (
                <div className="h-[220px] rounded-xl border flex items-center justify-center text-sm" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                  No recent transactions yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {analytics.recentTransactions.map((order) => {
                    const pill = statusPill(String(order.status || ''));
                    return (
                      <div key={order.id} className="rounded-xl border p-3" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold" style={{ color: colors.accent.yellow }}>{formatOrderId(order.id)}</p>
                          <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: pill.bg, color: pill.color }}>
                            {pill.label}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-sm font-semibold truncate" style={{ color: colors.text.primary }}>{toBuyerName(order)}</p>
                          <p className="text-sm font-bold" style={{ color: colors.text.primary }}>{formatPeso(order.total || 0)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      ) : activeSectionTab === 'SALES HISTORY' ? (
      <>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Revenue', value: formatPeso(salesHistoryData.totalRevenue) },
            { label: 'Total Orders', value: salesHistoryData.totalOrders.toLocaleString() },
            { label: 'Top Category', value: salesHistoryData.topCategory },
            { label: 'Completion Rate', value: `${salesHistoryData.completionRate.toFixed(1)}%` },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border px-4 py-3 lg:py-3.5 min-h-[88px]"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
            >
              <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: colors.text.muted }}>{card.label}</p>
              <p className="mt-1 text-[24px] lg:text-[26px] leading-none font-extrabold" style={{ color: loading ? colors.text.muted : colors.text.primary }}>
                {loading ? '—' : card.value}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border p-5 lg:p-6 pb-4" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Order History</h2>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded-lg border px-2.5 py-1.5 font-semibold" style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: colors.bg.elevated }}>
                All Orders
              </span>
              <span className="rounded-lg border px-2.5 py-1.5 font-semibold" style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: colors.bg.elevated }}>
                {salesHistoryData.dateRangeLabel}
              </span>
            </div>
          </div>

          {salesHistoryData.rows.length === 0 ? (
            <div className="h-[220px] rounded-xl border flex items-center justify-center text-sm" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
              No orders found for this period.
            </div>
          ) : (
            <>
              <div className="sm:hidden space-y-2.5">
                {salesHistoryData.rows.slice(0, 12).map((order) => {
                  const pill = statusPill(String(order.status || ''));
                  const paymentSource = typeof order.shippingAddress === 'object' && order.shippingAddress
                    ? (order.shippingAddress as Record<string, unknown>)
                    : null;
                  const paymentMethodRaw =
                    (typeof paymentSource?.paymentMethod === 'string' && paymentSource.paymentMethod) ||
                    (typeof paymentSource?.payment_method === 'string' && paymentSource.payment_method) ||
                    (typeof paymentSource?.paymentOption === 'string' && paymentSource.paymentOption) ||
                    (typeof paymentSource?.payment_option === 'string' && paymentSource.payment_option) ||
                    (typeof paymentSource?.method === 'string' && paymentSource.method) ||
                    'Cash On Delivery';
                  const paymentMethod = toTitleCase(paymentMethodRaw);

                  return (
                    <div key={order.id} className="rounded-xl border p-3" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: colors.accent.yellow }}>{formatOrderId(order.id)}</p>
                          <p className="text-sm font-semibold mt-1" style={{ color: colors.text.primary }}>{toBuyerName(order)}</p>
                        </div>
                        <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: pill.bg, color: pill.color }}>
                          {pill.label}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs" style={{ color: colors.text.muted }}>
                        <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
                        <span className="font-bold" style={{ color: colors.text.primary }}>{formatPeso(order.total || 0)}</span>
                      </div>
                      <div className="mt-2 inline-flex rounded-md px-2.5 py-1 text-[10px] font-semibold" style={{ backgroundColor: '#FFCF25', color: '#18181b' }}>
                        {paymentMethod}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="text-left border-b" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                      <th className="py-2.5 pr-3 font-medium">ORDER ID</th>
                      <th className="py-2.5 pr-3 font-medium">DATE</th>
                      <th className="py-2.5 pr-3 font-medium">CUSTOMER</th>
                      <th className="py-2.5 pr-3 font-medium">STATUS</th>
                      <th className="py-2.5 pr-3 font-medium">PAYMENT METHOD</th>
                      <th className="py-2.5 text-right font-medium">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistoryData.rows.map((order) => {
                      const pill = statusPill(String(order.status || ''));
                      const paymentSource = typeof order.shippingAddress === 'object' && order.shippingAddress
                        ? (order.shippingAddress as Record<string, unknown>)
                        : null;
                      const paymentMethodRaw =
                        (typeof paymentSource?.paymentMethod === 'string' && paymentSource.paymentMethod) ||
                        (typeof paymentSource?.payment_method === 'string' && paymentSource.payment_method) ||
                        (typeof paymentSource?.paymentOption === 'string' && paymentSource.paymentOption) ||
                        (typeof paymentSource?.payment_option === 'string' && paymentSource.payment_option) ||
                        (typeof paymentSource?.method === 'string' && paymentSource.method) ||
                        'Cash On Delivery';
                      const paymentMethod = toTitleCase(paymentMethodRaw);

                      return (
                        <tr key={order.id} className="border-b" style={{ borderColor: colors.border.faint }}>
                          <td className="py-3 pr-3 font-semibold" style={{ color: colors.accent.yellow }}>{formatOrderId(order.id)}</td>
                          <td className="py-3 pr-3" style={{ color: colors.text.secondary }}>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                          <td className="py-3 pr-3" style={{ color: colors.text.primary }}>{toBuyerName(order)}</td>
                          <td className="py-3 pr-3">
                            <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: pill.bg, color: pill.color }}>
                              {pill.label}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <span className="inline-flex rounded-md px-2.5 py-1 text-[10px] font-semibold" style={{ backgroundColor: '#FFCF25', color: '#18181b' }}>
                              {paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 text-right font-bold" style={{ color: colors.text.primary }}>{formatPeso(order.total || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </>
      ) : (
      <section className="rounded-[24px] border p-6 text-center" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
        <p style={{ color: colors.text.muted }}>This section is ready for the next real-data view.</p>
      </section>
      )}
    </div>
  );
}