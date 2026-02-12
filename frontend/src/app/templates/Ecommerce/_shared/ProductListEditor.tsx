"use client";

import React, { useState } from "react";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

interface ProductListEditorProps {
  products: Product[];
  onChange: (products: Product[]) => void;
}

/** Expandable list editor for managing products in a listing */
export const ProductListEditor: React.FC<ProductListEditorProps> = ({ products, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateProduct = (id: string, field: string, value: any) => {
    onChange(products.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const addProduct = () => {
    onChange([
      ...products,
      {
        id: `product-${Date.now()}`,
        name: "New Product",
        price: 0,
        image: "https://placehold.co/300x300/999999/ffffff?text=New+Product",
        description: "Product description",
      },
    ]);
  };

  const deleteProduct = (id: string) => {
    onChange(products.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-brand-lighter">Manage products</span>
        <button onClick={addProduct} className="text-[10px] px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded border border-blue-500/30">
          + Add
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="bg-brand-medium/10 border border-brand-medium/20 rounded-lg p-2">
              <button
                onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-[11px] text-brand-lighter truncate">{product.name || "Unnamed Product"}</span>
                <span className="text-[10px] text-brand-medium">{expandedId === product.id ? "−" : "+"}</span>
              </button>
              {expandedId === product.id && (
                <div className="mt-2 space-y-2 border-t border-brand-medium/20 pt-2">
                  <div>
                    <label className="text-[10px] text-brand-lighter">Name</label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                      className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-lighter">Price</label>
                    <NumericInput value={product.price ?? 0} onChange={(val) => updateProduct(product.id, "price", val ?? 0)} min={0} step={0.01} />
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-lighter">Image URL</label>
                    <input
                      type="text"
                      value={product.image}
                      onChange={(e) => updateProduct(product.id, "image", e.target.value)}
                      className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
                    />
                    {product.image && (
                      <img src={product.image} alt={product.name} className="w-full h-20 object-cover rounded mt-1 border border-brand-medium/20" />
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-lighter">Description</label>
                    <textarea
                      value={product.description || ""}
                      onChange={(e) => updateProduct(product.id, "description", e.target.value)}
                      rows={2}
                      className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none resize-none"
                    />
                  </div>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="w-full text-[10px] px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/30"
                  >
                    Delete Product
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-[11px] text-brand-medium text-center py-2">No products added</p>
        )}
      </div>
    </>
  );
};
