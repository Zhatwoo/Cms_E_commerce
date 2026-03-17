'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import { UserManagement } from './components/userManange';
import { WebManagement } from './components/webManage';

type TabId = 'clients' | 'domains';

const UserWebsiteManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const activeTab: TabId = urlTab === 'domains' ? 'domains' : 'clients';

  const handleTabToggle = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/admindashboard/usernweb?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="admin-dashboard-shell relative flex h-screen overflow-hidden" suppressHydrationWarning>
      <div className="relative z-10 flex h-screen w-full">
        <AdminSidebar
          forcedActiveItemId="management"
          forcedActiveChildId={activeTab === 'clients' ? 'user-management' : 'website-management'}
        />

        <AnimatePresence>
          {sidebarOpen && (
            <div className="lg:hidden">
              <AdminSidebar
                mobile
                onClose={() => setSidebarOpen(false)}
                forcedActiveItemId="management"
                forcedActiveChildId={activeTab === 'clients' ? 'user-management' : 'website-management'}
              />
            </div>
          )}
        </AnimatePresence>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="sticky top-0 z-30">
            <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
          </div>
          <main className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#B13BFF] mb-2">User &amp; Website Management</h1>
                <p className="text-[#A78BFA] mb-6">Oversee all user accounts and published websites</p>
              </div>

              {/* Tabs */}
              <div className="inline-flex gap-1.5 mb-8 rounded-[14px] border border-[#D7B5FF] bg-[#EEE7F7] shadow-[0_4px_12px_rgba(177,59,255,0.16)] p-1.5 w-fit">
                <button
                  onClick={() => handleTabToggle('clients')}
                  className={`px-6 py-2.5 text-[1.02rem] font-semibold rounded-[10px] transition-colors ${(
                    activeTab === 'clients'
                      ? 'bg-[#FFCC00] text-[#422C63] shadow-[0_3px_0_rgba(152,115,0,0.35)]'
                      : 'text-[#A59BB4] hover:text-[#8F84A0] hover:bg-white/60'
                  )}`}
                >
                  Client Management
                </button>
                <button
                  onClick={() => handleTabToggle('domains')}
                  className={`px-6 py-2.5 text-[1.02rem] font-semibold rounded-[10px] transition-colors ${(
                    activeTab === 'domains'
                      ? 'bg-[#FFCC00] text-[#422C63] shadow-[0_3px_0_rgba(152,115,0,0.35)]'
                      : 'text-[#A59BB4] hover:text-[#8F84A0] hover:bg-white/60'
                  )}`}
                >
                  Domain Management
                </button>
              </div>

              {activeTab === 'clients' && <UserManagement />}
              {activeTab === 'domains' && <WebManagement />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserWebsiteManagement;
