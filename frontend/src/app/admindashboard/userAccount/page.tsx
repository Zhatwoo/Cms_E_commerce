"use client";

import React, { useState } from "react";
import { AdminSidebar } from "../components/sidebar";
import { AdminHeader } from "../components/header";
import { UserAccount } from "../components/userAccount";

export default function UserAccountPage() {
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
				<AdminHeader onMenuClick={() => setSidebarOpen(true)} />
				<UserAccount />
			</div>
		</div>
	);
}
