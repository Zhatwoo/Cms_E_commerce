'use client';

import Link from 'next/link';
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!auth) {
      setError('Firebase is not configured. Check your .env.local.');
      return;
    }
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'code' in err
        ? (err as { code: string }).code === 'auth/user-not-found'
          ? 'No account found with this email.'
          : (err as { message?: string }).message ?? 'Failed to send reset email.'
        : 'Failed to send reset email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070812] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-block text-2xl font-medium tracking-wide text-white mb-8"
          style={{ fontFamily: "'Great Vibes', cursive" }}
        >
          Mercato
        </Link>
        <div className="rounded-2xl border border-white/10 bg-[#0a0d14] p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white md:text-3xl">Forgot password</h1>
          <p className="mt-2 text-sm text-white/70">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <p className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg bg-green-500/20 border border-green-500/50 px-3 py-2 text-sm text-green-200">
                Check your email for the reset link.
              </p>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-white/70">
            Remember your password?{' '}
            <Link href="/auth/login" className="font-medium text-violet-400 hover:text-violet-300">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
