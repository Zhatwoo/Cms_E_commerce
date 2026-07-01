'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { capturePayPal } from '@/lib/api';

export default function CheckoutResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const subdomain = (params?.subdomain as string)?.trim() || '';
  const status = searchParams?.get('status') || '';
  const orderId = searchParams?.get('order_id') || '';
  const token = searchParams?.get('token') || '';
  const isSuccess = status === 'success';
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuccess || !token || !orderId || !subdomain) return;
    let mounted = true;
    setCapturing(true);
    setCaptureError(null);
    capturePayPal(subdomain, orderId, token)
      .then((res) => {
        if (!mounted) return;
        if (!res?.success) setCaptureError(res?.message || 'Could not complete payment');
      })
      .catch((err) => {
        if (!mounted) return;
        setCaptureError(err instanceof Error ? err.message : 'Could not complete payment');
      })
      .finally(() => {
        if (mounted) setCapturing(false);
      });
    return () => { mounted = false; };
  }, [isSuccess, token, orderId, subdomain]);

  const storeLink = subdomain ? `/sites/${encodeURIComponent(subdomain)}` : '/';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg text-center">
        {isSuccess ? (
          <>
            {capturing ? (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-zinc-300 border-t-emerald-600" />
              </div>
            ) : (
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
            )}
            <h1 className="text-2xl font-bold text-zinc-900">
              {capturing ? 'Completing payment...' : 'Payment successful'}
            </h1>
            <p className="mt-2 text-zinc-600">
              {capturing ? 'Please wait.' : 'Your order has been placed successfully.'}
            </p>
            {captureError && (
              <p className="mt-2 text-sm text-red-600">{captureError}</p>
            )}
            {orderId && !capturing && (
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
