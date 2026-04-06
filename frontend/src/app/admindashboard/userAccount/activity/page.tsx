"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Shield, Clock, Trash2, CheckCircle, Info, AlertTriangle, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
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

// Custom styles for the activity log container
const ScrollbarStyles = () => (
  <style jsx global>{`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(177, 59, 255, 0.05);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(177, 59, 255, 0.15);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(177, 59, 255, 0.25);
    }
  `}</style>
);

export default function ActivityPage() {
	const [activities, setActivities] = useState<AuditNotification[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	
	// Pagination and Filter States
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<"all" | "info" | "success" | "warning" | "error">("all");
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 8;

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

	// Derived Data
	const filteredActivities = activities.filter(item => {
		const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
							 item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
							 item.adminName.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesType = filterType === "all" || item.type === filterType;
		return matchesSearch && matchesType;
	});

	const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
	const paginatedActivities = filteredActivities.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE
	);

	// Reset page when filtering
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, filterType]);

	const getIcon = (type: string) => {
		switch (type) {
			case "success":
				return <CheckCircle className="text-emerald-600" size={20} strokeWidth={2.5} />;
			case "warning":
				return <AlertTriangle className="text-amber-600" size={20} strokeWidth={2.5} />;
			case "error":
				return <X className="text-rose-600" size={20} strokeWidth={2.5} />; // Changed from Trash2 to X for Error
			default:
				return <Info className="text-sky-600" size={20} strokeWidth={2.5} />;
		}
	};

	const getLogStyles = (type: string) => {
		switch (type) {
			case "success":
				return {
					bg: "bg-emerald-50/80 border-emerald-200/50",
					iconBg: "bg-emerald-100/80 shadow-[inset_0_2px_4px_rgba(16,185,129,0.1)]",
					text: "text-emerald-900"
				};
			case "warning":
				return {
					bg: "bg-amber-50/80 border-amber-200/50 shadow-[0_4px_12px_rgba(245,158,11,0.05)]",
					iconBg: "bg-amber-100/80 shadow-[inset_0_2px_4px_rgba(245,158,11,0.15)]",
					text: "text-amber-900"
				};
			case "error":
				return {
					bg: "bg-rose-50/80 border-rose-200/60 shadow-[0_4px_15px_rgba(244,63,94,0.08)]",
					iconBg: "bg-rose-100/80 shadow-[inset_0_2px_4px_rgba(244,63,94,0.15)]",
					text: "text-rose-900"
				};
			default:
				return {
					bg: "bg-sky-50/80 border-sky-200/50",
					iconBg: "bg-sky-100/80 shadow-[inset_0_2px_4px_rgba(14,165,233,0.1)]",
					text: "text-sky-900"
				};
		}
	};

	// Group activities by date
	const groupedActivities = useMemo(() => {
		const groups: { [key: string]: AuditNotification[] } = {};
		const today = new Date().toLocaleDateString();
		const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

		paginatedActivities.forEach(activity => {
			const date = new Date(activity.createdAt).toLocaleDateString();
			let label = date;
			if (date === today) label = "Today";
			else if (date === yesterday) label = "Yesterday";
			
			if (!groups[label]) groups[label] = [];
			groups[label].push(activity);
		});
		return groups;
	}, [paginatedActivities]);

	return (
		<UserAccountShell activePath="Activity">
			<ScrollbarStyles />
			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-3">
					<UserAccountSidebar />
				</div>

				<div className="col-span-12 lg:col-span-9">
					<motion.div
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45 }}
						className="admin-dashboard-panel space-y-8 rounded-[30px] border border-[rgba(177,59,255,0.15)] bg-white/95 p-10 shadow-[0_15px_40px_rgba(74,26,138,0.04)]"
					>
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-2xl font-bold text-[#471396] tracking-tight">System Activity</h2>
								<div className="mt-1.5 flex items-center gap-2 text-sm font-medium text-[#7a6aa0]">
									<Shield size={14} className="text-[#4a1a8a]/60" />
									<span>A comprehensive audit trail of system events and administrative actions.</span>
								</div>
							</div>
							<div className="h-14 w-14 rounded-2xl bg-[#F5F4FF] flex items-center justify-center border border-[#F0E6FF] shadow-sm">
								<Activity className="text-[#4a1a8a]" size={32} strokeWidth={1.5} />
							</div>
						</div>

						{/* Search and Filter Header */}
						<div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white/40 p-2 rounded-[28px] border border-white/60">
							<div className="relative w-full xl:max-w-md">
								<input
									type="text"
									placeholder="Search logs, events, or admins..."
									className="h-12 w-full rounded-2xl border-none bg-white/80 pl-11 pr-4 text-sm font-semibold text-[#471396] shadow-sm transition-all outline-none placeholder:text-[#8A86A4]/50 focus:bg-white focus:ring-4 focus:ring-[#4a1a8a]/5"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a1a8a]/40 group-focus-within:text-[#4a1a8a]">
									<Search size={18} strokeWidth={2.5} />
								</div>
							</div>
							
							<div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100/50">
								{(['all', 'info', 'success', 'warning', 'error'] as const).map((t) => (
									<button
										key={t}
										onClick={() => setFilterType(t)}
										className={`relative px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 ${
											filterType === t 
											? 'text-white' 
											: 'text-[#8A86A4] hover:text-[#4a1a8a] hover:bg-white'
										}`}
									>
										{filterType === t && (
											<motion.div
												layoutId="activeFilterTab"
												className="absolute inset-0 z-[-1] rounded-lg bg-[#4a1a8a] shadow-md shadow-[#4a1a8a]/20"
												transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
											/>
										)}
										{t}
									</button>
								))}
							</div>
						</div>

						{/* Activity Records Area */}
						<div className="relative">
							<div className="space-y-8 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar px-1 font-sans">
								{isLoading ? (
									<div className="flex flex-col items-center justify-center py-20 space-y-4">
										<div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4a1a8a]/20 border-t-[#4a1a8a]" />
										<p className="text-xs font-bold text-[#4a1a8a]/60 uppercase tracking-widest">Gathering log history...</p>
									</div>
								) : Object.keys(groupedActivities).length > 0 ? (
									Object.entries(groupedActivities).map(([groupLabel, items]: [string, AuditNotification[]]) => (
										<div key={groupLabel} className="space-y-4">
											<div className="flex items-center gap-4">
												<h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9CA3AF] whitespace-nowrap">{groupLabel}</h3>
												<div className="h-px w-full bg-[#F3F4F6]" />
											</div>
											<div className="space-y-4 font-sans">
												{items.map((item: AuditNotification, index: number) => {
													const styles = getLogStyles(item.type);
													return (
														<motion.div
															key={item.id}
															initial={{ opacity: 0, y: 10 }}
															animate={{ opacity: 1, y: 0 }}
															transition={{ delay: index * 0.05 }}
															className={`group relative overflow-hidden rounded-[24px] border ${styles.bg} px-6 py-6 transition-all duration-300 hover:shadow-xl hover:shadow-[#4a1a8a]/5 hover:-translate-y-1 cursor-default`}
														>
															<div className="flex items-start gap-5">
																<div className={`mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[18px] transition-transform duration-300 group-hover:scale-110 ${styles.iconBg}`}>
																	{getIcon(item.type)}
																</div>
																<div className="flex-1 space-y-1.5">
																	<div className="flex items-center justify-between gap-4">
																		<p className={`text-[15px] font-bold tracking-tight ${styles.text}`}>
																			{item.title}
																			{(item.type === 'error' || item.type === 'warning') && (
																				<span className="ml-2 inline-flex h-2 w-2 rounded-full bg-current animate-pulse opacity-50 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
																			)}
																		</p>
																		<div className="flex items-center gap-1.5 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-white/60 px-2.5 py-1 rounded-full shadow-sm border border-white/40">
																			<Clock size={11} strokeWidth={2.5} />
																			{new Date(item.createdAt).toLocaleTimeString("en-US", {
																				hour: "2-digit",
																				minute: "2-digit",
																			})}
																		</div>
																	</div>
																	<p className="text-[13.5px] font-medium text-[#7a6aa0] leading-[1.6]">
																		{item.message}
																	</p>
																	<div className="pt-3.5 flex items-center justify-between">
																		<div className="flex items-center gap-2">
																			<div className="h-5 w-5 rounded-full bg-[#f0e6ff] flex items-center justify-center">
																				<div className="h-2 w-2 rounded-full bg-[#4a1a8a]" />
																			</div>
																			<p className="text-[10px] font-bold text-[#8A86A4] uppercase tracking-wider">
																				Performed By: <span className="text-[#4a1a8a]">{item.adminName}</span>
																			</p>
																		</div>
																		<span className="text-[10px] font-black text-[#D1D5DB] uppercase tracking-[0.15em] font-mono">#{item.id.slice(-6).toUpperCase()}</span>
																	</div>
																</div>
															</div>
														</motion.div>
													);
												})}
											</div>
										</div>
									))
								) : (
									<div className="flex flex-col items-center justify-center py-20 rounded-[32px] border-2 border-dashed border-[#F3F4F6] bg-[#F9FAFB]/50">
										<div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-5 border border-[#F3F4F6]">
											<Clock size={24} className="text-[#D1D5DB]" />
										</div>
										<p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em]">No matching logs found</p>
									</div>
								)}
							</div>
						</div>

						{/* Pagination Footer */}
						{!isLoading && filteredActivities.length > ITEMS_PER_PAGE && (
							<div className="flex items-center justify-between border-t border-[rgba(177,59,255,0.1)] pt-8">
								<p className="text-[10px] font-black text-[#8A86A4] uppercase tracking-widest opacity-80">
									Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredActivities.length)} of {filteredActivities.length} logs
								</p>
								
								<div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/40 border border-white/60">
									<button
										onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
										disabled={currentPage === 1}
										className="p-2.5 rounded-xl text-[#4a1a8a] disabled:opacity-30 hover:bg-white hover:shadow-md transition-all active:scale-90"
									>
										<ChevronLeft size={16} strokeWidth={2.5} />
									</button>
									
									{[...Array(totalPages)].map((_, i) => {
										const pageNum = i + 1;
										if (totalPages > 5 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
											if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-1 text-[#8A86A4]">...</span>;
											return null;
										}
										
										return (
											<button
												key={pageNum}
												onClick={() => setCurrentPage(pageNum)}
												className={`h-9 w-9 rounded-xl text-[11px] font-black transition-all active:scale-90 ${
													currentPage === pageNum
													? 'bg-[#4a1a8a] text-white shadow-lg shadow-[#4a1a8a]/20'
													: 'text-[#471396] hover:bg-white hover:shadow-md'
												}`}
											>
												{pageNum}
											</button>
										);
									})}
									
									<button
										onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
										disabled={currentPage === totalPages}
										className="p-2.5 rounded-xl text-[#4a1a8a] disabled:opacity-30 hover:bg-white hover:shadow-md transition-all active:scale-90"
									>
										<ChevronRight size={16} strokeWidth={2.5} />
									</button>
								</div>
							</div>
						)}
					</motion.div>
				</div>
			</div>
		</UserAccountShell>
	);
}
