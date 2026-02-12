"use client";

import React from "react";
import { CheckoutInput } from "./CheckoutInput";

interface CheckoutFormSectionsProps {
  labelColor: string;
  inputBackgroundColor: string;
  inputTextColor: string;
  inputBorderColor: string;
  inputBorderRadius: number;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
  buttonText: string;
  showPlaceOrderButton: boolean;
  formBackgroundColor: string;
  borderRadius: number;
}

/** Renders the Contact, Shipping, and Payment sections of a checkout form */
export const CheckoutFormSections: React.FC<CheckoutFormSectionsProps> = ({
  labelColor, inputBackgroundColor, inputTextColor, inputBorderColor, inputBorderRadius,
  buttonBackgroundColor, buttonTextColor, buttonBorderRadius, buttonText,
  showPlaceOrderButton, formBackgroundColor, borderRadius,
}) => {
  const inputProps = { inputBackgroundColor, inputTextColor, inputBorderColor, inputBorderRadius, labelColor };

  return (
    <div
      className="p-6 md:p-8"
      style={{ backgroundColor: formBackgroundColor, borderRadius: `${borderRadius}px`, border: `1px solid ${inputBorderColor}` }}
    >
      {/* Contact Information */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: labelColor }}>Contact Information</h2>
        <div className="space-y-4">
          <CheckoutInput label="Email" placeholder="you@example.com" type="email" {...inputProps} />
        </div>
      </section>

      {/* Shipping Address */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: labelColor }}>Shipping Address</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CheckoutInput label="First Name" placeholder="John" {...inputProps} />
            <CheckoutInput label="Last Name" placeholder="Doe" {...inputProps} />
          </div>
          <CheckoutInput label="Address" placeholder="123 Main St" {...inputProps} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CheckoutInput label="City" placeholder="New York" {...inputProps} />
            <CheckoutInput label="State" placeholder="NY" {...inputProps} />
            <CheckoutInput label="ZIP" placeholder="10001" {...inputProps} />
          </div>
        </div>
      </section>

      {/* Payment Method */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: labelColor }}>Payment Method</h2>
        <div className="space-y-4">
          <CheckoutInput label="Card Number" placeholder="1234 5678 9012 3456" {...inputProps} />
          <div className="grid grid-cols-2 gap-4">
            <CheckoutInput label="Expiry Date" placeholder="MM/YY" {...inputProps} />
            <CheckoutInput label="CVV" placeholder="123" {...inputProps} />
          </div>
        </div>
      </section>

      {showPlaceOrderButton && (
        <button
          className="w-full py-4 text-base font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: buttonBackgroundColor, color: buttonTextColor, borderRadius: `${buttonBorderRadius}px` }}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};
