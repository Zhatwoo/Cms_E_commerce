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

// Modal Component
interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmText: string;
	confirmColor: 'green' | 'red';
}

const ConfirmModal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, description, confirmText, confirmColor }) => {
	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
				onClick={onClose}
			>
				<motion.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.95, opacity: 0 }}
					transition={{ type: 'spring', duration: 0.3 }}
					className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
					onClick={(e) => e.stopPropagation()}
				>
					<h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
					<p className="text-gray-600 mb-6">{description}</p>
					<div className="flex gap-3 justify-end">
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={onClose}
							className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
						>
							Cancel
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => {
								onConfirm();
								onClose();
							}}
							className={`px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-colors ${
								confirmColor === 'green'
									? 'bg-emerald-500 hover:bg-emerald-600'
									: 'bg-red-500 hover:bg-red-600'
							}`}
						>
							{confirmText}
						</motion.button>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};

// Details Modal Component
interface DetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	type: 'review' | 'report';
	data: {
		site: string;
		status?: string;
		submittedBy?: string;
		submittedDate?: string;
		category?: string;
		description?: string;
		violationType?: string;
		priority?: string;
		reportedBy?: string;
		reportDate?: string;
	};
}

const DetailsModal: React.FC<DetailsModalProps> = ({ isOpen, onClose, type, data }) => {
	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
				onClick={onClose}
			>
				<motion.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.95, opacity: 0 }}
					transition={{ type: 'spring', duration: 0.3 }}
					className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="sticky top-0 bg-white border-b border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<h3 className="text-2xl font-bold text-gray-900">
								{type === 'review' ? 'Website Review Details' : 'Report Details'}
							</h3>
							<button
								onClick={onClose}
								aria-label="Close details"
								className="text-gray-400 hover:text-gray-600 transition-colors"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>

					<div className="p-6 space-y-4">
						<div className="bg-slate-50 rounded-xl p-4">
							<div className="text-sm font-semibold text-slate-500 mb-1">Website</div>
							<div className="text-lg font-bold text-gray-900">{data.site}</div>
						</div>

						{type === 'review' && (
							<>
								<div className="grid grid-cols-2 gap-4">
									<div className="bg-slate-50 rounded-xl p-4">
										<div className="text-sm font-semibold text-slate-500 mb-1">Status</div>
										<div className="font-semibold text-gray-900">{data.status || 'Pending'}</div>
									</div>
									<div className="bg-slate-50 rounded-xl p-4">
										<div className="text-sm font-semibold text-slate-500 mb-1">Submitted Date</div>
										<div className="font-semibold text-gray-900">{data.submittedDate || 'Feb 10, 2026'}</div>
									</div>
								</div>

								<div className="bg-slate-50 rounded-xl p-4">
									<div className="text-sm font-semibold text-slate-500 mb-1">Submitted By</div>
									<div className="font-semibold text-gray-900">{data.submittedBy || 'user@example.com'}</div>
								</div>

								<div className="bg-slate-50 rounded-xl p-4">
									<div className="text-sm font-semibold text-slate-500 mb-2">Description</div>
									<div className="text-gray-700">
										{data.description || 'This website is pending review for content moderation and compliance verification.'}
									</div>
								</div>
							</>
						)}

						{type === 'report' && (
							<>
								<div className="grid grid-cols-2 gap-4">
									<div className="bg-slate-50 rounded-xl p-4">
										<div className="text-sm font-semibold text-slate-500 mb-1">Violation Type</div>
										<div className="font-semibold text-gray-900">{data.violationType || 'Copyright Violation'}</div>
									</div>
									<div className="bg-slate-50 rounded-xl p-4">
										<div className="text-sm font-semibold text-slate-500 mb-1">Priority</div>
										<div className="font-semibold text-red-600 uppercase text-sm tracking-wider">
											{data.priority || 'High'}
										</div>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="bg-slate-50 rounded-xl p-4">
										<div className="text-sm font-semibold text-slate-500 mb-1">Reported By</div>
										<div className="font-semibold text-gray-900">{data.reportedBy || 'reporter@example.com'}</div>
									</div>
									<div className="bg-slate-50 rounded-xl p-4">
										<div className="text-sm font-semibold text-slate-500 mb-1">Report Date</div>
										<div className="font-semibold text-gray-900">{data.reportDate || 'Feb 11, 2026'}</div>
									</div>
								</div>

								<div className="bg-slate-50 rounded-xl p-4">
									<div className="text-sm font-semibold text-slate-500 mb-2">Report Details</div>
									<div className="text-gray-700">
										{data.description || 'This website has been reported for copyright violation. The content appears to contain unauthorized use of copyrighted material without proper licensing or attribution.'}
									</div>
								</div>
							</>
						)}
					</div>

					<div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={onClose}
							className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
						>
							Close
						</motion.button>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};

