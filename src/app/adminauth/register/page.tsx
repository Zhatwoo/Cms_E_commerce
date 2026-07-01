'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerAdmin, setStoredUser } from '@/lib/api';

function Particle({ style }: { style: React.CSSProperties }) {
	return <div className="ar-particle" style={style} />;
}

export default function AdminRegisterPage() {
	const router = useRouter();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [shake, setShake] = useState(false);
	const [passwordStrength, setPasswordStrength] = useState(0);

	useEffect(() => { setMounted(true); }, []);

	useEffect(() => {
		if (!password) { setPasswordStrength(0); return; }
		let score = 0;
		if (password.length >= 6) score++;
		if (password.length >= 10) score++;
		if (/[A-Z]/.test(password)) score++;
		if (/[0-9]/.test(password)) score++;
		if (/[^A-Za-z0-9]/.test(password)) score++;
		setPasswordStrength(score);
	}, [password]);

	const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength];
	const strengthColor = ['', '#ef4444', '#f97316', '#ca8a04', '#16a34a', '#7b1de8'][passwordStrength];

	const triggerShake = () => {
		setShake(true);
		setTimeout(() => setShake(false), 600);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		if (!name?.trim() || !email?.trim() || !password) {
			setError('Please fill in name, email, and password.');
			triggerShake(); return;
		}
		if (password.length < 6) {
			setError('Password must be at least 6 characters.');
			triggerShake(); return;
		}
		setLoading(true);
		try {
			const data = await registerAdmin({
				name: name.trim(),
				email: email.trim().toLowerCase(),
				password,
				role: 'admin',
			});
			if (data.success && data.user) {
				setStoredUser({
					id: data.user.id,
					name: data.user.name ?? data.user.email,
					email: data.user.email ?? '',
					role: data.user.role,
				});
				router.push('/admindashboard');
				router.refresh();
			} else {
				setError(data.message || 'Failed to create user.');
				triggerShake();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create user.');
			triggerShake();
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

				.ar-shell {
					font-family: 'DM Sans', sans-serif;
					background: #f5f3ff;
					min-height: 100dvh;
					position: relative;
					overflow: hidden;
				}

				.ar-grid {
					position: absolute; inset: 0;
					background-image: radial-gradient(circle, rgba(103,2,191,0.12) 1px, transparent 1px);
					background-size: 28px 28px;
					mask-image: radial-gradient(ellipse 85% 85% at 50% 50%, black 20%, transparent 100%);
				}

				.ar-orb-1 {
					position: absolute; top: -140px; left: -100px;
					width: 520px; height: 520px; border-radius: 50%;
					background: radial-gradient(circle, rgba(166,61,255,0.22) 0%, transparent 68%);
					filter: blur(50px);
					animation: ar-orb1 13s ease-in-out infinite alternate;
				}
				.ar-orb-2 {
					position: absolute; bottom: -120px; right: -80px;
					width: 460px; height: 460px; border-radius: 50%;
					background: radial-gradient(circle, rgba(255,172,39,0.18) 0%, transparent 68%);
					filter: blur(55px);
					animation: ar-orb2 15s ease-in-out infinite alternate;
				}
				.ar-orb-3 {
					position: absolute; top: 40%; left: 50%;
					transform: translateX(-50%);
					width: 340px; height: 340px; border-radius: 50%;
					background: radial-gradient(circle, rgba(179,103,96,0.12) 0%, transparent 68%);
					filter: blur(65px);
					animation: ar-orb3 11s ease-in-out infinite alternate;
				}

				@keyframes ar-orb1 {
					from { transform: translate(0,0) scale(1); }
					to   { transform: translate(40px,30px) scale(1.1); }
				}
				@keyframes ar-orb2 {
					from { transform: translate(0,0) scale(1); }
					to   { transform: translate(-30px,-20px) scale(1.08); }
				}
				@keyframes ar-orb3 {
					from { transform: translateX(-50%) scale(1); opacity: .7; }
					to   { transform: translateX(-50%) scale(1.2); opacity: 1; }
				}

				.ar-particle {
					position: absolute; border-radius: 50%;
					background: rgba(103,2,191,0.55);
					animation: ar-float linear infinite;
				}
				@keyframes ar-float {
					0%   { transform: translateY(0) scale(1); opacity: 0; }
					10%  { opacity: 1; }
					90%  { opacity: .4; }
					100% { transform: translateY(-100vh) scale(.5); opacity: 0; }
				}

				.ar-card {
					background: rgba(255,255,255,0.82);
					border: 1px solid rgba(166,61,255,0.14);
					border-radius: 28px;
					backdrop-filter: blur(20px);
					box-shadow:
						0 0 0 1px rgba(166,61,255,0.06),
						0 24px 56px rgba(103,2,191,0.1),
						0 4px 16px rgba(103,2,191,0.06),
						inset 0 1px 0 rgba(255,255,255,0.9);
					padding: 44px 44px 40px;
					position: relative; overflow: hidden;
					max-width: 480px;
					width: 100%;
					margin: 0 auto;
				}
				.ar-card::before {
					content: ''; position: absolute;
					top: 0; left: 0; right: 0; height: 1px;
					background: linear-gradient(90deg, transparent, rgba(255,172,39,0.4), rgba(166,61,255,0.25), transparent);
				}
				.ar-card-glow {
					position: absolute; top: -60%; left: 50%;
					transform: translateX(-50%);
					width: 220px; height: 220px;
					background: radial-gradient(circle, rgba(255,172,39,0.07) 0%, transparent 70%);
					pointer-events: none;
				}

				.ar-badge {
					display: inline-flex; align-items: center; gap: 6px;
					background: rgba(255,172,39,0.1);
					border: 1px solid rgba(255,172,39,0.28);
					border-radius: 100px;
					padding: 5px 14px 5px 8px;
					margin-bottom: 28px;
				}
				.ar-badge-dot {
					width: 8px; height: 8px; border-radius: 50%;
					background: #d97706;
					box-shadow: 0 0 8px rgba(255,172,39,0.6);
					animation: ar-pulse 2s ease-in-out infinite;
				}
				@keyframes ar-pulse {
					0%,100% { box-shadow: 0 0 8px rgba(255,172,39,.6); transform: scale(1); }
					50%     { box-shadow: 0 0 16px rgba(255,172,39,.9); transform: scale(1.2); }
				}
				.ar-badge-text {
					font-size: 11px; font-weight: 600;
					letter-spacing: .09em; text-transform: uppercase;
					color: #b45309;
				}

				.ar-title {
					font-family: 'Outfit', sans-serif;  /* was 'Syne' */
					font-size: 2.4rem; font-weight: 800;
					line-height: 1; letter-spacing: -.03em;
					background: linear-gradient(135deg, #2d0060 0%, #7b1de8 50%, #A63DFF 100%);
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
					margin-bottom: 8px;
				}
				.ar-subtitle {
					font-size: .9rem; color: #9e90c4;
					font-weight: 400; letter-spacing: .01em;
					margin-bottom: 30px;
				}
				.ar-divider {
					height: 1px;
					background: linear-gradient(90deg, transparent, rgba(166,61,255,0.12), transparent);
					margin-bottom: 28px;
				}

				.ar-field { position: relative; margin-bottom: 16px; }
				.ar-label {
					display: block; font-size: 11px; font-weight: 700;
					letter-spacing: .1em; text-transform: uppercase;
					color: #a07ad0; margin-bottom: 7px; padding-left: 4px;
					transition: color .2s;
				}
				.ar-field:focus-within .ar-label { color: #7b1de8; }

				.ar-input-wrap { position: relative; }
				.ar-input-icon {
					position: absolute; left: 16px; top: 50%;
					transform: translateY(-50%);
					color: #c4a8e8; transition: color .2s; pointer-events: none;
				}
				.ar-field:focus-within .ar-input-icon { color: #8B1FE8; }

				.ar-input {
					width: 100%; height: 52px;
					background: rgba(255,255,255,0.9);
					border: 1.5px solid rgba(166,61,255,0.18);
					border-radius: 14px;
					padding: 0 44px;
					font-size: .95rem; color: #2d1a50;
					outline: none; font-family: 'DM Sans', sans-serif;
					transition: border-color .2s, background .2s, box-shadow .2s;
					box-shadow: 0 1px 3px rgba(103,2,191,0.04), inset 0 1px 2px rgba(103,2,191,0.02);
				}
				.ar-input::placeholder { color: #c0b0d8; }
				.ar-input:focus {
					border-color: rgba(139,31,232,0.5);
					background: #ffffff;
					box-shadow: 0 0 0 3px rgba(166,61,255,0.1), 0 1px 3px rgba(103,2,191,0.06);
				}
				.ar-input:not(:placeholder-shown) { border-color: rgba(166,61,255,0.28); }

				.ar-eye-btn {
					position: absolute; right: 14px; top: 50%;
					transform: translateY(-50%);
					background: none; border: none; cursor: pointer;
					color: #c4a8e8; padding: 4px; border-radius: 8px;
					transition: color .2s, background .2s;
					display: flex; align-items: center; justify-content: center;
				}
				.ar-eye-btn:hover { color: #8B1FE8; background: rgba(166,61,255,0.08); }

				.ar-strength-bar {
					display: flex; gap: 4px;
					margin-top: 8px; padding-left: 4px;
					align-items: center;
				}
				.ar-strength-seg {
					flex: 1; height: 3px; border-radius: 2px;
					background: rgba(103,2,191,0.1);
					transition: background .3s;
				}
				.ar-strength-label {
					font-size: 11px; font-weight: 600;
					margin-left: 8px; letter-spacing: .04em;
					transition: color .3s; min-width: 62px;
				}

				.ar-error {
					display: flex; align-items: flex-start; gap: 10px;
					background: rgba(220,38,38,0.06);
					border: 1px solid rgba(220,38,38,0.18);
					border-radius: 12px;
					padding: 12px 14px; margin-bottom: 18px;
					animation: ar-slide-in .25s ease;
				}
				@keyframes ar-slide-in {
					from { opacity: 0; transform: translateY(-6px); }
					to   { opacity: 1; transform: translateY(0); }
				}
				.ar-error-icon { flex-shrink: 0; width: 18px; height: 18px; color: #dc2626; margin-top: 1px; }
				.ar-error-text { font-size: 13px; color: #b91c1c; line-height: 1.5; }

				.ar-submit {
					width: 100%; height: 52px; border: none;
					border-radius: 14px;
					background: linear-gradient(135deg, #7b1de8 0%, #A63DFF 100%);
					color: #fff;
					font-family: 'Outfit', sans-serif;  /* was 'Syne' */
					font-size: 1rem; font-weight: 700;
					letter-spacing: .05em; text-transform: uppercase;
					cursor: pointer; position: relative; overflow: hidden;
					transition: transform .15s, box-shadow .2s, opacity .2s;
					box-shadow: 0 8px 24px rgba(139,31,232,0.3), 0 0 0 1px rgba(166,61,255,0.2);
					margin-top: 8px;
				}
				.ar-submit::before {
					content: ''; position: absolute; inset: 0;
					background: linear-gradient(135deg, rgba(255,255,255,.18) 0%, transparent 60%);
					pointer-events: none;
				}
				.ar-submit:hover:not(:disabled) {
					transform: translateY(-1px);
					box-shadow: 0 12px 32px rgba(139,31,232,0.38), 0 0 0 1px rgba(166,61,255,0.25);
				}
				.ar-submit:active:not(:disabled) { transform: translateY(0); }
				.ar-submit:disabled { opacity: .55; cursor: not-allowed; }

				.ar-submit-inner {
					position: relative;
					display: flex; align-items: center; justify-content: center; gap: 8px;
				}
				.ar-spinner {
					width: 18px; height: 18px;
					border: 2px solid rgba(255,255,255,.3);
					border-top-color: #fff;
					border-radius: 50%;
					animation: ar-spin .7s linear infinite;
				}
				@keyframes ar-spin { to { transform: rotate(360deg); } }

				.ar-footer {
					margin-top: 24px;
					display: flex; align-items: center;
					justify-content: space-between; gap: 16px; flex-wrap: wrap;
				}
				.ar-footer-text { font-size: 13px; color: #a09abf; }
				.ar-footer-text a { color: #7b1de8; font-weight: 700; text-decoration: none; transition: opacity .2s; }
				.ar-footer-text a:hover { opacity: .75; }
				.ar-back-link {
					font-size: 12px; color: #a07ad0; text-decoration: none;
					font-weight: 600;
					display: flex; align-items: center; gap: 4px;
					transition: color .2s; white-space: nowrap;
				}
				.ar-back-link:hover { color: #7b1de8; }

				.ar-logo-wrap {
					display: inline-flex; align-items: center; gap: 10px;
					margin-bottom: 32px; text-decoration: none;
				}
				.ar-logo-text {
					font-family: 'Outfit', sans-serif;  /* was 'Syne' */
					font-size: 1.7rem; font-weight: 800;
					background: linear-gradient(90deg, #6702BF 0%, #B36760 52%, #FFAC27 100%);
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
					letter-spacing: -.02em; line-height: 1;
				}

				.ar-mount {
					opacity: 0; transform: translateY(24px);
					animation: ar-mount-in .5s cubic-bezier(.34,1.2,.64,1) forwards;
					animation-delay: .1s;
				}
				@keyframes ar-mount-in { to { opacity: 1; transform: translateY(0); } }

				.ar-shake { animation: ar-shake-anim .5s cubic-bezier(.36,.07,.19,.97); }
				@keyframes ar-shake-anim {
					10%,90% { transform: translateX(-2px); }
					20%,80% { transform: translateX(4px); }
					30%,50%,70% { transform: translateX(-4px); }
					40%,60% { transform: translateX(4px); }
				}

				@media (max-width: 480px) {
					.ar-card { padding: 32px 24px; border-radius: 22px; }
					.ar-title { font-size: 1.9rem; }
					.ar-footer { flex-direction: column; align-items: flex-start; gap: 8px; }
				}
			`}</style>

			<div className="ar-shell">
				<div className="ar-grid" aria-hidden="true" />
				<div className="ar-orb-1" aria-hidden="true" />
				<div className="ar-orb-2" aria-hidden="true" />
				<div className="ar-orb-3" aria-hidden="true" />

				{mounted && particles.map((p, i) => (
					<Particle key={i} style={p as React.CSSProperties} />
				))}

				<div style={{
					position: 'relative', zIndex: 10,
					display: 'flex', minHeight: '100dvh',
					alignItems: 'center', justifyContent: 'center',
					padding: '32px 16px',
				}}>
					<div style={{ width: '100%', maxWidth: '480px', flexShrink: 0 }} className={mounted ? 'ar-mount' : ''}>

						<Link href="/" className="ar-logo-wrap">
							<Image src="/lggo%201.svg" alt="Centric" width={36} height={36} priority style={{ width: 36, height: 'auto' }} />
							<span className="ar-logo-text">Centric</span>
						</Link>

						<div className={`ar-card ${shake ? 'ar-shake' : ''}`}>
							<div className="ar-card-glow" aria-hidden="true" />

							<div className="ar-badge">
								<div className="ar-badge-dot" />
								<span className="ar-badge-text">New Admin Account</span>
							</div>

							<h1 className="ar-title">Create Account?</h1>
							<p className="ar-subtitle">All accounts registered here have admin privileges.</p>
							<div className="ar-divider" />

							<form onSubmit={handleSubmit} noValidate>
								{error && (
									<div className="ar-error" role="alert">
										<svg className="ar-error-icon" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
										</svg>
										<span className="ar-error-text">{error}</span>
									</div>
								)}

								<div className="ar-field">
									<label htmlFor="name" className="ar-label">Full Name</label>
									<div className="ar-input-wrap">
										<svg className="ar-input-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
										</svg>
										<input id="name" type="text" className="ar-input"
											autoComplete="name" placeholder="Your full name"
											value={name} onChange={(e) => setName(e.target.value)} />
									</div>
								</div>

								<div className="ar-field">
									<label htmlFor="email" className="ar-label">Email Address</label>
									<div className="ar-input-wrap">
										<svg className="ar-input-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
											<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
											<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
										</svg>
										<input id="email" type="email" className="ar-input"
											autoComplete="email" placeholder="admin@example.com"
											value={email} onChange={(e) => setEmail(e.target.value)} />
									</div>
								</div>

								<div className="ar-field">
									<label htmlFor="password" className="ar-label">Password</label>
									<div className="ar-input-wrap">
										<svg className="ar-input-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
										</svg>
										<input id="password"
											type={showPassword ? 'text' : 'password'}
											className="ar-input"
											autoComplete="new-password" placeholder="Min. 6 characters"
											value={password} onChange={(e) => setPassword(e.target.value)} />
										<button type="button" className="ar-eye-btn"
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

									{password.length > 0 && (
										<div className="ar-strength-bar">
											{[1, 2, 3, 4, 5].map((seg) => (
												<div key={seg} className="ar-strength-seg"
													style={{ background: seg <= passwordStrength ? strengthColor : undefined }} />
											))}
											<span className="ar-strength-label" style={{ color: strengthColor }}>
												{strengthLabel}
											</span>
										</div>
									)}
								</div>

								<button type="submit" className="ar-submit" disabled={loading}>
									<span className="ar-submit-inner">
										{loading ? (
											<><span className="ar-spinner" />Creating account...</>
										) : (
											<>
												Create Admin Account
												<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
													<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
												</svg>
											</>
										)}
									</span>
								</button>
							</form>

							<div className="ar-footer">
								<p className="ar-footer-text">
									Already have an account?{' '}
									<Link href="/adminauth/login">Login</Link>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}