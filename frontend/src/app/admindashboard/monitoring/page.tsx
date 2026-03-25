'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getDomainsManagement,
  listProducts,
  adminWebsiteAction,
  adminDeleteProduct,
  type WebsiteManagementRow,
  type ApiProduct
} from '@/lib/api';
import { ChevronDownIcon, SearchIcon } from '@/lib/icons/adminIcons';
import { addNotification } from '@/lib/notifications';
import { formatToPHTimeShort } from '@/lib/dateUtils';
import { getWebsiteStatusMeta } from '@/lib/utils/adminStatus';

const AdminSidebar = dynamic(() => import('../components/sidebar').then((mod) => mod.AdminSidebar), { ssr: false });
const AdminHeader = dynamic(() => import('../components/header').then((mod) => mod.AdminHeader), { ssr: false });

type MonitoringTab = 'websites' | 'products';
type SortOption = 'recent' | 'oldest' | 'az' | 'za';
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
  return s === 'published';
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

const PRODUCT_CARD_IMAGE = '/images/template-fashion.jpg';

/* ── Lightweight Website Preview Placeholder ─────────────────── */
function WebsitePreviewFallback({ domainName }: { domainName: string }) {
  return (
    <div className="h-full w-full rounded-none flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f6f0ff 0%, #efe9ff 100%)' }}>
      <div className="text-center px-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#8e7fb4' }}>Website Preview</p>
        <p className="mt-1 text-xs font-medium truncate max-w-[180px]" style={{ color: '#6f5a9d' }} title={domainName || 'Unknown domain'}>
          {domainName || 'Unknown domain'}
        </p>
      </div>
    </div>
  );
}

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
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  useEffect(() => { setActiveTab(tabParam === 'products' ? 'products' : 'websites'); }, [tabParam]);
  useEffect(() => { setSearch(urlSearch); }, [urlSearch]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [domainRes, productRes] = await Promise.all([
        getDomainsManagement(),
        listProducts({ limit: 200, ignoreActiveProjectScope: true, includeAllUsers: true }),
      ]);
      setWebsites(domainRes.success && Array.isArray(domainRes.data) ? domainRes.data : []);
      setProducts(productRes.success && Array.isArray(productRes.items) ? productRes.items : []);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for remote notifications (from other admins) to sync the list
    const onNotifReceived = () => loadData(true);
    window.addEventListener('notification:new_received', onNotifReceived);
    return () => window.removeEventListener('notification:new_received', onNotifReceived);
  }, []);

  useEffect(() => {
    if (!toast.open) return;
    const timer = window.setTimeout(() => setToast((prev) => ({ ...prev, open: false })), 2400);
    return () => window.clearTimeout(timer);
  }, [toast.open]);

  const uniqueWebsites = useMemo(() => {
    const seen = new Set<string>();
    return websites.filter((w) => {
      const key = `${w.userId}::${w.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [websites]);

  const allWebsites = useMemo(() => uniqueWebsites, [uniqueWebsites]);
  const pendingWebsiteCount = useMemo(() => uniqueWebsites.filter((w) => isPendingWebsite(w.status)).length, [uniqueWebsites]);
  const pendingProductCount = useMemo(() => products.filter((p) => isPendingProduct(p.status || '')).length, [products]);
  const pendingTotal = pendingWebsiteCount + pendingProductCount;

  const filteredWebsites = useMemo(() => {
    const q = normalize(search);
    return allWebsites.filter((w) => {
      const matchSearch = !q || normalize(w.domainName).includes(q) || normalize(w.owner).includes(q);
      const matchStatus = !statusFilter || normalize(w.status) === statusFilter;
      const matchIndustry = !industryFilter || normalize(w.plan) === industryFilter;
      return matchSearch && matchStatus && matchIndustry;
    });
  }, [allWebsites, search, statusFilter, industryFilter]);

  const uniqueFilteredWebsites = useMemo(() => {
    const seen = new Set<string>();
    const unique = filteredWebsites.filter((w) => {
      const key = `${w.userId}::${w.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (sortOption === 'az') {
      unique.sort((a, b) => a.domainName.localeCompare(b.domainName));
    } else if (sortOption === 'za') {
      unique.sort((a, b) => b.domainName.localeCompare(a.domainName));
    } else if (sortOption === 'recent') {
      unique.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortOption === 'oldest') {
      unique.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    }
    return unique;
  }, [filteredWebsites, sortOption]);

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

  const sortedProducts = useMemo(() => {
    const copy = [...filteredProducts];
    if (sortOption === 'az') {
      copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortOption === 'za') {
      copy.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortOption === 'recent') {
      copy.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortOption === 'oldest') {
      copy.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    }
    return copy;
  }, [filteredProducts, sortOption]);

  const industryOptions = useMemo(() => {
    const items = new Set<string>();
    products.forEach((p) => items.add(productIndustry(p)));
    uniqueWebsites.forEach((w) => { if (w.plan) items.add(w.plan); });
    return Array.from(items).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [products, uniqueWebsites]);

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
    allWebsites.forEach((website) => {
      const subdomain = subdomainFromDomain(website.domainName);
      const bucket = bySubdomain.get(subdomain);
      if (!bucket) { result.set(website.domainName, 'General'); return; }
      const best = Object.entries(bucket).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
      result.set(website.domainName, best);
    });
    return result;
  }, [products, allWebsites]);

  const websiteBySubdomain = useMemo(() => {
    const map = new Map<string, WebsiteManagementRow>();
    websites.forEach((w) => {
      const sub = subdomainFromDomain(w.domainName);
      if (sub) map.set(sub, w);
    });
    return map;
  }, [websites]);

  // ── Analytics Data (Filtered for Charts) ──────────────────
  const websiteChartData = useMemo(() => {
    const published = uniqueWebsites.filter((w) => ['published'].includes(normalize(w.status))).length;
    const offline = uniqueWebsites.filter((w) => ['offline', 'suspended'].includes(normalize(w.status))).length;
    const draft = uniqueWebsites.filter((w) => ['draft', 'pending'].includes(normalize(w.status))).length;
    return [{ label: 'Published', value: published }, { label: 'Offline', value: offline }, { label: 'Draft', value: draft }];
  }, [uniqueWebsites]);

  const productChartData = useMemo(() => {
    const live = products.filter((p) => ['published'].includes(normalize(p.status || ''))).length;
    const offline = products.filter((p) => ['offline', 'suspended'].includes(normalize(p.status || ''))).length;
    const draft = products.filter((p) => ['draft', 'pending'].includes(normalize(p.status || ''))).length;
    return [{ label: 'Published', value: live }, { label: 'Offline', value: offline }, { label: 'Draft', value: draft }];
  }, [products]);

  const flaggedChartData = useMemo(() => {
    const flaggedWebsites = uniqueWebsites.filter((w) => normalize(w.status) === 'flagged').length;
    const flaggedProducts = products.filter((p) => normalize(p.status) === 'flagged').length;
    return [{ label: 'Websites', value: flaggedWebsites }, { label: 'Products', value: flaggedProducts }, { label: 'Resolved', value: 0 }];
  }, [uniqueWebsites, products]);

  const historicalChartData = useMemo(() => {
    const ds = activeTab === 'websites' ? uniqueWebsites : products;
    const daysMap = new Map<string, { p: number; o: number; d: number; rawDate: Date }>();
    ds.forEach((item) => {
      const dateStr = item.createdAt ? formatToPHTimeShort(item.createdAt).split(',')[0] : 'Unknown';
      if (dateStr === 'Unknown') return;
      const day = daysMap.get(dateStr) || { p: 0, o: 0, d: 0, rawDate: new Date(item.createdAt!) };
      const s = normalize(item.status || '');
      if (['published'].includes(s)) day.p++;
      else if (['offline', 'suspended'].includes(s)) day.o++;
      else if (['draft', 'pending'].includes(s)) day.d++;
      daysMap.set(dateStr, day);
    });
    return Array.from(daysMap.entries())
      .sort((a, b) => b[1].rawDate.getTime() - a[1].rawDate.getTime())
      .slice(0, 3).reverse()
      .map(([date, counts]) => ({ date, ...counts }));
  }, [activeTab, websites, products]);

  const maxStatusVal = useMemo(() => {
    const ds = activeTab === 'websites' ? websiteChartData : productChartData;
    return Math.max(...ds.map(d => d.value), 1);
  }, [activeTab, websiteChartData, productChartData]);

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

      const actionLabel = websiteActionModal.action === 'take_down' ? 'Taken Down' : 'Deleted';
      await addNotification(
        `Website ${actionLabel}`,
        `${website.domainName} was ${actionLabel.toLowerCase()} by admin. Reason: ${reason}`,
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
        `${product.name || 'Untitled Product'} was deleted by admin. Reason: ${reason}`,
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

  /* ── helper: Analytics Column ──────────────────────────── */
  const renderAnalyticsColumn = () => {
    const statusData = activeTab === 'websites' ? websiteChartData : productChartData;
    const title = activeTab === 'websites' ? 'Total Websites' : 'Total Products';

    return (
      <div className="space-y-4">
        {/* Total Chart */}
        <section className="rounded-[24px] p-6 transition-all duration-300" style={panelStyle}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold" style={{ color: '#4a1a8a' }}>{title}</h3>
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
                    {statusData.map((d, idx) => (
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
                  {statusData.map((d, idx) => (
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

          {/* Historical (Historical Chart) */}
          {isWebsitesExpanded && (
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(166,61,255,0.1)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#a090c8' }}>Previous Month</h4>
              <div className="h-40 relative mb-3">
                <div className="absolute left-0 bottom-5 top-0 w-5 flex flex-col justify-between text-[10px] font-bold items-end pr-1.5" style={{ color: '#a090c8' }}>
                  {['100', '80', '60', '40', '20', '0'].map(v => <span key={v}>{v}</span>)}
                </div>
                <div className="ml-7 h-full flex items-end justify-around relative" style={{ borderBottom: '1px solid rgba(160,144,200,0.15)', borderLeft: '1px solid rgba(160,144,200,0.15)' }}>
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="absolute left-0 right-0" style={{ borderTop: '1px solid rgba(160,144,200,0.08)', bottom: `${i * 20}%` }} />)}
                  {historicalChartData.length === 0 ? (
                    <p className="text-[10px] absolute inset-0 flex items-center justify-center" style={{ color: '#a090c8' }}>No historical data</p>
                  ) : historicalChartData.map((hist, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 w-full h-full justify-end">
                      <div className="flex items-end gap-0.5 h-[85%] mb-1">
                        {[
                          { val: hist.p, bg: '#a855f7' },
                          { val: hist.o, bg: '#f87171' },
                          { val: hist.d, bg: '#34d399' },
                        ].map(({ val, bg }, ci) => (
                          <div key={ci} className="group relative w-3">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md" style={{ background: '#4a1a8a' }}>{val}</div>
                            <div className="w-full rounded-t transition-all" style={{ height: `${(val / maxHistVal) * 100}%`, background: bg }} />
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: '#7a6aa0' }}>{hist.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-5">
                {[['#a855f7', 'Published'], ['#f87171', 'Offline'], ['#34d399', 'Draft']].map(([color, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
                    <span className="text-[10px] font-bold" style={{ color: '#4a1a8a' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Flagged Issues Chart */}
        <section className="rounded-[24px] p-6" style={panelStyle}>
          <h3 className="mb-4 text-2xl font-bold text-center" style={{ color: '#4a1a8a' }}>Flagged Issues</h3>
          <div className="h-40 rounded-2xl p-4" style={insetStyle}>
            <div className="flex h-full items-end justify-between gap-3">
              {flaggedChartData.map((d, idx) => (
                <div key={`flagged-${d.label}-${idx}`} className="flex h-full w-full flex-col items-center justify-end gap-1 group relative">
                  <div className="absolute -top-7 px-2 py-1 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md" style={{ background: '#dc2626' }}>
                    {d.value}
                  </div>
                  <div className="w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                    style={{ height: getBarHeight(d.value, maxFlaggedVal), background: 'linear-gradient(180deg, #fb923c, #ef4444)' }}
                  />
                  <span className="text-[11px] font-medium" style={{ color: '#7a6aa0' }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
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

        <div className="flex min-h-screen flex-1 flex-col">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">

              {/* ── Page header ─────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <h1 className="text-3xl font-bold sm:text-4xl" style={{ color: '#7b1de8' }}>
                  Website &amp; Product Monitoring
                </h1>
                <p className="mt-1 text-sm font-medium" style={{ color: '#a78bfa' }}>
                  Website &amp; Product Monitoring
                </p>
              </motion.div>

              {/* ── Toolbar ─────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 }}
                className="mb-6 flex flex-wrap items-center gap-3"
              >
                {/* Search icon btn */}
                <button
                  type="button"
                  suppressHydrationWarning
                  className="h-11 w-11 rounded-full flex items-center justify-center shadow-sm transition hover:brightness-95"
                  style={{ background: '#FFCC00', color: '#1a1035' }}
                  aria-label="Search"
                >
                  <SearchIcon className="h-5 w-5" strokeWidth={2.3} />
                </button>

                {/* Search input */}
                <input
                  type="text"
                  placeholder="Search name or domain…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  suppressHydrationWarning
                  className="h-11 rounded-2xl px-4 text-sm font-medium outline-none w-full max-w-[280px]"
                  style={{ background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(166,61,255,0.18)', color: '#2d1a50', boxShadow: '0 1px 4px rgba(103,2,191,0.05)' }}
                />

                {/* Status filter */}
                <div className="relative">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" suppressHydrationWarning className={selectCls} style={selectStyle}>
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="flagged">Flagged</option>
                    <option value="offline">Offline</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#a07ad0' }}>
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                </div>

                {/* Industry filter */}
                <div className="relative">
                  <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} aria-label="Filter by industry" suppressHydrationWarning className={`${selectCls} min-w-[130px]`} style={selectStyle}>
                    <option value="">Industry</option>
                    {industryOptions.map((industry) => (
                      <option key={industry} value={normalize(industry)}>{industry}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#a07ad0' }}>
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                </div>

                {/* Pending / approvals button */}
                <button
                  type="button"
                  onClick={() => router.push('/admindashboard/moderationCompliance')}
                  suppressHydrationWarning
                  className="relative h-11 w-11 rounded-full flex items-center justify-center transition hover:brightness-95"
                  style={{ background: 'rgba(166,61,255,0.08)', border: '1.5px solid rgba(166,61,255,0.18)', color: '#8b1fe8' }}
                  aria-label="Approval requests"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5a2.121 2.121 0 013 3L8 18l-4 1 1-4 11.5-11.5z" />
                  </svg>
                  {pendingTotal > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {pendingTotal}
                    </span>
                  )}
                </button>

                {/* Sort Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSortMenuOpen(!sortMenuOpen)}
                    className="h-11 w-11 rounded-full flex items-center justify-center transition hover:brightness-95 shadow-sm"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(166,61,255,0.18)', color: '#8b1fe8' }}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {sortMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setSortMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-12 z-30 w-48 rounded-2xl p-1.5 shadow-xl border border-[rgba(166,61,255,0.15)] origin-top-right"
                          style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(10px)' }}
                        >
                          {(['recent', 'oldest', 'az', 'za'] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => { setSortOption(opt); setSortMenuOpen(false); }}
                              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                              style={{
                                color: sortOption === opt ? '#7b1de8' : '#7a6aa0',
                                background: sortOption === opt ? 'rgba(123,29,232,0.08)' : 'transparent'
                              }}
                            >
                              {opt === 'recent' && 'Recently Created'}
                              {opt === 'oldest' && 'Oldest First'}
                              {opt === 'az' && 'Alphabetical (A-Z)'}
                              {opt === 'za' && 'Alphabetical (Z-A)'}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tab switcher */}
                <div className="ml-auto flex gap-1 rounded-xl p-1" style={{ border: '1px solid rgba(166,61,255,0.18)', background: 'rgba(255,255,255,0.7)' }}>
                  {(['websites', 'products'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTabChange(t)}
                      suppressHydrationWarning
                      className="px-6 py-2 text-sm font-semibold rounded-lg transition-colors capitalize"
                      style={activeTab === t
                        ? { background: '#FFCC00', color: '#1a1035' }
                        : { color: '#7a6aa0' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* ── Websites tab ─────────────────────────── */}
              {activeTab === 'websites' && (
                <motion.div
                  key="websites-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 xl:grid-cols-[480px_minmax(0,1fr)] gap-4 items-start"
                >
                  {/* Left: charts */}
                  {renderAnalyticsColumn()}

                  {/* Right: website cards */}
                  <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                    {loading ? (
                      <p className="text-sm" style={{ color: '#a090c8' }}>Loading websites…</p>
                    ) : uniqueFilteredWebsites.length === 0 ? (
                      <div className="rounded-2xl px-6 py-10 text-center" style={{ ...panelStyle }}>
                        <p className="text-sm font-medium" style={{ color: '#7a6aa0' }}>No websites found.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {uniqueFilteredWebsites.map((w) => {
                          const status = getWebsiteStatusMeta(w.status);
                          const viewUrl = websiteViewUrl(w.domainName);
                          const industry = websiteIndustryByDomain.get(w.domainName) || 'General';
                          const domainLabel = w.domainName || '—';
                          const ownerLabel = w.owner || 'Unknown';
                          const domainNameClass = domainLabel.length > 28 ? 'text-sm' : 'text-base';
                          const ownerNameClass = ownerLabel.length > 16 ? 'text-xs' : 'text-sm';

                          return (
                            <motion.article
                              key={`${w.userId}::${w.id}`}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden rounded-[20px] flex flex-col aspect-square min-h-[280px]"
                              style={{
                                border: '1px solid rgba(166,61,255,0.15)',
                                boxShadow: '0 4px 20px rgba(103,2,191,0.08)',
                                background: 'rgba(255,255,255,0.9)',
                              }}
                            >
                              {/* Thumbnail */}
                              <div className="relative flex-1 overflow-hidden flex items-center justify-center" style={{ borderBottom: `1px solid rgba(166,61,255,0.13)`, background: '#f0eeff' }}>
                                {w.thumbnail ? (
                                  <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
                                    <img src={w.thumbnail} alt={w.domainName} className="h-full w-full object-contain" loading="lazy" />
                                  </div>
                                ) : (
                                  <WebsitePreviewFallback domainName={w.domainName} />
                                )}
                                {/* Status badge */}
                                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                                  style={{ background: 'rgba(255,255,255,0.95)', color: '#4a1a8a', border: '1px solid rgba(166,61,255,0.15)' }}>
                                  <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                                  {status.label}
                                </span>
                                <span className="absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-[11px] font-medium z-10"
                                  style={{ background: 'rgba(255,255,255,0.9)', color: '#7a6aa0' }}>
                                  {industry}
                                </span>
                              </div>

                              {/* Card body */}
                              <div className="px-4 py-3 min-h-[108px] flex flex-col justify-between">
                                <p className={`${domainNameClass} font-bold truncate mb-3`} style={{ color: '#2d1a50' }} title={domainLabel}>{domainLabel}</p>
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1 max-w-[58%]">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#a090c8' }}>Publisher</p>
                                    <p className={`${ownerNameClass} font-semibold truncate block w-full`} style={{ color: '#4a1a8a' }} title={ownerLabel}>{ownerLabel}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                                      className="rounded-xl px-4 py-1.5 text-xs font-semibold transition hover:brightness-95"
                                      style={{ background: 'rgba(166,61,255,0.1)', color: '#7b1de8', border: '1px solid rgba(166,61,255,0.2)' }}>
                                      View
                                    </a>
                                    <button type="button" onClick={() => openWebsiteActionModal(w)}
                                      disabled={workingWebsiteKey === `${w.userId}::${w.id}`}
                                      className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                                      style={{ background: '#ef4444' }}>
                                      {workingWebsiteKey === `${w.userId}::${w.id}` ? 'Working…' : 'Dismiss'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Products tab ─────────────────────────── */}
              {activeTab === 'products' && (
                <motion.div
                  key="products-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 xl:grid-cols-[480px_minmax(0,1fr)] gap-4 items-start"
                >
                  {/* Left: charts (Now consistent with Website tab) */}
                  {renderAnalyticsColumn()}

                  <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                    {loading ? (
                      <p className="text-sm" style={{ color: '#a090c8' }}>Loading products…</p>
                    ) : sortedProducts.length === 0 ? (
                      <div className="rounded-2xl px-6 py-10 text-center" style={{ ...panelStyle }}>
                        <p className="text-sm font-medium" style={{ color: '#7a6aa0' }}>No products found.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                        {sortedProducts.map((p) => (
                          <motion.article
                            key={`${p.id}-${p.subdomain || 'site'}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden rounded-[20px] flex flex-col"
                            style={{
                              border: '1px solid rgba(166,61,255,0.15)',
                              boxShadow: '0 4px 20px rgba(103,2,191,0.08)',
                              background: 'rgba(255,255,255,0.9)',
                            }}
                          >
                            {/* Product image */}
                            <div className="relative h-52 overflow-hidden flex items-center justify-center" style={{ background: '#f0eeff' }}>
                              <Image
                                src={(Array.isArray(p.images) && p.images[0]) ? p.images[0] : PRODUCT_CARD_IMAGE}
                                alt={p.name || 'Product'}
                                fill sizes="300px"
                                className="object-contain p-3 scale-105"
                                unoptimized={Array.isArray(p.images) && !!p.images[0]}
                              />
                              <span className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold z-10"
                                style={{ background: '#FFCC00', color: '#1a1035' }}>
                                {p.subdomain || 'example.com'}
                              </span>
                              <span className="absolute right-2.5 bottom-2.5 rounded-full px-2 py-0.5 text-[10px] font-medium z-10"
                                style={{ background: 'rgba(255,255,255,0.9)', color: '#7a6aa0' }}>
                                {productIndustry(p)}
                              </span>
                            </div>

                            {/* Product info */}
                            <div className="px-4 py-3 flex flex-col gap-2 flex-1">
                              <div className="flex items-start gap-2">
                                <p className="text-sm font-bold leading-tight truncate flex-1" style={{ color: '#2d1a50' }}>{p.name || 'Product Name'}</p>
                                <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold whitespace-nowrap shrink-0"
                                  style={{ background: 'rgba(166,61,255,0.1)', color: '#7b1de8' }}>
                                  {p.subcategory || 'General'}
                                </span>
                              </div>
                              <p className="text-xs truncate" style={{ color: '#a090c8' }}>SKU: {p.sku || 'N/A'}</p>
                              <div className="flex items-center gap-2 mt-auto pt-1">
                                <button type="button" onClick={() => setSelectedProduct(p)}
                                  className="rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:brightness-95"
                                  style={{ background: 'rgba(166,61,255,0.1)', color: '#7b1de8', border: '1px solid rgba(166,61,255,0.2)' }}>
                                  View
                                </button>
                                <button type="button" onClick={() => openDeleteProductModal(p)}
                                  disabled={workingProductId === p.id}
                                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                                  style={{ background: '#ef4444' }}>
                                  {workingProductId === p.id ? 'Deleting…' : 'Delete'}
                                </button>
                                <span className="ml-auto text-xs font-semibold whitespace-nowrap" style={{ color: '#c89000' }}>
                                  {formatMoney(p.finalPrice ?? p.price)}
                                </span>
                              </div>
                            </div>
                          </motion.article>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Product details modal ─────────────────── */}
              <AnimatePresence>
                {selectedProduct && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={overlayStyle}>
                    <motion.div
                      initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.97, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="w-full max-w-2xl rounded-[24px] p-6"
                      style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(166,61,255,0.16)', boxShadow: '0 24px 56px rgba(103,2,191,0.14)' }}
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-xl font-bold" style={{ color: '#4a1a8a' }}>Product Details</h3>
                        <button type="button" onClick={() => setSelectedProduct(null)}
                          className="rounded-xl px-3 py-1.5 text-sm font-medium transition hover:brightness-95"
                          style={{ background: 'rgba(166,61,255,0.07)', color: '#7a6aa0', border: '1px solid rgba(166,61,255,0.12)' }}>
                          Close
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {[
                          ['Name', selectedProduct.name || '—'],
                          ['SKU', selectedProduct.sku || '—'],
                          ['Publisher', websiteBySubdomain.get(normalize(selectedProduct.subdomain))?.owner || 'Unknown'],
                          ['Website', selectedProduct.subdomain ? `${selectedProduct.subdomain}.localhost:3000` : '—'],
                          ['Category', productIndustry(selectedProduct)],
                          ['Status', selectedProduct.status || '—'],
                          ['Price', formatMoney(selectedProduct.finalPrice ?? selectedProduct.price)],
                          ['Variants', String(Array.isArray(selectedProduct.variants) ? selectedProduct.variants.length : 0)],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl p-3" style={insetStyle}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#a090c8' }}>{label}</p>
                            <p className="text-sm font-semibold" style={{ color: '#2d1a50' }}>{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-xl p-3" style={insetStyle}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#a090c8' }}>Description</p>
                        <p className="text-sm" style={{ color: '#4a1a8a' }}>{selectedProduct.description || 'No description'}</p>
                      </div>
                      <div className="mt-5 flex justify-end">
                        <button type="button" onClick={() => openDeleteProductModal(selectedProduct)}
                          className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                          style={{ background: '#ef4444' }}>
                          Delete Product
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* ── Website action modal ─────────────────── */}
              <AnimatePresence>
                {websiteActionModal.open && websiteActionModal.target && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={overlayStyle}>
                    <motion.div
                      initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.97, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full max-w-xl rounded-[24px] p-6"
                      style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(166,61,255,0.16)', boxShadow: '0 24px 56px rgba(103,2,191,0.14)' }}
                    >
                      <h3 className="text-xl font-bold mb-1" style={{ color: '#4a1a8a' }}>Moderate Website</h3>
                      <p className="text-sm mb-4" style={{ color: '#7a6aa0' }}>
                        Choose a moderation action for <span className="font-semibold" style={{ color: '#4a1a8a' }}>{websiteActionModal.target.domainName}</span>.
                      </p>
                      <div className="grid gap-2 mb-4">
                        {[
                          { action: 'take_down' as const, label: 'Take Down Website (Keep data)' },
                          { action: 'delete' as const, label: 'Delete Website (Move to trash)' },
                        ].map(({ action, label }) => (
                          <button key={action} type="button"
                            onClick={() => setWebsiteActionModal((prev) => ({ ...prev, action }))}
                            className="rounded-xl px-4 py-2.5 text-left text-sm font-medium transition"
                            style={websiteActionModal.action === action
                              ? action === 'delete'
                                ? { background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.3)', color: '#b91c1c' }
                                : { background: 'rgba(166,61,255,0.08)', border: '1.5px solid rgba(166,61,255,0.3)', color: '#4a1a8a' }
                              : { background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(166,61,255,0.12)', color: '#7a6aa0' }
                            }>
                            {label}
                          </button>
                        ))}
                      </div>
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a090c8' }}>Reason (required)</label>
                      <textarea
                        value={websiteActionModal.reason}
                        onChange={(e) => setWebsiteActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                        className="mt-1.5 w-full rounded-xl p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-[rgba(166,61,255,0.2)]"
                        style={{ background: 'rgba(248,245,255,0.9)', border: '1.5px solid rgba(166,61,255,0.16)', color: '#2d1a50' }}
                        rows={4} placeholder="State the moderation reason…"
                      />
                      <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={() => setWebsiteActionModal({ open: false, target: null, action: 'take_down', reason: '' })}
                          className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                          style={{ background: 'rgba(166,61,255,0.07)', color: '#7a6aa0', border: '1px solid rgba(166,61,255,0.12)' }}>
                          Cancel
                        </button>
                        <button type="button" onClick={submitWebsiteAction}
                          disabled={Boolean(websiteActionModal.target) && workingWebsiteKey === `${websiteActionModal.target.userId}::${websiteActionModal.target.id}`}
                          className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                          style={{ background: '#7b1de8' }}>
                          {Boolean(websiteActionModal.target) && workingWebsiteKey === `${websiteActionModal.target.userId}::${websiteActionModal.target.id}` ? 'Saving…' : 'Confirm Moderation'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* ── Product delete modal ─────────────────── */}
              <AnimatePresence>
                {productDeleteModal.open && productDeleteModal.target && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={overlayStyle}>
                    <motion.div
                      initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.97, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full max-w-xl rounded-[24px] p-6"
                      style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(166,61,255,0.16)', boxShadow: '0 24px 56px rgba(103,2,191,0.14)' }}
                    >
                      <h3 className="text-xl font-bold mb-1" style={{ color: '#4a1a8a' }}>Delete Product</h3>
                      <p className="text-sm mb-4" style={{ color: '#7a6aa0' }}>
                        Deleting <span className="font-semibold" style={{ color: '#4a1a8a' }}>{productDeleteModal.target.name || 'this product'}</span> will notify the client.
                      </p>
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a090c8' }}>Reason (required)</label>
                      <textarea
                        value={productDeleteModal.reason}
                        onChange={(e) => setProductDeleteModal((prev) => ({ ...prev, reason: e.target.value }))}
                        className="mt-1.5 w-full rounded-xl p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-[rgba(166,61,255,0.2)]"
                        style={{ background: 'rgba(248,245,255,0.9)', border: '1.5px solid rgba(166,61,255,0.16)', color: '#2d1a50' }}
                        rows={4} placeholder="State why this product is being deleted…"
                      />
                      <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={() => setProductDeleteModal({ open: false, target: null, reason: '' })}
                          className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                          style={{ background: 'rgba(166,61,255,0.07)', color: '#7a6aa0', border: '1px solid rgba(166,61,255,0.12)' }}>
                          Cancel
                        </button>
                        <button type="button" onClick={submitDeleteProduct}
                          disabled={Boolean(productDeleteModal.target) && workingProductId === productDeleteModal.target.id}
                          className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                          style={{ background: '#ef4444' }}>
                          {Boolean(productDeleteModal.target) && workingProductId === productDeleteModal.target.id ? 'Deleting…' : 'Delete and Notify'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* ── Toast ───────────────────────────────── */}
              <AnimatePresence>
                {toast.open && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
                    className="fixed bottom-6 right-6 z-[70] rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg"
                    style={{ background: toast.tone === 'error' ? '#dc2626' : '#16a34a' }}
                  >
                    {toast.message}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function WebsiteProductMonitoringPage() {
  return (
    <Suspense fallback={
      <div className="admin-dashboard-shell flex items-center justify-center min-h-screen">
        <p className="text-sm" style={{ color: '#a090c8' }}>Loading…</p>
      </div>
    }>
      <MonitoringPageContent />
    </Suspense>
  );
}