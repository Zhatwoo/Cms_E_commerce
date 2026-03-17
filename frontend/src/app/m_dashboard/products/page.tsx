'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle } from 'lucide-react';
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
  { id: 'active', label: 'Active', icon: CheckCircle },
  { id: 'inactive', label: 'Inactive', icon: AlertTriangle },
] as const;

function getLowStockThreshold(product: Product): number {
  const threshold = Number(product.lowStockThreshold);
  if (!Number.isFinite(threshold) || threshold < 0) return DEFAULT_LOW_STOCK_THRESHOLD;
  return threshold;
}

function isLowStock(product: Product): boolean {
  return product.stock > 0 && product.stock < getLowStockThreshold(product);
}

function formatProductPrice(product: Product): string {
  const priceRangeMin = Number(product.priceRangeMin);
  const priceRangeMax = Number(product.priceRangeMax);
  const hasPriceRange = Number.isFinite(priceRangeMin)
    && Number.isFinite(priceRangeMax)
    && priceRangeMin >= 0
    && priceRangeMax >= 0
    && priceRangeMax >= priceRangeMin;

  if (hasPriceRange) {
    if (priceRangeMin === priceRangeMax) return `P${Math.round(priceRangeMin).toLocaleString()}.00`;
    return `P${Math.round(priceRangeMin).toLocaleString()} - P${Math.round(priceRangeMax).toLocaleString()}`;
  }

  return `P${Math.round(Number(product.price || 0)).toLocaleString()}.00`;
}

