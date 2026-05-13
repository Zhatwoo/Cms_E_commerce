'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useStorefront } from './StorefrontContext';
import { CheckoutModal } from '@/app/sites/_storefront/CheckoutModal';
import { createPublishedOrder, createPaymentIntent, createStripePaymentIntent } from '@/lib/api';

function QuantityInput({ item, updateQuantity }: { item: any, updateQuantity: (id: string, qty: number) => void }) {
  const [localValue, setLocalValue] = useState(item.quantity.toString());

  useEffect(() => {
    setLocalValue(item.quantity.toString());
  }, [item.quantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= 1) {
      updateQuantity(item.id, num);
    }
  };

  const handleBlur = () => {
    const num = parseInt(localValue);
    if (isNaN(num) || num < 1) {
      setLocalValue(item.quantity.toString());
    }
  };

  return (
    <input
      type="number"
      min="1"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-8 h-7 text-xs font-medium text-zinc-900 text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      aria-label={`Quantity of ${item.name}`}
    />
  );
}

export function CartDrawer() {
  const {
    subdomain,
    cart,
    cartOpen,
    closeCart,
    removeFromCart,
    removeManyFromCart,
    updateQuantity,
    cartCount,
  } =
    useStorefront();
  const [selectedById, setSelectedById] = useState<Record<string, boolean>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null);

  useEffect(() => {
    setSelectedById((prev) => {
      const next: Record<string, boolean> = {};
      for (const item of cart) {
        next[item.id] = prev[item.id] ?? true;
      }
      return next;
    });
  }, [cart]);

  const selectedItems = useMemo(
    () => cart.filter((item) => selectedById[item.id]),
    [cart, selectedById]
  );

  const selectedCount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems]
  );

  const selectedTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems]
  );

  const allSelected = cart.length > 0 && cart.every((item) => selectedById[item.id]);

  if (!cartOpen) return null;

  const toggleItem = (id: string, checked: boolean) => {
    setSelectedById((prev) => ({ ...prev, [id]: checked }));
  };

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    for (const item of cart) next[item.id] = checked;
    setSelectedById(next);
  };

  const removeSelected = () => {
    const ids = cart.filter((item) => selectedById[item.id]).map((item) => item.id);
    if (!ids.length) return;
    if (ids.length >= 2) {
      setConfirmDeleteIds(ids);
      return;
    }
    removeManyFromCart(ids);
  };

  const confirmRemoveMany = () => {
    const ids = Array.isArray(confirmDeleteIds) ? confirmDeleteIds : [];
    if (!ids.length) {
      setConfirmDeleteIds(null);
      return;
    }
    removeManyFromCart(ids);
    setConfirmDeleteIds(null);
  };

  const handleCheckoutConfirm = async (
    contact: {
      fullName: string;
      emailAddress: string;
      contactNumber: string;
      country: string;
      state: string;
      streetAddress: string;
      city: string;
      postalCode: string;
    },
    paymentMethod: 'gcash' | 'maya' | 'card' | 'stripe' | 'paypal'
  ) => {
    if (!subdomain) {
      window.alert('Checkout unavailable: missing subdomain context.');
      return;
    }
    if (!selectedItems.length) {
      window.alert('Please select at least one item to checkout.');
      return;
    }

    try {
      setSubmittingCheckout(true);
      const items = selectedItems.map((item) => ({
        id: item.id,
        productId: item.id,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
        subtotal: Number((item.quantity * item.price).toFixed(2)),
      }));
      const total = Number(
        selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
      );

      const res = await createPublishedOrder({
        subdomain,
        items,
        total,
        shippingAddress: {
          fullName: contact.fullName,
          name: contact.fullName,
          email: contact.emailAddress,
          emailAddress: contact.emailAddress,
          phone: contact.contactNumber,
          contactNumber: contact.contactNumber,
          street: contact.streetAddress,
          streetAddress: contact.streetAddress,
          addressLine1: contact.streetAddress,
          city: contact.city,
          state: contact.state,
          province: contact.state,
          postalCode: contact.postalCode,
          zip: contact.postalCode,
          country: contact.country,
        },
        currency: 'PHP',
      });

      if (!res?.success) {
        throw new Error(res?.message || 'Unable to save checkout order.');
      }

      const orderId = res?.data?.id;
      if (!orderId) {
        throw new Error('Order created but no order ID returned.');
      }

      if (paymentMethod === 'stripe') {
        const stripeRes = await createStripePaymentIntent(subdomain, orderId);
        if (!stripeRes?.success) {
          throw new Error(stripeRes?.message || 'Unable to create Stripe payment.');
        }

        removeManyFromCart(selectedItems.map((item) => item.id));
        setCheckoutOpen(false);
        closeCart();
        
        // Always use the main app origin (strip subdomain if any) so the proxy doesn't
        // intercept the redirect and show the storefront instead of the stripe-pay page.
        let base = typeof window !== 'undefined' ? window.location.origin : '';
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname; // e.g. "eme.localhost"
          const port = window.location.port ? `:${window.location.port}` : '';
          // If we're on a subdomain (e.g. eme.localhost), use the root domain instead
          if (hostname.endsWith('.localhost')) {
            base = `${window.location.protocol}//localhost${port}`;
          } else if (process.env.NEXT_PUBLIC_BASE_DOMAIN && hostname.endsWith('.' + process.env.NEXT_PUBLIC_BASE_DOMAIN)) {
            base = `${window.location.protocol}//${process.env.NEXT_PUBLIC_BASE_DOMAIN}${port}`;
          }
        }
        const params = new URLSearchParams({
          order_id: orderId,
          client_secret: stripeRes.clientSecret || '',
          public_key: stripeRes.publicKey || '',
        });
        window.location.href = `${base}/sites/${encodeURIComponent(subdomain)}/checkout/stripe-pay?${params.toString()}`;
        return;
      }

      const payRes = await createPaymentIntent(subdomain, orderId, paymentMethod);
      if (!payRes?.success) {
        throw new Error(payRes?.message || 'Unable to create payment.');
      }

      // PayPal: redirect to payment page
      if (payRes.redirectUrl) {
        removeManyFromCart(selectedItems.map((item) => item.id));
        setCheckoutOpen(false);
        closeCart();
        window.location.href = payRes.redirectUrl;
        return;
      }

      removeManyFromCart(selectedItems.map((item) => item.id));
      setCheckoutOpen(false);
      closeCart();
      window.alert('Order placed successfully. Payment link not available.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete checkout.';
      window.alert(message);
    } finally {
      setSubmittingCheckout(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        aria-hidden
        onClick={closeCart}
      />
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 flex flex-col transition-transform duration-300 ease-out border-l border-zinc-200"
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <h2 className="text-base font-medium text-zinc-900">
            Shopping Cart ({cartCount})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <p className="text-zinc-400 text-sm">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-zinc-700">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
                  />
                  Select all
                </label>
                <button
                  type="button"
                  onClick={removeSelected}
                  disabled={selectedItems.length === 0}
                  className="text-xs text-red-600 hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  Clear
                </button>
              </div>

              <div className="flex flex-col">
              {cart.map((item) => (
                <li key={item.id} className="flex gap-4 py-4 border-b border-zinc-100 last:border-0 group">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={!!selectedById[item.id]}
                      onChange={(e) => toggleItem(item.id, e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                      aria-label={`Select ${item.name}`}
                    />
                  </div>
                  
                  <div className="w-16 h-16 flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="w-full h-full object-cover bg-zinc-50 border border-zinc-100"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-100 border border-zinc-200" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium text-zinc-900 truncate pr-4">{item.name}</h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-zinc-300 hover:text-zinc-600 transition-colors"
                          aria-label={`Remove ${item.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">₱{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-zinc-200 rounded">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-700 disabled:opacity-20 transition-all"
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        
                        <QuantityInput
                          item={item}
                          updateQuantity={updateQuantity}
                        />

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-700 transition-all"
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                      
                      <p className="text-sm font-medium text-zinc-900">₱{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </li>
              ))}
              </div>
            </>
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-5 bg-zinc-50 border-t border-zinc-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-zinc-500 font-medium">Total</span>
              <span className="text-lg font-bold text-zinc-900">
                ₱{selectedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              disabled={selectedItems.length === 0}
              className="w-full h-12 bg-black text-white text-sm font-medium hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        )}
      </div>

      <CheckoutModal
        open={checkoutOpen}
        items={selectedItems}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleCheckoutConfirm}
        submitting={submittingCheckout}
      />

      {confirmDeleteIds && confirmDeleteIds.length >= 2 ? (
        <>
          <div className="fixed inset-0 z-[80] bg-black/50" aria-hidden onClick={() => setConfirmDeleteIds(null)} />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-label="Confirm remove items">
            <div className="w-full max-w-sm rounded-xl bg-white border border-zinc-200 shadow-2xl p-5">
              <h3 className="text-lg font-semibold text-zinc-900">Clear selected products?</h3>
              <p className="mt-2 text-sm text-zinc-600">
                You are about to clear {confirmDeleteIds.length} products from your cart.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteIds(null)}
                  className="h-9 px-4 rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={confirmRemoveMany}
                  className="h-9 px-4 rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
