'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';

const ChevronRightIcon = () => (
	<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
	</svg>
);

const SearchIcon = () => (
	<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
	</svg>
);

interface DismissModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	site: string;
}

const DismissModal: React.FC<DismissModalProps> = ({ isOpen, onClose, onConfirm, site }) => {
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
					initial={{ scale: 0.97, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.97, opacity: 0 }}
					transition={{ duration: 0.22 }}
					className="admin-dashboard-panel w-full max-w-[560px] rounded-xl border border-[rgba(177,59,255,0.26)] bg-[#F5F4FF]"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="border-b border-[rgba(177,59,255,0.28)] px-8 py-6">
						<h3 className="text-2xl font-semibold text-[#471396]">Dismiss Report</h3>
					</div>
					<div className="space-y-6 px-8 py-6">
						<p className="text-base leading-7 text-[#471396]">
							Are you sure you want to dismiss this report for {site}? The
							report will be archived and no action will be taken.
						</p>
						<div className="flex items-center justify-end gap-6">
							<button
								type="button"
								onClick={onClose}
								className="text-base font-semibold text-[#9A99AF]"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => {
									onConfirm();
									onClose();
								}}
								className="rounded-2xl bg-[#FF4343] px-10 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
							>
								Dismiss
							</button>
						</div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};

interface DetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	data: {
		site: string;
		violationType?: string;
		priority?: string;
		reportedBy?: string;
		reportDate?: string;
		description?: string;
	};
}

const DetailsModal: React.FC<DetailsModalProps> = ({ isOpen, onClose, data }) => {
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
					initial={{ scale: 0.97, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.97, opacity: 0 }}
					transition={{ duration: 0.22 }}
					className="admin-dashboard-panel w-full max-w-[820px] rounded-xl border border-[rgba(177,59,255,0.26)] bg-[#F5F4FF]"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="border-b border-[rgba(177,59,255,0.28)] px-8 py-6">
						<h3 className="text-2xl font-semibold text-[#471396]">Report Details</h3>
					</div>

					<div className="space-y-6 px-8 py-7">
						<div>
							<p className="text-sm font-medium text-[#8A86A4]">Website</p>
							<p className="mt-1 text-2xl font-semibold leading-tight text-[#471396]">{data.site}</p>
						</div>

						<div className="grid grid-cols-2 gap-8">
							<div>
								<p className="text-sm font-medium text-[#8A86A4]">Violation Type</p>
								<p className="mt-1 text-xl font-semibold text-[#471396]">{data.violationType || 'Copyright Violation'}</p>
							</div>
							<div>
								<p className="text-sm font-medium text-[#8A86A4]">Priority</p>
								<p className="mt-1 text-xl font-semibold uppercase tracking-[0.3em] text-[#FF4343]">{data.priority || 'HIGH'}</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-8">
							<div>
								<p className="text-sm font-medium text-[#8A86A4]">Reported By</p>
								<p className="mt-1 text-xl font-semibold text-[#471396]">{data.reportedBy || 'report@cms.com'}</p>
							</div>
							<div>
								<p className="text-sm font-medium text-[#8A86A4]">Report Date</p>
								<p className="mt-1 text-xl font-semibold text-[#471396]">{data.reportDate || 'January 28, 2026'}</p>
							</div>
						</div>

						<div>
							<p className="text-sm font-medium text-[#8A86A4]">Report Details</p>
							<p className="mt-2 max-w-[96%] text-base leading-7 text-[#471396]">
								{data.description || 'This website has been reported for copyright violation. The content appears to contain unauthorized use of copyrighted material without proper licensing or attribution.'}
							</p>
						</div>
					</div>

					<div className="px-8 pb-8">
						<div className="flex justify-center">
							<button
								type="button"
								onClick={onClose}
								className="rounded-2xl bg-[#FFCC00] px-10 py-3 text-base font-semibold text-[#1F1F1F] transition-opacity hover:opacity-90"
							>
								Close
							</button>
						</div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};

