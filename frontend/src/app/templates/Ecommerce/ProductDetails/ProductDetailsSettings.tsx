"use client";

import React, { useState } from "react";
import { useNode } from "@craftjs/core";
import type { ProductDetailsProps } from "./ProductDetails";
// Use shared settings UI components
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";
import { ColorInput } from "../../../design/_components/rightPanel/settings/inputs/ColorInput";
import { Upload } from "lucide-react";

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
    sku,
    inStock,
    stockCount,
    backgroundColor,
    titleColor,
    priceColor,
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
    sku: node.data.props.sku,
    inStock: node.data.props.inStock,
    stockCount: node.data.props.stockCount,
    backgroundColor: node.data.props.backgroundColor,
    titleColor: node.data.props.titleColor,
    priceColor: node.data.props.priceColor,
    showRating: node.data.props.showRating,
    imageHeight: node.data.props.imageHeight,
    layoutMode: node.data.props.layoutMode,
    maxGalleryImages: node.data.props.maxGalleryImages,
    actionButtons: node.data.props.actionButtons,
  }));

  const [newGalleryImage, setNewGalleryImage] = useState("");

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Basics */}
      <DesignSection title="Basics">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-brand-lighter">Product Name</label>
            <input
              type="text"
              value={productName || ""}
              onChange={(e) =>
                setProp((props: ProductDetailsProps) => { props.productName = e.target.value; })
              }
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-brand-lighter">Price</label>
              <NumericInput
                value={productPrice ?? 0}
                onChange={(val) =>
                  setProp((props: ProductDetailsProps) => {
                    const safe = val ?? 0;
                    const rounded = Math.round(safe * 100) / 100;
                    props.productPrice = rounded;
                  })
                }
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="text-[10px] text-brand-lighter">Discount Price</label>
              <NumericInput
                value={discountPrice ?? 0}
                onChange={(val) =>
                  setProp((props: ProductDetailsProps) => {
                    if (val === null) {
                      props.discountPrice = null;
                      return;
                    }
                    const rounded = Math.round(val * 100) / 100;
                    props.discountPrice = rounded;
                  })
                }
                min={0}
                step={0.01}
              />
            </div>
          </div>
        </div>
      </DesignSection>

      {/* Media */}
      <DesignSection title="Media">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-brand-lighter">Main Image URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={productImage || ""}
                onChange={(e) => setProp((props: ProductDetailsProps) => { props.productImage = e.target.value; })}
                className="flex-1 bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
              />
              <label
                className="p-1.5 bg-brand-medium/30 hover:bg-brand-medium/50 text-brand-light rounded border border-brand-medium/40 cursor-pointer inline-flex items-center justify-center"
                title="Upload image"
              >
                <Upload className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/")) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const dataUrl = event.target?.result as string;
                      setProp((props: ProductDetailsProps) => { props.productImage = dataUrl; });
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
          {/* Gallery URL input + thumbnails remain, compact spacing */}
          <div>
            <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
              Gallery Images
            </label>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="flex-1 flex gap-2 min-w-0">
                <input
                  type="text"
                  placeholder="https://..."
                  value={newGalleryImage}
                  onChange={(e) => setNewGalleryImage(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500 break-all"
                />
                <button
                  onClick={() => {
                    if (!newGalleryImage.trim()) return;
                    setProp((props: ProductDetailsProps) => {
                      const imgs = Array.isArray(props.galleryImages)
                        ? props.galleryImages
                        : [];
                      props.galleryImages = [...imgs, newGalleryImage.trim()];
                    });
                    setNewGalleryImage("");
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Thumbnails directly below URL input */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-2">
              {(galleryImages || []).map((img: string, idx: number) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt={`gallery-${idx + 1}`}
                    className="w-full h-16 object-cover rounded border border-brand-medium/20"
                  />
                  <button
                    onClick={() =>
                      setProp((props: ProductDetailsProps) => {
                        const imgs = (props.galleryImages || []).slice();
                        imgs.splice(idx, 1);
                        props.galleryImages = imgs;
                      })
                    }
                    className="absolute top-1 right-1 bg-red-600 text-white rounded px-2 py-1 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Controls for how many thumbs to show */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-brand-medium">Show</span>
              <input
                type="number"
                min={0}
                value={maxGalleryImages ?? 5}
                onChange={(e) =>
                  setProp((props: ProductDetailsProps) => {
                    props.maxGalleryImages = parseInt(e.target.value || "0");
                  })
                }
                className="w-16 px-2 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
              <span className="text-xs text-brand-medium">thumbs</span>
            </div>
          </div>
        </div>
      </DesignSection>

      {/* Content */}
      <DesignSection title="Content">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-brand-lighter">Short Description</label>
            <textarea
              value={productDescription || ""}
              onChange={(e) => setProp((props: ProductDetailsProps) => { props.productDescription = e.target.value; })}
              rows={3}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Full Description</label>
            <textarea
              value={fullDescription || ""}
              onChange={(e) => setProp((props: ProductDetailsProps) => { props.fullDescription = e.target.value; })}
              rows={4}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Specifications</label>
            <textarea
              value={specifications || ""}
              onChange={(e) => setProp((props: ProductDetailsProps) => { props.specifications = e.target.value; })}
              rows={3}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>
        </div>
      </DesignSection>

      {/* Ratings & Stock */}
      <DesignSection title="Ratings & Stock">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-brand-lighter">Rating (0-5)</label>
              <NumericInput
                value={productRating ?? 0}
                onChange={(val) => setProp((props: ProductDetailsProps) => { props.productRating = val; })}
                min={0}
                max={5}
                step={0.1}
              />
            </div>
            <div>
              <label className="text-[10px] text-brand-lighter">Reviews Count</label>
              <NumericInput
                value={productReviews ?? 0}
                onChange={(val) => setProp((props: ProductDetailsProps) => { props.productReviews = Math.max(0, Math.floor(val ?? 0)); })}
                min={0}
                step={1}
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={reviewsEnabled !== false}
              onChange={(e) => setProp((props: ProductDetailsProps) => { props.reviewsEnabled = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Enable Reviews Tab</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setProp((props: ProductDetailsProps) => { props.inStock = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">In Stock</span>
          </label>
          {inStock && (
            <div>
              <label className="text-[10px] text-brand-lighter">Stock Count</label>
              <NumericInput
                value={stockCount ?? 0}
                onChange={(val) => setProp((props: ProductDetailsProps) => { props.stockCount = Math.max(0, Math.floor(val ?? 0)); })}
                min={0}
                step={1}
              />
            </div>
          )}
        </div>
      </DesignSection>

      {/* Style */}
      <DesignSection title="Style" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-brand-lighter">Layout Mode</label>
            <select
              value={layoutMode || "grid"}
              onChange={(e) => setProp((props: ProductDetailsProps) => { props.layoutMode = e.target.value as "grid" | "stack"; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            >
              <option value="grid">Grid (Side by Side)</option>
              <option value="stack">Stack (Vertical)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Image Height (px)</label>
            <NumericInput
              value={imageHeight ?? 400}
              onChange={(val) => setProp((props: ProductDetailsProps) => { props.imageHeight = Math.max(200, Math.min(800, Math.floor(val ?? 400))); })}
              min={200}
              max={800}
              step={10}
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Visible Thumbnails</label>
            <NumericInput
              value={maxGalleryImages ?? 5}
              onChange={(val) => setProp((props: ProductDetailsProps) => { props.maxGalleryImages = Math.max(0, Math.floor(val ?? 0)); })}
              min={0}
              step={1}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showRating !== false}
              onChange={(e) => setProp((props: ProductDetailsProps) => { props.showRating = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Show Rating</span>
          </label>
        </div>
      </DesignSection>

      {/* Actions */}
      <DesignSection title="Action Buttons">
        {/* keep existing dynamic list; compact controls remain */}
        <div className="flex flex-col gap-3">
          {(actionButtons || []).length === 0 && (
            <div className="text-xs text-brand-medium bg-brand-medium/10 border border-brand-medium/20 rounded px-3 py-2">
              No buttons yet. Click "Add Button" to create one.
            </div>
          )}

          {/* More compact list */}
          <div className="flex flex-col gap-2">
            {(actionButtons || []).map(
              (btn: { label: string; variant: "primary" | "secondary" | "outline" }, idx: number) => (
                <div key={idx} className="rounded-lg border border-brand-medium/30 bg-brand-medium/5 p-2">
                  {/* Row 1: Label full-width */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={btn.label}
                      onChange={(e) =>
                        setProp((props: any) => {
                          const list = [...(props.actionButtons || [])];
                          list[idx] = { ...list[idx], label: e.target.value };
                          props.actionButtons = list;
                        })
                      }
                      placeholder="Button label"
                      className="flex-1 px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter"
                    />
                  </div>

                  {/* Row 2: Variant dropdown + controls grouped at right */}
                  <div className="mt-2 flex items-center gap-2">
                    {/* Variant group like ButtonSettings */}
                    {(() => {
                      const variants: Array<"primary" | "secondary" | "outline"> = [
                        "primary",
                        "secondary",
                        "outline",
                      ];
                      return (
                        <div className="grid grid-cols-3 gap-1 bg-brand-dark/30 p-1 rounded-lg border border-brand-medium/20">
                          {variants.map((v) => (
                            <button
                              key={v}
                              onClick={() =>
                                setProp((p: any) => {
                                  const list = Array.isArray(p.actionButtons)
                                    ? [...p.actionButtons]
                                    : [];
                                  list[idx] = { ...list[idx], variant: v };
                                  p.actionButtons = list;
                                })
                              }
                              className={`text-[10px] py-1.5 rounded capitalize transition-colors ${
                                btn.variant === v
                                  ? "bg-brand-medium/50 text-brand-lighter"
                                  : "text-brand-light hover:text-brand-lighter"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="ml-auto flex items-center gap-1">
                      <button
                        title="Move up"
                        onClick={() =>
                          setProp((p: any) => {
                            const list = Array.isArray(p.actionButtons)
                              ? [...p.actionButtons]
                              : [];
                            if (idx > 0) {
                              const [cur] = list.splice(idx, 1);
                              list.splice(idx - 1, 0, cur);
                              p.actionButtons = list;
                            }
                          })
                        }
                        className="px-2 py-1 text-xs bg-brand-medium/20 hover:bg-brand-medium/30 rounded"
                      >↑</button>
                      <button
                        title="Move down"
                        onClick={() =>
                          setProp((p: any) => {
                            const list = Array.isArray(p.actionButtons)
                              ? [...p.actionButtons]
                              : [];
                            if (idx < list.length - 1) {
                              const [cur] = list.splice(idx, 1);
                              list.splice(idx + 1, 0, cur);
                              p.actionButtons = list;
                            }
                          })
                        }
                        className="px-2 py-1 text-xs bg-brand-medium/20 hover:bg-brand-medium/30 rounded"
                      >↓</button>
                      <button
                        title="Remove"
                        onClick={() =>
                          setProp((p: any) => {
                            const list = Array.isArray(p.actionButtons)
                              ? [...p.actionButtons]
                              : [];
                            list.splice(idx, 1);
                            p.actionButtons = list;
                          })
                        }
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                      >×</button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Add button row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setProp((props: any) => {
                  const list = Array.isArray(props.actionButtons) ? props.actionButtons : [];
                  props.actionButtons = [...list, { label: "New Button", variant: "primary" }];
                })
              }
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              Add Button
            </button>
            <span className="text-[11px] text-brand-medium">Use variants to style each button (primary, secondary, outline).</span>
          </div>
        </div>
      </DesignSection>
    </div>
  );
};
