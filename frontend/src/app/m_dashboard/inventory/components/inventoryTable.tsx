'use client';
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { type ApiProduct } from '@/lib/api';

interface InventoryRow extends ApiProduct {
  _baseProductId: string;
  _variantKey?: string;
  _variantLabel?: string;
}

interface InventoryTableProps {
  theme: string;
  loading: boolean;
  error: string | null;
  filteredItems: InventoryRow[];
  editingStockId: string | null;
  editingStockValue: string;
  savingStockId: string | null;
  openStatusMenuRowId: string | null;
  updatingProductStatusId: string | null;
  T: Record<string, any>;
  onStartInlineStockEdit: (product: InventoryRow, currentStock: number) => void;
  onEditingStockChange: (value: string) => void;
  onSaveInlineEdit: (product: InventoryRow) => void;
  onCancelInlineEdit: () => void;
  onStatusMenuToggle: (rowId: string | null) => void;
  onUpdateProductStatus: (product: InventoryRow, status: 'active' | 'inactive') => void;
  getStockNumbers: (p: InventoryRow) => { onHand: number; reserved: number; available: number; lowThreshold: number };
  StatusPill: React.ComponentType<{ stock: number; lowThreshold: number }>;
}

// Skeleton row for loading state
export const SkeletonRow = ({ idx, T }: { idx: number; T: Record<string, any> }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1.2fr',
      gap: 16,
      padding: '16px 24px',
      minWidth: 760,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      alignItems: 'center',
    }}
  >
    {[110, 55, 35, 35, 72, 72].map((w, j) => (
      <motion.div
        key={j}
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.1 + j * 0.05 }}
        style={{ height: 11, width: w, background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}
      />
    ))}
  </div>
);

