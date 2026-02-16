"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";

const UserAvatar = () => (
	<div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
		<svg className="w-12 h-12 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
		</svg>
	</div>
);

const cardVariants = {
	hidden: { opacity: 0, y: 14, scale: 0.98 },
	visible: { opacity: 1, y: 0, scale: 1 },
};

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.05,
		},
	},
};

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

export function ProfileSection() {
	const initialProfile = {
		firstName: "Admin",
		lastName: "User",
		email: "adminuser@cmd.com",
		phoneNumber: "+639171234567",
	};

	const [profile, setProfile] = useState(initialProfile);
	const [savedProfile, setSavedProfile] = useState(initialProfile);
	const [lastUpdated, setLastUpdated] = useState("2 days ago");
	const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
	const [phoneError, setPhoneError] = useState("");

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

	const hasProfileChanges = useMemo(
		() => JSON.stringify(profile) !== JSON.stringify(savedProfile),
		[profile, savedProfile]
	);

	return (
		<>
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
							<div className="flex flex-col items-center text-center mb-8">
								<motion.div
									initial={{ scale: 0.9, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{ duration: 0.35 }}
								>
									<UserAvatar />
								</motion.div>
								<div className="mt-4 text-lg font-semibold text-gray-900">{`${profile.firstName} ${profile.lastName}`}</div>
								<div className="text-sm text-gray-500">{profile.email}</div>
								<div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
									Primary account
								</div>
							</div>

							<motion.div
								className="grid grid-cols-1 md:grid-cols-2 gap-4"
								initial="hidden"
								animate="visible"
								variants={containerVariants}
							>
								<motion.div variants={cardVariants}>
									<label htmlFor="firstName" className="block text-sm text-gray-600 mb-2">First Name</label>
									<input
										id="firstName"
										type="text"
										value={profile.firstName}
										readOnly
										className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 shadow-sm focus:outline-none"
									/>
								</motion.div>
								<motion.div variants={cardVariants}>
									<label htmlFor="lastName" className="block text-sm text-gray-600 mb-2">Last Name</label>
									<input
										id="lastName"
										type="text"
										value={profile.lastName}
										readOnly
										className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 shadow-sm focus:outline-none"
									/>
								</motion.div>
								<motion.div variants={cardVariants}>
									<label htmlFor="email" className="block text-sm text-gray-600 mb-2">Email</label>
									<input
										id="email"
										type="email"
										value={profile.email}
										readOnly
										className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 shadow-sm focus:outline-none"
									/>
								</motion.div>
								<motion.div variants={cardVariants}>
									<label htmlFor="phoneNumber" className="block text-sm text-gray-600 mb-2">Phone number</label>
									<input
										id="phoneNumber"
										type="tel"
										value={profile.phoneNumber}
									onChange={(event) => {
										const normalized = normalizePhoneNumber(event.target.value);
										setProfile((prev) => ({
											...prev,
											phoneNumber: normalized,
										}));
										const error = validatePhoneNumber(normalized);
										setPhoneError(error);
									}}
									onBlur={() => {
										const error = validatePhoneNumber(profile.phoneNumber);
										setPhoneError(error);
									}}
									className={`w-full h-11 rounded-xl border px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 ${
										phoneError
											? "border-red-500 focus:ring-red-500 bg-red-50"
											: "border-gray-200 focus:ring-blue-500 bg-white"
									}`}
								/>
								{phoneError && (
									<p className="mt-1 text-xs text-red-600">{phoneError}</p>
								)}
								</motion.div>
								<motion.div
									variants={cardVariants}
									className="md:col-span-2 flex flex-wrap items-center justify-between gap-3"
								>
									<div className="text-xs text-slate-500">Last updated {lastUpdated}</div>
									<button
										onClick={() => setShowSaveConfirmation(true)}
									disabled={!hasProfileChanges || !!phoneError}
									className={`px-8 py-2 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 shadow transition-colors ${
										hasProfileChanges && !phoneError
												? "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500"
												: "bg-gray-200 text-gray-500 cursor-not-allowed"
										}`}
									>
										Save Changes
									</button>
								</motion.div>
							</motion.div>
						</motion.div>
					</motion.div>
				</div>
			</div>

			<AnimatePresence>
				{showSaveConfirmation && (
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
							<p className="mt-2 text-sm text-gray-500">Save updates to the profile phone number?</p>
							<div className="mt-6 flex items-center justify-end gap-3">
								<button
									type="button"
									onClick={() => setShowSaveConfirmation(false)}
									className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => {
										setSavedProfile(profile);
										setLastUpdated("Just now");
										setShowSaveConfirmation(false);
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
		</>
	);
}

export default function ProfilePage() {
	return (
		<UserAccountShell activePath="Profile">
			<ProfileSection />
		</UserAccountShell>
	);
}
