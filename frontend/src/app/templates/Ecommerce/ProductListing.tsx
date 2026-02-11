"use client";

import React, { useRef } from "react";
import { useNode } from "@craftjs/core";
import { ProductListingSettings } from "./ProductListingSettings";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

export interface ProductListingProps {
  title?: string;
  subtitle?: string;
  columns?: number;
  gap?: number;
  products?: Product[];
  backgroundColor?: string;
  titleColor?: string;
  priceColor?: string;
  buttonVariant?: "primary" | "secondary" | "outline";
  showDescription?: boolean;
  cardBorderRadius?: number;
  cardShadow?: boolean;
  cardHeight?: number | "auto";
  imageHeight?: number;
}

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Premium Product",
    price: 99.99,
    image: "https://placehold.co/300x300/3b82f6/ffffff?text=Product+1",
    description: "High-quality product with amazing features",
  },
  {
    id: "2",
    name: "Deluxe Package",
    price: 149.99,
    image: "https://placehold.co/300x300/10b981/ffffff?text=Product+2",
    description: "Everything you need for success",
  },
  {
    id: "3",
    name: "Standard Edition",
    price: 49.99,
    image: "https://placehold.co/300x300/f59e0b/ffffff?text=Product+3",
    description: "Great value for money",
  },
];

/**
 * ProductListing Component
 * A Craft.js compatible component for displaying product listings in a grid layout.
 * Can be customized with different column counts, styling, and product data.
 */
export const ProductListing: React.FC<ProductListingProps> = ({
  title = "Our Products",
  subtitle = "Browse our collection of premium products",
  columns = 3,
  gap = 24,
  products = defaultProducts,
  backgroundColor = "#ffffff",
  titleColor = "#1e293b",
  priceColor = "#3b82f6",
  buttonVariant = "primary",
  showDescription = true,
  cardBorderRadius = 12,
  cardShadow = true,
  cardHeight = "auto",
  imageHeight = 256,
}) => {
  const { connectors: { connect, drag } } = useNode();
  const containerRef = useRef<HTMLDivElement>(null);

  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[columns] || "grid-cols-3";

  const buttonBgColor = {
    primary: "#3b82f6",
    secondary: "#10b981",
    outline: "#ffffff",
  }[buttonVariant];

  const buttonTextColor = {
    primary: "#ffffff",
    secondary: "#ffffff",
    outline: "#3b82f6",
  }[buttonVariant];

  return (
    <div
      ref={(ref) => {
        if (ref) {
          containerRef.current = ref;
          connect(drag(ref));
        }
      }}
      className="w-full"
    >
      <section
        style={{ backgroundColor }}
        className="py-12 px-4"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2
              style={{ color: titleColor }}
              className="text-3xl font-bold mb-2"
            >
              {title}
            </h2>
            <p
              style={{ color: "#64748b" }}
              className="text-base"
            >
              {subtitle}
            </p>
          </div>

          {/* Products Grid */}
          <div
            className={`grid ${gridColsClass}`}
            style={{ gap: `${gap}px` }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden"
                style={{
                  borderRadius: `${cardBorderRadius}px`,
                  backgroundColor: "#ffffff",
                  height: cardHeight === "auto" ? "auto" : `${cardHeight}px`,
                  boxShadow: cardShadow ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {/* Product Image */}
                <div
                  className="w-full bg-gray-100"
                  style={{ height: `${imageHeight}px` }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {product.name}
                  </h3>

                  {showDescription && product.description && (
                    <p className="text-gray-600 text-sm mb-3 flex-1">
                      {product.description}
                    </p>
                  )}

                  {/* Price */}
                  <span
                    style={{ color: priceColor }}
                    className="text-xl font-bold mb-3"
                  >
                    ${product.price.toFixed(2)}
                  </span>

                  {/* Button */}
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductListing;

// Craft.js Configuration
(ProductListing as any).craft = {
  displayName: "Product Listing",
  props: {
    title: "Our Products",
    subtitle: "Browse our collection of premium products",
    columns: 3,
    gap: 24,
    products: defaultProducts,
    backgroundColor: "#ffffff",
    titleColor: "#1e293b",
    priceColor: "#3b82f6",
    buttonVariant: "primary" as const,
    showDescription: true,
    cardBorderRadius: 12,
    cardShadow: true,
    cardHeight: "auto",
    imageHeight: 256,
  },
  related: {
    settings: ProductListingSettings,
  },
  rules: {
    canDrag: () => true,
    canDrop: (_targetNode: any) => {
      // Allow dropping ProductListing anywhere on canvas
      return true;
    },
    canMoveIn: () => false,
    canMoveOut: () => true,
    canDelete: () => true,
  },
};
