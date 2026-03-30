'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import BuiltInTemplates from './components/BuiltInTemplates';
import UserTemplates from './components/UserTemplates';
import { useAdminLoading } from '../components/LoadingProvider';

interface Template {
  id: string;
  name: string;
  category: string;
  username?: string;
  domainName?: string;
  thumbnail: string;
}

const SearchIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function TemplatesAssetsPage() {
  const { startLoading } = useAdminLoading();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeTab = useMemo<'builtin' | 'user'>(() => {
    const tab = searchParams.get('tab');
    return tab === 'user' ? 'user' : 'builtin';
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (tab: 'builtin' | 'user') => {
    if (tab === activeTab) return;
    startLoading();
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/admindashboard/templatesnassets?${params.toString()}`, { scroll: false });
  };

  const builtInTemplates: Template[] = [];

  const userTemplates: Template[] = [];

  const filteredBuiltInTemplates = builtInTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUserTemplates = userTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.domainName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-dashboard-shell flex h-screen overflow-hidden" suppressHydrationWarning>
      <AdminSidebar forcedActiveItemId="templates" forcedActiveChildId={activeTab === 'builtin' ? 'builtin-templates' : 'user-templates'} />

      <AnimatePresence>
        {sidebarOpen && (
          <div className="lg:hidden">
            <AdminSidebar
              mobile
              onClose={() => setSidebarOpen(false)}
              forcedActiveItemId="templates"
              forcedActiveChildId={activeTab === 'builtin' ? 'builtin-templates' : 'user-templates'}
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
              <h1 className="mb-2 text-3xl font-bold text-[#B13BFF] sm:text-4xl">Templates &amp; Assets</h1>
              <p className="text-sm font-medium text-[#A78BFA]">Templates &amp; Assets</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="relative flex-1 min-w-[17rem]">
                <input
                  type="text"
                  placeholder="Search templates or assets"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  suppressHydrationWarning
                  className="admin-dashboard-panel-soft h-12 w-full rounded-2xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] pl-12 pr-4 text-sm font-medium text-[#471396] outline-none placeholder:text-[#82788F]"
                />
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2">
                   <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFCC00] text-[#471396] shadow-sm">
                      <SearchIcon className="h-5 w-5" />
                   </div>
                </div>
              </div>

              <div className="ml-auto flex gap-1 rounded-xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] p-1 relative">
                <button
                  type="button"
                  onClick={() => handleTabChange('builtin')}
                  className={`relative z-10 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === 'builtin' ? 'text-[#471396]' : 'text-[#6F657E] hover:text-[#471396]'
                  }`}
                >
                  {activeTab === 'builtin' && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 rounded-lg bg-[#FFCC00] shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">Built-in Templates</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('user')}
                  className={`relative z-10 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === 'user' ? 'text-[#471396]' : 'text-[#6F657E] hover:text-[#471396]'
                  }`}
                >
                  {activeTab === 'user' && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 rounded-lg bg-[#FFCC00] shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">User Templates</span>
                </button>
              </div>
            </motion.div>

            <div>
              <AnimatePresence mode="wait">
                {activeTab === 'builtin' && <BuiltInTemplates templates={filteredBuiltInTemplates} />}
                {activeTab === 'user' && <UserTemplates templates={filteredUserTemplates} />}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
