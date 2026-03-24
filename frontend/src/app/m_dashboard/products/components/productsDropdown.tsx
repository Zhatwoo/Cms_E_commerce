'use client';
import React, { useRef } from 'react';

/**
 * A category/subcategory filter dropdown menu for products.
 *
 * Features:
 * - Displays current selection in the button label (with product count).
 * - Dropdown menu with checkmarks indicating the selected option.
 * - Closes when clicking an option or using the toggle callback.
 * - Supports multiple filter categories with counts.
 *
 * Parameters:
 * - `selectedCategory`: The current filter value (e.g., 'all' or 'subcategory:Electronics').
 * - `onCategoryChange`: Callback when a new category is selected.
 * - `filterOptions`: Array of available filter options with labels and product counts.
 * - `showMenu`: Boolean controlling dropdown visibility.
 * - `onMenuToggle`: Callback to open/close the dropdown menu.
 */
export function ProductsDropdown({
  selectedCategory,
  onCategoryChange,
  filterOptions,
  showMenu,
  onMenuToggle,
}: {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  filterOptions: Array<{ value: string; label: string }>;
  showMenu: boolean;
  onMenuToggle: (show: boolean) => void;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selectedCategoryLabel = filterOptions.find((option) => option.value === selectedCategory)?.label ?? 'All';

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => onMenuToggle(!showMenu)}
        className="h-[46px] px-4 rounded-xl border text-[13px] font-semibold min-w-[156px] pr-9 text-left relative"
        style={{ backgroundColor: '#141446', borderColor: '#2D3A90', color: '#ddd1ff' }}
        title="Filter by subcategory"
      >
        <span className="truncate block">{selectedCategoryLabel}</span>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: '#b6abd6' }}>▼</span>
      </button>
      {showMenu && (
        <div
          className="absolute left-0 top-full mt-2 w-56 rounded-xl border p-2 z-30"
          style={{ backgroundColor: '#141446', borderColor: '#2D3A90' }}
        >
          {filterOptions.map((option) => {
            const checked = selectedCategory === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onCategoryChange(option.value);
                  onMenuToggle(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/5"
                style={{ color: '#D2D6F7' }}
              >
                <span>{option.label}</span>
                <span>{checked ? '✓' : ''}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
