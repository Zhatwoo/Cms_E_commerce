"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AdminSidebar } from "../components/sidebar";
import { AdminHeader } from "../components/header";

export default function NotificationsPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("list");
	const [actionState, setActionState] = useState<"none" | "read" | "delete">("none");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [notifications, setNotifications] = useState([
		{
			id: "n1",
			title: "New notification available",
			time: "17 : 00",
			date: "January 1, 2026",
			read: false,
		},
		{
			id: "n2",
			title: "New notification available",
			time: "14 : 00",
			date: "January 1, 2026",
			read: false,
		},
	]);
	const [trash, setTrash] = useState<typeof notifications>([]);
	const [notificationSettings, setNotificationSettings] = useState([
		{
			id: "evt-site-publish",
			label: "A site was published",
			email: true,
			push: true,
		},
		{
			id: "evt-template-update",
			label: "A template was updated",
			email: true,
			push: true,
		},
		{
			id: "evt-custom-domain",
			label: "Custom domain verification failed",
			email: true,
			push: true,
		},
	]);

	const allSelected = notifications.length > 0 && selectedIds.length === notifications.length;

	const toggleSelectAll = (checked: boolean) => {
		setSelectedIds(checked ? notifications.map((item) => item.id) : []);
	};

	const toggleSelectOne = (id: string, checked: boolean) => {
		setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
	};

	const handleMarkAsRead = () => {
		const shouldMarkUnread = actionState === "read";
		setActionState(shouldMarkUnread ? "none" : "read");
		setNotifications((prev) =>
			prev.map((item) =>
				selectedIds.includes(item.id) ? { ...item, read: shouldMarkUnread ? false : true } : item
			)
		);
	};

	const handleDelete = () => {
		if (actionState === "delete") {
			setActionState("none");
			return;
		}
		const toTrash = notifications.filter((item) => selectedIds.includes(item.id));
		setActionState("delete");
		if (toTrash.length > 0) {
			setTrash((current) => {
				const existingIds = new Set(current.map((item) => item.id));
				const uniqueItems = toTrash.filter((item) => !existingIds.has(item.id));
				return uniqueItems.length > 0 ? [...uniqueItems, ...current] : current;
			});
		}
		setNotifications((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
		setSelectedIds([]);
	};

	const handleRestore = (id: string) => {
		const restored = trash.find((item) => item.id === id);
		if (!restored) {
			return;
		}
		setTrash((prev) => prev.filter((item) => item.id !== id));
		setNotifications((current) =>
			current.some((item) => item.id === restored.id) ? current : [restored, ...current]
		);
	};

	const handlePermanentDelete = (id: string) => {
		setTrash((prev) => prev.filter((item) => item.id !== id));
	};

	const unreadCount = notifications.filter((item) => !item.read).length;

	const handleSettingToggle = (id: string, channel: "email" | "push") => {
		setNotificationSettings((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, [channel]: !item[channel] } : item
			)
		);
	};

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

				<div className="flex-1 p-8 bg-gray-100">
					<div className="w-full max-w-none">
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.45 }}
							className="mb-6"
						>
							<h1 className="text-3xl font-semibold text-gray-900">Notifications</h1>
							<div className="text-sm text-slate-500 mt-1">Inbox and delivery preferences</div>
						</motion.div>

						<div className="inline-flex rounded-full bg-slate-200 p-1 mb-6 shadow-inner">
							<button
								onClick={() => setActiveTab("list")}
								className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
									activeTab === "list"
										? "bg-blue-500 text-white shadow"
										: "text-gray-700 hover:bg-gray-300"
								}`}
							>
								<span className="mr-2">List</span>
								<span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-white text-gray-900">
									{unreadCount}
								</span>
							</button>
							<button
								onClick={() => setActiveTab("configure")}
								className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
									activeTab === "configure"
										? "bg-white text-gray-900 shadow"
										: "text-gray-700 hover:bg-gray-300"
								}`}
							>
								Configure
							</button>
							<button
								onClick={() => setActiveTab("trash")}
								className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
									activeTab === "trash"
										? "bg-white text-gray-900 shadow"
										: "text-gray-700 hover:bg-gray-300"
								}`}
							>
								Trash
							</button>
						</div>

						<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
							<AnimatePresence mode="wait">
								{activeTab === "list" && (
									<motion.div
										key="list"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.3 }}
									>
										<div className="text-sm text-gray-600 mb-4">Today</div>

										<div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 mb-6">
											<label className="inline-flex items-center gap-2">
												<input
													type="checkbox"
													checked={allSelected}
													onChange={(event) => toggleSelectAll(event.target.checked)}
													className="h-4 w-4"
													aria-label="Select all notifications"
												/>
												Select All
											</label>
											<motion.button
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
												onClick={handleMarkAsRead}
												className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-800 hover:bg-emerald-500 hover:text-white transition-colors"
											>
												<span>Mark as Read</span>
												<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
												</svg>
											</motion.button>
											<motion.button
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
												onClick={handleDelete}
												className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-800 hover:bg-red-500 hover:text-white transition-colors"
											>
												<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M9 7V5h6v2m-7 0v12a2 2 0 002 2h4a2 2 0 002-2V7" />
												</svg>
												<span>Delete</span>
											</motion.button>
										</div>

										{notifications.length === 0 ? (
											<motion.div
												initial={{ opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												className="border border-gray-200 rounded-xl p-6 text-center text-gray-600"
											>
												No new notifications
											</motion.div>
										) : (
											<motion.div
												initial="hidden"
												animate="visible"
												variants={{
													hidden: { opacity: 0 },
													visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
												}}
												className="space-y-4"
											>
												{notifications.map((item) => (
													<motion.div
														key={item.id}
														variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
														className="border border-gray-200 rounded-2xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
												>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-4">
																<input
																	type="checkbox"
																	checked={selectedIds.includes(item.id)}
																	onChange={(event) => toggleSelectOne(item.id, event.target.checked)}
																	className="h-4 w-4"
																	aria-label={`Select notification at ${item.time}`}
																/>
																<div>
																	<div className="text-gray-900 font-semibold">{item.title}</div>
																	<div className="text-xs text-gray-500">{item.time}</div>
																</div>
															</div>
															<div className="flex items-center gap-4 text-sm text-gray-500">
																<span>{item.date}</span>
																<span className={item.read ? "text-emerald-500" : "text-rose-500"}>
																	{item.read ? "✔" : "✖"}
																</span>
															</div>
														</div>
													</motion.div>
												))}
											</motion.div>
										)}

										<div className="text-sm text-gray-600 mt-8">Yesterday</div>
									</motion.div>
								)}

								{activeTab === "configure" && (
									<motion.div
										key="configure"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.3 }}
										className="border border-gray-200 rounded-2xl overflow-hidden"
									>
										<div className="grid grid-cols-[80px_80px_1fr] gap-4 px-6 py-4 bg-gray-50 text-sm font-semibold text-gray-700 justify-items-center">
											<div>Email</div>
											<div>Push</div>
											<div className="justify-self-start">Event</div>
										</div>
										<div className="divide-y divide-gray-200">
											{notificationSettings.map((item) => (
												<div key={item.id} className="grid grid-cols-[80px_80px_1fr] gap-4 px-6 py-4 text-sm text-gray-800 justify-items-center">
													<div className="flex items-center justify-center">
														<input
															type="checkbox"
															checked={item.email}
															onChange={() => handleSettingToggle(item.id, "email")}
															className="h-4 w-4"
															aria-label={`Email notification for ${item.label}`}
														/>
													</div>
													<div className="flex items-center justify-center">
														<input
															type="checkbox"
															checked={item.push}
															onChange={() => handleSettingToggle(item.id, "push")}
															className="h-4 w-4"
															aria-label={`Push notification for ${item.label}`}
														/>
													</div>
													<div className="justify-self-start">{item.label}</div>
												</div>
											))}
										</div>
									</motion.div>
								)}

								{activeTab === "trash" && (
									<motion.div
										key="trash"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.3 }}
										className="space-y-4"
									>
										{trash.length === 0 ? (
											<div className="border border-gray-200 rounded-xl p-6 text-center text-gray-600">
												Trash is empty
											</div>
										) : (
											trash.map((item) => (
												<motion.div
													key={item.id}
													initial={{ opacity: 0, y: 8 }}
													animate={{ opacity: 1, y: 0 }}
													className="border border-gray-200 rounded-2xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
												>
													<div className="flex items-center justify-between">
														<div>
															<div className="text-gray-900 font-semibold">{item.title}</div>
															<div className="text-xs text-gray-500">{item.time}</div>
														</div>
														<div className="flex items-center gap-3">
															<button
																onClick={() => handleRestore(item.id)}
																className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-sm"
															>
																Restore
															</button>
															<button
																onClick={() => handlePermanentDelete(item.id)}
																className="px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 text-sm"
															>
																Delete Permanently
															</button>
														</div>
													</div>
												</motion.div>
											))
										)}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}