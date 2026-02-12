"use client";

import React, { useRef } from "react";
import { useNode } from "@craftjs/core";
import type { CartLayoutProps } from "../_shared/types";
import { defaultCartItems, cartCraftProps, defaultCraftRules } from "../_shared";
import { CartItemRow } from "../_shared/CartItemRow";
import { CartOrderSummary } from "../_shared/CartOrderSummary";
import { CartLayoutSettings } from "./CartLayoutSettings";

export type { CartLayoutProps };

export const CartLayout: React.FC<CartLayoutProps> = ({
  items = defaultCartItems,
  showOrderSummary = true, summaryPosition = "right",
  backgroundColor = "#f8fafc", cardBackgroundColor = "#ffffff",
  summaryBackgroundColor = "#ffffff", titleColor = "#0f172a",
  labelColor = "#334155", priceColor = "#475569",
  totalPriceColor = "#1e293b", borderColor = "#e2e8f0",
  buttonBackgroundColor = "#3b82f6", buttonTextColor = "#ffffff",
  secondaryButtonBackgroundColor = "transparent",
  secondaryButtonTextColor = "#3b82f6", removeButtonColor = "#ef4444",
  quantityButtonColor = "#f1f5f9",
  borderRadius = 12, buttonBorderRadius = 10, imageSize = 96,
  title = "Shopping Cart",
  subtotalLabel = "Subtotal", shippingLabel = "Shipping",
  discountLabel = "Discount", totalLabel = "Total",
  checkoutButtonText = "Proceed to Checkout",
  continueShoppingText = "← Continue Shopping",
  emptyCartText = "Your cart is empty",
  emptyCartSubtext = "Looks like you haven't added anything to your cart yet.",
  promoPlaceholder = "Enter promo code",
  showPromoCode = true, showShippingEstimate = true,
  showContinueShopping = true, showItemVariant = true, showItemImage = true,
  shippingCost = 9.99, discount = 0, taxRate = 0.08,
}) => {
  const { connectors: { connect, drag } } = useNode();
  const containerRef = useRef<HTMLDivElement>(null);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost - discount + tax;
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const isRightLayout = summaryPosition === "right";

  const refCb = (ref: HTMLDivElement | null) => {
    if (ref) { containerRef.current = ref; connect(drag(ref)); }
  };

  if (items.length === 0) {
    return (
      <div ref={refCb} className="w-full" style={{ backgroundColor }}>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: titleColor }}>{emptyCartText}</h2>
          <p className="text-base mb-8" style={{ color: priceColor }}>{emptyCartSubtext}</p>
          {showContinueShopping && (
            <button className="px-6 py-3 font-semibold text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: buttonBackgroundColor, color: buttonTextColor, borderRadius: `${buttonBorderRadius}px` }}>
              Start Shopping
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={refCb} className="w-full" style={{ backgroundColor }}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: titleColor }}>
            {title}
            <span className="text-lg font-normal ml-2" style={{ color: priceColor }}>
              ({totalItems} {totalItems === 1 ? "item" : "items"})
            </span>
          </h1>
        </div>

        <div className={`flex ${isRightLayout ? "flex-col lg:flex-row" : "flex-col"} gap-8`}>
          <div className={isRightLayout ? "flex-1" : "w-full"}>
            <div className="overflow-hidden"
              style={{ backgroundColor: cardBackgroundColor, borderRadius: `${borderRadius}px`, border: `1px solid ${borderColor}` }}>
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wide"
                style={{ color: priceColor, borderBottom: `1px solid ${borderColor}`, backgroundColor: quantityButtonColor }}>
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>
              <div className="divide-y" style={{ borderColor }}>
                {items.map((item) => (
                  <CartItemRow key={item.id} item={item}
                    showItemImage={showItemImage} showItemVariant={showItemVariant}
                    imageSize={imageSize} titleColor={titleColor} priceColor={priceColor}
                    labelColor={labelColor} totalPriceColor={totalPriceColor}
                    removeButtonColor={removeButtonColor} quantityButtonColor={quantityButtonColor}
                    borderColor={borderColor} />
                ))}
              </div>
            </div>
            {showContinueShopping && (
              <button className="mt-4 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: secondaryButtonTextColor, backgroundColor: secondaryButtonBackgroundColor,
                  border: `1px solid ${secondaryButtonTextColor}`, borderRadius: `${buttonBorderRadius}px` }}>
                {continueShoppingText}
              </button>
            )}
          </div>

          {showOrderSummary && (
            <CartOrderSummary
              subtotal={subtotal} shippingCost={shippingCost} discount={discount}
              tax={tax} total={total} isRightLayout={isRightLayout}
              showPromoCode={showPromoCode} showShippingEstimate={showShippingEstimate}
              subtotalLabel={subtotalLabel} shippingLabel={shippingLabel}
              discountLabel={discountLabel} totalLabel={totalLabel}
              checkoutButtonText={checkoutButtonText} promoPlaceholder={promoPlaceholder}
              summaryBackgroundColor={summaryBackgroundColor} titleColor={titleColor}
              priceColor={priceColor} labelColor={labelColor} totalPriceColor={totalPriceColor}
              borderColor={borderColor} buttonBackgroundColor={buttonBackgroundColor}
              buttonTextColor={buttonTextColor} quantityButtonColor={quantityButtonColor}
              borderRadius={borderRadius} buttonBorderRadius={buttonBorderRadius} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CartLayout;

(CartLayout as any).craft = {
  displayName: "Cart",
  props: cartCraftProps,
  related: { settings: CartLayoutSettings },
  rules: defaultCraftRules,
};
