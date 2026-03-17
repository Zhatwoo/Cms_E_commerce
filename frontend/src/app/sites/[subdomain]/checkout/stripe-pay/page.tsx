'use client';

import React, { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StripeCheckout from '@/components/payments/StripeCheckout';

function StripePayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const subdomain = (params?.subdomain as string)?.trim() || '';
  const orderId = searchParams?.get('order_id') || '';
  const clientSecret = searchParams?.get('client_secret') || '';
  const publicKey = searchParams?.get('public_key') || '';

  const storeLink = subdomain ? `/sites/${encodeURIComponent(subdomain)}` : '/';

  if (!clientSecret || !orderId || !publicKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Checkout Error</h2>
          <p className="text-zinc-600 text-sm mb-6">Invalid or missing payment session. Please start checkout again from the store.</p>
          <Link 
            href={storeLink} 
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Return to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-emerald-50">1</div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 mt-2">Cart</span>
            </div>
            <div className="flex-1 h-[2px] bg-emerald-600 mx-4 mt-[-18px]"></div>
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-emerald-50">2</div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 mt-2">Details</span>
            </div>
            <div className="flex-1 h-[2px] bg-emerald-600 mx-4 mt-[-18px]"></div>
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-indigo-50 animate-pulse">3</div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 mt-2">Payment</span>
            </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
          <div className="bg-zinc-900 px-8 py-6 text-white">
            <div className="flex justify-between items-center mb-1">
                <h1 className="text-xl font-bold">Secure Payment</h1>
                <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">SSL Encrypted</span>
                </div>
            </div>
            <p className="text-zinc-400 text-xs">Complete your purchase using Stripe</p>
          </div>

          <div className="p-8">
            <StripeCheckout 
              clientSecret={clientSecret} 
              publicKey={publicKey} 
              orderId={orderId} 
              subdomain={subdomain} 
            />

            <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-center">
                <Link 
                    href={storeLink} 
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors flex items-center"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Cancel and return to store
                </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-6 opacity-40 grayscale">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
            <div className="h-4 w-[1px] bg-zinc-300"></div>
            <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-500">Powered by Stripe</span>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function StripePayPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <div className="w-8 h-8 border-4 border-zinc-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    }>
      <StripePayContent />
    </Suspense>
  );
}
