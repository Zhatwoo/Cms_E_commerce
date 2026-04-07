'use client';

import React, { type ReactNode } from 'react';
import type { ApiPublishedOrder } from '@/lib/api';

type ColorsShape = {
  accent: { yellow: string; purple: string };
  status: { good: string; error: string };
  border: { faint: string };
  bg: { elevated: string };
  text: { primary: string; secondary: string; muted: string };
};

type BadgeShape = { label: string; bg: string; color: string };

type ViewsProps = {
  theme: 'light' | 'dark';
  colors: ColorsShape;
  pagedOrders: ApiPublishedOrder[];
  expandedOrderId: string | null;
  editingOrderId: string | null;
  updatingId: string | null;
  draftStatus: string;
  actionButtonClass: string;
  thumbnails: string[];
  orderStatuses: string[];
  onToggleDetails: (orderId: string) => void;
  onHandleStatusUpdate: (order: ApiPublishedOrder, nextStatus: string) => Promise<boolean>;
  onStartEditStatus: (order: ApiPublishedOrder) => void;
  onSetDraftStatus: (status: string) => void;
  onSaveEditedStatus: (order: ApiPublishedOrder) => Promise<void>;
  onCancelEditStatus: () => void;
  orderNumber: (order: ApiPublishedOrder) => string;
  contactSummary: (address: ApiPublishedOrder['shippingAddress']) => string;
  shippingSummary: (address: ApiPublishedOrder['shippingAddress']) => string;
  formatPayout: (amount: number) => string;
  rowBadge: (status: string, colors: any) => BadgeShape;
  resolvePaymentMode: (order: ApiPublishedOrder) => string;
  renderIcon: (type: 'eye' | 'check' | 'close') => ReactNode;
  renderPaymentModePill: (mode: string, compact?: boolean) => ReactNode;
};

