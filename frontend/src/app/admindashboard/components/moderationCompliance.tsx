"use client";

import React, { useState } from "react";

export default function Board() {
	const [tab, setTab] = useState("webreviews");

	return (
		<div className="space-y-6">
			<div className="mb-2">
				<h1 className="text-3xl font-bold text-gray-900 mb-1">Moderation & Compliance</h1>
				<div className="text-sm text-gray-600 mt-1">
					Moderation & Compliance &gt; {tab === "webreviews" ? "Web Reviews" : tab === "reports" ? "Reports" : "Records"}
				</div>
			</div>

			<div className="space-y-4">
				<div className="relative">
					<svg className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" viewBox="0 0 24 24" fill="none">
						<path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						<circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
					</svg>
					<input
						aria-label="Search websites"
						placeholder="Search websites..."
						className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-10 pr-4 shadow-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>

				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
					<div className="flex items-center bg-gray-50 border-b border-gray-200">
						<button
							onClick={() => setTab("webreviews")}
							className={`py-3 px-6 font-medium transition-all ${
								tab === "webreviews" 
									? "text-blue-600 bg-white border-b-2 border-blue-600" 
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
							}`}
						>
							Web Reviews
						</button>
						<button
							onClick={() => setTab("reports")}
							className={`py-3 px-6 font-medium transition-all ${
								tab === "reports" 
									? "text-blue-600 bg-white border-b-2 border-blue-600" 
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
							}`}
						>
							Reports
						</button>
						<button
							onClick={() => setTab("records")}
							className={`py-3 px-6 font-medium transition-all ${
								tab === "records" 
									? "text-blue-600 bg-white border-b-2 border-blue-600" 
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
							}`}
						>
							Records
						</button>
					</div>

					<div className="p-6 min-h-[360px]">
						{tab === "webreviews" && (
							<>
								<h3 className="text-lg font-semibold mb-4 text-gray-900">Pending / Flagged Websites</h3>

								<div className="border border-gray-200 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											<div className="w-10 h-10 bg-red-50 rounded-md flex items-center justify-center text-red-600">
												<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
													<path d="M5 3h2v18H5V3zm2 0h10l-2 4 2 4H7V3z" />
												</svg>
											</div>
											<div>
												<div className="font-semibold text-gray-900 mb-1">example-site.com</div>
												<div className="text-sm text-gray-400">Pending</div>
											</div>
										</div>

										<div className="flex items-center gap-3">
											<button className="bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold">Approve</button>
											<button className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">View</button>
											<button className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold">Remove</button>
										</div>
									</div>
								</div>
							</>
						)}

						{tab === "reports" && (
							<>
								<h3 className="text-lg font-semibold mb-4 text-gray-900">Reports</h3>

								<div className="border border-gray-200 rounded-lg p-6">
									<div className="flex items-center justify-between">
										<div className="space-y-1">
											<div className="font-semibold text-gray-900">example-site.com</div>
											<div className="text-sm text-gray-300">Copyright Violation</div>
											<div className="text-sm font-semibold text-red-600">High</div>
										</div>

										<div className="flex items-center gap-3">
											<button className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">View</button>
											<button className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold">Dismiss</button>
										</div>
									</div>
								</div>
							</>
						)}

						{tab === "records" && (
							<>
								<h3 className="text-lg font-semibold mb-4 text-gray-900">Records</h3>

								<div className="border border-gray-200 rounded-lg p-6">
									<div className="space-y-1">
										<div className="font-semibold text-gray-900">example-site.com</div>
										<div className="text-sm text-gray-300">Action: Removed</div>
										<div className="text-sm text-gray-300">By: Admin user on 0000-00-00</div>
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
