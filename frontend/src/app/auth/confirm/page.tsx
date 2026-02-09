'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const isError = error === 'expired' || error === 'invalid';

  if (isError) {
    return (
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-block text-2xl font-medium tracking-wide text-white mb-8"
          style={{ fontFamily: "'Great Vibes', cursive" }}
        >
          Mercato
        </Link>
        <div className="rounded-2xl border border-white/10 bg-[#0a0d14] p-8 shadow-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/50">
            <svg className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">Link invalid or expired</h1>
          <p className="mt-2 text-sm text-white/70">
            This confirmation link is no longer valid. You can request a new one from the login page or try signing in if you’re already confirmed.
          </p>
          <Link
            href="/auth/login"
            className="mt-8 inline-flex w-full justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0a0d14]"
          >
            Go to Log in
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
      <div className="rounded-2xl border border-white/10 bg-[#0a0d14] p-8 shadow-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/50">
          <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Email confirmed</h1>
        <p className="mt-2 text-sm text-white/70">
          Your email address is verified. You can now log in to your account.
        </p>
        <Link
          href="/auth/login"
          className="mt-8 inline-flex w-full justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0a0d14]"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0d14] p-8 animate-pulse">
        <div className="h-8 w-3/4 bg-white/10 rounded mx-auto" />
        <div className="h-4 w-full bg-white/10 rounded mt-4" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
