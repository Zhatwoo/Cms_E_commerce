'use client';

import React, { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { WebPreview } from '@/app/design/_lib/webRenderer';
import { parseContentToCleanDoc } from '@/app/design/_lib/contentParser';
import { PREVIEW_MOBILE_BREAKPOINT } from '@/app/design/_lib/viewportConstants';
import type { BuilderDocument } from '@/app/design/_types/schema';

const RESERVED_SUBDOMAINS = new Set([
  'site', 'm_dashboard', 'design', 'auth', 'admindashboard', 'landing', 'templates',
  'api', '_next', 'favicon.ico', 'admin', 'login', 'register', 'signup',
]);

export default function SubdomainSitePage() {
  const params = useParams();
  const subdomain = typeof params.subdomain === 'string' ? params.subdomain : null;
  const [cleanDoc, setCleanDoc] = useState<BuilderDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!subdomain) {
      setLoading(false);
      setError(true);
      return;
    }
    const normalized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!normalized || RESERVED_SUBDOMAINS.has(normalized)) {
      setLoading(false);
      setError(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ success?: boolean; data?: { content?: unknown } }>(
          `/api/public/sites/${encodeURIComponent(normalized)}?t=${Date.now()}`,
          { method: 'GET' }
        );
        if (cancelled) return;
        if (!data?.success) {
          setError(true);
          setLoading(false);
          return;
        }
        const content = data?.data?.content;
        const parsed = parseContentToCleanDoc(content);
        if (parsed) {
          setCleanDoc(parsed);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [subdomain]);

  if (!subdomain) {
    notFound();
    return null;
  }

  const normalized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (RESERVED_SUBDOMAINS.has(normalized)) {
    notFound();
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (error || !cleanDoc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-100 text-zinc-700 gap-4 px-4">
        <p className="text-lg">No site at this address.</p>
        <p className="text-sm text-zinc-500">
          This site may not be published yet.
        </p>
        <Link href="/m_dashboard/domains" className="text-sm text-blue-600 hover:underline">
          ← Back to Domains
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <WebPreview doc={cleanDoc} pageIndex={0} mobileBreakpoint={PREVIEW_MOBILE_BREAKPOINT} enableFormInputs builderParityMode />
    </div>
  );
}
