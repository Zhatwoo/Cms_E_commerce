"use client";

import React from "react";
import type { CartItem } from "./types";

interface CartItemRowProps {
  item: CartItem;
  showItemImage: boolean;
  showItemVariant: boolean;
  imageSize: number;
  titleColor: string;
  priceColor: string;
  labelColor: string;
  totalPriceColor: string;
  removeButtonColor: string;
  quantityButtonColor: string;
  borderColor: string;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item, showItemImage, showItemVariant, imageSize,
  titleColor, priceColor, labelColor, totalPriceColor,
  removeButtonColor, quantityButtonColor, borderColor,
}) => (
  <div className="flex flex-col md:grid md:grid-cols-12 gap-4 px-6 py-5 items-center">
    <div className="col-span-6 flex items-center gap-4 w-full">
      {showItemImage && (
        <div className="flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
          style={{ width: `${imageSize}px`, height: `${imageSize}px` }}>
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold truncate" style={{ color: titleColor }}>{item.name}</h3>
        {showItemVariant && item.variant && (
          <p className="text-xs mt-1" style={{ color: priceColor }}>{item.variant}</p>
        )}
        <p className="text-sm font-medium mt-1 md:hidden" style={{ color: labelColor }}>${item.price.toFixed(2)}</p>
        <button className="text-xs mt-2 hover:underline font-medium" style={{ color: removeButtonColor }}>Remove</button>
      </div>
    </div>
    <div className="col-span-2 hidden md:flex justify-center text-sm font-medium" style={{ color: labelColor }}>${item.price.toFixed(2)}</div>
    <div className="col-span-2 flex justify-center">
      <div className="inline-flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
        <button className="px-3 py-1.5 text-sm hover:opacity-70 transition-opacity" style={{ backgroundColor: quantityButtonColor, color: labelColor }}>−</button>
        <span className="px-4 py-1.5 text-sm font-medium min-w-[40px] text-center" style={{ color: titleColor }}>{item.quantity}</span>
        <button className="px-3 py-1.5 text-sm hover:opacity-70 transition-opacity" style={{ backgroundColor: quantityButtonColor, color: labelColor }}>+</button>
      </div>
    </div>
    <div className="col-span-2 text-right text-sm font-semibold" style={{ color: totalPriceColor }}>${(item.price * item.quantity).toFixed(2)}</div>
  </div>
);
