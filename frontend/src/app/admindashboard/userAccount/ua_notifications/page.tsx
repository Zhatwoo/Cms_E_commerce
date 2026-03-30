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
				addNotification("Preferences Updated", "Your notification settings have been saved.", "success");
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
		{ id: "securityAlerts", title: "Security Alerts", description: "Critical alerts about login attempts and password changes.", enabled: prefs.securityAlerts },
		{ id: "sessionNotifications", title: "Session Notifications", description: "Receive alerts when a new device or browser logs into your account.", enabled: prefs.sessionNotifications },
		{ id: "accountUpdates", title: "Account Updates", description: "Get notified about administrative changes and system-wide announcements.", enabled: prefs.accountUpdates },
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
						className={`admin-dashboard-panel rounded-[32px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-8 shadow-[0_10px_26px_rgba(123,78,192,0.15)] ${loading ? "animate-pulse" : ""}`}
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<div className="mb-6">
								<h2 className="text-2xl font-semibold text-[#471396]">Notification Preferences</h2>
								<p className="text-sm text-[#8A86A4]">Control how you receive alerts and updates.</p>
							</div>

							<div className="space-y-4">
								{rows.map((row) => (
									<div key={row.id} className="admin-dashboard-inset-panel flex items-center justify-between rounded-2xl border border-[rgba(166,61,255,0.12)] bg-white/50 px-8 py-6 shadow-sm transition-all hover:bg-white/70">
										<div>
											<div className="text-lg font-bold text-[#4a1a8a]">{row.title}</div>
											<p className="text-sm font-medium text-[#7a6aa0]">{row.description}</p>
										</div>
										<button
											type="button"
											disabled={loading || saving}
											aria-label={`Toggle ${row.id}`}
											title={`Toggle ${row.id}`}
											onClick={() => handleToggle(row.id as keyof typeof prefs)}
											className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${row.enabled ? "bg-[#4a1a8a]" : "bg-gray-200"} ${saving ? "opacity-50 cursor-wait" : ""}`}
										>
											<span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${row.enabled ? "translate-x-6" : "translate-x-1"}`} />
										</button>
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
