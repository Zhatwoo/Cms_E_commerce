'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, setStoredUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.success) {
        // Sync current user to localStorage so Storage path and project folder use correct client name
        setStoredUser(data.user ?? null);
        const role = (data.user?.role || '').toLowerCase();
        if (role === 'admin' || role === 'super_admin') {
          router.push('/admindashboard');
        } else {
          router.push('/design');
        }
        router.refresh();
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-white"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[#1a0a62] ring-1 ring-white/10">
            <Image
              src="/img/centric-logo.svg"
              alt="Centric logo"
              width={20}
              height={20}
              className="h-5 w-5"
              priority
            />
          </span>
          <span className="text-[1.9rem] font-semibold leading-none tracking-tight">Centric</span>
        </Link>
        <div className="relative overflow-hidden rounded-3xl border border-[#4f36b8]/55 bg-[#09022f]/95 p-8 shadow-[0_24px_80px_rgba(8,3,36,0.75)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(168,85,247,0.2),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(255,204,0,0.09),transparent_35%)]" />
          <div className="relative z-10">
          <h1 className="text-5xl font-black leading-none text-white">Log in</h1>
          <p className="mt-3 text-base text-white/65">
            Welcome back. Enter your credentials to continue.
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <p className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="email" className="block text-[1.75rem] font-bold text-white/95 leading-none">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="dark-input mt-3 w-full rounded-xl border border-white/25 bg-[#10131d]/85 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:outline-none focus:ring-2 focus:ring-[#8b3dff]/35"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[1.75rem] font-bold text-white/95 leading-none">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="dark-input mt-3 w-full rounded-xl border border-white/25 bg-[#10131d]/85 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:outline-none focus:ring-2 focus:ring-[#8b3dff]/35"
              />
              <Link
                href="/auth/forgotPassword"
                className="mt-3 inline-block text-sm text-[#b88cff] hover:text-[#cfa8ff]"
              >
                forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#6d1eea] to-[#7b19dc] py-3 text-base font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-white/70">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-semibold text-[#b88cff] hover:text-[#cfa8ff]">
              Sign up
            </Link>
          </p>
          </div>
        </div>
    </div>
  );
}
