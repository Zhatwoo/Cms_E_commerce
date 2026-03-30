"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Shield, Mail, Lock } from "lucide-react";
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

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			addNotification("Validation Error", "New passwords do not match.", "error");
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

	const isUpdateDisabled = !currentPassword || !newPassword || !confirmPassword || newPassword.length < 6;

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
							{/* Identity Section */}
							<div className="admin-dashboard-inset-panel flex flex-col justify-between rounded-[28px] border border-[rgba(166,61,255,0.12)] bg-white/60 p-8 shadow-sm transition-all hover:bg-white/80">
								<div className="space-y-6">
									<div className="flex items-center gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F4FF] text-[#4a1a8a] shadow-inner">
											<Mail size={24} />
										</div>
										<div className="overflow-hidden">
											<p className="text-lg font-bold text-[#4a1a8a] truncate">{user?.name || "Loading..."}</p>
											<p className="text-sm font-medium text-[#7a6aa0] truncate">{user?.email}</p>
										</div>
									</div>

									<div className="space-y-3">
										<div className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${user?.emailVerified ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
											<span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${user?.emailVerified ? "bg-emerald-500" : "bg-orange-500 animate-pulse"}`} />
											{user?.emailVerified ? "VERIFIED ACCOUNT" : "PENDING VERIFICATION"}
										</div>
										{!user?.emailVerified && (
											<p className="text-sm font-medium leading-relaxed text-[#7a6aa0]">
												Confirm <span className="font-bold text-[#4a1a8a]">{user?.email}</span> to enable full access.
											</p>
										)}
									</div>
								</div>

								{!user?.emailVerified && (
									<button
										onClick={handleResendVerification}
										className="mt-6 w-full rounded-2xl bg-[#FFCC00] py-3 text-sm font-bold text-[#4a1a8a] shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
									>
										Resend Verification
									</button>
								)}
							</div>

							{/* Password Section */}
							<div className="admin-dashboard-inset-panel flex flex-col justify-between rounded-[28px] border border-[rgba(166,61,255,0.12)] bg-white/60 p-8 shadow-sm transition-all hover:bg-white/80">
								<div className="space-y-6">
									<div className="flex items-center gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F4FF] text-[#4a1a8a] shadow-inner">
											<Lock size={24} />
										</div>
										<div>
											<h3 className="text-lg font-bold text-[#4a1a8a]">Credentials</h3>
											<p className="text-sm font-medium text-[#7a6aa0]">Manage password</p>
										</div>
									</div>

									<div className="space-y-1">
										<div className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">LAST CHANGE</div>
										<p className="text-md font-bold text-[#4a1a8a]">{formattedPasswordDate}</p>
									</div>
								</div>

								<button
									onClick={() => setShowPasswordModal(true)}
									className="mt-6 w-full rounded-2xl border border-[rgba(166,61,255,0.12)] bg-white py-3 text-sm font-bold text-[#4a1a8a] shadow-sm transition-all hover:bg-[#F5F4FF] active:scale-[0.98]"
								>
									Change Password
								</button>
							</div>
						</div>

						<div className="admin-dashboard-inset-panel rounded-[28px] border border-[rgba(166,61,255,0.12)] bg-white/40 p-6">
							<div className="flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
									<Shield size={16} />
								</div>
								<div>
									<h4 className="text-sm font-bold text-[#4a1a8a]">Multi-factor Authentication</h4>
									<p className="text-xs font-medium text-[#8A86A4]">Coming soon: Add an extra layer of security to your account.</p>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</div>

			{/* Password Modal */}
			<AnimatePresence>
				{showPasswordModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(215,204,245,0.4)] p-4 backdrop-blur-md">
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="w-full max-w-md overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.3)] bg-white p-8 shadow-[0_25px_50px_-12px_rgba(74,26,138,0.25)]"
						>
							<div className="mb-8">
								<h3 className="text-2xl font-bold text-[#4a1a8a]">Update Password</h3>
								<p className="text-sm font-medium text-[#8A86A4]">Please enter your current and new password.</p>
							</div>

							<form onSubmit={handleChangePassword} className="space-y-5">
								<div className="space-y-2">
									<label className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">CURRENT PASSWORD</label>
									<div className="relative">
										<input
											type={showCurrentPassword ? "text" : "password"}
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
											className="w-full rounded-xl bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#374151] outline-none transition-all focus:ring-2 focus:ring-[#4a1a8a]/10"
											required
										/>
										<button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4a1a8a]">
											{showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">NEW PASSWORD</label>
									<div className="relative">
										<input
											type={showNewPassword ? "text" : "password"}
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											className="w-full rounded-xl bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#374151] outline-none transition-all focus:ring-2 focus:ring-[#4a1a8a]/10"
											required
											minLength={6}
										/>
										<button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4a1a8a]">
											{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">CONFIRM NEW PASSWORD</label>
									<div className="relative">
										<input
											type={showConfirmPassword ? "text" : "password"}
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											className="w-full rounded-xl bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#374151] outline-none transition-all focus:ring-2 focus:ring-[#4a1a8a]/10"
											required
										/>
										<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4a1a8a]">
											{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
								</div>

								<div className="pt-4 flex items-center gap-3">
									<button
										type="button"
										onClick={() => setShowPasswordModal(false)}
										className="flex-1 rounded-2xl bg-[#F9FAFB] py-3 text-sm font-bold text-[#7a6aa0] transition-all hover:bg-gray-100"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={isUpdateDisabled || isLoading}
										className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white shadow-lg transition-all ${
											isUpdateDisabled || isLoading
												? "bg-gray-200 cursor-not-allowed"
												: "bg-[#4a1a8a] shadow-[0_8px_20px_-6px_rgba(74,26,138,0.4)] hover:opacity-90 active:scale-[0.98]"
										}`}
									>
										{isLoading ? "Updating..." : "Update Password"}
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
