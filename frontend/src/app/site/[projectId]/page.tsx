'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getDraft } from '@/app/design/_lib/pageApi';
import { WebPreview } from '@/app/design/_lib/webRenderer';
import { serializeCraftToClean } from '@/app/design/_lib/serializer';

export default function SitePage() {
  const params = useParams();
  const projectId = typeof params.projectId === 'string' ? params.projectId : null;
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      setError(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await getDraft(projectId);
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
  }, [projectId]);

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

  if (!projectId || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 text-zinc-600">
        <p>Site not found or you don&apos;t have access.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (!cleanDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 text-zinc-600">
        <p>No content for this site yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <WebPreview doc={cleanDoc} pageIndex={0} />
    </div>
  );
}
