"use client";

import React from "react";

interface CartOrderSummaryProps {
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  isRightLayout: boolean;
  showPromoCode: boolean;
  showShippingEstimate: boolean;
  subtotalLabel: string;
  shippingLabel: string;
  discountLabel: string;
  totalLabel: string;
  checkoutButtonText: string;
  promoPlaceholder: string;
  summaryBackgroundColor: string;
  titleColor: string;
  priceColor: string;
  labelColor: string;
  totalPriceColor: string;
  borderColor: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  quantityButtonColor: string;
  borderRadius: number;
  buttonBorderRadius: number;
}

export const CartOrderSummary: React.FC<CartOrderSummaryProps> = ({
  subtotal, shippingCost, discount, tax, total, isRightLayout,
  showPromoCode, showShippingEstimate,
  subtotalLabel, shippingLabel, discountLabel, totalLabel,
  checkoutButtonText, promoPlaceholder,
  summaryBackgroundColor, titleColor, priceColor, labelColor,
  totalPriceColor, borderColor, buttonBackgroundColor, buttonTextColor,
  quantityButtonColor, borderRadius, buttonBorderRadius,
}) => (
  <div className={`${isRightLayout ? "w-full lg:w-96" : "w-full"}`}>
    <div className="p-6 sticky top-4"
      style={{ backgroundColor: summaryBackgroundColor, borderRadius: `${borderRadius}px`, border: `1px solid ${borderColor}` }}>
      <h2 className="text-lg font-bold mb-5" style={{ color: titleColor }}>Order Summary</h2>

      {showPromoCode && (
        <div className="mb-5">
          <div className="flex gap-2">
            <input type="text" placeholder={promoPlaceholder}
              className="flex-1 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ border: `1px solid ${borderColor}`, borderRadius: `${buttonBorderRadius}px`, color: labelColor }} />
            <button className="px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: quantityButtonColor, color: labelColor, borderRadius: `${buttonBorderRadius}px`, border: `1px solid ${borderColor}` }}>
              Apply
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 py-4" style={{ borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: priceColor }}>{subtotalLabel}</span>
          <span style={{ color: labelColor }}>${subtotal.toFixed(2)}</span>
        </div>
        {showShippingEstimate && (
          <div className="flex justify-between text-sm">
            <span style={{ color: priceColor }}>{shippingLabel}</span>
            <span style={{ color: labelColor }}>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color: priceColor }}>{discountLabel}</span>
            <span className="text-green-600 font-medium">-${discount.toFixed(2)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color: priceColor }}>Tax</span>
            <span style={{ color: labelColor }}>${tax.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between text-lg font-bold mt-4 mb-6">
        <span style={{ color: totalPriceColor }}>{totalLabel}</span>
        <span style={{ color: totalPriceColor }}>${total.toFixed(2)}</span>
      </div>

      <button className="w-full py-3.5 text-base font-semibold hover:opacity-90 transition-opacity"
        style={{ backgroundColor: buttonBackgroundColor, color: buttonTextColor, borderRadius: `${buttonBorderRadius}px` }}>
        {checkoutButtonText}
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        <svg className="w-4 h-4" style={{ color: priceColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-xs" style={{ color: priceColor }}>Secure checkout</span>
      </div>
    </div>
  </div>
);
