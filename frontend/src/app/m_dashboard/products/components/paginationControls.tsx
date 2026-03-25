'use client';

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
 * - Styled for dark theme with hover and active states.
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
  return (
    <div className="mt-4 flex items-center justify-center gap-2" style={{ color: '#D2D6F7' }}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="h-8 w-8 rounded-full text-sm disabled:opacity-40"
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
            className={`h-8 w-8 rounded-full text-sm ${
              active ? 'bg-white/20 text-white' : 'bg-[#1A2165] text-[#BBC1E9]'
            }`}
          >
            {page}
          </button>
        );
      })}
      {totalPages > 5 && <span className="px-1">...</span>}
      {totalPages > 5 && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          className={`h-8 w-8 rounded-full text-sm ${
            currentPage === totalPages
              ? 'bg-white/20 text-white'
              : 'bg-[#1A2165] text-[#BBC1E9]'
          }`}
        >
          {totalPages}
        </button>
      )}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="h-8 w-8 rounded-full text-sm disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
}
