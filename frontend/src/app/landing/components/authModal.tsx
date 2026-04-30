'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { login, register as apiRegister, resendVerificationEmail, setStoredUser } from '@/lib/api';
import { ModalShell } from '@/components/ModalShell';

type AuthMode = 'login' | 'register' | 'check-email';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  initialEmail?: string;
  isDarkMode?: boolean;
}

export function AuthModal({ isOpen, onClose, initialMode = 'login', initialEmail = '', isDarkMode = false }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  
  // Separate state for login and register to prevent "ghosting" between forms
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  const [pendingEmail, setPendingEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setLoading(false);
      setShowPassword(false);
      setResendMessage(null);
      
      // Reset states and populate with initial data if provided
      setLoginEmail(initialMode === 'login' ? initialEmail : '');
      setLoginPassword('');
      
      setRegName('');
      setRegEmail(initialMode === 'register' ? initialEmail : '');
      setRegPassword('');
      
      if (initialEmail) {
        setPendingEmail(initialEmail);
      } else {
        setPendingEmail('');
      }
    }
  }, [isOpen, initialMode, initialEmail]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginEmail || !loginPassword) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(loginEmail, loginPassword);
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
    if (!regEmail || !regPassword) {
      setError('Please enter email and password.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRegister({ name: regName.trim() || regEmail.split('@')[0], email: regEmail, password: regPassword });
      if (data.success) {
        if (typeof (data as { confirmUrl?: string }).confirmUrl === 'string') {
          sessionStorage.setItem('centric_confirm_url', (data as { confirmUrl: string }).confirmUrl);
        }
        const normalizedEmail = regEmail.trim();
        setPendingEmail(normalizedEmail);
        setResendMessage(null);
        setMode('check-email');
      } else {
        setError(data.message || 'Sign up failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = (pendingEmail || loginEmail || regEmail).trim();
    if (!targetEmail) {
      setResendMessage({ type: 'error', text: 'No email address found.' });
      return;
    }

    setResendMessage(null);
    setResendLoading(true);
    try {
      const data = await resendVerificationEmail(targetEmail);
      if (data.success) {
        setResendMessage({ type: 'success', text: data.message || 'A new confirmation link was sent to your email.' });
      } else {
        setResendMessage({ type: 'error', text: data.message || 'Something went wrong.' });
      }
    } catch {
      setResendMessage({ type: 'error', text: 'Failed to resend. Try again later.' });
    } finally {
      setResendLoading(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-transparent', text: '' };
    if (pass.length < 6) return { score: 1, label: 'Too short', color: 'bg-red-500', text: 'text-red-500' };
    
    let score = 1;
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    
    if (pass.length >= 8 && (hasUpper || hasNumber || hasSpecial)) score = 2;
    if (pass.length >= 10 && ((hasUpper && hasNumber) || (hasUpper && hasSpecial) || (hasNumber && hasSpecial))) score = 3;
    if (pass.length >= 12 && hasUpper && hasNumber && hasSpecial) score = 4;

    switch (score) {
      case 1: return { score: 1, label: 'Weak', color: 'bg-orange-500', text: 'text-orange-500' };
      case 2: return { score: 2, label: 'Normal', color: 'bg-yellow-500', text: 'text-yellow-500' };
      case 3: return { score: 3, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
      case 4: return { score: 4, label: 'Great!', color: 'bg-blue-500', text: 'text-blue-500' };
      default: return { score: 1, label: 'Weak', color: 'bg-orange-500', text: 'text-orange-500' };
    }
  };

  const strength = getPasswordStrength(regPassword);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
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
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className="w-full max-w-md"
          >
            <div className={`relative overflow-hidden rounded-3xl border p-8 ${
              isDarkMode 
                ? 'auth-modal-dark border-[#4f36b8]/55 bg-[#09022f]/95 shadow-[0_24px_80px_rgba(8,3,36,0.75)]' 
                : 'auth-modal-light border-[#c1c1cd] bg-white/95 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
            }`}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(168,85,247,0.2),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(255,204,0,0.09),transparent_35%)]" />

              <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                >
                  <span className={`grid h-7 w-7 place-items-center rounded-md ring-1 ${isDarkMode ? 'bg-[#1a0a62] ring-white/10' : 'bg-white ring-black/10'}`}>
                    <Image
                      src="/img/centric-logo.svg"
                      alt="Centric logo"
                      width={20}
                      height={20}
                      className="h-5 w-5"
                      priority
                    />
                  </span>
                  <span className={`text-[1.9rem] font-semibold leading-none tracking-tight ${isDarkMode ? 'text-white' : 'text-[#120533]'}`}>Centric</span>
                </Link>
                <button
                  onClick={onClose}
                  className={`rounded-lg p-2 transition-colors ${
                    isDarkMode ? 'text-white/65 hover:bg-white/10 hover:text-white' : 'text-[#888899] hover:bg-[#f0f0f4] hover:text-[#120533]'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              {mode !== 'check-email' && (
                <div className="mb-6 flex gap-3 border-b border-white/10">
                  <button
                    onClick={() => { setMode('login'); setError(''); }}
                    className={`pb-3 px-2 text-lg font-semibold transition-colors ${
                      mode === 'login'
                        ? (isDarkMode ? 'text-white border-b-2 border-[#ffcc00]' : 'text-[#120533] border-b-2 border-[#f5a213]')
                        : (isDarkMode ? 'text-white/55 hover:text-white/80' : 'text-[#888899] hover:text-[#120533]')
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setMode('register'); setError(''); }}
                    className={`pb-3 px-2 text-lg font-semibold transition-colors ${
                      mode === 'register'
                        ? (isDarkMode ? 'text-white border-b-2 border-[#ffcc00]' : 'text-[#120533] border-b-2 border-[#f5a213]')
                        : (isDarkMode ? 'text-white/55 hover:text-white/80' : 'text-[#888899] hover:text-[#120533]')
                    }`}
                  >
                    Sign up
                  </button>
                </div>
              )}

              {/* Login Form */}
              {mode === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className={`text-5xl font-black leading-none ${isDarkMode ? 'text-white' : 'text-[#120533]'}`}>Log in</h1>
                  <p className={`mt-3 text-base ${isDarkMode ? 'text-white/65' : 'text-[#616170]'}`}>
                    Welcome back. Enter your credentials to continue.
                  </p>
                  <form className="mt-8 space-y-5" onSubmit={handleLogin}>
                    {error && (
                      <p className={`rounded-lg border px-3 py-2 text-sm ${
                        isDarkMode 
                          ? 'bg-red-500/20 border-red-500/50 text-red-200' 
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        {error}
                      </p>
                    )}
                    <div>
                      <label htmlFor="login-email" className={`block text-[1.75rem] font-bold leading-none ${isDarkMode ? 'text-white/95' : 'text-[#120533]'}`}>
                        Email
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className={`dark-input mt-3 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'border-white/25 bg-[#10131d]/85 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:ring-[#8b3dff]/35' 
                            : 'border-[#c1c1cd] bg-[#f8f8fb] text-[#120533] placeholder:text-[#888899] focus:border-[#8b3dff] focus:ring-[#8b3dff]/35'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="login-password" className={`block text-[1.75rem] font-bold leading-none ${isDarkMode ? 'text-white/95' : 'text-[#120533]'}`}>
                        Password
                      </label>
                      <div className="relative mt-3">
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className={`dark-input w-full rounded-xl border px-4 py-3 pr-12 focus:outline-none focus:ring-2 ${
                            isDarkMode 
                              ? 'border-white/25 bg-[#10131d]/85 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:ring-[#8b3dff]/35' 
                              : 'border-[#c1c1cd] bg-[#f8f8fb] text-[#120533] placeholder:text-[#888899] focus:border-[#8b3dff] focus:ring-[#8b3dff]/35'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                            isDarkMode ? 'text-white/35 hover:text-white/60' : 'text-[#888899] hover:text-[#120533]'
                          }`}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
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
                  <h1 className={`text-4xl font-black leading-none ${isDarkMode ? 'text-white' : 'text-[#120533]'}`}>Create account</h1>
                  <p className={`mt-3 text-base ${isDarkMode ? 'text-white/65' : 'text-[#616170]'}`}>
                    Get started with Centric. Fill in your details below.
                  </p>
                  <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                    {error && (
                      <p className={`rounded-lg border px-3 py-2 text-sm ${
                        isDarkMode 
                          ? 'bg-red-500/20 border-red-500/50 text-red-200' 
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        {error}
                      </p>
                    )}
                    <div>
                      <label htmlFor="reg-name" className={`block text-sm font-semibold ${isDarkMode ? 'text-white/90' : 'text-[#120533]'}`}>
                        Full name
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Jane Doe"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className={`dark-input mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'border-white/25 bg-[#10131d]/85 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:ring-[#8b3dff]/35' 
                            : 'border-[#c1c1cd] bg-[#f8f8fb] text-[#120533] placeholder:text-[#888899] focus:border-[#8b3dff] focus:ring-[#8b3dff]/35'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-email" className={`block text-sm font-semibold ${isDarkMode ? 'text-white/90' : 'text-[#120533]'}`}>
                        Email
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className={`dark-input mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'border-white/25 bg-[#10131d]/85 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:ring-[#8b3dff]/35' 
                            : 'border-[#c1c1cd] bg-[#f8f8fb] text-[#120533] placeholder:text-[#888899] focus:border-[#8b3dff] focus:ring-[#8b3dff]/35'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-password" className={`block text-sm font-semibold ${isDarkMode ? 'text-white/90' : 'text-[#120533]'}`}>
                        Password
                      </label>
                      <div className="relative mt-2">
                        <input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className={`dark-input w-full rounded-xl border px-4 py-3 pr-12 focus:outline-none focus:ring-2 ${
                            isDarkMode 
                              ? 'border-white/25 bg-[#10131d]/85 text-white placeholder:text-white/35 focus:border-[#8b3dff] focus:ring-[#8b3dff]/35' 
                              : 'border-[#c1c1cd] bg-[#f8f8fb] text-[#120533] placeholder:text-[#888899] focus:border-[#8b3dff] focus:ring-[#8b3dff]/35'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                            isDarkMode ? 'text-white/35 hover:text-white/60' : 'text-[#888899] hover:text-[#120533]'
                          }`}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      
                      {/* Password strength indicator */}
                      {regPassword && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${strength.text}`}>
                              {strength.label}
                            </span>
                          </div>
                          <div className={`h-1 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(strength.score / 4) * 100}%` }}
                              className={`h-full transition-all duration-300 ${strength.color}`}
                            />
                          </div>
                        </div>
                      )}

                      {!regPassword && <p className={`mt-1.5 text-xs ${isDarkMode ? 'text-white/60' : 'text-[#888899]'}`}>At least 6 characters</p>}
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

              {/* Check Email */}
              {mode === 'check-email' && (
                <motion.div
                  key="check-email"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-violet-500/50 bg-violet-500/20">
                    <svg className="h-7 w-7 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className={`mt-6 text-4xl font-black leading-none ${isDarkMode ? 'text-white' : 'text-[#120533]'}`}>Check your email</h1>
                  <p className={`mt-3 text-sm ${isDarkMode ? 'text-white/70' : 'text-[#616170]'}`}>
                    We sent a confirmation link to
                    <span className={`block mt-1 font-medium ${isDarkMode ? 'text-white/90' : 'text-[#120533]'}`}>{pendingEmail || loginEmail || regEmail || 'your email address'}</span>
                    Click the link to confirm your account, then you can log in.
                  </p>
                  <p className={`mt-4 text-xs ${isDarkMode ? 'text-white/60' : 'text-[#888899]'}`}>Didn&apos;t get the email? Check your spam folder.</p>

                  {resendMessage && (
                    <p className={`mt-4 text-sm font-medium ${
                      resendMessage.type === 'success' 
                        ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-700')
                        : (isDarkMode ? 'text-red-400' : 'text-red-700')
                    }`} role="alert">
                      {resendMessage.text}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || !(pendingEmail || loginEmail || regEmail)}
                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#6d1eea] to-[#7b19dc] py-3 text-base font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resendLoading ? 'Sending…' : 'Resend email'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setResendMessage(null);
                    }}
                    className="mt-4 inline-block w-full text-center text-sm font-medium text-violet-300 hover:text-violet-200"
                  >
                    Go back to login
                  </button>
                </motion.div>
              )}
              </div>
            </div>
          </motion.div>
    </ModalShell>
  );
}
