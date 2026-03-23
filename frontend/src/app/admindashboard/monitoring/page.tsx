'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { getDomainsManagement, listProducts, adminWebsiteAction, adminDeleteProduct, type WebsiteManagementRow, type ApiProduct } from '@/lib/api';
import { addNotification } from '@/lib/notifications';
import { ChevronDownIcon, SearchIcon } from '@/lib/icons/adminIcons';
import { getWebsiteStatusMeta } from '@/lib/utils/adminStatus';

const AdminSidebar = dynamic(() => import('../components/sidebar').then((mod) => mod.AdminSidebar), { ssr: false });
const AdminHeader = dynamic(() => import('../components/header').then((mod) => mod.AdminHeader), { ssr: false });

type MonitoringTab = 'websites' | 'products';
type ToastTone = 'success' | 'error';

type WebsiteActionModalState = {
  open: boolean;
  target: WebsiteManagementRow | null;
  action: 'take_down' | 'delete';
  reason: string;
};

type ProductDeleteModalState = {
  open: boolean;
  target: ApiProduct | null;
  reason: string;
};

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
  const clean = normalize(domainName);
  const sub = clean.includes('.') ? clean.split('.')[0] : clean;
  if (!sub) return '#';
  return `http://${sub}.localhost:3000/`;
}

function productIndustry(product: ApiProduct): string {
  return product.category || product.subcategory || product.subCategory || product.sub_category || 'General';
}

function getBarHeight(value: number, max: number): string {
  if (max === 0) return '8%';
  const percentage = Math.max(8, Math.min(100, (value / max) * 100));
  return `${percentage}%`;
}

function subdomainFromDomain(domainName: string): string {
  const clean = normalize(domainName);
  if (!clean) return '';
  if (clean.includes('.')) return clean.split('.')[0] || '';
  return clean;
}

const WEBSITE_CARD_IMAGE = '/images/template-saas.jpg';
const PRODUCT_CARD_IMAGE = '/images/template-fashion.jpg';

/* ── shared panel style ─────────────────────────────────────── */
const panelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.84)',
  border: '1px solid rgba(166,61,255,0.13)',
  boxShadow: '0 4px 24px rgba(103,2,191,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
  backdropFilter: 'blur(14px)',
};

const insetStyle: React.CSSProperties = {
  background: 'rgba(240,235,255,0.55)',
  border: '1px solid rgba(166,61,255,0.09)',
};

