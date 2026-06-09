'use client';

/**
 * ============================================================================
 * Pagination Component
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains a reusable pagination navigation component used for
 * navigating through paginated data such as:
 *
 * - Tables
 * - Product lists
 * - Orders
 * - Search results
 * - Dashboard records
 * - Inventory items
 *
 * The component provides:
 * - Previous/Next navigation
 * - Dynamic page number rendering
 * - Ellipsis support for large page sets
 * - Theme-aware styling
 * - Responsive pagination sizing
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Displays pagination controls
 * - Highlights the currently active page
 * - Allows navigation between pages
 * - Handles previous and next page actions
 * - Supports compact responsive layouts
 * - Displays ellipsis (...) for skipped page ranges
 *
 * ----------------------------------------------------------------------------
 * Props / Parameters:
 * ----------------------------------------------------------------------------
 *
 * theme: 'light' | 'dark'
 * ----------------------------------------------------------------------------
 * Determines visual theme styling.
 *
 * Available values:
 * - 'light'
 * - 'dark'
 *
 * ----------------------------------------------------------------------------
 * colors
 * ----------------------------------------------------------------------------
 * Theme color configuration object.
 *
 * Structure:
 *
 * {
 *   border: {
 *     faint: string;
 *   };
 *   text: {
 *     secondary: string;
 *     muted: string;
 *     primary: string;
 *   };
 * }
 *
 * ----------------------------------------------------------------------------
 * paginationItems: Array<number | string>
 * ----------------------------------------------------------------------------
 * Array of page items to render.
 *
 * Can contain:
 * - Page numbers
 * - 'ellipsis'
 *
 * Example:
 * [1, 2, 3, 'ellipsis', 10]
 *
 * ----------------------------------------------------------------------------
 * currentPage: number
 * ----------------------------------------------------------------------------
 * Currently active page number.
 *
 * ----------------------------------------------------------------------------
 * totalPages: number
 * ----------------------------------------------------------------------------
 * Total number of pages available.
 *
 * NOTE:
 * - Currently not directly rendered
 * - Useful for external pagination logic
 *
 * ----------------------------------------------------------------------------
 * onPageChange: (page: number) => void
 * ----------------------------------------------------------------------------
 * Triggered when a page number is clicked.
 *
 * ----------------------------------------------------------------------------
 * onPrevPage: () => void
 * ----------------------------------------------------------------------------
 * Triggered when Previous button is clicked.
 *
 * ----------------------------------------------------------------------------
 * onNextPage: () => void
 * ----------------------------------------------------------------------------
 * Triggered when Next button is clicked.
 *
 *
 * ----------------------------------------------------------------------------
 * How to Use:
 * ----------------------------------------------------------------------------
 *
 * Basic Example:
 *
 * <Pagination
 *   theme="dark"
 *   colors={{
 *     border: {
 *       faint: 'rgba(255,255,255,0.1)',
 *     },
 *     text: {
 *       secondary: '#A1A1AA',
 *       muted: '#71717A',
 *       primary: '#FFFFFF',
 *     },
 *   }}
 *   paginationItems={[1, 2, 3, 'ellipsis', 10]}
 *   currentPage={2}
 *   totalPages={10}
 *   onPageChange={(page) => setCurrentPage(page)}
 *   onPrevPage={handlePrevPage}
 *   onNextPage={handleNextPage}
 * />
 *
 * ----------------------------------------------------------------------------
 * Example Pagination Logic:
 * ----------------------------------------------------------------------------
 *
 * const handlePrevPage = () => {
 *   if (currentPage > 1) {
 *     setCurrentPage(currentPage - 1);
 *   }
 * };
 *
 * const handleNextPage = () => {
 *   if (currentPage < totalPages) {
 *     setCurrentPage(currentPage + 1);
 *   }
 * };
 *
 * ============================================================================
 */

type PaginationProps = {
  theme: 'light' | 'dark';
  colors: {
    border: { faint: string };
    text: { secondary: string; muted: string; primary: string };
  };
  paginationItems: Array<number | string>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function Pagination({
  theme,
  colors,
  paginationItems,
  currentPage,
  totalPages,
  onPageChange,
  onPrevPage,
  onNextPage,
}: PaginationProps) {
  return (
    <div className="justify-self-center flex items-center gap-1 sm:gap-2 text-xs" style={{ color: colors.text.secondary }}>
      <button
        type="button"
        onClick={onPrevPage}
        className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full border text-[12px] flex items-center justify-center ${theme === 'dark' ? '' : 'admin-dashboard-panel-soft border-0'}`}
        style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'transparent' : undefined }}
        aria-label="Previous page"
      >
        ‹
      </button>
      {paginationItems.map((item, idx) => {
        if (item === 'ellipsis') {
          return (
            <span key={`ellipsis-${idx}`} className="px-0.5 text-[10px] sm:text-[11px]" style={{ color: colors.text.muted }}>
              ...
            </span>
          );
        }

        const val = item as number;
        const active = currentPage === val;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onPageChange(val)}
            className="h-6 min-w-6 sm:h-7 sm:min-w-7 px-1 max-[390px]:px-0.5 sm:px-2 rounded-full text-[10px] sm:text-[11px]"
            style={{ backgroundColor: active ? `${colors.text.muted}55` : 'transparent', color: active ? colors.text.primary : colors.text.secondary }}
          >
            {val}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onNextPage}
        className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full border text-[12px] flex items-center justify-center ${theme === 'dark' ? '' : 'admin-dashboard-panel-soft border-0'}`}
        style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'transparent' : undefined }}
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  );
}
