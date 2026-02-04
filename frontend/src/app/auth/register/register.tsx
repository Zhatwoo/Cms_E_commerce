'use client';

import Link from 'next/link';

export default function RegisterPage() {
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
          <h1 className="text-2xl font-bold text-white md:text-3xl">Create account</h1>
          <p className="mt-2 text-sm text-white/70">
            Get started with Mercato. Fill in your details below.
          </p>
          <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/90">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <p className="mt-1.5 text-xs text-white/60">At least 8 characters</p>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/95"
            >
              Create account
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-white/70">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-violet-400 hover:text-violet-300">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
