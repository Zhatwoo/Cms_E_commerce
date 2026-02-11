"use client";

import React, { useState } from "react";
import { useNode } from "@craftjs/core";
import type { ProductDetailsProps } from "./ProductDetails";

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
    <div className="flex flex-col gap-4">
      {/* Product Name */}
      <div>
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Product Name
        </label>
        <input
          type="text"
          value={productName || ""}
          onChange={(e) =>
            setProp((props: ProductDetailsProps) => {
              props.productName = e.target.value;
            })
          }
          className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Product Price */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Price
          </label>
          <input
            type="number"
            value={productPrice || 0}
            onChange={(e) =>
              setProp((props: ProductDetailsProps) => {
                props.productPrice = parseFloat(e.target.value);
              })
            }
            step="0.01"
            min="0"
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Discount Price
          </label>
          <input
            type="number"
            value={discountPrice ?? 0}
            onChange={(e) =>
              setProp((props: ProductDetailsProps) => {
                const v = parseFloat(e.target.value);
                props.discountPrice = isNaN(v) ? null : v;
              })
            }
            step="0.01"
            min="0"
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Product Image */}
      <div>
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Main Image URL
        </label>
        <input
          type="text"
          value={productImage || ""}
          onChange={(e) =>
            setProp((props: ProductDetailsProps) => {
              props.productImage = e.target.value;
            })
          }
          className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        />
        {productImage && (
          <img
            src={productImage}
            alt="product"
            className="w-full h-40 object-cover rounded border border-brand-medium/20"
          />
        )}
      </div>

      {/* Gallery Images */}
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

      {/* Descriptions */}
      <div>
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Short Description
        </label>
        <textarea
          value={productDescription || ""}
          onChange={(e) =>
            setProp((props: ProductDetailsProps) => {
              props.productDescription = e.target.value;
            })
          }
          rows={3}
          className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Full Description
        </label>
        <textarea
          value={fullDescription || ""}
          onChange={(e) =>
            setProp((props: ProductDetailsProps) => {
              props.fullDescription = e.target.value;
            })
          }
          rows={5}
          className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Specifications
        </label>
        <textarea
          value={specifications || ""}
          onChange={(e) =>
            setProp((props: ProductDetailsProps) => {
              props.specifications = e.target.value;
            })
          }
          rows={4}
          className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-brand-medium/30 pt-4">
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Rating & Stock
        </label>

        {/* Product Rating */}
        <div className="mb-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Rating (0-5)
          </label>
          <input
            type="number"
            value={productRating || 0}
            onChange={(e) =>
              setProp((props: ProductDetailsProps) => {
                props.productRating = parseFloat(e.target.value);
              })
            }
            min="0"
            max="5"
            step="0.1"
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Product Reviews */}
        <div className="mb-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Number of Reviews
          </label>
          <input
            type="number"
            value={productReviews || 0}
            onChange={(e) =>
              setProp((props: ProductDetailsProps) => {
                props.productReviews = parseInt(e.target.value);
              })
            }
            min="0"
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Reviews Toggle */}
        <div className="mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reviewsEnabled !== false}
              onChange={(e) =>
                setProp((props: ProductDetailsProps) => {
                  props.reviewsEnabled = e.target.checked;
                })
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-xs font-semibold text-brand-medium uppercase tracking-wider">
              Enable Reviews Tab
            </span>
          </label>
        </div>

        {/* Stock Status */}
        <div className="mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) =>
                setProp((props: ProductDetailsProps) => {
                  props.inStock = e.target.checked;
                })
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-xs font-semibold text-brand-medium uppercase tracking-wider">
              In Stock
            </span>
          </label>
        </div>

        {/* Stock Count */}
        {inStock && (
          <div className="mb-2">
            <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
              Stock Count
            </label>
            <input
              type="number"
              value={stockCount || 0}
              onChange={(e) =>
                setProp((props: ProductDetailsProps) => {
                  props.stockCount = parseInt(e.target.value);
                })
              }
              min="0"
              className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Style Settings Divider */}
      <div className="border-t border-brand-medium/30 pt-4">
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Style Settings
        </label>

        {/* Background Color */}
        <div className="mb-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Background Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={backgroundColor || "#ffffff"}
              onChange={(e) =>
                setProp((props: ProductDetailsProps) => {
                  props.backgroundColor = e.target.value;
                })
              }
              className="w-12 h-10 bg-brand-medium/20 border border-brand-medium/30 rounded cursor-pointer"
            />
            <input
              type="text"
              value={backgroundColor || "#ffffff"}
              onChange={(e) =>
                setProp((props: ProductDetailsProps) => {
                  props.backgroundColor = e.target.value;
                })
              }
              className="flex-1 px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Title Color */}
        <div className="mb-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Title Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={titleColor || "#1e293b"}
              onChange={(e) =>
                setProp((props: ProductDetailsProps) => {
                  props.titleColor = e.target.value;
                })
              }
              className="w-12 h-10 bg-brand-medium/20 border border-brand-medium/30 rounded cursor-pointer"
            />
            <input
              type="text"
              value={titleColor || "#1e293b"}
              onChange={(e) =>
                setProp((props: ProductDetailsProps) => {
                  props.titleColor = e.target.value;
                })
              }
              className="flex-1 px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Price Color */}
        <div className="mb-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Price Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={priceColor || "#3b82f6"}
              onChange={(e) =>
                setProp((props: ProductDetailsProps) => {
                  props.priceColor = e.target.value;
                })
              }
              className="w-12 h-10 bg-brand-medium/20 border border-brand-medium/30 rounded cursor-pointer"
            />
            <input
              type="text"
              value={priceColor || "#3b82f6"}
              onChange={(e) =>
                setProp((props: ProductDetailsProps) => {
                  props.priceColor = e.target.value;
                })
              }
              className="flex-1 px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Image Height */}
        <div className="mb-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Image Height (px)
          </label>
          <input
            type="number"
            value={imageHeight || 400}
            onChange={(e) =>
              setProp((props: ProductDetailsProps) => {
                props.imageHeight = parseInt(e.target.value);
              })
            }
            min="200"
            max="800"
            step="10"
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Layout Mode */}
        <div className="mb-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Layout Mode
          </label>
          <select
            value={layoutMode || "grid"}
            onChange={(e) =>
              setProp((props: ProductDetailsProps) => {
                props.layoutMode = e.target.value as "grid" | "stack";
              })
            }
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="grid">Grid (Side by Side)</option>
            <option value="stack">Stack (Vertical)</option>
          </select>
        </div>

        {/* Show Rating */}
        <div className="mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showRating !== false}
              onChange={(e) =>
                setProp((props: ProductDetailsProps) => {
                  props.showRating = e.target.checked;
                })
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-xs font-semibold text-brand-medium uppercase tracking-wider">
              Show Rating
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-brand-medium/30 pt-4">
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Action Buttons
        </label>
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
                    <select
                      value={btn.variant}
                      onChange={(e) =>
                        setProp((props: any) => {
                          const list = [...(props.actionButtons || [])];
                          list[idx] = { ...list[idx], variant: e.target.value as "primary" | "secondary" | "outline" };
                          props.actionButtons = list;
                        })
                      }
                      className="px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter"
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="outline">Outline</option>
                    </select>

                    <div className="ml-auto flex items-center gap-1">
                      <button
                        title="Move up"
                        onClick={() =>
                          setProp((props: any) => {
                            const list = [...(props.actionButtons || [])];
                            if (idx > 0) {
                              const [cur] = list.splice(idx, 1);
                              list.splice(idx - 1, 0, cur);
                              props.actionButtons = list;
                            }
                          })
                        }
                        className="px-2 py-1 text-xs bg-brand-medium/20 hover:bg-brand-medium/30 rounded"
                      >↑</button>
                      <button
                        title="Move down"
                        onClick={() =>
                          setProp((props: any) => {
                            const list = [...(props.actionButtons || [])];
                            if (idx < list.length - 1) {
                              const [cur] = list.splice(idx, 1);
                              list.splice(idx + 1, 0, cur);
                              props.actionButtons = list;
                            }
                          })
                        }
                        className="px-2 py-1 text-xs bg-brand-medium/20 hover:bg-brand-medium/30 rounded"
                      >↓</button>
                      <button
                        title="Remove"
                        onClick={() =>
                          setProp((props: any) => {
                            const list = [...(props.actionButtons || [])];
                            list.splice(idx, 1);
                            props.actionButtons = list;
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
      </div>
    </div>
  );
};
