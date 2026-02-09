'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '@/lib/api';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name?.trim() || !email?.trim() || !password) {
      setError('Please fill in name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'super_admin',
      });
      if (data.success) {
        router.push('/admindashboard/userAccount');
        router.refresh();
      } else {
        setError(data.message || 'Failed to create user.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user.');
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
          <h1 className="text-2xl font-bold text-white md:text-3xl">Register new user</h1>
          <p className="mt-2 text-sm text-white/70">
            All accounts created here are Super Admin.
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <p className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/90">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <p className="mt-1.5 text-xs text-white/60">At least 6 characters</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating…' : 'Create user'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-white/70">
            <Link href="/admindashboard/userAccount" className="font-medium text-violet-400 hover:text-violet-300">
              Back to User & Account Management
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
