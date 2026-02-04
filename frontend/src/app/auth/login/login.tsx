'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!auth) {
      setError('Firebase is not configured. Check your .env.local.');
      return;
    }
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/m_dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'code' in err
        ? (err as { code: string }).code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : (err as { message?: string }).message ?? 'Login failed.'
        : 'Login failed.';
      setError(message);
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
          <h1 className="text-2xl font-bold text-white md:text-3xl">Log in</h1>
          <p className="mt-2 text-sm text-white/70">
            Welcome back. Enter your credentials to continue.
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <p className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-200">
                {error}
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
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-white/90">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-violet-400 hover:text-violet-300"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-white/70">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-medium text-violet-400 hover:text-violet-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
