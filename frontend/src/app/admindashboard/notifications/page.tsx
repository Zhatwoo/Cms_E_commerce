"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AdminSidebar } from "../components/sidebar";
import { AdminHeader } from "../components/header";
import { CheckIcon, RestoreIcon, TrashOutlineIcon } from "@/lib/icons/adminIcons";
import { getNotifications, saveNotifications, type NotificationItem as LibNotificationItem, addNotification } from "@/lib/notifications";

type NotificationTab = "list" | "configure" | "trash";

type NotificationItem = LibNotificationItem;

type NotificationSetting = {
	id: string;
	label: string;
	email: boolean;
	push: boolean;
};

function ModalShell({
	children,
	isOpen,
	onClose,
}: {
	children: React.ReactNode;
	isOpen: boolean;
	onClose: () => void;
}) {
	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(215,204,245,0.66)] p-4 backdrop-blur-[4px]"
				onClick={onClose}
			>
				<motion.div
					initial={{ scale: 0.97, opacity: 0, y: 12 }}
					animate={{ scale: 1, opacity: 1, y: 0 }}
					exit={{ scale: 0.97, opacity: 0, y: 8 }}
					transition={{ duration: 0.22 }}
					className="admin-dashboard-panel w-full max-w-[520px] rounded-[28px] border border-[rgba(177,59,255,0.24)] bg-[#F5F4FF] p-8 shadow-[0_16px_40px_rgba(123,78,192,0.16)]"
					onClick={(event) => event.stopPropagation()}
				>
					{children}
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}

