'use client';

import { AnimatePresence } from 'framer-motion';
import { type Product, type ProductVariant } from '../../lib/productsData';
import { ProductCard } from './productContainer';

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
}: ProductListViewProps) {
  if (viewMode === 'tile') {
    return (
      <div id="products-grid" className="max-w-[1360px] mx-auto grid justify-center gap-3 md:gap-4 lg:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              colors={colors}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              menuOpen={openMenuProductId === product.id}
              onToggleMenu={() => onToggleMenu(product.id)}
              onCloseMenu={onCloseMenu}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-[1090px] mx-auto overflow-hidden rounded-3xl border" style={{ borderColor: '#2D3A90', backgroundColor: '#141446' }}>
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.1fr 1.2fr 1.4fr 1.1fr 1.1fr 56px',
            gap: 16,
            padding: '13px 24px',
            minWidth: 860,
            borderRadius: '24px 24px 0 0',
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
          <span />
        </div>

        {products.map((product, index) => {
          const image = String(product.image || '').trim();
          const showThumb = isImageSource(image);
          const variantLabels = getVariantLabelsForList(product);

          return (
            <div
              key={`list-${product.id}`}
              onClick={() => onView(product)}
              style={{
                display: 'grid',
                gridTemplateColumns: '2.1fr 1.2fr 1.4fr 1.1fr 1.1fr 56px',
                gap: 16,
                padding: '14px 24px',
                alignItems: 'center',
                fontSize: 14,
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
                  className="w-14 h-14 rounded-md overflow-hidden border flex-shrink-0"
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

              <div data-product-menu-root="true" className="flex justify-center relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleMenu(product.id);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-transform hover:scale-[1.04]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.96)', borderColor: 'rgba(174,160,255,0.95)', color: '#3B1E8C' }}
                  title="Product actions"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="6" cy="12" r="2.2" />
                    <circle cx="12" cy="12" r="2.2" />
                    <circle cx="18" cy="12" r="2.2" />
                  </svg>
                </button>
                {openMenuProductId === product.id && (
                  <div
                    className="absolute right-2 top-12 z-40 w-28 rounded-lg border border-[#2D3A90] bg-[#12145A] py-1 shadow-xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onView(product);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-[11px] text-white hover:bg-white/5"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onEdit(product);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-[11px] text-white hover:bg-white/5"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        void onDelete(product);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-[11px] text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