function ModerationComplianceBoard() {
	const [tab, setTab] = useState<'reports' | 'records'>('reports');
	const [searchQuery, setSearchQuery] = useState('');
	const [showDismissModal, setShowDismissModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [currentSite, setCurrentSite] = useState('example-site.com');

	const tabLabel = tab === 'reports' ? 'Reports' : 'Records';

	const filteredLabel = searchQuery.trim() ? `Results for "${searchQuery.trim()}"` : tabLabel;

	const stats = useMemo(() => {
		if (tab === 'reports') {
			return [
				{ label: 'NEW REPORTS', value: '56' },
				{ label: 'HIGH PRIORITY', value: '7' },
				{ label: 'RESOLVED', value: '10' },
			];
		}
		return [
			{ label: 'REMOVALS', value: '56' },
			{ label: 'RESTORED', value: '7' },
			{ label: 'AUDITED', value: '10' },
		];
	}, [tab]);

	const handleView = (site: string) => {
		setCurrentSite(site);
		setShowDetailsModal(true);
	};

	const handleDismiss = () => {
		console.log('Dismissed:', currentSite);
	};

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
						<h1 className="mb-1 text-3xl font-bold text-[#B13BFF] sm:text-4xl">Moderation &amp; Compliance</h1>
						<div className="mt-1 flex items-center gap-2 text-sm text-[#A78BFA]">
							<span>Moderation & Compliance</span>
							<ChevronRightIcon />
							<span className="font-semibold text-[#8A78FF]">{tabLabel}</span>
						</div>
					</div>
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className="flex items-center gap-3"
					>
						<div className="rounded-full bg-[#FFCC00] px-3 py-1 text-xs font-semibold text-[#232323]">Auto-review on</div>
						<div className="rounded-full border border-[rgba(138,134,164,0.5)] px-3 py-1 text-xs text-[#8A86A4]">Last sync 2 min ago</div>
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
					className="grid grid-cols-1 gap-4 sm:grid-cols-3"
				>
					{stats.map((item) => (
						<motion.div
							key={item.label}
							className="admin-dashboard-panel rounded-[28px] border border-[rgba(177,59,255,0.23)] bg-[#F5F4FF] p-6 shadow-[0_8px_20px_rgba(123,78,192,0.14)]"
							whileHover={{ y: -3, scale: 1.01 }}
							transition={{ type: 'spring', stiffness: 260, damping: 22 }}
						>
							<div className="text-6xl font-bold leading-none text-[#FFCC00]">{item.value}</div>
							<div className="mt-3 text-sm font-semibold uppercase text-[#471396]">{item.label}</div>
							<div className="mt-1 text-xs text-[#8A86A4]">Live</div>
						</motion.div>
					))}
				</motion.div>

				<div className="flex flex-wrap items-center gap-3">
					<div className="flex gap-1 rounded-xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] p-1">
						<button
							onClick={() => setTab('reports')}
							className={`min-w-[132px] rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
								tab === 'reports'
									? 'bg-[#FFCC00] text-[#471396] shadow-sm'
									: 'text-[#66607E] hover:text-[#471396]'
							}`}
						>
							Reports
						</button>
						<button
							onClick={() => setTab('records')}
							className={`min-w-[132px] rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
								tab === 'records'
									? 'bg-[#FFCC00] text-[#471396] shadow-sm'
									: 'text-[#66607E] hover:text-[#471396]'
							}`}
						>
							Records
						</button>
					</div>

					<button
						type="button"
						className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FFCC00] text-[#471396] shadow-sm"
						aria-label="Search"
					>
						<SearchIcon />
					</button>

					<input
						aria-label="Search websites"
						placeholder="Search websites"
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						className="admin-dashboard-panel-soft h-12 min-w-[17rem] flex-1 rounded-2xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] px-4 text-sm font-medium text-[#471396] outline-none placeholder:text-[#82788F]"
					/>
				</div>

				<motion.div
					initial={{ opacity: 0, scale: 0.98 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.4 }}
					className="admin-dashboard-panel overflow-hidden rounded-[32px] border border-[rgba(177,59,255,0.24)] bg-[#F5F4FF] p-8 shadow-[0_10px_26px_rgba(123,78,192,0.15)]"
				>
					<div className="min-h-[350px]">
						<AnimatePresence mode="wait">
							{tab === 'reports' && (
							<motion.div
								key="reports"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 20 }}
								transition={{ duration: 0.3 }}
							>
								<h3 className="mb-6 text-2xl font-semibold text-[#471396]">Reports</h3>
								<div className="mb-6 text-sm text-[#8A86A4]">{filteredLabel}</div>

								<div className="admin-dashboard-inset-panel flex items-center justify-between rounded-none border border-[rgba(177,59,255,0.16)] bg-white/42 px-6 py-5">
									<div className="flex items-center gap-5">
										<div className="h-20 w-[4px] rounded-full bg-[#FFCC00]" />
										<div>
											<p className="text-2xl font-semibold text-[#471396]">example-site.com</p>
											<p className="text-base text-[#8A86A4]">Copyright Violation</p>
											<p className="mt-1 text-sm font-semibold uppercase tracking-[0.35em] text-[#FF4343]">HIGH</p>
										</div>
									</div>

									<div className="flex items-center gap-5">
										<button
											type="button"
											onClick={() => handleView('example-site.com')}
											className="text-lg font-medium text-[#471396]"
										>
											View
										</button>
										<button
											type="button"
											onClick={() => {
												setCurrentSite('example-site.com');
												setShowDismissModal(true);
											}}
											className="rounded-xl bg-[#FF4343] px-6 py-2.5 text-base font-semibold text-white"
										>
											Dismiss
										</button>
									</div>
								</div>
							</motion.div>
							)}

							{tab === 'records' && (
							<motion.div
								key="records"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 20 }}
								transition={{ duration: 0.3 }}
							>
								<h3 className="mb-6 text-2xl font-semibold text-[#471396]">Records</h3>
								<div className="mb-6 text-sm text-[#8A86A4]">{filteredLabel}</div>

								<div className="admin-dashboard-inset-panel rounded-none border border-[rgba(177,59,255,0.16)] bg-white/42 px-6 py-5">
									<div className="flex items-center gap-5">
										<div className="h-20 w-[4px] rounded-full bg-[#FFCC00]" />
										<div>
											<p className="text-2xl font-semibold text-[#471396]">example-site.com</p>
											<p className="text-base text-[#8A86A4]">Action: Removed</p>
											<p className="text-base text-[#8A86A4]">By: Admin user on 2026-01-28</p>
										</div>
									</div>
								</div>
							</motion.div>
							)}
						</AnimatePresence>
					</div>
				</motion.div>
			</motion.div>

			<DismissModal
				isOpen={showDismissModal}
				onClose={() => setShowDismissModal(false)}
				onConfirm={handleDismiss}
				site={currentSite}
			/>

			<DetailsModal
				isOpen={showDetailsModal}
				onClose={() => setShowDetailsModal(false)}
				data={{
					site: currentSite,
					violationType: 'Copyright Violation',
					priority: 'HIGH',
					reportedBy: 'report@cms.com',
					reportDate: 'January 28, 2026',
					description: 'This website has been reported for copyright violation. The content appears to contain unauthorized use of copyrighted material without proper licensing or attribution.',
				}}
			/>
		</motion.div>
	);
}

export default function ModerationCompliancePage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="admin-dashboard-shell flex h-screen overflow-hidden" suppressHydrationWarning>
			<AdminSidebar forcedActiveItemId="moderation" />

			<AnimatePresence>
				{sidebarOpen && (
					<div className="lg:hidden">
						<AdminSidebar mobile onClose={() => setSidebarOpen(false)} forcedActiveItemId="moderation" />
					</div>
				)}
			</AnimatePresence>

			<div className="flex min-h-0 flex-1 flex-col">
				<AdminHeader onMenuClick={() => setSidebarOpen(true)} />
				<main className="flex-1 min-h-0 overflow-y-auto">
					<div className="p-8">
						<ModerationComplianceBoard />
					</div>
				</main>
			</div>
		</div>
	);
}
