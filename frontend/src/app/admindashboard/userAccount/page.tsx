"use client";

import React, { useState } from "react";
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
		<div className="min-h-screen bg-gray-100 flex">
			<div className="hidden lg:block">
				<AdminSidebar />
			</div>

			{sidebarOpen && (
				<>
					<div
						className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
					<div className="lg:hidden">
						<AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
					</div>
				</>
			)}

			<div className="flex-1 flex flex-col min-h-screen">
				<AdminHeader />
				<div className="flex-1 bg-gray-100">
					<div className="px-8 py-6">
						<div className="mb-6">
							<h1 className="text-3xl font-semibold text-gray-900">Account & Settings</h1>
							<div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
								<span>Account & Settings</span>
								<ChevronRightIcon />
								<span className="text-slate-700">{activePath}</span>
							</div>
						</div>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}

export default function UserAccountPage() {
	return (
		<UserAccountShell activePath="Overview">
			<div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
				Select a section from the sidebar to manage account settings.
			</div>
		</UserAccountShell>
	);
}