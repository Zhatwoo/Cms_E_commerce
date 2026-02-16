'use client';

import React from 'react';
import { useStorefront } from './StorefrontContext';

export type StorefrontProduct = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  images?: string[];
  status?: string;
};

export function StorefrontProducts({
  products,
  loading,
}: {
  products: StorefrontProduct[];
  loading: boolean;
}) {
  const { addToCart } = useStorefront();

  if (loading) {
    return (
      <section id="products" className="bg-white py-12 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-zinc-800 mb-6">Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-200 bg-zinc-50 h-64 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section id="products" className="bg-white py-12 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-zinc-800 mb-6">Products</h2>
          <p className="text-zinc-500">No products yet. Check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="bg-white py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-zinc-800 mb-6">Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const imageUrl =
              product.images?.[0] ||
              'https://placehold.co/400x300/f1f5f9/64748b?text=Product';
            const price = typeof product.price === 'number' ? product.price : 0;
            return (
              <div
                key={product.id}
                className="rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-zinc-100 relative">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-zinc-900 mb-1">{product.name}</h3>
                  <p className="text-lg font-bold text-blue-600 mb-2">
                    ${price.toFixed(2)}
                  </p>
                  {product.description && (
                    <p className="text-sm text-zinc-500 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price,
                        image: product.images?.[0],
                      })
                    }
                    className="w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
