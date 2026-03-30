"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { motion } from "framer-motion";

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
					<Link
						key={tab.label}
						href={tab.href}
						className={`relative block w-full rounded-[18px] px-4 py-3 text-left text-[1.2rem] font-semibold leading-none transition-colors duration-200 ${
							activePath === tab.href ? "text-[#471396]" : "text-[#471396] hover:text-[#B13BFF]"
						}`}
					>
						{activePath === tab.href && (
							<motion.div
								layoutId="accountSidebarTab"
								className="absolute inset-0 rounded-[18px] bg-white shadow-[0_8px_18px_rgba(123,78,192,0.08)]"
								transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
							/>
						)}
						<span className="relative z-10">{tab.label}</span>
					</Link>
				))}
			</div>
		</div>
	);
}
