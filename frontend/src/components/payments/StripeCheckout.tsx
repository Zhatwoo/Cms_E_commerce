'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';

interface StripeCheckoutProps {
  clientSecret: string;
  publicKey: string;
  orderId: string;
  subdomain: string;
}

export default function StripeCheckout({ clientSecret, publicKey, orderId, subdomain }: StripeCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    if (publicKey) {
      setStripePromise(loadStripe(publicKey));
    }
  }, [publicKey]);

  if (!stripePromise || !clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm animate-pulse">Initializing secure checkout...</p>
        {!publicKey && <p className="text-xs text-red-500 font-medium">Error: Stripe Public Key is missing.</p>}
      </div>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#4f46e5',
      colorBackground: '#ffffff',
      colorText: '#18181b',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '12px',
    },
  };

  const loader = 'auto' as const;

  if (clientSecret === 'test') {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-900">Preview Mode</p>
            <p className="text-xs text-amber-700">This is a design preview. The actual payment form will appear here when a real order is created.</p>
          </div>
        </div>

        <div className="space-y-4 opacity-50 pointer-events-none">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Card Information</label>
            <div className="h-12 w-full border border-zinc-200 rounded-xl bg-zinc-50 flex items-center px-4 justify-between">
              <span className="text-zinc-400">1234 5678 1234 5678</span>
              <div className="flex gap-2">
                <div className="w-8 h-5 bg-zinc-200 rounded"></div>
                <div className="w-8 h-5 bg-zinc-200 rounded"></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Expiry</label>
              <div className="h-12 w-full border border-zinc-200 rounded-xl bg-zinc-50 flex items-center px-4 text-zinc-400">MM / YY</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">CVC</label>
              <div className="h-12 w-full border border-zinc-200 rounded-xl bg-zinc-50 flex items-center px-4 text-zinc-400">123</div>
            </div>
          </div>
        </div>

        <button className="w-full h-12 bg-indigo-600 text-white font-bold py-2 px-4 rounded-xl opacity-50 cursor-not-allowed">
          Pay now (Preview)
        </button>
      </div>
    );
  }

  return (
    <div className="stripe-checkout-container">
      <Elements 
        stripe={stripePromise} 
        options={{ 
          clientSecret, 
          appearance,
          loader 
        }}
      >
        <StripePaymentForm orderId={orderId} subdomain={subdomain} />
      </Elements>
    </div>
  );
}
