'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { getDomainsManagement, listProducts, type WebsiteManagementRow, type ApiProduct } from '@/lib/api';
import { ChevronDownIcon, SearchIcon } from '@/lib/icons/adminIcons';
import { getWebsiteStatusMeta } from '@/lib/utils/adminStatus';

const AdminSidebar = dynamic(() => import('../components/sidebar').then((mod) => mod.AdminSidebar), { ssr: false });
const AdminHeader = dynamic(() => import('../components/header').then((mod) => mod.AdminHeader), { ssr: false });

type MonitoringTab = 'websites' | 'products';

function normalize(value: string | null | undefined): string {
  return (value || '').toLowerCase().trim();
}

function isApprovedWebsite(status: string): boolean {
  const s = normalize(status);
  return s === 'published' || s === 'live' || s === 'active';
}

function isPendingWebsite(status: string): boolean {
  const s = normalize(status);
  return s === 'pending' || s === 'draft' || s === 'flagged' || s === 'review' || s === 'under review';
}

function isApprovedProduct(status: string): boolean {
  const s = normalize(status);
  return s === 'published' || s === 'approved' || s === 'active';
}

function isPendingProduct(status: string): boolean {
  const s = normalize(status);
  return s === 'pending' || s === 'draft' || s === 'for_approval' || s === 'review';
}

