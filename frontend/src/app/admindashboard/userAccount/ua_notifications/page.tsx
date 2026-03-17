"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";

export default function NotificationsPage() {
	const [securityAlertsEnabled, setSecurityAlertsEnabled] = useState(true);
	const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
	const [accountUpdatesEnabled, setAccountUpdatesEnabled] = useState(true);

	const rows = [
		{ id: "security", title: "Security Alerts", description: "Login attempts and password changes", enabled: securityAlertsEnabled, onToggle: () => setSecurityAlertsEnabled((prev) => !prev) },
		{ id: "login", title: "Security Alerts", description: "Login attempts and password changes", enabled: loginAlertsEnabled, onToggle: () => setLoginAlertsEnabled((prev) => !prev) },
		{ id: "account", title: "Security Alerts", description: "Login attempts and password changes", enabled: accountUpdatesEnabled, onToggle: () => setAccountUpdatesEnabled((prev) => !prev) },
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
						className="admin-dashboard-panel rounded-[32px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-8 shadow-[0_10px_26px_rgba(123,78,192,0.15)]"
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<div className="mb-6">
								<h2 className="text-2xl font-semibold text-[#471396]">Notification Preferences</h2>
								<p className="text-sm text-[#8A86A4]">Grouped alerts to keep the inbox focused</p>
							</div>

							<div className="space-y-4">
								{rows.map((row) => (
									<div key={row.id} className="admin-dashboard-inset-panel flex items-center justify-between rounded-none border border-[rgba(177,59,255,0.16)] bg-white/42 px-6 py-6">
										<div>
											<div className="text-lg font-semibold text-[#471396]">{row.title}</div>
											<p className="text-sm text-[#8A86A4]">{row.description}</p>
										</div>
										<button
											type="button"
											aria-label={`Toggle ${row.id} notifications`}
											title={`Toggle ${row.id} notifications`}
											onClick={row.onToggle}
											className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${row.enabled ? "bg-[#FFCC00]" : "bg-gray-200"}`}
										>
											<span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${row.enabled ? "translate-x-6" : "translate-x-1"}`} />
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
