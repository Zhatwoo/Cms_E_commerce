"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
	{ label: "Profile", href: "/admindashboard/userAccount/profile" },
	{ label: "Security", href: "/admindashboard/userAccount/security" },
	{ label: "Activity", href: "/admindashboard/userAccount/activity" },
	{ label: "Notifications", href: "/admindashboard/userAccount/ua_notifications" },
	{ label: "Recovery", href: "/admindashboard/userAccount/recovery" },
];

export function UserAccountSidebar() {
	const pathname = usePathname();
	const activePath = pathname === "/admindashboard/userAccount" ? "/admindashboard/userAccount/profile" : pathname;

	return (
		<div className="bg-white rounded-2xl shadow-[0_16px_40px_rgba(15,23,42,0.08)] border border-gray-200 p-4">
			<div className="space-y-2 text-sm">
				{tabs.map((tab) => (
					<div key={tab.label}>
						<Link
							href={tab.href}
							className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
								activePath === tab.href
									? "bg-slate-900 text-white"
									: "text-gray-600 hover:bg-gray-100"
							}`}
						>
							{tab.label}
						</Link>
					</div>
				))}
			</div>
		</div>
	);
}
