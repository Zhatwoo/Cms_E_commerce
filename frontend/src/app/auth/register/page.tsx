'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { register as apiRegister } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRegister({ name: name.trim() || email.split('@')[0], email, password });
      if (data.success) {
        if (typeof (data as { confirmUrl?: string }).confirmUrl === 'string') {
          sessionStorage.setItem('centric_confirm_url', (data as { confirmUrl: string }).confirmUrl);
        }
        router.push(`/?auth=check-email&email=${encodeURIComponent(email)}`);
        router.refresh();
      } else {
        setError(data.message || 'Sign up failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.');
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
          <h1 className="text-4xl font-black leading-none text-white">Create account</h1>
          <p className="mt-3 text-base text-white/65">
            Get started with Centric. Fill in your details below.
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <p className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white/90">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="dark-input mt-2 w-full rounded-xl border border-white/25 bg-[#10131d]/85 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:outline-none focus:ring-2 focus:ring-[#8b3dff]/35"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white/90">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="dark-input mt-2 w-full rounded-xl border border-white/25 bg-[#10131d]/85 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:outline-none focus:ring-2 focus:ring-[#8b3dff]/35"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white/90">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="dark-input w-full rounded-xl border border-white/25 bg-[#10131d]/85 px-4 py-3 pr-12 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:outline-none focus:ring-2 focus:ring-[#8b3dff]/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-white/60">At least 6 characters</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#6d1eea] to-[#7b19dc] py-3 text-base font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-white/70">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-[#b88cff] hover:text-[#cfa8ff]">
              Log in
            </Link>
          </p>
          </div>
        </div>
    </div>
  );
}
