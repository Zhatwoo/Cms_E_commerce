'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const CART_KEY_PREFIX = 'storefront_cart_';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

type StorefrontContextValue = {
  subdomain: string;
  siteTitle: string | null;
  setSiteTitle: (title: string | null) => void;
  cart: CartItem[];
  addToCart: (product: { id: string; name: string; price: number; image?: string }, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  cartCount: number;
  openCart: () => void;
  closeCart: () => void;
  cartOpen: boolean;
};

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

function loadCart(subdomain: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY_PREFIX + subdomain);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(subdomain: string, cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_KEY_PREFIX + subdomain, JSON.stringify(cart));
  } catch {}
}

export function StorefrontProvider({
  subdomain,
  siteTitle: initialSiteTitle = null,
  children,
}: {
  subdomain: string;
  siteTitle?: string | null;
  children: React.ReactNode;
}) {
  const [siteTitle, setSiteTitle] = useState<string | null>(initialSiteTitle ?? null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    setCart(loadCart(subdomain));
  }, [subdomain]);

  useEffect(() => {
    saveCart(subdomain, cart);
  }, [subdomain, cart]);

  const addToCart = useCallback(
    (product: { id: string; name: string; price: number; image?: string }, qty = 1) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
          );
        }
        return [...prev, { ...product, quantity: qty }];
      });
      setCartOpen(true);
    },
    []
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const value: StorefrontContextValue = {
    subdomain,
    siteTitle,
    setSiteTitle,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    cartCount,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    cartOpen,
  };

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront() {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error('useStorefront must be used within StorefrontProvider');
  return ctx;
}
