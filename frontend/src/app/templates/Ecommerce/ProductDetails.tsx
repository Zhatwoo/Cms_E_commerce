"use client";

import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { ProductDetailsSettings } from "./ProductDetailsSettings";

export interface ProductActionButton {
  label: string;
  variant: "primary" | "secondary" | "outline";
}

export interface ProductDetailsProps {
  productName?: string;
  productPrice?: number;
  discountPrice?: number | null;
  productImage?: string; // primary image (fallback)
  galleryImages?: string[]; // thumbnails/carousel images
  productDescription?: string; // short description
  fullDescription?: string; // long description for tabs
  specifications?: string; // specs/details for tabs
  reviewsEnabled?: boolean; // toggle reviews tab
  productRating?: number;
  productReviews?: number;
  inStock?: boolean;
  stockCount?: number;
  backgroundColor?: string;
  titleColor?: string;
  priceColor?: string;
  showRating?: boolean;
  imageHeight?: number;
  layoutMode?: "grid" | "stack";
  maxGalleryImages?: number; // limit visible thumbnails
  actionButtons?: ProductActionButton[]; // configurable buttons
}

/**
 * ProductDetails Component
 * A Craft.js compatible component for displaying detailed product information.
 * Now supports gallery thumbnails, purchase block, and tabs for description/specs/reviews.
 */
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
    { label: "♡ Wishlist", variant: "outline" },
  ],
}) => {
  const { connectors: { connect, drag } } = useNode();
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedImage, setSelectedImage] = useState<string>(galleryImages?.[0] || productImage);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");

  const variantStyles = (variant: ProductActionButton["variant"]) => {
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

  const layoutClass = layoutMode === "grid" ? "grid grid-cols-2 gap-8" : "flex flex-col gap-6";

  const displayPrice = discountPrice && discountPrice < productPrice ? (
    <div className="flex items-baseline gap-3">
      <span style={{ color: priceColor }} className="text-4xl font-bold">${discountPrice.toFixed(2)}</span>
      <span className="text-2xl text-gray-500 line-through">${productPrice.toFixed(2)}</span>
      <span className="text-sm text-green-600 font-semibold">Save ${(productPrice - discountPrice).toFixed(2)}</span>
    </div>
  ) : (
    <span style={{ color: priceColor }} className="text-4xl font-bold">${productPrice.toFixed(2)}</span>
  );

  const visibleGallery = (galleryImages || []).slice(0, Math.max(0, maxGalleryImages || 0));

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
      <div style={{ backgroundColor }} className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Product Container */}
          <div className={layoutClass}>
            {/* Image/Gallery Section */}
            <div className="flex flex-col gap-4">
              <div className="w-full bg-gray-100 rounded-lg overflow-hidden" style={{ height: `${imageHeight}px` }}>
                <img src={selectedImage || productImage} alt={productName} className="w-full h-full object-cover" />
              </div>
              {/* Thumbnails */}
              {galleryImages && galleryImages.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {visibleGallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative h-20 rounded overflow-hidden border ${selectedImage === img ? "border-blue-500" : "border-transparent"}`}
                      aria-label={`Thumbnail ${idx + 1}`}
                    >
                      <img src={img} alt={`thumb-${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="flex flex-col gap-6">
              {/* Title */}
              <div>
                <h1 style={{ color: titleColor }} className="text-4xl font-bold mb-2">{productName}</h1>
                {/* Rating */}
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

              {/* Price */}
              <div>{displayPrice}</div>

              {/* Short Description */}
              <p className="text-gray-700 text-lg leading-relaxed">{productDescription}</p>

              {/* Stock Status */}
              <div>
                {inStock ? (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-green-700 font-semibold">In Stock ({stockCount} available)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-red-700 font-semibold">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Purchase Block */}
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Quantity</span>
                  <div className="inline-flex items-center rounded border border-gray-300 overflow-hidden">
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-100">−</button>
                    <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || "1")))} className="w-14 text-center py-2 outline-none" />
                    <button onClick={() => setQuantity((q) => q + 1)} className="px-3 py-2 hover:bg-gray-100">+</button>
                  </div>
                </div>

                <div className="flex gap-4 flex-wrap">
                  {actionButtons.map((btn, idx) => {
                    const s = variantStyles(btn.variant);
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

              {/* Tabs / Sections */}
              <div className="pt-6">
                <div className="flex gap-4 border-b border-gray-200">
                  <button className={`py-2 px-3 -mb-px border-b-2 ${activeTab === "description" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600"}`} onClick={() => setActiveTab("description")}>Description</button>
                  <button className={`py-2 px-3 -mb-px border-b-2 ${activeTab === "specs" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600"}`} onClick={() => setActiveTab("specs")}>Specifications</button>
                  {reviewsEnabled && (<button className={`py-2 px-3 -mb-px border-b-2 ${activeTab === "reviews" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600"}`} onClick={() => setActiveTab("reviews")}>Reviews</button>)}
                </div>

                <div className="pt-4">
                  {activeTab === "description" && (
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-line text-gray-700">{fullDescription}</p>
                    </div>
                  )}
                  {activeTab === "specs" && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800">{specifications}</pre>
                    </div>
                  )}
                  {activeTab === "reviews" && reviewsEnabled && (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-gray-600">Average Rating: {productRating} / 5</p>
                      <p className="text-sm text-gray-600">Total Reviews: {productReviews}</p>
                      <div className="text-gray-500 text-sm">Reviews listing can be integrated later.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

// Craft.js Configuration
(ProductDetails as any).craft = {
  displayName: "Product Details",
  props: {
    productName: "Premium Wireless Headphones",
    productPrice: 199.99,
    discountPrice: 149.99,
    productImage: "https://placehold.co/500x500/3b82f6/ffffff?text=Product",
    galleryImages: [
      "https://placehold.co/500x500/3b82f6/ffffff?text=Image+1",
      "https://placehold.co/500x500/10b981/ffffff?text=Image+2",
      "https://placehold.co/500x500/f59e0b/ffffff?text=Image+3",
    ],
    productDescription:
      "High-quality audio experience with noise cancellation and 30-hour battery life.",
    fullDescription:
      "These premium wireless headphones deliver immersive sound, advanced ANC, and a comfortable fit for extended listening sessions.",
    specifications:
      "Driver: 40mm\nBluetooth: 5.3\nBattery: 30h\nCharge: USB-C\nWeight: 250g",
    reviewsEnabled: true,
    productRating: 4.5,
    productReviews: 128,
    inStock: true,
    stockCount: 25,
    backgroundColor: "#ffffff",
    titleColor: "#1e293b",
    priceColor: "#3b82f6",
    showRating: true,
    imageHeight: 400,
    layoutMode: "grid" as const,
    maxGalleryImages: 5,
    actionButtons: [
      { label: "Add to Cart", variant: "primary" },
      { label: "Buy Now", variant: "secondary" },
      { label: "♡ Wishlist", variant: "outline" },
    ],
  },
  related: {
    settings: ProductDetailsSettings,
  },
  rules: {
    canDrag: () => true,
    canDrop: (_targetNode: any) => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
    canDelete: () => true,
  },
};
