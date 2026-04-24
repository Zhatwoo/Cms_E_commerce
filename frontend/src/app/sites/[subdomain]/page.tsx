'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getSubdomainSiteUrl } from '@/lib/siteUrls';
import { LiveSite } from '@/app/design/_lib/webRenderer';
import { parseContentToCleanDoc } from '@/app/design/_lib/contentParser';
import { PREVIEW_TABLET_BREAKPOINT } from '@/app/design/_lib/viewportConstants';
import type { BuilderDocument } from '@/app/design/_types/schema';
import { apiFetch } from '@/lib/api';
import { StorefrontProvider, useStorefront } from '@/app/sites/_storefront/StorefrontContext';
import { CartDrawer } from '@/app/sites/_storefront/CartDrawer';
import type { StorefrontProduct } from '@/app/sites/_storefront/StorefrontProducts';
import { StorefrontRenderBoundary } from '@/app/sites/_storefront/StorefrontRenderBoundary';
import { CartFab } from '@/app/sites/_storefront/CartFab';


function PublicSiteContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { setSiteTitle, addToCart } = useStorefront();
  const subdomain = (params?.subdomain as string) || '';
  const requestedPageSlug = (searchParams?.get('page') || '').trim().toLowerCase();
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window === 'undefined' ? 1440 : window.innerWidth
  );
  const [doc, setDoc] = useState<BuilderDocument | null>(null);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);



  useEffect(() => {
    if (typeof window === 'undefined' || !subdomain) return;
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      const subdomainUrl = getSubdomainSiteUrl(subdomain, window.location.origin);
      if (subdomainUrl && subdomainUrl !== '#' && !subdomainUrl.includes('/sites/')) {
        window.location.replace(subdomainUrl);
        return;
      }
    }
  }, [subdomain]);

  const storefrontContext = React.useMemo(
    () => (products.length > 0 ? { products, addToCart } : null),
    [products, addToCart]
  );

  const selectedPageIndex = React.useMemo(() => {
    if (!doc?.pages?.length) return 0;
    const storedHomeSlug = typeof (doc as unknown as { homePageSlug?: unknown }).homePageSlug === 'string'
      ? ((doc as unknown as { homePageSlug?: string }).homePageSlug || '').trim().toLowerCase()
      : '';
    const effectiveSlug = requestedPageSlug || storedHomeSlug;
    if (!effectiveSlug) return 0;
    const idx = doc.pages.findIndex((page, index) => {
      const slug = (page?.slug as string | undefined)?.trim().toLowerCase() || `page-${index}`;
      return slug === effectiveSlug;
    });
    return idx >= 0 ? idx : 0;
  }, [doc, requestedPageSlug]);

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
        const title = data?.projectTitle;
        if (title) {
          setSiteTitle(title as string);
          if (typeof document !== 'undefined') document.title = String(title);
        }
        if (!content) {
          setError('No content yet');
          setLoading(false);
          return;
        }
        let clean = parseContentToCleanDoc(content);
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
    <StorefrontRenderBoundary>
      <>
        <LiveSite
          doc={doc}
          pageIndex={selectedPageIndex}
          mobileBreakpoint={PREVIEW_TABLET_BREAKPOINT}
          enableFormInputs
          storeContext={storefrontContext}
        />
        {storefrontContext ? <CartFab /> : null}
        {storefrontContext ? <CartDrawer /> : null}
      </>
    </StorefrontRenderBoundary>
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
