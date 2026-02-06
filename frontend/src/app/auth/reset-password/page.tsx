'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token.trim()) {
      setError('Reset token is required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token.trim(), newPassword);
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-[#0a0d14] p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white md:text-3xl">Password reset</h1>
          <p className="mt-2 rounded-lg bg-green-500/20 border border-green-500/50 px-3 py-2 text-sm text-green-200">
            Password has been reset successfully. Redirecting to login…
          </p>
          <Link href="/auth/login" className="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Link
        href="/"
        className="inline-block text-2xl font-medium tracking-wide text-white mb-8"
        style={{ fontFamily: "'Great Vibes', cursive" }}
      >
        Mercato
      </Link>
      <div className="rounded-2xl border border-white/10 bg-[#0a0d14] p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Set new password</h1>
        <p className="mt-2 text-sm text-white/70">
          Enter the token from your email and your new password.
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-white/90">
              Reset token
            </label>
            <input
              id="token"
              type="text"
              autoComplete="off"
              placeholder="Paste token from email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-white/90">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <p className="mt-1.5 text-xs text-white/60">At least 6 characters</p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-white/70">
          <Link href="/auth/login" className="font-medium text-violet-400 hover:text-violet-300">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
