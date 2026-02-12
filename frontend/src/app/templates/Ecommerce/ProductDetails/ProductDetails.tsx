"use client";

import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import type { ProductDetailsProps, ProductActionButton } from "../_shared/types";
import { productDetailsCraftProps, defaultCraftRulesWithDrop } from "../_shared";
import { ProductImageGallery } from "../_shared/ProductImageGallery";
import { ProductInfo } from "../_shared/ProductInfo";
import { ProductTabs } from "../_shared/ProductTabs";
import { ProductDetailsSettings } from "./ProductDetailsSettings";

export type { ProductDetailsProps, ProductActionButton };

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  productName = "Premium Wireless Headphones",
  productPrice = 199.99,
  discountPrice = 149.99,
  productImage = "https://placehold.co/500x500/3b82f6/ffffff?text=Product",
  galleryImages = [
    "https://placehold.co/500x500/3b82f6/ffffff?text=Image+1",
    "https://placehold.co/500x500/10b981/ffffff?text=Image+2",
    "https://placehold.co/500x500/f59e0b/ffffff?text=Image+3",
  ],
  productDescription = "High-quality audio experience with noise cancellation and 30-hour battery life.",
  fullDescription = "These premium wireless headphones deliver immersive sound, advanced ANC, and a comfortable fit for extended listening sessions.",
  specifications = "Driver: 40mm\nBluetooth: 5.3\nBattery: 30h\nCharge: USB-C\nWeight: 250g",
  reviewsEnabled = true,
  productRating = 4.5,
  productReviews = 128,
  inStock = true,
  stockCount = 25,
  backgroundColor = "#ffffff",
  titleColor = "#1e293b",
  priceColor = "#3b82f6",
  showRating = true,
  imageHeight = 400,
  layoutMode = "grid",
  maxGalleryImages = 5,
  actionButtons = [
    { label: "Add to Cart", variant: "primary" },
    { label: "Buy Now", variant: "secondary" },
    { label: "\u2661 Wishlist", variant: "outline" },
  ],
}) => {
  const { connectors: { connect, drag } } = useNode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string>(galleryImages?.[0] || productImage);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");

  const layoutClass = layoutMode === "grid" ? "grid grid-cols-2 gap-8" : "flex flex-col gap-6";

  return (
    <div ref={(ref) => { if (ref) { containerRef.current = ref; connect(drag(ref)); } }} className="w-full">
      <div style={{ backgroundColor }} className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className={layoutClass}>
            <ProductImageGallery
              selectedImage={selectedImage}
              productImage={productImage}
              productName={productName}
              imageHeight={imageHeight}
              galleryImages={galleryImages}
              maxGalleryImages={maxGalleryImages}
              onSelectImage={setSelectedImage}
            />

            <div className="flex flex-col gap-6">
              <ProductInfo
                productName={productName}
                productPrice={productPrice}
                discountPrice={discountPrice}
                productDescription={productDescription}
                productRating={productRating}
                productReviews={productReviews}
                showRating={showRating}
                inStock={inStock}
                stockCount={stockCount}
                titleColor={titleColor}
                priceColor={priceColor}
                quantity={quantity}
                onQuantityChange={setQuantity}
                actionButtons={actionButtons}
              />

              <ProductTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                fullDescription={fullDescription}
                specifications={specifications}
                reviewsEnabled={reviewsEnabled}
                productRating={productRating}
                productReviews={productReviews}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

(ProductDetails as any).craft = {
  displayName: "Product Details",
  props: productDetailsCraftProps,
  related: { settings: ProductDetailsSettings },
  rules: defaultCraftRulesWithDrop,
};