function NotificationCheckbox({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
}) {
	return (
		<label className="inline-flex cursor-pointer items-center justify-center">
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
				className="peer sr-only"
				aria-label={label}
			/>
			<span className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-[#A148FF] bg-white text-white transition peer-checked:bg-[#A148FF] peer-checked:text-white">
				<CheckIcon />
			</span>
		</label>
	);
}

function ActionButton({
	children,
	onClick,
	disabled,
	icon,
}: {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
	icon?: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="inline-flex items-center gap-3 rounded-[18px] border border-[rgba(177,59,255,0.16)] bg-white px-6 py-3 text-[1.05rem] font-semibold text-[#857E9F] shadow-[0_5px_0_rgba(208,168,255,0.55)] transition hover:-translate-y-[1px] hover:text-[#471396] disabled:cursor-not-allowed disabled:opacity-50"
		>
			{icon}
			<span>{children}</span>
		</button>
	);
}

function NotificationsPageContent() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<NotificationTab>("list");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [trashSelectedIds, setTrashSelectedIds] = useState<string[]>([]);
	const [showRestoreModal, setShowRestoreModal] = useState(false);
	const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [trash, setTrash] = useState<NotificationItem[]>([]);

	useEffect(() => {
		const load = () => {
			setNotifications(getNotifications());
		};
		load();
		window.addEventListener('notificationsUpdate', load);
		return () => window.removeEventListener('notificationsUpdate', load);
	}, []);

	const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
		{ id: "evt-site-publish", label: "Takedown Website", email: true, push: true },
		{ id: "evt-template-update", label: "Delete Website", email: true, push: true },
		{ id: "evt-custom-domain", label: "Delete Product", email: true, push: true },
		{ id: "evt-user-modified", label: "Modified User", email: true, push: true },
	]);

	const unreadCount = notifications.filter((item) => !item.read).length;
	const allSelected = notifications.length > 0 && selectedIds.length === notifications.length;
	const trashAllSelected = trash.length > 0 && trashSelectedIds.length === trash.length;

	const setUniqueSelection = (ids: string[]) => Array.from(new Set(ids));

	const toggleSelectAll = (checked: boolean) => {
		setSelectedIds(checked ? notifications.map((item) => item.id) : []);
	};

	const toggleSelectOne = (id: string, checked: boolean) => {
		setSelectedIds((prev) =>
			checked ? setUniqueSelection([...prev, id]) : prev.filter((item) => item !== id)
		);
	};

	const toggleTrashSelectAll = (checked: boolean) => {
		setTrashSelectedIds(checked ? trash.map((item) => item.id) : []);
	};

	const toggleTrashSelectOne = (id: string, checked: boolean) => {
		setTrashSelectedIds((prev) =>
			checked ? setUniqueSelection([...prev, id]) : prev.filter((item) => item !== id)
		);
	};

	const handleMarkAsRead = () => {
		if (selectedIds.length === 0) return;
		const updated = notifications.map((item) => (selectedIds.includes(item.id) ? { ...item, read: true } : item));
		saveNotifications(updated);
		setSelectedIds([]);
	};

	const handleDelete = () => {
		if (selectedIds.length === 0) return;
		const toTrash = notifications.filter((item) => selectedIds.includes(item.id));
		setTrash((current) => [...toTrash.filter((item) => !current.some((entry) => entry.id === item.id)), ...current]);
		const updated = notifications.filter((item) => !selectedIds.includes(item.id));
		saveNotifications(updated);
		setSelectedIds([]);
	};

	const handleRestore = (id: string) => {
		const restored = trash.find((item) => item.id === id);
		if (!restored) return;
		setTrash((prev) => prev.filter((item) => item.id !== id));
		setNotifications((current) => (current.some((item) => item.id === restored.id) ? current : [restored, ...current]));
	};

	const handlePermanentDelete = (id: string) => {
		setTrash((prev) => prev.filter((item) => item.id !== id));
	};

	const handleBulkRestore = () => {
		trashSelectedIds.forEach((id) => handleRestore(id));
		setTrashSelectedIds([]);
		setShowRestoreModal(false);
	};

	const handleBulkPermanentDelete = () => {
		trashSelectedIds.forEach((id) => handlePermanentDelete(id));
		setTrashSelectedIds([]);
		setShowPermanentDeleteModal(false);
	};

	const handleSettingToggle = (id: string, channel: "email" | "push") => {
		setNotificationSettings((prev) => prev.map((item) => (item.id === id ? { ...item, [channel]: !item[channel] } : item)));
	};

	return (
		<div className="admin-dashboard-shell relative flex min-h-screen overflow-hidden" suppressHydrationWarning>
			<div className="relative z-10 flex min-h-screen w-full">
				<AdminSidebar forcedActiveItemId="notifications" />

				<AnimatePresence>
					{sidebarOpen && (
						<div className="lg:hidden">
							<AdminSidebar mobile onClose={() => setSidebarOpen(false)} forcedActiveItemId="notifications" />
						</div>
					)}
				</AnimatePresence>

				<div className="flex min-h-screen flex-1 flex-col">
					<AdminHeader onMenuClick={() => setSidebarOpen(true)} />

					<main className="flex-1 overflow-y-auto">
						<div className="p-8">
							<motion.div
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.45 }}
								className="space-y-6"
							>
								<div>
									<h1 className="text-3xl font-bold text-[#B13BFF] sm:text-4xl">Notifications</h1>
									<p className="mt-2 text-base text-[#A78BFA]">Inbox and delivery preferences</p>
								</div>

								<div className="inline-flex rounded-[12px] border border-[rgba(177,59,255,0.26)] bg-[#F7F2FF] p-0.5 shadow-[0_6px_14px_rgba(178,110,255,0.08)]">
									{([
										{ key: "list", label: "List", extra: unreadCount },
										{ key: "configure", label: "Configure" },
										{ key: "trash", label: "Trash" },
									] as Array<{ key: NotificationTab; label: string; extra?: number }>).map((tab) => (
										<button
											key={tab.key}
											type="button"
											onClick={() => setActiveTab(tab.key)}
											className={`min-w-[130px] rounded-[10px] px-6 py-3 text-[1rem] font-semibold transition ${
												activeTab === tab.key
													? "bg-[#FFCC00] text-[#2F1859]"
													: "text-[#787593] hover:bg-white/60"
											}`}
										>
											<span className="inline-flex items-center gap-2">
												<span>{tab.label}</span>
												{typeof tab.extra === "number" && (
													<span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-sm text-[#514A73]">
														{tab.extra}
													</span>
												)}
											</span>
										</button>
									))}
								</div>

								<div className="admin-dashboard-panel min-h-[470px] rounded-[32px] border border-[rgba(177,59,255,0.2)] bg-[#F8F5FF] p-8 shadow-[0_12px_30px_rgba(123,78,192,0.12)]">
									<AnimatePresence mode="wait">
										{activeTab === "list" && (
											<motion.div
												key="list"
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -10 }}
												transition={{ duration: 0.25 }}
											>
												<div className="mb-8 text-sm font-medium text-[#8D87A8]">Today</div>

												<div className="mb-7 flex flex-wrap items-center gap-5">
													<div className="inline-flex items-center gap-4 text-[1.05rem] font-semibold text-[#3E2E7D]">
														<NotificationCheckbox checked={allSelected} onChange={toggleSelectAll} label="Select all notifications" />
														<span>Select All</span>
													</div>
													<ActionButton onClick={handleMarkAsRead} disabled={selectedIds.length === 0} icon={<CheckIcon />}>
														Mark as Read
													</ActionButton>
													<ActionButton onClick={handleDelete} disabled={selectedIds.length === 0} icon={<TrashOutlineIcon />}>
														Delete
													</ActionButton>
												</div>

												{notifications.length === 0 ? (
													<div className="rounded-[24px] border border-[rgba(177,59,255,0.18)] bg-white px-8 py-12 text-center text-lg font-medium text-[#8D87A8]">
														No new notifications
													</div>
												) : (
													<div className="space-y-4">
														{notifications.map((item) => (
															<motion.div
																key={item.id}
																initial={{ opacity: 0, y: 8 }}
																animate={{ opacity: 1, y: 0 }}
																className="flex items-center justify-between gap-4 border-b border-[rgba(177,59,255,0.2)] bg-white px-4 py-5 shadow-[0_3px_0_rgba(210,175,255,0.7)]"
															>
																<div className="flex min-w-0 items-center gap-4">
																	<div className="h-18 w-1 self-stretch rounded-full bg-[#FFCC00]" />
																	<NotificationCheckbox
																		checked={selectedIds.includes(item.id)}
																		onChange={(checked) => toggleSelectOne(item.id, checked)}
																		label={`Select notification at ${item.time}`}
																	/>
																	<div className="min-w-0">
																		<div className="truncate text-[1.08rem] font-semibold text-[#412793]">
																			{item.title}
																			{item.message && <span className="ml-2 font-normal text-[#8B85A5]">- {item.message}</span>}
																		</div>
																		<div className="mt-1 text-sm text-[#8B85A5]">{item.time}</div>
																	</div>
																</div>
																<div className="flex items-center gap-5 pl-4 text-sm text-[#8B85A5]">
																	<span>{item.date}</span>
																	<span className={item.read ? "text-[#1AA54B]" : "text-[#FF5252]"}>{item.read ? <CheckIcon /> : "×"}</span>
																</div>
															</motion.div>
														))}
													</div>
												)}
											</motion.div>
										)}

										{activeTab === "configure" && (
											<motion.div
												key="configure"
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -10 }}
												transition={{ duration: 0.25 }}
											>
												<div className="grid grid-cols-[90px_90px_minmax(0,1fr)] gap-y-8 px-4 py-8 text-[1.1rem] font-semibold text-[#352B75] sm:px-8">
													<div>Email</div>
													<div>Push</div>
													<div>Event</div>
													{notificationSettings.map((item) => (
														<React.Fragment key={item.id}>
															<div className="flex items-center">
																<NotificationCheckbox
																	checked={item.email}
																	onChange={() => handleSettingToggle(item.id, "email")}
																	label={`Email notification for ${item.label}`}
																/>
															</div>
															<div className="flex items-center">
																<NotificationCheckbox
																	checked={item.push}
																	onChange={() => handleSettingToggle(item.id, "push")}
																	label={`Push notification for ${item.label}`}
																/>
															</div>
															<div className="text-[1.08rem] font-semibold text-[#412793]">{item.label}</div>
														</React.Fragment>
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
												transition={{ duration: 0.25 }}
											>
												<div className="mb-8 text-sm font-medium text-[#8D87A8]">Today</div>

												{trash.length === 0 ? (
													<div className="rounded-[24px] border border-[rgba(177,59,255,0.18)] bg-white px-8 py-12 text-center text-lg font-medium text-[#8D87A8]">
														Trash is empty
													</div>
												) : (
													<>
														<div className="mb-7 flex flex-wrap items-center gap-5">
															<div className="inline-flex items-center gap-4 text-[1.05rem] font-semibold text-[#3E2E7D]">
																<NotificationCheckbox checked={trashAllSelected} onChange={toggleTrashSelectAll} label="Select all trash notifications" />
																<span>Select All</span>
															</div>
															<ActionButton onClick={() => setShowRestoreModal(true)} disabled={trashSelectedIds.length === 0} icon={<RestoreIcon />}>
																Restore
															</ActionButton>
															<ActionButton onClick={() => setShowPermanentDeleteModal(true)} disabled={trashSelectedIds.length === 0} icon={<TrashOutlineIcon />}>
																Delete Permanently
															</ActionButton>
														</div>

														<div className="space-y-4">
															{trash.map((item) => (
																<motion.div
																	key={item.id}
																	initial={{ opacity: 0, y: 8 }}
																	animate={{ opacity: 1, y: 0 }}
																	className="flex items-center justify-between gap-4 border-b border-[rgba(177,59,255,0.2)] bg-white px-4 py-5 shadow-[0_3px_0_rgba(210,175,255,0.7)]"
																>
																	<div className="flex min-w-0 items-center gap-4">
																		<div className="h-18 w-1 self-stretch rounded-full bg-[#FFCC00]" />
																		<NotificationCheckbox
																			checked={trashSelectedIds.includes(item.id)}
																			onChange={(checked) => toggleTrashSelectOne(item.id, checked)}
																			label={`Select trashed notification at ${item.time}`}
																		/>
																		<div className="min-w-0">
																			<div className="truncate text-[1.08rem] font-semibold text-[#412793]">{item.title}</div>
																			<div className="mt-1 text-sm text-[#8B85A5]">{item.time}</div>
																		</div>
																	</div>
																	<div className="pl-4 text-sm text-[#8B85A5]">{item.date}</div>
																</motion.div>
															))}
														</div>
													</>
												)}
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</motion.div>
						</div>
					</main>
				</div>
			</div>

			<ModalShell isOpen={showRestoreModal} onClose={() => setShowRestoreModal(false)}>
				<h3 className="text-2xl font-semibold text-[#471396]">Restore notifications</h3>
				<p className="mt-3 text-base leading-7 text-[#7A7497]">
					Restore {trashSelectedIds.length} selected {trashSelectedIds.length === 1 ? "notification" : "notifications"} to the list?
				</p>
				<div className="mt-8 flex justify-end gap-4">
					<button
						type="button"
						onClick={() => setShowRestoreModal(false)}
						className="rounded-2xl px-6 py-3 text-base font-semibold text-[#8B85A5]"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleBulkRestore}
						className="rounded-2xl bg-[#FFCC00] px-7 py-3 text-base font-semibold text-[#2F1859] transition-opacity hover:opacity-90"
					>
						Restore
					</button>
				</div>
			</ModalShell>

			<ModalShell isOpen={showPermanentDeleteModal} onClose={() => setShowPermanentDeleteModal(false)}>
				<h3 className="text-2xl font-semibold text-[#471396]">Delete permanently</h3>
				<p className="mt-3 text-base leading-7 text-[#7A7497]">
					Delete {trashSelectedIds.length} selected {trashSelectedIds.length === 1 ? "notification" : "notifications"} permanently? This cannot be undone.
				</p>
				<div className="mt-8 flex justify-end gap-4">
					<button
						type="button"
						onClick={() => setShowPermanentDeleteModal(false)}
						className="rounded-2xl px-6 py-3 text-base font-semibold text-[#8B85A5]"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleBulkPermanentDelete}
						className="rounded-2xl bg-[#FF5252] px-7 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
					>
						Delete Permanently
					</button>
				</div>
			</ModalShell>
		</div>
	);
}

export default function NotificationsPage() {
	return <NotificationsPageContent />;
}
