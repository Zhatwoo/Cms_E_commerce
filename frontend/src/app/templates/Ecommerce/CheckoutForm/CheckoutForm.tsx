"use client";

import React, { useRef } from "react";
import { useNode } from "@craftjs/core";
import { CheckoutFormProps } from "./CheckoutForm.types";
// Defer loading of settings component to runtime to avoid TS/module resolution issues in the build
let runtimeCheckoutFormSettings: any = null;
if (typeof window !== "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    runtimeCheckoutFormSettings = require("./CheckoutFormSettings").default;
  } catch (e) {
    // silent
    runtimeCheckoutFormSettings = null;
  }
}

const defaultCartItems = [
  { id: "1", name: "Wireless Headphones", price: 79.99, quantity: 1, image: "https://placehold.co/80x80/3b82f6/ffffff?text=Item1" },
  { id: "2", name: "Smart Watch", price: 199.99, quantity: 1, image: "https://placehold.co/80x80/10b981/ffffff?text=Item2" },
];

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  // Layout
  showOrderSummary = true,
  summaryPosition = "right",
  
  // Colors
  backgroundColor = "#f8fafc",
  formBackgroundColor = "#ffffff",
  summaryBackgroundColor = "#ffffff",
  labelColor = "#334155",
  inputBackgroundColor = "#f8fafc",
  inputTextColor = "#1e293b",
  inputBorderColor = "#e2e8f0",
  buttonBackgroundColor = "#3b82f6",
  buttonTextColor = "#ffffff",
  priceColor = "#475569",
  totalPriceColor = "#1e293b",
  
  // Styling
  borderRadius = 12,
  inputBorderRadius = 8,
  buttonBorderRadius = 10,
  
  // Content
  title = "Checkout",
  titleColor = "#0f172a",
  subtotalLabel = "Subtotal",
  shippingLabel = "Shipping",
  taxLabel = "Tax",
  totalLabel = "Total",
  buttonText = "Place Order",
  
  // Values
  subtotal = 279.98,
  shipping = 10.00,
  tax = 23.20,
}) => {
  const { connectors: { connect, drag } } = useNode();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const total = subtotal + shipping + tax;
  const isRightLayout = summaryPosition === "right";

  return (
    <div
      ref={(ref) => {
        if (ref) {
          containerRef.current = ref;
          connect(drag(ref));
        }
      }}
      className="w-full"
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Title */}
        <h1 
          className="text-3xl font-bold mb-8"
          style={{ color: titleColor }}
        >
          {title}
        </h1>

        <div className={`flex ${isRightLayout ? "flex-col lg:flex-row" : "flex-col"} gap-8`}>
          {/* Checkout Form */}
          <div className={`${isRightLayout ? "flex-1" : "w-full"}`}>
            <div 
              className="p-6 md:p-8"
              style={{ 
                backgroundColor: formBackgroundColor,
                borderRadius: `${borderRadius}px`,
                border: `1px solid ${inputBorderColor}`
              }}
            >
              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4" style={{ color: labelColor }}>
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: inputBackgroundColor,
                        color: inputTextColor,
                        border: `1px solid ${inputBorderColor}`,
                        borderRadius: `${inputBorderRadius}px`
                      }}
                    />
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4" style={{ color: labelColor }}>
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        placeholder="John"
                        className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: inputBackgroundColor,
                          color: inputTextColor,
                          border: `1px solid ${inputBorderColor}`,
                          borderRadius: `${inputBorderRadius}px`
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="Doe"
                        className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: inputBackgroundColor,
                          color: inputTextColor,
                          border: `1px solid ${inputBorderColor}`,
                          borderRadius: `${inputBorderRadius}px`
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="123 Main St"
                      className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: inputBackgroundColor,
                        color: inputTextColor,
                        border: `1px solid ${inputBorderColor}`,
                        borderRadius: `${inputBorderRadius}px`
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                        City
                      </label>
                      <input
                        type="text"
                        placeholder="New York"
                        className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: inputBackgroundColor,
                          color: inputTextColor,
                          border: `1px solid ${inputBorderColor}`,
                          borderRadius: `${inputBorderRadius}px`
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                        State
                      </label>
                      <input
                        type="text"
                        placeholder="NY"
                        className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: inputBackgroundColor,
                          color: inputTextColor,
                          border: `1px solid ${inputBorderColor}`,
                          borderRadius: `${inputBorderRadius}px`
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                        ZIP
                      </label>
                      <input
                        type="text"
                        placeholder="10001"
                        className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: inputBackgroundColor,
                          color: inputTextColor,
                          border: `1px solid ${inputBorderColor}`,
                          borderRadius: `${inputBorderRadius}px`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="mb-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: labelColor }}>
                  Payment Method
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: inputBackgroundColor,
                        color: inputTextColor,
                        border: `1px solid ${inputBorderColor}`,
                        borderRadius: `${inputBorderRadius}px`
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: inputBackgroundColor,
                          color: inputTextColor,
                          border: `1px solid ${inputBorderColor}`,
                          borderRadius: `${inputBorderRadius}px`
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: inputBackgroundColor,
                          color: inputTextColor,
                          border: `1px solid ${inputBorderColor}`,
                          borderRadius: `${inputBorderRadius}px`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Place Order Button (mobile) */}
              {!isRightLayout && (
                <button
                  className="w-full py-4 text-base font-semibold hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: buttonBackgroundColor,
                    color: buttonTextColor,
                    borderRadius: `${buttonBorderRadius}px`
                  }}
                >
                  {buttonText}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary */}
          {showOrderSummary && (
            <div className={`${isRightLayout ? "w-full lg:w-96" : "w-full"}`}>
              <div 
                className="p-6"
                style={{ 
                  backgroundColor: summaryBackgroundColor,
                  borderRadius: `${borderRadius}px`,
                  border: `1px solid ${inputBorderColor}`
                }}
              >
                <h2 className="text-lg font-semibold mb-4" style={{ color: labelColor }}>
                  Order Summary
                </h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-6">
                  {defaultCartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: labelColor }}>
                          {item.name}
                        </p>
                        <p className="text-xs" style={{ color: priceColor }}>
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: priceColor }}>
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 py-4 border-t border-b" style={{ borderColor: inputBorderColor }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: priceColor }}>{subtotalLabel}</span>
                    <span style={{ color: priceColor }}>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: priceColor }}>{shippingLabel}</span>
                    <span style={{ color: priceColor }}>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: priceColor }}>{taxLabel}</span>
                    <span style={{ color: priceColor }}>${tax.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-lg font-bold mt-4 mb-6">
                  <span style={{ color: totalPriceColor }}>{totalLabel}</span>
                  <span style={{ color: totalPriceColor }}>${total.toFixed(2)}</span>
                </div>

                {/* Place Order Button (desktop) */}
                {isRightLayout && (
                  <button
                    className="w-full py-4 text-base font-semibold hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: buttonBackgroundColor,
                      color: buttonTextColor,
                      borderRadius: `${buttonBorderRadius}px`
                    }}
                  >
                    {buttonText}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;

(CheckoutForm as any).craft = {
  displayName: "Checkout Form",
  props: {
    showOrderSummary: true,
    summaryPosition: "right",
    backgroundColor: "#f8fafc",
    formBackgroundColor: "#ffffff",
    summaryBackgroundColor: "#ffffff",
    labelColor: "#334155",
    inputBackgroundColor: "#f8fafc",
    inputTextColor: "#1e293b",
    inputBorderColor: "#e2e8f0",
    buttonBackgroundColor: "#3b82f6",
    buttonTextColor: "#ffffff",
    priceColor: "#475569",
    totalPriceColor: "#1e293b",
    borderRadius: 12,
    inputBorderRadius: 8,
    buttonBorderRadius: 10,
    title: "Checkout",
    titleColor: "#0f172a",
    subtotalLabel: "Subtotal",
    shippingLabel: "Shipping",
    taxLabel: "Tax",
    totalLabel: "Total",
    buttonText: "Place Order",
    subtotal: 279.98,
    shipping: 10.00,
    tax: 23.20,
  },
  related: {
    settings: runtimeCheckoutFormSettings,
  },
  rules: {
    canMoveIn: () => false,
    canMoveOut: () => true,
    canDrag: () => true,
  },
};
