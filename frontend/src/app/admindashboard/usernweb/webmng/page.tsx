'use client';

import { useSearchParams } from 'next/navigation';
import { AdminSidebar } from '../../components/sidebar';
import { AdminHeader } from '../../components/header';

// Website data structure
interface WebsiteDetails {
  id: string;
  domainName: string;
  owner: string;
  email: string;
  status: 'Draft' | 'Live' | 'Flagged';
  plan: 'Free' | 'Basic' | 'Pro';
  domainType: 'Subdomain' | 'Custom';
  createdDate: string;
  lastUpdated: string;
  nextBilling: string;
  storage: { used: number; total: number; percentage: number };
  bandwidth: { used: number; total: number; percentage: number };
  billingCycle: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
}

// Sample website data
const websiteDatabase: Record<string, WebsiteDetails> = {
  '1': {
    id: '1',
    domainName: 'abby-shop.cms.com',
    owner: 'Abby Lee',
    email: 'abby.lee@email.com',
    status: 'Draft',
    plan: 'Pro',
    domainType: 'Subdomain',
    createdDate: 'Jan 15, 2024',
    lastUpdated: 'Feb 2, 2024',
    nextBilling: 'Mar 15, 2024',
    storage: { used: 3.2, total: 10, percentage: 32 },
    bandwidth: { used: 45, total: 100, percentage: 45 },
    billingCycle: 'Monthly',
    paymentStatus: 'Paid',
  },
  '2': {
    id: '2',
    domainName: 'bentenstore.com',
    owner: 'Ben Ten',
    email: 'ben.ten@email.com',
    status: 'Live',
    plan: 'Basic',
    domainType: 'Custom',
    createdDate: 'Dec 20, 2023',
    lastUpdated: 'Feb 5, 2024',
    nextBilling: 'Mar 1, 2024',
    storage: { used: 1.8, total: 5, percentage: 36 },
    bandwidth: { used: 28, total: 50, percentage: 56 },
    billingCycle: 'Monthly',
    paymentStatus: 'Paid',
  },
  '3': {
    id: '3',
    domainName: 'suspicious-site.cms.com',
    owner: 'Unknown User',
    email: 'unknown@email.com',
    status: 'Flagged',
    plan: 'Free',
    domainType: 'Subdomain',
    createdDate: 'Feb 1, 2024',
    lastUpdated: 'Feb 3, 2024',
    nextBilling: 'N/A',
    storage: { used: 0.5, total: 1, percentage: 50 },
    bandwidth: { used: 8, total: 10, percentage: 80 },
    billingCycle: 'Free Plan',
    paymentStatus: 'Paid',
  },
};

export default function ManageWebsite(): React.ReactElement {
  const searchParams = useSearchParams();
  const websiteId = searchParams.get('id') ?? '1';
  
  // Get website details from database, fallback to first website
  const website = websiteDatabase[websiteId] ?? websiteDatabase['1'];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full p-6 lg:p-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Website</h1>
                <p className="text-gray-600 mt-1">{website.domainName}</p>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium">
                  View Website
                </button>
                <button className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium">
                  Suspend
                </button>
              </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Website Overview */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Website Overview</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Owner</p>
                      <p className="text-base font-semibold text-gray-900">{website.owner}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="text-base font-semibold text-gray-900">{website.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        website.status === 'Live' ? 'bg-green-100 text-green-800' :
                        website.status === 'Flagged' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {website.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Plan</p>
                      <p className="text-base font-semibold text-gray-900">{website.plan} Plan</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Domain Type</p>
                      <p className="text-base font-semibold text-gray-900">{website.domainType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Created</p>
                      <p className="text-base font-semibold text-gray-900">{website.createdDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                      <p className="text-base font-semibold text-gray-900">{website.lastUpdated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Next Billing</p>
                      <p className="text-base font-semibold text-gray-900">{website.nextBilling}</p>
                    </div>
                  </div>
                </div>

                {/* Usage Monitoring */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Usage Monitoring</h2>
                  <div className="space-y-6">
                    {/* Storage Used */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-gray-700">Storage Used</label>
                        <span className="text-sm font-semibold text-gray-900">{website.storage.used}GB / {website.storage.total}GB</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${website.storage.percentage}%` } as React.CSSProperties}
                        />
                      </div>
                    </div>

                    {/* Bandwidth Used */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-gray-700">Bandwidth Used</label>
                        <span className="text-sm font-semibold text-gray-900">{website.bandwidth.used}GB / {website.bandwidth.total}GB</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${website.bandwidth.percentage}%` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan & Billing */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Plan & Billing</h2>
                    <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shrink-0">
                      Change Plan
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                      <p className="text-base font-semibold text-gray-900">{website.plan} Plan</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Billing Cycle</p>
                      <p className="text-base font-semibold text-gray-900">{website.billingCycle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        website.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                        website.paymentStatus === 'Failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {website.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start py-3 border-b border-gray-200">
                      <p className="text-gray-700 text-sm">Website updated homepage layout</p>
                      <span className="text-sm text-gray-500 ml-2 flex-shrink-0">Feb 11, 2026</span>
                    </div>
                    <div className="flex justify-between items-start py-3 border-b border-gray-200">
                      <p className="text-gray-700 text-sm">Plan upgraded from Basic to Pro</p>
                      <span className="text-sm text-gray-500 ml-2 flex-shrink-0">Feb 05, 2026</span>
                    </div>
                    <div className="flex justify-between items-start py-3">
                      <p className="text-gray-700 text-sm">Domain connected successfully</p>
                      <span className="text-sm text-gray-500 ml-2 flex-shrink-0">Jan 30, 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
