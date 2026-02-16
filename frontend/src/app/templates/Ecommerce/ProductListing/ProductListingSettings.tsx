"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNode } from "@craftjs/core";
import type { ProductListingProps } from "./ProductListing";
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";
import { ColorInput } from "../../../design/_components/rightPanel/settings/inputs/ColorInput";
import { Upload } from "lucide-react";

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
  const [newlyAddedProductId, setNewlyAddedProductId] = useState<string | null>(null);
  const previousProductsCountRef = useRef<number>(0);

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
    const newProductId = `product-${Date.now()}`;
    setNewlyAddedProductId(newProductId);
    
    setProp((props: ProductListingProps) => {
      const list = Array.isArray(props.products) ? props.products : [];
      const newProduct = {
        id: newProductId,
        name: "New Product",
        price: 0,
        image: "https://placehold.co/300x300/999999/ffffff?text=New+Product",
        description: "Product description",
      };
      props.products = [...list, newProduct];
    });

    // Clear the animation flag after animation completes
    setTimeout(() => {
      setNewlyAddedProductId(null);
    }, 500);
  };

  // Track product count changes to detect additions
  useEffect(() => {
    const currentCount = (products || []).length;
    if (currentCount > previousProductsCountRef.current && previousProductsCountRef.current > 0) {
      // A product was added (not initial load)
      const lastProduct = (products || [])[(products || []).length - 1];
      if (lastProduct) {
        setNewlyAddedProductId(lastProduct.id);
        setTimeout(() => {
          setNewlyAddedProductId(null);
        }, 500);
      }
    }
    previousProductsCountRef.current = currentCount;
  }, [products]);

  const handleDeleteProduct = (productId: string) => {
    setProp((props: ProductListingProps) => {
      if (props.products) {
        props.products = props.products.filter((p) => p.id !== productId);
      }
    });
    if (expandedProduct === productId) setExpandedProduct(null);
  };

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Basics */}
      <DesignSection title="Basics">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-brand-lighter">Section Title</label>
            <input
              type="text"
              value={title || "Our Products"}
              onChange={(e) => setProp((props: ProductListingProps) => { props.title = e.target.value; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Subtitle</label>
            <input
              type="text"
              value={subtitle || "Browse our collection"}
              onChange={(e) => setProp((props: ProductListingProps) => { props.subtitle = e.target.value; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>
        </div>
      </DesignSection>

      {/* Products */}
      <DesignSection title="Products">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-brand-lighter">Manage products</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddProduct}
              className="text-[10px] px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded border border-blue-500/30"
              type="button"
            >
              + Add
            </button>
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {(products || []).length > 0 ? (
            (products || []).map((product: any) => (
              <div 
                key={product.id} 
                className={`bg-brand-medium/10 border border-brand-medium/20 rounded-lg p-2 ${
                  newlyAddedProductId === product.id ? 'product-item-added' : ''
                }`}
              >
                <button
                  onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                  className="w-full flex items-center justify-between text-left transition-colors hover:bg-brand-medium/5 rounded px-1 py-1 -mx-1"
                >
                  <span className="text-[11px] text-brand-lighter truncate">{product.name || "Unnamed Product"}</span>
                  <span className={`text-[10px] text-brand-medium transition-transform duration-300 ${expandedProduct === product.id ? "rotate-180" : ""}`}>
                    {expandedProduct === product.id ? "−" : "+"}
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    expandedProduct === product.id
                      ? "max-h-[800px] opacity-100 mt-2"
                      : "max-h-0 opacity-0 mt-0"
                  }`}
                >
                  <div className="space-y-2 border-t border-brand-medium/20 pt-2">
                    <div>
                      <label className="text-[10px] text-brand-lighter">Name</label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleProductChange(product.id, "name", e.target.value)}
                        className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-lighter">Price</label>
                      <NumericInput
                        value={product.price ?? 0}
                        onChange={(val) => {
                          const safe = val ?? 0;
                          const rounded = Math.round(safe * 100) / 100;
                          handleProductChange(product.id, "price", rounded);
                        }}
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-lighter">Image URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={product.image}
                          onChange={(e) => handleProductChange(product.id, "image", e.target.value)}
                          className="flex-1 bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
                        />
                        <label className="p-1.5 bg-brand-medium/30 hover:bg-brand-medium/50 text-brand-light rounded border border-brand-medium/40 cursor-pointer inline-flex items-center justify-center"
                          title="Upload image">
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
                                handleProductChange(product.id, "image", dataUrl);
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      {product.image && (
                        <img src={product.image} alt={product.name} className="w-full h-20 object-cover rounded mt-1 border border-brand-medium/20" />
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-lighter">Description</label>
                      <textarea
                        value={product.description || ""}
                        onChange={(e) => handleProductChange(product.id, "description", e.target.value)}
                        rows={2}
                        className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none resize-none"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="w-full text-[10px] px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/30 transition-colors"
                    >Delete Product</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-brand-medium text-center py-2">No products added</p>
          )}
        </div>
      </DesignSection>

      {/* Grid */}
      <DesignSection title="Grid">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-brand-lighter">Columns</label>
            <select
              value={columns || 3}
              onChange={(e) => setProp((props: ProductListingProps) => { props.columns = parseInt(e.target.value) as 1 | 2 | 3 | 4; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Gap (px)</label>
            <NumericInput
              value={gap ?? 24}
              onChange={(val) => setProp((props: ProductListingProps) => { props.gap = Math.max(0, Math.floor(val ?? 0)); })}
              min={0}
              step={4}
            />
          </div>
        </div>
      </DesignSection>

      {/* Style */}
      <DesignSection title="Style" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-brand-lighter">Button Style</label>
            <select
              value={buttonVariant || "primary"}
              onChange={(e) => setProp((props: ProductListingProps) => { props.buttonVariant = e.target.value as "primary" | "secondary" | "outline"; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDescription !== false}
              onChange={(e) => setProp((props: ProductListingProps) => { props.showDescription = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Show Descriptions</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={cardShadow !== false}
              onChange={(e) => setProp((props: ProductListingProps) => { props.cardShadow = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Show Shadows</span>
          </label>
        </div>
      </DesignSection>
    </div>
  );
};
