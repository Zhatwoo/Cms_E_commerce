"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";
import { getMe, updateProfile } from "@/lib/api";
import { addNotification } from "@/lib/notifications";
import { AlertCircle, Check, Loader2, Phone, Mail, ShieldAlert } from "lucide-react";

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
	const [initialLoading, setInitialLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const res = await getMe();
				if (res.success && res.user) {
					const initial = {
						email: res.user.email || "",
						phoneNumber: res.user.phone || "+63",
					};
					setRecovery(initial);
					setSavedRecovery(initial);
				}
			} finally {
				setInitialLoading(false);
			}
		};
		fetchUser();
	}, []);

	const [lastUpdatedRecovery, setLastUpdatedRecovery] = useState("Checking...");
	const [showRecoverySaveConfirmation, setShowRecoverySaveConfirmation] = useState(false);
	const [recoveryPhoneError, setRecoveryPhoneError] = useState("");

	const validatePhoneNumber = (phone: string) => {
		const digitsOnly = phone.replace(/\D/g, "");
		if (digitsOnly.length === 0 || digitsOnly === "63") return ""; // Allow empty/prefix starting state
		
		if (digitsOnly.length < 12 || !digitsOnly.startsWith("63")) {
			return "Invalid format (+639XXXXXXXXX)";
		}
		const localNumber = digitsOnly.slice(2);
		if (localNumber.length !== 10) {
			return "Must be 10 digits after prefix";
		}
		return "";
	};

	const hasRecoveryChanges = useMemo(
		() => JSON.stringify(recovery) !== JSON.stringify(savedRecovery),
		[recovery, savedRecovery]
	);

	const isPhoneValid = recovery.phoneNumber.length === 13 && !recoveryPhoneError;

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
						className="admin-dashboard-panel space-y-8 rounded-[32px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-10 shadow-[0_10px_26px_rgba(123,78,192,0.15)]"
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<div className="flex items-center justify-between mb-8">
								<div>
									<h2 className="text-3xl font-bold text-[#471396] tracking-tight">Recovery Options</h2>
									<p className="mt-1 text-sm font-medium text-[#8A86A4]">Fail-safe access methods if your account is ever locked.</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-[rgba(177,59,255,0.1)]">
									<ShieldAlert className="text-[#4a1a8a]" size={24} />
								</div>
							</div>

							<div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
								<div className="space-y-8">
									<div className="space-y-6">
										<div className="space-y-2.5">
											<div className="flex items-center justify-between">
												<label htmlFor="recoveryEmail" className="text-[10px] font-black tracking-[0.1em] text-[#9CA3AF] uppercase">RECOVERY EMAIL</label>
												<span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
													<Check size={10} strokeWidth={3} />
													Verified
												</span>
											</div>
											<div className="relative group">
												<div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
													<Mail size={18} />
												</div>
												<input
													id="recoveryEmail"
													type="email"
													value={recovery.email}
													readOnly
													className="w-full rounded-2xl border-2 border-emerald-100/50 bg-emerald-50/20 pl-11 pr-4 py-3.5 text-sm font-bold text-[#4a1a8a] outline-none cursor-default shadow-sm shadow-emerald-100/10"
												/>
											</div>
										</div>

										<div className="space-y-2.5">
											<label htmlFor="recoveryPhone" className="text-[10px] font-black tracking-[0.1em] text-[#9CA3AF] uppercase">RECOVERY PHONE NUMBER</label>
											<div className="relative group">
												<div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${recoveryPhoneError ? "text-red-400" : isPhoneValid ? "text-emerald-500" : "text-[#4a1a8a]"}`}>
													<Phone size={18} />
												</div>
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
													placeholder="+63 9XX XXX XXXX"
													className={`w-full rounded-2xl border-2 pl-11 pr-12 py-3.5 text-sm font-bold transition-all outline-none focus:ring-4 ${
														recoveryPhoneError
															? "border-red-200 bg-red-50/30 text-red-700 focus:ring-red-100/50"
															: isPhoneValid
															? "border-emerald-200 bg-emerald-50/30 text-[#374151] focus:ring-emerald-100/50"
															: "border-[rgba(166,61,255,0.12)] bg-white text-[#374151] focus:border-[#4a1a8a] focus:ring-[#4a1a8a]/5"
													}`}
												/>
												<div className="absolute right-4 top-1/2 -translate-y-1/2">
													{recoveryPhoneError ? (
														<AlertCircle size={18} className="text-red-400" />
													) : isPhoneValid ? (
														<div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white animate-in zoom-in-50">
															<Check size={12} strokeWidth={4} />
														</div>
													) : null}
												</div>
											</div>
											{recoveryPhoneError && (
												<p className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-red-500 uppercase tracking-tight animate-in slide-in-from-top-1">
													<AlertCircle size={12} />
													{recoveryPhoneError}
												</p>
											)}
										</div>
									</div>

									<div className="flex items-center justify-between bg-white/40 p-4 rounded-2xl border border-white/60">
										<div className="flex items-center gap-3">
											{initialLoading || saving ? (
												<Loader2 size={14} className="text-[#4a1a8a] animate-spin" />
											) : (
												<div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
											)}
											<span className="text-[10px] font-black tracking-widest text-[#9CA3AF] uppercase">
												STATUS: {saving ? "UPDATING..." : "PROTECTED"}
											</span>
										</div>
										<button
											onClick={() => setShowRecoverySaveConfirmation(true)}
											disabled={!hasRecoveryChanges || !!recoveryPhoneError || saving}
											className={`rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] shadow-lg transition-all active:scale-95 ${
												hasRecoveryChanges && !recoveryPhoneError
													? "bg-[#4a1a8a] text-white hover:shadow-[#4a1a8a]/30 hover:-translate-y-0.5 active:translate-y-0"
													: "bg-gray-100 text-[#D1D5DB] cursor-not-allowed shadow-none"
											}`}
										>
											{saving ? "Saving..." : "Apply Changes"}
										</button>
									</div>
									<p className="text-[10px] font-bold text-[#8A86A4] uppercase tracking-widest text-center">Last Updated: {lastUpdatedRecovery}</p>
								</div>

								<div className="admin-dashboard-inset-panel group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-red-100 bg-white/40 p-10 shadow-sm transition-all duration-300 hover:bg-white/60 hover:shadow-xl hover:shadow-red-500/5 hover:-translate-y-1">
									<div className="absolute top-0 right-0 p-8 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-10">
										<AlertCircle size={120} className="text-red-600" />
									</div>
									<div className="relative z-10 space-y-4">
										<div className="flex items-center gap-3 text-red-600">
											<AlertCircle size={22} strokeWidth={2.5} />
											<h3 className="text-xl font-black uppercase tracking-tight">Emergency Reset</h3>
										</div>
										<p className="text-[13px] leading-relaxed font-semibold text-red-600/60 max-w-sm">DANGER ZONE: Use this only if your primary recovery methods are compromised. This initiates a full identity re-verification.</p>
									</div>
									<button className="relative z-10 mt-8 w-full overflow-hidden rounded-2xl bg-red-500 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-red-200/50 transition-all hover:bg-red-600 hover:shadow-red-300 active:scale-95 active:translate-y-0.5">
										<span className="relative z-10">Initiate System Reset</span>
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
									className="rounded-xl border border-[rgba(177,59,255,0.18)] px-4 py-2 text-sm font-semibold text-[#8A86A4] hover:bg-white/60 active:scale-95"
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
									className={`rounded-xl bg-[#FFCC00] px-4 py-2 text-sm font-semibold text-[#232323] hover:opacity-90 active:scale-95 ${saving ? "opacity-50 cursor-wait" : ""}`}
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
