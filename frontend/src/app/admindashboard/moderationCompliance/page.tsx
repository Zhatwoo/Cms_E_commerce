'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';

const ChevronRightIcon = () => (
	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
	</svg>
);

function ModerationComplianceBoard() {
	const [tab, setTab] = useState("webreviews");
	const [searchQuery, setSearchQuery] = useState('');

	const tabLabel = tab === "webreviews" ? "Web Reviews" : tab === "reports" ? "Reports" : "Records";
	const filteredLabel = searchQuery.trim() ? `Results for "${searchQuery.trim()}"` : tabLabel;

	const stats = useMemo(() => {
		if (tab === 'webreviews') {
			return [
				{ label: 'Pending', value: '24', tone: 'amber' },
				{ label: 'Flagged', value: '11', tone: 'rose' },
				{ label: 'Reviewed', value: '312', tone: 'emerald' },
			];
		}
		if (tab === 'reports') {
			return [
				{ label: 'New Reports', value: '8', tone: 'amber' },
				{ label: 'High Priority', value: '3', tone: 'rose' },
				{ label: 'Resolved', value: '67', tone: 'emerald' },
			];
		}
		return [
			{ label: 'Removals', value: '19', tone: 'rose' },
			{ label: 'Restored', value: '5', tone: 'emerald' },
			{ label: 'Audited', value: '142', tone: 'blue' },
		];
	}, [tab]);

	return (
		<motion.div 
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="space-y-6"
		>
			<motion.div 
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
				className="mb-2"
			>
				<div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-1">Moderation & Compliance</h1>
						<div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
							<span>Moderation & Compliance</span>
							<ChevronRightIcon />
							<span className="text-slate-700">{tabLabel}</span>
						</div>
					</div>
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className="flex items-center gap-3"
					>
						<div className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold">Auto-review on</div>
						<div className="px-3 py-1 rounded-full border border-slate-200 text-xs text-slate-500">Last sync 2 min ago</div>
					</motion.div>
				</div>
			</motion.div>

			<motion.div 
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className="space-y-4"
			>
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.32 }}
					className="grid grid-cols-1 sm:grid-cols-3 gap-3"
				>
					{stats.map((item) => (
						<motion.div
							key={item.label}
							className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]`}
							whileHover={{ y: -3, scale: 1.01 }}
							transition={{ type: 'spring', stiffness: 260, damping: 22 }}
						>
							<div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
							<div className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</div>
							<div
								className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
									item.tone === 'amber'
										? 'bg-amber-100 text-amber-700'
										: item.tone === 'rose'
										? 'bg-rose-100 text-rose-700'
										: item.tone === 'emerald'
										? 'bg-emerald-100 text-emerald-700'
										: 'bg-blue-100 text-blue-700'
								}`}
							>
								Live
							</div>
						</motion.div>
					))}
				</motion.div>

				<div className="relative">
					<svg className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" viewBox="0 0 24 24" fill="none">
						<path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						<circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
					</svg>
					<input
						aria-label="Search websites"
						placeholder="Search websites..."
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-10 pr-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>

				<motion.div 
					initial={{ opacity: 0, scale: 0.98 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.4 }}
					className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
				>
					<div className="border-b border-gray-200 bg-slate-50/70">
						<div className="flex flex-wrap gap-6 px-6 pt-6">
							<button
								onClick={() => setTab("webreviews")}
								className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${
									tab === "webreviews"
										? "border-blue-600 text-blue-600"
										: "border-transparent text-gray-600 hover:text-gray-900"
								}`}
							>
								Web Reviews
							</button>
							<button
								onClick={() => setTab("reports")}
								className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${
									tab === "reports"
										? "border-blue-600 text-blue-600"
										: "border-transparent text-gray-600 hover:text-gray-900"
								}`}
							>
								Reports
							</button>
							<button
								onClick={() => setTab("records")}
								className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${
									tab === "records"
										? "border-blue-600 text-blue-600"
										: "border-transparent text-gray-600 hover:text-gray-900"
								}`}
							>
								Records
							</button>
						</div>
					</div>

					<div className="p-6 min-h-[360px] bg-white">
						<AnimatePresence mode="wait">
						{tab === "webreviews" && (
							<motion.div
								key="webreviews"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 20 }}
								transition={{ duration: 0.3 }}
							>
								<h3 className="text-lg font-semibold mb-2 text-gray-900">Pending / Flagged Websites</h3>
								<div className="text-sm text-slate-500 mb-6">{filteredLabel}</div>

								<motion.div 
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
									className="border border-gray-200 rounded-2xl p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											<div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
												<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
													<path d="M5 3h2v18H5V3zm2 0h10l-2 4 2 4H7V3z" />
												</svg>
											</div>
											<div>
												<div className="font-semibold text-gray-900 mb-1">example-site.com</div>
												<div className="text-sm text-gray-400">Pending</div>
											</div>
										</div>

										<div className="flex items-center gap-3">
										<motion.button 
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className="bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow"
										>
											Approve
										</motion.button>
										<motion.button 
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow"
										>
											View
										</motion.button>
										<motion.button 
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow"
										>
											Remove
										</motion.button>
										</div>
									</div>
								</motion.div>
							</motion.div>
						)}

						{tab === "reports" && (
							<motion.div
								key="reports"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 20 }}
								transition={{ duration: 0.3 }}
							>
								<h3 className="text-lg font-semibold mb-2 text-gray-900">Reports</h3>
								<div className="text-sm text-slate-500 mb-6">{filteredLabel}</div>

								<motion.div 
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
									className="border border-gray-200 rounded-2xl p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
								>
									<div className="flex items-center justify-between">
										<div className="space-y-1">
											<div className="font-semibold text-gray-900">example-site.com</div>
											<div className="text-sm text-gray-400">Copyright Violation</div>
											<div className="text-xs font-semibold text-red-600 uppercase tracking-[0.2em]">High</div>
										</div>

										<div className="flex items-center gap-3">
										<motion.button 
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow"
										>
											View
										</motion.button>
										<motion.button 
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow"
										>
											Dismiss
										</motion.button>
										</div>
									</div>
								</motion.div>
							</motion.div>
						)}

						{tab === "records" && (
							<motion.div
								key="records"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 20 }}
								transition={{ duration: 0.3 }}
							>
								<h3 className="text-lg font-semibold mb-2 text-gray-900">Records</h3>
								<div className="text-sm text-slate-500 mb-6">{filteredLabel}</div>

								<motion.div 
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
									className="border border-gray-200 rounded-2xl p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
								>
									<div className="space-y-1">
										<div className="font-semibold text-gray-900">example-site.com</div>
										<div className="text-sm text-gray-400">Action: Removed</div>
										<div className="text-sm text-gray-400">By: Admin user on 0000-00-00</div>
									</div>
								</motion.div>
							</motion.div>
						)}
						</AnimatePresence>
					</div>
				</motion.div>
			</motion.div>
		</motion.div>
	);
}

export default function ModerationCompliancePage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Desktop Sidebar */}
            <AdminSidebar />

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <div className="lg:hidden">
                        <AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                <AdminHeader />
                <div className="flex-1 p-8 bg-gray-100 overflow-auto">
                    <ModerationComplianceBoard />
                </div>
            </div>
        </div>
    );
}

//Improved version with better animations and more polished UI.
