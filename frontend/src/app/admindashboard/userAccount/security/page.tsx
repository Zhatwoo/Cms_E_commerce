"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";

export default function SecurityPage() {
	const [showChangePassword, setShowChangePassword] = useState(false);
	const [emailVerified, setEmailVerified] = useState(false);
	const [showConfirmEmailModal, setShowConfirmEmailModal] = useState(false);
	const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [emailVerifying, setEmailVerifying] = useState(false);
	const [lastPasswordChangeShort, setLastPasswordChangeShort] = useState("Jan 08, 2026");
	const [lastPasswordChangeDetail, setLastPasswordChangeDetail] = useState("Jan 08, 2026 · 10:22 AM");
	const [lastSubmittedPassword, setLastSubmittedPassword] = useState("");

	const hasMinLength = newPassword.trim().length > 5;
	const passwordsMatch = newPassword.trim().length > 0 && newPassword === confirmPassword;
	const isNewPasswordDifferent = newPassword.trim() !== currentPassword.trim();
	const isPasswordChangedSinceSubmit = newPassword.trim() !== lastSubmittedPassword.trim();

	const isUpdateDisabled =
		!currentPassword.trim() ||
		!newPassword.trim() ||
		!confirmPassword.trim() ||
		!hasMinLength ||
		!passwordsMatch ||
		!isNewPasswordDifferent ||
		!isPasswordChangedSinceSubmit;

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
						className="bg-white rounded-2xl shadow-[0_16px_40px_rgba(15,23,42,0.08)] border border-gray-200 p-8"
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<div className="flex items-center justify-between mb-6">
								<div>
									<h2 className="text-xl font-semibold text-gray-900">Account Protection</h2>
									<p className="text-sm text-gray-500">Secure access and reduce account risk.</p>
								</div>
								<button
									type="button"
									onClick={() => setShowChangePassword((prev) => !prev)}
									className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-slate-800"
								>
									{showChangePassword ? "Back to Security" : "Change Password"}
								</button>
							</div>

							{showChangePassword ? (
								<div className="rounded-2xl border border-gray-200 bg-slate-50 p-6">
									<div className="mb-6">
										<h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
										<p className="text-sm text-gray-500">Use a strong password with more than 5 characters.</p>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<label htmlFor="currentPassword" className="block text-sm text-gray-600">Current password</label>
											<input
												id="currentPassword"
												type="password"
												placeholder="Enter current password"
												value={currentPassword}
												onChange={(event) => setCurrentPassword(event.target.value)}
												className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div className="space-y-2">
											<label htmlFor="newPassword" className="block text-sm text-gray-600">New password</label>
											<input
												id="newPassword"
												type="password"
												placeholder="Create a new password"
												value={newPassword}
												onChange={(event) => setNewPassword(event.target.value)}
												className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div className="space-y-2">
											<label htmlFor="confirmPassword" className="block text-sm text-gray-600">Confirm new password</label>
											<input
												id="confirmPassword"
												type="password"
												placeholder="Re-enter new password"
												value={confirmPassword}
												onChange={(event) => setConfirmPassword(event.target.value)}
												className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
											<div className="text-xs text-slate-500">Last change: {lastPasswordChangeShort}</div>
											<div className="flex items-center gap-3">
												<button
													type="button"
													onClick={() => setShowChangePassword(false)}
													className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
												>
													Cancel
												</button>
												<button
													type="button"
													onClick={() => {
														if (isUpdateDisabled) {
															return;
														}
														setShowUpdatePasswordModal(true);
													}}
													disabled={isUpdateDisabled}
													className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
														isUpdateDisabled
															? "bg-gray-200 text-gray-500 cursor-not-allowed"
															: "bg-blue-600 text-white hover:bg-blue-700"
													}`}
												>
													Update password
												</button>
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="rounded-xl border border-gray-200 p-4">
										<div className="text-sm text-gray-500">Confirm Email</div>
										<div
											className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
												emailVerified
													? "bg-emerald-50 text-emerald-700"
													: "bg-amber-50 text-amber-700"
											}`}
										>
											{emailVerified ? "Verified" : "Pending"}
										</div>
										<p className="mt-3 text-xs text-gray-500">
											{emailVerified ? "Confirmed for adminuser@cmd.com" : "Pending confirmation for adminuser@cmd.com"}
										</p>
										<button
											type="button"
											onClick={() => setShowConfirmEmailModal(true)}
											disabled={emailVerified}
											className={`mt-4 w-full rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
												emailVerified || emailVerifying
													? "bg-gray-200 text-gray-500 cursor-not-allowed"
													: "bg-slate-900 text-white hover:bg-slate-800"
											}`}
										>
											{emailVerifying ? "Verifying" : "Confirm email"}
										</button>
									</div>

									<div className="rounded-xl border border-gray-200 p-4">
										<div className="text-sm text-gray-500">Last Password Change</div>
										<div className="mt-2 text-sm font-semibold text-gray-900">{lastPasswordChangeDetail}</div>
										<p className="mt-1 text-xs text-gray-500">Recommended: change every 90 days.</p>
									</div>
								</div>
							)}
						</motion.div>
					</motion.div>
				</div>
			</div>
			<AnimatePresence>
				{showConfirmEmailModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
					>
						<motion.div
							initial={{ y: 12, opacity: 0, scale: 0.98 }}
							animate={{ y: 0, opacity: 1, scale: 1 }}
							exit={{ y: 8, opacity: 0, scale: 0.98 }}
							transition={{ duration: 0.2 }}
							className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.25)]"
						>
							<h3 className="text-lg font-semibold text-gray-900">Confirm email</h3>
							<p className="mt-2 text-sm text-gray-500">
								A verification code was sent to adminuser@cmd.com. The status will remain pending until the
								code is verified.
							</p>
							<div className="mt-6 flex items-center justify-end gap-3">
								<button
									type="button"
									onClick={() => setShowConfirmEmailModal(false)}
									className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => {
										setEmailVerifying(true);
										setShowConfirmEmailModal(false);
									}}
									className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
								>
									Ok, got it
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{showUpdatePasswordModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
					>
						<motion.div
							initial={{ y: 12, opacity: 0, scale: 0.98 }}
							animate={{ y: 0, opacity: 1, scale: 1 }}
							exit={{ y: 8, opacity: 0, scale: 0.98 }}
							transition={{ duration: 0.2 }}
							className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.25)]"
						>
							<h3 className="text-lg font-semibold text-gray-900">Update password</h3>
							<p className="mt-2 text-sm text-gray-500">Are you sure you want to update your password?</p>
							<div className="mt-6 flex items-center justify-end gap-3">
								<button
									type="button"
									onClick={() => setShowUpdatePasswordModal(false)}
									className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => {
										setLastPasswordChangeShort("Just now");
										setLastPasswordChangeDetail("Just now");
												setLastSubmittedPassword(newPassword);
										setShowUpdatePasswordModal(false);
									}}
									className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
								>
									Confirm
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</UserAccountShell>
	);
}