export function InventoryTable({
  theme,
  loading,
  error,
  filteredItems,
  editingStockId,
  editingStockValue,
  savingStockId,
  openStatusMenuRowId,
  updatingProductStatusId,
  T,
  onStartInlineStockEdit,
  onEditingStockChange,
  onSaveInlineEdit,
  onCancelInlineEdit,
  onStatusMenuToggle,
  onUpdateProductStatus,
  getStockNumbers,
  StatusPill,
}: InventoryTableProps) {
  const INVENTORY_VISIBLE_ROWS = 7;
  const INVENTORY_ROW_HEIGHT_PX = 72;

  return (
    <div style={{ overflow: 'hidden', marginBottom: 18, borderRadius: 24, background: theme === 'dark' ? T.card : undefined, border: theme === 'dark' ? `1px solid ${T.cardBorder}` : undefined }}>
      <div style={{ overflowX: 'auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1.2fr',
            gap: 16,
            padding: '20px 24px',
            minWidth: 760,
            background: theme === 'dark' ? 'linear-gradient(90deg, #1E1B4B 0%, #312E81 100%)' : '#803BED',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.15)',
            borderRadius: '24px 24px 0 0',
          }}
        >
          <span>Product</span>
          <span>SKU</span>
          <span>Stock</span>
          <span>Pre Orders</span>
          <span>Stock Status</span>
          <span>Product Status</span>
        </div>

        {/* Rows */}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} idx={i} T={T} />)
        ) : error ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: T.red, fontSize: 14 }}>{error}</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Package size={40} color={T.textMuted} style={{ margin: '0 auto 16px', display: 'block' }} />
            <p style={{ color: T.text, fontWeight: 600, marginBottom: 6 }}>No inventory items yet</p>
            <p style={{ color: T.textMuted, fontSize: 13 }}>Add your first product or import a CSV to start tracking stock.</p>
          </div>
        ) : (
          <div
            style={{
              maxHeight: INVENTORY_ROW_HEIGHT_PX * INVENTORY_VISIBLE_ROWS,
              overflowY: 'auto',
            }}
          >
            {filteredItems.map((rawProduct, i) => {
              const product = rawProduct as InventoryRow;
              const { onHand, reserved, lowThreshold } = getStockNumbers(product);
              const productKey =
                String(product.id || '').trim() ||
                `${String(product._baseProductId || 'product').trim()}-${String(product._variantKey || 'base').trim()}-${i}`;
              return (
                <div
                  key={productKey}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1.2fr',
                    gap: 16,
                    padding: '15px 24px',
                    alignItems: 'center',
                    fontSize: 14,
                    minWidth: 760,
                    borderBottom: i < filteredItems.length - 1 ? `1px solid ${T.cardBorder}` : 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    margin: '0 4px',
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLDivElement;
                    target.style.backgroundColor = theme === 'dark' ? 'rgba(139, 92, 246, 0.08)' : '#FFFFFF';
                    target.style.boxShadow = theme === 'dark' ? 'none' : '0 6px 16px rgba(124, 58, 237, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLDivElement;
                    target.style.backgroundColor = 'transparent';
                    target.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ color: T.text, fontWeight: 500, display: 'flex', flexDirection: 'column' }}>
                    {product.name || 'Untitled Product'}
                    {product._variantLabel && (
                      <span style={{ color: T.textMuted, fontSize: 12, fontWeight: 400, marginTop: 2 }}>{product._variantLabel}</span>
                    )}
                  </span>
                  <span style={{ color: T.textMuted }}>{product.sku || '-'}</span>
                  <div
                    onDoubleClick={() => onStartInlineStockEdit(product, onHand)}
                    title="Double-click stock to edit, press Enter to save"
                    style={{
                      minWidth: 72,
                      minHeight: 34,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      border: `1px solid ${editingStockId === product.id ? '#5f6bc7' : T.cardBorder}`,
                      borderRadius: 8,
                      background: editingStockId === product.id ? 'rgba(95,107,199,0.14)' : 'rgba(255,255,255,0.03)',
                      cursor: editingStockId === product.id ? 'text' : 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                      padding: '0 10px',
                    }}
                    onMouseEnter={(e) => {
                      if (editingStockId === product.id) return;
                      const target = e.currentTarget as HTMLDivElement;
                      target.style.borderColor = '#5f6bc7';
                      target.style.background = 'rgba(95,107,199,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      if (editingStockId === product.id) return;
                      const target = e.currentTarget as HTMLDivElement;
                      target.style.borderColor = T.cardBorder;
                      target.style.background = 'rgba(255,255,255,0.03)';
                    }}
                  >
                    {editingStockId === product.id ? (
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        placeholder="0"
                        title="Edit stock quantity"
                        value={editingStockValue}
                        onWheel={(e) => {
                          e.preventDefault();
                          (e.currentTarget as HTMLInputElement).blur();
                        }}
                        onChange={(e) => onEditingStockChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            onSaveInlineEdit(product);
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            onCancelInlineEdit();
                          }
                        }}
                        onBlur={() => {
                          onSaveInlineEdit(product);
                        }}
                        disabled={savingStockId === product.id}
                        style={{
                          width: 68,
                          background: 'transparent',
                          border: 'none',
                          borderRadius: 8,
                          color: T.text,
                          padding: 0,
                          fontSize: 13,
                          outline: 'none',
                          textAlign: 'left',
                        }}
                      />
                    ) : (
                      <span style={{ color: T.text }}>{onHand}</span>
                    )}
                  </div>
                  <span style={{ color: T.textMuted }}>{reserved}</span>
                  <div style={{ justifySelf: 'start' }}>
                    <StatusPill stock={onHand} lowThreshold={lowThreshold} />
                  </div>
                  <div style={{ justifySelf: 'start' }}>
                    {(() => {
                      const productStatus = String(product.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';
                      const isActive = productStatus === 'active';
                      const baseProductId = product._baseProductId || product.id;
                      const rowStatusMenuId = product.id;
                      const isStatusMenuOpen = openStatusMenuRowId === rowStatusMenuId;
                      return (
                        <div data-status-menu-root="true" style={{ position: 'relative' }}>
                          <button
                            type="button"
                            disabled={updatingProductStatusId === baseProductId}
                            onClick={() => {
                              if (updatingProductStatusId === baseProductId) return;
                              onStatusMenuToggle(isStatusMenuOpen ? null : rowStatusMenuId);
                            }}
                            style={{
                              background: isActive ? T.greenBg : T.redBg,
                              border: `1px solid ${isActive ? T.greenBorder : T.redBorder}`,
                              color: isActive ? T.green : T.red,
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              height: 28,
                              minWidth: 96,
                              padding: '0 10px 0 12px',
                              outline: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              cursor: updatingProductStatusId === baseProductId ? 'not-allowed' : 'pointer',
                              opacity: updatingProductStatusId === baseProductId ? 0.7 : 1,
                            }}
                          >
                            <span>{isActive ? 'Active' : 'Inactive'}</span>
                            <span style={{ fontSize: 10 }}>▼</span>
                          </button>

                          {isStatusMenuOpen && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: 8,
                                width: 164,
                                borderRadius: 12,
                                border: `1px solid ${T.cardBorder}`,
                                background: T.card,
                                padding: 8,
                                zIndex: 40,
                              }}
                            >
                              {[
                                { value: 'active' as const, label: 'Active' },
                                { value: 'inactive' as const, label: 'Inactive' },
                              ].map((option) => {
                                const checked = productStatus === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      onStatusMenuToggle(null);
                                      if (option.value !== productStatus) {
                                        onUpdateProductStatus(product, option.value);
                                      }
                                    }}
                                    style={{
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '8px 12px',
                                      borderRadius: 8,
                                      border: 'none',
                                      background: 'transparent',
                                      color: option.value === 'active' ? T.green : T.red,
                                      fontSize: 14,
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                    }}
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
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
