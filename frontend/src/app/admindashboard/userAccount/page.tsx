"use client";

import React, { useState } from "react";
import { AdminSidebar } from "../components/sidebar";
import { AdminHeader } from "../components/header";

const UserAvatar = () => (
	<div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
		<svg className="w-12 h-12 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
		</svg>
	</div>
);

function UserAccountBoard() {
	const [activeTab, setActiveTab] = useState('Profile');

	const tabs = ['Profile', 'Security', 'Access Info', 'Activity', 'Notifications', 'Recovery'];

	return (
		<div className="flex-1 bg-gray-100 min-h-screen">
			<div className="px-8 py-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">Account & Settings</h1>
					<div className="text-sm text-gray-600 mt-1">Account & Settings &gt; {activeTab}</div>
				</div>

				<div className="grid grid-cols-12 gap-6">
					<div className="col-span-12 lg:col-span-3">
						<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
							<div className="space-y-2 text-sm">
								{tabs.map((tab) => (
									<button
										key={tab}
										onClick={() => setActiveTab(tab)}
										className={`w-full text-left px-3 py-2 rounded-lg ${
											activeTab === tab
												? 'bg-gray-100 text-gray-900'
												: 'text-gray-600 hover:bg-gray-100'
										}`}
									>
										{tab}
									</button>
								))}
							</div>
						</div>
					</div>

					<div className="col-span-12 lg:col-span-9">
						<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
							{activeTab === 'Profile' ? (
								<>
									<div className="flex flex-col items-center text-center mb-8">
										<UserAvatar />
										<div className="mt-4 text-lg font-semibold text-gray-900">Admin User</div>
										<div className="text-sm text-gray-500">adminuser@cmd.com</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label htmlFor="firstName" className="block text-sm text-gray-600 mb-2">First Name</label>
											<input
												id="firstName"
												type="text"
												className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label htmlFor="lastName" className="block text-sm text-gray-600 mb-2">Last Name</label>
											<input
												id="lastName"
												type="text"
												className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label htmlFor="email" className="block text-sm text-gray-600 mb-2">Email</label>
											<input
												id="email"
												type="email"
												className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label htmlFor="phoneNumber" className="block text-sm text-gray-600 mb-2">Phone number</label>
											<input
												id="phoneNumber"
												type="tel"
												className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div className="md:col-span-2 flex justify-end">
											<button
												className="bg-blue-500 text-white px-8 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
											>
												Save Changes
											</button>
										</div>
									</div>
								</>
							) : (
								<div className="flex items-center justify-center min-h-[400px]">
									<div className="text-center">
										<div className="text-gray-400 text-lg">{activeTab} - Coming Soon</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function UserAccountPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="min-h-screen bg-gray-100 flex">
			<div className="hidden lg:block">
				<AdminSidebar />
			</div>

			{sidebarOpen && (
				<>
					<div
						className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
					<div className="lg:hidden">
						<AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
					</div>
				</>
			)}

			<div className="flex-1 flex flex-col min-h-screen">
				<AdminHeader />
				<UserAccountBoard />
			</div>
		</div>
	);
}
