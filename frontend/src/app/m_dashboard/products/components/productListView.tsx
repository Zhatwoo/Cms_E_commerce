'use client';

import { AnimatePresence } from 'framer-motion';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { type Product, type ProductVariant } from '../../lib/productsData';
import { ProductCard } from './productContainer';
import { StatusBadge, type StatusType } from './statusBadge';

interface ColorConfig {
  [key: string]: any;
}

export interface ProductListViewProps {
  /** Array of products to display (typically paginated subset). */
  products: Product[];
  /** View mode selection: 'tile' (grid) or 'list' (table). */
  viewMode: 'tile' | 'list';
  /** Theme color palette used for styling. */
  colors: ColorConfig;
  /** Current theme ('dark' or 'light') for conditional styling. */
  theme: string;
  /** ID of the product whose action menu is currently open (if any). */
  openMenuProductId: string | null;
  /** Callback fired when user clicks to view a product (opens details modal). */
  onView: (product: Product) => void;
  /** Callback fired when user clicks the edit action for a product. */
  onEdit: (product: Product) => void;
  /** Callback fired when user clicks the delete action for a product. */
  onDelete: (product: Product) => void;
  /** Callback to toggle the action menu open/closed for a specific product ID. */
  onToggleMenu: (productId: string) => void;
  /** Callback to explicitly close any open action menu. */
  onCloseMenu: () => void;
  /** Async callback to save product data (used by edit modal). */
  onSaveProduct?: (productData: Partial<Product> & Record<string, unknown>) => Promise<boolean>;
}

