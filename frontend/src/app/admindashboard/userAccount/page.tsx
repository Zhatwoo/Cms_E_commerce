"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AdminSidebar } from "../components/sidebar";
import { AdminHeader } from "../components/header";

export const Skeleton = ({ className = "" }: { className?: string }) => (
	<div className={`animate-pulse rounded-2xl bg-[#E8E4FF] ${className}`} />
);

interface UserAccountShellProps {
	activePath: string;
	children: React.ReactNode;
}

export function UserAccountShell({ activePath, children }: UserAccountShellProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isTransitioning, setIsTransitioning] = useState(false);

	// Simulate a brief loading state when activePath changes for skeleton demo
	useEffect(() => {
		setIsTransitioning(true);
		const timer = setTimeout(() => setIsTransitioning(false), 300);
		return () => clearTimeout(timer);
	}, [activePath]);

	return (
		<div className="admin-dashboard-shell flex h-screen overflow-hidden" suppressHydrationWarning>
			<AdminSidebar />

			<AnimatePresence>
				{sidebarOpen && (
					<div className="lg:hidden">
						<AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
					</div>
				)}
			</AnimatePresence>

			<div className="flex min-h-0 flex-1 flex-col">
				<AdminHeader onMenuClick={() => setSidebarOpen(true)} />
				<main className="flex-1 min-h-0 overflow-y-auto">
					<div className="mx-auto max-w-7xl space-y-10 p-10 pb-20">
						<motion.div 
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.4 }}
							className="space-y-2"
						>
							<h1 className="text-4xl font-black tracking-tight text-[#4a1a8a]">Account Settings</h1>
							<p className="text-sm font-medium text-[#7a6aa0] opacity-80">Manage your personal information, security preferences, and billing details across the platform.</p>
						</motion.div>

						<div className="relative min-h-[400px]">
							<AnimatePresence mode="wait">
								{isTransitioning ? (
									<motion.div
										key="skeleton"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										className="space-y-8"
									>
										<div className="grid grid-cols-12 gap-6">
											<div className="col-span-12 lg:col-span-3">
												<Skeleton className="h-[400px]" />
											</div>
											<div className="col-span-12 lg:col-span-9 space-y-6">
												<Skeleton className="h-[300px]" />
												<div className="grid grid-cols-2 gap-6">
													<Skeleton className="h-[150px]" />
													<Skeleton className="h-[150px]" />
												</div>
											</div>
										</div>
									</motion.div>
								) : (
									<motion.div
										key={activePath}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.35, ease: "easeOut" }}
									>
										{children}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}

export default function UserAccountPage() {
	return (
		<UserAccountShell activePath="Overview">
			<motion.div 
				whileHover={{ scale: 1.005 }}
				className="admin-dashboard-panel cursor-default rounded-[40px] border border-[rgba(177,59,255,0.18)] bg-white/70 p-12 text-center shadow-[0_20px_50px_rgba(123,78,192,0.08)] transition-all hover:bg-white hover:shadow-[0_30px_70px_rgba(123,78,192,0.12)]"
			>
				<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[30px] bg-[#F5F4FF] text-[#4a1a8a] shadow-inner mb-6">
					<svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				</div>
				<h3 className="text-xl font-bold text-[#4a1a8a] mb-2">Welcome to Account Management</h3>
				<p className="mx-auto max-w-sm text-sm font-medium text-[#8A86A4] leading-relaxed">
					Please select a category from the navigation sidebar to begin managing your professional identity and security settings.
				</p>
			</motion.div>
		</UserAccountShell>
	);
}