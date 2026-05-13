'use client';

import React from 'react';

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
