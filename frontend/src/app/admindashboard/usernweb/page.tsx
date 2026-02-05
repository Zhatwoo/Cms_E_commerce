'use client';

import { useState, useMemo } from 'react';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';

const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

interface WebsiteData {
  id: string;
  domainName: string;
  username: string;
  status: 'Draft' | 'Live';
  plan: string;
}

const UserWebsiteManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data
  const [websites] = useState<WebsiteData[]>([
    {
      id: '1',
      domainName: 'Domain Name',
      username: 'Abby Lee',
      status: 'Draft',
      plan: 'Pro Plan',
    },
    {
      id: '2',
      domainName: 'Domain Name',
      username: 'Ben Ten',
      status: 'Live',
      plan: 'Basic Plan',
    },
  ]);

  // Filter websites based on search query
  const filteredWebsites = useMemo(() => {
    if (!searchQuery) return websites;
    return websites.filter(
      (website) =>
        website.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [websites, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                User & Website Management
              </h1>
              <p className="text-gray-600 mb-6">User & Website Management</p>
            </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 bg-white text-gray-900 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <SearchIcon />
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">
                    Domain Name
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">
                    Username
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {filteredWebsites.length > 0 ? (
                  filteredWebsites.map((website) => (
                    <tr
                      key={website.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 text-center">
                        {website.domainName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-center">
                        {website.username}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${website.status === 'Live' ? 'text-green-600' : 'text-yellow-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${website.status === 'Live' ? 'bg-green-600' : 'bg-yellow-600'}`} />
                          {website.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-center">
                        {website.plan}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-4">
                          <button className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
                            View
                          </button>
                          <button className="text-green-600 hover:text-green-800 hover:underline font-medium transition-colors">
                            Manage Account
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No websites found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserWebsiteManagement;
