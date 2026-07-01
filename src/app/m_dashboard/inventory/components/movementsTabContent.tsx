'use client';

/**
 * ============================================================================
 * Inventory Movements Tab Component
 * ============================================================================
 *
 * Purpose of this File:
 * This component displays inventory movement history showing stock IN/OUT
 * transactions with deletion functionality.
 *
 * The component provides:
 * - Inventory movement list (IN/OUT transactions)
 * - Color-coded movement types
 * - Delete movement functionality
 * - Empty state display
 * - Theme-aware styling
 * - Movement type icons and labels
 * - Timestamp display
 * - Reference information
 *
 * What this Component Does:
 * - Displays inventory movements in list format
 * - Shows movement type (IN/OUT) with colors
 * - Displays quantity and reference
 * - Allows deleting movements
 * - Shows loading state during deletion
 * - Displays empty state when no movements
 * - Formats timestamps
 * - Adapts styling based on theme
 *
 * Props / Parameters:
 *
 * movements: InventoryMovement[]
 * - Array of inventory movements to display
 *
 * loading: boolean
 * - Loading state for initial data fetch
 *
 * theme: string
 * - Current theme mode
 *
 * deletingMovementId?: string | null
 * - ID of movement being deleted
 *
 * onDeleteMovement?: (movement: InventoryMovement) => void
 * - Callback for delete action
 *
 * ============================================================================
 */

import React from 'react';
import { Clock3, Trash2 } from 'lucide-react';
import { type InventoryMovement } from '@/lib/api';
import { EmptyState } from '../../components/ui/emptyState';

type MovementsTabContentProps = {
  theme: string;
  loading: boolean;
  error: string | null;
  movements: InventoryMovement[];
  deletingMovementId?: string | null;
  onDeleteMovement?: (movement: InventoryMovement) => void;
  onViewAll?: () => void;
};

const TYPE_COLORS: Record<string, { label: string; bg: string; border: string; text: string }> = {
  IN: {
    label: 'IN',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.28)',
    text: '#22c55e',
  },
  OUT: {
    label: 'OUT',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.28)',
    text: '#ef4444',
  },
  ADJUST: {
    label: 'ADJ',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.28)',
    text: '#f59e0b',
  },
  RESERVE: {
    label: 'RES',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.28)',
    text: '#3b82f6',
  },
  RELEASE: {
    label: 'REL',
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.28)',
    text: '#8b5cf6',
  },
};

function formatDate(dateLike?: string): string {
  if (!dateLike) return '-';
  const parsed = new Date(dateLike);
  if (Number.isNaN(parsed.getTime())) return '-';

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function MovementTypeBadge({ type }: { type?: string }) {
  const normalized = String(type || '').toUpperCase();
  const palette = TYPE_COLORS[normalized] ?? {
    label: normalized || 'LOG',
    bg: 'rgba(148,163,184,0.14)',
    border: 'rgba(148,163,184,0.3)',
    text: '#94a3b8',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 44,
        height: 24,
        padding: '0 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.08em',
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.text,
      }}
    >
      {palette.label}
    </span>
  );
}

export function MovementsTabContent({
  theme,
  loading,
  error,
  movements,
  deletingMovementId,
  onDeleteMovement,
  onViewAll,
}: MovementsTabContentProps) {
  const isDark = theme === 'dark';
  const shellBg = isDark ? '#141446' : '#FFFFFF';
  const shellBorder = isDark ? '#2D3A90' : 'rgba(20, 3, 74, 0.08)';
  const headerBg = isDark
    ? 'linear-gradient(90deg, #1E1B4B 0%, #312E81 100%)'
    : '#803BED';
  const rowBorder = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(20, 3, 74, 0.08)';
  const rowHover = isDark ? 'rgba(255,255,255,0.018)' : 'rgba(124,58,237,0.03)';
  const primaryText = isDark ? '#ffffff' : '#14034A';
  const mutedText = isDark ? 'rgba(219,212,255,0.7)' : 'rgba(20, 3, 74, 0.58)';

  if (loading) {
    return (
      <div
        style={{
          borderRadius: 24,
          border: `1px solid ${shellBorder}`,
          background: shellBg,
          minHeight: 220,
          display: 'grid',
          placeItems: 'center',
          color: mutedText,
          fontSize: 14,
        }}
      >
        Loading movement logs...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          borderRadius: 24,
          border: `1px solid ${shellBorder}`,
          background: shellBg,
          minHeight: 220,
          display: 'grid',
          placeItems: 'center',
          color: '#ef4444',
          fontSize: 14,
          textAlign: 'center',
          padding: '16px',
        }}
      >
        {error}
      </div>
    );
  }

  if (!movements.length) {
    return (
      <div style={{ borderRadius: 24, border: `1px solid ${shellBorder}`, background: shellBg }}>
        <EmptyState
          className="py-10"
          title="No movement history yet"
          description="Stock changes will appear here once items are adjusted, reserved, released, or sold."
          tone={isDark ? 'dark' : 'light'}
          size="compact"
        />
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 24,
        border: `1px solid ${shellBorder}`,
        background: shellBg,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr 0.7fr 1fr 1.4fr 0.45fr',
          gap: 12,
          padding: '12px 18px',
          background: headerBg,
          color: '#FFFFFF',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        <span>Product</span>
        <span>SKU</span>
        <span>Type</span>
        <span>Qty</span>
        <span>Date</span>
        <span />
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {movements.map((movement, index) => {
          const movementId = String(movement.id || `row-${index}`);
          const quantity = Number(movement.quantity || 0);
          return (
            <div
              key={movementId}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr 0.7fr 1fr 1.4fr 0.45fr',
                gap: 12,
                padding: '12px 18px',
                alignItems: 'center',
                fontSize: 13,
                borderBottom: `1px solid ${rowBorder}`,
                color: primaryText,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = rowHover;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ fontWeight: 600 }}>{movement.productName || 'Unknown product'}</span>
              <span style={{ color: mutedText }}>{movement.productSku || '-'}</span>
              <MovementTypeBadge type={movement.type} />
              <span style={{ color: mutedText, fontWeight: 600 }}>{quantity > 0 ? `+${quantity}` : quantity}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: mutedText }}>
                <Clock3 size={14} />
                {formatDate(movement.createdAt)}
              </span>
              {onDeleteMovement ? (
                <button
                  type="button"
                  onClick={() => onDeleteMovement(movement)}
                  disabled={deletingMovementId === movementId}
                  title="Delete movement"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: isDark ? '#fca5a5' : '#dc2626',
                    cursor: deletingMovementId === movementId ? 'not-allowed' : 'pointer',
                    opacity: deletingMovementId === movementId ? 0.45 : 0.9,
                    padding: 4,
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              ) : (
                <span />
              )}
            </div>
          );
        })}
      </div>

      {onViewAll ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: `1px solid ${rowBorder}`,
            padding: 12,
          }}
        >
          <button
            type="button"
            onClick={onViewAll}
            style={{
              border: 'none',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.08)',
              color: isDark ? '#EDEBFF' : '#6d28d9',
              borderRadius: 999,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            View all movements
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default MovementsTabContent;
