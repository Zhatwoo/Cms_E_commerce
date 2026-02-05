"use client";

import React, { useState } from "react";

export default function Board() {
	const [tab, setTab] = useState("webreviews");

	return (
		<div className="space-y-6">
			<div className="mb-2">
				<h1 className="text-3xl font-bold">Moderation & Compliance</h1>
				<div className="text-sm text-gray-600 mt-1">Moderation & Compliance &gt; Web Reviews</div>
			</div>

			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none">
						<path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						<circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
					</svg>
					<input
						aria-label="Search websites"
						placeholder="Search websites..."
						className="flex-1 bg-white border border-gray-200 rounded-lg py-3 px-4 shadow-sm"
					/>
				</div>

				<div className="bg-gray-200 rounded-lg">
					<div className="flex items-center gap-12 px-6">
						<button
							onClick={() => setTab("webreviews")}
							className={`py-3 px-6 -mb-px ${tab === "webreviews" ? "text-blue-700 font-semibold bg-white rounded-t-md" : "text-gray-600"}`}
						>
							Web Reviews
						</button>
						<button
							onClick={() => setTab("reports")}
							className={`py-3 px-6 -mb-px ${tab === "reports" ? "text-blue-700 font-semibold bg-white rounded-t-md" : "text-gray-600"}`}
						>
							Reports
						</button>
						<button
							onClick={() => setTab("records")}
							className={`py-3 px-6 -mb-px ${tab === "records" ? "text-blue-700 font-semibold bg-white rounded-t-md" : "text-gray-600"}`}
						>
							Records
						</button>
					</div>

					<div className="bg-white border border-gray-200 rounded-b-lg p-6 min-h-[360px]">
						<h3 className="text-lg font-semibold mb-4">Pending / Flagged Websites</h3>

						<div className="border border-gray-200 rounded-lg p-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className="w-10 h-10 bg-red-50 rounded-md flex items-center justify-center text-red-600">
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M5 3h2v18H5V3zm2 0h10l-2 4 2 4H7V3z" />
										</svg>
									</div>
									<div>
										<div className="font-semibold">example-site.com</div>
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
					</div>
				</div>
			</div>
		</div>
	);
}
