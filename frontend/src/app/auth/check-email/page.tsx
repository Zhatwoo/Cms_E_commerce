'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

const CONFIRM_URL_KEY = 'mercato_confirm_url';

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = typeof window !== 'undefined' ? sessionStorage.getItem(CONFIRM_URL_KEY) : null;
    if (url) {
      setConfirmUrl(url);
      sessionStorage.removeItem(CONFIRM_URL_KEY);
    }
  }, []);

  const copyLink = () => {
    if (!confirmUrl) return;
    navigator.clipboard.writeText(confirmUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20 border border-violet-500/50">
          <svg className="h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Check your email</h1>
        <p className="mt-2 text-sm text-white/70">
          We sent a confirmation link to
          {email ? (
            <span className="block mt-1 font-medium text-white/90">{email}</span>
          ) : (
            ' your email address'
          )}.
          Click the link to confirm your account, then you can log in.
        </p>
        <p className="mt-4 text-xs text-white/60">
          Didn’t get the email? Check your spam folder.
        </p>

        {confirmUrl && (
          <div className="mt-6 rounded-lg border border-white/20 bg-white/5 p-4 text-left">
            <p className="text-xs text-white/70 mb-2">No email? Use this link to confirm (dev):</p>
            <div className="flex gap-2">
              <a
                href={confirmUrl}
                className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-violet-500"
              >
                Open confirmation link
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-lg border border-white/30 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        )}

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

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0d14] p-8 animate-pulse">
          <div className="h-8 w-3/4 bg-white/10 rounded mx-auto" />
          <div className="h-4 w-full bg-white/10 rounded mt-4" />
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