export function ListView({
  theme,
  colors,
  pagedOrders,
  expandedOrderId,
  editingOrderId,
  updatingId,
  draftStatus,
  actionButtonClass,
  thumbnails,
  orderStatuses,
  onToggleDetails,
  onHandleStatusUpdate,
  onStartEditStatus,
  onSetDraftStatus,
  onSaveEditedStatus,
  onCancelEditStatus,
  orderNumber,
  contactSummary,
  shippingSummary,
  formatPayout,
  rowBadge,
  resolvePaymentMode,
  renderIcon,
  renderPaymentModePill,
}: ViewsProps) {
  return (
    <section
      className={`relative z-10 rounded-2xl border overflow-hidden ${theme === 'dark' ? '' : 'admin-dashboard-panel border-0'}`}
      style={{
        borderColor: theme === 'dark' ? colors.border.faint : undefined,
        backgroundImage: theme === 'dark' ? 'linear-gradient(135deg, #110248 0%, #090029 100%)' : 'none',
      }}
    >
      <div
        className="grid px-4 py-3 text-[10px] uppercase font-semibold tracking-[0.16em] border-b"
        style={{
          gridTemplateColumns: '1.15fr 0.95fr 0.85fr 0.7fr 0.85fr 0.85fr 0.85fr',
          borderColor: colors.border.faint,
          color: colors.text.muted,
        }}
      >
        <span>Product</span>
        <span>Identity</span>
        <span>Buyer</span>
        <span>Payout</span>
        <span>Payment</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      {pagedOrders.map((order, idx) => {
        const badge = rowBadge(String(order.status || 'Pending'), colors);
        const paymentMode = resolvePaymentMode(order);
        const isExpanded = expandedOrderId === order.id;
        const isEditing = editingOrderId === order.id;

        return (
          <div
            key={order.id}
            className="px-2.5 max-[390px]:px-2 sm:px-4 py-3.5 sm:py-4 border-b transition-colors duration-150"
            style={{
              borderColor: colors.border.faint,
              backgroundColor: isExpanded ? (theme === 'dark' ? 'rgba(103,2,191,0.07)' : 'rgba(139,92,246,0.04)') : 'transparent',
            }}
          >
            <div className="grid items-start md:items-center gap-2.5 md:gap-3" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
              <div className="hidden md:grid w-full items-center gap-3" style={{ gridTemplateColumns: '1.15fr 0.95fr 0.85fr 0.7fr 0.85fr 0.85fr 0.85fr' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={thumbnails[idx % thumbnails.length]}
                      alt="Order preview"
                      className="h-11 w-[68px] sm:h-12 sm:w-[74px] rounded-md object-cover border"
                      style={{ borderColor: colors.border.faint }}
                    />
                    <div className="absolute inset-0 rounded-md" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-widest" style={{ color: colors.accent.yellow }}>{orderNumber(order)}</p>
                    <p className="text-[12px] sm:text-[13px] font-semibold truncate" style={{ color: colors.text.primary }}>
                      {order.items?.[0]?.name || 'Product Name 0001'}
                    </p>
                    <button type="button" onClick={() => onToggleDetails(order.id)} className="mt-0.5 text-[10px] font-semibold underline-offset-2 hover:underline" style={{ color: colors.accent.purple }}>
                      {isExpanded ? 'Close details' : 'See details'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] truncate font-mono opacity-70" style={{ color: colors.text.secondary }}>{order.id}</p>
                <p className="text-[13px] sm:text-sm" style={{ color: colors.text.primary }}>{contactSummary(order.shippingAddress).split(' • ')[0] || 'John David'}</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>{formatPayout(Number(order.total || 0))}</p>
                <div>{renderPaymentModePill(paymentMode)}</div>

                <span className="justify-self-start px-3 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button type="button" className={actionButtonClass} title={isExpanded ? 'Close' : 'View'} onClick={() => onToggleDetails(order.id)} style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: `${colors.bg.elevated}CC` }}>
                    {renderIcon('eye')}
                  </button>
                  <button type="button" className={actionButtonClass} title="Mark completed" disabled={updatingId === order.id} onClick={() => void onHandleStatusUpdate(order, 'Delivered')} style={{ borderColor: colors.border.faint, color: colors.status.good, backgroundColor: `${colors.bg.elevated}CC` }}>
                    {renderIcon('check')}
                  </button>
                  <button type="button" className={actionButtonClass} title="Cancel" disabled={updatingId === order.id} onClick={() => void onHandleStatusUpdate(order, 'Cancelled')} style={{ borderColor: colors.border.faint, color: colors.status.error, backgroundColor: `${colors.bg.elevated}CC` }}>
                    {renderIcon('close')}
                  </button>
                </div>
              </div>

              <div className="flex md:hidden items-start gap-3">
                <div className="relative shrink-0">
                  <img src={thumbnails[idx % thumbnails.length]} alt="Order preview" className="h-14 w-20 rounded-md object-cover border" style={{ borderColor: colors.border.faint }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-widest" style={{ color: colors.accent.yellow }}>{orderNumber(order)}</p>
                  <p className="text-[13px] font-semibold truncate" style={{ color: colors.text.primary }}>{order.items?.[0]?.name || 'Product'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
                    {renderPaymentModePill(paymentMode, true)}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-lg font-bold" style={{ color: colors.text.primary }}>{formatPayout(Number(order.total || 0))}</p>
                    <div className="flex gap-1">
                      <button type="button" className={actionButtonClass} onClick={() => onToggleDetails(order.id)} style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: `${colors.bg.elevated}CC` }}>{renderIcon('eye')}</button>
                      <button type="button" className={actionButtonClass} disabled={updatingId === order.id} onClick={() => void onHandleStatusUpdate(order, 'Delivered')} style={{ borderColor: colors.border.faint, color: colors.status.good, backgroundColor: `${colors.bg.elevated}CC` }}>{renderIcon('check')}</button>
                      <button type="button" className={actionButtonClass} disabled={updatingId === order.id} onClick={() => void onHandleStatusUpdate(order, 'Cancelled')} style={{ borderColor: colors.border.faint, color: colors.status.error, backgroundColor: `${colors.bg.elevated}CC` }}>{renderIcon('close')}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 rounded-xl border p-3 sm:p-4" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: colors.text.muted }}>Product details</span>
                  {renderPaymentModePill(paymentMode)}
                  {!isEditing ? (
                    <button type="button" onClick={() => onStartEditStatus(order)} className="h-8 px-3 rounded-md border text-[11px] font-semibold" style={{ borderColor: colors.border.faint, color: colors.text.primary, backgroundColor: `${colors.bg.elevated}CC` }}>
                      Edit status
                    </button>
                  ) : (
                    <>
                      <label className="text-[11px]" style={{ color: colors.text.secondary }}>Status</label>
                      <select value={draftStatus} onChange={(e) => onSetDraftStatus(e.target.value)} disabled={updatingId === order.id} className="h-8 rounded-md border px-2.5 text-[11px] outline-none" style={{ borderColor: colors.border.faint, color: colors.text.primary, backgroundColor: `${colors.bg.elevated}CC` }}>
                        {orderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button type="button" onClick={() => void onSaveEditedStatus(order)} disabled={updatingId === order.id} className="h-8 px-3 rounded-md border text-[11px] font-semibold disabled:opacity-60" style={{ borderColor: colors.border.faint, color: colors.status.good, backgroundColor: `${colors.bg.elevated}CC` }}>
                        Save
                      </button>
                      <button type="button" onClick={onCancelEditStatus} className="h-8 px-3 rounded-md border text-[11px] font-semibold" style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: `${colors.bg.elevated}CC` }}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="uppercase text-[10px] mb-1" style={{ color: colors.text.muted }}>Delivery Address</p>
                    <p style={{ color: colors.text.secondary }}>{shippingSummary(order.shippingAddress)}</p>
                    <p className="mt-1" style={{ color: colors.text.secondary }}>{contactSummary(order.shippingAddress)}</p>
                  </div>
                  <div>
                    <p className="uppercase text-[10px] mb-1" style={{ color: colors.text.muted }}>Order Specification</p>
                    {(order.items || []).slice(0, 3).map((item, iIdx) => (
                      <p key={`${order.id}-spec-${iIdx}`} style={{ color: colors.text.secondary }}>
                        Variant: {item.name || item.sku || 'Item'} • Qty {item.quantity}
                      </p>
                    ))}
                  </div>
                  <div className="rounded-xl border p-3" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                    <p className="uppercase text-[10px]" style={{ color: colors.text.muted }}>Payment Details</p>
                    <div className="mt-1.5 mb-2">{renderPaymentModePill(paymentMode)}</div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between" style={{ color: colors.text.secondary }}>
                        <span>Base Price</span><span>{formatPayout(Number(order.total || 0) + 300)}</span>
                      </div>
                      <div className="flex items-center justify-between" style={{ color: colors.text.secondary }}>
                        <span>Voucher</span><span>-₱300</span>
                      </div>
                      <div className="flex items-center justify-between" style={{ color: colors.text.secondary }}>
                        <span>Shipping</span><span>₱0</span>
                      </div>
                      <div className="mt-2 pt-2 border-t flex items-center justify-between font-bold" style={{ color: colors.accent.yellow, borderColor: colors.border.faint }}>
                        <span>Total Amount</span><span>{formatPayout(Number(order.total || 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

export function GridView({
  theme,
  colors,
  pagedOrders,
  expandedOrderId,
  editingOrderId,
  updatingId,
  draftStatus,
  actionButtonClass,
  thumbnails,
  orderStatuses,
  onToggleDetails,
  onHandleStatusUpdate,
  onStartEditStatus,
  onSetDraftStatus,
  onSaveEditedStatus,
  onCancelEditStatus,
  orderNumber,
  contactSummary,
  shippingSummary,
  formatPayout,
  rowBadge,
  resolvePaymentMode,
  renderIcon,
  renderPaymentModePill,
}: ViewsProps) {
  return (
    <section className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
      {pagedOrders.map((order, idx) => {
        const badge = rowBadge(String(order.status || 'Pending'), colors);
        const paymentMode = resolvePaymentMode(order);
        const isExpanded = expandedOrderId === order.id;
        const isEditing = editingOrderId === order.id;

        return (
          <article
            key={order.id}
            className={`rounded-2xl border overflow-hidden transition-all duration-200 ${theme === 'dark' ? '' : 'admin-dashboard-panel border-0'}`}
            style={{
              borderColor: isExpanded ? `${colors.accent.purple}66` : (theme === 'dark' ? colors.border.faint : undefined),
              backgroundImage: theme === 'dark' ? 'linear-gradient(135deg, #110248 0%, #0D0035 100%)' : 'none',
              boxShadow: isExpanded
                ? theme === 'dark' ? '0 0 0 1px rgba(103,2,191,0.3), 0 8px 32px rgba(103,2,191,0.15)' : '0 0 0 1px rgba(139,92,246,0.2), 0 8px 24px rgba(139,92,246,0.08)'
                : undefined,
            }}
          >
            <div className="relative overflow-hidden">
              <img src={thumbnails[idx % thumbnails.length]} alt="Order card preview" className="h-32 sm:h-36 w-full object-cover" style={{ display: 'block' }} />
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to top, rgba(9,0,41,0.6) 0%, transparent 55%)' }} />
              <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow" style={{ backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.color}33`, backdropFilter: 'blur(6px)' }}>
                {badge.label}
              </span>
              <p className="absolute bottom-2.5 left-3 text-[10px] font-bold tracking-widest drop-shadow" style={{ color: colors.accent.yellow }}>
                {orderNumber(order)}
              </p>
            </div>

            <div className="p-3 sm:p-3.5">
              <p className="text-[13px] sm:text-sm font-semibold leading-snug" style={{ color: colors.text.primary }}>
                {order.items?.[0]?.name || 'Product Name 0001'}
              </p>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-[12px] truncate pr-2" style={{ color: colors.text.secondary }}>
                  {contactSummary(order.shippingAddress).split(' • ')[0] || 'John David'}
                </p>
                <p className="text-base font-bold shrink-0" style={{ color: colors.accent.yellow }}>
                  {formatPayout(Number(order.total || 0))}
                </p>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: colors.text.muted }}>via</span>
                {renderPaymentModePill(paymentMode, true)}
              </div>

              <div className="mt-3 mb-2.5 h-px" style={{ backgroundImage: `linear-gradient(90deg, ${colors.border.faint} 0%, transparent 100%)` }} />

              <div className="grid grid-cols-3 gap-2">
                <button type="button" className={`${actionButtonClass} w-full`} title={isExpanded ? 'Close' : 'View'} onClick={() => onToggleDetails(order.id)} style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: `${colors.bg.elevated}CC` }}>
                  {renderIcon('eye')}
                </button>
                <button type="button" className={`${actionButtonClass} w-full`} title="Mark in transit" disabled={updatingId === order.id} onClick={() => void onHandleStatusUpdate(order, 'Shipped')} style={{ borderColor: colors.border.faint, color: colors.status.good, backgroundColor: `${colors.bg.elevated}CC` }}>
                  {renderIcon('check')}
                </button>
                <button type="button" className={`${actionButtonClass} w-full`} title="Cancel" disabled={updatingId === order.id} onClick={() => void onHandleStatusUpdate(order, 'Cancelled')} style={{ borderColor: colors.border.faint, color: colors.status.error, backgroundColor: `${colors.bg.elevated}CC` }}>
                  {renderIcon('close')}
                </button>
              </div>

              <button type="button" onClick={() => onToggleDetails(order.id)} className="mt-2 text-[11px] font-semibold underline-offset-2 hover:underline" style={{ color: colors.accent.purple }}>
                {isExpanded ? 'Close product details' : 'See product details'}
              </button>

              {isExpanded && (
                <div className="mt-2.5 rounded-xl border p-2.5 text-xs" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="uppercase text-[10px] font-semibold tracking-wider" style={{ color: colors.text.muted }}>Order details</p>
                    {!isEditing ? (
                      <button type="button" onClick={() => onStartEditStatus(order)} className="h-7 px-2.5 rounded-md border text-[11px] font-semibold" style={{ borderColor: colors.border.faint, color: colors.text.primary }}>
                        Edit status
                      </button>
                    ) : (
                      <>
                        <select value={draftStatus} onChange={(e) => onSetDraftStatus(e.target.value)} disabled={updatingId === order.id} className="h-7 rounded-md border px-2 text-[11px] outline-none" style={{ borderColor: colors.border.faint, color: colors.text.primary, backgroundColor: `${colors.bg.elevated}CC` }}>
                          {orderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button type="button" onClick={() => void onSaveEditedStatus(order)} disabled={updatingId === order.id} className="h-7 px-2.5 rounded-md border text-[11px] font-semibold disabled:opacity-60" style={{ borderColor: colors.border.faint, color: colors.status.good }}>
                          Save
                        </button>
                        <button type="button" onClick={onCancelEditStatus} className="h-7 px-2.5 rounded-md border text-[11px] font-semibold" style={{ borderColor: colors.border.faint, color: colors.text.secondary }}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                  <p style={{ color: colors.text.secondary }}>{shippingSummary(order.shippingAddress)}</p>
                  {(order.items || []).slice(0, 3).map((item, iIdx) => (
                    <p key={`${order.id}-grid-spec-${iIdx}`} className="mt-1" style={{ color: colors.text.secondary }}>
                      Variant: {item.name || item.sku || 'Item'} • Qty {item.quantity}
                    </p>
                  ))}
                  <div className="mt-2 pt-2 border-t flex items-center gap-2" style={{ borderColor: colors.border.faint }}>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: colors.text.muted }}>Payment:</span>
                    {renderPaymentModePill(paymentMode, true)}
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
