'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { type Product, type ProductVariant } from '@/app/m_dashboard/lib/productsData';
import { PopMenuButton } from '@/app/m_dashboard/components/buttons/PopMenuButton';
import { StatusBadge } from './statusBadge';

type ThemeColors = {
  [key: string]: any;
};

function isImageSource(value: string): boolean {
  const v = (value || '').trim();
  if (!v) return false;
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(v)) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith('blob:')) return true;
  if (v.startsWith('/')) return true;
  return false;
}

function normalizeImageSource(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const repaired = raw
    .replace(/ImageProducts_img%2F/gi, 'Products_img%2F')
    .replace(/ImageProducts_img\//gi, 'Products_img/');

  if (isImageSource(repaired)) return repaired;

  const bucket = String(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '').trim();
  const looksLikeStoragePath = /^Products_img(?:\/|%2F)/i.test(repaired);
  if (!bucket || !looksLikeStoragePath) return '';

  const [pathPartRaw, queryRaw = ''] = repaired.split('?');
  const pathPart = pathPartRaw.includes('%2F') ? pathPartRaw : encodeURIComponent(pathPartRaw);
  const query = queryRaw.trim();
  const suffix = query ? `?${query}` : '?alt=media';
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${pathPart}${suffix}`;
}

function getVariantGroups(product: Product): ProductVariant[] {
  return Array.isArray(product.variants)
    ? product.variants.filter((variant: ProductVariant) => Array.isArray(variant.options) && variant.options.length > 0)
    : [];
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

function getSelectedVariantImage(product: Product, selectedOptions: Record<string, string>): string | null {
  const groups = getVariantGroups(product);
  for (const variant of groups) {
    if (variant.name.trim().toLowerCase() === 'size') continue;
    const selectedOptionId = selectedOptions[variant.id];
    if (!selectedOptionId) continue;
    const selectedOption = variant.options.find((option: any) => option.id === selectedOptionId);
    const image = normalizeImageSource(selectedOption?.image);
    if (isImageSource(image)) return image;
  }
  return null;
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

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

function getLowStockThreshold(product: Product): number {
  const threshold = Number(product.lowStockThreshold);
  if (!Number.isFinite(threshold) || threshold < 0) return DEFAULT_LOW_STOCK_THRESHOLD;
  return threshold;
}

/**
 * A product card component displayed in tile/grid view.
 *
 * Features:
 * - Shows product image (with fallback), name, SKU, subcategory, and variants.
 * - Displays pricing with optional original price strikethrough.
 * - Color-coded stock status (red for out-of-stock, orange for low-stock).
 * - Variant selection with dynamic pricing updates for variant-specific prices.
 * - Action menu (View, Edit, Delete) with click-outside handling.
 * - Smooth animations and hover effects.
 * - Fixed height (365px) with flex layout for consistent card sizing.
 *
 * Parameters:
 * - `product`: Complete product object with variants, images, pricing, and stock data.
 * - `colors`: Theme color configuration for consistent styling.
 * - `onView`: Called when user clicks the card or View action.
 * - `onEdit`: Called when user clicks the Edit action in the menu.
 * - `onDelete`: Called when user clicks the Delete action in the menu.
 * - `menuOpen`: Boolean tracking whether the action menu is visible.
 * - `onToggleMenu`: Called to open/close the action menu.
 * - `onCloseMenu`: Called to explicitly close the menu.
 */
export function ProductCard({
  product,
  colors,
  theme,
  onView,
  onEdit,
  onDelete,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onSaveProduct,
}: {
  product: Product;
  colors: ThemeColors;
  theme: 'light' | 'dark';
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onSaveProduct?: (productData: Partial<Product> & Record<string, unknown>) => Promise<boolean>;
}) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => getInitialVariantSelection(product));
  const selectedVariantImage = getSelectedVariantImage(product, selectedOptions);
  const firstGalleryImage = Array.isArray(product.images)
    ? product.images.map((img) => normalizeImageSource(img)).find((img) => isImageSource(img)) || ''
    : '';
  const imageValue = normalizeImageSource(selectedVariantImage || firstGalleryImage || product.image || '');
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
  const totalVariantLabelChars = singleVariantOptions.reduce((sum: number, option: any) => sum + String(option.name || '').length, 0)
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

  useEffect(() => {
    setSelectedOptions(getInitialVariantSelection(product));
  }, [product.id, product.variants]);

  return (
    <>
   <motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  className={`group relative flex w-full h-120 flex-col cursor-pointer transition-all duration-500 rounded-[2.5rem] overflow-hidden [font-family:var(--font-outfit),sans-serif] ${
    theme === 'dark' 
      ? 'bg-[#0F0F2D] border border-white/5 shadow-2xl' 
      : 'bg-white border border-[#14034A]/5 shadow-[0_20px_50px_rgba(0,0,0,0.02)]'
  }`}
>
  {/* TOP SECTION: Edge-to-Edge Visuals */}
  <div className="relative w-full h-60 overflow-hidden bg-[#F9F9FB]">
    {/* Pinned Actions: Truly at the edges */}
    <div data-product-menu-root="true" className="absolute right-0 top-0 z-30">
      <PopMenuButton
        theme={theme}
        isOpen={menuOpen}
        onToggle={onToggleMenu}
        options={[
          {
            key: 'view',
            label: 'View',
            onSelect: () => {
              onCloseMenu();
              onView(product);
            },
          },
          {
            key: 'edit',
            label: 'Edit',
            onSelect: () => {
              onCloseMenu();
              onEdit(product);
            },
          },
          {
            key: 'delete',
            label: 'Delete',
            onSelect: () => {
              onCloseMenu();
              onDelete(product);
            },
            className: 'text-red-400',
          },
        ]}
      />
    </div>

    <div className="absolute right-6 bottom-6 z-20">
      <StatusBadge 
        status={product.status || 'draft'} 
      />
    </div>

    {showImage ? (
      <img 
        src={imageValue} 
        alt={product.name} 
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
      />
    ) : (
      <div className="flex items-center justify-center h-full opacity-5">
         <span className="text-[10px] font-black uppercase tracking-[0.4em]">No Image</span>
      </div>
    )}
  </div>

  {/* BOTTOM SECTION: Minimalist Ledger */}
  <div className="px-9 py-8 flex-1 flex flex-col justify-between">
    
    {/* Identity Row: Typography-led */}
    <div className="flex justify-between items-baseline">
      <div className="flex flex-col min-w-0">
        <h3 className={`font-black text-2xl tracking-tighter leading-none mb-2 truncate ${
          theme === 'dark' ? 'text-white' : 'text-[#14034A]'
        }`}>
          {product.name}
        </h3>
        <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#8B5CF6] uppercase opacity-60">
          {product.sku || 'SKU-PENDING'}
        </p>
      </div>
      <p className="text-[22px] font-black tracking-tighter" style={{ color: '#8B5CF6' }}>
        {formattedPrice}
      </p>
    </div>

    {/* Metadata Grid: No borders, just clean alignment */}
    <div className="grid grid-cols-2 gap-8 mt-6">
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-20" style={{ color: theme === 'dark' ? '#FFF' : '#14034A' }}>Category</span>
        <span className={`text-[12px] font-bold truncate ${theme === 'dark' ? 'text-white/80' : 'text-[#14034A]/80'}`}>
          {subcategoryLabel || 'General'}
        </span>
      </div>
      
      <div className="flex flex-col gap-1 text-right">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-20" style={{ color: theme === 'dark' ? '#FFF' : '#14034A' }}>Variants</span>
        <span className="text-[12px] font-bold text-violet-400">
          {variantGroups.length > 1 ? `${colorVariantCount} Colors` : 'Standard'}
        </span>
      </div>
    </div>

    {/* Footer: Vital Status Only */}
    <div className="mt-auto pt-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`w-2 h-2 rounded-full ${
          overallStock === 0 ? 'bg-red-500 shadow-[0_0_10px_#EF4444]' : lowStock ? 'bg-amber-500 shadow-[0_0_8px_#F59E0B]' : 'bg-emerald-400'
        } ${overallStock <= 10 && 'animate-pulse'}`} />
        <span className={`text-[12px] font-black uppercase tracking-[0.15em] ${
          overallStock === 0 ? 'text-red-500' : 'opacity-40'
        }`} style={{ color: overallStock === 0 ? undefined : (theme === 'dark' ? '#FFF' : '#14034A') }}>
          {overallStock} in stock
        </span>
      </div>

      {/* Subtle indicator for dark/light contrast */}
      <div className="h-px flex-1 mx-6 bg-[#14034A]/5" />
      
      <span className="text-[10px] font-black text-[#8B5CF6] opacity-30 italic">Registry Entry</span>
    </div>
  </div>
</motion.div>
    </>
  );
}
