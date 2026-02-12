"use client";

import React from "react";

interface ProductImageGalleryProps {
  selectedImage: string;
  productImage: string;
  productName: string;
  imageHeight: number;
  galleryImages: string[];
  maxGalleryImages: number;
  onSelectImage: (img: string) => void;
}

/** Image gallery with main view and thumbnail strip */
export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  selectedImage, productImage, productName, imageHeight,
  galleryImages, maxGalleryImages, onSelectImage,
}) => {
  const visibleGallery = (galleryImages || []).slice(0, Math.max(0, maxGalleryImages || 0));

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full bg-gray-100 rounded-lg overflow-hidden" style={{ height: `${imageHeight}px` }}>
        <img src={selectedImage || productImage} alt={productName} className="w-full h-full object-cover" />
      </div>
      {galleryImages && galleryImages.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {visibleGallery.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onSelectImage(img)}
              className={`relative h-20 rounded overflow-hidden border ${selectedImage === img ? "border-blue-500" : "border-transparent"}`}
              aria-label={`Thumbnail ${idx + 1}`}
            >
              <img src={img} alt={`thumb-${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