function ActionTooltip({
  label,
  theme,
  children,
}: {
  label: string;
  theme: 'light' | 'dark';
  children: React.ReactNode;
}) {
  return (
    <div className="group/tooltip relative inline-flex items-center justify-center">
      {children}
      <div
        className={`pointer-events-none hidden absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] shadow-2xl group-hover/tooltip:block ${
          theme === 'dark'
            ? 'border border-white/10 bg-[#12193A] text-white'
            : 'border border-[#7c3aed]/20 bg-white text-[#14034A]'
        }`}
      >
        {label}
      </div>
    </div>
  );
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

function getVariantLabelsForList(product: Product): string[] {
  const groups = getVariantGroups(product);
  if (groups.length === 0) return ['NO VARIANT'];

  if (groups.length === 1) {
    const options = groups[0]?.options?.map((o: any) => String(o.name || '').trim()).filter(Boolean) || [];
    if (options.length <= 3) return options;
    return [...options.slice(0, 2), `+${options.length - 2}`];
  }

  const firstGroup = groups[0];
  const options = firstGroup?.options?.map((o: any) => String(o.name || '').trim()).filter(Boolean) || [];
  if (options.length === 0) return [`${groups.length} VARIANTS`];
  if (options.length <= 2) return options;
  return [...options.slice(0, 1), `+${options.length - 1}`];
}

function getVariantGroups(product: Product): ProductVariant[] {
  return Array.isArray(product.variants)
    ? product.variants.filter((variant: ProductVariant) => Array.isArray(variant.options) && variant.options.length > 0)
    : [];
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

function getLowStockThreshold(product: Product): number {
  const DEFAULT_LOW_STOCK_THRESHOLD = 5;
  const threshold = Number(product.lowStockThreshold);
  if (!Number.isFinite(threshold) || threshold < 0) return DEFAULT_LOW_STOCK_THRESHOLD;
  return threshold;
}

function isLowStock(product: Product): boolean {
  return product.stock > 0 && product.stock < getLowStockThreshold(product);
}

/**
 * A flexible product display component that renders products in two view modes.
 *
 * View Modes:
 * 1. **Tile Mode**: Grid layout (1 col mobile → 4 cols desktop) using ProductCard components.
 * 2. **List Mode**: Horizontal table with columns for Name, SKU, Variants, Price, Inventory, and Actions.
 *
 * Features:
 * - Responsive grid with gap scaling based on breakpoints.
 * - List view with horizontal scrolling on smaller screens.
 * - Click-outside handling for action menus.
 * - Color-coded stock status (red for zero, orange for low stock).
 * - Smooth animations and hover effects on rows/cards.
 * - Integrated product action menu (View, Edit, Delete).
 *
 * Parameters:
 * - `products`: Array of products to render (already filtered and paginated).
 * - `viewMode`: Display mode selection (`tile` or `list`).
 * - `colors`: Theme color palette for consistent styling.
 * - `theme`: Current theme mode used for conditional styling on list header.
 * - `openMenuProductId`: ID of the currently open action menu (null if none).
 * - `onView`: Callback when product is viewed.
 * - `onEdit`: Callback when product is edited.
 * - `onDelete`: Callback when product is deleted.
 * - `onToggleMenu`: Callback to toggle menu visibility for a product.
 * - `onCloseMenu`: Callback to close any open menu.
 */
export function ProductListView({
  products,
  viewMode,
  colors,
  theme,
  openMenuProductId,
  onView,
  onEdit,
  onDelete,
  onToggleMenu,
  onCloseMenu,
  onSaveProduct,
}: ProductListViewProps) {
  if (viewMode === 'tile') {
    return (
      <div id="products-grid" className="max-w-272.5 mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        <AnimatePresence>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              colors={colors}
              theme={theme as 'light' | 'dark'}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              menuOpen={openMenuProductId === product.id}
              onToggleMenu={() => onToggleMenu(product.id)}
              onCloseMenu={onCloseMenu}
              onSaveProduct={onSaveProduct}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-272.5 mx-auto overflow-hidden rounded-3xl border" style={{ borderColor: '#2D3A90', backgroundColor: '#141446' }}>
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.1fr 1.2fr 1.4fr 1.1fr 1.1fr 1fr 154px',
            gap: 16,
            padding: '13px 24px',
            width: '100%',
            minWidth: 860,
            background: theme === 'dark'
              ? 'linear-gradient(90deg, #1E1B4B 0%, #312E81 100%)'
              : '#803BED',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          <span>Product Name</span>
          <span>SKU</span>
          <span>Variants</span>
          <span>Price</span>
          <span>Inventory</span>
          <span className="text-center">Status</span>
          <span className="text-center">Actions</span>
        </div>

        {products.map((product, index) => {
          const firstGalleryImage = Array.isArray(product.images)
            ? product.images
              .map((img) => normalizeImageSource(img))
              .find((img) => isImageSource(img)) || ''
            : '';
          const image = normalizeImageSource(firstGalleryImage || product.image || '');
          const showThumb = isImageSource(image);
          const variantLabels = getVariantLabelsForList(product);

          return (
            <div
              key={`list-${product.id}`}
              onClick={() => onView(product)}
              style={{
                display: 'grid',
                gridTemplateColumns: '2.1fr 1.2fr 1.4fr 1.1fr 1.1fr 1fr 154px',
                gap: 16,
                padding: '14px 24px',
                alignItems: 'center',
                fontSize: 14,
                width: '100%',
                minWidth: 860,
                borderBottom: index < products.length - 1 ? '1px solid rgba(255,255,255,0.055)' : 'none',
                transition: 'background 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.018)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-14 h-14 rounded-md overflow-hidden border shrink-0"
                  style={{ borderColor: '#2D3A90', backgroundColor: '#D9D9DC' }}
                >
                  {showThumb ? (
                    <img src={image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px]" style={{ color: '#6E78A8' }}>
                      No image
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-[15px] leading-tight truncate">{product.name}</p>
                </div>
              </div>

              <div className="text-sm text-white truncate">{product.sku || '-'}</div>

              <div className="flex flex-wrap gap-1">
                {variantLabels.map((label, idx) => (
                  <span
                    key={`${product.id}-list-variant-${idx}`}
                    className="px-1.5 py-0.5 text-[10px] border text-white rounded-sm"
                    style={{ borderColor: '#6C72B2', backgroundColor: 'transparent' }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="text-sm font-medium" style={{ color: '#A78BFA' }}>
                {formatProductPrice(product)}
              </div>

              <div className={`text-sm font-semibold ${Number(product.stock) === 0 ? 'text-red-400' : isLowStock(product) ? 'text-orange-300' : 'text-white'}`}>
                {Number(product.stock ?? 0)}
              </div>

              <div className="flex items-center justify-center">
                <StatusBadge status={String(product.status || 'draft').toLowerCase() as StatusType} />
              </div>

              <div className="flex items-center justify-center gap-2" onClick={(event) => event.stopPropagation()}>
                <ActionTooltip label="View product" theme={theme as 'light' | 'dark'}>
                  <button
                    type="button"
                    onClick={() => onView(product)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                    style={{
                      background: theme === 'dark' ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)',
                      borderColor: theme === 'dark' ? 'rgba(34,197,94,0.24)' : 'rgba(34,197,94,0.18)',
                      color: '#22c55e',
                    }}
                    aria-label="View product"
                  >
                    <Eye size={13} />
                  </button>
                </ActionTooltip>

                <ActionTooltip label="Edit product" theme={theme as 'light' | 'dark'}>
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                    style={{
                      background: theme === 'dark' ? 'rgba(124,58,237,0.16)' : 'rgba(124,58,237,0.08)',
                      borderColor: theme === 'dark' ? 'rgba(124,58,237,0.28)' : 'rgba(124,58,237,0.18)',
                      color: theme === 'dark' ? '#c4b5fd' : '#7c3aed',
                    }}
                    aria-label="Edit product"
                  >
                    <Pencil size={13} />
                  </button>
                </ActionTooltip>

                <ActionTooltip label="Delete product" theme={theme as 'light' | 'dark'}>
                  <button
                    type="button"
                    onClick={() => {
                      void onDelete(product);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                    style={{
                      background: theme === 'dark' ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)',
                      borderColor: theme === 'dark' ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.18)',
                      color: '#f87171',
                    }}
                    aria-label="Delete product"
                  >
                    <Trash2 size={13} />
                  </button>
                </ActionTooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
