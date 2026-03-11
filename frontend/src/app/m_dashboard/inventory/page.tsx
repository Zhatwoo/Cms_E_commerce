'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowDownUp,
  CheckCircle,
  Filter,
  Plus,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import {
  adjustInventoryStock,
  createProduct,
  deleteInventoryMovement,
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
import { getIndustryCategories } from '@/lib/industryCatalog';
import { useAlert } from '../components/context/alert-context';
import { useProject } from '../components/context/project-context';
import { type Product, type ProductVariant } from '../lib/productsData';
import ProductAddModal from '../products/components/productAddModal';

// ─── Design tokens (original — unchanged) ────────────────────────────────────
const T = {
  bg:           'radial-gradient(120% 100% at 50% 0%, #24104b 0%, #140836 42%, #0a0624 100%)',
  card:         '#141446',
  cardBorder:   '#1F1F51',
  elevated:     '#141446',
  input:        '#141446',
  inputBorder:  '#1F1F51',
  text:         '#ffffff',
  textMuted:    'rgba(219,212,255,0.45)',
  textSub:      'rgba(234,229,255,0.72)',
  accent:       '#a855f7',
  brandGradient:'linear-gradient(90deg, #6702BF 14%, #B36760 48%, #FFCC00 78%)',
  green:        '#22c55e',
  greenBg:      'rgba(34,197,94,0.12)',
  greenBorder:  'rgba(34,197,94,0.28)',
  red:          '#ef4444',
  redBg:        'rgba(239,68,68,0.12)',
  redBorder:    'rgba(239,68,68,0.28)',
  yellow:       '#eab308',
  yellowBg:     'rgba(234,179,8,0.12)',
  yellowBorder: 'rgba(234,179,8,0.28)',
  radius:       22,
  font:         "'DM Sans', 'Segoe UI', sans-serif",
};

// ─── CSV helpers (unchanged) ──────────────────────────────────────────────────
const EXPORT_COLUMNS = ['name','sku','category','onHandStock','reservedStock','lowStockThreshold','status'] as const;

function escapeCsvValue(val: string | number | undefined | null): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) return `"${s.replace(/"/g,'""')}"`;
  return s;
}
function productsToCsv(items: ApiProduct[]): string {
  const header = EXPORT_COLUMNS.join(',');
  const rows = items.map((p) => {
    const onHand   = p.onHandStock ?? p.stock ?? 0;
    const reserved = p.reservedStock ?? 0;
    const low      = p.lowStockThreshold ?? 5;
    return [escapeCsvValue(p.name),escapeCsvValue(p.sku),escapeCsvValue(p.category),escapeCsvValue(onHand),escapeCsvValue(reserved),escapeCsvValue(low),escapeCsvValue(p.status)].join(',');
  });
  return [header,...rows].join('\n');
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let cell = ''; i++;
      while (i < line.length) {
        if (line[i] === '"') { if (line[i+1]==='"'){cell+='"';i+=2;} else {i++;break;} } else {cell+=line[i];i++;}
      }
      result.push(cell);
    } else {
      let cell = '';
      while (i < line.length && line[i] !== ',') {cell+=line[i];i++;}
      result.push(cell.trim());
      if (line[i]===',') i++;
    }
  }
  return result;
}

function parseCsvToRows(text: string): ImportInventoryRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headerCols  = parseCsvLine(lines[0]).map((c) => c.trim().toLowerCase().replace(/_/g,''));
  const skuIdx      = headerCols.findIndex((c) => c === 'sku');
  const onHandIdx   = headerCols.findIndex((c) => ['onhandstock','stock'].includes(c));
  const reservedIdx = headerCols.findIndex((c) => ['reservedstock','reserved'].includes(c));
  const lowIdx      = headerCols.findIndex((c) => ['lowstockthreshold','lowthreshold'].includes(c));
  const rows: ImportInventoryRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const sku = skuIdx >= 0 ? (cols[skuIdx]??'').trim() : '';
    if (!sku) continue;
    const row: ImportInventoryRow = { sku };
    if (onHandIdx >= 0)   { const v = parseInt(String(cols[onHandIdx]??'0'),10);   if (Number.isFinite(v)) row.onHandStock = Math.max(0,v); }
    if (reservedIdx >= 0) { const v = parseInt(String(cols[reservedIdx]??'0'),10); if (Number.isFinite(v)) row.reservedStock = Math.max(0,v); }
    if (lowIdx >= 0)      { const v = parseInt(String(cols[lowIdx]??'5'),10);       if (Number.isFinite(v)) row.lowStockThreshold = Math.max(0,v); }
    rows.push(row);
  }
  return rows;
}

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

