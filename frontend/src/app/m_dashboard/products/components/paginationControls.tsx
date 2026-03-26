'use client';
import { useTheme } from '../../components/context/theme-context';

export interface PaginationControlsProps {
  /** The currently active page number (1-indexed). */
  currentPage: number;
  /** Total number of pages available. */
  totalPages: number;
  /** Callback fired when user navigates to a different page. */
  onPageChange: (page: number) => void;
}

/**
 * A reusable pagination controls component with numbered page buttons and navigation arrows.
 *
 * Features:
 * - Previous/Next arrow buttons with disable states at boundaries.
 * - Up to 5 visible page buttons with ellipsis (...) for large page counts.
 * - Jump-to-last-page button when total pages exceed 5.
 * - Styled for both light and dark theme with hover and active states.
 *
 * Parameters:
 * - `currentPage`: The page currently being viewed (1-indexed).
 * - `totalPages`: Total number of pages the paginated list contains.
 * - `onPageChange`: Callback invoked whenever user clicks a page button or navigation arrow.
 */
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const { colors, theme } = useTheme();

  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: colors.text.secondary }}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full border text-[12px] flex items-center justify-center disabled:opacity-60 ${theme === 'dark' ? '' : 'admin-dashboard-panel-soft border-0'}`}
        style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'transparent' : undefined }}
        aria-label="Previous page"
      >
        ‹
      </button>
      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
        const page = i + 1;
        const active = page === currentPage;
        return (
          <button
            key={`page-dot-${page}`}
            type="button"
            onClick={() => onPageChange(page)}
            className="h-6 min-w-6 sm:h-7 sm:min-w-7 px-1 sm:px-2 rounded-full text-[10px] sm:text-[11px]"
            style={{
              backgroundColor: active ? `${colors.text.muted}55` : 'transparent',
              color: active ? colors.text.primary : colors.text.secondary,
            }}
          >
            {page}
          </button>
        );
      })}
      {totalPages > 5 && <span className="px-0.5 text-[10px] sm:text-[11px]" style={{ color: colors.text.muted }}>...</span>}
      {totalPages > 5 && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          className="h-6 min-w-6 sm:h-7 sm:min-w-7 px-1 sm:px-2 rounded-full text-[10px] sm:text-[11px]"
          style={{
            backgroundColor: currentPage === totalPages ? `${colors.text.muted}55` : 'transparent',
            color: currentPage === totalPages ? colors.text.primary : colors.text.secondary,
          }}
        >
          {totalPages}
        </button>
      )}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full border text-[12px] flex items-center justify-center disabled:opacity-60 ${theme === 'dark' ? '' : 'admin-dashboard-panel-soft border-0'}`}
        style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'transparent' : undefined }}
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  );
}
