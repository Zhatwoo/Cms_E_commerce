'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const PAYMONGO_API = 'https://api.paymongo.com/v1';

export default function CheckoutPayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const subdomain = (params?.subdomain as string)?.trim() || '';
  const orderId = searchParams?.get('order_id') || '';
  const clientKey = searchParams?.get('client_key') || '';
  const publicKey = searchParams?.get('public_key') || '';

  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [billingName, setBillingName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [effectivePublicKey, setEffectivePublicKey] = useState(publicKey);

  useEffect(() => {
    if (clientKey && publicKey) {
      setEffectivePublicKey(publicKey);
      setReady(true);
      return;
    }
    if (clientKey && orderId && !publicKey) {
      apiFetch<{ success?: boolean; publicKey?: string }>('/api/orders/paymongo-public-key')
        .then((data) => {
          if (data?.success && data?.publicKey) {
            setEffectivePublicKey(data.publicKey);
            setReady(true);
          } else {
            setError('Payment not configured. Please try again later.');
          }
        })
        .catch(() => setError('Could not load payment configuration.'));
    }
  }, [clientKey, publicKey, orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pk = effectivePublicKey || publicKey;
    if (!clientKey || !pk || !orderId) return;
    setError(null);
    setSubmitting(true);

    try {
      const pk = effectivePublicKey || publicKey;
      const basicAuth = typeof btoa !== 'undefined' ? btoa(pk + ':') : '';
      const pmRes = await fetch(`${PAYMONGO_API}/payment_methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              type: 'card',
              details: {
                card_number: cardNumber.replace(/\s/g, ''),
                exp_month: parseInt(expMonth, 10) || 0,
                exp_year: parseInt(expYear, 10) || 0,
                cvc: cvc,
              },
              billing: billingName ? { name: billingName } : undefined,
            },
          },
        }),
      });

      const pmData = await pmRes.json();
      const pmId = pmData?.data?.id;
      if (!pmId) {
        const errMsg = pmData?.errors?.[0]?.detail || pmData?.errors?.[0]?.detail || 'Failed to create payment method';
        throw new Error(errMsg);
      }

      const paymentIntentId = clientKey.split('_client')[0];
      const attachRes = await fetch(`${PAYMONGO_API}/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              client_key: clientKey,
              payment_method: pmId,
              return_url: typeof window !== 'undefined'
                ? `${window.location.origin}/sites/${encodeURIComponent(subdomain)}/checkout/result?order_id=${encodeURIComponent(orderId)}&status=success`
                : '',
            },
          },
        }),
      });

      const attachData = await attachRes.json();
      const status = attachData?.data?.attributes?.status;
      const nextAction = attachData?.data?.attributes?.next_action;

      if (status === 'succeeded') {
        window.location.href = `/sites/${subdomain}/checkout/result?order_id=${orderId}&status=success`;
        return;
      }
      if (status === 'awaiting_next_action' && nextAction?.redirect?.url) {
        window.location.href = nextAction.redirect.url;
        return;
      }
      if (status === 'processing') {
        window.setTimeout(() => {
          window.location.href = `/sites/${subdomain}/checkout/result?order_id=${orderId}&status=success`;
        }, 2500);
        return;
      }

      const lastError = attachData?.data?.attributes?.last_payment_error?.message
        || attachData?.errors?.[0]?.detail
        || 'Payment could not be processed';
      throw new Error(lastError);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const storeLink = subdomain ? `/sites/${encodeURIComponent(subdomain)}` : '/';

  if (!clientKey || !orderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-700">Invalid or missing payment session. Please start checkout again.</p>
          <Link href={storeLink} className="mt-4 inline-block text-emerald-600 hover:underline">
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  if (!ready && clientKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-bold text-zinc-900 mb-6">Complete payment</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-zinc-500">Card number</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 19))}
              placeholder="4242 4242 4242 4242"
              className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm"
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase text-zinc-500">Exp month</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="12"
                value={expMonth}
                onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-zinc-500">Exp year</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="28"
                value={expYear}
                onChange={(e) => setExpYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                required
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-zinc-500">CVC</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-zinc-500">Name on card</span>
            <input
              type="text"
              autoComplete="cc-name"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? 'Processing...' : 'Pay now'}
          </button>
        </form>
        <Link href={storeLink} className="mt-4 block text-center text-sm text-zinc-500 hover:text-zinc-700">
          Cancel and return to store
        </Link>
      </div>
    </div>
  );
}
