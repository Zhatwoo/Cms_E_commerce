"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";

export default function NotificationsPage() {
	const [securityAlertsEnabled, setSecurityAlertsEnabled] = useState(true);
	const [websiteReportsEnabled, setWebsiteReportsEnabled] = useState(true);
	const [systemAnnouncementsEnabled, setSystemAnnouncementsEnabled] = useState(true);
	const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(true);

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
						className="bg-white rounded-2xl shadow-[0_16px_40px_rgba(15,23,42,0.08)] border border-gray-200 p-8"
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
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
												securityAlertsEnabled ? "bg-slate-900" : "bg-gray-200"
											}`}
										>
											<span
												className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
													securityAlertsEnabled ? "translate-x-6" : "translate-x-1"
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
												websiteReportsEnabled ? "bg-slate-900" : "bg-gray-200"
											}`}
										>
											<span
												className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
													websiteReportsEnabled ? "translate-x-6" : "translate-x-1"
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
												systemAnnouncementsEnabled ? "bg-slate-900" : "bg-gray-200"
											}`}
										>
											<span
												className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
													systemAnnouncementsEnabled ? "translate-x-6" : "translate-x-1"
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
												weeklySummaryEnabled ? "bg-slate-900" : "bg-gray-200"
											}`}
										>
											<span
												className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
													weeklySummaryEnabled ? "translate-x-6" : "translate-x-1"
												}`}
											/>
										</button>
									</div>
								</div>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</div>
		</UserAccountShell>
	);
}
