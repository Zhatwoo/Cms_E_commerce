'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, register as apiRegister, setStoredUser } from '@/lib/api';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleLogin = async (e: React.FormEvent) => {
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
        setStoredUser(data.user ?? null);
        onClose();
        if (data.user?.role === 'super_admin') {
          router.push('/auth/confirm');
        } else {
          router.push('/m_dashboard');
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

  const handleRegister = async (e: React.FormEvent) => {
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
        onClose();
        router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className="fixed z-50 w-full max-w-md left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative overflow-hidden rounded-3xl border border-[#4f36b8]/55 bg-[#09022f]/95 p-8 shadow-[0_24px_80px_rgba(8,3,36,0.75)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(168,85,247,0.2),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(255,204,0,0.09),transparent_35%)]" />

              <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-white"
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
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="mb-6 flex gap-3 border-b border-white/10">
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`pb-3 px-2 text-lg font-semibold transition-colors ${
                    mode === 'login'
                      ? 'text-white border-b-2 border-[#ffcc00]'
                      : 'text-white/55 hover:text-white/80'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`pb-3 px-2 text-lg font-semibold transition-colors ${
                    mode === 'register'
                      ? 'text-white border-b-2 border-[#ffcc00]'
                      : 'text-white/55 hover:text-white/80'
                  }`}
                >
                  Sign up
                </button>
              </div>

              {/* Login Form */}
              {mode === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-5xl font-black leading-none text-white">Log in</h1>
                  <p className="mt-3 text-base text-white/65">
                    Welcome back. Enter your credentials to continue.
                  </p>
                  <form className="mt-8 space-y-5" onSubmit={handleLogin}>
                    {error && (
                      <p className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-200">
                        {error}
                      </p>
                    )}
                    <div>
                      <label htmlFor="login-email" className="block text-[1.75rem] font-bold text-white/95 leading-none">
                        Email
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="dark-input mt-3 w-full rounded-xl border border-white/25 bg-[#10131d]/85 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:outline-none focus:ring-2 focus:ring-[#8b3dff]/35"
                      />
                    </div>
                    <div>
                      <label htmlFor="login-password" className="block text-[1.75rem] font-bold text-white/95 leading-none">
                        Password
                      </label>
                      <input
                        id="login-password"
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
                </motion.div>
              )}

              {/* Register Form */}
              {mode === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-4xl font-black leading-none text-white">Create account</h1>
                  <p className="mt-3 text-base text-white/65">
                    Get started with Centric. Fill in your details below.
                  </p>
                  <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                    {error && (
                      <p className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-200">
                        {error}
                      </p>
                    )}
                    <div>
                      <label htmlFor="reg-name" className="block text-sm font-semibold text-white/90">
                        Full name
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="dark-input mt-2 w-full rounded-xl border border-white/25 bg-[#10131d]/85 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:outline-none focus:ring-2 focus:ring-[#8b3dff]/35"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-email" className="block text-sm font-semibold text-white/90">
                        Email
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="dark-input mt-2 w-full rounded-xl border border-white/25 bg-[#10131d]/85 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:outline-none focus:ring-2 focus:ring-[#8b3dff]/35"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-password" className="block text-sm font-semibold text-white/90">
                        Password
                      </label>
                      <input
                        id="reg-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="dark-input mt-2 w-full rounded-xl border border-white/25 bg-[#10131d]/85 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:outline-none focus:ring-2 focus:ring-[#8b3dff]/35"
                      />
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
                </motion.div>
              )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
