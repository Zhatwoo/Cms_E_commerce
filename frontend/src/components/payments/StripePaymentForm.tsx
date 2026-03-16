'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
  orderId: string;
  subdomain: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function StripePaymentForm({ orderId, subdomain, onSuccess, onCancel }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setMessage(submitError.message || "An unexpected error occurred.");
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/sites/${subdomain}/checkout/result?order_id=${orderId}&gateway=stripe&status=success`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message || "An unexpected error occurred.");
    } else {
      setMessage("An unexpected error occurred.");
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      
      {message && (
        <div id="payment-message" className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 italic">
          {message}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          disabled={isLoading || !stripe || !elements}
          id="submit"
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            "Pay now"
          )}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-zinc-500 hover:text-zinc-800 text-sm font-medium transition-colors"
          >
            Cancel and return
          </button>
        )}
      </div>
    </form>
  );
}
