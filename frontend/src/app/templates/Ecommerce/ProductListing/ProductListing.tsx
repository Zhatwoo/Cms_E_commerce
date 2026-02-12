"use client";

import React, { useRef } from "react";
import { useNode } from "@craftjs/core";
import type { ProductListingProps } from "../_shared/types";
import { defaultListingProducts, productListingCraftProps, defaultCraftRulesWithDrop } from "../_shared";
import { ProductCard } from "../_shared/ProductCard";
import { ProductListingSettings } from "./ProductListingSettings";

export type { ProductListingProps };

export const ProductListing: React.FC<ProductListingProps> = ({
  title = "Our Products",
  subtitle = "Browse our collection of premium products",
  columns = 3,
  gap = 24,
  products = defaultListingProducts,
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

  const gridColsClass = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[columns] || "grid-cols-3";
  const buttonBgColor = { primary: "#3b82f6", secondary: "#10b981", outline: "#ffffff" }[buttonVariant];
  const buttonTextColor = { primary: "#ffffff", secondary: "#ffffff", outline: "#3b82f6" }[buttonVariant];

  return (
    <div ref={(ref) => { if (ref) { containerRef.current = ref; connect(drag(ref)); } }} className="w-full">
      <section style={{ backgroundColor }} className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 style={{ color: titleColor }} className="text-3xl font-bold mb-2">{title}</h2>
            <p style={{ color: "#64748b" }} className="text-base">{subtitle}</p>
          </div>

          {/* Products Grid */}
          <div className={`grid ${gridColsClass}`} style={{ gap: `${gap}px` }}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                imageHeight={imageHeight}
                cardBorderRadius={cardBorderRadius}
                cardShadow={cardShadow}
                cardHeight={cardHeight}
                showDescription={showDescription}
                priceColor={priceColor}
                buttonBgColor={buttonBgColor}
                buttonTextColor={buttonTextColor}
                buttonVariant={buttonVariant}
              />
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
  props: productListingCraftProps,
  related: { settings: ProductListingSettings },
  rules: defaultCraftRulesWithDrop,
};
