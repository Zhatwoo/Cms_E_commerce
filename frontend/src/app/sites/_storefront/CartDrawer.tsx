'use client';

import React from 'react';
import { useStorefront } from './StorefrontContext';

export function CartDrawer() {
  const { cart, cartOpen, closeCart, removeFromCart, updateQuantity, cartCount } =
    useStorefront();

  if (!cartOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        aria-hidden
        onClick={closeCart}
      />
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-xl z-50 flex flex-col"
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">
            Cart {cartCount > 0 && `(${cartCount})`}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <p className="text-zinc-500 text-sm">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {cart.map((item) => (
                <li key={item.id} className="flex gap-3 border-b border-zinc-100 pb-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="w-14 h-14 rounded object-cover bg-zinc-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded bg-zinc-200 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{item.name}</p>
                    <p className="text-sm text-zinc-600">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-sm"
                      >
                        −
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-sm"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t border-zinc-200">
            <p className="text-sm text-zinc-600 mb-2">
              Total: $
              {cart
                .reduce((sum, i) => sum + i.price * i.quantity, 0)
                .toFixed(2)}
            </p>
            <button
              type="button"
              className="w-full rounded-md bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
            >
              Checkout (coming soon)
            </button>
          </div>
        )}
      </div>
    </>
  );
}
