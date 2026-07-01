'use client';

import React, { useEffect, useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { useStorefront } from './StorefrontContext';

export function CartFab() {
  const { cartCount, openCart, cartOpen, showAddToCartSuccess, setShowAddToCartSuccess, lastAddedProduct } = useStorefront();
  const [isBouncing, setIsBouncing] = useState(false);

  useEffect(() => {
    if (!showAddToCartSuccess) return;
    setIsBouncing(true);
    const bounceTimeout = window.setTimeout(() => setIsBouncing(false), 400);
    return () => window.clearTimeout(bounceTimeout);
  }, [showAddToCartSuccess]);

  return (
    <>
      {!cartOpen && (
        <button
          type="button"
          onClick={openCart}
          className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-black text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:bg-zinc-800 ${
            isBouncing ? 'scale-110' : 'scale-100'
          }`}
          aria-label={`Open cart (${cartCount} items)`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 border border-white text-[10px] font-bold flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </button>
      )}

      {/* Add to Cart Success Modal */}
      {showAddToCartSuccess && lastAddedProduct && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Added to Cart!</h3>
              <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl w-full mb-8">
                {lastAddedProduct.image ? (
                  <img src={lastAddedProduct.image} alt="" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                ) : (
                  <div className="w-12 h-12 bg-zinc-200 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-zinc-400" />
                  </div>
                )}
                <p className="text-sm font-semibold text-zinc-800 text-left line-clamp-2">{lastAddedProduct.name}</p>
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    setShowAddToCartSuccess(false);
                    openCart();
                  }}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg shadow-zinc-900/10"
                >
                  View Shopping Cart
                </button>
                <button
                  onClick={() => setShowAddToCartSuccess(false)}
                  className="w-full py-4 bg-white text-zinc-500 rounded-2xl font-bold text-sm hover:bg-zinc-50 transition-all active:scale-[0.98]"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
