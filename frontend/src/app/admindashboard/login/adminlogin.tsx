'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, setStoredUser } from '@/lib/api';

export default function AdminLogin() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!email?.trim() || !password) {
			setError('Please enter email and password.');
			return;
		}

		setLoading(true);
		try {
			const data = await login(email.trim().toLowerCase(), password);

			if (data.success && data.user) {
				setStoredUser({
					id: data.user.id,
					name: data.user.name ?? data.user.email,
					email: data.user.email ?? '',
					role: data.user.role,
				});

				const role = (data.user.role || '').toLowerCase();
				if (role !== 'admin' && role !== 'super_admin') {
					setError('This page is for admin accounts only.');
					setLoading(false);
					return;
				}

				router.push('/admindashboard');
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
		<div className="admin-dashboard-shell relative min-h-screen overflow-hidden px-4 py-8 sm:py-14">
			<div className="pointer-events-none absolute inset-0">
				<div className="admin-dashboard-bg-spot-1 absolute left-[-4rem] top-[-3rem] h-56 w-56 rounded-full blur-3xl" />
				<div className="admin-dashboard-bg-spot-2 absolute bottom-[-4rem] right-[-3rem] h-64 w-64 rounded-full blur-3xl" />
			</div>

			<div className="relative mx-auto w-full max-w-[540px]">
				<Link href="/" className="mb-6 inline-flex items-center gap-2.5">
					<Image
						src="/lggo%201.svg"
						alt="Centric"
						width={38}
						height={38}
						priority
						className="h-auto w-[38px]"
					/>
					<span className="bg-[linear-gradient(90deg,#6702BF_0%,#B36760_52%,#FFAC27_100%)] bg-clip-text text-[2.35rem] font-extrabold leading-none tracking-[-0.03em] text-transparent">
						Centric
					</span>
				</Link>

				<div className="admin-dashboard-panel rounded-[30px] border border-[rgba(177,59,255,0.2)] bg-[#f4f2ff] p-7 shadow-[0_14px_34px_rgba(123,78,192,0.2)] sm:p-8 md:px-10">
					<h1 className="text-center text-[1.5rem] font-extrabold leading-none tracking-[-0.02em] text-[#A63DFF] sm:text-[2rem]">
						LOGIN
					</h1>
					<p className="mt-3 text-center text-[1.06rem] text-[#8C8AA8]">
						Welcome back. Enter your credentials to continue.
					</p>

					<form className="mt-10 space-y-6" onSubmit={handleSubmit}>
						{error && (
							<p className="rounded-xl border border-red-300/70 bg-red-100/70 px-3 py-2 text-sm text-red-700">
								{error}
							</p>
						)}

						<div className="relative">
							<label htmlFor="email" className="pointer-events-none absolute left-5 top-0 z-20 -translate-y-1/2 bg-[#f4f2ff] px-2 text-xs font-medium leading-none text-[#C085FF]">
								Email
							</label>
							<input
								id="email"
								type="email"
								autoComplete="email"
								placeholder="Enter your Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="admin-dashboard-panel-soft h-12 w-full rounded-xl border border-[rgba(177,59,255,0.34)] bg-[#f9f7ff] px-6 text-base text-[#6a6386] outline-none placeholder:text-[#9893b0] focus:border-[#a63dff]"
							/>
						</div>

						<div>
							<div className="relative">
								<label htmlFor="password" className="pointer-events-none absolute left-5 top-0 z-20 -translate-y-1/2 bg-[#f4f2ff] px-2 text-xs font-medium leading-none text-[#C085FF]">
									Password
								</label>
								<input
									id="password"
									type={showPassword ? 'text' : 'password'}
									autoComplete="current-password"
									placeholder="Enter your Password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="admin-dashboard-panel-soft h-12 w-full rounded-xl border border-[rgba(177,59,255,0.34)] bg-[#f9f7ff] px-6 pr-12 text-base text-[#6a6386] outline-none placeholder:text-[#9893b0] focus:border-[#a63dff]"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((prev) => !prev)}
									className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A63DFF] transition hover:opacity-70"
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									<svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
										<path d="M1.75 10c1.5-2.75 4.3-4.5 8.25-4.5s6.75 1.75 8.25 4.5c-1.5 2.75-4.3 4.5-8.25 4.5S3.25 12.75 1.75 10Z" />
										<circle cx="10" cy="10" r="2.15" />
									</svg>
								</button>
							</div>
							<div className="mt-2 flex justify-end">
								<Link href="/auth/forgotPassword" className="text-xs font-medium text-[#A63DFF] transition hover:opacity-75">
									Forgot password?
								</Link>
							</div>
						</div>

						<label className="flex items-center gap-2 text-sm text-[#A04CFF]">
							<input
								type="checkbox"
								checked={rememberMe}
								onChange={(e) => setRememberMe(e.target.checked)}
								className="h-4 w-4 rounded border-[rgba(166,61,255,0.5)] accent-[#A63DFF]"
							/>
							Remember Me
						</label>

						<button
							type="submit"
							disabled={loading}
							className="w-full rounded-2xl bg-[#ffcc00] py-3 text-[1.05rem] font-bold leading-none text-[#1B1A55] shadow-[0_8px_20px_rgba(255,204,0,0.45)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-65"
						>
							{loading ? 'Signing in...' : 'Login'}
						</button>
					</form>

					<div className="mt-6 flex justify-center text-sm">
						<p className="text-[#A63DFF]">
							Don&apos;t have an Account?{' '}
							<Link href="/admindashboard/register" className="font-semibold text-[#ffcc00] underline decoration-[#ffcc00]/70 underline-offset-2 hover:opacity-80">
								Register
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
