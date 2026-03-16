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
  if (normalized === 'cancelled') {
    return { label: 'Cancelled', bg: '#ef444422', color: '#f87171' };
  }
  if (normalized === 'returned') {
    return { label: 'Returned', bg: '#f9731622', color: '#fb923c' };
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

function DeltaBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const isPositive = value >= 0;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{
        backgroundColor: isPositive ? '#16a34a22' : '#ef444422',
        color: isPositive ? '#22c55e' : '#f87171',
      }}
    >
      {isPositive ? '↑' : '↓'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

function MiniBarChart({ values, color, max }: { values: number[]; color: string; max: number }) {
  const safeMax = Math.max(max, 1);
  return (
    <div className="flex items-end gap-[3px] h-10">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all duration-300"
          style={{
            height: `${Math.max(4, (v / safeMax) * 100)}%`,
            backgroundColor: color,
            opacity: i === values.length - 1 ? 1 : 0.4 + (i / values.length) * 0.5,
          }}
        />
      ))}
    </div>
  );
}

function SimpleLineChart({
  series,
  labels,
  height = 180,
  colors: themeColors,
}: {
  series: { label: string; color: string; values: number[] }[];
  labels: string[];
  height?: number;
  colors: any;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ width: 600, height });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setDims({ width: entry.contentRect.width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  const padX = 8;
  const padY = 16;
  const maxVal = Math.max(1, ...series.flatMap((s) => s.values));

  const getPath = (values: number[]) => {
    if (!values.length) return '';
    const chartW = dims.width - padX * 2;
    const chartH = dims.height - padY * 2;
    const pts = values.map((v, i) => ({
      x: padX + (i / Math.max(values.length - 1, 1)) * chartW,
      y: dims.height - padY - (v / maxVal) * chartH,
    }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const getAreaPath = (values: number[]) => {
    const linePath = getPath(values);
    if (!linePath) return '';
    const chartW = dims.width - padX * 2;
    const lastX = padX + chartW;
    const firstX = padX;
    return `${linePath} L ${lastX} ${dims.height - padY} L ${firstX} ${dims.height - padY} Z`;
  };

  return (
    <div className="relative w-full" style={{ height }}>
      <svg ref={svgRef} className="w-full" style={{ height }} viewBox={`0 0 ${dims.width} ${dims.height}`} preserveAspectRatio="none">
        <defs>
          {series.map((s) => (
            <linearGradient key={`grad-${s.label}`} id={`grad-${s.label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={dims.width - padX}
            y1={padY + (1 - t) * (dims.height - padY * 2)}
            y2={padY + (1 - t) * (dims.height - padY * 2)}
            stroke={themeColors.border.faint}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        {series.map((s) => (
          <React.Fragment key={s.label}>
            <path d={getAreaPath(s.values)} fill={`url(#grad-${s.label.replace(/\s/g, '')})`} />
            <path d={getPath(s.values)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </React.Fragment>
        ))}
        {labels.map((label, i) => {
          const chartW = dims.width - padX * 2;
          const x = padX + (i / Math.max(labels.length - 1, 1)) * chartW;
          return (
            <text key={label} x={x} y={dims.height - 2} textAnchor="middle" fontSize="9" fill={themeColors.text.muted}>
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
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
  const { colors, theme } = useTheme();
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
        const [ordersRes, productsRes, inventoryRes] = await Promise.all([
          listMyOrders({ page: 1, limit: 500, projectId: selectedProject?.id }),
          listProducts({ page: 1, limit: 500, subdomain: selectedProject?.subdomain || undefined }),
          getInventorySummary({ subdomain: selectedProject?.subdomain || undefined }).catch(() => ({ success: false as const, data: null })),
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
    return () => { cancelled = true; };
  }, [selectedProject?.id, selectedProject?.subdomain]);

  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const maxAgeMs = PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;

    return orders.filter((order) => {
      if (!order.createdAt) return false;
      const timestamp = new Date(order.createdAt).getTime();
      if (Number.isNaN(timestamp)) return false;
      if (now - timestamp > maxAgeMs) return false;
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
      productCategoryById.set(product.id, normalizeCategory(product.category));
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
            const stop = { color: palette[idx % palette.length], from: start, to: start + pct };
            start += pct;
            return stop;
          });
        })()
      : [];

    const donutGradient = donutStops.length
      ? `conic-gradient(${donutStops.map((stop) => `${stop.color} ${stop.from}% ${stop.to}%`).join(', ')})`
      : undefined;

    const recentTransactions = [...filteredOrders]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 7);

    return {
      totalOrders, totalRevenue, avgOrderValue, completionRate,
      completedOrders, pendingOrders, revenueTrend, topPerformance,
      categoryRows, donutGradient, recentTransactions,
    };
  }, [filteredOrders, products]);

  const kpiCards = [
    { label: 'Revenue', value: formatPeso(analytics.totalRevenue) },
    { label: 'Net Profit', value: formatPeso(Math.max(0, analytics.totalRevenue * 0.32)) },
    { label: 'Orders', value: analytics.totalOrders.toLocaleString() },
    { label: 'Completion', value: `${analytics.completionRate.toFixed(1)}%` },
    { label: 'Avg. Value', value: formatPeso(analytics.avgOrderValue) },
  ];

  // ─── SALES TREND DATA ────────────────────────────────────────────────────
  const salesTrendData = useMemo(() => {
    const dailyRevenueMap = new Map<string, { date: Date; revenue: number; orders: number }>();

    filteredOrders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const existing = dailyRevenueMap.get(dayKey) || { date, revenue: 0, orders: 0 };
      existing.revenue += Number(order.total || 0);
      existing.orders += 1;
      dailyRevenueMap.set(dayKey, existing);
    });

    const dailyRows = Array.from(dailyRevenueMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

    const peakDays = [...dailyRows]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item) => ({
        dateLabel: item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        revenue: item.revenue,
        orders: item.orders,
      }));

    const slowDays = [...dailyRows]
      .filter((item) => item.revenue > 0)
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 5)
      .map((item) => ({
        dateLabel: item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        revenue: item.revenue,
        orders: item.orders,
      }));

    // Weekly revenue bars
    const weekMap = new Map<string, number>();
    filteredOrders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
      weekMap.set(key, (weekMap.get(key) || 0) + Number(order.total || 0));
    });
    const weeklyRevenue = Array.from(weekMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-8)
      .map(([, v]) => v);

    const monthlyGrowth = analytics.revenueTrend.slice(-6).map((item) => ({ label: item.month, value: item.revenue }));
    const maxMonthlyValue = Math.max(...monthlyGrowth.map((r) => r.value), 1);

    // Day-of-week heatmap
    const dowRevenue: number[] = Array(7).fill(0);
    const dowCount: number[] = Array(7).fill(0);
    filteredOrders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const dow = date.getDay();
      dowRevenue[dow] += Number(order.total || 0);
      dowCount[dow] += 1;
    });
    const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowData = dowLabels.map((label, i) => ({ label, revenue: dowRevenue[i], orders: dowCount[i] }));

    // Multi-line trend: revenue vs orders over time
    const trendSeries = [
      {
        label: 'Revenue',
        color: '#AA62FF',
        values: monthlyGrowth.map((m) => m.value),
      },
    ];

    // Daily sparkline
    const last30Days = dailyRows.slice(-30).map((d) => d.revenue);

    const totalRevenue = filteredOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgDailyRevenue = dailyRows.length > 0 ? totalRevenue / dailyRows.length : 0;
    const avgDailyOrders = dailyRows.length > 0 ? totalOrders / dailyRows.length : 0;

    return {
      peakDays,
      slowDays,
      monthlyGrowth,
      maxMonthlyValue,
      dowData,
      weeklyRevenue,
      trendSeries,
      trendMonths: monthlyGrowth.map((m) => m.label),
      last30Days,
      totalRevenue,
      totalOrders,
      avgDailyRevenue,
      avgDailyOrders,
    };
  }, [analytics.revenueTrend, filteredOrders]);

  // ─── PURCHASE SUCCESS DATA ────────────────────────────────────────────────
  const purchaseSuccessData = useMemo(() => {
    const now = Date.now();
    const periodMs = PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;

    const matchesSearch = (order: ApiOrder) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return toBuyerName(order).toLowerCase().includes(q)
        || String(order.status || '').toLowerCase().includes(q)
        || formatOrderId(order.id).toLowerCase().includes(q);
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
      const successful = source.filter((o) => isSuccessfulStatus(String(o.status || '')));
      const failed = source.filter((o) => isFailedStatus(String(o.status || '')));
      const cancelled = source.filter((o) => String(o.status || '').toLowerCase() === 'cancelled');
      const returned = source.filter((o) => String(o.status || '').toLowerCase() === 'returned');
      const successRevenue = successful.reduce((s, o) => s + Number(o.total || 0), 0);
      const successRate = total > 0 ? (successful.length / total) * 100 : 0;
      const avgSuccessfulOrder = successful.length > 0 ? successRevenue / successful.length : 0;
      return {
        total, successfulCount: successful.length, failedCount: failed.length,
        cancelledCount: cancelled.length, returnedCount: returned.length,
        successRevenue, successRate, avgSuccessfulOrder,
      };
    };

    const current = summarize(currentOrders);
    const previous = summarize(previousOrders);

    // Monthly trend of successful revenue
    const monthMap = new Map<string, number>();
    currentOrders
      .filter((o) => isSuccessfulStatus(String(o.status || '')))
      .forEach((o) => {
        if (!o.createdAt) return;
        const d = new Date(o.createdAt);
        if (Number.isNaN(d.getTime())) return;
        const key = toMonthKey(d);
        monthMap.set(key, (monthMap.get(key) || 0) + Number(o.total || 0));
      });

    const trend = Array.from(monthMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-6)
      .map(([key, revenue]) => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, (month || 1) - 1, 1);
        return { month: toMonthLabel(date), revenue };
      });

    // Status breakdown for donut
    const statusCounts = [
      { label: 'Successful', count: current.successfulCount, color: '#22c55e' },
      { label: 'Pending', count: currentOrders.filter((o) => ['pending','processing'].includes(String(o.status||'').toLowerCase())).length, color: '#fbbf24' },
      { label: 'In Transit', count: currentOrders.filter((o) => String(o.status||'').toLowerCase() === 'shipped').length, color: '#60a5fa' },
      { label: 'Cancelled', count: current.cancelledCount, color: '#f87171' },
      { label: 'Returned', count: current.returnedCount, color: '#fb923c' },
    ].filter((s) => s.count > 0);

    const statusTotal = statusCounts.reduce((s, c) => s + c.count, 0);
    let donutStart = 0;
    const donutStops = statusCounts.map((s) => {
      const pct = statusTotal > 0 ? (s.count / statusTotal) * 100 : 0;
      const stop = { ...s, from: donutStart, to: donutStart + pct };
      donutStart += pct;
      return stop;
    });
    const statusDonutGradient = donutStops.length
      ? `conic-gradient(${donutStops.map((s) => `${s.color} ${s.from}% ${s.to}%`).join(', ')})`
      : undefined;

    // Failed reasons breakdown
    const failureBreakdown = [
      { label: 'Cancelled', count: current.cancelledCount, pct: current.total > 0 ? (current.cancelledCount / current.total) * 100 : 0 },
      { label: 'Returned', count: current.returnedCount, pct: current.total > 0 ? (current.returnedCount / current.total) * 100 : 0 },
    ];

    return {
      ...current,
      trend,
      statusCounts,
      statusDonutGradient,
      failureBreakdown,
      successRateDelta: percentDelta(current.successRate, previous.successRate),
      successRevenueDelta: percentDelta(current.successRevenue, previous.successRevenue),
      successOrdersDelta: percentDelta(current.successfulCount, previous.successfulCount),
      avgOrderDelta: percentDelta(current.avgSuccessfulOrder, previous.avgSuccessfulOrder),
    };
  }, [orders, period, search]);

  // ─── CATEGORY SALES DATA ─────────────────────────────────────────────────
  const categorySalesData = useMemo(() => {
    const now = Date.now();
    const periodMs = PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;

    const matchesSearch = (order: ApiOrder) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return toBuyerName(order).toLowerCase().includes(q)
        || String(order.status || '').toLowerCase().includes(q)
        || formatOrderId(order.id).toLowerCase().includes(q);
    };

    const currentOrders = orders.filter((o) => {
      if (!o.createdAt) return false;
      const t = new Date(o.createdAt).getTime();
      return !Number.isNaN(t) && now - t <= periodMs && matchesSearch(o);
    });
    const previousOrders = orders.filter((o) => {
      if (!o.createdAt) return false;
      const t = new Date(o.createdAt).getTime();
      if (Number.isNaN(t)) return false;
      const diff = now - t;
      return diff > periodMs && diff <= periodMs * 2 && matchesSearch(o);
    });

    const categoryByProductId = new Map<string, string>();
    const productNameById = new Map<string, string>();
    products.forEach((p) => {
      if (!p.id) return;
      categoryByProductId.set(p.id, normalizeCategory(p.category));
      productNameById.set(p.id, String(p.name || 'Unnamed Product'));
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
        return { category, revenue: stats.revenue, sales: stats.sales, growth: percentDelta(stats.revenue, prevRevenue) };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const topSellingProducts = Array.from(currentProductMap.entries())
      .map(([key, stats]) => {
        const prevRevenue = previousProductMap.get(key)?.revenue || 0;
        return { product: stats.name, sales: stats.sales, revenue: stats.revenue, growth: percentDelta(stats.revenue, prevRevenue) };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const totalRevenue = categoryRows.reduce((sum, row) => sum + row.revenue, 0);
    const prevTotalRevenue = previousOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    const donutRows = categoryRows.slice(0, 4);
    const donutTotal = donutRows.reduce((sum, row) => sum + row.revenue, 0);
    const donutPalette = ['#12E2C8', '#AA62FF', '#FFCF25', '#f87171'];
    let start = 0;
    const donutStops = donutRows.map((row, idx) => {
      const pct = donutTotal > 0 ? (row.revenue / donutTotal) * 100 : 0;
      const stop = { color: donutPalette[idx % donutPalette.length], from: start, to: start + pct };
      start += pct;
      return stop;
    });
    const donutGradient = donutStops.length
      ? `conic-gradient(${donutStops.map((s) => `${s.color} ${s.from}% ${s.to}%`).join(', ')})`
      : undefined;

    // Multi-category monthly trend
    const topTrendCategories = categoryRows.slice(0, 4).map((r) => r.category);
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
        const catMap = categoryMonthlyMap.get(category) || new Map<string, number>();
        catMap.set(monthKey, (catMap.get(monthKey) || 0) + lineRevenue);
        categoryMonthlyMap.set(category, catMap);
      });
    });

    const linePalette = ['#12E2C8', '#AA62FF', '#FFCF25', '#f87171'];
    const trendSeries = topTrendCategories.map((category, idx) => {
      const monthRevenue = categoryMonthlyMap.get(category) || new Map<string, number>();
      return { label: category, color: linePalette[idx % linePalette.length], values: months.map((m) => monthRevenue.get(m.key) || 0) };
    });

    return {
      totalRevenue,
      totalOrders: currentOrders.length,
      topCategory: categoryRows[0]?.category || 'Uncategorized',
      growthRate: percentDelta(totalRevenue, prevTotalRevenue),
      donutRows,
      donutGradient,
      donutPalette,
      topCategories: categoryRows.slice(0, 6),
      topSellingProducts,
      trendMonths: months.map((m) => m.label),
      trendSeries,
      trendMax: Math.max(1, ...trendSeries.flatMap((s) => s.values)),
    };
  }, [orders, products, period, search]);

  // ─── SALES HISTORY DATA ───────────────────────────────────────────────────
  const salesHistoryData = useMemo(() => {
    const sortedOrders = [...filteredOrders].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    const successfulOrders = sortedOrders.filter((o) => isSuccessfulStatus(String(o.status || ''))).length;
    const totalRevenue = sortedOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const completionRate = sortedOrders.length > 0 ? (successfulOrders / sortedOrders.length) * 100 : 0;

    const categoryByProductId = new Map<string, string>();
    products.forEach((p) => {
      if (!p.id) return;
      categoryByProductId.set(p.id, normalizeCategory(p.category));
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
    setSectionIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth, ready: true });
  }, [activeSectionTab]);

  useLayoutEffect(() => { updateSectionIndicator(); }, [updateSectionIndicator, activeSectionTab]);
  useEffect(() => {
    window.addEventListener('resize', updateSectionIndicator);
    return () => window.removeEventListener('resize', updateSectionIndicator);
  }, [updateSectionIndicator]);

  // ─── SHARED PERIOD SELECTOR ───────────────────────────────────────────────
  const PeriodSelector = () => (
    <div className="rounded-lg border p-1 flex items-center gap-1" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
      {(Object.keys(PERIOD_DAYS) as PeriodKey[]).map((key) => {
        const active = key === period;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className="rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all duration-150"
            style={{ color: active ? '#fff' : colors.text.muted, backgroundColor: active ? '#A54BFA' : 'transparent' }}
          >
            {key}
          </button>
        );
      })}
    </div>
  );

  // ─── EMPTY STATE ──────────────────────────────────────────────────────────
  const EmptyState = ({ message }: { message: string }) => (
    <div className="h-[220px] rounded-xl border flex flex-col items-center justify-center gap-2 text-sm"
      style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
      <svg viewBox="0 0 24 24" className="h-8 w-8 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <span>{message}</span>
    </div>
  );

  return (
    <div className="dashboard-landing-light relative mx-auto w-full max-w-[1240px] 2xl:max-w-[1320px] px-1 sm:px-2 [font-family:var(--font-outfit),sans-serif]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[90px] h-[480px] w-[480px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ backgroundColor: colors.accent.purpleDeep }} />
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <section className="mb-6 text-center">
        <h1 className="text-[42px] sm:text-[56px] lg:text-[74px] 2xl:text-[82px] font-extrabold leading-[0.98] tracking-tight">
          <span className={`block ${theme === 'dark' ? 'text-white' : 'text-[#1E1B4B]'}`}>Analytics</span>
          <span 
            className={`block text-transparent bg-clip-text bg-gradient-to-r ${theme === 'dark' ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
            style={{ textShadow: theme === 'dark' ? 'unset' : '0 1px 2px rgba(0,0,0,0.1)' }}>
            {toTitleCase(activeSectionTab)}
          </span>
        </h1>

        <div className="mt-5 sm:mt-6 flex justify-center">
          <div className="relative inline-flex items-center gap-x-4 sm:gap-x-6 lg:gap-x-8 text-[9px] sm:text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em]">
            {SECTION_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                ref={(el) => { sectionTabRefs.current[tab] = el; }}
                onClick={() => setActiveSectionTab(tab)}
                className="relative whitespace-nowrap px-1 pb-2 transition-colors duration-200"
                style={{ color: activeSectionTab === tab ? colors.accent.yellow : colors.text.muted }}
              >
                {tab}
              </button>
            ))}
            <span
              className="pointer-events-none absolute bottom-[-3px] h-[3px] rounded-full transition-all duration-300 ease-out"
              style={{
                left: sectionIndicator.left,
                width: sectionIndicator.width,
                opacity: sectionIndicator.ready ? 1 : 0,
                background: theme === 'dark' ? 'linear-gradient(90deg, #7c3aed 0%, #d946ef 50%, #ffcc00 100%)' : 'linear-gradient(90deg, #7c3aed 0%, #d946ef 50%, #f5a213 100%)',
                boxShadow: theme === 'dark' ? '0 0 12px rgba(177, 59, 255, 0.35)' : '0 0 12px rgba(139, 92, 246, 0.35)',
              }}
            />
          </div>
        </div>

        <div className="mx-auto mt-4 sm:mt-5 flex w-full max-w-[860px] flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className={`m-dashboard-search-shadow flex-1 rounded-2xl border px-5 py-3.5 flex items-center gap-3 ${theme === 'dark' ? 'bg-[#141446] border-[#1F1F51] [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.03),0_10px_40px_rgba(16,11,62,0.45)]' : 'bg-white/80 border-[#E2E8F0] shadow-sm backdrop-blur-md focus-within:border-[#8B5CF6] transition-colors'}`}>
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" style={{ color: colors.accent.yellow }}>
              <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders or buyers"
              className={`w-full bg-transparent text-sm outline-none ${theme === 'dark' ? 'text-white placeholder:text-[#6F70A8]' : 'text-slate-900 placeholder:text-slate-400'}`}
            />
          </div>
          <button
            type="button"
            className="rounded-xl w-full sm:w-auto min-w-[112px] px-5 py-3 text-xs font-bold flex items-center justify-center gap-2 text-white"
            style={{ background: theme === 'dark' ? '#B14CFF' : 'linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)' }}
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
        <div className="mb-4 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: '#ef4444', color: '#fecaca' }}>
          {error}
        </div>
      )}

      {/* ── OVERVIEW ───────────────────────────────────────────────────────── */}
      {activeSectionTab === 'OVERVIEW' && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            {kpiCards.map((card) => (
              <div key={card.label} className="rounded-2xl border px-4 py-3 lg:py-3.5 min-h-[88px]"
                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: colors.text.muted }}>{card.label}</p>
                <p className="mt-1 text-[24px] lg:text-[26px] 2xl:text-[28px] leading-none font-extrabold"
                  style={{ color: colors.text.primary }}>{loading ? '—' : card.value}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mb-4">
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Revenue Trend</h2>
                <PeriodSelector />
              </div>
              {analytics.revenueTrend.length > 0 ? (
                <AreaChart data={analytics.revenueTrend} color={colors.accent.purple} colors={colors} />
              ) : (
                <EmptyState message="No revenue trend yet." />
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

            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Top Performance</h2>
              {analytics.topPerformance.length === 0 ? (
                <EmptyState message="No buyer performance data yet." />
              ) : (
                <div className="space-y-3">
                  {analytics.topPerformance.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="min-w-0 flex items-center gap-3">
                        <span className="h-10 w-10 rounded-full flex items-center justify-center text-[11px] font-bold"
                          style={{ backgroundColor: '#E9EAF0', color: '#111827' }}>
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
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Sales by Category</h2>
              {analytics.categoryRows.length === 0 ? (
                <EmptyState message="No category sales data yet." />
              ) : (
                <>
                  <div className="mx-auto mb-4 h-[170px] w-[170px] rounded-full p-8"
                    style={{ background: analytics.donutGradient }}>
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

            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Recent Transactions</h2>
              {analytics.recentTransactions.length === 0 ? (
                <EmptyState message="No recent transactions yet." />
              ) : (
                <div className="space-y-2.5">
                  {analytics.recentTransactions.map((order) => {
                    const pill = statusPill(String(order.status || ''));
                    return (
                      <div key={order.id} className="rounded-xl border p-3"
                        style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold" style={{ color: colors.accent.yellow }}>{formatOrderId(order.id)}</p>
                          <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ backgroundColor: pill.bg, color: pill.color }}>{pill.label}</span>
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
      )}

      {/* ── SALES TREND ────────────────────────────────────────────────────── */}
      {activeSectionTab === 'SALES TREND' && (
        <>
          {/* KPI row */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Revenue', value: formatPeso(salesTrendData.totalRevenue) },
              { label: 'Total Orders', value: salesTrendData.totalOrders.toLocaleString() },
              { label: 'Avg. Daily Revenue', value: formatPeso(salesTrendData.avgDailyRevenue) },
              { label: 'Avg. Daily Orders', value: salesTrendData.avgDailyOrders.toFixed(1) },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border px-4 py-3 min-h-[88px]"
                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: colors.text.muted }}>{card.label}</p>
                <p className="mt-1 text-[22px] lg:text-[24px] leading-none font-extrabold"
                  style={{ color: loading ? colors.text.muted : colors.text.primary }}>{loading ? '—' : card.value}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 mb-4">
            {/* Multi-line monthly chart */}
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Monthly Revenue Trend</h2>
                <PeriodSelector />
              </div>
              {salesTrendData.trendSeries[0]?.values.length ? (
                <SimpleLineChart
                  series={salesTrendData.trendSeries}
                  labels={salesTrendData.trendMonths}
                  height={200}
                  colors={colors}
                />
              ) : (
                <EmptyState message="No trend data available." />
              )}
              <div className="mt-3 flex items-center gap-4">
                {salesTrendData.trendSeries.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5 text-xs" style={{ color: colors.text.muted }}>
                    <span className="h-2 w-4 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Day-of-week breakdown */}
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Revenue by Day of Week</h2>
              {salesTrendData.dowData.some((d) => d.revenue > 0) ? (
                <div className="space-y-2.5">
                  {salesTrendData.dowData.map((d) => {
                    const maxDow = Math.max(...salesTrendData.dowData.map((x) => x.revenue), 1);
                    const pct = (d.revenue / maxDow) * 100;
                    return (
                      <div key={d.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: colors.text.secondary }}>{d.label}</span>
                          <span className="font-semibold" style={{ color: colors.text.primary }}>{formatPeso(d.revenue)}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.bg.elevated }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#AA62FF' : pct >= 50 ? '#15E4C3' : '#60a5fa' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState message="No day-of-week data available." />
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-3">
            {/* Peak days */}
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>
                🚀 Peak Revenue Days
              </h2>
              {salesTrendData.peakDays.length === 0 ? (
                <EmptyState message="No peak day data yet." />
              ) : (
                <div className="space-y-3">
                  {salesTrendData.peakDays.map((day, idx) => (
                    <div key={day.dateLabel} className="flex items-center gap-3">
                      <span className="w-5 text-[11px] font-bold text-right" style={{ color: colors.text.muted }}>
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: colors.text.primary }}>{day.dateLabel}</p>
                        <p className="text-[11px]" style={{ color: colors.text.muted }}>{day.orders} orders</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: colors.accent.yellow }}>{formatPeso(day.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slow days */}
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>
                🐢 Slowest Revenue Days
              </h2>
              {salesTrendData.slowDays.length === 0 ? (
                <EmptyState message="No slow day data yet." />
              ) : (
                <div className="space-y-3">
                  {salesTrendData.slowDays.map((day, idx) => (
                    <div key={day.dateLabel} className="flex items-center gap-3">
                      <span className="w-5 text-[11px] font-bold text-right" style={{ color: colors.text.muted }}>
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: colors.text.primary }}>{day.dateLabel}</p>
                        <p className="text-[11px]" style={{ color: colors.text.muted }}>{day.orders} orders</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: '#60a5fa' }}>{formatPeso(day.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* ── PURCHASE SUCCESS ───────────────────────────────────────────────── */}
      {activeSectionTab === 'PURCHASE SUCCESS' && (
        <>
          {/* KPI cards with deltas */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              {
                label: 'Success Rate',
                value: `${purchaseSuccessData.successRate.toFixed(1)}%`,
                delta: purchaseSuccessData.successRateDelta,
              },
              {
                label: 'Successful Orders',
                value: purchaseSuccessData.successfulCount.toLocaleString(),
                delta: purchaseSuccessData.successOrdersDelta,
              },
              {
                label: 'Successful Revenue',
                value: formatPeso(purchaseSuccessData.successRevenue),
                delta: purchaseSuccessData.successRevenueDelta,
              },
              {
                label: 'Avg. Successful Order',
                value: formatPeso(purchaseSuccessData.avgSuccessfulOrder),
                delta: purchaseSuccessData.avgOrderDelta,
              },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border px-4 py-3 min-h-[100px]"
                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: colors.text.muted }}>{card.label}</p>
                <p className="mt-1 text-[22px] lg:text-[24px] leading-none font-extrabold mb-1.5"
                  style={{ color: loading ? colors.text.muted : colors.text.primary }}>{loading ? '—' : card.value}</p>
                {!loading && <DeltaBadge value={card.delta} />}
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mb-4">
            {/* Success trend chart */}
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Successful Revenue Trend</h2>
                <PeriodSelector />
              </div>
              {purchaseSuccessData.trend.length > 0 ? (
                <SimpleLineChart
                  series={[{ label: 'Successful Revenue', color: '#22c55e', values: purchaseSuccessData.trend.map((t) => t.revenue) }]}
                  labels={purchaseSuccessData.trend.map((t) => t.month)}
                  height={200}
                  colors={colors}
                />
              ) : (
                <EmptyState message="No trend data yet." />
              )}
            </div>

            {/* Order status donut */}
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Order Status Breakdown</h2>
              {purchaseSuccessData.statusCounts.length > 0 ? (
                <>
                  <div className="mx-auto mb-4 h-[150px] w-[150px] rounded-full p-7"
                    style={{ background: purchaseSuccessData.statusDonutGradient }}>
                    <div className="h-full w-full rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.bg.primary }}>
                      <div className="text-center">
                        <p className="text-xl font-extrabold leading-none" style={{ color: colors.text.primary }}>
                          {purchaseSuccessData.successRate.toFixed(0)}%
                        </p>
                        <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: colors.text.muted }}>success</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {purchaseSuccessData.statusCounts.map((s) => (
                      <div key={s.label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          <span style={{ color: colors.text.secondary }}>{s.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: colors.text.muted }}>{s.count}</span>
                          <span className="font-semibold" style={{ color: colors.text.primary }}>
                            {purchaseSuccessData.total > 0 ? ((s.count / purchaseSuccessData.total) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState message="No status data yet." />
              )}
            </div>
          </section>

          {/* Failure breakdown */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-3">
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Failure Analysis</h2>
              {purchaseSuccessData.failedCount > 0 ? (
                <div className="space-y-4">
                  {purchaseSuccessData.failureBreakdown.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span style={{ color: colors.text.secondary }}>{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span style={{ color: colors.text.muted }}>{item.count} orders</span>
                          <span className="font-semibold" style={{ color: '#f87171' }}>{item.pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.bg.elevated }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.pct}%`, backgroundColor: '#f87171' }} />
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 rounded-xl p-3 text-xs" style={{ backgroundColor: colors.bg.elevated }}>
                    <p style={{ color: colors.text.muted }}>
                      <span className="font-semibold" style={{ color: '#f87171' }}>{purchaseSuccessData.failedCount}</span> of{' '}
                      <span className="font-semibold" style={{ color: colors.text.primary }}>{purchaseSuccessData.total}</span>{' '}
                      orders failed ({purchaseSuccessData.total > 0 ? ((purchaseSuccessData.failedCount / purchaseSuccessData.total) * 100).toFixed(1) : 0}% failure rate).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-[120px] rounded-xl border flex items-center justify-center gap-2 text-sm"
                  style={{ borderColor: colors.border.faint, color: '#22c55e' }}>
                  <span>🎉</span> No failed or cancelled orders!
                </div>
              )}
            </div>

            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Order Volume Summary</h2>
              <div className="space-y-3">
                {[
                  { label: 'Total Orders', value: purchaseSuccessData.total, color: colors.text.primary },
                  { label: 'Successful', value: purchaseSuccessData.successfulCount, color: '#22c55e' },
                  { label: 'Pending / Processing', value: purchaseSuccessData.total - purchaseSuccessData.successfulCount - purchaseSuccessData.failedCount, color: '#fbbf24' },
                  { label: 'Cancelled', value: purchaseSuccessData.cancelledCount, color: '#f87171' },
                  { label: 'Returned', value: purchaseSuccessData.returnedCount, color: '#fb923c' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                    style={{ backgroundColor: colors.bg.elevated }}>
                    <span className="text-xs" style={{ color: colors.text.secondary }}>{row.label}</span>
                    <span className="text-sm font-bold" style={{ color: row.color }}>{Math.max(0, row.value).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── CATEGORY SALES ──────────────────────────────────────────────────── */}
      {activeSectionTab === 'CATEGORY SALES' && (
        <>
          {/* KPI cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Category Revenue', value: formatPeso(categorySalesData.totalRevenue) },
              { label: 'Total Orders', value: categorySalesData.totalOrders.toLocaleString() },
              { label: 'Top Category', value: categorySalesData.topCategory },
              {
                label: 'Period Growth',
                value: `${categorySalesData.growthRate >= 0 ? '+' : ''}${categorySalesData.growthRate.toFixed(1)}%`,
              },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border px-4 py-3 min-h-[88px]"
                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: colors.text.muted }}>{card.label}</p>
                <p className="mt-1 text-[20px] lg:text-[22px] leading-none font-extrabold"
                  style={{ color: loading ? colors.text.muted : colors.text.primary }}>{loading ? '—' : card.value}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 mb-4">
            {/* Multi-category line chart */}
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Category Revenue Over Time</h2>
                <PeriodSelector />
              </div>
              {categorySalesData.trendSeries.some((s) => s.values.some((v) => v > 0)) ? (
                <>
                  <SimpleLineChart
                    series={categorySalesData.trendSeries}
                    labels={categorySalesData.trendMonths}
                    height={200}
                    colors={colors}
                  />
                  <div className="mt-3 flex flex-wrap gap-3">
                    {categorySalesData.trendSeries.map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5 text-xs" style={{ color: colors.text.muted }}>
                        <span className="h-2 w-4 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState message="No category trend data available." />
              )}
            </div>

            {/* Donut + legend */}
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Category Share</h2>
              {categorySalesData.donutRows.length > 0 ? (
                <>
                  <div className="mx-auto mb-4 h-[150px] w-[150px] rounded-full p-7"
                    style={{ background: categorySalesData.donutGradient }}>
                    <div className="h-full w-full rounded-full" style={{ backgroundColor: colors.bg.primary }} />
                  </div>
                  <div className="space-y-2">
                    {categorySalesData.donutRows.map((row, idx) => {
                      const pct = categorySalesData.totalRevenue > 0
                        ? (row.revenue / categorySalesData.totalRevenue) * 100 : 0;
                      return (
                        <div key={row.category} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categorySalesData.donutPalette[idx % categorySalesData.donutPalette.length] }} />
                            <span className="truncate" style={{ color: colors.text.secondary }}>{row.category}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span style={{ color: colors.text.muted }}>{pct.toFixed(1)}%</span>
                            <span className="font-semibold" style={{ color: colors.text.primary }}>{formatPeso(row.revenue)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <EmptyState message="No category data yet." />
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-3">
            {/* Top categories table */}
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Category Performance</h2>
              {categorySalesData.topCategories.length > 0 ? (
                <div className="space-y-2.5">
                  {categorySalesData.topCategories.map((row) => {
                    const maxRev = categorySalesData.topCategories[0]?.revenue || 1;
                    const barPct = (row.revenue / maxRev) * 100;
                    return (
                      <div key={row.category}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold truncate" style={{ color: colors.text.primary }}>{row.category}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span style={{ color: colors.text.muted }}>{row.sales} sold</span>
                            <span className="font-bold" style={{ color: colors.accent.yellow }}>{formatPeso(row.revenue)}</span>
                            <DeltaBadge value={row.growth} />
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.bg.elevated }}>
                          <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: '#AA62FF' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState message="No category data yet." />
              )}
            </div>

            {/* Top products table */}
            <div className="rounded-[28px] border p-5 lg:p-6"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <h2 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>Top Selling Products</h2>
              {categorySalesData.topSellingProducts.length > 0 ? (
                <div className="space-y-2.5">
                  {categorySalesData.topSellingProducts.map((row, idx) => (
                    <div key={row.product} className="flex items-center gap-3 rounded-xl px-3 py-2"
                      style={{ backgroundColor: colors.bg.elevated }}>
                      <span className="text-[11px] font-bold w-4 text-right flex-shrink-0"
                        style={{ color: colors.text.muted }}>#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: colors.text.primary }}>{row.product}</p>
                        <p className="text-[11px]" style={{ color: colors.text.muted }}>{row.sales} units sold</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: colors.accent.yellow }}>{formatPeso(row.revenue)}</p>
                        <DeltaBadge value={row.growth} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No product data yet." />
              )}
            </div>
          </section>
        </>
      )}

      {/* ── SALES HISTORY ──────────────────────────────────────────────────── */}
      {activeSectionTab === 'SALES HISTORY' && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Revenue', value: formatPeso(salesHistoryData.totalRevenue) },
              { label: 'Total Orders', value: salesHistoryData.totalOrders.toLocaleString() },
              { label: 'Top Category', value: salesHistoryData.topCategory },
              { label: 'Completion Rate', value: `${salesHistoryData.completionRate.toFixed(1)}%` },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border px-4 py-3 lg:py-3.5 min-h-[88px]"
                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: colors.text.muted }}>{card.label}</p>
                <p className="mt-1 text-[24px] lg:text-[26px] leading-none font-extrabold"
                  style={{ color: loading ? colors.text.muted : colors.text.primary }}>
                  {loading ? '—' : card.value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-[28px] border p-5 lg:p-6 pb-4"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Order History</h2>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="rounded-lg border px-2.5 py-1.5 font-semibold"
                  style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: colors.bg.elevated }}>
                  All Orders
                </span>
                <span className="rounded-lg border px-2.5 py-1.5 font-semibold"
                  style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: colors.bg.elevated }}>
                  {salesHistoryData.dateRangeLabel}
                </span>
                <PeriodSelector />
              </div>
            </div>

            {salesHistoryData.rows.length === 0 ? (
              <EmptyState message="No orders found for this period." />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2.5">
                  {salesHistoryData.rows.slice(0, 12).map((order) => {
                    const pill = statusPill(String(order.status || ''));
                    const paymentSource = typeof order.shippingAddress === 'object' && order.shippingAddress
                      ? (order.shippingAddress as Record<string, unknown>) : null;
                    const paymentMethodRaw =
                      (typeof paymentSource?.paymentMethod === 'string' && paymentSource.paymentMethod) ||
                      (typeof paymentSource?.payment_method === 'string' && paymentSource.payment_method) ||
                      (typeof paymentSource?.paymentOption === 'string' && paymentSource.paymentOption) ||
                      (typeof paymentSource?.payment_option === 'string' && paymentSource.payment_option) ||
                      (typeof paymentSource?.method === 'string' && paymentSource.method) ||
                      'Cash On Delivery';
                    return (
                      <div key={order.id} className="rounded-xl border p-3"
                        style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold" style={{ color: colors.accent.yellow }}>{formatOrderId(order.id)}</p>
                            <p className="text-sm font-semibold mt-1" style={{ color: colors.text.primary }}>{toBuyerName(order)}</p>
                          </div>
                          <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ backgroundColor: pill.bg, color: pill.color }}>{pill.label}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs" style={{ color: colors.text.muted }}>
                          <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
                          <span className="font-bold" style={{ color: colors.text.primary }}>{formatPeso(order.total || 0)}</span>
                        </div>
                        <div className="mt-2 inline-flex rounded-md px-2.5 py-1 text-[10px] font-semibold"
                          style={{ backgroundColor: '#FFCF25', color: '#18181b' }}>
                          {toTitleCase(paymentMethodRaw)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="text-left border-b"
                        style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                        {['ORDER ID', 'DATE', 'CUSTOMER', 'STATUS', 'PAYMENT METHOD', 'TOTAL'].map((h) => (
                          <th key={h} className={`py-2.5 pr-3 font-medium text-[11px] tracking-[0.08em] ${h === 'TOTAL' ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {salesHistoryData.rows.map((order) => {
                        const pill = statusPill(String(order.status || ''));
                        const paymentSource = typeof order.shippingAddress === 'object' && order.shippingAddress
                          ? (order.shippingAddress as Record<string, unknown>) : null;
                        const paymentMethodRaw =
                          (typeof paymentSource?.paymentMethod === 'string' && paymentSource.paymentMethod) ||
                          (typeof paymentSource?.payment_method === 'string' && paymentSource.payment_method) ||
                          (typeof paymentSource?.paymentOption === 'string' && paymentSource.paymentOption) ||
                          (typeof paymentSource?.payment_option === 'string' && paymentSource.payment_option) ||
                          (typeof paymentSource?.method === 'string' && paymentSource.method) ||
                          'Cash On Delivery';
                        return (
                          <tr key={order.id} className="border-b transition-colors duration-100 hover:bg-white/[0.02]"
                            style={{ borderColor: colors.border.faint }}>
                            <td className="py-3 pr-3 font-semibold" style={{ color: colors.accent.yellow }}>{formatOrderId(order.id)}</td>
                            <td className="py-3 pr-3" style={{ color: colors.text.secondary }}>
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td className="py-3 pr-3 max-w-[180px] truncate" style={{ color: colors.text.primary }}>{toBuyerName(order)}</td>
                            <td className="py-3 pr-3">
                              <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                style={{ backgroundColor: pill.bg, color: pill.color }}>{pill.label}</span>
                            </td>
                            <td className="py-3 pr-3">
                              <span className="inline-flex rounded-md px-2.5 py-1 text-[10px] font-semibold"
                                style={{ backgroundColor: '#FFCF25', color: '#18181b' }}>
                                {toTitleCase(paymentMethodRaw)}
                              </span>
                            </td>
                            <td className="py-3 text-right font-bold" style={{ color: colors.text.primary }}>{formatPeso(order.total || 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: `2px solid ${colors.border.faint}` }}>
                        <td colSpan={5} className="pt-3 text-xs font-semibold" style={{ color: colors.text.muted }}>
                          {salesHistoryData.rows.length} orders total
                        </td>
                        <td className="pt-3 text-right font-extrabold text-sm" style={{ color: colors.accent.yellow }}>
                          {formatPeso(salesHistoryData.totalRevenue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}