/* ── modal overlay ──────────────────────────────────────────── */
const overlayStyle: React.CSSProperties = {
  background: 'rgba(200,185,245,0.38)',
  backdropFilter: 'blur(4px)',
};

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
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [workingWebsiteKey, setWorkingWebsiteKey] = useState<string | null>(null);
  const [workingProductId, setWorkingProductId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; tone: ToastTone }>({ open: false, message: '', tone: 'success' });
  const [websiteActionModal, setWebsiteActionModal] = useState<WebsiteActionModalState>({ open: false, target: null, action: 'take_down', reason: '' });
  const [productDeleteModal, setProductDeleteModal] = useState<ProductDeleteModalState>({ open: false, target: null, reason: '' });
  const [isWebsitesExpanded, setIsExpanded] = useState(false);

  useEffect(() => { setActiveTab(tabParam === 'products' ? 'products' : 'websites'); }, [tabParam]);
  useEffect(() => { setSearch(urlSearch); }, [urlSearch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [domainRes, productRes] = await Promise.all([
          getDomainsManagement(),
          listProducts({ limit: 200, ignoreActiveProjectScope: true, includeAllUsers: true }),
        ]);
        if (cancelled) return;
        setWebsites(domainRes.success && Array.isArray(domainRes.data) ? domainRes.data : []);
        setProducts(productRes.success && Array.isArray(productRes.items) ? productRes.items : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!toast.open) return;
    const timer = window.setTimeout(() => setToast((prev) => ({ ...prev, open: false })), 2400);
    return () => window.clearTimeout(timer);
  }, [toast.open]);

  const approvedWebsites = useMemo(() => websites.filter((w) => isApprovedWebsite(w.status)), [websites]);
  const pendingWebsiteCount = useMemo(() => websites.filter((w) => isPendingWebsite(w.status)).length, [websites]);
  const pendingProductCount = useMemo(() => products.filter((p) => isPendingProduct(p.status || '')).length, [products]);
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
    return products.filter((p) => {
      const matchFocused = !focusedProductId || p.id === focusedProductId;
      const matchSearch = !q || normalize(p.name).includes(q) || normalize(p.sku).includes(q) || normalize(p.subdomain).includes(q);
      const matchStatus = !statusFilter || normalize(p.status) === statusFilter;
      const matchIndustry = !industryFilter || normalize(productIndustry(p)) === industryFilter;
      return matchFocused && matchSearch && matchStatus && matchIndustry;
    });
  }, [products, focusedProductId, search, statusFilter, industryFilter]);

  const industryOptions = useMemo(() => {
    const items = new Set<string>();
    products.forEach((p) => items.add(productIndustry(p)));
    websites.forEach((w) => { if (w.plan) items.add(w.plan); });
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
      if (!bucket) { result.set(website.domainName, 'General'); return; }
      const best = Object.entries(bucket).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
      result.set(website.domainName, best);
    });
    return result;
  }, [products, approvedWebsites]);

  const websiteBySubdomain = useMemo(() => {
    const map = new Map<string, WebsiteManagementRow>();
    websites.forEach((w) => {
      const sub = subdomainFromDomain(w.domainName);
      if (sub) map.set(sub, w);
    });
    return map;
  }, [websites]);

  // ── Analytics Data (Filtered for Charts) ──────────────────
  const analyticsWebsites = useMemo(() => {
    const q = normalize(search);
    return websites.filter(w => {
      const matchSearch = !q || normalize(w.domainName).includes(q) || normalize(w.owner).includes(q);
      const matchIndustry = !industryFilter || normalize(w.plan) === industryFilter;
      return matchSearch && matchIndustry;
    });
  }, [websites, search, industryFilter]);

  const analyticsProducts = useMemo(() => {
    const q = normalize(search);
    return products.filter(p => {
      const matchSearch = !q || normalize(p.name).includes(q) || normalize(p.sku).includes(q) || normalize(p.subdomain).includes(q);
      const matchIndustry = !industryFilter || normalize(productIndustry(p)) === industryFilter;
      return matchSearch && matchIndustry;
    });
  }, [products, search, industryFilter]);

  const statusChartData = useMemo(() => {
    const ds = activeTab === 'websites' ? analyticsWebsites : analyticsProducts;
    const published = ds.filter((item) => ['published', 'live', 'active'].includes(normalize(item.status || ''))).length;
    const offline = ds.filter((item) => ['offline', 'suspended'].includes(normalize(item.status || ''))).length;
    const draft = ds.filter((item) => ['draft', 'pending'].includes(normalize(item.status || ''))).length;
    return [
      { label: 'Published', value: published },
      { label: 'Offline', value: offline },
      { label: 'Draft', value: draft }
    ];
  }, [activeTab, analyticsWebsites, analyticsProducts]);

  const flaggedChartData = useMemo(() => {
    const flaggedWebsites = analyticsWebsites.filter((w) => normalize(w.status) === 'flagged').length;
    const flaggedProducts = analyticsProducts.filter((p) => normalize(p.status) === 'flagged').length;
    return [{ label: 'Websites', value: flaggedWebsites }, { label: 'Products', value: flaggedProducts }, { label: 'Resolved', value: 0 }];
  }, [analyticsWebsites, analyticsProducts]);

  const historicalChartData = useMemo(() => {
    const ds = activeTab === 'websites' ? analyticsWebsites : analyticsProducts;
    const daysMap = new Map<string, { p: number; o: number; d: number; rawDate: Date }>();
    ds.forEach((item) => {
      const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Unknown';
      if (dateStr === 'Unknown') return;
      const day = daysMap.get(dateStr) || { p: 0, o: 0, d: 0, rawDate: new Date(item.createdAt!) };
      const s = normalize(item.status || '');
      if (['published', 'live', 'active'].includes(s)) day.p++;
      else if (['offline', 'suspended'].includes(s)) day.o++;
      else if (['draft', 'pending'].includes(s)) day.d++;
      daysMap.set(dateStr, day);
    });
    return Array.from(daysMap.entries())
      .sort((a, b) => b[1].rawDate.getTime() - a[1].rawDate.getTime())
      .slice(0, 3).reverse()
      .map(([date, counts]) => ({ date, ...counts }));
  }, [activeTab, analyticsWebsites, analyticsProducts]);

  const maxStatusVal = useMemo(() => Math.max(...statusChartData.map(d => d.value), 1), [statusChartData]);
  const maxFlaggedVal = useMemo(() => Math.max(...flaggedChartData.map(d => d.value), 1), [flaggedChartData]);
  const maxHistVal = useMemo(() => Math.max(...historicalChartData.flatMap(h => [h.p, h.o, h.d]), 1), [historicalChartData]);

  const handleTabChange = (tab: MonitoringTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.set('tab', tab);
      window.history.replaceState(null, '', `/admindashboard/monitoring?${nextParams.toString()}`);
    }
  };

  const openWebsiteActionModal = (website: WebsiteManagementRow) => {
    setWebsiteActionModal({ open: true, target: website, action: 'take_down', reason: '' });
  };

  const submitWebsiteAction = async () => {
    const website = websiteActionModal.target;
    if (!website) return;
    const reason = websiteActionModal.reason.trim();
    if (!reason) { setToast({ open: true, message: 'Reason is required.', tone: 'error' }); return; }
    const key = `${website.userId}::${website.id}`;
    try {
      setWorkingWebsiteKey(key);
      const res = await adminWebsiteAction({ userId: website.userId, domainId: website.id, action: websiteActionModal.action, reason });
      if (!res.success) throw new Error(res.message || 'Website action failed');
      
      await addNotification(
        websiteActionModal.action === 'take_down' ? 'Website Taken Down' : 'Website Deleted',
        `${website.domainName} was ${websiteActionModal.action === 'take_down' ? 'taken down' : 'deleted'} by admin.`,
        websiteActionModal.action === 'take_down' ? 'warning' : 'error',
        {
          details: `Website: ${website.domainName}\nPublisher: ${website.owner || 'Unknown'}\nAction: ${websiteActionModal.action === 'take_down' ? 'Take Down Website' : 'Delete Website'}\nReason: ${reason}`,
          metadata: {
            action: websiteActionModal.action,
            domain: website.domainName,
            publisher: website.owner || 'Unknown',
            reason,
          },
        }
      );

      setToast({ open: true, message: res.message || 'Website updated.', tone: 'success' });
      setWebsites((prev) => prev.filter((w) => `${w.userId}::${w.id}` !== key));
      setWebsiteActionModal({ open: false, target: null, action: 'take_down', reason: '' });
    } catch (error) {
      setToast({ open: true, message: error instanceof Error ? error.message : 'Website action failed', tone: 'error' });
    } finally { setWorkingWebsiteKey(null); }
  };

  const openDeleteProductModal = (product: ApiProduct) => {
    setProductDeleteModal({ open: true, target: product, reason: '' });
  };

  const submitDeleteProduct = async () => {
    const product = productDeleteModal.target;
    if (!product) return;
    const reason = productDeleteModal.reason.trim();
    if (!reason) { setToast({ open: true, message: 'Reason is required.', tone: 'error' }); return; }
    try {
      setWorkingProductId(product.id);
      const res = await adminDeleteProduct(product.id, reason);
      if (!res.success) throw new Error(res.message || 'Failed to delete product');
      
      await addNotification(
        'Product Deleted',
        `${product.name || 'Untitled Product'} was deleted by admin.`,
        'error',
        {
          details: `Product: ${product.name || 'Untitled Product'}\nSKU: ${product.sku || 'N/A'}\nWebsite: ${product.subdomain || 'N/A'}\nReason: ${reason}`,
          metadata: {
            productId: product.id,
            sku: product.sku || 'N/A',
            website: product.subdomain || 'N/A',
            reason,
          },
        }
      );

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      if (selectedProduct?.id === product.id) setSelectedProduct(null);
      setProductDeleteModal({ open: false, target: null, reason: '' });
      setToast({ open: true, message: 'Product deleted and client notified.', tone: 'success' });
    } catch (error) {
      setToast({ open: true, message: error instanceof Error ? error.message : 'Failed to delete product', tone: 'error' });
    } finally { setWorkingProductId(null); }
  };

  /* ── shared select style ────────────────────────────────── */
  const selectCls = "appearance-none rounded-2xl px-4 py-2.5 pr-10 text-sm font-medium outline-none cursor-pointer focus:ring-2 focus:ring-[rgba(166,61,255,0.2)]";
  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.9)',
    border: '1.5px solid rgba(166,61,255,0.18)',
    color: '#4a1a8a',
    boxShadow: '0 1px 4px rgba(103,2,191,0.05)',
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
                mobile onClose={() => setSidebarOpen(false)}
                forcedActiveItemId="monitoring"
                forcedActiveChildId={activeTab === 'websites' ? 'website-monitoring' : 'product-monitoring'}
              />
            </div>
          )}
        </AnimatePresence>

        <main className="relative flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10">
          <div className="mx-auto max-w-7xl space-y-8">
            <AdminHeader
              title={activeTab === 'websites' ? 'Website Monitoring' : 'Product Monitoring'}
              onToggleSidebar={() => setSidebarOpen(true)}
              pendingAlerts={pendingTotal}
              statsValue={activeTab === 'websites' ? websites.length : products.length}
            />

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-2xl bg-[white]/60 p-1 backdrop-blur-md shadow-sm border border-[rgba(166,61,255,0.1)]">
                  <button
                    onClick={() => handleTabChange('websites')}
                    className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300 ${
                      activeTab === 'websites' ? 'bg-[#7b1de8] text-white shadow-lg shadow-[#7b1de8]/25' : 'text-[#7a6aa0] hover:bg-[#7b1de8]/5'
                    }`}
                  >
                    Websites
                  </button>
                  <button
                    onClick={() => handleTabChange('products')}
                    className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300 ${
                      activeTab === 'products' ? 'bg-[#7b1de8] text-white shadow-lg shadow-[#7b1de8]/25' : 'text-[#7a6aa0] hover:bg-[#7b1de8]/5'
                    }`}
                  >
                    Products
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="relative min-w-[280px]">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a090c8]" />
                  <input
                    type="text"
                    placeholder="Search name or domain..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl bg-[white]/80 border-1.5 border-[rgba(166,61,255,0.18)] py-3 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[rgba(166,61,255,0.2)] backdrop-blur-sm"
                  />
                </div>

                <div className="relative group">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={selectCls}
                    style={selectStyle}
                  >
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="offline">Offline</option>
                    <option value="flagged">Flagged</option>
                    <option value="draft">Draft</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a090c8] pointer-events-none transition-transform group-focus-within:rotate-180" />
                </div>

                <div className="relative group">
                  <select
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className={`${selectCls} min-w-[160px]`}
                    style={selectStyle}
                  >
                    <option value="">Industry</option>
                    {industryOptions.map((opt) => (<option key={opt} value={normalize(opt)}>{opt}</option>))}
                  </select>
                  <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a090c8] pointer-events-none transition-transform group-focus-within:rotate-180" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[380px,1fr] gap-8 items-start">
              <AnimatePresence mode="wait">
                {/* Left Column: Permanent Charts */}
                <motion.div 
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.12 }}
                  className="space-y-4"
                >
                  {/* Total Websites/Products chart */}
                  <section className="rounded-[24px] p-6 transition-all duration-300" style={panelStyle}>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-2xl font-bold" style={{ color: '#4a1a8a' }}>
                        {activeTab === 'websites' ? 'Total Websites' : 'Total Products'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsExpanded(!isWebsitesExpanded)}
                        className="text-sm font-semibold transition-colors hover:opacity-80"
                        style={{ color: '#a07ad0' }}
                      >
                        {isWebsitesExpanded ? 'View Less' : 'View More'}
                      </button>
                    </div>

                    <div className={`rounded-2xl p-4 transition-all duration-300 ${isWebsitesExpanded ? 'h-52' : 'h-40'}`} style={insetStyle}>
                      <div className="flex h-full items-end gap-4">
                        {isWebsitesExpanded ? (
                          <>
                            <div className="flex flex-col justify-between items-end h-[85%] text-[10px] font-bold w-5 pb-5" style={{ color: '#a090c8' }}>
                              {['40', '32', '24', '16', '8', '0'].map(v => <span key={v}>{v}</span>)}
                            </div>
                            <div className="flex-1 flex h-full items-end justify-around gap-6 relative" style={{ borderLeft: '1px solid rgba(160,144,200,0.15)', borderBottom: '1px solid rgba(160,144,200,0.15)' }}>
                              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-5 pr-2">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full" style={{ borderTop: '1px solid rgba(160,144,200,0.08)' }} />)}
                              </div>
                              {statusChartData.map((d, idx) => (
                                <div key={`${d.label}-${idx}`} className="flex h-full w-full flex-col items-center justify-end gap-1 z-10 group relative">
                                  <div className="absolute -top-7 px-2 py-1 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md" style={{ background: '#4a1a8a' }}>
                                    {d.value}
                                  </div>
                                  <div className="w-full max-w-[36px] rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                                    style={{ height: getBarHeight(d.value, Math.max(maxStatusVal, 40)), background: 'linear-gradient(180deg, #a855f7, #7b1de8)' }}
                                  />
                                  <span className="text-[11px] font-medium" style={{ color: '#7a6aa0' }}>{d.label}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full items-end justify-between gap-3">
                            {statusChartData.map((d, idx) => (
                              <div key={`${d.label}-${idx}`} className="flex h-full w-full flex-col items-center justify-end gap-1 group relative">
                                <div className="absolute -top-7 px-2 py-1 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md" style={{ background: '#4a1a8a' }}>
                                  {d.value}
                                </div>
                                <div className="w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                                  style={{ height: getBarHeight(d.value, maxStatusVal), background: 'linear-gradient(180deg, #a855f7, #7b1de8)' }}
                                />
                                <span className="text-[11px] font-medium" style={{ color: '#7a6aa0' }}>{d.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Flagged Issues chart */}
                  <section className="rounded-[24px] p-6 transition-all duration-300" style={panelStyle}>
                    <h3 className="mb-4 text-2xl font-bold text-center" style={{ color: '#4a1a8a' }}>Flagged Issues</h3>
                    <div className="h-40 rounded-2xl p-4" style={insetStyle}>
                      <div className="flex h-full items-end justify-between gap-3">
                        {flaggedChartData.map((d, idx) => (
                          <div key={`${d.label}-${idx}`} className="flex h-full w-full flex-col items-center justify-end gap-1 group relative">
                            <div className="absolute -top-7 px-2 py-1 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md" style={{ background: '#4a1a8a' }}>
                              {d.value}
                            </div>
                            <div className="w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                              style={{ height: getBarHeight(d.value, maxFlaggedVal), background: 'linear-gradient(90deg, #ff8a00, #ff4d00)' }}
                            />
                            <span className="text-[11px] font-medium" style={{ color: '#7a6aa0' }}>{d.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Previous Month chart */}
                  <section className="rounded-[24px] p-6 transition-all duration-300" style={panelStyle}>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#a090c8]">Previous Month</h3>
                    <div className="h-48 rounded-2xl p-4" style={insetStyle}>
                      <div className="flex h-full items-end justify-between gap-4">
                        {historicalChartData.length > 0 ? (
                          historicalChartData.map((h, i) => (
                            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                              <div className="flex w-full items-end justify-center gap-1">
                                <div className="w-2 rounded-t-sm" style={{ height: getBarHeight(h.p, maxHistVal), background: '#8b5cf6' }} title="Published" />
                                <div className="w-2 rounded-t-sm" style={{ height: getBarHeight(h.o, maxHistVal), background: '#f87171' }} title="Offline" />
                                <div className="w-2 rounded-t-sm" style={{ height: getBarHeight(h.d, maxHistVal), background: '#34d399' }} title="Draft" />
                              </div>
                              <span className="text-[10px] whitespace-nowrap" style={{ color: '#7a6aa0' }}>{h.date}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-[#c0b5e0]">No historical data</div>
                        )}
                      </div>
                      <div className="mt-4 flex justify-center gap-4 text-[10px] font-bold">
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#8b5cf6]" /> <span style={{ color: '#7a6aa0' }}>Published</span></div>
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#f87171]" /> <span style={{ color: '#7a6aa0' }}>Offline</span></div>
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#34d399]" /> <span style={{ color: '#7a6aa0' }}>Draft</span></div>
                      </div>
                    </div>
                  </section>
                </motion.div>
              </AnimatePresence>

              {/* Right Column: Dynamic Content */}
              <div className="min-h-[600px]">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex h-full w-full items-center justify-center py-20"
                    >
                      <div className="text-center space-y-4">
                        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#7b1de8] border-r-transparent" />
                        <p className="text-[#7a6aa0] font-medium">Fetching system inventory...</p>
                      </div>
                    </motion.div>
                  ) : activeTab === 'websites' ? (
                    <motion.div 
                      key="websites-list"
                      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6"
                    >
                      {uniqueFilteredWebsites.map((w) => {
                        const statusMeta = getWebsiteStatusMeta(w.status);
                        const isWorking = workingWebsiteKey === `${w.userId}::${w.id}`;
                        return (
                          <motion.div key={`${w.userId}::${w.id}`} layout className="group relative overflow-hidden rounded-[24px] p-5 transition-all duration-300 hover:shadow-2xl" 
                            style={{ ...panelStyle, transform: isWorking ? 'scale(0.98)' : 'none', opacity: isWorking ? 0.7 : 1 }}>
                            <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-black/5">
                              <Image src={WEBSITE_CARD_IMAGE} alt={w.domainName} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#4a1a8a]/40 to-transparent" />
                              <span className="absolute left-3 top-3 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg backdrop-blur-md" 
                                style={{ background: statusMeta.bgColor }}>
                                {w.status}
                              </span>
                            </div>
                            <div className="space-y-3">
                              <h4 className="truncate text-lg font-bold text-[#4a1a8a]">{w.domainName}</h4>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-medium text-[#7a6aa0]">
                                  <div className="h-1 w-1 rounded-full bg-[#a07ad0]" />
                                  <span>Publisher: <span className="font-bold text-[#4a1a8a]">{w.owner}</span></span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-[#7a6aa0]">
                                  <div className="h-1 w-1 rounded-full bg-[#a07ad0]" />
                                  <span>Tier: <span className="font-bold text-[#4a1a8a]">{w.plan || 'General'}</span></span>
                                </div>
                              </div>
                              <div className="pt-4 flex items-center justify-between border-t border-[rgba(166,61,255,0.08)]">
                                <a href={websiteViewUrl(w.domainName)} target="_blank" rel="noopener noreferrer" 
                                  className="rounded-xl bg-[#7b1de8]/5 px-4 py-2 text-xs font-bold text-[#7b1de8] transition-colors hover:bg-[#7b1de8]/10">
                                  Live View
                                </a>
                                <button onClick={() => openWebsiteActionModal(w)} disabled={isWorking}
                                  className="rounded-xl bg-[#ff4d00]/5 px-4 py-2 text-xs font-bold text-[#ff4d00] transition-colors hover:bg-[#ff4d00]/10 disabled:opacity-50">
                                  {isWorking ? 'Processing...' : 'Take Down'}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="products-list"
                      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6"
                    >
                      {filteredProducts.map((p) => {
                        const isWorking = workingProductId === p.id;
                        return (
                          <motion.div key={p.id} layout className="group relative overflow-hidden rounded-[24px] p-5 transition-all duration-300 hover:shadow-2xl" 
                            style={{ ...panelStyle, opacity: isWorking ? 0.7 : 1 }}>
                            <div className="relative mb-5 aspect-square overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-black/5">
                              <Image src={PRODUCT_CARD_IMAGE} alt={p.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900/60 to-transparent p-4">
                                <span className="rounded-lg bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md uppercase tracking-wider ring-1 ring-white/30">
                                  {p.status || 'Active'}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <h4 className="truncate text-lg font-bold text-[#4a1a8a]" title={p.name}>{p.name}</h4>
                                <p className="text-[10px] font-bold tracking-widest text-[#a090c8] uppercase">SKU: {p.sku}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-lg bg-[#7b1de8]/5 px-2.5 py-1 text-[10px] font-bold text-[#7b1de8]">{productIndustry(p)}</span>
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-[rgba(166,61,255,0.08)]">
                                <span className="text-lg font-black text-[#4a1a8a]">{formatMoney(p.price)}</span>
                                <div className="flex gap-2">
                                  <button onClick={() => setSelectedProduct(p)} className="rounded-xl px-4 py-2 text-xs font-bold text-[#7b1de8] transition-colors hover:bg-[#7b1de8]/5">View</button>
                                  <button onClick={() => openDeleteProductModal(p)} disabled={isWorking}
                                    className="rounded-xl bg-[#ff4d00]/5 px-4 py-2 text-xs font-bold text-[#ff4d00] transition-colors hover:bg-[#ff4d00]/10 disabled:opacity-50">
                                    {isWorking ? '...' : 'Delete'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* --- Website Action Modal --- */}
      <AnimatePresence>
        {websiteActionModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWebsiteActionModal(prev => ({ ...prev, open: false }))} className="fixed inset-0" style={overlayStyle} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-md overflow-hidden rounded-[32px] p-8 shadow-2xl" style={panelStyle}>
              <h3 className="mb-2 text-2xl font-black text-[#4a1a8a]">{websiteActionModal.action === 'delete' ? 'Delete Website' : 'Take Down Website'}</h3>
              <p className="mb-6 text-sm font-medium text-[#7a6aa0]">This action will notify <span className="font-bold text-[#4a1a8a]">{websiteActionModal.target?.owner}</span>. Please provide a reason.</p>
              <textarea value={websiteActionModal.reason} onChange={(e) => setWebsiteActionModal(prev => ({ ...prev, reason: e.target.value }))} placeholder="Explain why this action is being taken..." className="h-32 w-full rounded-2xl bg-[#f0ebff]/50 border-1.5 border-[rgba(166,61,255,0.12)] p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[rgba(166,61,255,0.2)]" />
              <div className="mt-8 flex gap-3">
                <button onClick={() => setWebsiteActionModal(prev => ({ ...prev, open: false }))} className="flex-1 rounded-2xl py-3.5 text-sm font-bold text-[#7a6aa0] transition-colors hover:bg-[#4a1a8a]/5">Cancel</button>
                <button onClick={submitWebsiteAction} className="flex-1 rounded-2xl bg-[#ff4d00] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#ff4d00]/25 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]">Confirm Action</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Product Delete Modal --- */}
      <AnimatePresence>
        {productDeleteModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProductDeleteModal(prev => ({ ...prev, open: false }))} className="fixed inset-0" style={overlayStyle} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-md overflow-hidden rounded-[32px] p-8 shadow-2xl" style={panelStyle}>
              <h3 className="mb-2 text-2xl font-black text-[#ff4d00]">Delete Product</h3>
              <p className="mb-6 text-sm font-medium text-[#7a6aa0]">Are you sure you want to delete <span className="font-bold text-[#4a1a8a]">{productDeleteModal.target?.name}</span>?</p>
              <textarea value={productDeleteModal.reason} onChange={(e) => setProductDeleteModal(prev => ({ ...prev, reason: e.target.value }))} placeholder="Provide a reason for the client..." className="h-32 w-full rounded-2xl bg-[#f0ebff]/50 border-1.5 border-[rgba(166,61,255,0.12)] p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[rgba(166,61,255,0.2)]" />
              <div className="mt-8 flex gap-3">
                <button onClick={() => setProductDeleteModal(prev => ({ ...prev, open: false }))} className="flex-1 rounded-2xl py-3.5 text-sm font-bold text-[#7a6aa0] transition-colors hover:bg-[#4a1a8a]/5">Cancel</button>
                <button onClick={submitDeleteProduct} className="flex-1 rounded-2xl bg-[#ff4d00] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#ff4d00]/25 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]">Delete Item</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Product Detail Modal --- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="fixed inset-0" style={overlayStyle} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] p-8 md:p-12 shadow-2xl" style={panelStyle}>
              <button onClick={() => setSelectedProduct(null)} className="absolute right-8 top-8 h-12 w-12 rounded-full bg-[#f0ebff] text-[#7b1de8] transition-all hover:rotate-90 hover:bg-[#7b1de8] hover:text-white">✕</button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="relative aspect-square overflow-hidden rounded-[32px] shadow-inner" style={insetStyle}>
                  <Image src={PRODUCT_CARD_IMAGE} alt={selectedProduct.name} fill className="object-cover" />
                </div>
                <div className="flex flex-col justify-center space-y-8">
                  <div className="space-y-2">
                    <span className="inline-block rounded-xl bg-[#7b1de8]/10 px-4 py-1.5 text-xs font-heavy tracking-widest text-[#7b1de8] uppercase">{productIndustry(selectedProduct)}</span>
                    <h2 className="text-4xl font-black leading-tight text-[#4a1a8a]">{selectedProduct.name}</h2>
                    <p className="text-sm font-bold tracking-widest text-[#a090c8] uppercase">SKU: {selectedProduct.sku}</p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-lg font-medium leading-relaxed text-[#7a6aa0]">{selectedProduct.description || 'No description provided.'}</p>
                    <div className="flex items-center justify-between py-6 border-y border-[rgba(166,61,255,0.1)]">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#a090c8]">Stock Level</p>
                        <p className="text-2xl font-black text-[#4a1a8a]">{selectedProduct.quantity} units</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#a090c8]">Market Price</p>
                        <p className="text-4xl font-black text-[#7b1de8]">{formatMoney(selectedProduct.price)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 rounded-2xl" style={insetStyle}>
                    <div className="h-12 w-12 rounded-xl bg-[#7b1de8] flex items-center justify-center text-white font-bold">🛒</div>
                    <div>
                      <p className="text-xs font-bold text-[#a090c8]">Associated Store</p>
                      <p className="text-sm font-heavy text-[#4a1a8a]">{selectedProduct.subdomain || 'Local Inventory'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast.open && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="fixed bottom-10 left-1/2 z-[200] -translate-x-1/2">
            <div className={`flex items-center gap-3 rounded-2xl px-8 py-4 shadow-2xl backdrop-blur-xl ${toast.tone === 'success' ? 'bg-[#7b1de8] text-white' : 'bg-[#ff4d00] text-white'}`}>
              <span className="text-sm font-bold">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <Suspense fallback={
      <div className="admin-dashboard-shell flex min-h-screen items-center justify-center">
        <div className="text-[#a090c8] font-bold animate-pulse">Initializing monitoring systems...</div>
      </div>
    }>
      <MonitoringPageContent />
    </Suspense>
  );
}