function getVariantLabelsForList(product: Product): string[] {
  const groups = getVariantGroups(product);
  if (groups.length === 0) return ['NO VARIANT'];

  if (groups.length === 1) {
    const options = groups[0]?.options?.map((o) => String(o.name || '').trim()).filter(Boolean) || [];
    if (options.length <= 3) return options;
    return [...options.slice(0, 2), `+${options.length - 2}`];
  }

  const firstGroup = groups[0];
  const options = firstGroup?.options?.map((o) => String(o.name || '').trim()).filter(Boolean) || [];
  if (options.length === 0) return [`${groups.length} VARIANTS`];
  if (options.length <= 2) return options;
  return [...options.slice(0, 1), `+${options.length - 1}`];
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

function getVariantOptionImages(product: Product): string[] {
  const seen = new Set<string>();
  const images: string[] = [];

  for (const variant of getVariantGroups(product)) {
    for (const option of variant.options) {
      const image = String(option?.image || '').trim();
      if (!isImageSource(image) || seen.has(image)) continue;
      seen.add(image);
      images.push(image);
    }
  }

  return images;
}

function colorFromName(value: string): string {
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
  const palette = ['#EAE3F9', '#F23939', '#2F49D8', '#D81CBF', '#22c55e', '#f59e0b', '#14b8a6'];
  const hash = Array.from(trimmed.toLowerCase()).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const ProductCard = ({ product, colors, onView, onEdit, onDelete, isTransitioningOut, menuOpen, onToggleMenu, onCloseMenu }: {
  product: Product;
  colors: ThemeColors;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  isTransitioningOut?: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}) => {
  const { theme } = useTheme();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => getInitialVariantSelection(product));
  const selectedVariantImage = getSelectedVariantImage(product, selectedOptions);
  const imageValue = String(selectedVariantImage || product.image || '').trim();
  const showImage = isImageSource(imageValue);
  const variantGroups = getVariantGroups(product);
  const colorVariant = variantGroups.find((variant) => variant.name.toLowerCase().includes('color'));
  const hasColorVariant = Boolean(colorVariant);
  const colorVariantCount = colorVariant?.options?.length ?? 0;
  const isSingleVariantGroup = variantGroups.length === 1;
  const singleVariantGroup = isSingleVariantGroup ? variantGroups[0] : null;
  const singleVariantId = singleVariantGroup?.id || '';
  const singleVariantOptions = singleVariantGroup?.options ?? [];
  const maxVisibleVariantChips = 2;
  const totalVariantLabelChars = singleVariantOptions.reduce((sum, option) => sum + String(option.name || '').length, 0)
    + Math.max(0, singleVariantOptions.length - 1);
  const canDisplayAllVariantsInOneLine = singleVariantOptions.length <= 3 && totalVariantLabelChars <= 18;
  const visibleVariantOptions = canDisplayAllVariantsInOneLine
    ? singleVariantOptions
    : singleVariantOptions.slice(0, maxVisibleVariantChips);
  const hiddenVariantCount = Math.max(0, singleVariantOptions.length - visibleVariantOptions.length);
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
      onClick={() => onView(product)}
      className={`group relative border transition-all duration-300 flex flex-col h-full cursor-pointer hover:-translate-y-1 ${
        menuOpen ? 'z-40' : 'z-0'
      } ${
        theme === 'dark'
          ? 'rounded-[32px] bg-[#15093E] border-[#272261] shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-[#FFCE00]/50'
          : 'rounded-[32px] bg-white border-[#8B5CF6]/20 shadow-[0_15px_35px_rgba(139,92,246,0.08)] hover:border-[#8B5CF6]/60'
      }`}
    >
      {/* IMAGE SECTION */}
      <div
        className="relative w-full aspect-video overflow-visible border-b"
        style={{
          borderColor: colors.border.default,
          borderTopLeftRadius: '31px',
          borderTopRightRadius: '31px'
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden flex items-center justify-center"
          style={{
            backgroundColor: theme === 'dark' ? '#0A0A26' : '#ffffff',
            borderTopLeftRadius: '31px',
            borderTopRightRadius: '31px'
          }}
        >
          {showImage ? (
            <img
              src={imageValue}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-3 opacity-20">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[11px] font-bold uppercase tracking-widest">No visual</span>
            </div>
          )}
        </div>

        {/* Badges and Buttons */}
        <span
          className="absolute left-4 top-4 z-10 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] backdrop-blur-md"
          style={statusStyle}
        >
          {statusLabel}
        </span>

        <button
          data-product-menu-root="true"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleMenu();
          }}
          className={`absolute top-4 right-4 z-20 h-10 w-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md border ${
            theme === 'dark' ? 'bg-black/40 text-white/40 hover:text-white border-white/10' : 'bg-white/60 text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white border-[#8B5CF6]/10'
          }`}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="18" r="1.8" />
          </svg>
        </button>

        {menuOpen && (
          <div
            data-product-menu-root="true"
            className={`absolute right-4 top-15 z-30 w-44 rounded-2xl border p-1.5 shadow-2xl backdrop-blur-2xl ${
              theme === 'dark' ? 'bg-[#15093E]/95 border-[#272261] text-white' : 'bg-white/95 border-[#8B5CF6]/20 text-slate-700'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={() => { onCloseMenu(); onView(product); }} className="w-full px-3 py-2.5 rounded-xl text-left text-[12px] font-bold uppercase tracking-wide hover:bg-black/5 dark:hover:bg-white/5 transition-colors">View Details</button>
            <button type="button" onClick={() => { onCloseMenu(); onEdit(product); }} className="w-full px-3 py-2.5 rounded-xl text-left text-[12px] font-bold uppercase tracking-wide hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Edit Product</button>
            <div className="h-px bg-current opacity-5 my-1 mx-2" />
            <button type="button" onClick={() => { onCloseMenu(); onDelete(product); }} className="w-full px-3 py-2.5 rounded-xl text-left text-[12px] font-black uppercase tracking-widest text-[#BE123C] bg-[#BE123C]/5 border border-[#BE123C]/10 hover:bg-[#BE123C]/10 transition-colors">Delete</button>
          </div>
        )}
      </div>

      {/* CONTENT SECTION */}
      <div className="p-7 flex-1 flex flex-col">
        <div className="flex flex-col mb-4">
          {subcategoryLabel && (
            <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-1.5" style={{ color: colors.text.muted }}>
              {subcategoryLabel}
            </span>
          )}
          <h3 className="font-bold text-[22px] leading-tight tracking-tight line-clamp-2" style={{ color: colors.text.primary }}>
            {product.name}
          </h3>
        </div>

        {/* Metadata List */}
        <div className="flex flex-col gap-3.5 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest opacity-30" style={{ color: colors.text.muted }}>SKU</span>
            <span className="text-[13px] font-mono font-bold" style={{ color: colors.accent.purple }}>{product.sku || '-'}</span>
          </div>

          {variantGroups.length > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest opacity-30" style={{ color: colors.text.muted }}>Variants</span>
              <span className="text-[13px] font-bold" style={{ color: colors.text.secondary }}>{colorVariantCount} Total</span>
            </div>
          )}

          {/* Variant Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {isSingleVariantGroup && singleVariantOptions.length > 0 ? (
              visibleVariantOptions.map((option) => (
                <span
                  key={`${product.id}-${singleVariantId}-${option.id}`}
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-tight border rounded-lg"
                  style={{ borderColor: colors.border.default, color: colors.text.secondary }}
                >
                  {option.name}
                </span>
              ))
            ) : variantGroups.length === 0 && (
              <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-lg opacity-20"
                    style={{ borderColor: colors.border.default, color: colors.text.secondary }}>
                Standard
              </span>
            )}
            {hiddenVariantCount > 0 && (
              <span className="px-3 py-1.5 text-[10px] font-black border rounded-lg"
                    style={{ borderColor: colors.border.default, color: colors.text.secondary }}>
                +{hiddenVariantCount}
              </span>
            )}
          </div>
        </div>

        {/* Price & Stock Footer */}
        <div className="mt-auto pt-6 flex items-end justify-between border-t border-dashed" style={{ borderColor: colors.border.faint }}>
          <div className="flex flex-col">
            {formattedOriginalPrice && (
              <p className="text-[12px] font-black line-through opacity-30 mb-1" style={{ color: colors.text.muted }}>
                {formattedOriginalPrice}
              </p>
            )}
            <p className="text-[22px] font-black leading-none tracking-tight" style={{ color: theme === 'dark' ? '#FFCE00' : colors.accent.purple }}>
              {formattedPrice}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-1.5" style={{ color: colors.text.muted }}>Stock</span>
            <p
              className="text-[20px] font-black leading-none"
              style={{ color: overallStock === 0 ? '#f87171' : lowStock ? '#fdba74' : colors.text.primary }}
            >
              {overallStock}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProductDetailsModal = ({ product, onClose, colors, onEditProduct }: {
  product?: Product;
  onClose: () => void;
  colors: ThemeColors;
  onEditProduct: (product: Product) => void;
}) => {
  const { theme } = useTheme();
  const [currentImage, setCurrentImage] = useState(0);
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!product) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [product]);

  if (!product) return null;

  const baseGallery = (Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image]
  ).filter((img) => isImageSource(String(img || '')));
  const variantGallery = getVariantOptionImages(product);
  const gallery = Array.from(new Set([...baseGallery, ...variantGallery]));

  const hasGallery = gallery.length > 0;

  useEffect(() => {
    setCurrentImage(0);
  }, [product.id]);

  useEffect(() => {
    if (currentImage < gallery.length) return;
    setCurrentImage(0);
  }, [currentImage, gallery.length]);

  const handleThumbnailWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const element = thumbnailStripRef.current;
    if (!element) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    event.preventDefault();
    element.scrollLeft += event.deltaY;
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 z-[2147483000] flex items-center justify-center p-4 backdrop-blur-sm"
  style={{ backgroundColor: 'rgba(10, 5, 30, 0.4)' }}
  onClick={onClose}
>
  <motion.div
    initial={{ scale: 0.98, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border"
    style={{ 
      backgroundColor: theme === 'dark' ? '#15093E' : '#FFFFFF',
      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
      fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
    }}
    onClick={(e) => e.stopPropagation()}
  >
    {/* Clean Header */}
    <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }}>
      <h2 className="text-lg font-bold" style={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>Product Details</h2>
      <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>

    <div className="flex flex-col lg:flex-row">
      {/* Left: Media & Action Sidebar */}
      <div className="w-full lg:w-[42%] p-6 border-r" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F3F4F6', backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : '#FAFAFA' }}>
        <div className="relative aspect-square rounded-xl overflow-hidden border bg-white shadow-inner" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }}>
          {hasGallery ? (
            <img src={gallery[currentImage]} className="w-full h-full object-contain p-4" alt={product.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold uppercase opacity-20">No Image</div>
          )}
          
          {hasGallery && gallery.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <button onClick={() => setCurrentImage((i) => (i - 1 + gallery.length) % gallery.length)} className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
              <button onClick={() => setCurrentImage((i) => (i + 1) % gallery.length)} className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M9 5l7 7-7 7" /></svg></button>
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {hasGallery && gallery.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
            {gallery.map((img, idx) => (
              <button key={idx} onClick={() => setCurrentImage(idx)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${idx === currentImage ? 'border-[#8B5CF6]' : 'border-transparent opacity-60'}`}><img src={img} className="w-full h-full object-cover" /></button>
            ))}
          </div>
        )}

        {/* Brand Action Button */}
        <button
          onClick={() => onEditProduct(product)}
          className="w-full mt-6 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
          style={{ background: 'linear-gradient(90deg, #7C3AED 0%, #DB2777 100%)' }}
        >
          Edit Product
        </button>
      </div>

      {/* Right: Structured Information */}
      <div className="flex-1 p-8 space-y-8">
        <section>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: '#8B5CF6' }}>Product Identity</p>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>{product.name}</h1>
        </section>

        <div className="grid grid-cols-2 gap-y-8 gap-x-4">
          <InfoBlock label="SKU" value={product.sku || '—'} isAccent />
          <InfoBlock label="Category" value={product.category || '—'} isAccent />
          <InfoBlock label="Subcategory" value={product.subcategory || '—'} isAccent />
          <InfoBlock label="Price" value={`₱${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} isAccent />
          <InfoBlock label="Stock Level" value={product.stock} />
          <InfoBlock label="Live Status" value={product.status} isStatus />
        </div>

        <div className="pt-6 border-t" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }}>
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em] mb-3"
            style={{ color: theme === 'dark' ? '#9CA3AF' : '#64748B' }}
          >
            Detailed Description
          </p>
          <p className="text-sm leading-relaxed max-h-32 overflow-y-auto pr-4" style={{ color: theme === 'dark' ? '#D1D5DB' : '#4B5563' }}>
            {product.description || 'No description provided for this product.'}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-4" style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-[11px] font-medium">Record Created: {new Date(product.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  </motion.div>
</motion.div>,
    document.body
  );
};

const InfoBlock = ({ label, value, isAccent = false, isStatus = false }: {
  label: string;
  value: React.ReactNode;
  isAccent?: boolean;
  isStatus?: boolean;
}) => {
  const { theme } = useTheme();

  const normalized = String(value || '').toLowerCase();
  let color = theme === 'dark' ? '#FFFFFF' : '#111827';
  if (isAccent) color = '#8B5CF6';
  if (isStatus) {
    color = normalized === 'active'
      ? '#22c55e'
      : normalized === 'inactive'
        ? '#f43f5e'
        : (theme === 'dark' ? '#E5E7EB' : '#374151');
  }

  const labelColor = theme === 'dark' ? '#9CA3AF' : '#64748B';

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: labelColor }}>{label}</p>
      <p className="text-sm font-bold capitalize" style={{ color }}>{value}</p>
    </div>
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
          ? variant.options.map((option) => {
            const optionRecord = option as {
              id?: unknown;
              name?: unknown;
              priceAdjustment?: unknown;
              image?: unknown;
              imageUrl?: unknown;
              image_url?: unknown;
              imgUrl?: unknown;
              img_url?: unknown;
            };
            return {
              id: String(optionRecord?.id || ''),
              name: String(optionRecord?.name || ''),
              priceAdjustment: Number(optionRecord?.priceAdjustment || 0),
              image: String(
                optionRecord?.image
                ?? optionRecord?.imageUrl
                ?? optionRecord?.image_url
                ?? optionRecord?.imgUrl
                ?? optionRecord?.img_url
                ?? ''
              ).trim(),
            };
          })
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'tile' | 'list'>('tile');
  const [showCategoryFilterMenu, setShowCategoryFilterMenu] = useState(false);
  const [showStatusFilterMenu, setShowStatusFilterMenu] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [viewingProduct, setViewingProduct] = useState<Product | undefined>();
  const [openMenuProductId, setOpenMenuProductId] = useState<string | null>(null);
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

    const popupDuration = tone === 'success' ? 1500 : 3000;

    productPopupTimerRef.current = window.setTimeout(() => {
      setProductPopup((prev) => ({ ...prev, open: false }));
      productPopupTimerRef.current = null;
    }, popupDuration);
  }, []);

  useEffect(() => {
    return () => {
      if (productPopupTimerRef.current) {
        window.clearTimeout(productPopupTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showStatusFilterMenu && !showCategoryFilterMenu) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (categoryMenuRef.current?.contains(target)) return;
      if (statusMenuRef.current?.contains(target)) return;
      setShowCategoryFilterMenu(false);
      setShowStatusFilterMenu(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showStatusFilterMenu, showCategoryFilterMenu]);

  useEffect(() => {
    if (!openMenuProductId) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-product-menu-root="true"]')) return;
      setOpenMenuProductId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openMenuProductId]);

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

  const handleRefreshOnFocus = useCallback(() => {
    if (showAddModal || Boolean(editingProduct) || Boolean(viewingProduct)) return;
    void loadProducts();
  }, [showAddModal, editingProduct, viewingProduct, loadProducts]);

  useEffect(() => {
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
  }, [loadProducts, handleRefreshOnFocus, showAddModal, editingProduct, viewingProduct]);

  const subcategoryCounts = products.reduce<Record<string, number>>((acc, product) => {
    const subcategory = String(product.subcategory || '').trim();
    if (!subcategory) return acc;
    acc[subcategory] = (acc[subcategory] || 0) + 1;
    return acc;
  }, {});

  const subcategoryOptions = Object.keys(subcategoryCounts).sort();

  const filterOptions = [
    { value: 'all', label: `All (${products.length})` },
    ...subcategoryOptions.map((subcategory) => ({
      value: `subcategory:${subcategory}`,
      label: `${subcategory} (${subcategoryCounts[subcategory]})`,
    })),
  ];
  const selectedCategoryLabel = filterOptions.find((option) => option.value === selectedCategory)?.label ?? 'All';

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all'
      || (selectedCategory.startsWith('subcategory:')
        && String(product.subcategory || '').trim() === selectedCategory.slice('subcategory:'.length));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.status === 'active') ||
      (statusFilter === 'inactive' && product.status === 'inactive');
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
      showProductPopup('Product deleted successfully!', 'success');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to delete product', 'error');
    }
  };


  const handleSaveProduct = async (productData: Partial<Product> & Record<string, unknown>): Promise<boolean> => {
    try {
      let successMessage: string | null = null;
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
      const compareAtPriceRaw = productData.compareAtPrice;
      const compareAtPrice = compareAtPriceRaw === null || compareAtPriceRaw === undefined
        ? null
        : (() => {
          const parsed = Number(compareAtPriceRaw);
          return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        })();
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
        compareAtPrice,
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
        successMessage = 'Product updated successfully!';
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
        successMessage = 'Product added successfully!';
      }

      await loadProducts();
      setShowAddModal(false);
      setEditingProduct(undefined);
      if (successMessage) {
        showProductPopup(successMessage, 'success');
      }
      return true;
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to save product', 'error');
      return false;
    }
  };

  const hasProducts = products.length > 0;
  const productInsights = {
    active: products.filter((product) => product.status === 'active').length,
    inactive: products.filter((product) => product.status === 'inactive').length,
  };

  return (
    <div className="dashboard-landing-light space-y-6 [font-family:var(--font-outfit),sans-serif]">
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {productPopup.open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[2147483000] flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(10, 8, 28, 0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                className="w-full max-w-[250px] rounded-[14px] border px-4 py-3 shadow-xl"
                style={{
                  backgroundColor: '#181a59',
                  borderColor: productPopup.tone === 'success' ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.35)',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
                }}
              >
                <p className="text-center" style={{ color: '#ffffff', fontSize: 'clamp(12px, 1.4vw, 16px)', fontWeight: 700, letterSpacing: -0.1, lineHeight: 1.25 }}>
                  {productPopup.message}
                </p>
                <div className="mt-2 flex justify-center">
                  {productPopup.tone === 'success'
                    ? <CheckCircle className="w-6 h-6" style={{ color: '#22c55e' }} />
                    : <AlertTriangle className="w-6 h-6" style={{ color: '#ef4444' }} />}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <section className="max-w-[1090px] mx-auto pt-6 pb-2">
        <div className="text-center">
          <h1
            className="text-4xl sm:text-6xl lg:text-[76px] text-[clamp(34px,5vw,56px)] font-black tracking-[-1.8px] leading-[1.06]"
            style={{ color: colors.text.primary }}
          >
            My{' '}
            <span
              className={`inline-block bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
            >
              Products
            </span>
          </h1>
          <p className="mt-6 text-base" style={{ color: colors.text.secondary }}>Track stock performance and catalog details.</p>
        </div>

        <div
          className={`m-dashboard-search-shadow mt-6 mb-7 max-w-[860px] mx-auto rounded-2xl border px-5 py-3.5 flex items-center gap-3 transition-all duration-500
            ${theme === 'dark'
              ? 'bg-[#141446] border-[#1F1F51] shadow-[0_0_12px_rgba(31,31,81,0.4)] hover:border-[#2a2a6e] focus-within:border-[#3b3b8a]'
              : 'bg-white/80 backdrop-blur-md border-[#E2E8F0] shadow-[0_0_15px_rgba(139,92,246,0.1),0_0_1px_rgba(139,92,246,0.2)] hover:border-[#8B5CF6]/40 focus-within:border-[#8B5CF6] focus-within:shadow-[0_0_25px_rgba(139,92,246,0.2)]'
            }
          `}
        >
          <div className="relative">
            {theme === 'light' && (
              <div className="absolute inset-0 bg-[#8B5CF6] blur-md opacity-20 scale-150 rounded-full" />
            )}
            <svg
              viewBox="0 0 20 20"
              className={`h-4 w-4 shrink-0 relative z-10 transition-all duration-300 ${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'}`}
              fill="none"
            >
              <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search templates, designs, or actions"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className={`w-full bg-transparent outline-none text-sm font-medium ${theme === 'dark' ? 'text-white placeholder:text-[#6F70A8]' : 'text-[#120533] placeholder:text-[#120533]/30'}`}
          />
        </div>

        {blockedAddProductMessage && (
          <p className="mt-2 text-center text-xs" style={{ color: colors.text.muted }}>{blockedAddProductMessage}</p>
        )}

        <div className="mt-10 grid grid-cols-2 gap-[16px]">
          {PRODUCT_INSIGHT_CARDS.map((card, idx) => {
            const Icon = card.icon;
            const accentColor = card.id === 'active' ? '#22d3a4' : '#ff4f8c';
            const value = card.id === 'active' ? productInsights.active : productInsights.inactive;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="relative overflow-hidden rounded-3xl border transition-all duration-500 hover:shadow-xl"
                style={{ 
                  backgroundColor: colors.bg.card, 
                  borderColor: `${accentColor}25`, 
                  minHeight: 100, 
                  padding: '20px 24px',
                  boxShadow: '0 4px 20px -12px rgba(0,0,0,0.3)'
                }}
              >
                <div 
                  className="absolute -right-4 -top-4 w-20 h-20 opacity-[0.05] blur-2xl rounded-full"
                  style={{ backgroundColor: accentColor }}
                />

                <div className="flex items-center gap-5">
                  <div 
                    className="flex items-center justify-center shrink-0 w-12 h-12 rounded-2xl"
                    style={{ 
                      backgroundColor: `${accentColor}10`,
                      border: `1px solid ${accentColor}20` 
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: accentColor }} />
                  </div>

                  <div className="flex flex-col">
                    <span 
                      className="text-[11px] font-black uppercase tracking-[0.2em] mb-1 opacity-60" 
                      style={{ 
                        color: colors.text.muted,
                        fontFamily: 'var(--font-outfit), sans-serif'
                      }}
                    >
                      {card.label}
                    </span>
                    <div className="flex items-baseline">
                      <span 
                        className="text-3xl font-black leading-none" 
                        style={{ 
                          color: colors.text.primary, 
                          letterSpacing: '-1.5px',
                          fontFamily: 'var(--font-outfit), sans-serif'
                        }}
                      >
                        {String(value)}
                      </span>
                    </div>
                  </div>
                </div>
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
          <div id="inventory-section" className="max-w-272.5 mx-auto mb-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              
              {/* LEFT SIDE: Category Filter & Add Product */}
              <div className="flex items-center gap-3 justify-start">
                <div ref={categoryMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryFilterMenu((prev) => !prev)}
                    className="cursor-pointer h-[48px] px-5 rounded-2xl border text-[13px] font-bold min-w-[180px] flex items-center justify-between gap-3 transition-all duration-300"
                    style={{ 
                      backgroundColor: colors.bg.card, 
                      borderColor: theme === 'dark' ? '#1F1F51' : colors.border.default, 
                      color: colors.text.primary,
                      boxShadow: theme === 'dark' ? '0 0 12px rgba(31,31,81,0.4)' : '0 4px 10px rgba(0,0,0,0.03)'
                    }}
                    title="Filter by subcategory"
                  >
                    <span className="truncate">{selectedCategoryLabel}</span>
                    <svg 
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${showCategoryFilterMenu ? 'rotate-180' : ''}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showCategoryFilterMenu && (
                    <div
                      className="absolute left-0 top-full mt-2 w-64 rounded-2xl border p-2 z-30 shadow-2xl"
                      style={{ backgroundColor: colors.bg.card, borderColor: theme === 'dark' ? '#1F1F51' : colors.border.default }}
                    >
                      {filterOptions.map((option) => {
                        const checked = selectedCategory === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(option.value);
                              setCurrentPage(1);
                              setShowCategoryFilterMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all
                              ${checked 
                                ? (theme === 'dark' ? 'bg-[#FFCE00] text-[#110248]' : 'bg-[#9333ea] text-white')
                                : 'hover:bg-white/5'
                              }`}
                            style={!checked ? { color: colors.text.secondary } : {}}
                          >
                            <span>{option.label}</span>
                            <span>{checked ? '✓' : ''}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  disabled={!canAddProducts}
                  className={`h-12 cursor-pointer px-6 rounded-2xl flex items-center justify-center text-[13px] font-black transition-all duration-300 active:scale-[0.97] 
                    ${canAddProducts ? 'hover:scale-[1.02] hover:opacity-90' : 'opacity-50 cursor-not-allowed'}`}
                  style={theme === 'dark'
                    ? { background: '#FFCE00', borderColor: 'transparent', color: '#110248', boxShadow: '0 0 18px 4px rgba(255,206,0,0.45)' }
                    : { background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)', borderColor: 'transparent', color: '#ffffff', boxShadow: '0 10px 20px -5px rgba(147,51,234,0.3)' }}
                  title="Add product"
                >
                  <span className="mr-2 text-lg leading-none">+</span> Add Product
                </button>
              </div>

              {/* RIGHT SIDE: Status Filter & View Toggle */}
              <div className="flex items-center gap-2 justify-end">
                <div ref={statusMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStatusFilterMenu((prev) => !prev)}
                    className="h-[48px] w-[48px] cursor-pointer rounded-2xl border flex items-center justify-center transition-all duration-300 hover:opacity-80"
                    style={{ 
                      backgroundColor: colors.bg.card, 
                      borderColor: theme === 'dark' ? '#1F1F51' : colors.border.default,
                      boxShadow: theme === 'dark' ? '0 0 12px rgba(31,31,81,0.4)' : '0 4px 10px rgba(0,0,0,0.03)',
                      color: theme === 'dark' ? '#FFCE00' : '#8B5CF6'
                    }}
                    title="Filter products"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                  </button>

                  {showStatusFilterMenu && (
                    <div
                      className="cursor-pointer absolute right-0 top-full mt-2 w-48 rounded-2xl border p-2 z-30 shadow-2xl"
                      style={{ backgroundColor: colors.bg.card, borderColor: theme === 'dark' ? '#1F1F51' : colors.border.default }}
                    >
                      {[
                        { value: 'all', label: 'All' },
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
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
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all
                              ${checked 
                                ? (theme === 'dark' ? 'text-[#FFCE00] bg-white/5' : 'text-[#8B5CF6] bg-[#8B5CF6]/5')
                                : 'hover:bg-white/5'
                              }`}
                            style={!checked ? { color: colors.text.secondary } : {}}
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
                  className="h-12 w-12 rounded-2xl border flex items-center justify-center transition-all duration-300 hover:opacity-80 cursor-pointer"
                  style={{ 
                    backgroundColor: colors.bg.card, 
                    borderColor: theme === 'dark' ? '#1F1F51' : colors.border.default,
                    boxShadow: theme === 'dark' ? '0 0 12px rgba(31,31,81,0.4)' : '0 4px 10px rgba(0,0,0,0.03)',
                    color: theme === 'dark' ? '#FFCE00' : '#8B5CF6'
                  }}
                  title={viewMode === 'tile' ? 'Switch to list view' : 'Switch to tile view'}
                >
                  {viewMode === 'tile' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <rect x="4" y="4" width="6" height="6" rx="1.5" />
                      <rect x="14" y="4" width="6" height="6" rx="1.5" />
                      <rect x="4" y="14" width="6" height="6" rx="1.5" />
                      <rect x="14" y="14" width="6" height="6" rx="1.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
              
          {filteredProducts.length > 0 ? (
            <>
              {viewMode === 'tile' ? (
                <div id="products-grid" className="max-w-[1090px] mx-auto grid gap-3 md:gap-4 lg:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                        menuOpen={openMenuProductId === product.id}
                        onToggleMenu={() => setOpenMenuProductId((prev) => (prev === product.id ? null : product.id))}
                        onCloseMenu={() => setOpenMenuProductId(null)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="max-w-[1090px] mx-auto overflow-hidden">
                  <div style={{ overflowX: 'auto' }}>
                    {/* Header: Exact Vibrant Violet Tone */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.1fr 1.2fr 1.4fr 1.1fr 1.1fr 132px',
                        gap: 16,
                        padding: '20px 24px',
                        minWidth: 860,
                        borderRadius: '24px 24px 0 0',
                       background: theme === 'dark' 
                          ? 'linear-gradient(90deg, #1E1B4B 0%, #312E81 100%)' 
                          : '#8B5CF6',
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        boxShadow: '0 4px 20px rgba(124, 58, 237, 0.15)'
                      }}
                    >
                      <span>Product</span>
                      <span>SKU</span>
                      <span>Variants</span>
                      <span>Price</span>
                      <span>Status</span>
                      <span style={{ justifySelf: 'center' }}>Actions</span>
                    </div>

                    {/* Product Rows Container */}
                    <div 
                      className="flex flex-col gap-1 p-2" 
                      style={{ 
                        backgroundColor: theme === 'dark' ? 'rgba(21, 9, 62, 0.2)' : '#F9F8FF',
                        borderRadius: '0 0 24px 24px',
                        borderLeft: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#EEEAF7'}`,
                        borderRight: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#EEEAF7'}`,
                        borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#EEEAF7'}`,
                        borderTop: 'none'
                      }}
                    >
                      {paginatedProducts.map((product, index) => {
                        const image = String(product.image || '').trim();
                        const showThumb = isImageSource(image);
                        const variantLabels = getVariantLabelsForList(product);
                        const inStock = Number(product.stock || 0) > 0;

                        return (
                          <div
                            key={`list-${product.id}`}
                            onClick={() => handleView(product)}
                            className="group transition-all duration-200"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '2.1fr 1.2fr 1.4fr 1.1fr 1.1fr 132px',
                              gap: 16,
                              padding: '12px 16px',
                              alignItems: 'center',
                              minWidth: 860,
                              borderRadius: '16px',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(139, 92, 246, 0.08)' : '#FFFFFF';
                              e.currentTarget.style.boxShadow = theme === 'dark' 
                                ? 'none' 
                                : '0 6px 16px rgba(124, 58, 237, 0.06)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-violet-100 shadow-sm">
                                {showThumb ? <img src={image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold opacity-30">NA</div>}
                              </div>
                              <p className="font-bold text-[14px] truncate" style={{ color: colors.text.primary }}>{product.name}</p>
                            </div>

                            <div className="text-[13px] font-medium opacity-50" style={{ color: colors.text.primary }}>{product.sku || '—'}</div>

                            <div className="flex flex-wrap gap-1">
                              {variantLabels.map((label, idx) => (
                                <span key={idx} className="px-2.5 py-0.5 text-[9px] font-bold rounded-full border" style={{ borderColor: theme === 'dark' ? '#3A4473' : '#E9E2F8', color: '#7C3AED', backgroundColor: theme === 'dark' ? 'transparent' : '#FFF' }}>
                                  {label}
                                </span>
                              ))}
                            </div>

                            <div className="font-bold text-[14px]" style={{ color: colors.text.primary }}>{formatProductPrice(product)}</div>

                            <div>
                              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${inStock ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {inStock ? 'In Stock' : 'Out'}
                              </span>
                            </div>

                            <div className="flex items-center justify-center gap-2" style={{ justifySelf: 'center' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(product);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(124,58,237,0.28)' : '#F3E8FF';
                                  e.currentTarget.style.borderColor = theme === 'dark' ? '#8B5CF6' : '#C084FC';
                                  e.currentTarget.style.color = theme === 'dark' ? '#E9D5FF' : '#6D28D9';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(124,58,237,0.12)' : '#FFFFFF';
                                  e.currentTarget.style.borderColor = theme === 'dark' ? '#3A4473' : '#E9E2F8';
                                  e.currentTarget.style.color = theme === 'dark' ? '#C4B5FD' : '#7C3AED';
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border transition-all hover:-translate-y-0.5"
                                style={{
                                  borderColor: theme === 'dark' ? '#3A4473' : '#E9E2F8',
                                  color: theme === 'dark' ? '#C4B5FD' : '#7C3AED',
                                  backgroundColor: theme === 'dark' ? 'rgba(124,58,237,0.12)' : '#FFFFFF',
                                }}
                                title="View"
                                aria-label="View product"
                              >
                                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(product);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(245,158,11,0.24)' : '#FEF3C7';
                                  e.currentTarget.style.borderColor = theme === 'dark' ? '#FBBF24' : '#F59E0B';
                                  e.currentTarget.style.color = theme === 'dark' ? '#FDE68A' : '#92400E';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(245,158,11,0.12)' : '#FFFFFF';
                                  e.currentTarget.style.borderColor = theme === 'dark' ? '#3A4473' : '#E9E2F8';
                                  e.currentTarget.style.color = theme === 'dark' ? '#FDE68A' : '#B45309';
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border transition-all hover:-translate-y-0.5"
                                style={{
                                  borderColor: theme === 'dark' ? '#3A4473' : '#E9E2F8',
                                  color: theme === 'dark' ? '#FDE68A' : '#B45309',
                                  backgroundColor: theme === 'dark' ? 'rgba(245,158,11,0.12)' : '#FFFFFF',
                                }}
                                title="Edit"
                                aria-label="Edit product"
                              >
                                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.1 2.1 0 1 1 2.97 2.97L8.62 17.67 4 19l1.33-4.62L16.862 3.487Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 4.85 18.47 7.82" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(product);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(190,24,93,0.24)' : '#FFE4E6';
                                  e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(251,113,133,0.7)' : '#FB7185';
                                  e.currentTarget.style.color = '#BE123C';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(190,24,93,0.12)' : '#FFFFFF';
                                  e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(248,113,113,0.35)' : 'rgba(190,24,93,0.15)';
                                  e.currentTarget.style.color = '#E11D48';
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border transition-all hover:-translate-y-0.5"
                                style={{
                                  borderColor: theme === 'dark' ? 'rgba(248,113,113,0.35)' : 'rgba(190,24,93,0.15)',
                                  color: '#E11D48',
                                  backgroundColor: theme === 'dark' ? 'rgba(190,24,93,0.12)' : '#FFFFFF',
                                }}
                                title="Delete"
                                aria-label="Delete product"
                              >
                                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l1 12a1 1 0 0 0 1 .92h4a1 1 0 0 0 1-.92L16 7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 flex items-center justify-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  className="h-10 w-10 flex items-center justify-center rounded-2xl border transition-all hover:bg-white/5 disabled:opacity-20"
                  style={{ borderColor: colors.border.default, color: colors.text.primary }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <div className="flex items-center gap-1.5 px-2">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const page = i + 1;
                    const active = page === currentPage;
                    return (
                      <button
                        key={`page-${page}`}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className="h-10 w-10 rounded-2xl text-[13px] font-black transition-all duration-300"
                        style={active
                          ? { backgroundColor: colors.accent.purple || '#8B5CF6', color: '#ffffff', boxShadow: '0 8px 15px -5px rgba(139,92,246,0.4)' }
                          : { backgroundColor: 'transparent', color: colors.text.secondary }}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button 
                  type="button" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  className="h-10 w-10 flex items-center justify-center rounded-2xl border transition-all hover:bg-white/5 disabled:opacity-20"
                  style={{ borderColor: colors.border.default, color: colors.text.primary }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
                </button>
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
            className={`mt-6 mx-auto px-4 py-2.5 rounded-lg text-white font-medium transition-opacity shadow-sm ${canAddProducts ? 'hover:opacity-90' : 'opacity-60 cursor-not-allowed'}`}
            style={canAddProducts ? { background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)' } : { background: 'linear-gradient(90deg, #c084fc 0%, #f9a8d4 100%)' }}
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
            onEditProduct={(productToEdit) => {
              setViewingProduct(undefined);
              handleEdit(productToEdit);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}