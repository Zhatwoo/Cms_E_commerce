'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';

const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface WebsiteData {
  id: string;
  domainName: string;
  owner: string;
  status: 'Draft' | 'Live' | 'Flagged';
  plan: string;
  domainType: string;
}

const UserWebsiteManagement = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [domainTypeFilter, setDomainTypeFilter] = useState('');

  // Sample data
  const [websites] = useState<WebsiteData[]>([
    {
      id: '1',
      domainName: 'abby-shop.cms.com',
      owner: 'Abby Lee',
      status: 'Draft',
      plan: 'Pro',
      domainType: 'Subdomain',
    },
    {
      id: '2',
      domainName: 'bentenstore.com',
      owner: 'Ben Ten',
      status: 'Live',
      plan: 'Basic',
      domainType: 'Custom',
    },
    {
      id: '3',
      domainName: 'suspicious-site.cms.com',
      owner: 'Unknown User',
      status: 'Flagged',
      plan: 'Free',
      domainType: 'Subdomain',
    },
  ]);

  // Calculate stats
  const stats = {
    total: 128,
    live: 82,
    underReview: 12,
    flagged: 6,
  };

  // Filter websites based on search query and filters
  const filteredWebsites = useMemo(() => {
    return websites.filter((website) => {
      const matchesSearch = !searchQuery || 
        website.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.owner.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || website.status === statusFilter;
      const matchesPlan = !planFilter || website.plan === planFilter;
      const matchesDomainType = !domainTypeFilter || website.domainType === domainTypeFilter;
      
      return matchesSearch && matchesStatus && matchesPlan && matchesDomainType;
    });
  }, [websites, searchQuery, statusFilter, planFilter, domainTypeFilter]);

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
                User and Website Management
              </h1>
              <p className="text-gray-600 mb-6">Oversee all user accounts and published websites</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Websites */}
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-2">Total Websites</p>
                <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
              </div>

              {/* Live */}
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-2">Live</p>
                <p className="text-4xl font-bold text-green-600">{stats.live}</p>
              </div>

              {/* Under Review */}
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-2">Under Review</p>
                <p className="text-4xl font-bold text-yellow-500">{stats.underReview}</p>
              </div>

              {/* Flagged */}
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-2">Flagged</p>
                <p className="text-4xl font-bold text-red-600">{stats.flagged}</p>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Search and Filters */}
              <div className="px-6 py-6 border-b border-gray-200">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search Input */}
                  <div className="w-80">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search domain or user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <SearchIcon />
                      </div>
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-700 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[140px]"
                    >
                      <option value="">Status</option>
                      <option value="Live">Live</option>
                      <option value="Draft">Draft</option>
                      <option value="Flagged">Flagged</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDownIcon />
                    </div>
                  </div>

                  {/* Plan Filter */}
                  <div className="relative">
                    <select
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-700 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[140px]"
                    >
                      <option value="">Plan</option>
                      <option value="Free">Free</option>
                      <option value="Basic">Basic</option>
                      <option value="Pro">Pro</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDownIcon />
                    </div>
                  </div>

                  {/* Domain Type Filter */}
                  <div className="relative">
                    <select
                      value={domainTypeFilter}
                      onChange={(e) => setDomainTypeFilter(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 bg-white text-gray-700 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[160px]"
                    >
                      <option value="">Domain Type</option>
                      <option value="Subdomain">Subdomain</option>
                      <option value="Custom">Custom</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  {/* Table Header */}
                  <thead>
                    <tr className="bg-white border-b">
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">
                        Domain
                      </th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">
                        Owner
                      </th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">
                        Plan
                      </th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-700">
                        Domain Type
                      </th>
                      <th className="px-4 py-5 text-center text-sm font-semibold text-gray-700">
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
                          <td className="px-4 py-5 text-sm text-gray-900 text-left">
                            {website.domainName}
                          </td>
                          <td className="px-4 py-5 text-sm text-gray-700 text-left">
                            {website.owner}
                          </td>
                          <td className="px-4 py-5 text-sm text-left">
                            <span 
                              className={`text-sm ${
                                website.status === 'Live' 
                                  ? 'text-green-600' 
                                  : website.status === 'Flagged'
                                  ? 'text-red-600'
                                  : 'text-yellow-600'
                              }`}
                            >
                              {website.status}
                            </span>
                          </td>
                          <td className="px-4 py-5 text-sm text-gray-700 text-left">
                            {website.plan}
                          </td>
                          <td className="px-4 py-5 text-sm text-gray-700 text-left">
                            {website.domainType}
                          </td>
                          <td className="px-4 py-5 text-sm text-center">
                            <div className="flex items-center justify-center gap-4">
                              <button 
                                onClick={() => router.push(`/admindashboard/usernweb/webmng?id=${website.id}`)}
                                className="text-green-600 hover:text-green-800 hover:underline font-medium transition-colors"
                              >
                                Manage
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-gray-500"
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
