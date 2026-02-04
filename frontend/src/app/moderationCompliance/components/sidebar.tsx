"use client";

import React from "react";

export default function Sidebar() {
	return (
		<aside className="w-64 bg-black text-white flex flex-col">
			<div className="p-6 border-b border-black/30">
				<div className="text-xl font-bold">(Logo)</div>
			</div>

			<nav className="flex-1 px-4 py-6 space-y-2">
				{[
					"Dashboard",
					"Monitoring & Analytics",
					"Website Management",
					"Moderation & Compliance",
					"Templates & Assets Management",
					"User & Account Management",
				].map((label) => (
					<a key={label} className={`flex items-center gap-3 p-3 rounded-md hover:bg-white/5 ${label === 'Moderation & Compliance' ? 'bg-white/5 font-semibold' : 'text-gray-300'}`} href="#">
						<span className="w-5 h-5 bg-white/10 rounded-sm inline-block" />
						<span>{label}</span>
					</a>
				))}
			</nav>

			<div className="p-4 border-t border-black/30">
				<button className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-white/5">
					<span className="w-5 h-5 bg-white/10 rounded-sm inline-block" />
					Log out
				</button>
			</div>
		</aside>
	);
}