function ModerationComplianceBoard() {
	const [tab, setTab] = useState("reports");
	const [searchQuery, setSearchQuery] = useState('');
	const [isFlagged, setIsFlagged] = useState(false);
	
	// Modal states
	const [showApproveModal, setShowApproveModal] = useState(false);
	const [showRemoveModal, setShowRemoveModal] = useState(false);
	const [showDismissModal, setShowDismissModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [currentItem, setCurrentItem] = useState({ site: 'example-site.com', type: 'review' as 'review' | 'report' });

	const tabLabel = tab === "webreviews" ? "Web Reviews" : tab === "reports" ? "Reports" : "Records";
	const filteredLabel = searchQuery.trim() ? `Results for "${searchQuery.trim()}"` : tabLabel;

	const handleApprove = () => {
		console.log('Approved:', currentItem.site);
		// Add your approval logic here
	};

	const handleRemove = () => {
		console.log('Removed:', currentItem.site);
		// Add your removal logic here
	};

	const handleDismiss = () => {
		console.log('Dismissed:', currentItem.site);
		// Add your dismiss logic here
	};

	const handleView = (site: string, type: 'review' | 'report') => {
		setCurrentItem({ site, type });
		setShowDetailsModal(true);
	};

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
							{/* <button
								onClick={() => setTab("webreviews")}
								className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${
									tab === "webreviews"
										? "border-blue-600 text-blue-600"
										: "border-transparent text-gray-600 hover:text-gray-900"
								}`}
							>
								Web Reviews
							</button> */}
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
						{/* {tab === "webreviews" && (
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
											<motion.button
												type="button"
												aria-pressed={isFlagged}
												aria-label={isFlagged ? 'Unflag website' : 'Flag website'}
												onClick={() => setIsFlagged((prev) => !prev)}
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors border ${
													isFlagged
														? 'bg-red-100 text-red-600 border-red-200 shadow-sm z-10'
														: 'bg-transparent text-slate-400 border-slate-200 hover:bg-red-50 hover:text-red-600'
												}`}
											>
												<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
													<path d="M5 3h2v18H5V3zm2 0h10l-2 4 2 4H7V3z" />
												</svg>
											</motion.button>
											<div>
												<div className="font-semibold text-gray-900 mb-1">example-site.com</div>
												<div className="text-sm text-gray-400">Pending</div>
											</div>
										</div>

										<div className="flex items-center gap-3">
										<motion.button 
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={() => {
												setCurrentItem({ site: 'example-site.com', type: 'review' });
												setShowApproveModal(true);
											}}
											className="bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow hover:bg-emerald-600 transition-colors"
										>
											Approve
										</motion.button>
										<motion.button 
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={() => handleView('example-site.com', 'review')}
											className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow hover:bg-blue-600 transition-colors"
										>
											View
										</motion.button>
										<motion.button 
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={() => {
												setCurrentItem({ site: 'example-site.com', type: 'review' });
												setShowRemoveModal(true);
											}}
											className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow hover:bg-red-600 transition-colors"
										>
											Remove
										</motion.button>
										</div>
									</div>
								</motion.div>
							</motion.div>
						)} */}

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
											onClick={() => handleView('example-site.com', 'report')}
											className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow hover:bg-blue-600 transition-colors"
										>
											View
										</motion.button>
										<motion.button 
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={() => {
												setCurrentItem({ site: 'example-site.com', type: 'report' });
												setShowDismissModal(true);
											}}
											className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow hover:bg-red-600 transition-colors"
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

			{/* Modals */}
			<ConfirmModal
				isOpen={showApproveModal}
				onClose={() => setShowApproveModal(false)}
				onConfirm={handleApprove}
				title="Approve Website"
				description={`Are you sure you want to approve ${currentItem.site}? This website will be published and accessible to users.`}
				confirmText="Approve"
				confirmColor="green"
			/>

			<ConfirmModal
				isOpen={showRemoveModal}
				onClose={() => setShowRemoveModal(false)}
				onConfirm={handleRemove}
				title="Remove Website"
				description={`Are you sure you want to remove ${currentItem.site}? This action cannot be undone and the website will be permanently deleted.`}
				confirmText="Remove"
				confirmColor="red"
			/>

			<ConfirmModal
				isOpen={showDismissModal}
				onClose={() => setShowDismissModal(false)}
				onConfirm={handleDismiss}
				title="Dismiss Report"
				description={`Are you sure you want to dismiss this report for ${currentItem.site}? The report will be archived and no action will be taken.`}
				confirmText="Dismiss"
				confirmColor="red"
			/>

			<DetailsModal
				isOpen={showDetailsModal}
				onClose={() => setShowDetailsModal(false)}
				type={currentItem.type}
				data={{ site: currentItem.site }}
			/>
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
