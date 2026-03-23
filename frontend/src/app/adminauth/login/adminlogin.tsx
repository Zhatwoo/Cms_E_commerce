'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, logout, setStoredUser } from '@/lib/api';

function resolveAdminRedirectPath(nextParam: string | null): string {
	if (!nextParam) return '/admindashboard';
	return nextParam.startsWith('/admindashboard') ? nextParam : '/admindashboard';
}

function Particle({ style }: { style: React.CSSProperties }) {
	return <div className="al-particle" style={style} />;
}

export default function AdminLogin() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [shake, setShake] = useState(false);

	useEffect(() => { setMounted(true); }, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!email?.trim() || !password) {
			setError('Please enter email and password.');
			setShake(true);
			setTimeout(() => setShake(false), 600);
			return;
		}

		setLoading(true);
		try {
			const data = await login(email.trim().toLowerCase(), password);

			if (data.success && data.user) {
				const role = (data.user.role || '').toLowerCase();
				if (role !== 'admin' && role !== 'super_admin') {
					await logout();
					setError('This page is for admin accounts only.');
					setShake(true);
					setTimeout(() => setShake(false), 600);
					setLoading(false);
					return;
				}

				setStoredUser({
					id: data.user.id,
					name: data.user.name ?? data.user.email,
					email: data.user.email ?? '',
					role: data.user.role,
				});

				const nextParam = searchParams.get('next');
				router.push(resolveAdminRedirectPath(nextParam));
				router.refresh();
			} else {
				setError(data.message || 'Login failed.');
				setShake(true);
				setTimeout(() => setShake(false), 600);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed.');
			setShake(true);
			setTimeout(() => setShake(false), 600);
		} finally {
			setLoading(false);
		}
	};

	const particles = Array.from({ length: 14 }, (_, i) => ({
		width: `${Math.random() * 5 + 2}px`,
		height: `${Math.random() * 5 + 2}px`,
		left: `${Math.random() * 100}%`,
		top: `${Math.random() * 100}%`,
		animationDelay: `${Math.random() * 6}s`,
		animationDuration: `${Math.random() * 8 + 6}s`,
		opacity: Math.random() * 0.25 + 0.08,
	}));

	return (
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

				* { box-sizing: border-box; }

				.al-shell {
					font-family: 'DM Sans', sans-serif;
					background: #f5f3ff;
					min-height: 100dvh;
					position: relative;
					overflow: hidden;
				}

				.al-grid {
					position: absolute;
					inset: 0;
					background-image: radial-gradient(circle, rgba(103,2,191,0.12) 1px, transparent 1px);
					background-size: 28px 28px;
					mask-image: radial-gradient(ellipse 85% 85% at 50% 50%, black 20%, transparent 100%);
				}

				.al-orb-1 {
					position: absolute;
					top: -140px; left: -100px;
					width: 520px; height: 520px;
					border-radius: 50%;
					background: radial-gradient(circle, rgba(166,61,255,0.22) 0%, transparent 68%);
					filter: blur(50px);
					animation: al-orb1 13s ease-in-out infinite alternate;
				}
				.al-orb-2 {
					position: absolute;
					bottom: -120px; right: -80px;
					width: 460px; height: 460px;
					border-radius: 50%;
					background: radial-gradient(circle, rgba(255,172,39,0.18) 0%, transparent 68%);
					filter: blur(55px);
					animation: al-orb2 15s ease-in-out infinite alternate;
				}
				.al-orb-3 {
					position: absolute;
					top: 40%; left: 50%;
					transform: translateX(-50%);
					width: 340px; height: 340px;
					border-radius: 50%;
					background: radial-gradient(circle, rgba(179,103,96,0.12) 0%, transparent 68%);
					filter: blur(65px);
					animation: al-orb3 11s ease-in-out infinite alternate;
				}

				@keyframes al-orb1 {
					from { transform: translate(0,0) scale(1); }
					to   { transform: translate(40px,30px) scale(1.1); }
				}
				@keyframes al-orb2 {
					from { transform: translate(0,0) scale(1); }
					to   { transform: translate(-30px,-20px) scale(1.08); }
				}
				@keyframes al-orb3 {
					from { transform: translateX(-50%) scale(1); opacity: .7; }
					to   { transform: translateX(-50%) scale(1.2); opacity: 1; }
				}

				.al-particle {
					position: absolute;
					border-radius: 50%;
					background: rgba(103,2,191,0.55);
					animation: al-float linear infinite;
				}
				@keyframes al-float {
					0%   { transform: translateY(0) scale(1); opacity: 0; }
					10%  { opacity: 1; }
					90%  { opacity: .4; }
					100% { transform: translateY(-100vh) scale(.5); opacity: 0; }
				}

				.al-card {
					background: rgba(255,255,255,0.82);
    				border: 1px solid rgba(166,61,255,0.14);
   			 		border-radius: 28px;
    				backdrop-filter: blur(20px);
    				box-shadow:
        				0 0 0 1px rgba(166,61,255,0.06),
        				0 24px 56px rgba(103,2,191,0.1),
        				0 4px 16px rgba(103,2,191,0.06),
       					inset 0 1px 0 rgba(255,255,255,0.9);
					padding: 48px 44px;
					position: relative;
					overflow: hidden;
					transition: box-shadow .3s ease;
					max-width: 480px;
					width: 100%;
					margin: 0 auto;
				}
					
				.al-card::before {
					content: '';
					position: absolute;
					top: 0; left: 0; right: 0;
					height: 1px;
					background: linear-gradient(90deg, transparent, rgba(166,61,255,0.35), rgba(255,172,39,0.25), transparent);
				}
				.al-card-glow {
					position: absolute;
					top: -60%; left: 50%;
					transform: translateX(-50%);
					width: 220px; height: 220px;
					background: radial-gradient(circle, rgba(166,61,255,0.06) 0%, transparent 70%);
					pointer-events: none;
				}

				.al-badge {
					display: inline-flex;
					align-items: center;
					gap: 6px;
					background: rgba(103,2,191,0.07);
					border: 1px solid rgba(166,61,255,0.2);
					border-radius: 100px;
					padding: 5px 14px 5px 8px;
					margin-bottom: 28px;
				}
				.al-badge-dot {
					width: 8px; height: 8px;
					border-radius: 50%;
					background: #8B1FE8;
					box-shadow: 0 0 8px rgba(166,61,255,0.6);
					animation: al-pulse 2s ease-in-out infinite;
				}
				@keyframes al-pulse {
					0%,100% { box-shadow: 0 0 8px rgba(166,61,255,.6); transform: scale(1); }
					50%     { box-shadow: 0 0 16px rgba(166,61,255,.9); transform: scale(1.2); }
				}
				.al-badge-text {
					font-size: 11px; font-weight: 600;
					letter-spacing: .09em; text-transform: uppercase;
					color: #8B1FE8;
				}

				.al-title {
					font-family: 'Outfit', sans-serif;  /* was 'Syne' */
					font-size: 2.5rem; font-weight: 800;
					line-height: 1; letter-spacing: -.03em;
					background: linear-gradient(135deg, #2d0060 0%, #7b1de8 50%, #A63DFF 100%);
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
					margin-bottom: 8px;
				}
				.al-subtitle {
					font-size: .92rem;
					color: #9e90c4;
					font-weight: 400;
					letter-spacing: .01em;
					margin-bottom: 32px;
				}
				.al-divider {
					height: 1px;
					background: linear-gradient(90deg, transparent, rgba(166,61,255,0.12), transparent);
					margin-bottom: 32px;
				}

				.al-field { position: relative; margin-bottom: 18px; }
				.al-label {
					display: block;
					font-size: 11px; font-weight: 700;
					letter-spacing: .1em; text-transform: uppercase;
					color: #a07ad0;
					margin-bottom: 7px; padding-left: 4px;
					transition: color .2s;
				}
				.al-field:focus-within .al-label { color: #7b1de8; }

				.al-input-wrap { position: relative; }
				.al-input-icon {
					position: absolute;
					left: 16px; top: 50%;
					transform: translateY(-50%);
					color: #c4a8e8;
					transition: color .2s;
					pointer-events: none;
				}
				.al-field:focus-within .al-input-icon { color: #8B1FE8; }

				.al-input {
					width: 100%; height: 52px;
					background: rgba(255,255,255,0.9);
					border: 1.5px solid rgba(166,61,255,0.18);
					border-radius: 14px;
					padding: 0 44px;
					font-size: .95rem;
					color: #2d1a50;
					outline: none;
					font-family: 'DM Sans', sans-serif;
					transition: border-color .2s, background .2s, box-shadow .2s;
					box-shadow: 0 1px 3px rgba(103,2,191,0.04), inset 0 1px 2px rgba(103,2,191,0.02);
				}
				.al-input::placeholder { color: #c0b0d8; }
				.al-input:focus {
					border-color: rgba(139,31,232,0.5);
					background: #ffffff;
					box-shadow: 0 0 0 3px rgba(166,61,255,0.1), 0 1px 3px rgba(103,2,191,0.06);
				}
				.al-input:not(:placeholder-shown) { border-color: rgba(166,61,255,0.28); }

				.al-eye-btn {
					position: absolute;
					right: 14px; top: 50%;
					transform: translateY(-50%);
					background: none; border: none; cursor: pointer;
					color: #c4a8e8; padding: 4px; border-radius: 8px;
					transition: color .2s, background .2s;
					display: flex; align-items: center; justify-content: center;
				}
				.al-eye-btn:hover { color: #8B1FE8; background: rgba(166,61,255,0.08); }

				.al-row {
					display: flex; align-items: center; justify-content: space-between;
					margin: 4px 0 28px;
				}
				.al-remember {
					display: flex; align-items: center; gap: 8px;
					cursor: pointer; user-select: none;
				}
				.al-checkbox {
					width: 18px; height: 18px;
					appearance: none;
					border: 1.5px solid rgba(166,61,255,0.3);
					border-radius: 5px;
					background: rgba(255,255,255,0.9);
					cursor: pointer; position: relative;
					transition: all .2s; flex-shrink: 0;
				}
				.al-checkbox:checked {
					background: #8B1FE8; border-color: #8B1FE8;
					box-shadow: 0 0 10px rgba(139,31,232,0.35);
				}
				.al-checkbox:checked::after {
					content: '';
					position: absolute;
					left: 4px; top: 1px;
					width: 6px; height: 10px;
					border: 2px solid white;
					border-top: none; border-left: none;
					transform: rotate(45deg);
				}
				.al-remember-text { font-size: 13px; color: #9e90c4; font-weight: 400; }

				.al-forgot {
					font-size: 13px; font-weight: 600;
					color: #8B1FE8; text-decoration: none;
					transition: color .2s; position: relative;
				}
				.al-forgot::after {
					content: ''; position: absolute;
					bottom: -1px; left: 0; width: 0; height: 1px;
					background: #8B1FE8; transition: width .2s;
				}
				.al-forgot:hover { color: #6702BF; }
				.al-forgot:hover::after { width: 100%; }

				.al-submit {
					width: 100%; height: 52px; border: none;
					border-radius: 14px;
					background: linear-gradient(135deg, #7b1de8 0%, #A63DFF 100%);
					color: #fff;
					font-family: 'Outfit', sans-serif;
					font-size: 1rem; font-weight: 700;
					letter-spacing: .05em; text-transform: uppercase;
					cursor: pointer; position: relative; overflow: hidden;
					transition: transform .15s, box-shadow .2s, opacity .2s;
					box-shadow: 0 8px 24px rgba(139,31,232,0.3), 0 0 0 1px rgba(166,61,255,0.2);
				}
				.al-submit::before {
					content: ''; position: absolute; inset: 0;
					background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%);
					pointer-events: none;
				}
				.al-submit:hover:not(:disabled) {
					transform: translateY(-1px);
					box-shadow: 0 12px 32px rgba(139,31,232,0.38), 0 0 0 1px rgba(166,61,255,0.25);
				}
				.al-submit:active:not(:disabled) { transform: translateY(0); }
				.al-submit:disabled { opacity: .55; cursor: not-allowed; }

				.al-submit-inner {
					position: relative;
					display: flex; align-items: center; justify-content: center; gap: 8px;
				}
				.al-spinner {
					width: 18px; height: 18px;
					border: 2px solid rgba(255,255,255,0.3);
					border-top-color: #fff;
					border-radius: 50%;
					animation: al-spin .7s linear infinite;
				}
				@keyframes al-spin { to { transform: rotate(360deg); } }

				.al-error {
					display: flex; align-items: flex-start; gap: 10px;
					background: rgba(220,38,38,0.06);
					border: 1px solid rgba(220,38,38,0.18);
					border-radius: 12px;
					padding: 12px 14px; margin-bottom: 20px;
					animation: al-slide-in .25s ease;
				}
				@keyframes al-slide-in {
					from { opacity: 0; transform: translateY(-6px); }
					to   { opacity: 1; transform: translateY(0); }
				}
				.al-error-icon { flex-shrink: 0; width: 18px; height: 18px; color: #dc2626; margin-top: 1px; }
				.al-error-text { font-size: 13px; color: #b91c1c; line-height: 1.5; }

				.al-footer {
					margin-top: 28px; text-align: center;
					font-size: 13.5px; color: #a09abf;
				}
				.al-footer a {
					color: #7b1de8; font-weight: 700; text-decoration: none; transition: opacity .2s;
				}
				.al-footer a:hover { opacity: .75; }

				.al-logo-wrap {
					display: inline-flex; align-items: center; gap: 10px;
					margin-bottom: 32px; text-decoration: none;
				}
				.al-logo-text {
					font-family: 'Outfit', sans-serif;  /* was 'Syne' */
					font-size: 1.7rem; font-weight: 800;
					background: linear-gradient(90deg, #6702BF 0%, #B36760 52%, #FFAC27 100%);
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
					letter-spacing: -.02em; line-height: 1;
				}

				.al-mount {
					opacity: 0; transform: translateY(24px);
					animation: al-mount-in .5s cubic-bezier(.34,1.2,.64,1) forwards;
					animation-delay: .1s;
				}
				@keyframes al-mount-in { to { opacity: 1; transform: translateY(0); } }

				.al-shake { animation: al-shake-anim .5s cubic-bezier(.36,.07,.19,.97); }
				@keyframes al-shake-anim {
					10%,90% { transform: translateX(-2px); }
					20%,80% { transform: translateX(4px); }
					30%,50%,70% { transform: translateX(-4px); }
					40%,60% { transform: translateX(4px); }
				}

				@media (max-width: 480px) {
					.al-card { padding: 32px 24px; border-radius: 22px; }
					.al-title { font-size: 2rem; }
				}
			`}</style>

			<div className="al-shell">
				<div className="al-grid" aria-hidden="true" />
				<div className="al-orb-1" aria-hidden="true" />
				<div className="al-orb-2" aria-hidden="true" />
				<div className="al-orb-3" aria-hidden="true" />

				{mounted && particles.map((p, i) => (
					<Particle key={i} style={p as React.CSSProperties} />
				))}

				<div style={{
					position: 'relative', zIndex: 10,
					display: 'flex', minHeight: '100dvh',
					alignItems: 'center', justifyContent: 'center',
					padding: '32px 16px',
					boxSizing: 'border-box',
				}}>
					<div style={{ width: '100%', maxWidth: '480px', flexShrink: 0 }} className={mounted ? 'al-mount' : ''}>

						<Link href="/" className="al-logo-wrap">
							<Image src="/lggo%201.svg" alt="Centric" width={36} height={36} priority style={{ width: 36, height: 'auto' }} />
							<span className="al-logo-text">Centric</span>
						</Link>

						<div className={`al-card ${shake ? 'al-shake' : ''}`}>
							<div className="al-card-glow" aria-hidden="true" />

							<div className="al-badge">
								<div className="al-badge-dot" />
								<span className="al-badge-text">Admin Portal</span>
							</div>

							<h1 className="al-title">Welcome Back!</h1>
							<p className="al-subtitle">Sign in to access your dashboard</p>
							<div className="al-divider" />

							<form onSubmit={handleSubmit} noValidate>
								{error && (
									<div className="al-error" role="alert">
										<svg className="al-error-icon" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
										</svg>
										<span className="al-error-text">{error}</span>
									</div>
								)}

								<div className="al-field">
									<label htmlFor="email" className="al-label">Email address</label>
									<div className="al-input-wrap">
										<svg className="al-input-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
											<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
											<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
										</svg>
										<input
											id="email" type="email" className="al-input"
											autoComplete="email" placeholder="admin@example.com"
											value={email} onChange={(e) => setEmail(e.target.value)}
										/>
									</div>
								</div>

								<div className="al-field">
									<label htmlFor="password" className="al-label">Password</label>
									<div className="al-input-wrap">
										<svg className="al-input-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
										</svg>
										<input
											id="password"
											type={showPassword ? 'text' : 'password'}
											className="al-input"
											autoComplete="current-password"
											placeholder="Enter your password"
											value={password} onChange={(e) => setPassword(e.target.value)}
										/>
										<button type="button" className="al-eye-btn"
											onClick={() => setShowPassword((p) => !p)}
											aria-label={showPassword ? 'Hide password' : 'Show password'}
										>
											{showPassword ? (
												<svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
													<path d="M13.875 13.875A7.07 7.07 0 0110 15c-3.95 0-6.75-1.75-8.25-4.5 .75-1.38 1.84-2.5 3.125-3.25M6.35 6.35A7.08 7.08 0 0110 5.5c3.95 0 6.75 1.75 8.25 4.5-.55 1-1.33 1.9-2.3 2.6M10 7.85a2.15 2.15 0 11.01 4.3M3 3l14 14" strokeLinecap="round" />
												</svg>
											) : (
												<svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
													<path d="M1.75 10c1.5-2.75 4.3-4.5 8.25-4.5S16.75 7.25 18.25 10c-1.5 2.75-4.3 4.5-8.25 4.5S3.25 12.75 1.75 10Z" />
													<circle cx="10" cy="10" r="2.15" />
												</svg>
											)}
										</button>
									</div>
								</div>

								<div className="al-row">
									<label className="al-remember">
										<input type="checkbox" className="al-checkbox"
											checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
										<span className="al-remember-text">Remember me</span>
									</label>
									<Link href="/auth/forgotPassword" className="al-forgot">Forgot password?</Link>
								</div>

								<button type="submit" className="al-submit" disabled={loading}>
									<span className="al-submit-inner">
										{loading ? (
											<><span className="al-spinner" />Signing in...</>
										) : (
											<>
												Sign In
												<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
													<path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
												</svg>
											</>
										)}
									</span>
								</button>
							</form>

							<div className="al-footer">
								Don&apos;t have an account?{' '}
								<Link href="/adminauth/register">Register</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}