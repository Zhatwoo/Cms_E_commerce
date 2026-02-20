"use client";

import React from "react";
import { motion } from "framer-motion";
import { UserAccountShell } from "../page";
import { UserAccountSidebar } from "../components/ua_sidebar";

export default function ActivityPage() {
	const activityItems: { id: number; action: string; target: string; time: string; status: string }[] = [];

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
						className="bg-white rounded-2xl shadow-[0_16px_40px_rgba(15,23,42,0.08)] border border-gray-200 p-8"
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<div className="flex items-center justify-between mb-6">
								<div>
									<h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
									<p className="text-sm text-gray-500">Audit trail for this admin account.</p>
								</div>
								{/* <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50">
									Export Log
								</button> */}
							</div>

							<div className="space-y-3">
								{activityItems.length > 0 ? (
									activityItems.map((item) => (
										<div key={item.id} className="rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center gap-3">
											<div className="flex-1">
												<div className="text-sm font-semibold text-gray-900">{item.action}</div>
												<div className="text-xs text-gray-500">{item.target}</div>
											</div>
											<div className="text-xs text-gray-500 md:w-40 md:text-right">{item.time}</div>
											<span
												className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
													item.status === "Success"
														? "bg-emerald-50 text-emerald-700"
														: "bg-amber-50 text-amber-700"
												}`}
											>
												{item.status}
											</span>
										</div>
									))
								) : (
									<div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-500">
										No recent activity yet.
									</div>
								)}
							</div>
						</motion.div>
					</motion.div>
				</div>
			</div>
		</UserAccountShell>
	);
}
