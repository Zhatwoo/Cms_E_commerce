'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WebPreview } from '@/app/design/_lib/webRenderer';
import { serializeCraftToClean } from '@/app/design/_lib/serializer';
import type { BuilderDocument } from '@/app/design/_types/schema';
import { getApiUrl } from '@/lib/api';

export default function PublicSitePage() {
  const params = useParams();
  const subdomain = (params?.subdomain as string) || '';
  const [doc, setDoc] = useState<BuilderDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subdomain || typeof subdomain !== 'string') {
      setLoading(false);
      setError('Invalid subdomain');
      return;
    }
    const normalized = subdomain.trim().toLowerCase();
    if (!normalized) {
      setLoading(false);
      setError('Invalid subdomain');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const base = getApiUrl();
        const res = await fetch(`${base}/api/public/sites/${encodeURIComponent(normalized)}`, {
          credentials: 'omit',
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          const msg = (data as { message?: string }).message || 'Site not found';
          setError(msg === 'Route not found' ? 'Backend not ready. Restart the backend server and try again.' : msg);
          setLoading(false);
          return;
        }
        const content = data?.data?.content;
        if (!content) {
          setError('No content yet');
          setLoading(false);
          return;
        }
        let clean: BuilderDocument | null = null;
        try {
          if (typeof content === 'object' && content.version !== undefined && content.pages && content.nodes) {
            clean = content as BuilderDocument;
          } else {
            clean = serializeCraftToClean(typeof content === 'string' ? content : JSON.stringify(content));
          }
        } catch {
          setError('Invalid content');
          setLoading(false);
          return;
        }
        setDoc(clean);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load site');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [subdomain]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="text-zinc-500">Loading…</div>
      </div>
    );
  }
  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="text-zinc-700 text-center">
          <p className="font-medium">{error || 'Site not found'}</p>
          <p className="text-sm mt-1 text-zinc-500">This site may not be published yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-8">
      <WebPreview doc={doc} pageIndex={0} />
    </div>
  );
}
