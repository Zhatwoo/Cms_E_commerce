"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import type { ProductDetailsProps } from "../_shared/types";
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";
import { GalleryImageEditor } from "../_shared/GalleryImageEditor";
import { ActionButtonListEditor } from "../_shared/ActionButtonListEditor";

export const ProductDetailsSettings: React.FC = () => {
  const {
    productName,
    productPrice,
    discountPrice,
    productImage,
    galleryImages,
    productDescription,
    fullDescription,
    specifications,
    reviewsEnabled,
    productRating,
    productReviews,
    inStock,
    stockCount,
    showRating,
    imageHeight,
    layoutMode,
    maxGalleryImages,
    actionButtons,
    actions: { setProp },
  } = useNode((node) => ({
    productName: node.data.props.productName,
    productPrice: node.data.props.productPrice,
    discountPrice: node.data.props.discountPrice,
    productImage: node.data.props.productImage,
    galleryImages: node.data.props.galleryImages,
    productDescription: node.data.props.productDescription,
    fullDescription: node.data.props.fullDescription,
    specifications: node.data.props.specifications,
    reviewsEnabled: node.data.props.reviewsEnabled,
    productRating: node.data.props.productRating,
    productReviews: node.data.props.productReviews,
    inStock: node.data.props.inStock,
    stockCount: node.data.props.stockCount,
    showRating: node.data.props.showRating,
    imageHeight: node.data.props.imageHeight,
    layoutMode: node.data.props.layoutMode,
    maxGalleryImages: node.data.props.maxGalleryImages,
    actionButtons: node.data.props.actionButtons,
  }));

  const set = <K extends keyof ProductDetailsProps>(key: K, val: ProductDetailsProps[K]) =>
    setProp((p: ProductDetailsProps) => { (p as any)[key] = val; });

  const textInput = (label: string, value: string, key: keyof ProductDetailsProps) => (
    <div>
      <label className="text-[10px] text-brand-lighter">{label}</label>
      <input type="text" value={value} onChange={(e) => set(key, e.target.value as any)}
        className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none" />
    </div>
  );

  const textArea = (label: string, value: string, key: keyof ProductDetailsProps, rows = 3) => (
    <div>
      <label className="text-[10px] text-brand-lighter">{label}</label>
      <textarea value={value} onChange={(e) => set(key, e.target.value as any)} rows={rows}
        className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none resize-none" />
    </div>
  );

  const checkbox = (label: string, checked: boolean, key: keyof ProductDetailsProps) => (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => set(key, e.target.checked as any)} className="w-4 h-4 rounded cursor-pointer" />
      <span className="text-[10px] text-brand-lighter">{label}</span>
    </label>
  );

  return (
    <div className="flex flex-col gap-3 pb-4">
      <DesignSection title="Basics">
        <div className="flex flex-col gap-3">
          {textInput("Product Name", productName || "", "productName")}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-brand-lighter">Price</label>
              <NumericInput value={productPrice ?? 0} onChange={(val) => set("productPrice", val)} min={0} step={0.01} />
            </div>
            <div>
              <label className="text-[10px] text-brand-lighter">Discount Price</label>
              <NumericInput value={discountPrice ?? 0} onChange={(val) => set("discountPrice", val === null ? null : val)} min={0} step={0.01} />
            </div>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Media">
        <div className="flex flex-col gap-3">
          {textInput("Main Image URL", productImage || "", "productImage")}
          <GalleryImageEditor
            images={galleryImages || []}
            maxVisible={maxGalleryImages ?? 5}
            onImagesChange={(imgs) => set("galleryImages", imgs)}
            onMaxVisibleChange={(max) => set("maxGalleryImages", max)}
          />
        </div>
      </DesignSection>

      <DesignSection title="Content">
        <div className="flex flex-col gap-3">
          {textArea("Short Description", productDescription || "", "productDescription")}
          {textArea("Full Description", fullDescription || "", "fullDescription", 4)}
          {textArea("Specifications", specifications || "", "specifications")}
        </div>
      </DesignSection>

      <DesignSection title="Ratings & Stock">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-brand-lighter">Rating (0-5)</label>
              <NumericInput value={productRating ?? 0} onChange={(val) => set("productRating", val)} min={0} max={5} step={0.1} />
            </div>
            <div>
              <label className="text-[10px] text-brand-lighter">Reviews Count</label>
              <NumericInput value={productReviews ?? 0} onChange={(val) => set("productReviews", Math.max(0, Math.floor(val ?? 0)))} min={0} step={1} />
            </div>
          </div>
          {checkbox("Enable Reviews Tab", reviewsEnabled !== false, "reviewsEnabled")}
          {checkbox("In Stock", inStock, "inStock")}
          {inStock && (
            <div>
              <label className="text-[10px] text-brand-lighter">Stock Count</label>
              <NumericInput value={stockCount ?? 0} onChange={(val) => set("stockCount", Math.max(0, Math.floor(val ?? 0)))} min={0} step={1} />
            </div>
          )}
        </div>
      </DesignSection>

      <DesignSection title="Style" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-brand-lighter">Layout Mode</label>
            <select value={layoutMode || "grid"} onChange={(e) => set("layoutMode", e.target.value as "grid" | "stack")}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none">
              <option value="grid">Grid (Side by Side)</option>
              <option value="stack">Stack (Vertical)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Image Height (px)</label>
            <NumericInput value={imageHeight ?? 400} onChange={(val) => set("imageHeight", Math.max(200, Math.min(800, Math.floor(val ?? 400))))} min={200} max={800} step={10} />
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Visible Thumbnails</label>
            <NumericInput value={maxGalleryImages ?? 5} onChange={(val) => set("maxGalleryImages", Math.max(0, Math.floor(val ?? 0)))} min={0} step={1} />
          </div>
          {checkbox("Show Rating", showRating !== false, "showRating")}
        </div>
      </DesignSection>

      <DesignSection title="Action Buttons">
        <ActionButtonListEditor
          buttons={actionButtons || []}
          onChange={(btns) => set("actionButtons", btns)}
        />
      </DesignSection>
    </div>
  );
};
