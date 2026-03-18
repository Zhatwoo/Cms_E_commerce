"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AdminSidebar } from "../components/sidebar";
import { AdminHeader } from "../components/header";

const ChevronRightIcon = () => (
	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
	</svg>
);

interface UserAccountShellProps {
	activePath: string;
	children: React.ReactNode;
}

export function UserAccountShell({ activePath, children }: UserAccountShellProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

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
					<div className="space-y-6 p-8">
						<div>
							<h1 className="mb-2 text-3xl font-bold text-[#B13BFF] sm:text-4xl">Account &amp; Settings</h1>
							<div className="mt-1 flex items-center gap-2 text-sm text-[#A78BFA]">
								<span>Account &amp; Settings</span>
								<ChevronRightIcon />
								<span className="font-semibold text-[#8A78FF]">{activePath}</span>
							</div>
						</div>
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}

export default function UserAccountPage() {
	return (
		<UserAccountShell activePath="Overview">
			<div className="admin-dashboard-panel rounded-[32px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-8 text-center text-sm text-[#8A86A4] shadow-[0_10px_26px_rgba(123,78,192,0.15)]">
				Select a section from the sidebar to manage account settings.
			</div>
		</UserAccountShell>
	);
}