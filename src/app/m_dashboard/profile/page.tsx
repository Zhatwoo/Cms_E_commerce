'use client';

/**
 * ============================================================================
 * Profile Page Redirect
 * ============================================================================
 *
 * Purpose of this File:
 * This is a simple redirect page that automatically routes users to the
 * settings page where profile information can be managed.
 *
 * What this Component Does:
 * - Checks for router availability
 * - Redirects to /m_dashboard/settings on mount
 * - Renders null during redirect
 *
 * ============================================================================
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/m_dashboard/settings');
  }, [router]);

  return null;
}
