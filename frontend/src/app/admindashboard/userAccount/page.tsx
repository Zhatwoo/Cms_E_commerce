"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminSidebar } from "../components/sidebar";
import { AdminHeader } from "../components/header";

const UserAvatar = () => (
	<div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
		<svg className="w-12 h-12 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
		</svg>
	</div>
);

const ChevronRightIcon = () => (
	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
	</svg>
);

interface UserAccountShellProps {
	activePath: string;
	children: React.ReactNode;
}

export function UserAccountShell({ activePath, children }: UserAccountShellProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="min-h-screen bg-gray-100 flex">
			<div className="hidden lg:block">
				<AdminSidebar />
			</div>

			{sidebarOpen && (
				<>
					<div
						className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
					<div className="lg:hidden">
						<AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
					</div>
				</>
			)}

			<div className="flex-1 flex flex-col min-h-screen">
				<AdminHeader />
				<div className="flex-1 bg-gray-100">
					<div className="px-8 py-6">
						<div className="mb-6">
							<h1 className="text-3xl font-semibold text-gray-900">Account & Settings</h1>
							<div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
								<span>Account & Settings</span>
								<ChevronRightIcon />
								<span className="text-slate-700">{activePath}</span>
							</div>
						</div>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}

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

function UserAccountBoard() {
	const initialProfile = {
		firstName: 'Admin',
		lastName: 'User',
		email: 'adminuser@cmd.com',
		phoneNumber: '+639171234567',
	};
	const initialRecovery = {
		email: 'recovery@cmd.com',
		phoneNumber: '+639171234567',
	};
	const [activeTab, setActiveTab] = useState('Profile');
	const [showChangePassword, setShowChangePassword] = useState(false);
	const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
	const [securityAlertsEnabled, setSecurityAlertsEnabled] = useState(true);
	const [websiteReportsEnabled, setWebsiteReportsEnabled] = useState(true);
	const [systemAnnouncementsEnabled, setSystemAnnouncementsEnabled] = useState(true);
	const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(true);
	const [profile, setProfile] = useState(initialProfile);
	const [savedProfile, setSavedProfile] = useState(initialProfile);
	const [lastUpdated, setLastUpdated] = useState('2 days ago');
	const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
	const [recovery, setRecovery] = useState(initialRecovery);
	const [savedRecovery, setSavedRecovery] = useState(initialRecovery);
	const [lastUpdatedRecovery, setLastUpdatedRecovery] = useState('2 days ago');
	const [showRecoverySaveConfirmation, setShowRecoverySaveConfirmation] = useState(false);
	const [emailVerified, setEmailVerified] = useState(false);

	const tabs = ['Profile', 'Security', /* 'Access Info', */ 'Activity', 'Notifications', 'Recovery'];
	const breadcrumbs = useMemo(() => activeTab, [activeTab]);
	const hasProfileChanges = useMemo(
		() => JSON.stringify(profile) !== JSON.stringify(savedProfile),
		[profile, savedProfile]
	);
	const hasRecoveryChanges = useMemo(
		() => JSON.stringify(recovery) !== JSON.stringify(savedRecovery),
		[recovery, savedRecovery]
	);

	const normalizePhoneNumber = (value: string) => {
		const digitsOnly = value.replace(/\D/g, '');
		if (!digitsOnly) {
			return '+63';
		}
		if (digitsOnly.startsWith('63')) {
			return `+${digitsOnly}`;
		}
		if (digitsOnly.startsWith('0')) {
			return `+63${digitsOnly.slice(1)}`;
		}
		return `+63${digitsOnly}`;
	};

	const activityItems = [
		{
			id: 1,
			action: 'Suspended user',
			target: 'User: janedoe@site.com',
			time: 'Today, 09:41 AM',
			status: 'Warning',
		},
		{
			id: 2,
			action: 'Approved website',
			target: 'Site: Blue Horizon Travel',
			time: 'Yesterday, 05:12 PM',
			status: 'Success',
		},
		{
			id: 3,
			action: 'Edited platform rule',
			target: 'Policy: Content moderation v3',
			time: 'Yesterday, 02:05 PM',
			status: 'Success',
		},
		{
			id: 4,
			action: 'Failed login attempt',
			target: 'System: Admin Panel',
			time: 'Jan 18, 2026 · 11:14 PM',
			status: 'Warning',
		},
	];

	return (
		<div className="flex-1 bg-gray-100 min-h-screen">
			<div className="px-8 py-6">
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.45 }}
					className="mb-6"
				>
					<h1 className="text-3xl font-semibold text-gray-900">Account & Settings</h1>
					<div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
						<span>Account & Settings</span>
						<ChevronRightIcon />
						<span className="text-slate-700">{breadcrumbs}</span>
					</div>
				</motion.div>

				<div className="grid grid-cols-12 gap-6">
					<div className="col-span-12 lg:col-span-3">
						<motion.div
							initial="hidden"
							animate="visible"
							variants={containerVariants}
							className="bg-white rounded-2xl shadow-[0_16px_40px_rgba(15,23,42,0.08)] border border-gray-200 p-4"
						>
							<motion.div className="space-y-2 text-sm" variants={containerVariants}>
								{tabs.map((tab) => (
									<motion.button
										key={tab}
										onClick={() => setActiveTab(tab)}
										variants={cardVariants}
										whileHover={{ x: 2 }}
										className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
											activeTab === tab
												? 'bg-slate-900 text-white'
												: 'text-gray-600 hover:bg-gray-100'
										}`}
									>
										{tab}
									</motion.button>
								))}
							</motion.div>
						</motion.div>
					</div>

					<div className="col-span-12 lg:col-span-9">
						<motion.div
							initial={{ opacity: 0, y: 14 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.45 }}
							className="bg-white rounded-2xl shadow-[0_16px_40px_rgba(15,23,42,0.08)] border border-gray-200 p-8"
						>
							<AnimatePresence mode="wait">
								{activeTab === 'Profile' && (
									<motion.div
										key="profile"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
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
													onChange={(event) =>
														setProfile((prev) => ({
															...prev,
															phoneNumber: normalizePhoneNumber(event.target.value),
														}))
													}
													className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</motion.div>
											<motion.div
												variants={cardVariants}
												className="md:col-span-2 flex flex-wrap items-center justify-between gap-3"
											>
												<div className="text-xs text-slate-500">
													Last updated {lastUpdated}
												</div>
												<button
													onClick={() => setShowSaveConfirmation(true)}
													disabled={!hasProfileChanges}
													className={`px-8 py-2 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 shadow transition-colors ${
														hasProfileChanges
															? 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500'
															: 'bg-gray-200 text-gray-500 cursor-not-allowed'
													}`}
												>
													Save Changes
												</button>
											</motion.div>
										</motion.div>
									</motion.div>
								)}

								{activeTab === 'Security' && (
									<motion.div
										key="security"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
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
												{showChangePassword ? 'Back to Security' : 'Change Password'}
											</button>
										</div>

										{showChangePassword ? (
											<div className="rounded-2xl border border-gray-200 bg-slate-50 p-6">
												<div className="mb-6">
													<h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
													<p className="text-sm text-gray-500">Use a strong password with at least 12 characters.</p>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div className="space-y-2">
														<label htmlFor="currentPassword" className="block text-sm text-gray-600">Current password</label>
														<input
															id="currentPassword"
															type="password"
															placeholder="Enter current password"
															className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
														/>
													</div>
													<div className="space-y-2">
														<label htmlFor="newPassword" className="block text-sm text-gray-600">New password</label>
														<input
															id="newPassword"
															type="password"
															placeholder="Create a new password"
															className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
														/>
													</div>
													<div className="space-y-2">
														<label htmlFor="confirmPassword" className="block text-sm text-gray-600">Confirm new password</label>
														<input
															id="confirmPassword"
															type="password"
															placeholder="Re-enter new password"
															className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
														/>
													</div>
													<div className="rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500">
														<div className="font-semibold text-gray-700 mb-2">Password checklist</div>
														<ul className="space-y-1">
															<li>At least 12 characters</li>
															<li>One uppercase and one lowercase letter</li>
															<li>One number or symbol</li>
														</ul>
													</div>
													<div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
														<div className="text-xs text-slate-500">Last change: Jan 08, 2026</div>
														<div className="flex items-center gap-3">
															<button
																type="button"
																onClick={() => setShowChangePassword(false)}
																className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
															>
																Cancel
															</button>
															<button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
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
																? 'bg-emerald-50 text-emerald-700'
																: 'bg-amber-50 text-amber-700'
														}`}
													>
														{emailVerified ? 'Verified' : 'Pending'}
													</div>
													<p className="mt-3 text-xs text-gray-500">
														{emailVerified ? `Confirmed for ${profile.email}` : `Pending confirmation for ${profile.email}`}
													</p>
													<button
														type="button"
														onClick={() => setEmailVerified(true)}
														disabled={emailVerified}
														className={`mt-4 w-full rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
															emailVerified
																? 'bg-gray-200 text-gray-500 cursor-not-allowed'
																: 'bg-slate-900 text-white hover:bg-slate-800'
														}`}
													>
														Confirm email
													</button>
												</div>

												{/* <div className="rounded-xl border border-gray-200 p-4">
													<div className="text-sm text-gray-500">Login Alerts</div>
													<div className="mt-3 flex items-center justify-between">
														<div>
															<div className="text-sm font-semibold text-gray-900">Email on new login</div>
															<p className="text-xs text-gray-500">Notify on new device or IP.</p>
														</div>
														<button
															type="button"
															role="switch"
															aria-checked={loginAlertsEnabled}
															onClick={() => setLoginAlertsEnabled((prev) => !prev)}
															className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
																loginAlertsEnabled ? 'bg-slate-900' : 'bg-gray-200'
															}`}
														>
															<span
																className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
																	loginAlertsEnabled ? 'translate-x-6' : 'translate-x-1'
																}`}
															/>
														</button>
													</div>
												</div> */}

												<div className="rounded-xl border border-gray-200 p-4">
													<div className="text-sm text-gray-500">Last Password Change</div>
													<div className="mt-2 text-sm font-semibold text-gray-900">Jan 08, 2026 · 10:22 AM</div>
													<p className="mt-1 text-xs text-gray-500">Recommended: change every 90 days.</p>
												</div>

												{/* <div className="rounded-xl border border-gray-200 p-4">
													<div className="text-sm text-gray-500">Active Sessions</div>
													<div className="mt-2 text-sm font-semibold text-gray-900">4 devices signed in</div>
													<button className="mt-3 w-full rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
														Sign out of all devices
													</button>
												</div> */}
											</div>
										)}
									</motion.div>
								)}

								{/* {activeTab === 'Access Info' && (
									<motion.div
										key="access-info"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.3 }}
									>
										<div className="flex items-center justify-between mb-6">
											<div>
												<h2 className="text-xl font-semibold text-gray-900">Access Overview</h2>
												<p className="text-sm text-gray-500">Informational only. No edits available.</p>
											</div>
											<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">View-only</span>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="rounded-xl border border-gray-200 p-4">
												<div className="text-xs text-gray-500">Admin Level</div>
												<div className="mt-2 text-sm font-semibold text-gray-900">Platform Administrator</div>
											</div>
											<div className="rounded-xl border border-gray-200 p-4">
												<div className="text-xs text-gray-500">Account Status</div>
												<div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
													Active
												</div>
											</div>
											<div className="rounded-xl border border-gray-200 p-4">
												<div className="text-xs text-gray-500">Panel Access Scope</div>
												<div className="mt-2 text-sm font-semibold text-gray-900">Full Admin Panel</div>
												<p className="mt-1 text-xs text-gray-500">All moderation, billing, and system tools.</p>
											</div>
											<div className="rounded-xl border border-gray-200 p-4">
												<div className="text-xs text-gray-500">Last Login</div>
												<div className="mt-2 text-sm font-semibold text-gray-900">Feb 09, 2026 · 6:22 PM</div>
												<div className="mt-1 text-xs text-gray-500">IP: 172.16.24.120</div>
											</div>
										</div>
									</motion.div>
								)} */}

								{activeTab === 'Activity' && (
									<motion.div
										key="activity"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.3 }}
									>
										<div className="flex items-center justify-between mb-6">
											<div>
												<h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
												<p className="text-sm text-gray-500">Audit trail for this admin account.</p>
											</div>
											{/* <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50">
												Export Log
											</button> */}
										</div>

										<div className="space-y-3">
											{activityItems.map((item) => (
												<div key={item.id} className="rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center gap-3">
													<div className="flex-1">
														<div className="text-sm font-semibold text-gray-900">{item.action}</div>
														<div className="text-xs text-gray-500">{item.target}</div>
													</div>
													<div className="text-xs text-gray-500 md:w-40 md:text-right">{item.time}</div>
													<span
														className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
															item.status === 'Success'
																	? 'bg-emerald-50 text-emerald-700'
																: 'bg-amber-50 text-amber-700'
														}`}
													>
														{item.status}
													</span>
												</div>
											))}
										</div>
									</motion.div>
								)}

								{activeTab === 'Notifications' && (
									<motion.div
										key="notifications"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.3 }}
									>
										<div className="mb-6">
											<h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
											<p className="text-sm text-gray-500">Grouped alerts to keep the inbox focused.</p>
										</div>

										<div className="space-y-4">
											<div className="rounded-xl border border-gray-200 p-4">
												<div className="text-sm font-semibold text-gray-900">Security Alerts</div>
												<p className="text-xs text-gray-500">Login attempts and password changes.</p>
												<div className="mt-3 flex items-center justify-between">
													<span className="text-sm text-gray-600">Email me for security alerts</span>
													<button
														type="button"
														role="switch"
														aria-checked={securityAlertsEnabled ? "true" : "false"}
														aria-label="Toggle security alert emails"
														onClick={() => setSecurityAlertsEnabled((prev) => !prev)}
														className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
															securityAlertsEnabled ? 'bg-slate-900' : 'bg-gray-200'
														}`}
													>
														<span
															className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
																securityAlertsEnabled ? 'translate-x-6' : 'translate-x-1'
															}`}
														/>
													</button>
												</div>
											</div>

											<div className="rounded-xl border border-gray-200 p-4">
												<div className="text-sm font-semibold text-gray-900">Website Reports</div>
												<p className="text-xs text-gray-500">Flagged sites and abuse reports.</p>
												<div className="mt-3 flex items-center justify-between">
													<span className="text-sm text-gray-600">Send website reports</span>
													<button
														type="button"
														role="switch"
														aria-checked={websiteReportsEnabled ? "true" : "false"}
														aria-label="Toggle website report notifications"
														onClick={() => setWebsiteReportsEnabled((prev) => !prev)}
														className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
															websiteReportsEnabled ? 'bg-slate-900' : 'bg-gray-200'
														}`}
													>
														<span
															className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
																websiteReportsEnabled ? 'translate-x-6' : 'translate-x-1'
															}`}
														/>
													</button>
												</div>
											</div>

											<div className="rounded-xl border border-gray-200 p-4">
												<div className="text-sm font-semibold text-gray-900">System Announcements</div>
												<p className="text-xs text-gray-500">Maintenance and platform updates.</p>
												<div className="mt-3 flex items-center justify-between">
													<span className="text-sm text-gray-600">Notify me about platform changes</span>
													<button
														type="button"
														role="switch"
														aria-checked={systemAnnouncementsEnabled ? "true" : "false"}
														aria-label="Toggle system announcement notifications"
														onClick={() => setSystemAnnouncementsEnabled((prev) => !prev)}
														className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
															systemAnnouncementsEnabled ? 'bg-slate-900' : 'bg-gray-200'
														}`}
													>
														<span
															className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
																systemAnnouncementsEnabled ? 'translate-x-6' : 'translate-x-1'
															}`}
														/>
													</button>
												</div>
											</div>

											<div className="rounded-xl border border-gray-200 p-4">
												<div className="text-sm font-semibold text-gray-900">Weekly Summary Email</div>
												<p className="text-xs text-gray-500">High-level performance summary.</p>
												<div className="mt-3 flex items-center justify-between">
													<span className="text-sm text-gray-600">Send weekly digest</span>
													<button
														type="button"
														role="switch"
														aria-checked={weeklySummaryEnabled ? "true" : "false"}
														aria-label="Toggle weekly summary emails"
														onClick={() => setWeeklySummaryEnabled((prev) => !prev)}
														className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
															weeklySummaryEnabled ? 'bg-slate-900' : 'bg-gray-200'
														}`}
													>
														<span
															className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
																weeklySummaryEnabled ? 'translate-x-6' : 'translate-x-1'
															}`}
														/>
													</button>
												</div>
											</div>
										</div>
									</motion.div>
								)}

								{activeTab === 'Recovery' && (
									<motion.div
										key="recovery"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
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
													onChange={(event) =>
														setRecovery((prev) => ({
															...prev,
															phoneNumber: normalizePhoneNumber(event.target.value),
														}))
													}
													className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</div>
											<div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
												<div className="text-xs text-slate-500">
													Last updated {lastUpdatedRecovery}
												</div>
												<button
													onClick={() => setShowRecoverySaveConfirmation(true)}
													disabled={!hasRecoveryChanges}
													className={`px-8 py-2 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 shadow transition-colors ${
														hasRecoveryChanges
															? 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500'
															: 'bg-gray-200 text-gray-500 cursor-not-allowed'
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
								)}
							</AnimatePresence>
						</motion.div>
					</div>
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
										setLastUpdated('Just now');
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
										setLastUpdatedRecovery('Just now');
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
		</div>
	);
}

export default function UserAccountPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="min-h-screen bg-gray-100 flex">
			<div className="hidden lg:block">
				<AdminSidebar />
			</div>

			{sidebarOpen && (
				<>
					<div
						className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
					<div className="lg:hidden">
						<AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
					</div>
				</>
			)}

			<div className="flex-1 flex flex-col min-h-screen">
				<AdminHeader />
				<UserAccountBoard />
			</div>
		</div>
	);
}

//Improved version with better animations and more polished UI.