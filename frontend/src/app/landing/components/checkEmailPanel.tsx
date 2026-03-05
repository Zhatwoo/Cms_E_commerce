'use client';

import Link from 'next/link';
import { useState } from 'react';
import { resendVerificationEmail } from '@/lib/api';

interface CheckEmailPanelProps {
  email: string;
  onBack?: () => void;
}

export function CheckEmailPanel({ email, onBack }: CheckEmailPanelProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResend = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'No email address found.' });
      return;
    }

    setMessage(null);
    setLoading(true);
    try {
      const data = await resendVerificationEmail(email);
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'A new confirmation link was sent to your email.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Something went wrong.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to resend. Try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 pb-16 pt-32 sm:px-6">
      <div className="w-full rounded-3xl border border-[#4f36b8]/55 bg-[#09022f]/95 p-8 text-center shadow-[0_24px_80px_rgba(8,3,36,0.75)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-violet-500/50 bg-violet-500/20">
          <svg className="h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-bold text-white">Check your email</h1>
        <p className="mt-2 text-base text-white/70">
          We sent a confirmation link to
          <span className="mt-1 block font-medium text-white/90">{email}</span>
          . Click the link to confirm your account, then you can log in.
        </p>

        <p className="mt-4 text-sm text-white/60">Didn’t get the email? Check your spam folder.</p>

        {message && (
          <p
            className={`mt-4 text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}
            role="alert"
          >
            {message.text}
          </p>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#6d1eea] to-[#7b19dc] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#09022f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Resend email'}
        </button>

        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 inline-block text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Back to landing page
          </button>
        ) : (
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Back to landing page
          </Link>
        )}
      </div>
    </section>
  );
}