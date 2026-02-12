"use client";

import React from "react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
  };
  imageHeight: number;
  cardBorderRadius: number;
  cardShadow: boolean;
  cardHeight: number | "auto";
  showDescription: boolean;
  priceColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  buttonVariant: "primary" | "secondary" | "outline";
}

/** Single product card for the listing grid */
export const ProductCard: React.FC<ProductCardProps> = ({
  product, imageHeight, cardBorderRadius, cardShadow, cardHeight,
  showDescription, priceColor, buttonBgColor, buttonTextColor, buttonVariant,
}) => (
  <div
    className="flex flex-col overflow-hidden"
    style={{
      borderRadius: `${cardBorderRadius}px`,
      backgroundColor: "#ffffff",
      height: cardHeight === "auto" ? "auto" : `${cardHeight}px`,
      boxShadow: cardShadow ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
    }}
  >
    <div className="w-full bg-gray-100" style={{ height: `${imageHeight}px` }}>
      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
    </div>

    <div className="flex-1 flex flex-col p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>

      {showDescription && product.description && (
        <p className="text-gray-600 text-sm mb-3 flex-1">{product.description}</p>
      )}

      <span style={{ color: priceColor }} className="text-xl font-bold mb-3">
        ${product.price.toFixed(2)}
      </span>

      <button
        style={{
          backgroundColor: buttonBgColor,
          color: buttonTextColor,
          border: buttonVariant === "outline" ? `2px solid ${priceColor}` : "none",
        }}
        className="w-full py-2 px-3 rounded font-medium text-sm hover:opacity-90"
      >
        Add to Cart
      </button>
    </div>
  </div>
);