type ImportPopupState = { open: boolean; message: string; tone: 'success' | 'error' };

const getDefaultAdjustmentNote = (t: StockAdjustmentType) =>
  t === 'IN' ? 'Manual stock-in from inventory page' : 'Manual stock-out from inventory page';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;
type ProductUpsertPayload = Omit<Parameters<typeof createProduct>[0], 'subdomain'>;

function toDashboardStatus(status?: string): 'active' | 'inactive' | 'draft' {
  const normalized = (status || '').toString().toLowerCase();
  if (normalized === 'active' || normalized === 'published') return 'active';
  if (normalized === 'inactive' || normalized === 'suspended') return 'inactive';
  return 'draft';
}

const RECENT_MOVEMENTS_LIMIT = 5;
const ALL_MOVEMENTS_LIMIT    = 500;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

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
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: T.radius, ...style }}>
    {children}
  </div>
);

const GhostBtn = ({
  onClick, disabled, children, title, style,
}: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; title?: string; style?: React.CSSProperties }) => (
  <button
    type="button" onClick={onClick} disabled={disabled} title={title}
    style={{
      background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.cardBorder}`,
      borderRadius: 8, color: T.textSub, fontSize: 13,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', transition: 'opacity 0.15s', ...style,
    }}
  >{children}</button>
);

// ENHANCED: pill now has a subtle border for better legibility
const StatusPill = ({ stock, lowThreshold }: { stock: number; lowThreshold: number }) => {
  const outOfStock = stock <= 0;
  const lowStock   = !outOfStock && stock < lowThreshold;
  const { color, bg, border, label } = outOfStock
    ? { color: T.red,    bg: T.redBg,    border: T.redBorder,    label: 'Out of Stock' }
    : lowStock
    ? { color: T.yellow, bg: T.yellowBg, border: T.yellowBorder, label: 'Low Stock' }
    : { color: T.green,  bg: T.greenBg,  border: T.greenBorder,  label: '✦ In Stock' };
  return (
    <span style={{
      background: bg, border: `1px solid ${border}`, color,
      padding: '3px 10px', borderRadius: 20, fontSize: 11,
      fontWeight: 600, display: 'inline-block',
    }}>{label}</span>
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
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 120, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
      background: 'rgba(10,8,28,0.75)', backdropFilter: 'blur(6px)',
    }}
  >
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.98 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      onClick={(e) => e.stopPropagation()}
    >{children}</motion.div>
  </motion.div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { selectedProject } = useProject();
  const { showAlert } = useAlert();
  const selectedSubdomain = normalizeSubdomain(selectedProject?.subdomain);

  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch]                       = useState('');
  const [categoryFilter, setCategoryFilter]       = useState<string>('all');
  const [items, setItems]                         = useState<InventoryRow[]>([]);
  const [summary, setSummary]                     = useState<InventorySummary | null>(null);
  const [movements, setMovements]                 = useState<InventoryMovement[]>([]);
  const [allMovements, setAllMovements]           = useState<InventoryMovement[]>([]);
  const [showAllMovementsModal, setShowAllMovementsModal] = useState(false);
  const [loadingAllMovements, setLoadingAllMovements]     = useState(false);
  const [allMovementsError, setAllMovementsError]         = useState<string | null>(null);
  const [deletingMovementId, setDeletingMovementId]       = useState<string | null>(null);
  const [deleteConfirmMovement, setDeleteConfirmMovement] = useState<InventoryMovement | null>(null);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState<string | null>(null);
  const [adjustingId, setAdjustingId]             = useState<string | null>(null);
  const [stockModal, setStockModal]               = useState<StockAdjustmentModalState>({
    open: false, product: null, movementType: 'IN', quantity: '1',
    notes: getDefaultAdjustmentNote('IN'), error: null,
  });
  const [editingStockId, setEditingStockId]       = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState('');
  const [savingStockId, setSavingStockId]         = useState<string | null>(null);
  const [updatingProductStatusId, setUpdatingProductStatusId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importPopup, setImportPopup] = useState<ImportPopupState>({ open: false, message: '', tone: 'success' });
  const importPopupTimerRef = useRef<number | null>(null);
  const fileInputRef        = useRef<HTMLInputElement>(null);
  const inlineSaveLockRef   = useRef<string | null>(null);

  const showImportPopup = useCallback((message: string, tone: 'success' | 'error') => {
    if (importPopupTimerRef.current) window.clearTimeout(importPopupTimerRef.current);
    setImportPopup({ open: true, message, tone });
    importPopupTimerRef.current = window.setTimeout(() => {
      setImportPopup((p) => ({ ...p, open: false }));
      importPopupTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => () => { if (importPopupTimerRef.current) window.clearTimeout(importPopupTimerRef.current); }, []);

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
      setMovements(Array.isArray(movementRes.items) ? movementRes.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally { setLoading(false); }
  }, [search, selectedSubdomain]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadAllMovements = useCallback(async () => {
    setLoadingAllMovements(true); setAllMovementsError(null);
    if (!selectedSubdomain) {
      setAllMovements([]);
      setLoadingAllMovements(false);
      return;
    }
    try {
      const res = await listInventoryMovements({ subdomain: selectedSubdomain, limit: ALL_MOVEMENTS_LIMIT });
      setAllMovements(Array.isArray(res.items) ? res.items : []);
    } catch (err) {
      setAllMovementsError(err instanceof Error ? err.message : 'Failed to load movement history');
    } finally { setLoadingAllMovements(false); }
  }, [selectedSubdomain]);

  const openAllMovementsModal  = useCallback(() => { setShowAllMovementsModal(true); void loadAllMovements(); }, [loadAllMovements]);
  const closeAllMovementsModal = useCallback(() => setShowAllMovementsModal(false), []);

  useEffect(() => {
    if (!showAllMovementsModal) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAllMovementsModal(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [showAllMovementsModal, closeAllMovementsModal]);

  const getStockNumbers = useCallback((p: InventoryRow) => {
    const onHand       = Number(p.onHandStock ?? p.stock ?? 0);
    const reserved     = Number(p.reservedStock ?? 0);
    const available    = Number(p.availableStock ?? Math.max(0, onHand - reserved));
    const lowThreshold = Number(p.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD);
    return { onHand, reserved, available, lowThreshold };
  }, []);

  const categoryOptions = useMemo(() => {
    const projectSubcategories = getIndustryCategories(selectedProject?.industry);
    if (projectSubcategories.length > 0) {
      return projectSubcategories;
    }

    const uniq = new Set<string>();
    items.forEach((p) => {
      const sub = getProductSubcategory(p);
      if (sub) uniq.add(sub);
    });
    return Array.from(uniq).sort((a, b) => a.localeCompare(b));
  }, [items, selectedProject?.industry]);

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
    } catch (err) {
      setStockModal((p) => ({ ...p, error: err instanceof Error ? err.message : 'Failed to adjust stock' }));
    } finally { setAdjustingId(null); }
  }, [stockModal, getStockNumbers, loadData, showAllMovementsModal, loadAllMovements]);

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
      setDeletingMovementId(deleteConfirmMovement.id);
      await deleteInventoryMovement(deleteConfirmMovement.id);
      await loadData();
      if (showAllMovementsModal) {
        await loadAllMovements();
      }
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
  }, [deleteConfirmMovement, loadAllMovements, loadData, showAllMovementsModal, showImportPopup]);

  useEffect(() => {
    if (!deleteConfirmMovement) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDeleteMovementConfirm(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [closeDeleteMovementConfirm, deleteConfirmMovement]);

  const isAdjustingFromModal = Boolean(stockModal.product && adjustingId === stockModal.product.id);
  const modalOnHand = stockModal.product ? getStockNumbers(stockModal.product).onHand : 0;

  const prependLocalMovement = useCallback((movement: InventoryMovement) => {
    setMovements((prev) => [movement, ...prev].slice(0, RECENT_MOVEMENTS_LIMIT));
    if (showAllMovementsModal) {
      setAllMovements((prev) => [movement, ...prev]);
    }
  }, [showAllMovementsModal]);

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
      setUpdatingProductStatusId(baseProductId);
      await updateProduct(baseProductId, { status: nextStatus });
      await loadData();
      prependLocalMovement({
        id: `local-status-${Date.now()}-${baseProductId}`,
        productId: baseProductId,
        productName: product.name || 'Product',
        type: 'STATUS',
        quantity: 0,
        notes: `Product status changed to ${nextStatus}`,
        createdAt: new Date().toISOString(),
      });
      showImportPopup('Product status updated.', 'success');
    } catch (err) {
      showImportPopup(err instanceof Error ? err.message : 'Failed to update product status.', 'error');
    } finally {
      setUpdatingProductStatusId(null);
    }
  }, [loadData, prependLocalMovement, showImportPopup]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await listInventory({ subdomain: selectedSubdomain || undefined, limit: 5000, search: search || undefined });
      const data = Array.isArray(res.items) ? res.items : [];
      if (data.length === 0) { window.alert('No inventory to export.'); return; }
      const csv = productsToCsv(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `inventory-export-${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { window.alert(err instanceof Error ? err.message : 'Export failed'); }
    finally { setExporting(false); }
  }, [search, selectedSubdomain]);

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
        const s = result.errors.slice(0,2).map((e) => `Row ${e.row} (${e.sku}): ${e.message}`).join(' | ');
        showImportPopup(`Import completed with errors. ${s}${result.errors.length > 2 ? ` | +${result.errors.length - 2} more` : ''}`, 'error');
      } else { showImportPopup(result.message ?? `Import successful. Updated ${result.updated ?? 0} product(s).`, 'success'); }
    } catch (err) { showImportPopup(err instanceof Error ? `Import failed: ${err.message}` : 'Import failed', 'error'); }
    finally { setImporting(false); }
  }, [loadData, showImportPopup, selectedSubdomain]);

  // ─── Config ─────────────────────────────────────────────────────────────────
  const statCards = [
    { id: 'total', label: 'TOTAL PRODUCTS', icon: <Package size={12} />,      accent: '#86a8ff', value: summary?.totalProducts ?? 0 },
    { id: 'low',   label: 'LOW STOCK',      icon: <AlertTriangle size={12} />, accent: '#b178ff', value: summary?.lowStock ?? 0 },
    { id: 'out',   label: 'OUT OF STOCK',   icon: <Filter size={12} />,        accent: '#ff4f8c', value: summary?.outOfStock ?? 0 },
    { id: 'value', label: 'STOCK VALUE',    icon: <TrendingUp size={12} />,    accent: '#22d3a4', value: stockValueLabel },
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
  }: {
    m: InventoryMovement;
    onDelete?: (movement: InventoryMovement) => void;
    isDeleting?: boolean;
  }) => {
    const kind = String(m.type || '').toUpperCase();
    const color = kind === 'IN' ? T.green : kind === 'OUT' ? T.red : '#a5b4fc';
    const quantityText = kind === 'IN' ? `+${m.quantity}` : kind === 'OUT' ? String(m.quantity) : '•';
    return (
      <div
        style={{
          background: T.elevated, border: `1px solid ${T.cardBorder}`,
          borderRadius: 10, padding: '11px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 8, transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(135,153,192,0.6)';
          (e.currentTarget as HTMLDivElement).style.background  = 'rgba(255,255,255,0.03)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = T.cardBorder;
          (e.currentTarget as HTMLDivElement).style.background  = T.elevated;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MovTypeBadge type={m.type || ''} />
          <div>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{m.productName || 'Product'}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{m.notes || 'Inventory movement'}</div>
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
              onClick={() => onDelete(m)}
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
    );
  };

  // ENHANCED: skeleton rows while loading
  const SkeletonRow = ({ idx }: { idx: number }) => (
    <div style={{
      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1.2fr',
      gap: 16, padding: '16px 24px', minWidth: 760,
      borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center',
    }}>
      {[110, 55, 35, 35, 72, 72].map((w, j) => (
        <motion.div
          key={j}
          animate={{ opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.1 + j * 0.05 }}
          style={{ height: 11, width: w, background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}
        />
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, color: T.text, minHeight: '100%', position: 'relative' }}>
      <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* ── ENHANCED: corner toast (non-blocking) replaces full-screen overlay ── */}
      <AnimatePresence>
        {importPopup.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 200,
              background: importPopup.tone === 'success' ? 'rgba(12,24,16,0.97)' : 'rgba(24,10,12,0.97)',
              border: `1px solid ${importPopup.tone === 'success' ? T.greenBorder : T.redBorder}`,
              borderRadius: 14, padding: '13px 17px',
              maxWidth: 360, display: 'flex', alignItems: 'flex-start', gap: 10,
              backdropFilter: 'blur(10px)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}
          >
            {importPopup.tone === 'success'
              ? <CheckCircle size={15} color={T.green} style={{ flexShrink: 0, marginTop: 1 }} />
              : <AlertTriangle size={15} color={T.red} style={{ flexShrink: 0, marginTop: 1 }} />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: importPopup.tone === 'success' ? T.green : T.red, marginBottom: 3 }}>
                {importPopup.tone === 'success' ? 'Success' : 'Action Failed'}
              </div>
              <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>{importPopup.message}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 1090, margin: '0 auto', padding: '36px 22px 30px', position: 'relative', zIndex: 1 }}>

        {/* ── Title (original) ────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <h1
            style={{
              fontSize: 'clamp(34px, 5vw, 56px)',
              fontWeight: 800,
              margin: 0,
              letterSpacing: -1.8,
              lineHeight: 1.06,
            }}
          >
            <span style={{ color: T.text }}>My </span>
            <span
              style={{
                backgroundImage: T.brandGradient,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                paddingRight: '0.08em',
                lineHeight: 1.18,
                paddingBottom: '0.08em',
              }}
            >
              Inventory
            </span>
          </h1>
          <p style={{ color: T.textMuted, fontSize: 14, marginTop: 8 }}>
            Track stock levels, movements, and alerts across your catalog.
          </p>
        </div>

        {/* ── Search bar (original) ───────────────────────────────────────── */}
        <div
          style={{ position: 'relative', maxWidth: 860, margin: '0 auto 28px' }}
          className="rounded-2xl border px-5 py-3.5 flex items-center gap-3 bg-[#141446] border-[#1F1F51] [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.03),0_10px_40px_rgba(16,11,62,0.45)]"
        >
          <svg
            viewBox="0 0 20 20"
            width="16"
            height="16"
            fill="none"
            style={{ color: T.yellow, flexShrink: 0 }}
          >
            <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <input
            type="text"
            placeholder="Search templates, designs, or actions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...inputStyle,
              padding: 0,
              border: 'none',
              background: 'transparent',
              boxShadow: 'none',
              fontSize: 14,
              color: '#ffffff',
            }}
            className="placeholder:text-[#6F70A8]"
          />
        </div>

        {/* ── Toolbar (original layout) ───────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  appearance: 'none',
                  background: T.card,
                  border: `1px solid ${T.cardBorder}`,
                  borderRadius: 14,
                  color: '#ddd1ff',
                  fontSize: 13,
                  fontWeight: 600,
                  height: 46,
                  minWidth: 156,
                  padding: '0 38px 0 16px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                aria-label="Subcategory filter"
              >
                <option value="all">All</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#b6abd6', fontSize: 10, pointerEvents: 'none' }}>▼</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              title="Add Product"
              style={{
                height: 46, borderRadius: 12,
                padding: '0 14px',
                border: `1px solid ${T.cardBorder}`, color: '#d9cbff',
                background: T.card, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
              }}
            >+ Add Product</button>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button" onClick={handleImport} disabled={importing}
              title={importing ? 'Importing…' : 'Import CSV'}
              style={{
                width: 40, height: 40, borderRadius: 12,
                border: `1px solid ${T.cardBorder}`, color: '#ddd1ff', background: T.card,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.55 : 1,
              }}
            ><Upload size={15} /></button>
            <button
              type="button" onClick={handleExport} disabled={exporting}
              title={exporting ? 'Exporting…' : 'Export CSV'}
              style={{
                width: 40, height: 40, borderRadius: 12,
                border: `1px solid ${T.cardBorder}`, color: '#ddd1ff', background: T.card,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.55 : 1,
              }}
            ><Download size={15} /></button>
          </div>
        </div>

        {/* ── Stat cards (original) ───────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 18 }}>
          {statCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: '10px 14px 12px', minHeight: 72 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{ color: card.accent, display: 'inline-flex', alignItems: 'center' }}>{card.icon}</span>
                <span style={{ color: '#7e72a9', fontSize: 10, letterSpacing: 0.8 }}>{card.label}</span>
              </div>
              <div style={{ color: '#f2ecff', fontSize: 24, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.2 }}>
                {typeof card.value === 'number' ? String(card.value) : card.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Product table (original layout + skeleton loading) ───────────── */}
        <Card style={{ overflow: 'hidden', marginBottom: 18, borderRadius: 24 }}>
          <div style={{ overflowX: 'auto' }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1.2fr',
              gap: 16, padding: '13px 24px', minWidth: 760,
              borderBottom: `1px solid ${T.cardBorder}`,
              background: T.card, color: '#8273a8', fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase',
            }}>
              <span>Product</span><span>SKU</span><span>Stock</span>
              <span>Pre Orders</span><span>Stock Status</span><span>Product Status</span>
            </div>

            {/* Rows */}
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} idx={i} />)
            ) : error ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: T.red, fontSize: 14 }}>{error}</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <Package size={40} color={T.textMuted} style={{ margin: '0 auto 16px', display: 'block' }} />
                <p style={{ color: T.text, fontWeight: 600, marginBottom: 6 }}>No inventory items yet</p>
                <p style={{ color: T.textMuted, fontSize: 13 }}>Add your first product or import a CSV to start tracking stock.</p>
              </div>
            ) : (
              filteredItems.map((rawProduct, i) => {
                const product = rawProduct as InventoryRow;
                const { onHand, reserved, lowThreshold } = getStockNumbers(product);
                return (
                  <div
                    key={product.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1.2fr',
                      gap: 16, padding: '15px 24px', alignItems: 'center', fontSize: 14, minWidth: 760,
                      borderBottom: i < filteredItems.length - 1 ? `1px solid rgba(255,255,255,0.055)` : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.018)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                  >
                    <span style={{ color: T.text, fontWeight: 500, display: 'flex', flexDirection: 'column' }}>
                      {product.name || 'Untitled Product'}
                      {product._variantLabel && (
                        <span style={{ color: T.textMuted, fontSize: 12, fontWeight: 400, marginTop: 2 }}>
                          {product._variantLabel}
                        </span>
                      )}
                    </span>
                    <span style={{ color: T.textMuted }}>{product.sku || '-'}</span>
                    <div
                      onDoubleClick={() => startInlineStockEdit(product, onHand)}
                      title="Double-click stock to edit, press Enter to save"
                      style={{ minWidth: 72 }}
                    >
                      {editingStockId === product.id ? (
                        <input
                          autoFocus
                          type="number"
                          min={0}
                          value={editingStockValue}
                          onChange={(e) => setEditingStockValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              void saveInlineStockEdit(product);
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelInlineStockEdit();
                            }
                          }}
                          onBlur={() => {
                            void saveInlineStockEdit(product);
                          }}
                          disabled={savingStockId === product.id}
                          style={{
                            width: 68,
                            background: 'rgba(255,255,255,0.06)',
                            border: `1px solid ${T.cardBorder}`,
                            borderRadius: 8,
                            color: T.text,
                            padding: '4px 8px',
                            fontSize: 13,
                            outline: 'none',
                          }}
                        />
                      ) : (
                        <span style={{ color: T.text }}>{onHand}</span>
                      )}
                    </div>
                    <span style={{ color: T.textMuted }}>{reserved}</span>
                    <div style={{ justifySelf: 'start' }}>
                      <StatusPill stock={onHand} lowThreshold={lowThreshold} />
                    </div>
                    <div style={{ justifySelf: 'start' }}>
                      {(() => {
                        const productStatus = String(product.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';
                        const isActive = productStatus === 'active';
                        return (
                          <select
                            value={productStatus}
                            disabled={updatingProductStatusId === (product._baseProductId || product.id)}
                            onChange={(e) => {
                              const next = e.target.value as 'active' | 'inactive';
                              if (next !== productStatus) void updateProductStatus(product, next);
                            }}
                            style={{
                              background: isActive ? T.greenBg : T.redBg,
                              border: `1px solid ${isActive ? T.greenBorder : T.redBorder}`,
                              color: isActive ? T.green : T.red,
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              height: 28,
                              padding: '0 8px',
                              outline: 'none',
                              minWidth: 96,
                            }}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* ── Recent movements (original layout) ─────────────────────────── */}
        <Card style={{ padding: '22px', borderRadius: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ color: T.textSub, fontSize: 13, fontWeight: 600, letterSpacing: 0.5, margin: 0 }}>Recent Stock Movements</h3>
              <p style={{ color: T.textMuted, fontSize: 12, marginTop: 3 }}>Audit trail of all inventory changes.</p>
            </div>
            <GhostBtn onClick={openAllMovementsModal} disabled={loading} style={{ fontSize: 12, padding: '5px 12px' }}>See All</GhostBtn>
          </div>

          {loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: T.textMuted, fontSize: 14 }}>Loading…</div>
          ) : movements.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
              <ArrowDownUp size={28} color={T.textMuted} style={{ margin: '0 auto 10px', display: 'block' }} />
              No stock movements recorded yet.
            </div>
          ) : (
            movements.map((m) => <MovementRow key={m.id} m={m} />)
          )}
        </Card>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>

        {/* All movements modal (original) */}
        {showAllMovementsModal && (
          <ModalBackdrop onClose={closeAllMovementsModal}>
            <div style={{
              background: '#1a1535', border: `1px solid ${T.cardBorder}`,
              borderRadius: 20, width: '100%', maxWidth: 720, overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}>
              <div style={{
                padding: '20px 28px', borderBottom: `1px solid ${T.cardBorder}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <h3 style={{ color: T.text, fontWeight: 700, margin: 0 }}>All Stock Movements</h3>
                  <p style={{ color: T.textMuted, fontSize: 12, marginTop: 3 }}>Complete movement history (latest first)</p>
                </div>
                <button
                  onClick={closeAllMovementsModal}
                  style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 6, display: 'flex' }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '20px 28px' }}>
                {loadingAllMovements ? (
                  <div style={{ textAlign: 'center', color: T.textMuted, padding: 32 }}>Loading…</div>
                ) : allMovementsError ? (
                  <div style={{ textAlign: 'center', color: T.red, padding: 32 }}>{allMovementsError}</div>
                ) : allMovements.length === 0 ? (
                  <div style={{ textAlign: 'center', color: T.textMuted, padding: 32 }}>No movements recorded.</div>
                ) : (
                  allMovements.map((m) => (
                    <MovementRow
                      key={m.id}
                      m={m}
                      onDelete={openDeleteMovementConfirm}
                      isDeleting={deletingMovementId === m.id}
                    />
                  ))
                )}
              </div>
            </div>
          </ModalBackdrop>
        )}

        {deleteConfirmMovement && (
          <ModalBackdrop onClose={closeDeleteMovementConfirm}>
            <div style={{
              background: '#1a1535', border: `1px solid ${T.cardBorder}`,
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
                  {deletingMovementId ? 'Deletingâ€¦' : 'Delete'}
                </button>
              </div>
            </div>
          </ModalBackdrop>
        )}

        {/* Stock adjustment modal (original structure) */}
        {stockModal.open && stockModal.product && (
          <ModalBackdrop onClose={closeStockModal}>
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

