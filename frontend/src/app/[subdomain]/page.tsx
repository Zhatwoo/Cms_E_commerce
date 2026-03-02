'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';
import { LiveSite } from '@/app/design/_lib/webRenderer';
import { serializeCraftToClean } from '@/app/design/_lib/serializer';

const RESERVED_SUBDOMAINS = new Set([
  'site', 'm_dashboard', 'design', 'auth', 'admindashboard', 'landing', 'templates',
  'api', '_next', 'favicon.ico', 'admin', 'login', 'register', 'signup',
]);

export default function SubdomainSitePage() {
  const params = useParams();
  const subdomain = typeof params.subdomain === 'string' ? params.subdomain : null;
  const [rawJson, setRawJson] = useState<string | null>(null);
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
        const base = getApiUrl();
        const res = await fetch(`${base}/api/public/sites/${encodeURIComponent(normalized)}`, {
          credentials: 'omit',
        });
        const data = await res.json().catch(() => ({} as Record<string, unknown>));
        if (cancelled) return;
        if (!res.ok || !(data as { success?: boolean }).success) {
          setError(true);
          setLoading(false);
          return;
        }
        const content = (data as { data?: { content?: unknown } }).data?.content;
        if (content) {
          const serializedContent = typeof content === 'object' ? JSON.stringify(content) : String(content);
          setRawJson(serializedContent);
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

  const cleanDoc = useMemo(() => {
    if (!rawJson) return null;
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed.version !== undefined && parsed.pages && parsed.nodes) return parsed;
      return serializeCraftToClean(rawJson);
    } catch {
      return null;
    }
  }, [rawJson]);

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
      <LiveSite doc={cleanDoc} pageIndex={0} mobileBreakpoint={480} />
    </div>
  );
}
