'use client';

import React, { useMemo, useState } from 'react';
import type { CartItem } from './StorefrontContext';

type PaymentMethod = 'card' | 'gcash' | 'maya' | 'stripe' | 'paypal';

type CheckoutModalProps = {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onConfirm: (contact: {
    fullName: string;
    emailAddress: string;
    contactNumber: string;
    country: string;
    state: string;
    streetAddress: string;
    city: string;
    postalCode: string;
  }, paymentMethod: PaymentMethod) => Promise<void> | void;
  submitting?: boolean;
};

export function CheckoutModal({
  open,
  items,
  onClose,
  onConfirm,
  submitting = false,
}: CheckoutModalProps) {
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const productCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  if (!open) return null;

  const handleSubmit = async () => {
    if (
      !fullName.trim() ||
      !emailAddress.trim() ||
      !contactNumber.trim() ||
      !country.trim() ||
      !state.trim() ||
      !streetAddress.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      setError('Please complete all required fields.');
      return;
    }

    setError(null);
    await onConfirm({
      fullName: fullName.trim(),
      emailAddress: emailAddress.trim(),
      contactNumber: contactNumber.trim(),
      country: country.trim(),
      state: state.trim(),
      streetAddress: streetAddress.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
    }, paymentMethod);
  };

  const handleRequestClose = () => {
    setShowExitConfirm(true);
  };

  const handleStayInCheckout = () => {
    setShowExitConfirm(false);
  };

  const handleLeaveCheckout = () => {
    setShowExitConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4" role="dialog" aria-label="Checkout">
        <div className="w-[min(98vw,1400px)] max-h-[96vh] rounded-3xl bg-zinc-100 shadow-2xl overflow-hidden border border-zinc-200 flex flex-col">
          <div className="relative px-6 pt-6 pb-2">
            <div className="text-center">
              <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900">CHECKOUT</h2>
              <p className="text-sm text-zinc-500">Review your selected products and shipping details</p>
            </div>
            <button
              type="button"
              onClick={handleRequestClose}
              className="absolute right-6 top-6 h-9 w-9 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
              aria-label="Close checkout"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mt-1 flex-1 min-h-0 overflow-y-auto">
            <section className="px-4 sm:px-6 pb-6 md:border-r md:border-zinc-200">
              <h3 className="text-2xl font-semibold text-zinc-900">Enter Your Shipping Address</h3>

              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold tracking-[0.08em] uppercase text-zinc-500">Full Name</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold tracking-[0.08em] uppercase text-zinc-500">Email Address</span>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold tracking-[0.08em] uppercase text-zinc-500">Contact Number</span>
                  <input
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <div className="mt-5 border-t border-zinc-200 pt-3">
                  <p className="text-start text-xl font-medium text-zinc-900">Address</p>

                  <label className="block mt-2">
                    <span className="text-xs font-semibold tracking-[0.08em] uppercase text-zinc-500">Street Address</span>
                    <input
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <label className="block">
                      <span className="text-xs font-semibold tracking-[0.08em] uppercase text-zinc-500">City</span>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold tracking-[0.08em] uppercase text-zinc-500">Postal Code</span>
                      <input
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <label className="block">
                      <span className="text-xs font-semibold tracking-[0.08em] uppercase text-zinc-500">Country</span>
                      <input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold tracking-[0.08em] uppercase text-zinc-500">State</span>
                      <input
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            </section>

            <section className="px-4 sm:px-6 pb-6 bg-zinc-50/70">
              <p className="text-2xl font-semibold text-zinc-900">Products Ordered</p>
              <div className="mt-2 overflow-x-auto">
                <div className="min-w-[500px]">
                  <div className="mt-3 hidden md:grid grid-cols-[minmax(0,1fr)_100px_90px_130px] gap-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-zinc-500 px-2.5">
                    <span />
                    <span className="text-center">Unit Price</span>
                    <span className="text-center">Quantity</span>
                    <span className="text-right">Item Subtotal</span>
                  </div>

                  <div className="mt-2 space-y-2 max-h-[36vh] overflow-y-auto pr-1">
                    {items.map((item) => {
                      const subtotal = item.price * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-zinc-200 bg-zinc-200/70 p-2.5 grid grid-cols-[minmax(0,1fr)_100px_90px_130px] items-center gap-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.image ? (
                              <img src={item.image} alt="" className="h-14 w-14 rounded-lg object-cover bg-zinc-200" />
                            ) : (
                              <div className="h-14 w-14 rounded-lg bg-zinc-200" />
                            )}
                            <p className="font-semibold text-zinc-900 truncate">{item.name}</p>
                          </div>
                          <div className="text-center text-sm text-zinc-800">₱{item.price.toFixed(2)}</div>
                          <div className="text-center text-sm text-zinc-800">{item.quantity}</div>
                          <div className="text-right text-sm font-semibold text-zinc-900">₱{subtotal.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-zinc-200 pt-3">
                <p className="text-start text-xl font-medium text-zinc-900">Payment Method</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['paypal', 'stripe', 'gcash', 'maya', 'card'] as const).map((m) => (
                    <label
                      key={m}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                        paymentMethod === m
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m}
                        checked={paymentMethod === m}
                        onChange={() => setPaymentMethod(m)}
                        className="sr-only"
                      />
                      {m === 'paypal' ? 'PayPal' : m === 'gcash' ? 'GCash' : m === 'maya' ? 'Maya' : m === 'stripe' ? 'Stripe (Card)' : 'PayMongo Card'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5 border-t border-zinc-200 pt-3">
                <p className="text-center text-xl font-medium text-zinc-900">Order Summary</p>
                <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-200/70 p-3 text-zinc-900">
                  <div className="flex items-start justify-between text-sm">
                    <div>
                      <p>Total Price</p>
                      <p className="text-xs text-zinc-700">({productCount} product{productCount === 1 ? '' : 's'})</p>
                    </div>
                    <p>₱{total.toFixed(2)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <p>Total Discount</p>
                    <p>-₱0</p>
                  </div>
                  <div className="mt-2 border-t border-zinc-300 pt-2 flex items-center justify-between font-bold text-lg">
                    <p>Total</p>
                    <p>₱{total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-100 px-4 sm:px-6 py-4">
            <button
              type="button"
              onClick={handleRequestClose}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              className="h-11 min-w-[170px] rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'PROCESSING...' : 'CHECKOUT'}
            </button>
          </div>
        </div>
      </div>

      {showExitConfirm ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" aria-hidden onClick={handleStayInCheckout} />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
            <p className="text-base font-medium text-zinc-900">
              You’re just one step away from completing your order. Would you like to continue?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleStayInCheckout}
                className="h-10 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={handleLeaveCheckout}
                className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"
              >
                No
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
