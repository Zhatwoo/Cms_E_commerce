"use client";

import React from "react";

interface CheckoutInputProps {
  label: string;
  placeholder: string;
  type?: string;
  inputBackgroundColor: string;
  inputTextColor: string;
  inputBorderColor: string;
  inputBorderRadius: number;
  labelColor: string;
}

/** Styled form input for checkout-style forms */
export const CheckoutInput: React.FC<CheckoutInputProps> = ({
  label, placeholder, type = "text",
  inputBackgroundColor, inputTextColor, inputBorderColor, inputBorderRadius, labelColor,
}) => (
  <div>
    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>{label}</label>
    <input type={type} placeholder={placeholder}
      className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={{ backgroundColor: inputBackgroundColor, color: inputTextColor, border: `1px solid ${inputBorderColor}`, borderRadius: `${inputBorderRadius}px` }} />
  </div>
);
