'use client';

import dynamic from 'next/dynamic';

const MainDashboardPageContent = dynamic(
  () => import('./components/MainDashboardPageContent'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F4FF]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#B13BFF] border-t-transparent"></div>
      </div>
    )
  }
);

export default function AdminDashboardPage() {
  return <MainDashboardPageContent />;
}
