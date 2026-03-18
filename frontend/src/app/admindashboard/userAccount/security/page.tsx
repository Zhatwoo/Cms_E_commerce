"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";

function ConfirmModal({
	title,
	description,
	isOpen,
	onClose,
	onConfirm,
}: {
	title: string;
	description: string;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
}) {
	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(215,204,245,0.66)] px-4 backdrop-blur-[4px]">
				<motion.div initial={{ y: 12, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 8, opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="admin-dashboard-panel w-full max-w-md rounded-2xl border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-6 shadow-[0_20px_50px_rgba(123,78,192,0.18)]">
					<h3 className="text-lg font-semibold text-[#471396]">{title}</h3>
					<p className="mt-2 text-sm text-[#8A86A4]">{description}</p>
					<div className="mt-6 flex items-center justify-end gap-3">
						<button type="button" onClick={onClose} className="rounded-xl border border-[rgba(177,59,255,0.18)] px-4 py-2 text-sm font-semibold text-[#8A86A4] hover:bg-white/60">Cancel</button>
						<button type="button" onClick={onConfirm} className="rounded-xl bg-[#FFCC00] px-4 py-2 text-sm font-semibold text-[#232323] hover:opacity-90">Confirm</button>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}

export default function SecurityPage() {
	const [showChangePassword, setShowChangePassword] = useState(false);
	const [emailVerified, setEmailVerified] = useState(false);
	const [showConfirmEmailModal, setShowConfirmEmailModal] = useState(false);
	const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [emailVerifying, setEmailVerifying] = useState(false);
	const [lastPasswordChangeDetail, setLastPasswordChangeDetail] = useState("January 01, 2026, 10:30 AM");

	const isUpdateDisabled =
		!currentPassword.trim() ||
		!newPassword.trim() ||
		!confirmPassword.trim() ||
		newPassword.trim().length < 6 ||
		newPassword !== confirmPassword ||
		newPassword === currentPassword;

	return (
		<UserAccountShell activePath="Security">
			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-3">
					<UserAccountSidebar />
				</div>

				<div className="col-span-12 lg:col-span-9">
					<motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="admin-dashboard-panel rounded-[32px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-8 shadow-[0_10px_26px_rgba(123,78,192,0.15)]">
						<div className="mb-6">
							<h2 className="text-2xl font-semibold text-[#471396]">Account Protection</h2>
							<p className="text-sm text-[#8A86A4]">Secure access and reduce account risk.</p>
						</div>

						{showChangePassword ? (
							<div className="admin-dashboard-inset-panel rounded-[28px] border border-[rgba(177,59,255,0.18)] bg-white/40 p-6">
								<div className="mb-6">
									<h3 className="text-lg font-semibold text-[#471396]">Change Password</h3>
									<p className="text-sm text-[#8A86A4]">Use a strong password with more than 5 characters.</p>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div>
										<label htmlFor="currentPassword" className="mb-2 block text-xs font-medium text-[#A78BFA]">Current password</label>
										<div className="relative">
											<input id="currentPassword" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="admin-dashboard-panel-soft h-11 w-full rounded-2xl border border-[rgba(177,59,255,0.22)] bg-white/80 px-4 pr-12 text-sm text-[#471396] outline-none" />
											<button
												type="button"
												onClick={() => setShowCurrentPassword(!showCurrentPassword)}
												className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A86A4] hover:text-[#471396] transition-colors"
											>
												{showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
											</button>
										</div>
									</div>
									<div>
										<label htmlFor="newPassword" className="mb-2 block text-xs font-medium text-[#A78BFA]">New password</label>
										<div className="relative">
											<input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="admin-dashboard-panel-soft h-11 w-full rounded-2xl border border-[rgba(177,59,255,0.22)] bg-white/80 px-4 pr-12 text-sm text-[#471396] outline-none" />
											<button
												type="button"
												onClick={() => setShowNewPassword(!showNewPassword)}
												className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A86A4] hover:text-[#471396] transition-colors"
											>
												{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
											</button>
										</div>
									</div>
									<div>
										<label htmlFor="confirmPassword" className="mb-2 block text-xs font-medium text-[#A78BFA]">Confirm new password</label>
										<div className="relative">
											<input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="admin-dashboard-panel-soft h-11 w-full rounded-2xl border border-[rgba(177,59,255,0.22)] bg-white/80 px-4 pr-12 text-sm text-[#471396] outline-none" />
											<button
												type="button"
												onClick={() => setShowConfirmPassword(!showConfirmPassword)}
												className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A86A4] hover:text-[#471396] transition-colors"
											>
												{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
											</button>
										</div>
									</div>
								</div>

								<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
									<div className="text-xs text-[#8A86A4]">Last change: {lastPasswordChangeDetail}</div>
									<div className="flex items-center gap-3">
										<button type="button" onClick={() => setShowChangePassword(false)} className="rounded-xl border border-[rgba(177,59,255,0.18)] px-4 py-2 text-sm font-semibold text-[#8A86A4] hover:bg-white/60">Cancel</button>
										<button type="button" disabled={isUpdateDisabled} onClick={() => setShowUpdatePasswordModal(true)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${isUpdateDisabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-[#FFCC00] text-[#232323] hover:opacity-90"}`}>Update password</button>
									</div>
								</div>
							</div>
						) : (
							<div className="space-y-6">
								<div className="admin-dashboard-inset-panel rounded-[30px] border border-[rgba(177,59,255,0.18)] bg-white/40 p-8 text-center">
									<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(177,59,255,0.24)] bg-white shadow-[0_10px_24px_rgba(123,78,192,0.12)]">
										<svg className="h-10 w-10 text-[#B13BFF]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" /></svg>
									</div>
									<h3 className="text-2xl font-semibold text-[#471396]">Admin User</h3>
									<p className="mt-1 text-sm font-medium text-[#B13BFF]">adminuser@cms.com</p>
									<div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F9E7A6] px-3 py-1 text-xs font-semibold text-[#9B7600]">
										<span>!</span>
										<span>{emailVerified ? "Your email is verified" : "Your email is pending for verification"}</span>
									</div>
									<p className="mx-auto mt-4 max-w-[520px] text-sm text-[#8A86A4]">
										The email address adminuser@cms.com is currently awaiting confirmation. Please ensure the address is correct and initiate the verification process to activate the account.
									</p>
									<button type="button" onClick={() => setShowConfirmEmailModal(true)} disabled={emailVerified} className={`mt-5 rounded-xl px-8 py-3 text-sm font-semibold shadow ${emailVerified || emailVerifying ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-[#FFCC00] text-[#232323] hover:opacity-90"}`}>
										{emailVerifying ? "Verifying" : "Confirm Email"}
									</button>
								</div>

								<div className="admin-dashboard-inset-panel flex flex-col gap-4 rounded-[28px] border border-[rgba(177,59,255,0.18)] bg-white/40 p-7 md:flex-row md:items-center md:justify-between">
									<div>
										<div className="text-sm text-[#8A86A4]">Last Password Change</div>
										<div className="mt-4 text-xl font-semibold text-[#471396]">{lastPasswordChangeDetail}</div>
										<p className="mt-2 text-sm text-[#8A86A4]">Recommended: change every 90 days</p>
									</div>
									<button type="button" onClick={() => setShowChangePassword(true)} className="rounded-xl bg-[#FFCC00] px-8 py-3 text-sm font-semibold text-[#232323] shadow hover:opacity-90">Change password</button>
								</div>
							</div>
						)}
					</motion.div>
				</div>
			</div>

			<ConfirmModal
				title="Confirm email"
				description="A verification code was sent to adminuser@cms.com. The status will remain pending until the code is verified."
				isOpen={showConfirmEmailModal}
				onClose={() => setShowConfirmEmailModal(false)}
				onConfirm={() => {
					setEmailVerifying(true);
					setShowConfirmEmailModal(false);
				}}
			/>

			<ConfirmModal
				title="Update password"
				description="Are you sure you want to update your password?"
				isOpen={showUpdatePasswordModal}
				onClose={() => setShowUpdatePasswordModal(false)}
				onConfirm={() => {
					setLastPasswordChangeDetail("Just now");
					setShowUpdatePasswordModal(false);
					setShowChangePassword(false);
				}}
			/>
		</UserAccountShell>
	);
}
