'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { AlertCircle } from 'lucide-react';
import { getStripePublicKey, createStripeSetupIntent, updateProfile } from '@/lib/api';
import { ModalShell } from '@/components/ui/ModalShell';
import { ModalCard } from '@/components/ui/ModalCard';
import { ModalButton } from '@/components/ui/ModalButton';
import { useThemeOptional } from '@/app/m_dashboard/components/context/theme-context';

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
  paymentMethods,
  onFormSubmit,
}: { 
  onSuccess: (methods: any[]) => void; 
  onCancel: () => void; 
  clientSecret: string;
  paymentMethods: any[];
  onFormSubmit: (handler: () => Promise<void>) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const themeOptional = useThemeOptional();
  const isLight = (themeOptional?.theme ?? 'dark') === 'light';
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    if (processing) return;

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

  useEffect(() => {
    onFormSubmit(handleSubmit);
  }, [stripe, elements, clientSecret, onFormSubmit]);

  const inputBgColor = isLight ? 'rgba(103,2,191,0.05)' : 'rgba(255,255,255,0.05)';
  const inputBorderColor = isLight ? 'rgba(103,2,191,0.15)' : 'rgba(255,255,255,0.1)';
  const labelColor = isLight ? 'rgba(18,5,51,0.55)' : 'rgba(255,255,255,0.55)';

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.15em] mb-2" style={{ color: labelColor }}>
          Card Details
        </p>
        <div 
          className="p-4 rounded-lg border shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all"
          style={{ backgroundColor: inputBgColor, borderColor: inputBorderColor }}
        >
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <p className="text-xs text-center" style={{ color: labelColor }}>
        Your card info is tokenized by Stripe and never stored in plain text.
      </p>
    </div>
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
  const [submitHandler, setSubmitHandler] = useState<(() => Promise<void>) | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setClientSecret(null);
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

  const handleAddCard = async () => {
    if (!submitHandler || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitHandler();
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerSubmitHandler = useCallback((h: () => Promise<void>) => {
    setSubmitHandler(() => h);
  }, []);

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} disabled={loading} usePortal>
      {loading ? (
        <ModalCard
          title="Add new card"
          subtitle="Preparing secure payment gateway"
        >
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Preparing secure gateway...</p>
          </div>
        </ModalCard>
      ) : error && !clientSecret ? (
        <ModalCard 
          title="Gateway error"
          subtitle="Unable to load Stripe configuration"
          footer={
            <ModalButton
              label="Close"
              onClick={onClose}
              variant="secondary"
            />
          }
        >
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm">{error || 'Stripe configuration is missing or could not be loaded.'}</p>
          </div>
        </ModalCard>
      ) : clientSecret && stripePromise ? (
        <ModalCard 
          title="Add new card"
          subtitle="Securely store a payment method for future purchases"
          footer={
            <div className="flex gap-2 w-full justify-end">
              <ModalButton
                label="Cancel"
                onClick={onClose}
                variant="secondary"
                disabled={loading || isSubmitting}
              />
              <ModalButton
                label="Securely Add Card"
                onClick={handleAddCard}
                variant="primary"
                disabled={loading || isSubmitting}
                primaryColor="#3B82F6"
              />
            </div>
          }
        >
          <div>
            <Elements stripe={stripePromise}>
              <CardForm 
                onSuccess={onSuccess} 
                onCancel={onClose} 
                clientSecret={clientSecret} 
                paymentMethods={paymentMethods}
                onFormSubmit={registerSubmitHandler}
              />
            </Elements>
          </div>
        </ModalCard>
      ) : null}
    </ModalShell>
  );
}