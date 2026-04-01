'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { type Product, type ProductVariant } from '@/app/m_dashboard/lib/productsData';
import { StatusBadge } from './statusBadge';
import ProductEditModal from './productEditModal';

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
    const image = String(selectedOption?.image || '').trim();
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
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onSaveProduct?: (productData: Partial<Product> & Record<string, unknown>) => Promise<boolean>;
}) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => getInitialVariantSelection(product));
  const [showEditModal, setShowEditModal] = useState(false);
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      onClick={() => onView(product)}
      className="group border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex w-full max-w-[324px] h-[365px] mx-auto flex-col cursor-pointer"
      style={{
        backgroundColor: '#141446',
        borderColor: '#2D3A90',
        borderRadius: '20px',
      }}
    >
      <div className="relative w-full h-44 md:h-48 overflow-hidden flex items-center justify-center border-b" style={{ borderColor: '#2D3A90', backgroundColor: '#1A1F66' }}>
        <span className="absolute left-2.5 top-2.5 z-10">
          <StatusBadge status={product.status} />
        </span>
        <button
          data-product-menu-root="true"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleMenu();
          }}
          className="absolute right-2.5 top-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-transform hover:scale-[1.04]"
          style={{ backgroundColor: 'rgba(255,255,255,0.96)', borderColor: 'rgba(174,160,255,0.95)', color: '#3B1E8C' }}
          title="Product actions"
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="6" cy="12" r="2.2" />
            <circle cx="12" cy="12" r="2.2" />
            <circle cx="18" cy="12" r="2.2" />
          </svg>
        </button>
        {menuOpen && (
          <div
            data-product-menu-root="true"
            className="absolute right-2.5 top-10 z-30 w-28 rounded-lg border border-[#2D3A90] bg-[#12145A] py-1 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={() => { onCloseMenu(); onView(product); }} className="w-full px-2.5 py-1.5 text-left text-[11px] text-white hover:bg-white/5">View</button>
            <button type="button" onClick={() => { onCloseMenu(); setShowEditModal(true); }} className="w-full px-2.5 py-1.5 text-left text-[11px] text-white hover:bg-white/5">Edit</button>
            <button type="button" onClick={() => { onCloseMenu(); onDelete(product); }} className="w-full px-2.5 py-1.5 text-left text-[11px] text-red-300 hover:bg-red-500/10">Delete</button>
          </div>
        )}
        {showImage ? (
          <img
            src={imageValue}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
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

      <div className="p-3.5 md:p-4 flex-1 flex flex-col" style={{ backgroundColor: '#141446' }}>
        <h3 className="font-semibold text-[18px] leading-tight line-clamp-2" style={{ color: '#F2ECFF' }}>
          {product.name}
        </h3>
        <div className="mt-auto">
          {subcategoryLabel && (
            <p className="mt-1 text-[10px] uppercase tracking-[0.08em]" style={{ color: '#8A8FC4' }}>
              {subcategoryLabel}
            </p>
          )}
          <p className={`${subcategoryLabel ? 'mt-0.5' : 'mt-1'} text-xs`} style={{ color: '#A78BFA' }}>
            {product.sku || '-'}
          </p>

          {variantGroups.length > 1 && hasColorVariant && (
            <p className="mt-2 text-[11px] mb-2.5" style={{ color: '#D2D6F7' }}>
              Color Variants: {colorVariantCount}
            </p>
          )}

          {isSingleVariantGroup && singleVariantOptions.length > 0 && (
            <div className="mt-2.5 mb-3 flex flex-wrap gap-1">
              {visibleVariantOptions.map((option: any) => (
                <span
                  key={`${product.id}-${singleVariantId}-${option.id}`}
                  className="px-1.5 py-0.5 text-[9px] border text-white rounded-sm"
                  style={{ borderColor: '#6C72B2', backgroundColor: 'transparent' }}
                >
                  {option.name}
                </span>
              ))}
              {hiddenVariantCount > 0 && (
                <span
                  className="px-1.5 py-0.5 text-[9px] border text-white rounded-sm"
                  style={{ borderColor: '#6C72B2', backgroundColor: 'transparent' }}
                >
                  +{hiddenVariantCount}
                </span>
              )}
            </div>
          )}

          {variantGroups.length === 0 && (
            <div className="mt-2.5 mb-3 flex flex-wrap gap-1">
              <span
                className="px-1.5 py-0.5 text-[9px] border text-white rounded-sm"
                style={{ borderColor: '#6C72B2', backgroundColor: 'transparent' }}
              >
                NO VARIANT
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 flex items-end justify-between border-t" style={{ borderColor: '#2D3A90' }}>
          <div className="flex flex-col">
            {formattedOriginalPrice && (
              <p className="text-[11px] leading-none line-through" style={{ color: '#8f94b8' }}>
                {formattedOriginalPrice}
              </p>
            )}
            <p className="text-[15px] font-medium leading-none mt-1" style={{ color: '#A78BFA' }}>{formattedPrice}</p>
          </div>
          <p className={`text-[15px] font-semibold ${overallStock === 0 ? 'text-red-400' : lowStock ? 'text-orange-300' : 'text-white'}`}>
            Stock: {overallStock}
          </p>
        </div>
      </div>
    </motion.div>

    <ProductEditModal
      isOpen={showEditModal}
      onClose={() => setShowEditModal(false)}
      onSave={async (productData) => {
        if (onSaveProduct) {
          const success = await onSaveProduct(productData);
          if (success) {
            setShowEditModal(false);
          }
          return success;
        }
        return false;
      }}
      editingProduct={product}
    />
    </>
  );
}
