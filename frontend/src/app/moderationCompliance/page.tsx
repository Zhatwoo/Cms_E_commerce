"use client";

import React from "react";
import { AdminSidebar } from "../admindashboard/components/sidebar";
import Header from "./components/header";
import Board from "./components/board";

export default function ModerationCompliancePage() {
	return (
		<div className="min-h-screen flex bg-gray-100 text-gray-900">
			<AdminSidebar />

			<div className="flex-1 flex flex-col">
				<Header />

				<main className="p-6 lg:p-8 overflow-auto">
					<div className="max-w-[1200px] mx-auto">
						<Board />
					</div>
				</main>
			</div>
		</div>
	);
}

