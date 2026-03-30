"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";
import { getMe, updateProfile } from "@/lib/api";
import { addNotification } from "@/lib/notifications";

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
	const [recovery, setRecovery] = useState({
		email: "",
		phoneNumber: "",
	});
	const [savedRecovery, setSavedRecovery] = useState({
		email: "",
		phoneNumber: "",
	});
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const fetchUser = async () => {
			const res = await getMe();
			if (res.success && res.user) {
				const initial = {
					email: res.user.email || "",
					phoneNumber: res.user.phone || "+63",
				};
				setRecovery(initial);
				setSavedRecovery(initial);
			}
		};
		fetchUser();
	}, []);

	const [lastUpdatedRecovery, setLastUpdatedRecovery] = useState("Checking...");
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

							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div className="space-y-6">
									<div className="space-y-4">
										<div className="space-y-2">
											<label htmlFor="recoveryEmail" className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">RECOVERY EMAIL</label>
											<input
												id="recoveryEmail"
												type="email"
												value={recovery.email}
												readOnly
												className="w-full rounded-xl bg-transparent py-3 text-sm font-semibold text-[#7a6aa0] outline-none cursor-default"
											/>
										</div>
										<div className="space-y-2">
											<label htmlFor="recoveryPhone" className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">RECOVERY PHONE NUMBER</label>
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
												className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all focus:ring-2 ${
													recoveryPhoneError
														? "border-red-200 bg-red-50/50 text-red-700 focus:ring-red-100"
														: "border-[rgba(166,61,255,0.16)] bg-[#F9FAFB] text-[#374151] focus:ring-[#4a1a8a]/10"
												}`}
											/>
											{recoveryPhoneError && (
												<p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{recoveryPhoneError}</p>
											)}
										</div>
									</div>

									<div className="flex flex-wrap items-center justify-between border-t border-[#F3F4F6] pt-6 gap-3">
										<div className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">LAST UPDATED: {lastUpdatedRecovery}</div>
										<button
											onClick={() => setShowRecoverySaveConfirmation(true)}
											disabled={!hasRecoveryChanges || !!recoveryPhoneError}
											className={`rounded-xl px-8 py-2.5 text-sm font-semibold shadow-sm transition-all ${
												hasRecoveryChanges && !recoveryPhoneError
													? "bg-[#4a1a8a] text-white hover:opacity-90 active:scale-95"
													: "bg-gray-100 text-gray-400 cursor-not-allowed"
											}`}
										>
											Save Changes
										</button>
									</div>
								</div>

								<div className="admin-dashboard-inset-panel flex flex-col justify-between rounded-[28px] border border-[rgba(239,68,68,0.12)] bg-red-50/20 p-8 shadow-sm">
									<div>
										<h3 className="text-lg font-bold text-red-700 mb-2">Internal Account Reset</h3>
										<p className="text-sm text-red-600/70 mb-6 font-medium">Use this as a last resort if all other access methods fail. This will reset all security tokens.</p>
									</div>
									<button className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 active:scale-95">
										Initiate System Reset
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
									disabled={saving}
									onClick={async () => {
										setSaving(true);
										try {
											const res = await updateProfile({ phone: recovery.phoneNumber });
											if (res.success) {
												setSavedRecovery(recovery);
												setLastUpdatedRecovery("Just now");
												setShowRecoverySaveConfirmation(false);
												addNotification("Recovery Updated", "Your recovery phone number has been saved.", "success");
											} else {
												throw new Error(res.message || "Failed to save");
											}
										} catch (err) {
											addNotification("Save Failed", err instanceof Error ? err.message : "Could not update recovery phone", "error");
										} finally {
											setSaving(false);
										}
									}}
									className={`rounded-xl bg-[#FFCC00] px-4 py-2 text-sm font-semibold text-[#232323] hover:opacity-90 ${saving ? "opacity-50 cursor-wait" : ""}`}
								>
									{saving ? "Saving..." : "Confirm"}
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</UserAccountShell>
	);
}
