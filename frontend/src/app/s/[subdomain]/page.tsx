'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProjectBySubdomain } from '@/lib/api';
import { getDraft } from '@/app/design/_lib/pageApi';
import { WebPreview } from '@/app/design/_lib/webRenderer';
import { serializeCraftToClean } from '@/app/design/_lib/serializer';

export default function SubdomainSitePage() {
  const params = useParams();
  const subdomain = typeof params.subdomain === 'string' ? params.subdomain : null;
  const [projectId, setProjectId] = useState<string | null>(null);
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
    if (!normalized) {
      setLoading(false);
      setError(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getProjectBySubdomain(normalized);
        if (cancelled) return;
        if (!res.success || !res.project?.id) {
          setError(true);
          setLoading(false);
          return;
        }
        setProjectId(res.project.id);
        const result = await getDraft(res.project.id);
        if (cancelled) return;
        if (result.success && result.data?.content) {
          const content = result.data.content;
          setRawJson(typeof content === 'object' ? JSON.stringify(content) : content);
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-100 text-zinc-700 gap-4 px-4">
        <p className="text-lg">No site specified.</p>
        <Link href="/m_dashboard/domains" className="text-sm text-blue-600 hover:underline">← Back to Domains</Link>
      </div>
    );
  }

  if (loading || !projectId) {
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
        <p className="text-sm text-zinc-500">Make sure the project has a subdomain set (in Web Builder or project settings) and you’re logged in.</p>
        <Link href="/m_dashboard/domains" className="text-sm text-blue-600 hover:underline">← Back to Domains</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <WebPreview doc={cleanDoc} pageIndex={0} />
    </div>
  );
}
