'use client';

export type StatusType = 'active' | 'inactive' | 'draft';

/**
 * Retrieves the styling object for a status badge based on product status.
 *
 * Returns a style object with text color, background color, and border color
 * that visually represents the product status:
 * - Active: Green tint
 * - Inactive: Red tint
 * - Draft: Purple tint
 *
 * Parameters:
 * - `status`: The product status ('active', 'inactive', or 'draft').
 */
export function getStatusStyle(status: StatusType) {
  const normalizedStatus = String(status || '').toLowerCase();
  return normalizedStatus === 'inactive'
    ? { color: '#fca5a5', backgroundColor: 'rgba(153,27,27,0.72)', borderColor: 'rgba(248,113,113,0.75)' }
    : normalizedStatus === 'active'
      ? { color: '#86efac', backgroundColor: 'rgba(20,83,45,0.72)', borderColor: 'rgba(74,222,128,0.75)' }
      : { color: '#c4b5fd', backgroundColor: 'rgba(76,29,149,0.62)', borderColor: 'rgba(167,139,250,0.7)' };
}

/**
 * Retrieves the human-readable label for a product status.
 *
 * Parameters:
 * - `status`: The product status ('active', 'inactive', or 'draft').
 *
 * Returns: Capitalized status label string ('Active', 'Inactive', or 'Draft').
 */
export function getStatusLabel(status: StatusType): string {
  const normalizedStatus = String(status || '').toLowerCase();
  return normalizedStatus === 'inactive' ? 'Inactive' : normalizedStatus === 'active' ? 'Active' : 'Draft';
}

/**
 * A small, color-coded badge that displays a product's status.
 *
 * Features:
 * - Status-specific background, text, and border colors.
 * - Rounded pill shape with uppercase label.
 * - Compact design for use in product cards and list rows.
 * - Lightweight and reusable across multiple product displays.
 *
 * Parameters:
 * - `status`: The product status ('active', 'inactive', or 'draft') determines styling and label.
 */
export function StatusBadge({ status }: { status: StatusType }) {
  const style = getStatusStyle(status);
  const label = getStatusLabel(status);

  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={style}
    >
      {label}
    </span>
  );
}
