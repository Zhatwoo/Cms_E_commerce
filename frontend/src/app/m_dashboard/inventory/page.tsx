'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Filter,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  adjustInventoryStock,
  createProduct,
  deleteInventoryMovement,
  bulkDeleteInventoryMovements,
  getInventorySummary,
  importInventoryCsv,
  listInventory,
  listInventoryMovements,
  updateProduct,
  type ApiProduct,
  type ImportInventoryRow,
  type InventoryMovement,
  type InventorySummary,
} from '@/lib/api';
import { useAlert } from '../components/context/alert-context';
import { useProject } from '../components/context/project-context';
import { useTheme } from '../components/context/theme-context';
import { EmptyState } from '../components/ui/emptyState';
import { CustomDropdown } from '../components/ui/customDropdown';
import { SearchBar } from '../components/ui/searchbar';
import { StatsAnalytics, type StatCardProps } from '../components/ui/statsAnalytics';
import { TabBar, type TabBarItem } from '../components/ui/tabbar';
import { type Product, type ProductVariant } from '../lib/productsData';
import ProductAddModal from '../products/components/productAddModal';
import { AddProductButton } from '../products/components/button';
import { ImportExportButtons, handleExportData, parseCsvToRows } from './components/import_export';
import { InventoryTable } from './components/inventoryTable';

