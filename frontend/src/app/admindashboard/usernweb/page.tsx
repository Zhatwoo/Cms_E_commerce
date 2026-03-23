'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  const activeTab: TabId = useMemo(() => (urlTab === 'domains' ? 'domains' : 'clients'), [urlTab]);

  const handleTabToggle = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/admindashboard/usernweb?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="admin-dashboard-shell flex h-screen overflow-hidden" suppressHydrationWarning>
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
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-6 p-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <h1 className="mb-2 text-3xl font-bold text-[#B13BFF] sm:text-4xl">User &amp; Website Management</h1>
              <p className="text-sm font-medium text-[#A78BFA]">Oversee all user accounts and published websites</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="ml-auto flex gap-1 rounded-xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] p-1">
                <button
                  type="button"
                  onClick={() => handleTabToggle('clients')}
                  className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
                    activeTab === 'clients'
                      ? 'bg-[#FFCC00] text-[#471396] shadow-sm'
                      : 'text-[#6F657E] hover:text-[#471396]'
                  }`}
                >
                  Clients
                </button>
                <button
                  type="button"
                  onClick={() => handleTabToggle('domains')}
                  className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
                    activeTab === 'domains'
                      ? 'bg-[#FFCC00] text-[#471396] shadow-sm'
                      : 'text-[#6F657E] hover:text-[#471396]'
                  }`}
                >
                  Websites
                </button>
              </div>
            </motion.div>

            <div>
              <AnimatePresence mode="wait">
                {activeTab === 'clients' && <UserManagement />}
                {activeTab === 'domains' && <WebManagement />}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserWebsiteManagement;
