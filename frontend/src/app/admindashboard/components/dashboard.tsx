import React from 'react';

const MoreMenuIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

export function AdminDashboard() {
    return (
        <div className="flex-1 p-8 bg-gray-100 overflow-auto">
            {/* Welcome Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome, User!</h1>
                <p className="text-gray-600 text-sm">Dashboard</p>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6 min-h-[130px] flex items-end">
                    <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 min-h-[130px] flex items-end">
                    <h3 className="text-lg font-semibold text-gray-900">Total Websites</h3>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 min-h-[130px] flex items-end">
                    <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Takes 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Published Sites Section */}
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Published Sites</h2>
                            <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                                <p className="text-gray-400 text-sm">No published sites yet</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities Section */}
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activities</h2>
                            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                                <p className="text-gray-400 text-sm">No recent activities</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Takes 1/3 width */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm sticky top-8">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
                                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <MoreMenuIcon />
                                </button>
                            </div>
                            <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
                                <p className="text-gray-400 text-sm">No notifications</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
