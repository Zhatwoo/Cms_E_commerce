'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const subdomain = (params?.subdomain as string)?.trim() || '';
  const status = searchParams?.get('status') || '';
  const orderId = searchParams?.get('order_id') || '';
  const isSuccess = status === 'success';

  const storeLink = subdomain ? `/sites/${encodeURIComponent(subdomain)}` : '/';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg text-center">
        {isSuccess ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-8 w-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Payment successful</h1>
            <p className="mt-2 text-zinc-600">Your order has been placed successfully.</p>
            {orderId && (
              <p className="mt-1 text-sm text-zinc-500">Order ID: {orderId}</p>
            )}
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Payment failed</h1>
            <p className="mt-2 text-zinc-600">We could not process your payment. Please try again.</p>
          </>
        )}

        <Link
          href={storeLink}
          className="mt-6 inline-block w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Back to store
        </Link>
      </div>
    </div>
  );
}
