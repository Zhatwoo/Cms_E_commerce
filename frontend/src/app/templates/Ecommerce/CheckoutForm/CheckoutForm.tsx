"use client";

import React, { useRef } from "react";
import { useNode } from "@craftjs/core";
import type { CheckoutFormProps } from "../_shared/types";
import { defaultCheckoutCartItems, checkoutCraftProps, defaultCraftRules } from "../_shared";
import { CheckoutFormSections } from "../_shared/CheckoutFormSections";
import { CheckoutOrderSummary } from "../_shared/CheckoutOrderSummary";

// Defer loading of settings component to runtime to avoid TS/module resolution issues in the build
let runtimeCheckoutFormSettings: any = null;
if (typeof window !== "undefined") {
  try {
    runtimeCheckoutFormSettings = require("./CheckoutFormSettings").default;
  } catch (e) {
    runtimeCheckoutFormSettings = null;
  }
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  showOrderSummary = true,
  summaryPosition = "right",
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
  borderRadius = 12,
  inputBorderRadius = 8,
  buttonBorderRadius = 10,
  title = "Checkout",
  titleColor = "#0f172a",
  subtotalLabel = "Subtotal",
  shippingLabel = "Shipping",
  taxLabel = "Tax",
  totalLabel = "Total",
  buttonText = "Place Order",
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
      ref={(ref) => { if (ref) { containerRef.current = ref; connect(drag(ref)); } }}
      className="w-full"
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8" style={{ color: titleColor }}>{title}</h1>

        <div className={`flex ${isRightLayout ? "flex-col lg:flex-row" : "flex-col"} gap-8`}>
          <div className={isRightLayout ? "flex-1" : "w-full"}>
            <CheckoutFormSections
              labelColor={labelColor}
              inputBackgroundColor={inputBackgroundColor}
              inputTextColor={inputTextColor}
              inputBorderColor={inputBorderColor}
              inputBorderRadius={inputBorderRadius}
              buttonBackgroundColor={buttonBackgroundColor}
              buttonTextColor={buttonTextColor}
              buttonBorderRadius={buttonBorderRadius}
              buttonText={buttonText}
              showPlaceOrderButton={!isRightLayout}
              formBackgroundColor={formBackgroundColor}
              borderRadius={borderRadius}
            />
          </div>

          {showOrderSummary && (
            <div className={isRightLayout ? "w-full lg:w-96" : "w-full"}>
              <CheckoutOrderSummary
                items={defaultCheckoutCartItems}
                subtotal={subtotal}
                shipping={shipping}
                tax={tax}
                total={total}
                subtotalLabel={subtotalLabel}
                shippingLabel={shippingLabel}
                taxLabel={taxLabel}
                totalLabel={totalLabel}
                buttonText={buttonText}
                showButton={isRightLayout}
                summaryBackgroundColor={summaryBackgroundColor}
                labelColor={labelColor}
                priceColor={priceColor}
                totalPriceColor={totalPriceColor}
                inputBorderColor={inputBorderColor}
                borderRadius={borderRadius}
                buttonBackgroundColor={buttonBackgroundColor}
                buttonTextColor={buttonTextColor}
                buttonBorderRadius={buttonBorderRadius}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export type { CheckoutFormProps };
export default CheckoutForm;

(CheckoutForm as any).craft = {
  displayName: "Checkout Form",
  props: checkoutCraftProps,
  related: { settings: runtimeCheckoutFormSettings },
  rules: defaultCraftRules,
};
