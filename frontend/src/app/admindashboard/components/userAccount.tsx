import React from 'react';

const FilterIcon = () => (
	<svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M6 12h12M10 19h4" />
	</svg>
);

const SearchIcon = () => (
	<svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
	</svg>
);

const UserAvatar = () => (
	<div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
		<svg className="w-12 h-12 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
		</svg>
	</div>
);

export function UserAccount() {
	return (
		<div className="flex-1 bg-gray-100 min-h-screen">
			<div className="px-8 py-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">User Account</h1>
					<div className="text-sm text-gray-600 mt-1">User Account &gt; Account Information</div>
				</div>

				<div className="grid grid-cols-12 gap-6">
					<div className="col-span-12 lg:col-span-3">
						<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
							<div className="flex items-center gap-2 mb-4">
								<FilterIcon />
								<div className="relative flex-1">
									<input
										type="text"
										placeholder="Search"
										className="w-full h-9 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									<div className="absolute right-2 top-1/2 -translate-y-1/2">
										<SearchIcon />
									</div>
								</div>
							</div>

							<div className="space-y-2 text-sm">
								<button className="w-full text-left px-3 py-2 rounded-lg bg-gray-100 text-gray-900">Account Information</button>
								<button className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Change Password</button>
								<button className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Notifications</button>
								<button className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Personalization</button>
								<button className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Security &amp; Privacy</button>
							</div>
						</div>
					</div>

					<div className="col-span-12 lg:col-span-9">
						<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
							<div className="flex flex-col items-center text-center mb-8">
								<UserAvatar />
								<div className="mt-4 text-lg font-semibold text-gray-900">Admin User</div>
								<div className="text-sm text-gray-500">adminuser@cmd.com</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm text-gray-600 mb-2">First Name</label>
									<input
										type="text"
										className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-600 mb-2">Last Name</label>
									<input
										type="text"
										className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-600 mb-2">Email</label>
									<input
										type="email"
										className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-600 mb-2">Phone number</label>
									<input
										type="tel"
										className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm text-gray-600 mb-2">Role</label>
									<input
										type="text"
										className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
