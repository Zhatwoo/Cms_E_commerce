"use client";

import React from "react";

export default function Header() {
	return (
		<header className="bg-black text-white px-6 py-3 flex items-center gap-6">
			<button aria-label="Open main menu" title="Open main menu" className="p-2 rounded-md">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
					<path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
				</svg>
			</button>

			<div className="flex-1">
				<div className="max-w-sm">
					<div className="relative">
						<input
							aria-label="Search"
							placeholder="Search"
							className="w-full rounded-full py-2 pl-4 pr-10 text-black bg-white"
						/>
						<svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" viewBox="0 0 24 24" fill="none">
							<path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							<circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
						</svg>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<button aria-label="Messages" title="Messages" className="p-2">
					<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
						<path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</button>
				<button aria-label="Settings" title="Settings" className="p-2">
					<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
						<path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" stroke="currentColor" strokeWidth="1.5" />
						<path d="M19.4 15a1.8 1.8 0 00.35 2l.02.02a2 2 0 01-2.83 2.83l-.02-.02a1.8 1.8 0 00-2-.35 1.8 1.8 0 00-1 1.6V21a2 2 0 01-4 0v-.01a1.8 1.8 0 00-1-1.6 1.8 1.8 0 00-2 .35l-.02.02a2 2 0 01-2.83-2.83l.02-.02a1.8 1.8 0 00.35-2 1.8 1.8 0 00-1.6-1H3a2 2 0 010-4h.01a1.8 1.8 0 001.6-1 1.8 1.8 0 00-.35-2l-.02-.02a2 2 0 012.83-2.83l.02.02a1.8 1.8 0 002 .35h.01a1.8 1.8 0 001-1.6V3a2 2 0 014 0v.01a1.8 1.8 0 001 1.6 1.8 1.8 0 002-.35l.02-.02a2 2 0 012.83 2.83l-.02.02a1.8 1.8 0 00-.35 2v.01a1.8 1.8 0 001.6 1H21a2 2 0 010 4h-.01a1.8 1.8 0 00-1.6 1z" stroke="currentColor" strokeWidth="1.5" />
					</svg>
				</button>
				<button aria-label="Account" title="Account" className="p-2 rounded-full border border-white/20 w-8 h-8 flex items-center justify-center">
					<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
						<path d="M20 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M4 21v-2a4 4 0 013-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						<circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
					</svg>
				</button>
			</div>
		</header>
	);
}

