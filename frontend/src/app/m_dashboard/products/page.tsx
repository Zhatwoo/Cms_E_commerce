'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowDownUp, CheckCircle, Package } from 'lucide-react';
import { useTheme } from '../components/context/theme-context';
import { useAlert } from '../components/context/alert-context';
import { useProject } from '../components/context/project-context';
import { type Product, type ProductVariant } from '../lib/productsData';
import { createProduct, deleteProduct, listProducts, updateProduct, type ApiProduct } from '@/lib/api';
import ProductAddModal from './components/productAddModal';

type ProductUpsertPayload = Omit<Parameters<typeof createProduct>[0], 'subdomain'>;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

type ProductPopupState = {
  open: boolean;
  message: string;
  tone: 'success' | 'error';
};

const PRODUCT_INSIGHT_CARDS = [
  { id: 'total', label: 'Total Products', icon: Package },
  { id: 'active', label: 'Active', icon: CheckCircle },
  { id: 'low', label: 'Low Stock', icon: AlertTriangle },
  { id: 'out', label: 'Out of Stock', icon: ArrowDownUp },
] as const;

function getLowStockThreshold(product: Product): number {
  const threshold = Number(product.lowStockThreshold);
  if (!Number.isFinite(threshold) || threshold < 0) return DEFAULT_LOW_STOCK_THRESHOLD;
  return threshold;
}

function isLowStock(product: Product): boolean {
  return product.stock > 0 && product.stock < getLowStockThreshold(product);
}

function isImageSource(value: string): boolean {
  const v = (value || '').trim();
  if (!v) return false;
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(v)) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith('blob:')) return true;
  if (v.startsWith('/')) return true;
  return false;
}

function getVariantGroups(product: Product): ProductVariant[] {
  return Array.isArray(product.variants)
    ? product.variants.filter((variant) => Array.isArray(variant.options) && variant.options.length > 0)
    : [];
}

function buildVariantStockKey(variants: ProductVariant[], selectedOptions: Record<string, string>): string | null {
  if (variants.length === 0) return null;
  const keyParts: string[] = [];
  for (const variant of variants) {
    const selectedOptionId = selectedOptions[variant.id];
    if (!selectedOptionId) return null;
    keyParts.push(`${variant.id}:${selectedOptionId}`);
  }
  return keyParts.join('__');
}

function getInitialVariantSelection(product: Product): Record<string, string> {
  const groups = getVariantGroups(product);
  return groups.reduce<Record<string, string>>((acc, variant) => {
    const firstOption = variant.options[0];
    if (firstOption?.id) {
      acc[variant.id] = firstOption.id;
    }
    return acc;
  }, {});
}

