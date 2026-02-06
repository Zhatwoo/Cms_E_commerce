"use client";

import React, { useState } from "react";
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

	const allSelected = notifications.length > 0 && selectedIds.length === notifications.length;

	const toggleSelectAll = (checked: boolean) => {
		setSelectedIds(checked ? notifications.map((item) => item.id) : []);
	};

	const toggleSelectOne = (id: string, checked: boolean) => {
		setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
	};

	const handleMarkAsRead = () => {
		setActionState("read");
		setNotifications((prev) =>
			prev.map((item) =>
				selectedIds.includes(item.id) ? { ...item, read: true } : item
			)
		);
	};

	const handleDelete = () => {
		setActionState("delete");
		setNotifications((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
		setSelectedIds([]);
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
						<div className="mb-6">
							<h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
						</div>

						<div className="inline-flex rounded-lg bg-gray-200 p-1 mb-6">
							<button
								onClick={() => setActiveTab("list")}
								className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
									activeTab === "list"
										? "bg-blue-500 text-white shadow"
										: "text-gray-700 hover:bg-gray-300"
								}`}
							>
								<span className="mr-2">List</span>
								<span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-white text-gray-900">
									2
								</span>
							</button>
							<button
								onClick={() => setActiveTab("configure")}
								className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
									activeTab === "configure"
										? "bg-white text-gray-900 shadow"
										: "text-gray-700 hover:bg-gray-300"
								}`}
							>
								Configure
							</button>
						</div>

						<div className="bg-white border border-gray-200 rounded-xl p-6">
							<div className="text-sm text-gray-600 mb-4">Today</div>

							<div className="flex items-center gap-6 text-sm text-gray-700 mb-6">
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
								<button
									onClick={handleMarkAsRead}
									className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
										actionState === "read"
											? "bg-emerald-500 text-white"
											: "bg-gray-100 text-gray-800 hover:bg-gray-200"
									}`}
								>
									<span>Mark as Read</span>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
								</button>
								<button
									onClick={handleDelete}
									className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
										actionState === "delete"
											? "bg-red-500 text-white"
											: "bg-gray-100 text-gray-800 hover:bg-gray-200"
									}`}
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M9 7V5h6v2m-7 0v12a2 2 0 002 2h4a2 2 0 002-2V7" />
									</svg>
									<span>Delete</span>
								</button>
							</div>

							<div className="space-y-4">
								{notifications.map((item) => (
									<div key={item.id} className="border border-gray-200 rounded-lg p-4 shadow-sm">
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
												<span className={item.read ? "text-green-500" : "text-red-500"}>
													{item.read ? "✔" : "✖"}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>

							<div className="text-sm text-gray-600 mt-8">Yesterday</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}