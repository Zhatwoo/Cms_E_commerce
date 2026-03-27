'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getMe, logout, setStoredUser } from '@/lib/api';

import { LoadingProvider } from './components/LoadingProvider';

function isAdminRole(role?: string): boolean {
  const normalized = (role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'super_admin';
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const currentQuery = searchParams.toString();
    const requestedPath = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    const safeNextPath = requestedPath.startsWith('/admindashboard') ? requestedPath : '/admindashboard';
    const loginWithNext = `/adminauth/login?next=${encodeURIComponent(safeNextPath)}`;

    const verifyAdminAccess = async () => {
      try {
        const res = await getMe();
        if (!isMounted) return;

        if (res.success && res.user && isAdminRole(res.user.role)) {
          setStoredUser(res.user);
          setIsAuthorized(true);
          return;
        }

        await logout();
        if (!isMounted) return;
        router.replace(loginWithNext);
      } catch {
        await logout();
        if (!isMounted) return;
        router.replace(loginWithNext);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    verifyAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname, router, searchParams]);

  // Real-time notifications connection
  useEffect(() => {
    if (isAuthorized) {
      const { getAdminSocket, disconnectAdminSocket } = require('@/lib/adminSocket');
      const { fetchSharedNotifications } = require('@/lib/notifications');
      
      console.log('[AdminLayout] Initializing real-time shared notifications...');
      getAdminSocket();
      fetchSharedNotifications();

      return () => {
        disconnectAdminSocket();
      };
    }
  }, [isAuthorized]);


  return (
    <LoadingProvider forceLoading={isChecking}>
      {isAuthorized ? children : null}
    </LoadingProvider>
  );
}