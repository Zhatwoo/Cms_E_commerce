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
	const [activeTab, setActiveTab] = useState('Profile');

	const tabs = ['Profile', 'Security', 'Access Info', 'Activity', 'Notifications', 'Recovery'];
	const breadcrumbs = useMemo(() => activeTab, [activeTab]);

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
								{activeTab === 'Profile' ? (
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
											<div className="mt-4 text-lg font-semibold text-gray-900">Admin User</div>
											<div className="text-sm text-gray-500">adminuser@cmd.com</div>
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
													className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</motion.div>
											<motion.div variants={cardVariants}>
												<label htmlFor="lastName" className="block text-sm text-gray-600 mb-2">Last Name</label>
												<input
													id="lastName"
													type="text"
													className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</motion.div>
											<motion.div variants={cardVariants}>
												<label htmlFor="email" className="block text-sm text-gray-600 mb-2">Email</label>
												<input
													id="email"
													type="email"
													className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</motion.div>
											<motion.div variants={cardVariants}>
												<label htmlFor="phoneNumber" className="block text-sm text-gray-600 mb-2">Phone number</label>
												<input
													id="phoneNumber"
													type="tel"
													className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											</motion.div>
											<motion.div
												variants={cardVariants}
												className="md:col-span-2 flex flex-wrap items-center justify-between gap-3"
											>
												<div className="text-xs text-slate-500">
													Last updated 2 days ago
												</div>
												<button
													className="bg-blue-500 text-white px-8 py-2 rounded-full text-sm font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow"
												>
													Save Changes
												</button>
											</motion.div>
										</motion.div>
									</motion.div>
								) : (
									<motion.div
										key="coming-soon"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.3 }}
										className="flex items-center justify-center min-h-[400px]"
									>
										<div className="text-center">
											<div className="text-gray-400 text-lg">{activeTab} - Coming Soon</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					</div>
				</div>
			</div>
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