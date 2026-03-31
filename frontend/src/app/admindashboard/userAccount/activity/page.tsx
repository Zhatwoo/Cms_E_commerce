"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Shield, Clock, Trash2, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";
import { getSharedNotifications } from "@/lib/api";

type AuditNotification = {
	id: string;
	title: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
	adminId: string;
	adminName: string;
	createdAt: string;
};

export default function ActivityPage() {
	const [activities, setActivities] = useState<AuditNotification[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchActivities = async () => {
			try {
				const response = await getSharedNotifications();
				if (response.success && response.notifications) {
					// Sort by date descending
					const sorted = response.notifications.sort(
						(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					);
					setActivities(sorted);
				}
			} catch (err) {
				console.error("Failed to fetch activity logs:", err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchActivities();
	}, []);

	const getIcon = (type: string) => {
		switch (type) {
			case "success":
				return <CheckCircle className="text-emerald-500" size={18} />;
			case "warning":
				return <AlertTriangle className="text-orange-500" size={18} />;
			case "error":
				return <Trash2 className="text-red-500" size={18} />;
			default:
				return <Info className="text-blue-500" size={18} />;
		}
	};

	const getBgColor = (type: string) => {
		switch (type) {
			case "success":
				return "bg-emerald-50 border-emerald-100";
			case "warning":
				return "bg-orange-50 border-orange-100";
			case "error":
				return "bg-red-50 border-red-100";
			default:
				return "bg-blue-50 border-blue-100";
		}
	};

	return (
		<UserAccountShell activePath="Activity">
			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-3">
					<UserAccountSidebar />
				</div>

				<div className="col-span-12 lg:col-span-9">
					<motion.div
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45 }}
						className="admin-dashboard-panel space-y-8 rounded-[32px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-8 shadow-[0_10px_26px_rgba(123,78,192,0.15)]"
					>
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-2xl font-bold text-[#471396]">System Activity</h2>
								<div className="mt-1 flex items-center gap-2 text-sm font-medium text-[#8A86A4]">
									<Shield size={14} className="text-[#4a1a8a]" />
									<span>Complete audit trail of administrative events.</span>
								</div>
							</div>
							<Activity className="text-[#471396] opacity-10" size={48} />
						</div>

						<div className="space-y-4">
							{isLoading ? (
								<div className="flex flex-col items-center justify-center py-20 space-y-4">
									<div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4a1a8a] border-t-transparent" />
									<p className="text-sm font-bold text-[#4a1a8a] uppercase tracking-widest">Loading audit logs...</p>
								</div>
							) : activities.length > 0 ? (
								activities.map((item, index) => (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.05 }}
										className="admin-dashboard-inset-panel group relative overflow-hidden rounded-2xl border border-[rgba(166,61,255,0.12)] bg-white/60 px-6 py-5 shadow-sm transition-all hover:bg-white/80 hover:shadow-md"
									>
										<div className="flex items-start gap-4">
											<div className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${getBgColor(item.type)} shadow-inner`}>
												{getIcon(item.type)}
											</div>
											<div className="flex-1">
												<div className="flex items-center justify-between gap-4">
													<p className="text-lg font-bold text-[#4a1a8a]">{item.title}</p>
													<div className="flex items-center gap-1.5 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
														<Clock size={12} />
														{new Date(item.createdAt).toLocaleDateString("en-US", {
															month: "short",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														})}
													</div>
												</div>
												<p className="mt-1 text-sm font-medium text-[#7a6aa0] leading-relaxed">
													{item.message}
												</p>
												<div className="mt-3 flex items-center justify-between border-t border-[rgba(0,0,0,0.03)] pt-3">
													<p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
														PERFORMED BY: <span className="text-[#4a1a8a]">{item.adminName}</span>
													</p>
													<span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">ID: #{item.id.slice(-6)}</span>
												</div>
											</div>
										</div>
									</motion.div>
								))
							) : (
								<div className="admin-dashboard-inset-panel flex flex-col items-center justify-center py-20 rounded-2xl border-dashed border-2 border-[rgba(166,61,255,0.2)] bg-white/20">
									<Clock size={40} className="text-[#9CA3AF] mb-4 opacity-50" />
									<p className="text-sm font-bold text-[#9CA3AF] uppercase tracking-widest">No activity logs found</p>
								</div>
							)}
						</div>
					</motion.div>
				</div>
			</div>
		</UserAccountShell>
	);
}
