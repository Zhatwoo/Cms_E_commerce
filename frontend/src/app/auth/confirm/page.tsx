'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { verifyEmail, setStoredUser } from '@/lib/api';

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid confirmation link. Missing token.');
      return;
    }
    verifyEmail(token)
      .then((res) => {
        if (res.success && res.user) {
          // Auto-login: save user data and redirect to dashboard
          setStoredUser(res.user);
          setStatus('success');
          setMessage(res.message || 'Email confirmed! Redirecting...');
          // Redirect to dashboard after 1.5 seconds
          setTimeout(() => {
            router.push('/m_dashboard/web-builder');
            router.refresh();
          }, 1500);
        } else {
          setStatus('error');
          setMessage(res.message || 'Invalid or expired link.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong. The link may be invalid or expired.');
      });
  }, [token, router]);

  if (status === 'loading') {
    return (
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-white"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[#1a0a62] ring-1 ring-white/10">
            <Image
              src="/img/finding-neo-logo.svg"
              alt="Finding Neo logo"
              width={20}
              height={20}
              className="h-5 w-5"
              priority
            />
          </span>
          <span className="text-[1.9rem] font-semibold leading-none tracking-tight">Finding Neo</span>
        </Link>
        <div className="rounded-3xl border border-[#4f36b8]/55 bg-[#09022f]/95 p-8 shadow-[0_24px_80px_rgba(8,3,36,0.75)] text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-white/10 animate-pulse" />
          <h1 className="mt-6 text-2xl font-bold text-white">Confirming your email…</h1>
          <p className="mt-2 text-sm text-white/70">Please wait.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-white"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[#1a0a62] ring-1 ring-white/10">
            <Image
              src="/img/finding-neo-logo.svg"
              alt="Finding Neo logo"
              width={20}
              height={20}
              className="h-5 w-5"
              priority
            />
          </span>
          <span className="text-[1.9rem] font-semibold leading-none tracking-tight">Finding Neo</span>
        </Link>
        <div className="rounded-3xl border border-[#4f36b8]/55 bg-[#09022f]/95 p-8 shadow-[0_24px_80px_rgba(8,3,36,0.75)] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/50">
            <svg className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">Link invalid or expired</h1>
          <p className="mt-2 text-sm text-white/70">{message}</p>
          <Link
            href="/"
            className="mt-8 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-[#6d1eea] to-[#7b19dc] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#09022f]"
          >
            Back to landing page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-white"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md bg-[#1a0a62] ring-1 ring-white/10">
          <Image
            src="/img/finding-neo-logo.svg"
            alt="Finding Neo logo"
            width={20}
            height={20}
            className="h-5 w-5"
            priority
          />
        </span>
        <span className="text-[1.9rem] font-semibold leading-none tracking-tight">Finding Neo</span>
      </Link>
      <div className="rounded-3xl border border-[#4f36b8]/55 bg-[#09022f]/95 p-8 shadow-[0_24px_80px_rgba(8,3,36,0.75)] text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/50">
          <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Welcome to Finding Neo!</h1>
        <p className="mt-2 text-sm text-white/70">{message}</p>
        <p className="mt-4 text-xs text-white/50">Redirecting you to your dashboard...</p>
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
