'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useAdminLoading } from "../../components/LoadingProvider";
import { AdminPageHero } from '../../components/AdminPageHero';

const AdminSidebar = dynamic(() => import('../../components/sidebar'), { ssr: false }) as any;
const AdminHeader = dynamic(() => import('../../components/header'), { ssr: false }) as any;
const UserManagement = dynamic(() => import('./userManange').then(mod => mod.UserManagement), { ssr: false }) as any;
const WebManagement = dynamic(() => import('./webManage').then(mod => mod.WebManagement), { ssr: false }) as any;


type TabId = 'clients' | 'domains';

export default function UserWebsiteManagementContent() {
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
            <AdminPageHero
              title="User & Website Management"
              subtitle="Oversee all user accounts and published websites."
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="ml-auto flex gap-1 rounded-xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] p-1 relative">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => handleTabToggle('clients')}
                  className={`relative z-10 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === 'clients' ? 'text-white' : 'text-[#6F657E] hover:text-[#471396]'
                  }`}
                >
                  {activeTab === 'clients' && (
                    <motion.div
                      layoutId="userWebTabBackground"
                      className="absolute inset-0 rounded-lg bg-[#B13BFF] shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">Clients</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => handleTabToggle('domains')}
                  className={`relative z-10 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === 'domains' ? 'text-white' : 'text-[#6F657E] hover:text-[#471396]'
                  }`}
                >
                  {activeTab === 'domains' && (
                    <motion.div
                      layoutId="userWebTabBackground"
                      className="absolute inset-0 rounded-lg bg-[#B13BFF] shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">Websites</span>
                </motion.button>
              </div>
            </motion.div>

            <div>
              <AnimatePresence mode="wait">
                {activeTab === 'clients' && <UserManagement key="clients" />}
                {activeTab === 'domains' && <WebManagement key="domains" />}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
