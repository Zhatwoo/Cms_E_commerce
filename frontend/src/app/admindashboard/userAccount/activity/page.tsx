"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Shield, Clock, Trash2, CheckCircle, Info, AlertTriangle, ChevronLeft, ChevronRight, Search } from "lucide-react";
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

						{/* Search and Filter Header */}
						<div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-[rgba(177,59,255,0.1)] pb-8">
							<div className="relative w-full sm:max-w-md">
								<input
									type="text"
									placeholder="Search logs, events, or admins..."
									className="admin-dashboard-input h-12 w-full rounded-[28px] border-2 border-[rgba(177,59,255,0.12)] bg-white/70 pl-12 pr-4 text-sm font-bold text-[#471396] shadow-md transition-all outline-none placeholder:text-[#8A86A4]/40 focus:border-[#471396]/30 focus:bg-white focus:ring-4 focus:ring-[#471396]/5"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f5c000]">
									<Search size={22} strokeWidth={3} />
								</div>
							</div>
							
							<div className="relative flex items-center p-1.5 rounded-2xl bg-[rgba(177,59,255,0.04)] border border-[rgba(177,59,255,0.06)] shadow-inner">
								{(['all', 'info', 'success', 'warning', 'error'] as const).map((t) => (
									<button
										key={t}
										onClick={() => setFilterType(t)}
										className={`relative z-10 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
											filterType === t 
											? 'text-white' 
											: 'text-[#471396] hover:text-[#471396]/70'
										}`}
									>
										{filterType === t && (
											<motion.div
												layoutId="activeTab"
												className="absolute inset-0 z-[-1] rounded-xl bg-[#471396] shadow-lg"
												transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
											/>
										)}
										{t}
									</button>
								))}
							</div>
						</div>

						{/* Scrollable Data Area */}
						<div className="relative">
							<div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
								{isLoading ? (
									<div className="flex flex-col items-center justify-center py-20 space-y-4">
										<div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4a1a8a] border-t-transparent" />
										<p className="text-sm font-bold text-[#4a1a8a] uppercase tracking-widest">Loading audit logs...</p>
									</div>
								) : paginatedActivities.length > 0 ? (
									paginatedActivities.map((item, index) => (
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
										<p className="text-sm font-bold text-[#9CA3AF] uppercase tracking-widest">No matching activity logs</p>
									</div>
								)}
							</div>
						</div>

						{/* Pagination Footer */}
						{!isLoading && filteredActivities.length > ITEMS_PER_PAGE && (
							<div className="flex items-center justify-between border-t border-[rgba(177,59,255,0.1)] pt-6">
								<p className="text-xs font-bold text-[#8A86A4] uppercase tracking-wider">
									Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredActivities.length)} of {filteredActivities.length} logs
								</p>
								
								<div className="flex items-center gap-1">
									<button
										onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
										disabled={currentPage === 1}
										className="p-2 rounded-lg text-[#4a1a8a] disabled:opacity-30 hover:bg-white/50 transition-all shadow-sm"
									>
										<ChevronLeft size={16} />
									</button>
									
									{[...Array(totalPages)].map((_, i) => {
										const pageNum = i + 1;
										// Simple ellipsis logic
										if (totalPages > 5 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
											if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-1 text-[#8A86A4]">...</span>;
											return null;
										}
										
										return (
											<button
												key={pageNum}
												onClick={() => setCurrentPage(pageNum)}
												className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
													currentPage === pageNum
													? 'bg-[#f5c000] text-[#471396] shadow-sm'
													: 'text-[#471396] hover:bg-white/50 shadow-sm border border-white/40'
												}`}
											>
												{pageNum}
											</button>
										);
									})}
									
									<button
										onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
										disabled={currentPage === totalPages}
										className="p-2 rounded-lg text-[#4a1a8a] disabled:opacity-30 hover:bg-white/50 transition-all shadow-sm"
									>
										<ChevronRight size={16} />
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
