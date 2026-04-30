'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { X, CreditCard, Lock, AlertCircle } from 'lucide-react';
import { getStripePublicKey, createStripeSetupIntent, updateProfile } from '@/lib/api';
import { ModalShell } from '@/components/ModalShell';

// Stripe Card Element options
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Outfit", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

function CardForm({ 
  onSuccess, 
  onCancel, 
  clientSecret, 
  paymentMethods 
}: { 
  onSuccess: (methods: any[]) => void; 
  onCancel: () => void; 
  clientSecret: string;
  paymentMethods: any[];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
        setProcessing(false);
        return;
    }

    const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (stripeError) {
      setError(stripeError.message || 'An error occurred');
      setProcessing(false);
    } else if (setupIntent && setupIntent.status === 'succeeded') {
      // In a real app, setupIntent.payment_method is the ID.
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
          setError(pmError.message || 'Failed to retrieve card info');
          setProcessing(false);
          return;
      }

      const newCard = {
        id: paymentMethod.id,
        type: paymentMethod.card?.brand || 'unknown',
        last4: paymentMethod.card?.last4 || '****',
        expMonth: paymentMethod.card?.exp_month?.toString() || '??',
        expYear: paymentMethod.card?.exp_year?.toString() || '????',
      };

      const updatedMethods = [...paymentMethods, newCard];
      
      try {
        await updateProfile({ paymentMethods: updatedMethods });
        onSuccess(updatedMethods);
      } catch (err: any) {
        setError(err.message || 'Failed to save to profile');
      } finally {
        setProcessing(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-xl border bg-zinc-50/50 border-zinc-200">
        <label className="block text-sm font-medium text-zinc-700 mb-3">Card Details</label>
        <div className="p-3 bg-white border rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-violet-500 transition-all">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {processing ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Securely Add Card
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="w-full py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          Cancel
        </button>
      </div>
      
      <p className="text-[10px] text-center text-zinc-400">
        Your card info is tokenized by Stripe and never stored in plain text.
      </p>
    </form>
  );
}

export function AddCardModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  paymentMethods
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess: (methods: any[]) => void;
  paymentMethods: any[];
}) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const initStripe = async () => {
        try {
          const [keyRes, secretRes] = await Promise.all([
            getStripePublicKey(),
            createStripeSetupIntent()
          ]);

          if (!keyRes.success || !keyRes.publicKey) {
            throw new Error('Stripe Public Key is missing in backend configuration.');
          }
          setStripePromise(loadStripe(keyRes.publicKey));
          
          if (!secretRes.success || !secretRes.clientSecret) {
            throw new Error('Failed to create setup intent.');
          }
          setClientSecret(secretRes.clientSecret);
        } catch (err: any) {
          console.error('Failed to initialize Stripe:', err);
          setError(err.message || 'An unexpected error occurred while initializing the payment gateway.');
        } finally {
          setLoading(false);
        }
      };
      initStripe();
    }
  }, [isOpen]);

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}>
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden mt-[-10%] sm:mt-0">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Add New Card</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-10 h-10 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin"></div>
              <p className="text-zinc-500 text-sm font-medium">Preparing secure gateway...</p>
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise}>
              <CardForm 
                onSuccess={onSuccess} 
                onCancel={onClose} 
                clientSecret={clientSecret} 
                paymentMethods={paymentMethods}
              />
            </Elements>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-zinc-900 font-semibold">Gateway Error</p>
              <p className="text-zinc-600 text-sm whitespace-pre-wrap">{error || 'Stripe configuration is missing or could not be loaded.'}</p>
              <button 
                onClick={() => {
                   setError(null);
                   onClose();
                }}
                className="text-sm text-violet-600 font-semibold hover:underline"
              >
                Close and try again later
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
