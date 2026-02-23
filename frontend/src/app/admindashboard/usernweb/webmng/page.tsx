'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback, Suspense } from 'react';
import { AdminSidebar } from '../../components/sidebar';
import { AdminHeader } from '../../components/header';
import { setClientDomainStatus } from '@/lib/api';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'cms.com';

function getViewWebsiteUrl(domainName: string): string {
  if (!domainName || domainName === '—') return '#';
  const subdomain = domainName.split('.')[0]?.trim().toLowerCase() || '';
  if (!subdomain) return '#';
  if (typeof window !== 'undefined' && (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))) {
    const port = window.location.port || '3000';
    return `http://${subdomain}.localhost:${port}`;
  }
  return `https://${subdomain}.${BASE_DOMAIN}`;
}

function ManageWebsiteContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  const userId = searchParams.get('userId') ?? '';
  const domainName = searchParams.get('domainName') ?? '';
  const owner = searchParams.get('owner') ?? '';
  const planParam = searchParams.get('plan') ?? 'Free';

  const [status, setStatus] = useState(searchParams.get('status') ?? 'Live');
  const [suspending, setSuspending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const viewUrl = getViewWebsiteUrl(domainName);
  const isSuspended = status.toLowerCase() === 'suspended';

  const handleViewWebsite = useCallback(() => {
    if (viewUrl && viewUrl !== '#') window.open(viewUrl, '_blank', 'noopener,noreferrer');
  }, [viewUrl]);

  const handleSuspend = useCallback(async () => {
    if (!userId || !id) {
      setToast('Missing domain or user.');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSuspending(true);
    try {
      const res = await setClientDomainStatus(userId, id, 'suspended');
      if (res.success) {
        setStatus('Suspended');
        setToast('Website suspended.');
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(res.message ?? 'Failed to suspend');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to suspend');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSuspending(false);
    }
  }, [userId, id]);

  const handleReactivate = useCallback(async () => {
    if (!userId || !id) return;
    setSuspending(true);
    try {
      const res = await setClientDomainStatus(userId, id, 'published');
      if (res.success) {
        setStatus('Live');
        setToast('Website reactivated.');
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(res.message ?? 'Failed to reactivate');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to reactivate');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSuspending(false);
    }
  }, [userId, id]);

  if (!id && !domainName) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-gray-600 mb-4">No website selected.</p>
              <button
                onClick={() => router.push('/admindashboard/usernweb')}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Back to Domain Management
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full p-6 lg:p-8">
            {toast && (
              <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
                {toast}
              </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Website</h1>
                <p className="text-gray-600 mt-1">{domainName || '—'}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleViewWebsite}
                  disabled={!viewUrl || viewUrl === '#'}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  View Website
                </button>
                {isSuspended ? (
                  <button
                    onClick={handleReactivate}
                    disabled={suspending}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
                  >
                    {suspending ? 'Updating…' : 'Reactivate'}
                  </button>
                ) : (
                  <button
                    onClick={handleSuspend}
                    disabled={suspending}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
                  >
                    {suspending ? 'Suspending…' : 'Suspend'}
                  </button>
                )}
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
                      <p className="text-base font-semibold text-gray-900">{owner || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Domain</p>
                      <p className="text-base font-semibold text-gray-900">{domainName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        status === 'Live' || status === 'published' ? 'bg-green-100 text-green-800' :
                        status === 'Suspended' || status === 'suspended' ? 'bg-red-100 text-red-800' :
                        status === 'Flagged' || status === 'flagged' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status === 'published' || status === 'Live' ? 'Live' : status === 'suspended' || status === 'Suspended' ? 'Suspended' : status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Plan</p>
                      <p className="text-base font-semibold text-gray-900">{planParam} Plan</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Domain Type</p>
                      <p className="text-base font-semibold text-gray-900">Subdomain</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Actions</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Use &quot;View Website&quot; to open the published site in a new tab. Use &quot;Suspend&quot; to disable the site, or &quot;Reactivate&quot; to bring it back.
                  </p>
                  <button
                    onClick={() => router.push('/admindashboard/usernweb')}
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    ← Back to Domain Management
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ManageWebsite(): React.ReactElement {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ManageWebsiteContent />
    </Suspense>
  );
}
