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
		<div className="admin-dashboard-panel rounded-[26px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-5 shadow-[0_10px_26px_rgba(123,78,192,0.15)] md:p-6">
			<div className="space-y-2 text-sm">
				{tabs.map((tab) => (
					<div key={tab.label}>
						<Link
							href={tab.href}
							className={`block w-full rounded-[18px] px-4 py-3 text-left text-[1.2rem] font-semibold leading-none transition-colors ${
								activePath === tab.href
									? "bg-white/70 text-[#471396] shadow-[0_8px_18px_rgba(123,78,192,0.08)]"
									: "text-[#471396] hover:bg-white/40"
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
