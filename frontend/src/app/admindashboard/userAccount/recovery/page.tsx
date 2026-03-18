"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";

const normalizePhoneNumber = (value: string) => {
	const digitsOnly = value.replace(/\D/g, "");

	if (!digitsOnly || digitsOnly === "6" || digitsOnly === "63") {
		return "+63";
	}

	let localNumber = "";
	if (digitsOnly.startsWith("63") && digitsOnly.length > 2) {
		localNumber = digitsOnly.slice(2);
	} else if (digitsOnly.startsWith("0")) {
		localNumber = digitsOnly.slice(1);
	} else {
		localNumber = digitsOnly;
	}

	localNumber = localNumber.slice(0, 10);
	return `+63${localNumber}`;
};

export default function RecoveryPage() {
	const initialRecovery = {
		email: "recovery@cmd.com",
		phoneNumber: "+639171234567",
	};

	const [recovery, setRecovery] = useState(initialRecovery);
	const [savedRecovery, setSavedRecovery] = useState(initialRecovery);
	const [lastUpdatedRecovery, setLastUpdatedRecovery] = useState("2 days ago");
	const [showRecoverySaveConfirmation, setShowRecoverySaveConfirmation] = useState(false);
	const [recoveryPhoneError, setRecoveryPhoneError] = useState("");

	const validatePhoneNumber = (phone: string) => {
		const digitsOnly = phone.replace(/\D/g, "");
		if (digitsOnly.length < 12 || !digitsOnly.startsWith("63")) {
			return "Please enter a valid Philippine phone number (+639XXXXXXXXX)";
		}
		const localNumber = digitsOnly.slice(2);
		if (localNumber.length !== 10) {
			return "Phone number must be 10 digits after +63";
		}
		return "";
	};

	const hasRecoveryChanges = useMemo(
		() => JSON.stringify(recovery) !== JSON.stringify(savedRecovery),
		[recovery, savedRecovery]
	);

	return (
		<UserAccountShell activePath="Recovery">
			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-3">
					<UserAccountSidebar />
				</div>

				<div className="col-span-12 lg:col-span-9">
					<motion.div
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45 }}
						className="admin-dashboard-panel rounded-[32px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-8 shadow-[0_10px_26px_rgba(123,78,192,0.15)]"
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<div className="mb-6">
								<div>
									<h2 className="text-2xl font-semibold text-[#471396]">Recovery Options</h2>
									<p className="text-sm text-[#8A86A4]">Fail-safe access if this account is locked.</p>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<label htmlFor="recoveryEmail" className="block text-xs font-medium text-[#A78BFA]">Recovery email</label>
									<input
										id="recoveryEmail"
										type="email"
										value={recovery.email}
										readOnly
										className="admin-dashboard-panel-soft h-11 w-full rounded-2xl border border-[rgba(177,59,255,0.22)] bg-white/70 px-4 text-sm text-[#8A86A4] outline-none"
									/>
								</div>
								<div className="space-y-2">
									<label htmlFor="recoveryPhone" className="block text-xs font-medium text-[#A78BFA]">Recovery phone number</label>
									<input
										id="recoveryPhone"
										type="tel"
										value={recovery.phoneNumber}
									onChange={(event) => {
										const normalized = normalizePhoneNumber(event.target.value);
										setRecovery((prev) => ({
											...prev,
											phoneNumber: normalized,
										}));
										const error = validatePhoneNumber(normalized);
										setRecoveryPhoneError(error);
									}}
									onBlur={() => {
										const error = validatePhoneNumber(recovery.phoneNumber);
										setRecoveryPhoneError(error);
									}}
									className={`admin-dashboard-panel-soft h-11 w-full rounded-2xl border px-4 text-sm outline-none ${
										recoveryPhoneError
											? "border-red-400 bg-red-50 text-red-700"
											: "border-[rgba(177,59,255,0.22)] bg-white/80 text-[#471396]"
									}`}
								/>
								{recoveryPhoneError && (
									<p className="mt-1 text-xs text-red-600">{recoveryPhoneError}</p>
								)}
								</div>
								<div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
									<div className="text-xs text-[#8A86A4]">Last updated {lastUpdatedRecovery}</div>
									<button
										onClick={() => setShowRecoverySaveConfirmation(true)}
									disabled={!hasRecoveryChanges || !!recoveryPhoneError}
									className={`rounded-xl px-8 py-3 text-sm font-semibold shadow transition-colors ${
										hasRecoveryChanges && !recoveryPhoneError
												? "bg-[#FFCC00] text-[#232323] hover:opacity-90"
												: "bg-gray-200 text-gray-500 cursor-not-allowed"
										}`}
									>
										Save Changes
									</button>
								</div>
								<div className="admin-dashboard-inset-panel md:col-span-2 flex flex-col gap-3 rounded-[28px] border border-[rgba(177,59,255,0.18)] bg-white/40 p-6 md:flex-row md:items-center md:justify-between">
									<div>
										<div className="text-lg font-semibold text-[#471396]">Reset account access</div>
										<p className="text-sm text-[#8A86A4]">Emergency reset for locked-out scenarios.</p>
									</div>
									<button className="rounded-xl bg-[#FF4343] px-8 py-3 text-sm font-semibold text-white hover:opacity-90">
										Reset access
									</button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</div>

			<AnimatePresence>
				{showRecoverySaveConfirmation && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(215,204,245,0.66)] px-4 backdrop-blur-[4px]"
					>
						<motion.div
							initial={{ y: 12, opacity: 0, scale: 0.98 }}
							animate={{ y: 0, opacity: 1, scale: 1 }}
							exit={{ y: 8, opacity: 0, scale: 0.98 }}
							transition={{ duration: 0.2 }}
							className="admin-dashboard-panel w-full max-w-md rounded-2xl border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-6 shadow-[0_20px_50px_rgba(123,78,192,0.18)]"
						>
							<h3 className="text-lg font-semibold text-[#471396]">Confirm changes</h3>
							<p className="mt-2 text-sm text-[#8A86A4]">Save updates to the recovery phone number?</p>
							<div className="mt-6 flex items-center justify-end gap-3">
								<button
									type="button"
									onClick={() => setShowRecoverySaveConfirmation(false)}
									className="rounded-xl border border-[rgba(177,59,255,0.18)] px-4 py-2 text-sm font-semibold text-[#8A86A4] hover:bg-white/60"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => {
										setSavedRecovery(recovery);
										setLastUpdatedRecovery("Just now");
										setShowRecoverySaveConfirmation(false);
									}}
									className="rounded-xl bg-[#FFCC00] px-4 py-2 text-sm font-semibold text-[#232323] hover:opacity-90"
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
