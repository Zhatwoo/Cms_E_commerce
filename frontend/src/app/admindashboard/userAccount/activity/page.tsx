"use client";

import React from "react";
import { motion } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";

export default function ActivityPage() {
	const activityItems = [
		{ id: 1, title: "example-site.com", action: "Action: Removed", meta: "By: Admin user on 2026-01-28" },
	];

	return (
		<UserAccountShell activePath="Activity">
			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-3">
					<UserAccountSidebar />
				</div>

				<div className="col-span-12 lg:col-span-9">
					<motion.div
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45 }}
						className="admin-dashboard-panel rounded-[32px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-8 shadow-[0_10px_26px_rgba(123,78,192,0.15)]"
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<div className="mb-6">
								<h2 className="text-2xl font-semibold text-[#471396]">Recent Activity</h2>
								<p className="text-sm text-[#8A86A4]">Audit trail for this admin account</p>
							</div>

							<div className="space-y-3">
								{activityItems.map((item) => (
									<div key={item.id} className="admin-dashboard-inset-panel rounded-none border border-[rgba(177,59,255,0.16)] bg-white/42 px-6 py-5">
										<div className="flex items-center gap-5">
											<div className="h-20 w-[4px] rounded-full bg-[#FFCC00]" />
											<div>
												<p className="text-2xl font-semibold text-[#471396]">{item.title}</p>
												<p className="text-sm text-[#8A86A4]">{item.action}</p>
												<p className="text-sm text-[#8A86A4]">{item.meta}</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</motion.div>
					</motion.div>
				</div>
			</div>
		</UserAccountShell>
	);
}
