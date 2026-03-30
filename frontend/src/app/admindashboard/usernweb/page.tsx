'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import { UserManagement } from './components/userManange';
import { WebManagement } from './components/webManage';
import { useAdminLoading } from '../components/LoadingProvider';

type TabId = 'clients' | 'domains';

const UserWebsiteManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { startLoading } = useAdminLoading();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const activeTab: TabId = useMemo(() => (urlTab === 'domains' ? 'domains' : 'clients'), [urlTab]);

  const handleTabToggle = (tab: TabId) => {
    if (tab === activeTab) return;
    startLoading();
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
              <div className="ml-auto flex gap-1 rounded-xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] p-1 relative">
                <button
                  type="button"
                  onClick={() => handleTabToggle('clients')}
                  className={`relative z-10 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === 'clients' ? 'text-[#471396]' : 'text-[#6F657E] hover:text-[#471396]'
                  }`}
                >
                  {activeTab === 'clients' && (
                    <motion.div
                      layoutId="userWebTabBackground"
                      className="absolute inset-0 rounded-lg bg-[#FFCC00] shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">Clients</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabToggle('domains')}
                  className={`relative z-10 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === 'domains' ? 'text-[#471396]' : 'text-[#6F657E] hover:text-[#471396]'
                  }`}
                >
                  {activeTab === 'domains' && (
                    <motion.div
                      layoutId="userWebTabBackground"
                      className="absolute inset-0 rounded-lg bg-[#FFCC00] shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">Websites</span>
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
