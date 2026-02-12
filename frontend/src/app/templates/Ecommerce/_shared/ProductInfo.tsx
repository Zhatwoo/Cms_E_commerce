"use client";

import React from "react";
import type { ProductActionButton } from "./types";

interface ProductInfoProps {
  productName: string;
  productPrice: number;
  discountPrice?: number | null;
  productDescription: string;
  productRating: number;
  productReviews: number;
  showRating: boolean;
  inStock: boolean;
  stockCount: number;
  titleColor: string;
  priceColor: string;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  actionButtons: ProductActionButton[];
}

const variantStyles = (variant: ProductActionButton["variant"], priceColor: string) => {
  switch (variant) {
    case "primary":
      return { bg: "#3b82f6", text: "#ffffff", border: "none" };
    case "secondary":
      return { bg: "#10b981", text: "#ffffff", border: "none" };
    case "outline":
    default:
      return { bg: "transparent", text: priceColor, border: `2px solid ${priceColor}` };
  }
};

/** Product info panel: name, price, rating, stock, quantity, and action buttons */
export const ProductInfo: React.FC<ProductInfoProps> = ({
  productName, productPrice, discountPrice, productDescription,
  productRating, productReviews, showRating, inStock, stockCount,
  titleColor, priceColor, quantity, onQuantityChange, actionButtons,
}) => {
  const displayPrice = discountPrice && discountPrice < productPrice ? (
    <div className="flex items-baseline gap-3">
      <span style={{ color: priceColor }} className="text-4xl font-bold">${discountPrice.toFixed(2)}</span>
      <span className="text-2xl text-gray-500 line-through">${productPrice.toFixed(2)}</span>
      <span className="text-sm text-green-600 font-semibold">Save ${(productPrice - discountPrice).toFixed(2)}</span>
    </div>
  ) : (
    <span style={{ color: priceColor }} className="text-4xl font-bold">${productPrice.toFixed(2)}</span>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 style={{ color: titleColor }} className="text-4xl font-bold mb-2">{productName}</h1>
        {showRating && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-lg ${i < Math.floor(productRating) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
              ))}
            </div>
            <span className="text-sm text-gray-600">{productRating} ({productReviews} reviews)</span>
          </div>
        )}
      </div>

      <div>{displayPrice}</div>

      <p className="text-gray-700 text-lg leading-relaxed">{productDescription}</p>

      <div>
        {inStock ? (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-green-700 font-semibold">In Stock ({stockCount} available)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-red-700 font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Quantity</span>
          <div className="inline-flex items-center rounded border border-gray-300 overflow-hidden">
            <button onClick={() => onQuantityChange(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-gray-100">−</button>
            <input type="number" min={1} value={quantity} onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value || "1")))} className="w-14 text-center py-2 outline-none" />
            <button onClick={() => onQuantityChange(quantity + 1)} className="px-3 py-2 hover:bg-gray-100">+</button>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          {actionButtons.map((btn, idx) => {
            const s = variantStyles(btn.variant, priceColor);
            return (
              <button
                key={idx}
                style={{ backgroundColor: s.bg, color: s.text, border: s.border }}
                className="flex-1 min-w-[160px] py-3 px-6 rounded-lg font-semibold text-lg hover:opacity-90 transition"
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
