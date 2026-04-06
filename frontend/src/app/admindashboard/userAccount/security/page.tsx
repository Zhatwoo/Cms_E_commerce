"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Shield, Mail, Lock, Check, X, AlertCircle } from "lucide-react";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";
import { getMe, changePassword, resendVerificationEmail, User } from "@/lib/api";
import { addNotification } from "@/lib/notifications";

export default function SecurityPage() {
	const [user, setUser] = useState<User | null>(null);
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Form states
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await getMe();
				if (response.success && response.user) {
					setUser(response.user);
				}
			} catch (err) {
				console.error("Failed to refresh user:", err);
			}
		};
		fetchUser();
	}, []);

	const handleResendVerification = async () => {
		if (!user?.email) return;

		try {
			const res = await resendVerificationEmail(user.email);
			if (res.success) {
				addNotification("Verification Sent", "Verification email sent successfully!", "success");
			} else {
				throw new Error(res.message);
			}
		} catch (err: any) {
			addNotification("Service Error", err.message || "Failed to resend verification email.", "error");
		}
	};

	// Validation helpers
	const validationRules = useMemo(() => [
		{ label: "Minimum 8 characters", test: (pw: string) => pw.length >= 8 },
		{ label: "At least one uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
		{ label: "At least one lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
		{ label: "At least one number", test: (pw: string) => /[0-9]/.test(pw) },
	], []);

	const isNewPasswordValid = useMemo(() => 
		validationRules.every(rule => rule.test(newPassword)),
	[newPassword, validationRules]);

	const isConfirmPasswordValid = useMemo(() => 
		confirmPassword.length > 0 && confirmPassword === newPassword,
	[confirmPassword, newPassword]);

	const isUpdateDisabled = !currentPassword || !isNewPasswordValid || !isConfirmPasswordValid || isLoading;

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isNewPasswordValid) {
			addNotification("Validation Error", "Password does not meet requirements.", "error");
			return;
		}
		if (newPassword !== confirmPassword) {
			addNotification("Validation Error", "Passwords do not match.", "error");
			return;
		}

		try {
			setIsLoading(true);
			const res = await changePassword(currentPassword, newPassword);
			if (res.success) {
				addNotification("Security Updated", "Your password has been changed successfully.", "success");
				setShowPasswordModal(false);
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
				// Refresh user to get new lastPasswordChange
				const meRes = await getMe();
				if (meRes.success && meRes.user) setUser(meRes.user);
			} else {
				throw new Error(res.message);
			}
		} catch (err: any) {
			addNotification("Update Failed", err.message || "Incorrect current password or update failed.", "error");
		} finally {
			setIsLoading(false);
		}
	};

	const formattedPasswordDate = user?.lastPasswordChange
		? new Date(user.lastPasswordChange).toLocaleDateString("en-US", {
				month: "long",
				day: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
		  })
		: "Not recently changed";

	return (
		<UserAccountShell activePath="Security">
			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-3">
					<UserAccountSidebar />
				</div>

				<div className="col-span-12 lg:col-span-9">
					<motion.div
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45 }}
						className="admin-dashboard-panel space-y-8 rounded-[32px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-8 shadow-[0_10px_26px_rgba(123,78,192,0.15)]"
					>
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-2xl font-bold text-[#471396]">Account Protection</h2>
								<p className="text-sm text-[#8A86A4]">Secure access and manage your credentials.</p>
							</div>
							<Shield className="text-[#471396] opacity-10" size={48} />
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div className="admin-dashboard-inset-panel flex flex-col justify-between rounded-[28px] border border-[rgba(166,61,255,0.12)] bg-white/60 p-8 shadow-sm transition-all hover:bg-white/80">
								<div className="space-y-6">
									<div className="flex items-center gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F4FF] text-[#4a1a8a] shadow-inner transition-transform group-hover:scale-110">
											<Mail size={24} />
										</div>
										<div className="overflow-hidden">
											<p className="text-lg font-bold text-[#4a1a8a] truncate">{user?.name || "Loading..."}</p>
											<p className="text-sm font-medium text-[#7a6aa0] truncate">{user?.email}</p>
										</div>
									</div>

									<div className="space-y-3">
										<div className={`inline-flex items-center rounded-full px-3.5 py-1 text-[10px] font-black uppercase tracking-widest ${user?.emailVerified ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-orange-50 text-orange-600 border border-orange-100"}`}>
											<span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${user?.emailVerified ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]"}`} />
											{user?.emailVerified ? "VERIFIED ACCOUNT" : "PENDING VERIFICATION"}
										</div>
										{!user?.emailVerified && (
											<p className="text-sm font-medium leading-relaxed text-[#7a6aa0] opacity-80">
												Confirm <span className="font-bold text-[#4a1a8a]">{user?.email}</span> to enable full access.
											</p>
										)}
									</div>
								</div>

								{!user?.emailVerified && (
									<button
										onClick={handleResendVerification}
										className="mt-6 w-full rounded-2xl bg-[#FFCC00] py-3.5 text-[11px] font-black uppercase tracking-[0.15em] text-[#4a1a8a] shadow-lg shadow-yellow-200/50 transition-all hover:shadow-yellow-300/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
									>
										Resend Verification
									</button>
								)}
							</div>

							<div className="admin-dashboard-inset-panel group flex flex-col justify-between rounded-[32px] border border-[rgba(166,61,255,0.12)] bg-white/60 p-8 shadow-sm transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-[#4a1a8a]/5 hover:-translate-y-1">
								<div className="space-y-6">
									<div className="flex items-center gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F4FF] text-[#4a1a8a] shadow-inner transition-transform group-hover:scale-110">
											<Lock size={24} />
										</div>
										<div>
											<h3 className="text-lg font-bold text-[#4a1a8a]">Credentials</h3>
											<p className="text-sm font-medium text-[#7a6aa0] opacity-80">Manage password</p>
										</div>
									</div>

									<div className="space-y-1">
										<p className="text-[10px] font-black tracking-widest text-[#9CA3AF] uppercase">LAST CHANGE</p>
										<p className="text-md font-bold text-[#4a1a8a]">{formattedPasswordDate}</p>
									</div>
								</div>

								<button
									onClick={() => setShowPasswordModal(true)}
									className="mt-6 w-full rounded-2xl border-2 border-[rgba(166,61,255,0.12)] bg-white py-3.5 text-[11px] font-black uppercase tracking-[0.15em] text-[#4a1a8a] shadow-sm transition-all hover:bg-[#F5F4FF] hover:border-[#4a1a8a]/20 hover:shadow-md active:scale-95"
								>
									Change Password
								</button>
							</div>
						</div>

						<div className="admin-dashboard-inset-panel rounded-[28px] border border-[rgba(166,61,255,0.12)] bg-white/40 p-6 transition-all hover:bg-white/60">
							<div className="flex items-center gap-4">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 shadow-sm">
									<Shield size={20} strokeWidth={2.5} />
								</div>
								<div>
									<h4 className="text-sm font-black uppercase tracking-tight text-[#4a1a8a]">Multi-factor Authentication</h4>
									<p className="text-xs font-semibold text-[#8A86A4] opacity-80 uppercase tracking-widest">Available in next update</p>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</div>

			{/* Password Modal */}
			<AnimatePresence>
				{showPasswordModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(123,78,192,0.3)] p-4 backdrop-blur-md">
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="w-full max-w-lg overflow-hidden rounded-[40px] border border-[rgba(255,255,255,0.5)] bg-white/95 p-10 shadow-[0_40px_80px_-20px_rgba(74,26,138,0.35)]"
						>
							<div className="mb-8">
								<h3 className="text-2xl font-bold text-[#4a1a8a]">Update Password</h3>
								<p className="text-sm font-medium text-[#8A86A4]">Protect your account with a strong, complex password.</p>
							</div>

							<form onSubmit={handleChangePassword} className="space-y-6">
								<div className="space-y-2">
									<label className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">CURRENT PASSWORD</label>
									<div className="relative group">
										<input
											type={showCurrentPassword ? "text" : "password"}
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
											className="w-full rounded-2xl bg-[#F5F4FF]/50 px-5 py-4 text-sm font-medium text-[#374151] outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#4a1a8a]/10"
											placeholder="Enter current password"
											required
										/>
										<button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-colors hover:text-[#4a1a8a]">
											{showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
										</button>
									</div>
								</div>

								<div className="space-y-4">
									<div className="space-y-2">
										<label className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">NEW PASSWORD</label>
										<div className="relative group">
											<input
												type={showNewPassword ? "text" : "password"}
												value={newPassword}
												onChange={(e) => setNewPassword(e.target.value)}
												className="w-full rounded-2xl bg-[#F5F4FF]/50 px-5 py-4 text-sm font-medium text-[#374151] outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#4a1a8a]/10"
												placeholder="Create new password"
												required
											/>
											<button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-colors hover:text-[#4a1a8a]">
												{showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
											</button>
										</div>
									</div>

									{/* Real-time Validation indicators */}
									<div className="grid grid-cols-2 gap-3 px-2">
										{validationRules.map((rule, idx) => {
											const isValid = rule.test(newPassword);
											return (
												<div key={idx} className="flex items-center gap-2">
													<div className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${isValid ? "bg-emerald-100 text-emerald-500" : "bg-gray-100 text-gray-400"}`}>
														{isValid ? <Check size={10} strokeWidth={4} /> : <div className="h-1 w-1 rounded-full bg-current" />}
													</div>
													<span className={`text-[11px] font-semibold transition-colors ${isValid ? "text-emerald-600" : "text-[#8A86A4]"}`}>
														{rule.label}
													</span>
												</div>
											);
										})}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">CONFIRM NEW PASSWORD</label>
									<div className="relative group">
										<input
											type={showConfirmPassword ? "text" : "password"}
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											className={`w-full rounded-2xl bg-[#F5F4FF]/50 px-5 py-4 text-sm font-medium text-[#374151] outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#4a1a8a]/10 ${confirmPassword && !isConfirmPasswordValid ? "ring-2 ring-red-500/20 bg-red-50/30" : ""}`}
											placeholder="Confirm new password"
											required
										/>
										<div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
											{confirmPassword && (
												isConfirmPasswordValid 
													? <div className="text-emerald-500"><Check size={18} strokeWidth={3} /></div>
													: <div className="text-red-400" title="Passwords do not match"><AlertCircle size={18} /></div>
											)}
											<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-[#9CA3AF] transition-colors hover:text-[#4a1a8a]">
												{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
											</button>
										</div>
									</div>
									{confirmPassword && !isConfirmPasswordValid && (
										<p className="text-[10px] text-red-500 font-bold tracking-tight px-1">Passwords do not match</p>
									)}
								</div>

								<div className="pt-6 flex items-center gap-4">
									<button
										type="button"
										onClick={() => {
											setShowPasswordModal(false);
											setNewPassword("");
											setCurrentPassword("");
											setConfirmPassword("");
										}}
										className="flex-1 rounded-2xl bg-gray-50 py-4 text-sm font-bold text-[#8A86A4] transition-all hover:bg-gray-100 active:scale-[0.98]"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={isUpdateDisabled}
										className={`flex-1 rounded-2xl py-4 text-sm font-bold text-white shadow-lg transition-all ${
											isUpdateDisabled
												? "bg-gray-200 cursor-not-allowed"
												: "bg-[#4a1a8a] shadow-[0_12px_24px_-8px_rgba(74,26,138,0.5)] hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0"
										}`}
									>
										{isLoading ? (
											<div className="flex items-center justify-center gap-2">
												<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
												<span>Updating...</span>
											</div>
										) : "Update Password"}
									</button>
								</div>
							</form>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</UserAccountShell>
	);
}
