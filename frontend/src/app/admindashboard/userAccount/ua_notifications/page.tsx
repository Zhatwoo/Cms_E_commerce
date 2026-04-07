"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";
import { getMe, updateProfile, User } from "@/lib/api";
import { addNotification } from "@/lib/notifications";

export default function NotificationsPage() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [prefs, setPrefs] = useState({
		securityAlerts: true,
		sessionNotifications: true,
		accountUpdates: true
	});

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await getMe();
				if (response.success && response.user) {
					setUser(response.user);
					if (response.user.notificationPreferences) {
						setPrefs(response.user.notificationPreferences);
					}
				}
			} catch (err) {
				console.error("Failed to fetch notification preferences:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchUser();
	}, []);

	const handleToggle = async (key: keyof typeof prefs) => {
		if (saving) return;

		const nextPrefs = { ...prefs, [key]: !prefs[key] };
		setPrefs(nextPrefs);
		setSaving(true);

		try {
			const res = await updateProfile({ notificationPreferences: nextPrefs });
			if (res.success) {
				addNotification("Settings saved", "Your notification preferences have been updated successfully.", "success");
			} else {
				throw new Error(res.message || "Failed to update preferences");
			}
		} catch (err) {
			setPrefs(prefs); // Revert
			addNotification("Adjustment Failed", err instanceof Error ? err.message : "Could not save preferences", "error");
		} finally {
			setSaving(false);
		}
	};

	const rows = [
		{ id: "securityAlerts", title: "Security Alerts", description: "Critical alerts about login attempts, password changes, and account recovery.", enabled: prefs.securityAlerts },
		{ id: "sessionNotifications", title: "Session Notifications", description: "Receive real-time alerts when a new device or browser logs into your dashboard.", enabled: prefs.sessionNotifications },
		{ id: "accountUpdates", title: "Account Updates", description: "Stay informed about administrative changes, system-wide maintenance, and announcements.", enabled: prefs.accountUpdates },
	];

	return (
		<UserAccountShell activePath="Notifications">
			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-3">
					<UserAccountSidebar />
				</div>

				<div className="col-span-12 lg:col-span-9">
					<motion.div
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45 }}
						className={`admin-dashboard-panel space-y-8 rounded-[32px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-10 shadow-[0_10px_26px_rgba(123,78,192,0.15)] ${loading ? "animate-pulse" : ""}`}
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<div className="mb-10 text-center lg:text-left">
								<h2 className="text-3xl font-bold text-[#471396] tracking-tight">Notification Preferences</h2>
								<p className="mt-2 text-sm font-medium text-[#8A86A4]">Choose which updates you want to receive and where they should be sent.</p>
							</div>

							<div className="space-y-6">
								{rows.map((row) => (
									<div key={row.id} className="group relative overflow-hidden rounded-[24px] border border-[rgba(166,61,255,0.12)] bg-white/60 px-8 py-8 shadow-sm transition-all duration-300 hover:bg-white/80 hover:shadow-md">
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
											<div className="flex-1 space-y-1">
												<h3 className="text-lg font-bold text-[#4a1a8a]">{row.title}</h3>
												<p className="text-[13px] leading-relaxed font-medium text-[#7a6aa0] opacity-80 max-w-lg">{row.description}</p>
											</div>
											
											<div className="flex items-center gap-4">
												<motion.span 
													key={row.enabled ? "on" : "off"}
													initial={{ opacity: 0, x: -5 }}
													animate={{ opacity: 1, x: 0 }}
													className={`text-[10px] font-black uppercase tracking-widest ${row.enabled ? "text-[#4a1a8a]" : "text-gray-400"}`}
												>
													{row.enabled ? "Enabled" : "Disabled"}
												</motion.span>
												
												<button
													type="button"
													disabled={loading || saving}
													aria-label={`Toggle ${row.id}`}
													onClick={() => handleToggle(row.id as keyof typeof prefs)}
													className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 ring-offset-2 focus:ring-2 focus:ring-[#4a1a8a]/20 active:scale-95 ${row.enabled ? "bg-[#4a1a8a] shadow-lg shadow-[#4a1a8a]/20" : "bg-gray-200"} ${saving ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
												>
													<motion.span 
														layout
														transition={{ type: "spring", stiffness: 500, damping: 30 }}
														className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md ${row.enabled ? "translate-x-7" : "translate-x-1"}`} 
													/>
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</motion.div>
					</motion.div>
				</div>
			</div>
		</UserAccountShell>
	);
}
