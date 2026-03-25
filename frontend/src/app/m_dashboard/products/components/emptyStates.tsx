'use client';

export interface EmptyStatesProps {
  /** Which empty state to render: 'no-products' (fresh start) or 'no-results' (filtered empty). */
  variant: 'no-products' | 'no-results';
  /** Color palette object from theme context, used for backgrounds and text colors. */
  colors: Record<string, any>;
  /** Whether the user has permission to add products (subdomain must be set). */
  canAddProducts: boolean;
  /** Optional blocking message displayed when products cannot be added (e.g., subdomain not set). */
  blockedAddProductMessage?: string | null;
  /** Callback fired when the Add Product button is clicked. */
  onAddProduct: () => void;
  /** Callback fired when the Clear Filters button is clicked (no-results variant only). */
  onClearFilters?: () => void;
}

/**
 * Renders contextual empty state placeholders for the products page.
 *
 * This component displays two variants:
 * 1. **no-products**: Shown when no products exist yet. Includes a CTA to add the first product.
 * 2. **no-results**: Shown when filters or search yield no matching products. Includes a button to clear filters.
 *
 * Parameters:
 * - `variant`: Which empty state to display (`no-products` or `no-results`).
 * - `colors`: Theme color palette used for text, backgrounds, and borders.
 * - `canAddProducts`: Controls button enabled state and messaging (depends on subdomain setup).
 * - `blockedAddProductMessage`: Message to display if products cannot be added (optional).
 * - `onAddProduct`: Callback when user clicks "Add Product" button.
 * - `onClearFilters`: Callback when user clicks "Clear Filters" button (only used in no-results state).
 */
export function EmptyStates({
  variant,
  colors,
  canAddProducts,
  blockedAddProductMessage,
  onAddProduct,
  onClearFilters,
}: EmptyStatesProps) {
  if (variant === 'no-products') {
    return (
      <section
        className="max-w-[1090px] mx-auto text-center py-20 rounded-2xl border"
        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
      >
        <div
          className="mx-auto w-16 h-16 rounded-2xl border flex items-center justify-center"
          style={{ borderColor: colors.border.default, backgroundColor: colors.bg.elevated }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: colors.text.muted }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M20 7.5L12 3 4 7.5M20 7.5v9L12 21m8-13.5L12 12M4 7.5v9L12 21M4 7.5L12 12"
            />
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
          onClick={onAddProduct}
          disabled={!canAddProducts}
          className={`mt-6 mx-auto px-4 py-2.5 rounded-lg text-white font-medium transition-opacity shadow-sm ${
            canAddProducts ? 'hover:opacity-90' : 'opacity-60 cursor-not-allowed'
          }`}
          style={
            canAddProducts
              ? { background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)' }
              : { background: 'linear-gradient(90deg, #c084fc 0%, #f9a8d4 100%)' }
          }
        >
          {canAddProducts ? 'Add your first product' : 'Publish website first'}
        </button>
      </section>
    );
  }

  // no-results variant
  return (
    <section
      className="max-w-[1090px] mx-auto text-center py-16 rounded-2xl border"
      style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
    >
      <div
        className="mx-auto w-14 h-14 rounded-2xl border flex items-center justify-center"
        style={{ borderColor: colors.border.default, backgroundColor: colors.bg.elevated }}
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: colors.text.muted }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M20 7.5L12 3 4 7.5M20 7.5v9L12 21m8-13.5L12 12M4 7.5v9L12 21M4 7.5L12 12"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mt-5 mb-2" style={{ color: colors.text.primary }}>
        No matching products
      </h3>
      <p style={{ color: colors.text.secondary }}>Try changing search or category filters.</p>
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-5 px-4 py-2 rounded-lg border text-sm"
        style={{ borderColor: colors.border.faint, color: colors.text.primary, backgroundColor: colors.bg.elevated }}
      >
        Clear filters
      </button>
    </section>
  );
}
