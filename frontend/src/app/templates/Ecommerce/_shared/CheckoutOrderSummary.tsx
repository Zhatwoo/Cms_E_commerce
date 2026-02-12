"use client";

import React from "react";

interface SummaryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CheckoutOrderSummaryProps {
  items: SummaryItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  subtotalLabel: string;
  shippingLabel: string;
  taxLabel: string;
  totalLabel: string;
  buttonText: string;
  showButton: boolean;
  summaryBackgroundColor: string;
  labelColor: string;
  priceColor: string;
  totalPriceColor: string;
  inputBorderColor: string;
  borderRadius: number;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
}

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  items, subtotal, shipping, tax, total,
  subtotalLabel, shippingLabel, taxLabel, totalLabel, buttonText, showButton,
  summaryBackgroundColor, labelColor, priceColor, totalPriceColor,
  inputBorderColor, borderRadius, buttonBackgroundColor, buttonTextColor, buttonBorderRadius,
}) => (
  <div
    className="p-6"
    style={{
      backgroundColor: summaryBackgroundColor,
      borderRadius: `${borderRadius}px`,
      border: `1px solid ${inputBorderColor}`,
    }}
  >
    <h2 className="text-lg font-semibold mb-4" style={{ color: labelColor }}>
      Order Summary
    </h2>

    {/* Cart Items */}
    <div className="space-y-3 mb-6">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: labelColor }}>{item.name}</p>
            <p className="text-xs" style={{ color: priceColor }}>Qty: {item.quantity}</p>
          </div>
          <p className="text-sm font-semibold" style={{ color: priceColor }}>${item.price.toFixed(2)}</p>
        </div>
      ))}
    </div>

    {/* Price Breakdown */}
    <div className="space-y-2 py-4 border-t border-b" style={{ borderColor: inputBorderColor }}>
      {[
        { label: subtotalLabel, value: subtotal },
        { label: shippingLabel, value: shipping },
        { label: taxLabel, value: tax },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between text-sm">
          <span style={{ color: priceColor }}>{label}</span>
          <span style={{ color: priceColor }}>${value.toFixed(2)}</span>
        </div>
      ))}
    </div>

    {/* Total */}
    <div className="flex justify-between text-lg font-bold mt-4 mb-6">
      <span style={{ color: totalPriceColor }}>{totalLabel}</span>
      <span style={{ color: totalPriceColor }}>${total.toFixed(2)}</span>
    </div>

    {/* Place Order Button */}
    {showButton && (
      <button
        className="w-full py-4 text-base font-semibold hover:opacity-90 transition-opacity"
        style={{ backgroundColor: buttonBackgroundColor, color: buttonTextColor, borderRadius: `${buttonBorderRadius}px` }}
      >
        {buttonText}
      </button>
    )}
  </div>
);
