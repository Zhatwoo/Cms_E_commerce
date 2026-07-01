/**
 * ============================================================================
 * Web Builder Page Redirect
 * ============================================================================
 *
 * Purpose of this File:
 * This is a simple redirect page that automatically routes users to the
 * projects page for managing and building projects.
 *
 * What this Component Does:
 * - Redirects to /m_dashboard/projects on page load
 *
 * ============================================================================
 */

import { redirect } from 'next/navigation';

export default function WebBuilderRedirectPage() {
  redirect('/m_dashboard/projects');
}
