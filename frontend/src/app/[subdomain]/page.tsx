'use client';

import React, { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { LiveSite } from '@/app/design/_lib/webRenderer';
import { parseContentToCleanDoc } from '@/app/design/_lib/contentParser';
import { migratePublishedContent } from '@/app/design/_lib/contentMigration';
import { PREVIEW_MOBILE_BREAKPOINT } from '@/app/design/_lib/viewportConstants';
import type { BuilderDocument } from '@/app/design/_types/schema';
import { StorefrontProvider, useStorefront } from '@/app/sites/_storefront/StorefrontContext';
import { CartDrawer } from '@/app/sites/_storefront/CartDrawer';
import type { StorefrontProduct } from '@/app/sites/_storefront/StorefrontProducts';
import { StorefrontRenderBoundary } from '@/app/sites/_storefront/StorefrontRenderBoundary';

const RESERVED_SUBDOMAINS = new Set([
  'sites', 'site', 's', 'm_dashboard', 'design', 'auth', 'admindashboard', 'landing', 'templates',
  'api', '_next', 'favicon.ico', 'admin', 'login', 'register', 'signup',
]);

function CartFab() {
  const { cartCount, openCart, lastAddedAt } = useStorefront();
  const [toastVisible, setToastVisible] = useState(false);
  const [fabPulse, setFabPulse] = useState(false);
  useEffect(() => {
    if (!lastAddedAt) return;
    setToastVisible(true);
    setFabPulse(true);
    const t1 = setTimeout(() => setFabPulse(false), 420);
    const t2 = setTimeout(() => setToastVisible(false), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [lastAddedAt]);
  return (
    <>
      {toastVisible && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[45] pointer-events-none rounded-2xl bg-black/50 text-white px-12 py-9 shadow-2xl flex flex-col items-center text-center animate-[fadeIn_0.2s_ease-out]" aria-hidden>
          <span className="text-xl font-semibold">Item has been added to your cart</span>
          <svg className="w-10 h-10 mt-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        </div>
      )}
      <button type="button" onClick={openCart} className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-white shadow-lg hover:bg-emerald-600 transition-all ${fabPulse ? 'scale-110' : 'scale-100'}`} aria-label={`Open cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        {cartCount > 0 && <span className="text-sm font-semibold">{cartCount}</span>}
      </button>
    </>
  );
}

function SubdomainContent() {
  const params = useParams();
  const { setSiteTitle, addToCart } = useStorefront();
  const subdomain = typeof params.subdomain === 'string' ? params.subdomain : null;
  const [doc, setDoc] = useState<BuilderDocument | null>(null);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!subdomain) { setLoading(false); setError(true); return; }
    const normalized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!normalized || RESERVED_SUBDOMAINS.has(normalized)) { setLoading(false); setError(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ success?: boolean; data?: { content?: unknown }; projectTitle?: string }>(
          `/api/public/sites/${encodeURIComponent(normalized)}?t=${Date.now()}`, { method: 'GET' }
        );
        if (cancelled) return;
        if (!data?.success) { setError(true); setLoading(false); return; }
        if (data?.projectTitle) setSiteTitle(data.projectTitle as string);
        const content = data?.data?.content;
        let parsed = parseContentToCleanDoc(content);
        if (parsed) {
          parsed = migratePublishedContent(parsed) as BuilderDocument;
          setDoc(parsed);
        } else setError(true);
      } catch { if (!cancelled) setError(true); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [subdomain, setSiteTitle]);

  useEffect(() => {
    if (!subdomain) return;
    const normalized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!normalized) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ success?: boolean; data?: StorefrontProduct[] }>(
          `/api/public/sites/${encodeURIComponent(normalized)}/products?t=${Date.now()}`, { method: 'GET' }
        );
        if (cancelled) return;
        if (data?.success && Array.isArray(data?.data)) setProducts(data.data);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [subdomain]);

  if (!subdomain) return null;
  const normalized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (RESERVED_SUBDOMAINS.has(normalized)) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }
  if (error || !doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-100 text-zinc-700 gap-4 px-4">
        <p className="text-lg">No site at this address.</p>
        <p className="text-sm text-zinc-500">This site may not be published yet.</p>
        <Link href="/m_dashboard/domains" className="text-sm text-blue-600 hover:underline">← Back to Domains</Link>
      </div>
    );
  }

  return (
    <StorefrontRenderBoundary>
      <>
        <LiveSite doc={doc} pageIndex={0} mobileBreakpoint={PREVIEW_MOBILE_BREAKPOINT} enableFormInputs storeContext={{ products, addToCart }} />
        <CartFab />
        <CartDrawer />
      </>
    </StorefrontRenderBoundary>
  );
}

export default function SubdomainSitePage() {
  const params = useParams();
  const subdomain = typeof params.subdomain === 'string' ? params.subdomain : null;

  if (!subdomain) {
    notFound();
    return null;
  }
  const normalized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (RESERVED_SUBDOMAINS.has(normalized)) {
    notFound();
    return null;
  }

  return (
    <StorefrontProvider subdomain={normalized} siteTitle={null}>
      <SubdomainContent />
    </StorefrontProvider>
  );
}
