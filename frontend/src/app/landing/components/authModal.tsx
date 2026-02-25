'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        const role = (data.user?.role || '').toLowerCase();
        if (role === 'admin' || role === 'super_admin') {
          router.push('/admindashboard');
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
          sessionStorage.setItem('mercato_confirm_url', (data as { confirmUrl: string }).confirmUrl);
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
            <div className="rounded-2xl border border-white/10 bg-[#0a0d14] p-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <Link
                  href="/"
                  className="inline-block text-2xl font-medium tracking-wide text-white"
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                >
                  Mercato
                </Link>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-white/10">
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`pb-3 px-2 text-sm font-medium transition-colors ${
                    mode === 'login'
                      ? 'text-white border-b-2 border-white'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`pb-3 px-2 text-sm font-medium transition-colors ${
                    mode === 'register'
                      ? 'text-white border-b-2 border-white'
                      : 'text-white/60 hover:text-white/80'
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
                  <h1 className="text-2xl font-bold text-white md:text-3xl">Log in</h1>
                  <p className="mt-2 text-sm text-white/70">
                    Welcome back. Enter your credentials to continue.
                  </p>
                  <form className="mt-8 space-y-5" onSubmit={handleLogin}>
                    {error && (
                      <p className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-200">
                        {error}
                      </p>
                    )}
                    <div>
                      <label htmlFor="login-email" className="block text-sm font-medium text-white/90">
                        Email
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="login-password" className="block text-sm font-medium text-white/90">
                        Password
                      </label>
                      <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                      <Link
                        href="/auth/forgotPassword"
                        className="mt-3 inline-block text-sm text-violet-400 hover:text-violet-300"
                      >
                        forgot password?
                      </Link>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/95 disabled:opacity-60 disabled:cursor-not-allowed"
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
                  <h1 className="text-2xl font-bold text-white md:text-3xl">Create account</h1>
                  <p className="mt-2 text-sm text-white/70">
                    Get started with Mercato. Fill in your details below.
                  </p>
                  <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                    {error && (
                      <p className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-200">
                        {error}
                      </p>
                    )}
                    <div>
                      <label htmlFor="reg-name" className="block text-sm font-medium text-white/90">
                        Full name
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-email" className="block text-sm font-medium text-white/90">
                        Email
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900/80 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-password" className="block text-sm font-medium text-white/90">
                        Password
                      </label>
                      <input
                        id="reg-password"
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
                      {loading ? 'Creating account…' : 'Create account'}
                    </button>
                  </form>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
