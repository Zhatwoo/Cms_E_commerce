"use client";

import React, { useState } from "react";
import { useNode } from "@craftjs/core";
import type { ProductListingProps } from "./ProductListing";

export const ProductListingSettings: React.FC = () => {
  const {
    title,
    subtitle,
    columns,
    gap,
    backgroundColor,
    titleColor,
    priceColor,
    buttonVariant,
    cardBorderRadius,
    showDescription,
    cardShadow,
    products,
    cardHeight,
    imageHeight,
    actions: { setProp },
  } = useNode((node) => ({
    title: node.data.props.title,
    subtitle: node.data.props.subtitle,
    columns: node.data.props.columns,
    gap: node.data.props.gap,
    backgroundColor: node.data.props.backgroundColor,
    titleColor: node.data.props.titleColor,
    priceColor: node.data.props.priceColor,
    buttonVariant: node.data.props.buttonVariant,
    cardBorderRadius: node.data.props.cardBorderRadius,
    showDescription: node.data.props.showDescription,
    cardShadow: node.data.props.cardShadow,
    products: node.data.props.products,
    cardHeight: node.data.props.cardHeight,
    imageHeight: node.data.props.imageHeight,
  }));

  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const handleProductChange = (productId: string, field: string, value: any) => {
    setProp((props: ProductListingProps) => {
      if (props.products) {
        const updatedProducts = props.products.map((p) =>
          p.id === productId ? { ...p, [field]: value } : p
        );
        props.products = updatedProducts;
      }
    });
  };

  const handleAddProduct = () => {
    setProp((props: ProductListingProps) => {
      if (props.products) {
        const newProduct = {
          id: `product-${Date.now()}`,
          name: "New Product",
          price: 0,
          image: "https://placehold.co/300x300/999999/ffffff?text=New+Product",
          description: "Product description",
        };
        props.products = [...props.products, newProduct];
      }
    });
    setShowAddProduct(false);
  };

  const handleDeleteProduct = (productId: string) => {
    setProp((props: ProductListingProps) => {
      if (props.products) {
        props.products = props.products.filter((p) => p.id !== productId);
      }
    });
    // Clear the expanded product if it was deleted
    if (expandedProduct === productId) {
      setExpandedProduct(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={title || "Our Products"}
          onChange={(e) => setProp((props: ProductListingProps) => {
            props.title = e.target.value;
          })}
          className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Subtitle
        </label>
        <input
          type="text"
          value={subtitle || "Browse our collection"}
          onChange={(e) => setProp((props: ProductListingProps) => {
            props.subtitle = e.target.value;
          })}
          className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Products Section */}
      <div className="border-t border-brand-medium/30 pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider">
            Products
          </label>
          <button
            onClick={handleAddProduct}
            className="text-xs px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded border border-blue-500/30 transition-colors"
          >
            + Add
          </button>
        </div>

        {/* Products List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {products && products.length > 0 ? (
            products.map((product: any) => (
              <div
                key={product.id}
                className="bg-brand-medium/10 border border-brand-medium/20 rounded-lg p-3"
              >
                <button
                  onClick={() =>
                    setExpandedProduct(
                      expandedProduct === product.id ? null : product.id
                    )
                  }
                  className="w-full flex items-center justify-between text-left mb-2"
                >
                  <span className="text-xs font-semibold text-brand-lighter truncate">
                    {product.name || "Unnamed Product"}
                  </span>
                  <span
                    className="text-xs text-brand-medium transition-transform"
                    style={{
                      transform:
                        expandedProduct === product.id ? "rotate(180deg)" : "",
                    }}
                  >
                    ▼
                  </span>
                </button>

                {/* Expanded Product Details */}
                {expandedProduct === product.id && (
                  <div className="space-y-2 border-t border-brand-medium/20 pt-2">
                    {/* Product Name */}
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-medium uppercase tracking-wider mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) =>
                          handleProductChange(product.id, "name", e.target.value)
                        }
                        className="w-full px-2 py-1 bg-brand-medium/20 border border-brand-medium/30 rounded text-xs text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Product Price */}
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-medium uppercase tracking-wider mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) =>
                          handleProductChange(
                            product.id,
                            "price",
                            parseFloat(e.target.value)
                          )
                        }
                        step="0.01"
                        min="0"
                        className="w-full px-2 py-1 bg-brand-medium/20 border border-brand-medium/30 rounded text-xs text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Product Image */}
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-medium uppercase tracking-wider mb-1">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={product.image}
                        onChange={(e) =>
                          handleProductChange(product.id, "image", e.target.value)
                        }
                        className="w-full px-2 py-1 bg-brand-medium/20 border border-brand-medium/30 rounded text-xs text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-20 object-cover rounded mt-1 border border-brand-medium/20"
                        />
                      )}
                    </div>

                    {/* Product Description */}
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-medium uppercase tracking-wider mb-1">
                        Description
                      </label>
                      <textarea
                        value={product.description || ""}
                        onChange={(e) =>
                          handleProductChange(
                            product.id,
                            "description",
                            e.target.value
                          )
                        }
                        rows={2}
                        className="w-full px-2 py-1 bg-brand-medium/20 border border-brand-medium/30 rounded text-xs text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="w-full text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/30 transition-colors"
                    >
                      Delete Product
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-brand-medium text-center py-2">
              No products added
            </p>
          )}
        </div>
      </div>

      {/* Grid Settings Divider */}
      <div className="border-t border-brand-medium/30 pt-4">
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Grid Settings
        </label>

        {/* Grid Columns */}
        <div>
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Grid Columns
          </label>
          <select
            value={columns || 3}
            onChange={(e) => setProp((props: ProductListingProps) => {
              props.columns = parseInt(e.target.value) as 1 | 2 | 3 | 4;
            })}
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1 Column</option>
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
            <option value={4}>4 Columns</option>
          </select>
        </div>

        {/* Gap */}
        <div className="mt-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Column Gap (px)
          </label>
          <input
            type="number"
            value={gap || 24}
            onChange={(e) => setProp((props: ProductListingProps) => {
              props.gap = parseInt(e.target.value);
            })}
            min="0"
            max="100"
            step="4"
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Style Settings Divider */}
      <div className="border-t border-brand-medium/30 pt-4">
        <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
          Style Settings
        </label>

        {/* Background Color */}
        <div>
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Background Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={backgroundColor || "#ffffff"}
              onChange={(e) => setProp((props: ProductListingProps) => {
                props.backgroundColor = e.target.value;
              })}
              className="w-12 h-10 bg-brand-medium/20 border border-brand-medium/30 rounded cursor-pointer"
            />
            <input
              type="text"
              value={backgroundColor || "#ffffff"}
              onChange={(e) => setProp((props: ProductListingProps) => {
                props.backgroundColor = e.target.value;
              })}
              className="flex-1 px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Title Color */}
        <div className="mt-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Title Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={titleColor || "#1e293b"}
              onChange={(e) => setProp((props: ProductListingProps) => {
                props.titleColor = e.target.value;
              })}
              className="w-12 h-10 bg-brand-medium/20 border border-brand-medium/30 rounded cursor-pointer"
            />
            <input
              type="text"
              value={titleColor || "#1e293b"}
              onChange={(e) => setProp((props: ProductListingProps) => {
                props.titleColor = e.target.value;
              })}
              className="flex-1 px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Price Color */}
        <div className="mt-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Price Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={priceColor || "#3b82f6"}
              onChange={(e) => setProp((props: ProductListingProps) => {
                props.priceColor = e.target.value;
              })}
              className="w-12 h-10 bg-brand-medium/20 border border-brand-medium/30 rounded cursor-pointer"
            />
            <input
              type="text"
              value={priceColor || "#3b82f6"}
              onChange={(e) => setProp((props: ProductListingProps) => {
                props.priceColor = e.target.value;
              })}
              className="flex-1 px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Button Variant */}
        <div className="mt-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Button Style
          </label>
          <select
            value={buttonVariant || "primary"}
            onChange={(e) => setProp((props: ProductListingProps) => {
              props.buttonVariant = e.target.value as "primary" | "secondary" | "outline";
            })}
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
          </select>
        </div>

        {/* Card Border Radius */}
        <div className="mt-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Card Border Radius (px)
          </label>
          <input
            type="number"
            value={cardBorderRadius || 12}
            onChange={(e) => setProp((props: ProductListingProps) => {
              props.cardBorderRadius = parseInt(e.target.value);
            })}
            min="0"
            max="50"
            step="2"
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Card Height */}
        <div className="mt-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Card Height (px)
          </label>
          <input
            type="number"
            value={typeof cardHeight === "number" ? cardHeight : ""}
            onChange={(e) => setProp((props: ProductListingProps) => {
              const val = e.target.value ? parseInt(e.target.value) : 0;
              props.cardHeight = val === 0 ? "auto" : val;
            })}
            min="100"
            max="800"
            step="10"
            placeholder="Leave empty for auto"
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[10px] text-brand-medium mt-1">Empty = auto height</p>
        </div>

        {/* Image Height */}
        <div className="mt-2">
          <label className="block text-xs font-semibold text-brand-medium uppercase tracking-wider mb-2">
            Image Height (px)
          </label>
          <input
            type="number"
            value={imageHeight || 256}
            onChange={(e) => setProp((props: ProductListingProps) => {
              props.imageHeight = parseInt(e.target.value);
            })}
            min="100"
            max="600"
            step="10"
            className="w-full px-3 py-2 bg-brand-medium/20 border border-brand-medium/30 rounded-lg text-sm text-brand-lighter focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Show Description */}
        <div className="mt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDescription !== false}
              onChange={(e) => setProp((props: ProductListingProps) => {
                props.showDescription = e.target.checked;
              })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-xs font-semibold text-brand-medium uppercase tracking-wider">
              Show Descriptions
            </span>
          </label>
        </div>

        {/* Card Shadow */}
        <div className="mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={cardShadow !== false}
              onChange={(e) => setProp((props: ProductListingProps) => {
                props.cardShadow = e.target.checked;
              })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-xs font-semibold text-brand-medium uppercase tracking-wider">
              Show Shadows
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
