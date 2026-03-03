'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LiveSite } from '@/app/design/_lib/webRenderer';
import { serializeCraftToClean } from '@/app/design/_lib/serializer';
import type { BuilderDocument } from '@/app/design/_types/schema';
import { apiFetch } from '@/lib/api';
import { StorefrontProvider, useStorefront } from '@/app/sites/_storefront/StorefrontContext';
import { CartDrawer } from '@/app/sites/_storefront/CartDrawer';
import type { StorefrontProduct } from '@/app/sites/_storefront/StorefrontProducts';

function parsePublishedContentToCleanDoc(content: unknown): BuilderDocument | null {
  if (content == null) return null;

  try {
    let normalized: unknown = content;

    for (let i = 0; i < 2; i += 1) {
      if (typeof normalized !== 'string') break;
      const trimmed = normalized.trim();
      if (!trimmed) return null;
      try {
        normalized = JSON.parse(trimmed);
      } catch {
        break;
      }
    }

    if (
      normalized &&
      typeof normalized === 'object' &&
      'version' in normalized &&
      'pages' in normalized &&
      'nodes' in normalized
    ) {
      return normalized as BuilderDocument;
    }

    const raw = typeof normalized === 'string' ? normalized : JSON.stringify(normalized);
    return serializeCraftToClean(raw);
  } catch {
    return null;
  }
}

function CartFab() {
  const { cartCount, openCart } = useStorefront();
  return (
    <button
      type="button"
      onClick={openCart}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-white shadow-lg hover:bg-emerald-600 transition-colors"
      aria-label={`Open cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {cartCount > 0 && (
        <span className="text-sm font-semibold">{cartCount}</span>
      )}
    </button>
  );
}

function PublicSiteContent() {
  const params = useParams();
  const { setSiteTitle, addToCart } = useStorefront();
  const subdomain = (params?.subdomain as string) || '';
  const [doc, setDoc] = useState<BuilderDocument | null>(null);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
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
        const data = await apiFetch<{
          success?: boolean;
          message?: string;
          projectTitle?: string;
          data?: { content?: unknown };
        }>(`/api/public/sites/${encodeURIComponent(normalized)}?t=${Date.now()}`, {
          method: 'GET',
        });
        if (cancelled) return;
        const content = data?.data?.content;
        if (data?.projectTitle) setSiteTitle(data.projectTitle as string);
        if (!content) {
          setError('No content yet');
          setLoading(false);
          return;
        }
        const clean = parsePublishedContentToCleanDoc(content);
        if (!clean) {
          setError('Invalid content');
          setLoading(false);
          return;
        }
        setDoc(clean);
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Failed to load site';
          if (message.includes('Backend is unreachable') || message.includes('Failed to fetch')) {
            setError('Backend not reachable. Start the backend server and try again.');
          } else {
            setError(message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [subdomain, setSiteTitle]);

  useEffect(() => {
    if (!subdomain || typeof subdomain !== 'string') return;
    const normalized = subdomain.trim().toLowerCase();
    if (!normalized) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ success?: boolean; data?: StorefrontProduct[] }>(
          `/api/public/sites/${encodeURIComponent(normalized)}/products?t=${Date.now()}`,
          { method: 'GET' }
        );
        if (cancelled) return;
        if (data?.success && Array.isArray(data?.data)) {
          setProducts(data.data);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [subdomain]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }
  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-zinc-700 text-center">
          <p className="font-medium">{error || 'Site not found'}</p>
          <p className="text-sm mt-1 text-zinc-500">This site may not be published yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LiveSite
        doc={doc}
        pageIndex={0}
        mobileBreakpoint={900}
        enableFormInputs
        storeContext={{ products, addToCart }}
      />
      <CartFab />
      <CartDrawer />
    </>
  );
}

export default function PublicSitePage() {
  const params = useParams();
  const subdomain = (params?.subdomain as string)?.trim().toLowerCase() || '';

  if (!subdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-700">
        Invalid subdomain
      </div>
    );
  }

  return (
    <StorefrontProvider subdomain={subdomain} siteTitle={null}>
      <PublicSiteContent />
    </StorefrontProvider>
  );
}