function formatMoney(value: number | undefined): string {
  if (typeof value !== 'number') return 'PHP 0.00';
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

function websiteViewUrl(domainName: string): string {
  if (!domainName || domainName === '---') return '#';
  const normalized = domainName.startsWith('http://') || domainName.startsWith('https://')
    ? domainName
    : `https://${domainName}`;
  return normalized;
}

function productIndustry(product: ApiProduct): string {
  return product.category || product.subcategory || product.subCategory || product.sub_category || 'General';
}

function chartBarHeightClass(value: number): string {
  if (value >= 4) return 'h-36';
  if (value >= 3) return 'h-28';
  if (value >= 2) return 'h-20';
  if (value >= 1) return 'h-14';
  return 'h-10';
}

function subdomainFromDomain(domainName: string): string {
  const clean = normalize(domainName);
  if (!clean) return '';
  if (clean.includes('.')) return clean.split('.')[0] || '';
  return clean;
}

const WEBSITE_CARD_IMAGE = '/images/template-saas.jpg';
const PRODUCT_CARD_IMAGE = '/images/template-fashion.jpg';

function MonitoringPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const urlSearch = searchParams.get('search') || '';
  const focusedProductId = searchParams.get('productId') || '';
  const [activeTab, setActiveTab] = useState<MonitoringTab>(() => (tabParam === 'products' ? 'products' : 'websites'));

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [websites, setWebsites] = useState<WebsiteManagementRow[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);

  useEffect(() => {
    setActiveTab(tabParam === 'products' ? 'products' : 'websites');
  }, [tabParam]);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const [domainRes, productRes] = await Promise.all([
          getDomainsManagement(),
          listProducts({ limit: 200 }),
        ]);

        if (cancelled) return;

        setWebsites(domainRes.success && Array.isArray(domainRes.data) ? domainRes.data : []);
        setProducts(productRes.success && Array.isArray(productRes.items) ? productRes.items : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const approvedWebsites = useMemo(() => websites.filter((w) => isApprovedWebsite(w.status)), [websites]);
  const approvedProducts = useMemo(() => {
    return products.filter((p) => isApprovedProduct(p.status || 'published'));
  }, [products]);

  const pendingWebsiteCount = useMemo(
    () => websites.filter((w) => isPendingWebsite(w.status)).length,
    [websites]
  );
  const pendingProductCount = useMemo(
    () => products.filter((p) => isPendingProduct(p.status || '')).length,
    [products]
  );

  const pendingTotal = pendingWebsiteCount + pendingProductCount;

  const filteredWebsites = useMemo(() => {
    const q = normalize(search);
    return approvedWebsites.filter((w) => {
      const matchSearch = !q || normalize(w.domainName).includes(q) || normalize(w.owner).includes(q);
      const matchStatus = !statusFilter || normalize(w.status) === statusFilter;
      const matchIndustry = !industryFilter || normalize(w.plan) === industryFilter;
      return matchSearch && matchStatus && matchIndustry;
    });
  }, [approvedWebsites, search, statusFilter, industryFilter]);

  const uniqueFilteredWebsites = useMemo(() => {
    const seen = new Set<string>();
    return filteredWebsites.filter((w) => {
      const key = `${w.userId}::${w.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredWebsites]);

  const filteredProducts = useMemo(() => {
    const q = normalize(search);
    return approvedProducts.filter(
      (p) => {
        const matchFocusedProduct = !focusedProductId || p.id === focusedProductId;
        const matchSearch = !q || normalize(p.name).includes(q) || normalize(p.sku).includes(q) || normalize(p.subdomain).includes(q);
        const matchStatus = !statusFilter || normalize(p.status) === statusFilter;
        const matchIndustry = !industryFilter || normalize(productIndustry(p)) === industryFilter;
        return matchFocusedProduct && matchSearch && matchStatus && matchIndustry;
      }
    );
  }, [approvedProducts, focusedProductId, search, statusFilter, industryFilter]);

  const industryOptions = useMemo(() => {
    const items = new Set<string>();
    products.forEach((p) => items.add(productIndustry(p)));
    websites.forEach((w) => {
      if (w.plan) items.add(w.plan);
    });
    return Array.from(items).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [products, websites]);

  const websiteIndustryByDomain = useMemo(() => {
    const bySubdomain = new Map<string, Record<string, number>>();

    products.forEach((product) => {
      const subdomain = normalize(product.subdomain);
      const industry = productIndustry(product);
      if (!subdomain || !industry) return;

      const bucket = bySubdomain.get(subdomain) ?? {};
      bucket[industry] = (bucket[industry] ?? 0) + 1;
      bySubdomain.set(subdomain, bucket);
    });

    const result = new Map<string, string>();
    approvedWebsites.forEach((website) => {
      const subdomain = subdomainFromDomain(website.domainName);
      const bucket = bySubdomain.get(subdomain);

      if (!bucket) {
        result.set(website.domainName, 'General');
        return;
      }

      const best = Object.entries(bucket).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
      result.set(website.domainName, best);
    });

    return result;
  }, [products, approvedWebsites]);

  const websiteChartData = useMemo(() => {
    const published = approvedWebsites.filter((w) => normalize(w.status) === 'published' || normalize(w.status) === 'live').length;
    const offline = approvedWebsites.filter((w) => normalize(w.status) === 'offline' || normalize(w.status) === 'suspended').length;
    const draft = websites.filter((w) => normalize(w.status) === 'draft' || normalize(w.status) === 'pending').length;
    return [
      { label: 'Published', value: published },
      { label: 'Offline', value: offline },
      { label: 'Draft', value: draft },
    ];
  }, [approvedWebsites, websites]);

  const handleTabChange = (tab: MonitoringTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.set('tab', tab);
      window.history.replaceState(null, '', `/admindashboard/monitoring?${nextParams.toString()}`);
    }
  };

  return (
    <div className="admin-dashboard-shell relative flex min-h-screen overflow-hidden" suppressHydrationWarning>
      <div className="relative z-10 flex min-h-screen w-full">
        <AdminSidebar
          forcedActiveItemId="monitoring"
          forcedActiveChildId={activeTab === 'websites' ? 'website-monitoring' : 'product-monitoring'}
        />

        <AnimatePresence>
          {sidebarOpen && (
            <div className="lg:hidden">
              <AdminSidebar
                mobile
                onClose={() => setSidebarOpen(false)}
                forcedActiveItemId="monitoring"
                forcedActiveChildId={activeTab === 'websites' ? 'website-monitoring' : 'product-monitoring'}
              />
            </div>
          )}
        </AnimatePresence>

        <div className="flex min-h-screen flex-1 flex-col">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            <div className="p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#B13BFF] mb-2">Website &amp; Product Monitoring</h1>
                <p className="text-[#A78BFA]">Website &amp; Product Monitoring</p>
              </div>

              <div className="mb-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  suppressHydrationWarning
                  className="h-12 w-12 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center shadow-sm"
                  aria-label="Search"
                >
                  <SearchIcon className="h-6 w-6" strokeWidth={2.3} />
                </button>

                <div className="w-full max-w-[320px]">
                  <input
                    type="text"
                    placeholder="Search name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    suppressHydrationWarning
                    className="w-full rounded-2xl border border-[#8A86A4] bg-[#F5F4FF] px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#B13BFF]"
                  />
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter monitoring items by status"
                    suppressHydrationWarning
                    className="appearance-none rounded-2xl border border-[#8A86A4] bg-[#F5F4FF] px-4 py-3 pr-10 text-sm text-[#605D78]"
                  >
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="live">Live</option>
                    <option value="active">Active</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#605D78]">
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    aria-label="Filter monitoring items by industry"
                    suppressHydrationWarning
                    className="appearance-none rounded-2xl border border-[#8A86A4] bg-[#F5F4FF] px-4 py-3 pr-10 text-sm text-[#605D78] min-w-[140px]"
                  >
                    <option value="">Industry</option>
                    {industryOptions.map((industry) => (
                      <option key={industry} value={normalize(industry)}>{industry}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#605D78]">
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/admindashboard/moderationCompliance')}
                  suppressHydrationWarning
                  className="relative h-14 w-14 rounded-full bg-[#F0EEF9] border border-[rgba(177,59,255,0.18)] flex items-center justify-center"
                  aria-label="Approval requests"
                >
                  <span className="inline-flex items-center justify-center text-[#A43DFF]">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5a2.121 2.121 0 013 3L8 18l-4 1 1-4 11.5-11.5z" />
                    </svg>
                  </span>
                  <span className="absolute -right-1 -top-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                    {pendingTotal}
                  </span>
                </button>

                <div className="ml-auto flex gap-1 rounded-xl border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] p-1">
                  <button
                    onClick={() => handleTabChange('websites')}
                    suppressHydrationWarning
                    className={`px-12 py-3 text-sm font-semibold rounded-lg transition-colors ${
                      activeTab === 'websites' ? 'bg-yellow-400 text-gray-900' : 'text-[#82788F] hover:bg-white/40'
                    }`}
                  >
                    Websites
                  </button>
                  <button
                    onClick={() => handleTabChange('products')}
                    suppressHydrationWarning
                    className={`px-12 py-3 text-sm font-semibold rounded-lg transition-colors ${
                      activeTab === 'products' ? 'bg-yellow-400 text-gray-900' : 'text-[#82788F] hover:bg-white/40'
                    }`}
                  >
                    Products
                  </button>
                </div>
              </div>

              {activeTab === 'websites' && (
                <div className="grid grid-cols-1 xl:grid-cols-[513px_minmax(0,1fr)] gap-3 items-start">
                  <div className="space-y-6">
                    <section className="rounded-[26px] border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] p-6 shadow-[0_8px_20px_rgba(177,59,255,0.14)]">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-4xl font-bold text-[#471396]">Total Websites</h3>
                        <span className="text-sm text-[#7F7A95]">View More</span>
                      </div>
                      <div className="h-44 rounded-lg bg-[linear-gradient(180deg,rgba(71,19,150,0.04),rgba(71,19,150,0.01))] p-4">
                        <div className="flex h-full items-end justify-between gap-4">
                          {websiteChartData.map((d, idx) => (
                            <div key={`${d.label}-${idx}`} className="flex w-full flex-col items-center gap-2">
                              <div className={`w-full rounded-t-md bg-[#8B80EC] ${chartBarHeightClass(d.value)}`} />
                              <span className="text-xs text-[#6E6884]">{d.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[26px] border border-[rgba(177,59,255,0.29)] bg-[#F5F4FF] p-6 shadow-[0_8px_20px_rgba(177,59,255,0.14)]">
                      <h3 className="mb-3 text-3xl font-bold text-[#471396] text-center">Flagged Issues</h3>
                      <div className="h-44 rounded-lg bg-[linear-gradient(180deg,rgba(71,19,150,0.04),rgba(71,19,150,0.01))] p-4">
                        <div className="flex h-full items-end justify-between gap-4">
                          {websiteChartData.map((d, idx) => (
                            <div key={`flagged-${d.label}-${idx}`} className="flex w-full flex-col items-center gap-2">
                              <div className={`w-full rounded-t-md bg-[#8B80EC] ${chartBarHeightClass(d.value)}`} />
                              <span className="text-xs text-[#6E6884]">{d.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="max-h-[calc(100vh-270px)] overflow-y-auto pr-2">
                    {loading ? (
                      <p className="text-sm text-[#82788F]">Loading approved websites...</p>
                    ) : uniqueFilteredWebsites.length === 0 ? (
                      <p className="text-sm text-[#82788F]">No approved websites found.</p>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                        {uniqueFilteredWebsites.map((w) => {
                          const status = getWebsiteStatusMeta(w.status);
                          const viewUrl = websiteViewUrl(w.domainName);
                          const industry = websiteIndustryByDomain.get(w.domainName) || 'General';

                          return (
                            <article
                              key={`${w.userId}::${w.id}`}
                              className="w-full h-[287px] rounded-lg border border-[rgba(177,59,255,0.29)] bg-[#B13BFF] shadow-sm overflow-hidden"
                            >
                              <div className="relative h-[170px]">
                                {w.thumbnail ? (
                                  <img
                                    src={w.thumbnail}
                                    alt={w.domainName}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <Image src={WEBSITE_CARD_IMAGE} alt={w.domainName} fill sizes="513px" className="object-cover" />
                                )}
                                <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-yellow-400 px-3 py-1 text-sm font-semibold text-gray-900">
                                  <span className={`h-4 w-4 rounded-full ${status.dotClass}`} />
                                  {status.label}
                                </span>
                                <span className="absolute left-3 bottom-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] text-[#4E4A70]">
                                  {industry}
                                </span>
                              </div>

                              <div className="bg-[#B13BFF] px-4 py-3 text-white h-[117px]">
                                <p className="text-xl font-semibold leading-none mb-2 truncate">{w.domainName}</p>
                                <div className="flex items-end justify-between gap-4">
                                  <div>
                                    <p className="text-xs text-white/85 mb-1">Action</p>
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={viewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-xl bg-[#6C2CD7] px-4 py-1.5 text-sm font-medium"
                                      >
                                        View
                                      </a>
                                      <button type="button" className="rounded-xl bg-[#FF4A43] px-4 py-1.5 text-sm font-medium">Dismiss</button>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[11px] text-white/75">Publisher</p>
                                    <p className="text-xl leading-none truncate max-w-[150px]">{w.owner || 'Jane Doe'}</p>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {loading ? (
                    <p className="text-sm text-[#82788F]">Loading approved products...</p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="text-sm text-[#82788F]">No approved products found.</p>
                  ) : (
                    filteredProducts.map((p) => (
                      <article key={`${p.id}-${p.subdomain || 'site'}`} className="rounded-lg border border-[rgba(177,59,255,0.29)] bg-[#B13BFF] shadow-sm overflow-hidden">
                        <div className="relative h-56">
                          <Image src={PRODUCT_CARD_IMAGE} alt={p.name || 'Product'} fill className="object-contain p-4" />
                          <span className="absolute left-3 top-3 rounded-full bg-yellow-400 px-2.5 py-1 text-[11px] font-semibold text-gray-900">
                            {p.subdomain || 'example-site.com'}
                          </span>
                          <span className="absolute left-3 bottom-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] text-[#4E4A70]">
                            {productIndustry(p)}
                          </span>
                        </div>

                        <div className="bg-[#B13BFF] px-4 py-3 text-white">
                          <div className="mb-1 flex items-center gap-2">
                            <p className="text-2xl font-semibold leading-none truncate">{p.name || 'Product Name'}</p>
                            <span className="rounded-full bg-[#6C2CD7] px-2 py-0.5 text-[11px]">{p.subcategory || 'Jeans'}</span>
                          </div>
                          <p className="text-xs text-white/85 mb-2">SKU: {p.sku || '123456'}</p>
                          <div className="flex items-center gap-2">
                            <button type="button" className="rounded-xl bg-[#6C2CD7] px-4 py-1.5 text-sm font-medium">View</button>
                            <button type="button" className="rounded-xl bg-[#FF4A43] px-4 py-1.5 text-sm font-medium">Dismiss</button>
                            <span className="ml-auto text-xs text-white/85">{formatMoney(p.finalPrice ?? p.price)}</span>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function WebsiteProductMonitoringPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
      <MonitoringPageContent />
    </Suspense>
  );
}