// ─── Design tokens (original — unchanged) ────────────────────────────────────
const T = {
  bg: 'radial-gradient(120% 100% at 50% 0%, #24104b 0%, #140836 42%, #0a0624 100%)',
  card: 'var(--dashboard-light-surface, #141446)',
  cardBorder: 'var(--dashboard-light-border, #1F1F51)',
  elevated: 'var(--dashboard-light-surface, #141446)',
  input: 'var(--dashboard-light-surface, #141446)',
  inputBorder: 'var(--dashboard-light-border, #1F1F51)',
  text: 'var(--dashboard-light-text, #ffffff)',
  textMuted: 'var(--dashboard-light-muted, rgba(219,212,255,0.45))',
  textSub: 'var(--dashboard-light-muted, rgba(234,229,255,0.72))',
  accent: '#a855f7',
  brandGradient: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
  green: '#22c55e',
  greenBg: 'rgba(34,197,94,0.12)',
  greenBorder: 'rgba(34,197,94,0.28)',
  red: '#ef4444',
  redBg: 'rgba(239,68,68,0.12)',
  redBorder: 'rgba(239,68,68,0.28)',
  yellow: '#eab308',
  yellowBg: 'rgba(234,179,8,0.12)',
  yellowBorder: 'rgba(234,179,8,0.28)',
  radius: 22,
  font: "'DM Sans', 'Segoe UI', sans-serif",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type StockAdjustmentType = 'IN' | 'OUT';

type StockAdjustmentModalState = {
  open: boolean; product: InventoryRow | null; movementType: StockAdjustmentType;
  quantity: string; notes: string; error: string | null;
};

type InventoryRow = ApiProduct & {
  _baseProductId: string;
  _variantKey?: string;
  _variantLabel?: string;
};

type InventoryContentTab = 'inventory' | 'movements';

const INVENTORY_CONTENT_TABS: readonly TabBarItem<InventoryContentTab>[] = [
  { id: 'inventory', label: 'INVENTORY' },
  { id: 'movements', label: 'RECENT MOVEMENTS' },
];

type ImportPopupState = { open: boolean; message: string; tone: 'success' | 'error' };

const getDefaultAdjustmentNote = (t: StockAdjustmentType) =>
  t === 'IN' ? 'Manual stock-in from inventory page' : 'Manual stock-out from inventory page';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;
const INVENTORY_VISIBLE_ROWS = 7;
const INVENTORY_ROW_HEIGHT_PX = 72;
const RECENT_MOVEMENTS_VISIBLE_ROWS = 5;
type ProductUpsertPayload = Omit<Parameters<typeof createProduct>[0], 'subdomain'>;

function toDashboardStatus(status?: string): 'active' | 'inactive' | 'draft' {
  const normalized = (status || '').toString().toLowerCase();
  if (normalized === 'active' || normalized === 'published') return 'active';
  if (normalized === 'inactive' || normalized === 'suspended') return 'inactive';
  return 'draft';
}

const RECENT_MOVEMENTS_LIMIT = 5;
const ALL_MOVEMENTS_LIMIT = 500;

function isLocalMovementId(movementId?: string | null): boolean {
  const id = String(movementId || '').trim();
  return id.startsWith('local-');
}

type VariantGroup = { id: string; name: string; options: Array<{ id: string; name: string }> };

function getVariantGroups(product: ApiProduct): VariantGroup[] {
  return Array.isArray(product.variants)
    ? product.variants
      .filter((variant) => Array.isArray(variant.options) && variant.options.length > 0)
      .map((variant) => ({
        id: String(variant.id || '').trim(),
        name: String(variant.name || '').trim() || 'Variant',
        options: variant.options
          .map((option) => ({ id: String(option.id || '').trim(), name: String(option.name || '').trim() || 'Option' }))
          .filter((option) => option.id),
      }))
      .filter((variant) => variant.id && variant.options.length > 0)
    : [];
}

function formatVariantLabel(product: ApiProduct, stockKey: string, precomputedGroups?: VariantGroup[]): string {
  const groups = precomputedGroups ?? getVariantGroups(product);
  if (!stockKey) return '';
  const labelParts = stockKey
    .split('__')
    .map((part) => {
      const [variantIdRaw, optionIdRaw] = part.split(':');
      const variantId = String(variantIdRaw || '').trim();
      const optionId = String(optionIdRaw || '').trim();
      const variant = groups.find((v) => v.id === variantId);
      const option = variant?.options.find((o) => o.id === optionId);
      if (variant && option) return `${variant.name}: ${option.name}`;
      if (variant) return `${variant.name}: ${optionId || '?'}`;
      return optionId ? `${variantId}:${optionId}` : variantId;
    })
    .filter(Boolean);
  return labelParts.join(' | ');
}

function expandInventoryRows(products: ApiProduct[]): InventoryRow[] {
  const rows: InventoryRow[] = [];

  products.forEach((product) => {
    const baseId = product.id;
    const variantEntries =
      product.hasVariants && product.variantStocks && typeof product.variantStocks === 'object'
        ? Object.entries(product.variantStocks)
        : [];

    // If no variant stocks, fall back to single base row
    if (variantEntries.length === 0) {
      rows.push({ ...product, _baseProductId: baseId });
      return;
    }

    const groups = getVariantGroups(product);
    const lowThresholdCandidate = Number(product.lowStockThreshold);
    const lowThreshold = Number.isFinite(lowThresholdCandidate) && lowThresholdCandidate >= 0
      ? lowThresholdCandidate
      : DEFAULT_LOW_STOCK_THRESHOLD;

    variantEntries.forEach(([variantKey, value]) => {
      const stockValue = Number(value);
      const onHandStock = Number.isFinite(stockValue) && stockValue >= 0 ? stockValue : 0;
      rows.push({
        ...product,
        id: `${baseId}__${variantKey}`,
        _baseProductId: baseId,
        _variantKey: variantKey,
        _variantLabel: formatVariantLabel(product, variantKey, groups) || variantKey,
        stock: onHandStock,
        onHandStock,
        reservedStock: 0,
        availableStock: onHandStock,
        lowStockThreshold: lowThreshold,
      });
    });
  });

  return rows;
}

// ─── Subdomain normalization ──────────────────────────────────────────────────
function normalizeSubdomain(value?: string | null): string {
  return (value || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function normalizeFilterValue(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

function getProductSubcategory(product: ApiProduct): string {
  const record = product as ApiProduct & {
    subCategory?: unknown;
    sub_category?: unknown;
    details?: { subcategory?: unknown; subCategory?: unknown; sub_category?: unknown };
    specifications?: { subcategory?: unknown; subCategory?: unknown; sub_category?: unknown };
  };
  return String(
    product.subcategory
    ?? record.subCategory
    ?? record.sub_category
    ?? record.details?.subcategory
    ?? record.details?.subCategory
    ?? record.details?.sub_category
    ?? record.specifications?.subcategory
    ?? record.specifications?.subCategory
    ?? record.specifications?.sub_category
    ?? ''
  ).trim();
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────
const Card = ({ children, style, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) => {
  const { theme } = useTheme();
  return (
    <div
      className={`${theme === 'dark' ? '' : 'admin-dashboard-panel border-0'} ${className}`}
      style={{
        background: theme === 'dark' ? T.card : undefined,
        border: theme === 'dark' ? `1px solid ${T.cardBorder}` : undefined,
        borderRadius: T.radius,
        ...style
      }}
    >
      {children}
    </div>
  );
};

const GhostBtn = ({
  onClick, disabled, children, title, style,
}: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; title?: string; style?: React.CSSProperties }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={(e) => {
        if (disabled) return;
        const target = e.currentTarget as HTMLButtonElement;
        if (isDark) {
          target.style.background = 'rgba(124,58,237,0.22)';
          target.style.borderColor = '#7c3aed';
          target.style.color = '#ffffff';
          target.style.boxShadow = '0 10px 24px rgba(124,58,237,0.28)';
        } else {
          target.style.background = 'rgba(124,58,237,0.10)';
          target.style.borderColor = 'rgba(124,58,237,0.38)';
          target.style.color = '#6d28d9';
          target.style.boxShadow = '0 8px 18px rgba(124,58,237,0.14)';
        }
        target.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLButtonElement;
        target.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'transparent';
        target.style.borderColor = isDark ? T.cardBorder : 'rgba(20,3,74,0.08)';
        target.style.color = isDark ? T.textSub : 'rgba(20,3,74,0.58)';
        target.style.transform = 'translateY(0)';
        target.style.boxShadow = 'none';
      }}
      style={{
        background: isDark ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: isDark ? `1px solid ${T.cardBorder}` : '1px solid rgba(20,3,74,0.08)',
        borderRadius: 8,
        color: isDark ? T.textSub : 'rgba(20,3,74,0.58)',
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', transition: 'opacity 0.15s, background-color 0.18s, border-color 0.18s, color 0.18s, transform 0.18s, box-shadow 0.18s', ...style,
      }}
    >{children}</button>
  );
};

const brandActionButtonStyle: React.CSSProperties = {
  background: T.brandGradient, border: 'none', borderRadius: 10, color: '#fff',
  fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center', gap: 6,
  height: 34, padding: '0 16px', boxShadow: '0 10px 28px rgba(112,21,214,0.35)',
};

// ENHANCED: movement type badge replaces plain colored text
const MovTypeBadge = ({ type }: { type: string }) => {
  const kind = String(type).toUpperCase();
  const palette =
    kind === 'IN'
      ? { bg: T.greenBg, border: T.greenBorder, color: T.green, label: 'IN' }
      : kind === 'OUT'
        ? { bg: T.redBg, border: T.redBorder, color: T.red, label: 'OUT' }
        : { bg: 'rgba(99,102,241,0.16)', border: 'rgba(99,102,241,0.34)', color: '#a5b4fc', label: kind || 'LOG' };
  return (
    <span style={{
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      color: palette.color,
      borderRadius: 5, fontSize: 10, fontWeight: 700,
      padding: '2px 7px', letterSpacing: 0.6, flexShrink: 0,
    }}>{palette.label}</span>
  );
};

const ModalBackdrop = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
  typeof document !== 'undefined'
    ? createPortal(
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 2147483000, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >{children}</motion.div>
      </motion.div>,
      document.body
    )
    : null
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const { selectedProject, loading: projectLoading } = useProject();
  const { showAlert, showConfirm } = useAlert();
  const selectedSubdomain = normalizeSubdomain(selectedProject?.subdomain);

  const [showAddModal, setShowAddModal] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<InventoryContentTab>('inventory');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [allMovements, setAllMovements] = useState<InventoryMovement[]>([]);
  const [showAllMovementsModal, setShowAllMovementsModal] = useState(false);
  const [loadingAllMovements, setLoadingAllMovements] = useState(false);
  const [allMovementsError, setAllMovementsError] = useState<string | null>(null);
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null);
  const [deleteConfirmMovement, setDeleteConfirmMovement] = useState<InventoryMovement | null>(null);
  const [selectedMovementIds, setSelectedMovementIds] = useState<string[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'selected' | 'all' | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{ mode: 'selected' | 'all'; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [stockModal, setStockModal] = useState<StockAdjustmentModalState>({
    open: false, product: null, movementType: 'IN', quantity: '1',
    notes: getDefaultAdjustmentNote('IN'), error: null,
  });
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState('');
  const [savingStockId, setSavingStockId] = useState<string | null>(null);
  const [updatingProductStatusId, setUpdatingProductStatusId] = useState<string | null>(null);
  const [openStatusMenuRowId, setOpenStatusMenuRowId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importPopup, setImportPopup] = useState<ImportPopupState>({ open: false, message: '', tone: 'success' });
  const importPopupTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineSaveLockRef = useRef<string | null>(null);
  const localStatusMovementsRef = useRef<InventoryMovement[]>([]);

  const movementTimestamp = useCallback((movement: InventoryMovement): number => {
    const raw = String(movement.createdAt || '').trim();
    const parsed = raw ? Date.parse(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  const mergeServerAndLocalStatusMovements = useCallback((serverMovements: InventoryMovement[], limit?: number) => {
    const normalizedServer = Array.isArray(serverMovements) ? serverMovements : [];

    const dedupedLocalStatus = localStatusMovementsRef.current.filter((localMovement) => {
      const localTime = movementTimestamp(localMovement);
      return !normalizedServer.some((serverMovement) => {
        if (String(serverMovement.type || '').toUpperCase() !== 'STATUS') return false;
        if (String(serverMovement.productId || '').trim() !== String(localMovement.productId || '').trim()) return false;
        if (String(serverMovement.notes || '').trim() !== String(localMovement.notes || '').trim()) return false;
        const serverTime = movementTimestamp(serverMovement);
        return Math.abs(serverTime - localTime) <= 2 * 60 * 1000;
      });
    });

    localStatusMovementsRef.current = dedupedLocalStatus;

    const merged = [...dedupedLocalStatus, ...normalizedServer]
      .sort((a, b) => movementTimestamp(b) - movementTimestamp(a));

    return typeof limit === 'number' ? merged.slice(0, limit) : merged;
  }, [movementTimestamp]);

  const sanitizeNumberInput = (input: HTMLInputElement) => {
    if (input.type !== 'number') return;
    if (!input.value) return;
    const cleaned = input.value.replace(/-/g, '');
    if (cleaned !== input.value) {
      input.value = cleaned;
    }
  };

  const handleNumberKeyDownCapture: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.tagName !== 'INPUT' || target.type !== 'number') return;
    if (event.key === '-' || event.key === 'Subtract') {
      event.preventDefault();
    }
  };

  const handleNumberInputCapture: React.FormEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.tagName !== 'INPUT' || target.type !== 'number') return;
    sanitizeNumberInput(target);
  };

  const handleNumberPasteCapture: React.ClipboardEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.tagName !== 'INPUT' || target.type !== 'number') return;
    const pasted = event.clipboardData.getData('text');
    if (pasted.includes('-')) {
      event.preventDefault();
      const cleaned = pasted.replace(/-/g, '');
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? target.value.length;
      const next = `${target.value.slice(0, start)}${cleaned}${target.value.slice(end)}`;
      target.value = next;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const showImportPopup = useCallback((message: string, tone: 'success' | 'error') => {
    if (importPopupTimerRef.current) window.clearTimeout(importPopupTimerRef.current);
    setImportPopup({ open: true, message, tone });
    const popupDuration = tone === 'success' ? 1500 : 3500;
    importPopupTimerRef.current = window.setTimeout(() => {
      setImportPopup((p) => ({ ...p, open: false }));
      importPopupTimerRef.current = null;
    }, popupDuration);
  }, []);

  useEffect(() => () => { if (importPopupTimerRef.current) window.clearTimeout(importPopupTimerRef.current); }, []);

  useEffect(() => {
    if (!openStatusMenuRowId) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-status-menu-root="true"]')) return;
      setOpenStatusMenuRowId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openStatusMenuRowId]);

  const stockValueLabel = useMemo(() => `₱${(summary?.stockValue || 0).toLocaleString()}`, [summary?.stockValue]);

  const handleSaveProduct = useCallback(async (productData: Partial<Product> & Record<string, unknown>): Promise<boolean> => {
    if (!selectedSubdomain) {
      showAlert('Set a subdomain for this website first to manage products.', 'error');
      return false;
    }
    try {
      const rawVariants = Array.isArray(productData.variants) ? productData.variants : [];
      const variants: ProductVariant[] = rawVariants
        .map((variant): ProductVariant => {
          const optionsRaw = Array.isArray((variant as { options?: unknown[] })?.options)
            ? (variant as { options: unknown[] }).options
            : [];
          const options = optionsRaw
            .map((option) => ({
              id: String((option as { id?: string })?.id || ''),
              name: String((option as { name?: string })?.name || '').trim(),
              priceAdjustment: Number((option as { priceAdjustment?: number })?.priceAdjustment || 0),
              image: String((option as { image?: string })?.image || '').trim(),
            }))
            .filter((option) => option.name || option.priceAdjustment !== 0 || option.image);
          return {
            id: String((variant as { id?: string })?.id || ''),
            name: String((variant as { name?: string })?.name || '').trim(),
            pricingMode: (variant as { pricingMode?: string })?.pricingMode === 'override' ? 'override' : 'modifier',
            options,
          };
        })
        .filter((variant) => variant.name || variant.options.length > 0);

      const basePrice = Number(productData.basePrice ?? productData.price ?? 0);
      const finalPrice = Number(productData.finalPrice ?? productData.price ?? 0);
      const discount = Number(productData.discount || 0);
      const discountType = String(productData.discountType || 'percentage') === 'fixed' ? 'fixed' : 'percentage';
      const hasVariants = Boolean(productData.hasVariants) && variants.length > 0;
      const variantStocks = hasVariants && productData.variantStocks && typeof productData.variantStocks === 'object'
        ? Object.entries(productData.variantStocks as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, value]) => {
          const parsed = Number(value);
          acc[key] = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
          return acc;
        }, {})
        : {};
      const variantPrices = hasVariants && productData.variantPrices && typeof productData.variantPrices === 'object'
        ? Object.entries(productData.variantPrices as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, value]) => {
          const parsed = Number(value);
          acc[key] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
          return acc;
        }, {})
        : {};
      const priceRangeMin = hasVariants ? Number(productData.priceRangeMin ?? finalPrice) : finalPrice;
      const priceRangeMax = hasVariants ? Number(productData.priceRangeMax ?? finalPrice) : finalPrice;
      const computedStock = hasVariants
        ? Object.values(variantStocks).reduce((sum, amount) => sum + amount, 0)
        : Number(productData.stock || 0);
      const normalizedLowStockThreshold = Math.max(
        0,
        Number.isFinite(Number(productData.lowStockThreshold))
          ? Number(productData.lowStockThreshold)
          : DEFAULT_LOW_STOCK_THRESHOLD
      );

      const payload: ProductUpsertPayload = {
        name: String(productData.name || ''),
        sku: String(productData.sku || ''),
        category: String(productData.category || ''),
        subcategory: String(productData.subcategory || ''),
        subCategory: String(productData.subcategory || ''),
        sub_category: String(productData.subcategory || ''),
        description: String(productData.description || ''),
        price: finalPrice,
        basePrice,
        costPrice: productData.costPrice !== undefined ? Number(productData.costPrice || 0) : null,
        finalPrice,
        compareAtPrice: discount > 0 ? basePrice : null,
        discount,
        discountType,
        hasVariants,
        variants: hasVariants ? variants : [],
        variantStocks: hasVariants ? variantStocks : {},
        variantPrices: hasVariants ? variantPrices : {},
        priceRangeMin,
        priceRangeMax,
        stock: computedStock,
        lowStockThreshold: normalizedLowStockThreshold,
        status: toDashboardStatus(String(productData.status || 'draft')),
        images: Array.isArray(productData.images) ? (productData.images as string[]) : [],
      };

      await createProduct({
        subdomain: selectedSubdomain,
        ...payload,
        slug: payload.name.toLowerCase().replace(/\s+/g, '-'),
      });
      await loadData();
      setShowAddModal(false);
      showImportPopup('Product added successfully!', 'success');
      return true;
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to save product', 'error');
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubdomain, showAlert, showImportPopup]);

  const loadData = useCallback(async () => {
    if (projectLoading) {
      setLoading(true);
      return;
    }
    setLoading(true); setError(null);
    if (!selectedSubdomain) {
      setItems([]);
      setSummary(null);
      setMovements([]);
      setLoading(false);
      return;
    }
    try {
      const [invRes, summaryRes, movementRes] = await Promise.all([
        listInventory({ subdomain: selectedSubdomain, limit: 500, search: search || undefined }),
        getInventorySummary({ subdomain: selectedSubdomain, search: search || undefined }),
        listInventoryMovements({ subdomain: selectedSubdomain, limit: RECENT_MOVEMENTS_LIMIT }),
      ]);
      setItems(Array.isArray(invRes.items) ? (invRes.items as InventoryRow[]) : []);
      setSummary(summaryRes.data || null);
      const serverMovements = Array.isArray(movementRes.items) ? movementRes.items : [];
      setMovements(mergeServerAndLocalStatusMovements(serverMovements, RECENT_MOVEMENTS_LIMIT));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally { setLoading(false); }
  }, [projectLoading, search, selectedSubdomain, mergeServerAndLocalStatusMovements]);

  useEffect(() => { void loadData(); }, [loadData]);

  const loadAllMovements = useCallback(async () => {
    if (projectLoading) {
      setLoadingAllMovements(true);
      return;
    }
    setLoadingAllMovements(true); setAllMovementsError(null);
    if (!selectedSubdomain) {
      setAllMovements([]);
      setLoadingAllMovements(false);
      return;
    }
    try {
      const res = await listInventoryMovements({ subdomain: selectedSubdomain, limit: ALL_MOVEMENTS_LIMIT });
      const serverMovements = Array.isArray(res.items) ? res.items : [];
      setAllMovements(mergeServerAndLocalStatusMovements(serverMovements));
    } catch (err) {
      setAllMovementsError(err instanceof Error ? err.message : 'Failed to load movement history');
    } finally { setLoadingAllMovements(false); }
  }, [projectLoading, selectedSubdomain, mergeServerAndLocalStatusMovements]);

  const openAllMovementsModal = useCallback(() => { setShowAllMovementsModal(true); void loadAllMovements(); }, [loadAllMovements]);
  const closeAllMovementsModal = useCallback(() => {
    setShowAllMovementsModal(false);
    setSelectedMovementIds([]);
    setBulkDeleteMode(null);
  }, []);

  useEffect(() => {
    if (!showAllMovementsModal) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAllMovementsModal(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [showAllMovementsModal, closeAllMovementsModal]);

  useEffect(() => {
    if (!showAllMovementsModal) return;
    setSelectedMovementIds((prev) => prev.filter((id) => allMovements.some((m) => m.id === id)));
  }, [allMovements, showAllMovementsModal]);

  const getStockNumbers = useCallback((p: InventoryRow) => {
    const onHand = Number(p.onHandStock ?? p.stock ?? 0);
    const reserved = Number(p.reservedStock ?? 0);
    const available = Number(p.availableStock ?? Math.max(0, onHand - reserved));
    const lowThreshold = Number(p.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD);
    return { onHand, reserved, available, lowThreshold };
  }, []);

  const subcategoryCounts = useMemo(() => items.reduce<Record<string, number>>((acc, product) => {
    const subcategory = String(getProductSubcategory(product) || '').trim();
    if (!subcategory) return acc;
    acc[subcategory] = (acc[subcategory] || 0) + 1;
    return acc;
  }, {}), [items]);

  const categoryOptions = useMemo(
    () => Object.keys(subcategoryCounts).sort((a, b) => a.localeCompare(b)),
    [subcategoryCounts]
  );

  const categoryFilterOptions = useMemo(
    () => [
      { value: 'all', label: `All (${items.length})` },
      ...categoryOptions.map((category) => ({ value: category, label: `${category} (${subcategoryCounts[category]})` })),
    ],
    [items.length, categoryOptions, subcategoryCounts]
  );

  const categoryDropdownOptions = useMemo(
    () => categoryFilterOptions.map((option) => ({ id: option.value, label: option.label })),
    [categoryFilterOptions]
  );

  const inventoryRows = useMemo(() => expandInventoryRows(items), [items]);

  const filteredItems = useMemo(() => inventoryRows.filter((p) => {
    const q = normalizeFilterValue(search);
    const subcategory = getProductSubcategory(p);
    const normalizedSubcategory = normalizeFilterValue(subcategory);
    const normalizedCategoryFilter = normalizeFilterValue(categoryFilter);
    const matchesSearch = !q ||
      normalizeFilterValue(String(p.name || '')).includes(q) ||
      normalizeFilterValue(String(p._variantLabel || '')).includes(q) ||
      normalizeFilterValue(String(p.sku || '')).includes(q) ||
      normalizeFilterValue(String(p.category || '')).includes(q) ||
      normalizedSubcategory.includes(q);
    const matchesCategory = normalizedCategoryFilter === 'all' || normalizedSubcategory === normalizedCategoryFilter;
    return matchesSearch && matchesCategory;
  }), [inventoryRows, search, categoryFilter]);

  const openStockModal = useCallback((product: InventoryRow, movementType: StockAdjustmentType) => {
    const baseId = product._baseProductId || product.id;
    const normalizedProduct: InventoryRow = { ...product, id: baseId, _baseProductId: baseId };
    setStockModal({
      open: true,
      product: normalizedProduct,
      movementType,
      quantity: '1',
      notes: getDefaultAdjustmentNote(movementType),
      error: null,
    });
  }, []);

  const closeStockModal = useCallback(() => {
    if (adjustingId) return;
    setStockModal((p) => ({ ...p, open: false, product: null, error: null }));
  }, [adjustingId]);

  useEffect(() => {
    if (!stockModal.open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') closeStockModal(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [stockModal.open, closeStockModal]);

  const submitStockAdjustment = useCallback(async () => {
    if (!stockModal.product) return;
    const qty = parseInt(stockModal.quantity, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      setStockModal((p) => ({ ...p, error: 'Please enter a valid quantity greater than zero.' })); return;
    }
    const { onHand } = getStockNumbers(stockModal.product);
    if (stockModal.movementType === 'OUT' && qty > onHand) {
      setStockModal((p) => ({ ...p, error: `Cannot deduct ${qty}. Current stock is ${onHand}.` })); return;
    }
    try {
      setAdjustingId(stockModal.product.id);
      setStockModal((p) => ({ ...p, error: null }));
      await adjustInventoryStock({
        productId: stockModal.product.id,
        movementType: stockModal.movementType,
        quantity: qty,
        notes: stockModal.notes.trim() || getDefaultAdjustmentNote(stockModal.movementType),
      });
      await loadData();
      if (showAllMovementsModal) await loadAllMovements();
      setStockModal((p) => ({ ...p, open: false, product: null, error: null }));
      showImportPopup('Stock updated successfully!', 'success');
    } catch (err) {
      setStockModal((p) => ({ ...p, error: err instanceof Error ? err.message : 'Failed to adjust stock' }));
    } finally { setAdjustingId(null); }
  }, [stockModal, getStockNumbers, loadData, showAllMovementsModal, loadAllMovements, showImportPopup]);

  const openDeleteMovementConfirm = useCallback((movement: InventoryMovement) => {
    if (!movement?.id) return;
    setDeleteConfirmMovement(movement);
  }, []);

  const closeDeleteMovementConfirm = useCallback(() => {
    if (deletingMovementId) return;
    setDeleteConfirmMovement(null);
  }, [deletingMovementId]);

  const confirmDeleteMovement = useCallback(async () => {
    if (!deleteConfirmMovement?.id) return;

    try {
      const movementId = String(deleteConfirmMovement.id || '').trim();
      setDeletingMovementId(movementId);

      if (movementId && !isLocalMovementId(movementId)) {
        await deleteInventoryMovement(movementId, {
          subdomain: selectedSubdomain || undefined,
          projectId: selectedProject?.id ? String(selectedProject.id) : undefined,
        });
      }

      if (movementId && isLocalMovementId(movementId)) {
        localStatusMovementsRef.current = localStatusMovementsRef.current.filter(
          (movement) => String(movement.id || '').trim() !== movementId
        );
      }

      await loadData();
      if (showAllMovementsModal) {
        await loadAllMovements();
      }
      setSelectedMovementIds((prev) => prev.filter((id) => id !== movementId));
      setDeleteConfirmMovement(null);
      showImportPopup('Inventory movement deleted.', 'success');
    } catch (err) {
      showImportPopup(
        err instanceof Error ? err.message : 'Failed to delete movement',
        'error'
      );
    } finally {
      setDeletingMovementId(null);
    }
  }, [deleteConfirmMovement, loadAllMovements, loadData, selectedProject?.id, selectedSubdomain, showAllMovementsModal, showImportPopup]);

  useEffect(() => {
    if (!deleteConfirmMovement) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDeleteMovementConfirm(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [closeDeleteMovementConfirm, deleteConfirmMovement]);

  const allMovementIds = useMemo(
    () => Array.from(new Set(allMovements.map((m) => String(m.id || '').trim()).filter(Boolean))),
    [allMovements]
  );
  const selectedCount = selectedMovementIds.length;
  const totalMovements = allMovements.length;
  const isBulkDeleting = Boolean(bulkDeleteMode);
  const isAllMovementsSelected = selectedCount > 0 && selectedCount === allMovementIds.length;
  const openBulkDeleteConfirm = useCallback((mode: 'selected' | 'all') => {
    const count = mode === 'selected' ? selectedMovementIds.length : allMovements.length;
    if (count === 0) return;
    setBulkDeleteConfirm({ mode, count });
  }, [allMovements.length, selectedMovementIds.length]);

  const closeBulkDeleteConfirm = useCallback(() => {
    if (isBulkDeleting) return;
    setBulkDeleteConfirm(null);
  }, [isBulkDeleting]);

  const toggleMovementSelection = useCallback((movementId: string) => {
    setSelectedMovementIds((prev) => (prev.includes(movementId) ? prev.filter((id) => id !== movementId) : [...prev, movementId]));
  }, []);

  const toggleSelectAllMovements = useCallback(() => {
    if (allMovementIds.length === 0) return;
    setSelectedMovementIds((prev) => (prev.length === allMovementIds.length ? [] : allMovementIds));
  }, [allMovementIds]);

  const deleteSelectedMovements = useCallback(async () => {
    const count = selectedMovementIds.length;
    if (count === 0) return;
    try {
      setBulkDeleteMode('selected');
      const localIds = selectedMovementIds.filter((id) => isLocalMovementId(id));
      const remoteIds = selectedMovementIds.filter((id) => !isLocalMovementId(id));

      let backendDeletedCount = 0;
      let backendMessage = '';
      if (remoteIds.length > 0) {
        const res = await bulkDeleteInventoryMovements({
          ids: remoteIds,
          subdomain: selectedSubdomain || undefined,
          projectId: selectedProject?.id ? String(selectedProject.id) : undefined,
        });
        backendDeletedCount = Number(res.data?.deleted ?? remoteIds.length);
        backendMessage = String(res.message || '').trim();
      }

      if (localIds.length > 0) {
        const localIdSet = new Set(localIds);
        localStatusMovementsRef.current = localStatusMovementsRef.current.filter(
          (movement) => !localIdSet.has(String(movement.id || '').trim())
        );
      }

      await loadData();
      if (showAllMovementsModal) await loadAllMovements();
      setSelectedMovementIds([]);

      const deletedCount = backendDeletedCount + localIds.length;
      showImportPopup(
        backendMessage || `Deleted ${deletedCount} selected movement${deletedCount === 1 ? '' : 's'}.`,
        'success'
      );
    } catch (err) {
      showImportPopup(
        err instanceof Error ? err.message : 'Failed to delete selected movements',
        'error'
      );
    } finally {
      setBulkDeleteMode(null);
    }
  }, [selectedMovementIds, selectedSubdomain, selectedProject?.id, loadData, loadAllMovements, showAllMovementsModal, showImportPopup]);

  const deleteAllMovements = useCallback(async () => {
    const currentTotal = allMovements.length;
    if (currentTotal === 0) return;
    try {
      setBulkDeleteMode('all');
      const res = await bulkDeleteInventoryMovements({
        deleteAll: true,
        subdomain: selectedSubdomain || undefined,
        projectId: selectedProject?.id ? String(selectedProject.id) : undefined,
      });

      localStatusMovementsRef.current = [];
      await loadData();
      if (showAllMovementsModal) await loadAllMovements();
      setSelectedMovementIds([]);

      const deletedCount = res.data?.deleted ?? currentTotal;
      showImportPopup(res.message || `Deleted all ${deletedCount} movement${deletedCount === 1 ? '' : 's'}.`, 'success');
    } catch (err) {
      showImportPopup(
        err instanceof Error ? err.message : 'Failed to delete all movements',
        'error'
      );
    } finally {
      setBulkDeleteMode(null);
    }
  }, [allMovements.length, loadAllMovements, loadData, selectedProject?.id, selectedSubdomain, showAllMovementsModal, showImportPopup]);

  const confirmBulkDelete = useCallback(async () => {
    if (!bulkDeleteConfirm) return;
    if (bulkDeleteConfirm.mode === 'selected') {
      await deleteSelectedMovements();
    } else {
      await deleteAllMovements();
    }
    setBulkDeleteConfirm(null);
  }, [bulkDeleteConfirm, deleteAllMovements, deleteSelectedMovements]);

  const isAdjustingFromModal = Boolean(stockModal.product && adjustingId === stockModal.product.id);
  const modalOnHand = stockModal.product ? getStockNumbers(stockModal.product).onHand : 0;

  const prependLocalMovement = useCallback((movement: InventoryMovement) => {
    if (String(movement.type || '').toUpperCase() === 'STATUS') {
      localStatusMovementsRef.current = [movement, ...localStatusMovementsRef.current]
        .sort((a, b) => movementTimestamp(b) - movementTimestamp(a))
        .slice(0, 100);
    }
    setMovements((prev) => [movement, ...prev].slice(0, RECENT_MOVEMENTS_LIMIT));
    if (showAllMovementsModal) {
      setAllMovements((prev) => [movement, ...prev]);
    }
  }, [showAllMovementsModal, movementTimestamp]);

  const startInlineStockEdit = useCallback((product: InventoryRow, currentOnHand: number) => {
    setEditingStockId(product.id);
    setEditingStockValue(String(currentOnHand));
  }, []);

  const clearInlineStockEdit = useCallback(() => {
    setEditingStockId(null);
    setEditingStockValue('');
  }, []);

  const cancelInlineStockEdit = useCallback(() => {
    if (savingStockId) return;
    clearInlineStockEdit();
  }, [clearInlineStockEdit, savingStockId]);

  const saveInlineStockEdit = useCallback(async (product: InventoryRow) => {
    if (savingStockId === product.id || inlineSaveLockRef.current === product.id) return;
    const normalizedValue = editingStockValue.trim();
    if (!normalizedValue) {
      clearInlineStockEdit();
      return;
    }
    const next = parseInt(editingStockValue, 10);
    if (!Number.isFinite(next) || next < 0) {
      showImportPopup('Stock must be a valid number 0 or greater.', 'error');
      return;
    }
    const { onHand } = getStockNumbers(product);
    if (next === onHand) {
      clearInlineStockEdit();
      return;
    }

    const baseProductId = product._baseProductId || product.id;

    // Variant row: update variantStocks map via inventory adjust endpoint (logs movement)
    if (product._variantKey) {
      const baseProduct = items.find((p) => p.id === baseProductId);
      if (!baseProduct) {
        showImportPopup('Base product not found for this variant.', 'error');
        clearInlineStockEdit();
        return;
      }
      const beforeValue = Number(baseProduct.variantStocks?.[product._variantKey] ?? 0);
      const nextValue = Math.max(0, next);

      try {
        inlineSaveLockRef.current = product.id;
        setSavingStockId(product.id);
        await adjustInventoryStock({
          productId: baseProductId,
          variantKey: product._variantKey,
          setVariantStock: nextValue,
          movementType: nextValue >= beforeValue ? 'IN' : 'OUT',
          notes: `Variant stock updated (${product._variantLabel || product._variantKey})`,
        });
        prependLocalMovement({
          id: `local-inline-${Date.now()}-${product.id}`,
          productId: baseProductId,
          productName: baseProduct.name || 'Product',
          productSku: baseProduct.sku || null,
          type: nextValue >= beforeValue ? 'IN' : 'OUT',
          quantity: Math.abs(nextValue - beforeValue),
          notes: `Variant stock updated (${product._variantLabel || product._variantKey})`,
          beforeOnHand: beforeValue,
          afterOnHand: nextValue,
          createdAt: new Date().toISOString(),
        });
        await loadData();
        if (showAllMovementsModal) await loadAllMovements();
        clearInlineStockEdit();
        showImportPopup('Variant stock updated.', 'success');
      } catch (err) {
        showImportPopup(err instanceof Error ? err.message : 'Failed to update variant stock.', 'error');
      } finally {
        if (inlineSaveLockRef.current === product.id) inlineSaveLockRef.current = null;
        setSavingStockId(null);
      }
      return;
    }

    // Base product row: keep previous behavior
    const quantity = Math.abs(next - onHand);
    const movementType: StockAdjustmentType = next > onHand ? 'IN' : 'OUT';
    const movementNotes =
      movementType === 'IN'
        ? 'Manual stock-in from inventory table input'
        : 'Manual stock-out from inventory table input';
    try {
      inlineSaveLockRef.current = product.id;
      setSavingStockId(product.id);
      await adjustInventoryStock({
        productId: baseProductId,
        movementType,
        quantity,
        notes: movementNotes,
      });
      prependLocalMovement({
        id: `local-inline-${Date.now()}-${product.id}`,
        productId: baseProductId,
        productName: product.name || 'Product',
        productSku: product.sku || null,
        type: movementType,
        quantity,
        notes: movementNotes,
        beforeOnHand: onHand,
        afterOnHand: next,
        createdAt: new Date().toISOString(),
      });
      await loadData();
      if (showAllMovementsModal) await loadAllMovements();
      clearInlineStockEdit();
      showImportPopup('Stock updated.', 'success');
    } catch (err) {
      showImportPopup(err instanceof Error ? err.message : 'Failed to update stock.', 'error');
    } finally {
      if (inlineSaveLockRef.current === product.id) inlineSaveLockRef.current = null;
      setSavingStockId(null);
    }
  }, [clearInlineStockEdit, editingStockValue, getStockNumbers, items, loadAllMovements, loadData, prependLocalMovement, savingStockId, showAllMovementsModal, showImportPopup]);

  const updateProductStatus = useCallback(async (product: InventoryRow, nextStatus: 'active' | 'inactive') => {
    try {
      const baseProductId = product._baseProductId || product.id;
      const baseProduct = items.find((item) => item.id === baseProductId);
      const hasVariants =
        Boolean(product._variantKey)
        || Boolean(baseProduct?.hasVariants)
        || Boolean(baseProduct?.variantStocks && Object.keys(baseProduct.variantStocks).length > 0);

      if (nextStatus === 'inactive' && hasVariants) {
        const confirmed = await showConfirm(
          'Inactivating this product will also inactivate all of its variants. The product will no longer be visible in the store.',
          'Confirm Inactivation',
          { cancelText: 'Cancel', confirmText: 'Confirm Inactivation' }
        );
        if (!confirmed) return;
      }

      const previousStatus = String(baseProduct?.status ?? product.status ?? 'active').toLowerCase() === 'inactive'
        ? 'inactive'
        : 'active';

      setUpdatingProductStatusId(baseProductId);
      await updateProduct(baseProductId, { status: nextStatus });
      await loadData();
      prependLocalMovement({
        id: `local-status-${Date.now()}-${baseProductId}`,
        productId: baseProductId,
        productName: product.name || 'Product',
        type: 'STATUS',
        quantity: 0,
        notes: `Product status changed from ${previousStatus} → ${nextStatus}`,
        createdAt: new Date().toISOString(),
      });
      showImportPopup('Product status updated.', 'success');
    } catch (err) {
      showImportPopup(err instanceof Error ? err.message : 'Failed to update product status.', 'error');
    } finally {
      setUpdatingProductStatusId(null);
    }
  }, [items, loadData, prependLocalMovement, showConfirm, showImportPopup]);

  const handleExport = useCallback(handleExportData(search, selectedSubdomain, setExporting), [search, selectedSubdomain]);

  const handleImport = useCallback(() => { fileInputRef.current?.click(); }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsvToRows(text);
      if (rows.length === 0) { showImportPopup('Import failed: No valid rows in CSV. Use header "sku" and optionally "onHandStock", "reservedStock", "lowStockThreshold".', 'error'); return; }
      const result = await importInventoryCsv({ rows, subdomain: selectedSubdomain || undefined });
      if (result.updated && result.updated > 0) await loadData();
      if (result.errors && result.errors.length > 0) {
        const s = result.errors.slice(0, 2).map((e) => `Row ${e.row} (${e.sku}): ${e.message}`).join(' | ');
        showImportPopup(`Import completed with errors. ${s}${result.errors.length > 2 ? ` | +${result.errors.length - 2} more` : ''}`, 'error');
      } else { showImportPopup(result.message ?? `Import successful. Updated ${result.updated ?? 0} product(s).`, 'success'); }
    } catch (err) { showImportPopup(err instanceof Error ? `Import failed: ${err.message}` : 'Import failed', 'error'); }
    finally { setImporting(false); }
  }, [loadData, showImportPopup, selectedSubdomain]);

  // ─── Config ─────────────────────────────────────────────────────────────────
  const statCards: StatCardProps[] = [
    { id: 'total', label: 'TOTAL PRODUCTS', icon: Package, accent: '#86a8ff', value: summary?.totalProducts ?? 0 },
    { id: 'low', label: 'LOW STOCK', icon: AlertTriangle, accent: '#b178ff', value: summary?.lowStock ?? 0 },
    { id: 'out', label: 'OUT OF STOCK', icon: Filter, accent: '#ff4f8c', value: summary?.outOfStock ?? 0 },
    { id: 'value', label: 'STOCK VALUE', icon: TrendingUp, accent: '#22d3a4', value: stockValueLabel },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: T.input, border: `1px solid ${T.inputBorder}`,
    borderRadius: 10, color: T.text, padding: '11px 14px',
    fontSize: 14, outline: 'none',
  };

  // ENHANCED: movement row — badge + hover highlight
  const MovementRow = ({
    m,
    onDelete,
    isDeleting,
    selectable,
    selected,
    onToggleSelect,
  }: {
    m: InventoryMovement;
    onDelete?: (movement: InventoryMovement) => void;
    isDeleting?: boolean;
    selectable?: boolean;
    selected?: boolean;
    onToggleSelect?: (movementId: string) => void;
  }) => {
    const kind = String(m.type || '').toUpperCase();
    const color = kind === 'IN' ? T.green : kind === 'OUT' ? T.red : '#a5b4fc';
    const quantityText = kind === 'IN' ? `+${m.quantity}` : kind === 'OUT' ? String(m.quantity) : '•';
    const noteText = String(m.notes || 'Inventory movement');
    const statusTransitionMatch = noteText.match(/^Product status changed from\s+(active|inactive)\s*(?:->|→)\s*(active|inactive)$/i);
    const statusSingleMatch = noteText.match(/^Product status changed to\s+(active|inactive)$/i);
    const fromStatus = statusTransitionMatch?.[1]?.toLowerCase();
    const toStatus = statusTransitionMatch?.[2]?.toLowerCase() || statusSingleMatch?.[1]?.toLowerCase();
    const statusWordColor = (status?: string) => (status === 'active' ? T.green : status === 'inactive' ? T.red : T.text);
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, marginBottom: 8 }}>
        {selectable && (
          <label
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              minWidth: 24,
              height: 24,
              marginTop: 13,
              borderRadius: 7,
              border: `1px solid ${selected ? '#a855f7' : T.cardBorder}`,
              background: selected ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.04)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              aria-label="Select inventory item"
              checked={Boolean(selected)}
              onChange={() => onToggleSelect?.(m.id)}
              style={{ accentColor: '#a855f7', width: 14, height: 14, cursor: 'pointer' }}
            />
          </label>
        )}
        <div
          style={{
            flex: 1,
            background: selected ? 'rgba(168,85,247,0.12)' : T.elevated,
            border: `1px solid ${selected ? '#a855f7' : T.cardBorder}`,
            borderRadius: 10,
            padding: '11px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'border-color 0.15s, background 0.15s',
            cursor: selectable && m.id ? 'pointer' : 'default',
          }}
          onClick={() => {
            if (!selectable || !m.id) return;
            onToggleSelect?.(m.id);
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(135,153,192,0.6)';
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = selected ? '#a855f7' : T.cardBorder;
            (e.currentTarget as HTMLDivElement).style.background = selected ? 'rgba(168,85,247,0.12)' : T.elevated;
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MovTypeBadge type={m.type || ''} />
            <div>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{m.productName || 'Product'}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                {statusTransitionMatch ? (
                  <>
                    Product status changed from{' '}
                    <span style={{ color: statusWordColor(fromStatus), fontWeight: 700 }}>
                      {fromStatus}
                    </span>
                    {' '}→{' '}
                    <span style={{ color: statusWordColor(toStatus), fontWeight: 700 }}>
                      {toStatus}
                    </span>
                  </>
                ) : statusSingleMatch ? (
                  <>
                    Product status changed to{' '}
                    <span style={{ color: statusWordColor(toStatus), fontWeight: 700 }}>
                      {toStatus}
                    </span>
                  </>
                ) : (
                  noteText
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color, fontWeight: 700, fontSize: 14 }}>{quantityText}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                {m.createdAt ? new Date(m.createdAt).toLocaleString() : '--'}
              </div>
            </div>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(m); }}
                disabled={isDeleting}
                title={isDeleting ? 'Deleting movement...' : 'Delete movement'}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: `1px solid ${T.redBorder}`,
                  background: 'rgba(239,68,68,0.08)',
                  color: T.red,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.55 : 1,
                  padding: 0,
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const RecentMovementTableRow = ({ m, index, isLast }: { m: InventoryMovement; index: number; isLast: boolean }) => {
    const kind = String(m.type || '').toUpperCase();
    const quantityValue = Number(m.quantity);
    const safeQuantity = Number.isFinite(quantityValue) ? Math.abs(quantityValue) : 0;
    const color = kind === 'IN' ? T.green : kind === 'OUT' ? T.red : '#a5b4fc';
    const quantityText = kind === 'IN' ? `+${safeQuantity}` : kind === 'OUT' ? `-${safeQuantity}` : `${safeQuantity}`;
    const noteText = String(m.notes || 'Inventory movement');
    const statusTransitionMatch = noteText.match(/^Product status changed from\s+(active|inactive)\s*(?:->|→)\s*(active|inactive)$/i);
    const statusSingleMatch = noteText.match(/^Product status changed to\s+(active|inactive)$/i);
    const fromStatus = statusTransitionMatch?.[1]?.toLowerCase();
    const toStatus = statusTransitionMatch?.[2]?.toLowerCase() || statusSingleMatch?.[1]?.toLowerCase();
    const statusWordColor = (status?: string) => (status === 'active' ? T.green : status === 'inactive' ? T.red : T.text);
    const rowBackground = isDark ? 'transparent' : '#FFFFFF';
    const rowHoverBackground = isDark ? 'rgba(255,255,255,0.03)' : '#F8F7FF';
    const rowDividerColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(20,3,74,0.08)';

    return (
      <motion.tr
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
        className="group"
        style={{
          background: rowBackground,
          borderBottom: isLast ? 'none' : `1px solid ${rowDividerColor}`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLTableRowElement).style.background = rowHoverBackground;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLTableRowElement).style.background = rowBackground;
        }}
      >
        <td className="px-5 py-4 align-middle whitespace-nowrap text-center">
          <div className="flex w-full justify-center">
            <MovTypeBadge type={m.type || ''} />
          </div>
        </td>

        <td className="px-5 py-4 align-middle text-center">
          <div className="min-w-0 text-center">
            <div className="text-sm font-semibold truncate text-center" style={{ color: T.text }}>
              {m.productName || 'Product'}
            </div>
            <div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-center" style={{ color: T.textMuted }}>
              {m.productSku || 'No SKU'}
            </div>
          </div>
        </td>

        <td className="px-5 py-4 align-middle text-center">
          <div className="min-w-0 text-center text-sm" style={{ color: T.textMuted }}>
            {statusTransitionMatch ? (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                Product status changed from{' '}
                <span style={{ color: statusWordColor(fromStatus), fontWeight: 800, textTransform: 'uppercase' }}>{fromStatus}</span>
                <span style={{ opacity: 0.45 }}>→</span>
                <span style={{ color: statusWordColor(toStatus), fontWeight: 800, textTransform: 'uppercase' }}>{toStatus}</span>
              </span>
            ) : statusSingleMatch ? (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                Product status changed to{' '}
                <span style={{ color: statusWordColor(toStatus), fontWeight: 800, textTransform: 'uppercase' }}>{toStatus}</span>
              </span>
            ) : (
              <span className="wrap-break-word">{noteText}</span>
            )}
          </div>
        </td>

        <td className="px-5 py-4 align-middle whitespace-nowrap text-center">
          <div className="inline-flex w-full items-center justify-center text-sm font-bold tabular-nums" style={{ color, minWidth: 24 }}>
            {quantityText}
          </div>
        </td>

        <td className="px-5 py-4 align-middle whitespace-nowrap text-center">
          <div className="text-sm text-center" style={{ color: T.textMuted }}>
            {m.createdAt ? new Date(m.createdAt).toLocaleString() : '--'}
          </div>
        </td>
      </motion.tr>
    );
  };

  return (
    <div
      className="dashboard-landing-light"
      style={{ fontFamily: T.font, color: T.text, minHeight: '100%', position: 'relative' }}
      onKeyDownCapture={handleNumberKeyDownCapture}
      onInputCapture={handleNumberInputCapture}
      onPasteCapture={handleNumberPasteCapture}
    >
      <input ref={fileInputRef} type="file" accept=".csv" title="Import CSV" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Centered success/error popup */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {importPopup.open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 2147483000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                background: 'rgba(10, 8, 28, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                style={{
                  width: '100%',
                  maxWidth: 250,
                  borderRadius: 14,
                  border: `1px solid ${importPopup.tone === 'success' ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.35)'}`,
                  padding: '12px 16px',
                  background: '#181a59',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
                }}
              >
                <p style={{ color: '#ffffff', fontSize: 'clamp(12px, 1.4vw, 16px)', fontWeight: 700, letterSpacing: -0.1, lineHeight: 1.25, textAlign: 'center', margin: 0 }}>
                  {importPopup.message}
                </p>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                  {importPopup.tone === 'success'
                    ? <CheckCircle size={24} color={T.green} />
                    : <AlertTriangle size={24} color={T.red} />}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div style={{ maxWidth: 1090, margin: '0 auto', padding: '36px 22px 30px', position: 'relative', zIndex: 1 }}>

        {/* ── Title (original) ────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <h1
            className="text-4xl sm:text-6xl lg:text-[76px] font-black tracking-[-1.8px] leading-[1.2] [font-family:var(--font-outfit),sans-serif]"
            style={{ color: colors.text.primary, margin: 0 }}
          >
            <span>My </span>
            <span
              className={`inline-block bg-clip-text text-transparent bg-linear-to-r ${theme === 'dark' ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
              style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}
            >
              Inventory
            </span>
          </h1>
          
        </div>

        <div className="mb-6 flex justify-center">
          <TabBar<InventoryContentTab>
            tabs={INVENTORY_CONTENT_TABS}
            activeTab={activeContentTab}
            onTabChange={setActiveContentTab}
            theme={theme as 'light' | 'dark'}
            underlineLayoutId="inventory-content-tab-underline"
          />
        </div>

        {/* ── Search bar (original) ───────────────────────────────────────── */}
        <SearchBar
          value={search}
          onChange={setSearch}
          theme={theme}
          placeholder="Search templates, designs, or actions"
          className="mb-7 max-w-215 mx-auto"
        />

        {/* ── Stat cards (reused shared component) ─────────────────────────── */}
        <div className="mb-6">
          <StatsAnalytics
            cards={statCards}
            gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            gap="gap-3"
          />
        </div>

        {activeContentTab === 'inventory' && (
          <>
            {/* ── Toolbar (original layout) ───────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <CustomDropdown
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={categoryDropdownOptions}
                  title="Category"
                />
                <AddProductButton
                  onClick={() => setShowAddModal(true)}
                  disabled={false}
                  title="Add Product"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <ImportExportButtons
                  theme={theme}
                  search={search}
                  selectedSubdomain={selectedSubdomain}
                  importing={importing}
                  exporting={exporting}
                  onImportComplete={(result, success) => {
                    if (success) {
                      showImportPopup(result.message ?? `Import successful. Updated ${result.updated ?? 0} product(s).`, 'success');
                    } else if (result.errors && result.errors.length > 0) {
                      const s = result.errors.slice(0, 2).map((e) => `Row ${e.row} (${e.sku}): ${e.message}`).join(' | ');
                      showImportPopup(`Import completed with errors. ${s}${result.errors.length > 2 ? ` | +${result.errors.length - 2} more` : ''}`, 'error');
                    } else {
                      showImportPopup('Import failed: No valid rows in CSV. Use header "sku" and optionally "onHandStock", "reservedStock", "lowStockThreshold".', 'error');
                    }
                  }}
                  onExportClick={handleExport}
                  T={T}
                />
              </div>
            </div>

            {/* ── Product table (original layout + skeleton loading) ───────────── */}
            <InventoryTable
              theme={theme}
              loading={loading}
              error={error}
              filteredItems={filteredItems}
              editingStockId={editingStockId}
              editingStockValue={editingStockValue}
              savingStockId={savingStockId}
              openStatusMenuRowId={openStatusMenuRowId}
              updatingProductStatusId={updatingProductStatusId}
              T={T}
              onStartInlineStockEdit={startInlineStockEdit}
              onEditingStockChange={setEditingStockValue}
              onSaveInlineEdit={saveInlineStockEdit}
              onCancelInlineEdit={cancelInlineStockEdit}
              onStatusMenuToggle={setOpenStatusMenuRowId}
              onUpdateProductStatus={updateProductStatus}
              getStockNumbers={getStockNumbers}
            />
          </>
        )}

        {activeContentTab === 'movements' && (
          <div style={{ padding: 0, borderRadius: 24, background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <div className="w-full max-w-272.5 mx-auto" style={{ paddingTop: 22 }}>
              <div className="flex justify-between items-end mb-8">
  <div className="flex flex-col gap-1">
    {/* 1. The Micro-Label (The "Audit Trail" context) */}
    <span 
      className={`
        text-[9px] font-black uppercase tracking-[0.4em] opacity-40
        [font-family:var(--font-outfit),sans-serif]
        ${theme === 'dark' ? 'text-white' : 'text-[#14034A]'}
      `}
    >
      Registry Log
    </span>

    {/* 2. The Main Editorial Title */}
    <h3
      className={`
        text-xl sm:text-2xl font-black tracking-tighter leading-tight
        transition-colors duration-300 [font-family:var(--font-outfit),sans-serif]
        ${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'}
      `}
    >
      Stock Movements
    </h3>

    {/* 3. The Minimalist Description */}
    <p 
      style={{ 
        color: T.textMuted, 
        fontSize: 12, 
        fontWeight: 500,
        opacity: 0.7,
        fontFamily: 'var(--font-outfit), sans-serif',
        letterSpacing: '-0.01em' 
      }}
    >
      Audit trail of all inventory changes.
    </p>
  </div>

  {/* 4. The Premium Ghost Button */}
  <GhostBtn 
    onClick={openAllMovementsModal} 
    disabled={loading} 
    style={{ 
      fontSize: 10, 
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      padding: '10px 18px',
      borderRadius: '14px',
      border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(20,3,74,0.08)',
      background: 'transparent',
      fontFamily: 'var(--font-outfit), sans-serif'
    }}
  >
    See All
  </GhostBtn>
</div>

              {loading ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: T.textMuted, fontSize: 14, fontFamily: 'var(--font-outfit), sans-serif' }}>Loading…</div>
              ) : movements.length === 0 ? (
                <EmptyState
                  badgeText="Movements"
                  title="No stock movements yet"
                  description="Audit trail of inventory changes will appear here once stock is adjusted."
                  tone={theme === 'dark' ? 'dark' : 'light'}
                  size="compact"
                  className="py-10 px-0"
                />
              ) : (
                <div
                  className="overflow-hidden rounded-3xl border"
                  style={{
                    background: isDark ? 'linear-gradient(180deg, rgba(24,32,88,0.5), rgba(14,18,58,0.68))' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(20,3,74,0.08)',
                    boxShadow: isDark ? '0 12px 30px rgba(7,10,34,0.18)' : '0 8px 24px rgba(21,9,62,0.06)',
                  }}
                >
                  <div style={{ overflowX: 'auto' }}>
                    <table className="w-full min-w-245 border-collapse [font-family:var(--font-outfit),sans-serif]">
                    <colgroup>
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '40%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                    </colgroup>
                    <thead>
                      <tr style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        <th className="sticky top-0 z-10 px-5 py-4 text-center" style={{ background: isDark ? '#1E1B4B' : '#803BED' }}>Type</th>
                        <th className="sticky top-0 z-10 px-5 py-4 text-center" style={{ background: isDark ? '#1E1B4B' : '#803BED' }}>Product</th>
                        <th className="sticky top-0 z-10 px-5 py-4 text-center" style={{ background: isDark ? '#1E1B4B' : '#803BED' }}>Metadata</th>
                        <th className="sticky top-0 z-10 px-5 py-4 text-center" style={{ background: isDark ? '#1E1B4B' : '#803BED' }}>Quantity</th>
                        <th className="sticky top-0 z-10 px-5 py-4 text-center" style={{ background: isDark ? '#1E1B4B' : '#803BED' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((m, index) => {
                        const movementId = String(m.id || '').trim();
                        const movementKey = movementId || `recent-${m.productId || 'product'}-${m.createdAt || 'time'}-${index}`;
                        return <RecentMovementTableRow key={movementKey} m={m} index={index} isLast={index === movements.length - 1} />;
                      })}
                    </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>

        {/* All movements modal (original) */}
        {showAllMovementsModal && (
          <ModalBackdrop key="all-movements-modal" onClose={closeAllMovementsModal}>
            <div style={{
              background: T.card, border: `1px solid ${T.cardBorder}`,
              borderRadius: 20, width: '100%', maxWidth: 720, overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}>
              <div style={{
                padding: '20px 28px', borderBottom: `1px solid ${T.cardBorder}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <h3 style={{ color: T.text, fontWeight: 700, margin: 0, fontFamily: 'var(--font-outfit), sans-serif' }}>All Stock Movements</h3>
                  <p style={{ color: T.textMuted, fontSize: 12, marginTop: 3, fontFamily: 'var(--font-outfit), sans-serif' }}>Complete movement history (latest first)</p>
                </div>
                <button
                  type="button"
                  onClick={closeAllMovementsModal}
                  title="Close movements"
                  style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 6, display: 'flex' }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '20px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      color: T.textMuted,
                      fontSize: 12,
                      cursor: totalMovements === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: 7,
                        border: `1px solid ${isAllMovementsSelected ? '#a855f7' : T.cardBorder}`,
                        background: isAllMovementsSelected ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isAllMovementsSelected}
                        disabled={totalMovements === 0}
                        onChange={toggleSelectAllMovements}
                        style={{ accentColor: '#a855f7', width: 14, height: 14, cursor: totalMovements === 0 ? 'not-allowed' : 'pointer' }}
                      />
                    </span>
                    <span>{totalMovements} total</span>
                  </label>
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => openBulkDeleteConfirm('selected')}
                      disabled={isBulkDeleting}
                      style={{
                        ...brandActionButtonStyle,
                        background: '#dc2626',
                        height: 34,
                        padding: '0 14px',
                        cursor: isBulkDeleting ? 'not-allowed' : 'pointer',
                        opacity: isBulkDeleting ? 0.6 : 1,
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                {loadingAllMovements ? (
                  <div style={{ textAlign: 'center', color: T.textMuted, padding: 32, fontFamily: 'var(--font-outfit), sans-serif' }}>Loading…</div>
                ) : allMovementsError ? (
                  <div style={{ textAlign: 'center', color: T.red, padding: 32, fontFamily: 'var(--font-outfit), sans-serif' }}>{allMovementsError}</div>
                ) : allMovements.length === 0 ? (
                  <EmptyState
                    badgeText="Movements"
                    title="No movements recorded"
                    description="This log will populate as inventory changes are made."
                    tone={theme === 'dark' ? 'dark' : 'light'}
                    size="compact"
                    className="py-10 px-0"
                  />
                ) : (
                  allMovements.map((m, index) => {
                    const movementId = String(m.id || '').trim();
                    const movementKey = movementId || `all-${m.productId || 'product'}-${m.createdAt || 'time'}-${index}`;
                    return (
                      <MovementRow
                        key={movementKey}
                        m={m}
                        selectable={Boolean(movementId)}
                        selected={Boolean(movementId) && selectedMovementIds.includes(movementId)}
                        onToggleSelect={movementId ? toggleMovementSelection : undefined}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </ModalBackdrop>
        )}

        {deleteConfirmMovement && (
          <ModalBackdrop key="delete-movement-modal" onClose={closeDeleteMovementConfirm}>
            <div style={{
              background: T.card, border: `1px solid ${T.cardBorder}`,
              borderRadius: 20, width: '100%', maxWidth: 520, overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}>
              <div style={{ padding: '24px 28px 14px', borderBottom: `1px solid ${T.cardBorder}` }}>
                <h3 style={{ color: T.text, fontWeight: 700, margin: 0 }}>Delete Movement</h3>
                <p style={{ color: T.textMuted, fontSize: 13, margin: '8px 0 0' }}>
                  Delete this movement for &quot;{deleteConfirmMovement.productName || 'this product'}&quot;? This action cannot be undone.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 28px 22px' }}>
                <button
                  type="button"
                  onClick={closeDeleteMovementConfirm}
                  disabled={Boolean(deletingMovementId)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: T.textMuted, fontSize: 14, cursor: deletingMovementId ? 'not-allowed' : 'pointer',
                    padding: '10px 16px', opacity: deletingMovementId ? 0.6 : 1,
                  }}
                >Cancel</button>
                <button
                  type="button"
                  onClick={() => { void confirmDeleteMovement(); }}
                  disabled={Boolean(deletingMovementId)}
                  style={{
                    ...brandActionButtonStyle,
                    background: '#dc2626',
                    cursor: deletingMovementId ? 'not-allowed' : 'pointer',
                    opacity: deletingMovementId ? 0.6 : 1,
                    height: 40,
                    padding: '0 20px',
                  }}
                >
                  {deletingMovementId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </ModalBackdrop>
        )}

        {/* Bulk delete confirmation */}
        {bulkDeleteConfirm && (
          <ModalBackdrop key="bulk-delete-modal" onClose={closeBulkDeleteConfirm}>
            <div style={{
              background: T.card, border: `1px solid ${T.cardBorder}`,
              borderRadius: 20, width: '100%', maxWidth: 520, overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}>
              <div style={{ padding: '24px 28px 14px', borderBottom: `1px solid ${T.cardBorder}` }}>
                <h3 style={{ color: T.text, fontWeight: 700, margin: 0 }}>Delete Movements</h3>
                <p style={{ color: T.textMuted, fontSize: 13, margin: '8px 0 0' }}>
                  {bulkDeleteConfirm.mode === 'selected'
                    ? `Delete these ${bulkDeleteConfirm.count} selected movement record${bulkDeleteConfirm.count === 1 ? '' : 's'}? This action cannot be undone.`
                    : `Delete all ${bulkDeleteConfirm.count} stock movement records for this project? This cannot be undone.`}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 28px 22px' }}>
                <button
                  type="button"
                  onClick={closeBulkDeleteConfirm}
                  disabled={isBulkDeleting}
                  style={{
                    background: 'transparent', border: 'none',
                    color: T.textMuted, fontSize: 14, cursor: isBulkDeleting ? 'not-allowed' : 'pointer',
                    padding: '10px 16px', opacity: isBulkDeleting ? 0.6 : 1,
                  }}
                >Cancel</button>
                <button
                  type="button"
                  onClick={() => { void confirmBulkDelete(); }}
                  disabled={isBulkDeleting}
                  style={{
                    ...brandActionButtonStyle,
                    background: '#dc2626',
                    cursor: isBulkDeleting ? 'not-allowed' : 'pointer',
                    opacity: isBulkDeleting ? 0.6 : 1,
                    height: 40,
                    padding: '0 20px',
                  }}
                >
                  {isBulkDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </ModalBackdrop>
        )}

        {/* Stock adjustment modal (original structure) */}
        {stockModal.open && stockModal.product && (
          <ModalBackdrop key="stock-adjustment-modal" onClose={closeStockModal}>
            <div style={{
              background: '#1a1535', border: `1px solid ${T.cardBorder}`,
              borderRadius: 22, width: '100%', maxWidth: 680,
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)', overflow: 'hidden',
            }}>
              <div style={{ padding: '30px 38px 22px', borderBottom: `1px solid ${T.cardBorder}` }}>
                {/* ENHANCED: show IN/OUT badge in modal header */}
                <div style={{ marginBottom: 8 }}>
                  <MovTypeBadge type={stockModal.movementType} />
                </div>
                <h3 style={{ color: T.text, fontWeight: 800, fontSize: 42, letterSpacing: 0.2, textTransform: 'uppercase', margin: 0, lineHeight: 1.02 }}>
                  {stockModal.product.name}
                </h3>
                <p style={{ color: T.textMuted, fontSize: 18, marginTop: 6 }}>Current on-hand stock: {modalOnHand}</p>
              </div>

              <form
                style={{ padding: '26px 38px 32px' }}
                onSubmit={(e) => { e.preventDefault(); submitStockAdjustment(); }}
              >
                <label style={{ color: T.textSub, fontSize: 16, display: 'block', marginBottom: 10 }}>Quantity</label>
                <input
                  autoFocus type="number" min={1} step={1} placeholder="Enter quantity…"
                  value={stockModal.quantity}
                  onWheel={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLInputElement).blur();
                  }}
                  onChange={(e) => setStockModal((p) => ({ ...p, quantity: e.target.value, error: null }))}
                  style={{ ...inputStyle, marginBottom: 24, height: 46, fontSize: 15 }}
                />

                <label style={{ color: T.textSub, fontSize: 16, display: 'block', marginBottom: 10 }}>Notes</label>
                <textarea
                  rows={6} placeholder="Enter your additional notes here…"
                  value={stockModal.notes}
                  onChange={(e) => setStockModal((p) => ({ ...p, notes: e.target.value }))}
                  style={{ ...inputStyle, resize: 'none', marginBottom: stockModal.error ? 12 : 30, fontSize: 14 }}
                />

                {/* ENHANCED: animated error banner instead of plain red text */}
                <AnimatePresence>
                  {stockModal.error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{
                        background: T.redBg, border: `1px solid ${T.redBorder}`,
                        borderRadius: 8, padding: '9px 13px',
                        color: T.red, fontSize: 13, marginBottom: 18,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                      {stockModal.error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button" onClick={closeStockModal} disabled={isAdjustingFromModal}
                    style={{ background: 'transparent', border: 'none', color: T.textMuted, fontSize: 14, cursor: 'pointer', padding: '10px 16px' }}
                  >Cancel</button>
                  <button
                    type="submit" disabled={isAdjustingFromModal}
                    style={{
                      ...brandActionButtonStyle,
                      background: stockModal.movementType === 'OUT' ? '#dc2626' : '#16a34a',
                      cursor: isAdjustingFromModal ? 'not-allowed' : 'pointer',
                      opacity: isAdjustingFromModal ? 0.6 : 1, height: 42, padding: '0 24px',
                    }}
                  >
                    {isAdjustingFromModal ? 'Saving…' : stockModal.movementType === 'OUT' ? 'Deduct Stock' : 'Add Stock'}
                  </button>
                </div>
              </form>
            </div>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      <ProductAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveProduct}
        uploadSubdomain={selectedSubdomain}
        projectIndustry={selectedProject?.industry || null}
      />
    </div>
  );
}

