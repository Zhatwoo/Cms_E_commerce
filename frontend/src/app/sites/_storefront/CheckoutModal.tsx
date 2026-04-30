'use client';

import React, { useMemo, useState } from 'react';
import type { CartItem } from './StorefrontContext';
import { ModalShell } from '@/components/ModalShell';

type PaymentMethod = 'card' | 'gcash' | 'maya' | 'stripe' | 'paypal';

type CheckoutModalProps = {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onConfirm: (
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
    paymentMethod: PaymentMethod
  ) => Promise<void> | void;
  submitting?: boolean;
};

const INPUT_CLASS =
  'mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors';

function FormField({
  label,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      />
    </label>
  );
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  paypal: 'PayPal',
  stripe: 'Stripe (Card)',
  gcash: 'GCash',
  maya: 'Maya',
  card: 'PayMongo Card',
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
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
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

  const handleSubmit = async () => {
    if (
      !fullName.trim() ||
      !emailAddress.trim() ||
      !contactNumber.trim() ||
      !streetAddress.trim() ||
      !city.trim() ||
      !postalCode.trim() ||
      !country.trim() ||
      !state.trim()
    ) {
      setError('Please complete all required fields.');
      return;
    }
    setError(null);
    await onConfirm(
      {
        fullName: fullName.trim(),
        emailAddress: emailAddress.trim(),
        contactNumber: contactNumber.trim(),
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        state: state.trim(),
      },
      paymentMethod
    );
  };

  const requestExit = () => setShowExitConfirm(true);

  return (
    <>
      <ModalShell
        isOpen={open}
        onClose={requestExit}
        className="fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
      >
        <div
          className="flex w-[min(98vw,1100px)] max-h-[94vh] flex-col rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden"
          role="dialog"
          aria-modal
          aria-label="Checkout"
        >

          {/* Header */}
          <div className="relative flex items-center justify-center border-b border-zinc-200 px-6 py-5">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-widest text-zinc-900">CHECKOUT</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Review your selected products and shipping details</p>
            </div>
            <button
              type="button"
              onClick={requestExit}
              className="absolute right-5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              aria-label="Close checkout"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-2 md:divide-x md:divide-zinc-200 min-h-0">

            {/* Left — Shipping */}
            <section className="space-y-4 px-6 py-5">
              <h3 className="text-base font-semibold text-zinc-900">Enter Your Shipping Address</h3>

              <div className="space-y-3">
                <FormField label="Full Name" value={fullName} onChange={setFullName} />
                <FormField label="Email Address" type="email" value={emailAddress} onChange={setEmailAddress} />
                <FormField label="Contact Number" value={contactNumber} onChange={setContactNumber} />
              </div>

              <div className="space-y-3 border-t border-zinc-200 pt-4">
                <h4 className="text-sm font-medium text-zinc-900">Address</h4>
                <FormField label="Street Address" value={streetAddress} onChange={setStreetAddress} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="City" value={city} onChange={setCity} />
                  <FormField label="Postal Code" value={postalCode} onChange={setPostalCode} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Country" value={country} onChange={setCountry} />
                  <FormField label="State" value={state} onChange={setState} />
                </div>
              </div>

              {error && <p className="text-xs font-medium text-red-600">{error}</p>}
            </section>

            {/* Right — Order & Payment */}
            <section className="space-y-5 bg-zinc-50 px-6 py-5">

              {/* Products */}
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Products Ordered</h3>
                <div className="mt-3 grid grid-cols-[1fr_80px_70px_100px] gap-x-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  <span />
                  <span className="text-center">Unit Price</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Subtotal</span>
                </div>
                <ul className="mt-2 max-h-[28vh] space-y-2 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="grid grid-cols-[1fr_80px_70px_100px] items-center gap-x-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-lg object-cover bg-zinc-100"
                          />
                        ) : (
                          <div className="h-11 w-11 shrink-0 rounded-lg bg-zinc-100" />
                        )}
                        <span className="truncate text-sm font-medium text-zinc-900">{item.name}</span>
                      </div>
                      <span className="text-center text-sm text-zinc-700">₱{item.price.toFixed(2)}</span>
                      <span className="text-center text-sm text-zinc-700">{item.quantity}</span>
                      <span className="text-right text-sm font-semibold text-zinc-900">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment Method */}
              <div className="border-t border-zinc-200 pt-4">
                <h3 className="text-base font-semibold text-zinc-900">Payment Method</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                    <label
                      key={m}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        paymentMethod === m
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50'
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
                      {PAYMENT_LABELS[m]}
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-zinc-200 pt-4">
                <h3 className="text-center text-base font-semibold text-zinc-900">Order Summary</h3>
                <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-900">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">Total Price</p>
                      <p className="text-xs text-zinc-500">
                        ({productCount} product{productCount === 1 ? '' : 's'})
                      </p>
                    </div>
                    <p className="font-medium">₱{total.toFixed(2)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-zinc-500">
                    <p>Total Discount</p>
                    <p>-₱0</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 font-bold text-base">
                    <p>Total</p>
                    <p>₱{total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={requestExit}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              className="h-11 min-w-40 rounded-xl bg-emerald-600 px-6 text-sm font-bold tracking-widest text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'PROCESSING...' : 'CHECKOUT'}
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Exit Confirmation */}
      <ModalShell
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        className="fixed inset-0 z-90 flex items-center justify-center p-4 bg-black/40"
      >
        <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
          <p className="text-sm font-medium text-zinc-900">
            You&apos;re just one step away from completing your order. Would you like to continue?
          </p>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowExitConfirm(false)}
              className="h-10 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Yes, continue
            </button>
            <button
              type="button"
              onClick={() => { setShowExitConfirm(false); onClose(); }}
              className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              No, leave
            </button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
