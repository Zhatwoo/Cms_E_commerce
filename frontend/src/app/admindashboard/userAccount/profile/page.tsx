"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";

const normalizePhoneNumber = (value: string) => {
	const digitsOnly = value.replace(/\D/g, "");
	if (!digitsOnly || digitsOnly === "6" || digitsOnly === "63") return "+63";

	let localNumber = "";
	if (digitsOnly.startsWith("63") && digitsOnly.length > 2) localNumber = digitsOnly.slice(2);
	else if (digitsOnly.startsWith("0")) localNumber = digitsOnly.slice(1);
	else localNumber = digitsOnly;

	return `+63${localNumber.slice(0, 10)}`;
};

function ProfileAvatar() {
	return (
		<div className="flex h-24 w-24 items-center justify-center rounded-full border border-[rgba(177,59,255,0.24)] bg-white shadow-[0_10px_24px_rgba(123,78,192,0.12)]">
			<svg className="h-14 w-14 text-[#B13BFF]" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
			</svg>
		</div>
	);
}

export default function ProfilePage() {
	const initialProfile = {
		firstName: "Admin",
		lastName: "User",
		email: "adminuser@cms.com",
		phoneNumber: "+639171234567",
	};

	const [profile, setProfile] = useState(initialProfile);
	const [savedProfile, setSavedProfile] = useState(initialProfile);
	const [lastUpdated, setLastUpdated] = useState("2 days ago");
	const [phoneError, setPhoneError] = useState("");
	const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

	const hasProfileChanges = useMemo(
		() => JSON.stringify(profile) !== JSON.stringify(savedProfile),
		[profile, savedProfile]
	);

	const validatePhoneNumber = (phone: string) => {
		const digitsOnly = phone.replace(/\D/g, "");
		if (digitsOnly.length < 12 || !digitsOnly.startsWith("63")) {
			return "Please enter a valid Philippine phone number (+639XXXXXXXXX)";
		}
		if (digitsOnly.slice(2).length !== 10) {
			return "Phone number must be 10 digits after +63";
		}
		return "";
	};

	return (
		<UserAccountShell activePath="Profile">
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
						<div className="mb-8 flex flex-col items-center text-center">
							<ProfileAvatar />
							<h2 className="mt-5 text-2xl font-semibold text-[#471396]">Admin User</h2>
							<p className="mt-1 text-sm font-medium text-[#B13BFF]">{profile.email}</p>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label htmlFor="firstName" className="mb-2 block text-xs font-medium text-[#A78BFA]">First Name</label>
								<input id="firstName" type="text" value={profile.firstName} readOnly className="admin-dashboard-panel-soft h-11 w-full rounded-2xl border border-[rgba(177,59,255,0.22)] bg-white/70 px-4 text-sm text-[#8A86A4] outline-none" />
							</div>
							<div>
								<label htmlFor="lastName" className="mb-2 block text-xs font-medium text-[#A78BFA]">Last Name</label>
								<input id="lastName" type="text" value={profile.lastName} readOnly className="admin-dashboard-panel-soft h-11 w-full rounded-2xl border border-[rgba(177,59,255,0.22)] bg-white/70 px-4 text-sm text-[#8A86A4] outline-none" />
							</div>
							<div>
								<label htmlFor="email" className="mb-2 block text-xs font-medium text-[#A78BFA]">Email</label>
								<input id="email" type="email" value={profile.email} readOnly className="admin-dashboard-panel-soft h-11 w-full rounded-2xl border border-[rgba(177,59,255,0.22)] bg-white/70 px-4 text-sm text-[#8A86A4] outline-none" />
							</div>
							<div>
								<label htmlFor="phoneNumber" className="mb-2 block text-xs font-medium text-[#A78BFA]">Phone Number</label>
								<input
									id="phoneNumber"
									type="tel"
									value={profile.phoneNumber}
									onChange={(event) => {
										const normalized = normalizePhoneNumber(event.target.value);
										setProfile((prev) => ({ ...prev, phoneNumber: normalized }));
										setPhoneError(validatePhoneNumber(normalized));
									}}
									onBlur={() => setPhoneError(validatePhoneNumber(profile.phoneNumber))}
									className={`admin-dashboard-panel-soft h-11 w-full rounded-2xl border px-4 text-sm outline-none ${
										phoneError
											? "border-red-400 bg-red-50 text-red-700"
											: "border-[rgba(177,59,255,0.22)] bg-white/80 text-[#471396]"
									}`}
								/>
								{phoneError ? <p className="mt-1 text-xs text-red-600">{phoneError}</p> : null}
							</div>
						</div>

						<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
							<p className="text-xs text-[#8A86A4]">Last updated {lastUpdated}</p>
							<button
								type="button"
								onClick={() => setShowSaveConfirmation(true)}
								disabled={!hasProfileChanges || !!phoneError}
								className={`rounded-xl px-8 py-3 text-sm font-semibold shadow transition-colors ${
									hasProfileChanges && !phoneError ? "bg-[#FFCC00] text-[#232323] hover:opacity-90" : "bg-gray-200 text-gray-500 cursor-not-allowed"
								}`}
							>
								Save Changes
							</button>
						</div>
					</motion.div>
				</div>
			</div>

			<AnimatePresence>
				{showSaveConfirmation ? (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(215,204,245,0.66)] px-4 backdrop-blur-[4px]">
						<motion.div initial={{ y: 12, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 8, opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="admin-dashboard-panel w-full max-w-md rounded-2xl border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-6 shadow-[0_20px_50px_rgba(123,78,192,0.18)]">
							<h3 className="text-lg font-semibold text-[#471396]">Confirm changes</h3>
							<p className="mt-2 text-sm text-[#8A86A4]">Save updates to the profile phone number?</p>
							<div className="mt-6 flex items-center justify-end gap-3">
								<button type="button" onClick={() => setShowSaveConfirmation(false)} className="rounded-xl border border-[rgba(177,59,255,0.18)] px-4 py-2 text-sm font-semibold text-[#8A86A4] hover:bg-white/60">Cancel</button>
								<button
									type="button"
									onClick={() => {
										setSavedProfile(profile);
										setLastUpdated("Just now");
										setShowSaveConfirmation(false);
									}}
									className="rounded-xl bg-[#FFCC00] px-4 py-2 text-sm font-semibold text-[#232323] hover:opacity-90"
								>
									Confirm
								</button>
							</div>
						</motion.div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</UserAccountShell>
	);
}