function getCombinationStock(product: Product, selectedOptions: Record<string, string>): number | null {
  if (!product.hasVariants || !product.variantStocks) return null;
  const groups = getVariantGroups(product);
  if (groups.length === 0) return null;
  const stockKey = buildVariantStockKey(groups, selectedOptions);
  if (!stockKey) return null;
  const value = Number(product.variantStocks[stockKey]);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function getCombinationPrice(product: Product, selectedOptions: Record<string, string>): number | null {
  if (!product.hasVariants || !product.variantPrices) return null;
  const groups = getVariantGroups(product);
  if (groups.length === 0) return null;
  const stockKey = buildVariantStockKey(groups, selectedOptions);
  if (!stockKey) return null;
  const value = Number(product.variantPrices[stockKey]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function getSelectedVariantImage(product: Product, selectedOptions: Record<string, string>): string | null {
  const groups = getVariantGroups(product);
  for (const variant of groups) {
    if (variant.name.trim().toLowerCase() === 'size') continue;
    const selectedOptionId = selectedOptions[variant.id];
    if (!selectedOptionId) continue;
    const selectedOption = variant.options.find((option) => option.id === selectedOptionId);
    const image = String(selectedOption?.image || '').trim();
    if (isImageSource(image)) return image;
  }
  return null;
}

function colorFromName(value: string): string {
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
  const palette = ['#EAE3F9', '#F23939', '#2F49D8', '#D81CBF', '#22c55e', '#f59e0b', '#14b8a6'];
  const hash = Array.from(trimmed.toLowerCase()).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const ProductCard = ({ product, colors, onView, onEdit, onDelete, isTransitioningOut }: {
  product: Product;
  colors: ThemeColors;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  isTransitioningOut?: boolean;
}) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => getInitialVariantSelection(product));
  const selectedVariantImage = getSelectedVariantImage(product, selectedOptions);
  const imageValue = String(selectedVariantImage || product.image || '').trim();
  const showImage = isImageSource(imageValue);
  const [menuOpen, setMenuOpen] = useState(false);
  const variantGroups = getVariantGroups(product);
  const colorVariant = variantGroups.find((variant) => variant.name.toLowerCase().includes('color'));
  const hasColorVariant = Boolean(colorVariant);
  const colorVariantCount = colorVariant?.options?.length ?? 0;
  const isSingleVariantGroup = variantGroups.length === 1;
  const singleVariantGroup = isSingleVariantGroup ? variantGroups[0] : null;
  const singleVariantId = singleVariantGroup?.id || '';
  const singleVariantOptions = singleVariantGroup?.options ?? [];
  const selectedPrice = getCombinationPrice(product, selectedOptions);
  const overallStock = Number(product.stock ?? 0);
  const visiblePrice = selectedPrice ?? product.price;
  const lowStock = overallStock > 0 && overallStock < getLowStockThreshold(product);
  const subcategoryLabel = String(product.subcategory || '').trim();
  const priceRangeMin = Number(product.priceRangeMin);
  const priceRangeMax = Number(product.priceRangeMax);
  const hasPriceRange = Number.isFinite(priceRangeMin)
    && Number.isFinite(priceRangeMax)
    && priceRangeMin >= 0
    && priceRangeMax >= 0
    && priceRangeMax >= priceRangeMin;
  const formattedPrice = hasPriceRange
    ? (priceRangeMin === priceRangeMax
      ? `₱${Math.round(priceRangeMin).toLocaleString()}`
      : `₱${Math.round(priceRangeMin).toLocaleString()} - ₱${Math.round(priceRangeMax).toLocaleString()}`)
    : `₱${Math.round(visiblePrice).toLocaleString()}`;
  const originalPriceCandidate = Number(product.compareAtPrice ?? product.basePrice ?? 0);
  const hasOriginalPrice = Number.isFinite(originalPriceCandidate) && originalPriceCandidate > 0;
  const formattedOriginalPrice = hasOriginalPrice
    ? `₱${Math.round(originalPriceCandidate).toLocaleString()}`
    : null;
  const normalizedStatus = String(product.status || '').toLowerCase();
  const statusLabel = normalizedStatus === 'inactive' ? 'Inactive' : normalizedStatus === 'active' ? 'Active' : 'Draft';
  const statusStyle =
    normalizedStatus === 'inactive'
      ? { color: '#fca5a5', backgroundColor: 'rgba(153,27,27,0.72)', borderColor: 'rgba(248,113,113,0.75)' }
      : normalizedStatus === 'active'
      ? { color: '#86efac', backgroundColor: 'rgba(20,83,45,0.72)', borderColor: 'rgba(74,222,128,0.75)' }
      : { color: '#c4b5fd', backgroundColor: 'rgba(76,29,149,0.62)', borderColor: 'rgba(167,139,250,0.7)' };

  useEffect(() => {
    setSelectedOptions(getInitialVariantSelection(product));
  }, [product.id, product.variants]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isTransitioningOut ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
      style={{
        backgroundColor: '#131761',
        borderColor: '#2D3A90',
        borderRadius: '20px',
      }}
    >
      <div className="relative w-full h-44 md:h-48 overflow-hidden flex items-center justify-center border-b" style={{ borderColor: '#2D3A90', backgroundColor: '#D9D9DC' }}>
        <span
          className="absolute left-2.5 top-2.5 z-10 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={statusStyle}
        >
          {statusLabel}
        </span>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="absolute right-2.5 top-2.5 h-7 w-7 rounded-full bg-black text-white flex items-center justify-center"
          title="Product actions"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="6" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="18" cy="12" r="2" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-2.5 top-10 z-20 w-28 rounded-lg border border-[#2D3A90] bg-[#12145A] py-1 shadow-xl">
            <button type="button" onClick={() => { setMenuOpen(false); onView(product); }} className="w-full px-2.5 py-1.5 text-left text-[11px] text-white hover:bg-white/5">View</button>
            <button type="button" onClick={() => { setMenuOpen(false); onEdit(product); }} className="w-full px-2.5 py-1.5 text-left text-[11px] text-white hover:bg-white/5">Edit</button>
            <button type="button" onClick={() => { setMenuOpen(false); onDelete(product); }} className="w-full px-2.5 py-1.5 text-left text-[11px] text-red-300 hover:bg-red-500/10">Delete</button>
          </div>
        )}
        {showImage ? (
          <img
            src={imageValue}
            alt={product.name}
            className="w-full h-full object-contain p-3"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3">
            <svg className="w-12 h-12 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.border.faint }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs" style={{ color: colors.text.muted }}>No image</span>
          </div>
        )}
      </div>

      <div className="p-3.5 md:p-4 flex-1 flex flex-col" style={{ backgroundColor: '#131761' }}>
        <h3 className="font-semibold text-[18px] leading-tight line-clamp-2 text-white">
          {product.name}
        </h3>
        <p className="mt-1 text-xs" style={{ color: '#FFCC00' }}>
          {subcategoryLabel ? `${subcategoryLabel} · ` : ''}{product.sku || '-'}
        </p>

        {variantGroups.length > 1 && hasColorVariant && (
          <p className="mt-2 text-[11px] text-white/90">
            Color Variants: {colorVariantCount}
          </p>
        )}

        {isSingleVariantGroup && singleVariantOptions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {singleVariantOptions.map((option) => (
              <span
                key={`${product.id}-${singleVariantId}-${option.id}`}
                className="px-1.5 py-0.5 text-[9px] border text-white rounded-sm"
                style={{ borderColor: '#6C72B2', backgroundColor: 'transparent' }}
              >
                {option.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-end justify-between">
          <div className="flex flex-col">
            {formattedOriginalPrice && (
              <p className="text-[11px] leading-none line-through" style={{ color: '#8f94b8' }}>
                {formattedOriginalPrice}
              </p>
            )}
            <p className="text-[15px] font-medium leading-none mt-1" style={{ color: '#FFCC00' }}>{formattedPrice}</p>
          </div>
          <p className={`text-[15px] font-semibold ${overallStock === 0 ? 'text-red-400' : lowStock ? 'text-orange-300' : 'text-white'}`}>
            Stock: {overallStock}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const ProductDetailsModal = ({ product, onClose, colors }: {
  product?: Product;
  onClose: () => void;
  colors: ThemeColors;
}) => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (!product) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [product]);

  if (!product) return null;

  const gallery = (Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image]
  ).filter((img) => isImageSource(String(img || '')));

  const hasGallery = gallery.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000]"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl rounded-2xl border overflow-hidden"
          style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.border.faint }}>
            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Product Details</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10"
              style={{ color: colors.text.muted }}
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-5 border-b lg:border-b-0 lg:border-r" style={{ borderColor: colors.border.faint }}>
              <div className="rounded-xl overflow-hidden border relative" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated, height: 320 }}>
                {hasGallery ? (
                  <img src={gallery[currentImage]} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: colors.text.muted }}>
                    No image
                  </div>
                )}

                {hasGallery && gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentImage((i) => (i - 1 + gallery.length) % gallery.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-white"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentImage((i) => (i + 1) % gallery.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-white"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {hasGallery && gallery.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {gallery.map((img, idx) => (
                    <button
                      type="button"
                      key={`${product.id}-thumb-${idx}`}
                      onClick={() => setCurrentImage(idx)}
                      className="w-14 h-14 rounded-lg overflow-hidden border flex-shrink-0"
                      style={{
                        borderColor: idx === currentImage ? '#3b82f6' : colors.border.faint,
                        backgroundColor: colors.bg.elevated,
                      }}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Name</p>
                <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>{product.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>SKU</p>
                  <p style={{ color: '#FFCC00' }}>{product.sku || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Category</p>
                  <p style={{ color: '#FFCC00' }}>{product.category || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Subcategory</p>
                <p style={{ color: '#FFCC00' }}>{product.subcategory || '-'}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Price</p>
                  <p className="font-semibold" style={{ color: '#FFCC00' }}>₱{product.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Stock</p>
                  <p className="font-semibold" style={{ color: colors.text.primary }}>{product.stock}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Status</p>
                  <p
                    className="font-semibold capitalize"
                    style={{
                      color:
                        product.status === 'active'
                          ? '#22c55e'
                          : product.status === 'inactive'
                            ? '#ef4444'
                            : colors.text.primary,
                    }}
                  >
                    {product.status}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t" style={{ borderColor: colors.border.faint }}>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.text.muted }}>Description</p>
                <div className="max-h-36 overflow-y-auto pr-1">
                  <p className="text-sm leading-6 whitespace-pre-wrap" style={{ color: colors.text.secondary }}>
                    {product.description || 'No description.'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Created</p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {new Date(product.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

function toDashboardStatus(status?: string): Product['status'] {
  const normalized = (status || '').toString().toLowerCase();
  if (normalized === 'active' || normalized === 'published') return 'active';
  if (normalized === 'inactive' || normalized === 'suspended') return 'inactive';
  return 'draft';
}

function toDashboardProduct(product: ApiProduct): Product {
  const productRecord = product as ApiProduct & {
    subCategory?: unknown;
    sub_category?: unknown;
    details?: { subcategory?: unknown; subCategory?: unknown; sub_category?: unknown };
    specifications?: { subcategory?: unknown; subCategory?: unknown; sub_category?: unknown };
  };
  const normalizedSubcategory = String(
    product.subcategory
    ?? productRecord.subCategory
    ?? productRecord.sub_category
    ?? productRecord.details?.subcategory
    ?? productRecord.details?.subCategory
    ?? productRecord.details?.sub_category
    ?? productRecord.specifications?.subcategory
    ?? productRecord.specifications?.subCategory
    ?? productRecord.specifications?.sub_category
    ?? ''
  ).trim();
  const images = Array.isArray(product.images)
    ? product.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
    : [];
  const variants: ProductVariant[] = Array.isArray(product.variants)
    ? product.variants
      .map((variant): ProductVariant => ({
        id: String(variant?.id || ''),
        name: String(variant?.name || ''),
        pricingMode: variant?.pricingMode === 'override' ? 'override' : 'modifier',
        options: Array.isArray(variant?.options)
          ? variant.options.map((option) => ({
            id: String(option?.id || ''),
            name: String(option?.name || ''),
            priceAdjustment: Number(option?.priceAdjustment || 0),
            image: String(option?.image || '').trim(),
          }))
          : [],
      }))
      .filter((variant) => variant.id || variant.name || variant.options.length > 0)
    : [];
  const basePrice = typeof product.basePrice === 'number'
    ? product.basePrice
    : (typeof product.compareAtPrice === 'number' && product.compareAtPrice > 0
      ? product.compareAtPrice
      : (typeof product.price === 'number' ? product.price : 0));
  const finalPrice = typeof product.finalPrice === 'number'
    ? product.finalPrice
    : (typeof product.price === 'number' ? product.price : 0);
  const costPrice = typeof product.costPrice === 'number' ? product.costPrice : null;
  const priceRangeMin = typeof product.priceRangeMin === 'number' ? product.priceRangeMin : null;
  const priceRangeMax = typeof product.priceRangeMax === 'number' ? product.priceRangeMax : null;
  const discount = typeof product.discount === 'number' ? product.discount : 0;
  const discountType = product.discountType === 'fixed' ? 'fixed' : 'percentage';
  const hasVariants = typeof product.hasVariants === 'boolean' ? product.hasVariants : variants.length > 0;
  const variantStocks = product.variantStocks && typeof product.variantStocks === 'object'
    ? Object.entries(product.variantStocks).reduce<Record<string, number>>((acc, [key, value]) => {
      const parsed = Number(value);
      acc[key] = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
      return acc;
    }, {})
    : {};
  const variantPrices = product.variantPrices && typeof product.variantPrices === 'object'
    ? Object.entries(product.variantPrices).reduce<Record<string, number>>((acc, [key, value]) => {
      const parsed = Number(value);
      acc[key] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
      return acc;
    }, {})
    : {};
  const normalizedStock = typeof product.onHandStock === 'number'
    ? product.onHandStock
    : (typeof product.stock === 'number' ? product.stock : 0);

  return {
    id: product.id,
    name: product.name || 'Untitled Product',
    sku: product.sku || '',
    category: product.category || 'General',
    subcategory: normalizedSubcategory,
    description: product.description || '',
    price: finalPrice,
    basePrice,
    costPrice,
    finalPrice,
    compareAtPrice: typeof product.compareAtPrice === 'number' ? product.compareAtPrice : null,
    discount,
    discountType,
    hasVariants,
    variants,
    variantStocks,
    variantPrices,
    priceRangeMin,
    priceRangeMax,
    stock: normalizedStock,
    lowStockThreshold: typeof product.lowStockThreshold === 'number' ? product.lowStockThreshold : DEFAULT_LOW_STOCK_THRESHOLD,
    status: toDashboardStatus(product.status),
    image: images[0] || '[product]',
    images,
    createdAt: product.createdAt || new Date().toISOString(),
    sales: 0,
    revenue: 0,
  };
}

function normalizeSubdomain(value?: string | null): string {
  return (value || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

export default function ProductsPage() {
  const { colors, theme } = useTheme();
  const { showConfirm, showAlert } = useAlert();
  const { selectedProject, loading: projectLoading } = useProject();
  const selectedSubdomain = normalizeSubdomain(selectedProject?.subdomain);
  const blockedAddProductMessage = !selectedSubdomain
    ? 'Set a subdomain for this website first to manage products.'
    : null;
  const canAddProducts = Boolean(selectedSubdomain);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'low-stock' | 'out-of-stock'>('all');
  const [viewMode, setViewMode] = useState<'tile' | 'list'>('tile');
  const [showStatusFilterMenu, setShowStatusFilterMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [viewingProduct, setViewingProduct] = useState<Product | undefined>();
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [productPopup, setProductPopup] = useState<ProductPopupState>({
    open: false,
    message: '',
    tone: 'success',
  });
  const productPopupTimerRef = useRef<number | null>(null);

  const showProductPopup = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    if (productPopupTimerRef.current) {
      window.clearTimeout(productPopupTimerRef.current);
    }

    setProductPopup({ open: true, message, tone });

    productPopupTimerRef.current = window.setTimeout(() => {
      setProductPopup((prev) => ({ ...prev, open: false }));
      productPopupTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (productPopupTimerRef.current) {
        window.clearTimeout(productPopupTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showStatusFilterMenu) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (statusMenuRef.current?.contains(target)) return;
      setShowStatusFilterMenu(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showStatusFilterMenu]);

  const loadProducts = useCallback(async () => {
      if (projectLoading) {
        setLoadingProducts(true);
        return;
      }
      setLoadingProducts(true);
      if (!canAddProducts) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }
      try {
        const res = await listProducts({
          subdomain: selectedSubdomain,
          page: 1,
          limit: 500,
        });
        if (res?.success && Array.isArray(res.items)) {
          setProducts(res.items.map(toDashboardProduct));
        } else {
          setProducts([]);
        }
      } catch (error) {
        setProducts([]);
        showAlert(error instanceof Error ? error.message : 'Failed to load products', 'error');
      } finally {
        setLoadingProducts(false);
      }
    }, [projectLoading, canAddProducts, selectedSubdomain, showAlert]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const handleRefreshOnFocus = () => {
      if (showAddModal || Boolean(editingProduct) || Boolean(viewingProduct)) return;
      void loadProducts();
    };

    const handleVisibilityChange = () => {
      if (showAddModal || Boolean(editingProduct) || Boolean(viewingProduct)) return;
      if (document.visibilityState === 'visible') {
        void loadProducts();
      }
    };

    window.addEventListener('focus', handleRefreshOnFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleRefreshOnFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadProducts, showAddModal, editingProduct, viewingProduct]);

  const categoryCounts = products.reduce<Record<string, number>>((acc, product) => {
    const category = String(product.category || '').trim();
    if (!category) return acc;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const subcategoryCounts = products.reduce<Record<string, number>>((acc, product) => {
    const subcategory = String(product.subcategory || '').trim();
    if (!subcategory) return acc;
    acc[subcategory] = (acc[subcategory] || 0) + 1;
    return acc;
  }, {});

  const categoryOptions = Object.keys(categoryCounts).sort();
  const subcategoryOptions = Object.keys(subcategoryCounts).sort();

  const filterOptions = [
    { value: 'all', label: `All (${products.length})` },
    ...categoryOptions.map((category) => ({
      value: `category:${category}`,
      label: `${category} (${categoryCounts[category]})`,
    })),
    ...subcategoryOptions.map((subcategory) => ({
      value: `subcategory:${subcategory}`,
      label: `Subcategory: ${subcategory} (${subcategoryCounts[subcategory]})`,
    })),
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all'
      || (selectedCategory.startsWith('category:')
        && product.category === selectedCategory.slice('category:'.length))
      || (selectedCategory.startsWith('subcategory:')
        && String(product.subcategory || '').trim() === selectedCategory.slice('subcategory:'.length));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.status === 'active') ||
      (statusFilter === 'inactive' && product.status === 'inactive') ||
      (statusFilter === 'low-stock' && isLowStock(product)) ||
      (statusFilter === 'out-of-stock' && product.stock <= 0);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedFilteredProducts = [...filteredProducts];

  const totalPages = Math.max(1, Math.ceil(sortedFilteredProducts.length / perPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedProducts = sortedFilteredProducts.slice(startIndex, endIndex);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleView = (product: Product) => {
    setViewingProduct(product);
  };

  const handleDelete = async (product: Product) => {
    const confirmed = await showConfirm(`Are you sure you want to delete ${product.name}?`);
    if (!confirmed) return;
    try {
      await deleteProduct(product.id);
      await loadProducts();
      showAlert('Product deleted successfully', 'success');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to delete product', 'error');
    }
  };


  const handleSaveProduct = async (productData: Partial<Product> & Record<string, unknown>): Promise<boolean> => {
    try {
      let shouldShowAddedPopup = false;
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
      const priceRangeMin = hasVariants
        ? Number(productData.priceRangeMin ?? finalPrice)
        : finalPrice;
      const priceRangeMax = hasVariants
        ? Number(productData.priceRangeMax ?? finalPrice)
        : finalPrice;
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

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        if (!selectedSubdomain) {
          showAlert('Set a subdomain for this website first to manage products.', 'error');
          return false;
        }
        await createProduct({
          subdomain: selectedSubdomain,
          ...payload,
          slug: payload.name.toLowerCase().replace(/\s+/g, '-'),
        });
        shouldShowAddedPopup = true;
      }

      await loadProducts();
      setShowAddModal(false);
      setEditingProduct(undefined);
      if (shouldShowAddedPopup) {
        showProductPopup('Product added successfully!', 'success');
      }
      return true;
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to save product', 'error');
      return false;
    }
  };

  const hasProducts = products.length > 0;
  const productInsights = {
    total: products.length,
    active: products.filter((product) => product.status === 'active').length,
    low: products.filter((product) => isLowStock(product)).length,
    out: products.filter((product) => product.stock <= 0).length,
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {productPopup.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-auto max-w-sm rounded-xl border px-4 py-3 shadow-xl"
              style={{
                backgroundColor: colors.bg.card,
                borderColor: colors.border.faint,
              }}
            >
              <p className="text-sm text-center" style={{ color: productPopup.tone === 'success' ? '#ffffff' : '#ef4444' }}>
                {productPopup.message}
              </p>
              {productPopup.tone === 'success' && (
                <div className="mt-2 flex justify-center">
                  <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="max-w-[1090px] mx-auto pt-6 pb-2">
        <div className="text-center">
          <h1 className="text-[clamp(34px,5vw,56px)] font-extrabold tracking-[-1.8px] text-white leading-[1.06]">
            My{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg, #6702BF 14%, #B36760 48%, #FFCC00 78%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Products
            </span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#8A8FC4' }}>Track stock performance and catalog details.</p>
        </div>

        <div className="mt-6 mb-7 max-w-[860px] mx-auto rounded-2xl border px-5 py-3.5 flex items-center gap-3 bg-[#141446] border-[#1F1F51] [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.03),0_10px_40px_rgba(16,11,62,0.45)]">
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" style={{ color: colors.accent.yellow }}>
            <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <input
            type="text"
            placeholder="Search templates, designs, or actions"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-transparent outline-none text-sm text-white placeholder:text-[#6F70A8]"
          />
        </div>

        {blockedAddProductMessage && (
          <p className="mt-2 text-center text-xs" style={{ color: '#8A8FC4' }}>{blockedAddProductMessage}</p>
        )}

        <div className="mt-0 grid grid-cols-2 lg:grid-cols-4 gap-[10px]">
          {PRODUCT_INSIGHT_CARDS.map((card, idx) => {
            const Icon = card.icon;
            const accentColor = card.id === 'low'
              ? '#b178ff'
              : card.id === 'out'
                ? '#ff4f8c'
                : card.id === 'active'
                  ? '#22d3a4'
                  : '#86a8ff';
            const value = card.id === 'total'
              ? productInsights.total
              : card.id === 'active'
                ? productInsights.active
                : card.id === 'low'
                  ? productInsights.low
                  : productInsights.out;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="rounded-2xl border"
                style={{ backgroundColor: '#141446', borderColor: '#2D3A90', minHeight: 72, padding: '10px 14px 12px' }}
              >
                <div className="flex items-center gap-[7px] mb-1">
                  <Icon className="w-3 h-3" style={{ color: accentColor }} />
                  <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: '#7e72a9', letterSpacing: '0.8px' }}>
                    {card.label}
                  </span>
                </div>
                <span className="text-2xl font-bold" style={{ color: '#f2ecff', letterSpacing: '-0.8px', lineHeight: 1.2 }}>
                  {String(value)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {loadingProducts ? (
        <section className="max-w-[1090px] mx-auto text-center py-16 rounded-2xl border" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
          <p style={{ color: colors.text.secondary }}>Loading products...</p>
        </section>
      ) : hasProducts ? (
        <>
          <div id="inventory-section" className="max-w-[1090px] mx-auto mb-5">
            <div className="flex items-center justify-between gap-[10px] flex-wrap">
              <div className="flex items-center gap-2 justify-start">
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                    className="h-[46px] px-4 rounded-xl border text-[13px] font-semibold min-w-[156px] appearance-none pr-9"
                    style={{ backgroundColor: '#141446', borderColor: '#2D3A90', color: '#ddd1ff' }}
                  >
                    {filterOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: '#b6abd6' }}>▼</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  disabled={!canAddProducts}
                  className={`h-[46px] px-4 rounded-xl border flex items-center justify-center text-[13px] font-bold ${canAddProducts ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'}`}
                  style={{ backgroundColor: '#141446', borderColor: '#2D3A90' }}
                  title="Add product"
                >
                  + Add Product
                </button>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <div ref={statusMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStatusFilterMenu((prev) => !prev)}
                    className="h-10 w-10 rounded-xl border flex items-center justify-center hover:opacity-90"
                    style={{ backgroundColor: '#141446', borderColor: '#2D3A90' }}
                    title="Filter products"
                  >
                    <img src="/icons/products/Sort%20Amount%20Up.png" alt="Filter" className="h-5 w-5" />
                  </button>
                  {showStatusFilterMenu && (
                    <div
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl border p-2 z-30"
                      style={{ backgroundColor: '#141446', borderColor: '#2D3A90' }}
                    >
                      {[
                        { value: 'all', label: 'All' },
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'low-stock', label: 'Low Stock' },
                        { value: 'out-of-stock', label: 'Out of Stock' },
                      ].map((item) => {
                        const checked = statusFilter === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setStatusFilter(item.value as typeof statusFilter);
                              setCurrentPage(1);
                              setShowStatusFilterMenu(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/5"
                            style={{ color: '#D2D6F7' }}
                          >
                            <span>{item.label}</span>
                            <span>{checked ? '✓' : ''}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode((prev) => (prev === 'tile' ? 'list' : 'tile'))}
                  className="h-10 w-10 rounded-xl border flex items-center justify-center hover:opacity-90"
                  style={{ backgroundColor: '#141446', borderColor: '#2D3A90' }}
                  title={viewMode === 'tile' ? 'Switch to list view' : 'Switch to tile view'}
                >
                  {viewMode === 'tile' ? (
                    <img src="/icons/products/Bulleted%20List.png" alt="List view" className="h-5 w-5" />
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="4" y="4" width="6" height="6" rx="1" />
                      <rect x="14" y="4" width="6" height="6" rx="1" />
                      <rect x="4" y="14" width="6" height="6" rx="1" />
                      <rect x="14" y="14" width="6" height="6" rx="1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2" style={{ color: '#D2D6F7' }}>
            <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 rounded-full text-sm disabled:opacity-40">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const page = i + 1;
              const active = page === currentPage;
              return (
                <button
                  key={`page-dot-${page}`}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-full text-sm ${active ? 'bg-white/20 text-white' : 'bg-[#1A2165] text-[#BBC1E9]'}`}
                >
                  {page}
                </button>
              );
            })}
            {totalPages > 5 && <span className="px-1">...</span>}
            {totalPages > 5 && (
              <button type="button" onClick={() => setCurrentPage(totalPages)} className={`h-8 w-8 rounded-full text-sm ${currentPage === totalPages ? 'bg-white/20 text-white' : 'bg-[#1A2165] text-[#BBC1E9]'}`}>{totalPages}</button>
            )}
            <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 rounded-full text-sm disabled:opacity-40">›</button>
          </div>

          {filteredProducts.length > 0 ? (
            <>
              <div id="products-grid" className={`max-w-[1090px] mx-auto grid gap-3 md:gap-4 lg:gap-5 ${viewMode === 'tile' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4' : 'grid-cols-1'}`}>
                <AnimatePresence>
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      colors={colors}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isTransitioningOut={false}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <section className="max-w-[1090px] mx-auto text-center py-16 rounded-2xl border" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <div className="mx-auto w-14 h-14 rounded-2xl border flex items-center justify-center" style={{ borderColor: colors.border.default, backgroundColor: colors.bg.elevated }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.text.muted }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7.5L12 3 4 7.5M20 7.5v9L12 21m8-13.5L12 12M4 7.5v9L12 21M4 7.5L12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mt-5 mb-2" style={{ color: colors.text.primary }}>
                No matching products
              </h3>
              <p style={{ color: colors.text.secondary }}>
                Try changing search or category filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setCurrentPage(1);
                }}
                className="mt-5 px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: colors.border.faint, color: colors.text.primary, backgroundColor: colors.bg.elevated }}
              >
                Clear filters
              </button>
            </section>
          )}
        </>
      ) : (
        <section className="max-w-[1090px] mx-auto text-center py-20 rounded-2xl border" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
          <div className="mx-auto w-16 h-16 rounded-2xl border flex items-center justify-center" style={{ borderColor: colors.border.default, backgroundColor: colors.bg.elevated }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.text.muted }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7.5L12 3 4 7.5M20 7.5v9L12 21m8-13.5L12 12M4 7.5v9L12 21M4 7.5L12 12" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold mt-5 mb-2" style={{ color: colors.text.primary }}>
            No products yet
          </h3>
          <p className="max-w-md mx-auto" style={{ color: colors.text.secondary }}>
            {canAddProducts
              ? 'Start by adding your first product to build your inventory.'
              : blockedAddProductMessage}
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            disabled={!canAddProducts}
            className={`mt-6 mx-auto px-4 py-2.5 rounded-lg text-white font-medium transition-colors shadow-sm ${canAddProducts ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'}`}
          >
            {canAddProducts ? 'Add your first product' : 'Publish website first'}
          </button>
        </section>
      )}

      <ProductAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingProduct(undefined);
        }}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
        uploadSubdomain={selectedSubdomain}
        projectIndustry={selectedProject?.industry || null}
      />

      <AnimatePresence>
        {viewingProduct && (
          <ProductDetailsModal
            key={viewingProduct.id}
            product={viewingProduct}
            onClose={() => setViewingProduct(undefined)}
            colors={colors}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
