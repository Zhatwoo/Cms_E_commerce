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
						className="bg-white rounded-2xl shadow-[0_16px_40px_rgba(15,23,42,0.08)] border border-gray-200 p-8"
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<div className="flex items-center justify-between mb-6">
								<div>
									<h2 className="text-xl font-semibold text-gray-900">Recovery Options</h2>
									<p className="text-sm text-gray-500">Fail-safe access if this account is locked.</p>
								</div>
								{/* <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50">
									Generate backup codes
								</button> */}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<label htmlFor="recoveryEmail" className="block text-xs text-gray-500">Recovery email</label>
									<input
										id="recoveryEmail"
										type="email"
										value={recovery.email}
										readOnly
										className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 shadow-sm focus:outline-none"
									/>
								</div>
								<div className="space-y-2">
									<label htmlFor="recoveryPhone" className="block text-xs text-gray-500">Recovery phone number</label>
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
									className={`w-full h-11 rounded-xl border px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 ${
										recoveryPhoneError
											? "border-red-500 focus:ring-red-500 bg-red-50"
											: "border-gray-200 focus:ring-blue-500 bg-white"
									}`}
								/>
								{recoveryPhoneError && (
									<p className="mt-1 text-xs text-red-600">{recoveryPhoneError}</p>
								)}
								</div>
								<div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
									<div className="text-xs text-slate-500">Last updated {lastUpdatedRecovery}</div>
									<button
										onClick={() => setShowRecoverySaveConfirmation(true)}
									disabled={!hasRecoveryChanges || !!recoveryPhoneError}
									className={`px-8 py-2 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 shadow transition-colors ${
										hasRecoveryChanges && !recoveryPhoneError
												? "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500"
												: "bg-gray-200 text-gray-500 cursor-not-allowed"
										}`}
									>
										Save Changes
									</button>
								</div>
								<div className="md:col-span-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-gray-200 p-4">
									<div>
										<div className="text-sm font-semibold text-gray-900">Reset account access</div>
										<p className="text-xs text-gray-500">Emergency reset for locked-out scenarios.</p>
									</div>
									<button className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
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
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
					>
						<motion.div
							initial={{ y: 12, opacity: 0, scale: 0.98 }}
							animate={{ y: 0, opacity: 1, scale: 1 }}
							exit={{ y: 8, opacity: 0, scale: 0.98 }}
							transition={{ duration: 0.2 }}
							className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.25)]"
						>
							<h3 className="text-lg font-semibold text-gray-900">Confirm changes</h3>
							<p className="mt-2 text-sm text-gray-500">Save updates to the recovery phone number?</p>
							<div className="mt-6 flex items-center justify-end gap-3">
								<button
									type="button"
									onClick={() => setShowRecoverySaveConfirmation(false)}
									className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50"
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
