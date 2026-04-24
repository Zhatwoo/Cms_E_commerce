'use client';

import React, { useMemo, useState, useEffect, Suspense, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getDomainsManagement,
  getWebsiteAnalytics,
  listProducts,
  adminWebsiteAction,
  adminDeleteProduct,
  getStoredUser,
  type WebsiteManagementRow,
  type WebsiteAnalyticsData,
  type ApiProduct
} from '@/lib/api';
import { ChevronDownIcon, SearchIcon } from '@/lib/icons/adminIcons';
import { addNotification } from '@/lib/notifications';
import { formatToPHTimeShort } from '@/lib/dateUtils';
import { getWebsiteStatusMeta } from '@/lib/utils/adminStatus';
import { INDUSTRY_OPTIONS, normalizeIndustryKey } from '@/lib/industryCatalog';
import { useAdminLoading } from '../components/LoadingProvider';
import { AdminPageHero } from '../components/AdminPageHero';
import {
  BookOpen,
  Car,
  Dumbbell,
  Gem,
  HeartPulse,
  Home,
  Monitor,
  Package,
  Shirt,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Eye,
  AlertCircle,
  ShieldAlert,
  Edit3,
  ExternalLink,
  FileText,
  AlertTriangle,
} from 'lucide-react';

const AdminSidebar = dynamic(() => import('../components/sidebar').then((mod) => mod.AdminSidebar), { ssr: false });
const AdminHeader = dynamic(() => import('../components/header').then((mod) => mod.AdminHeader), { ssr: false });

type MonitoringTab = 'websites' | 'products';
type SortOption = 'recent' | 'oldest' | 'az' | 'za' | 'price_high' | 'price_low';
type ToastTone = 'success' | 'error';

const WEBSITE_SORT_OPTIONS = [
  { id: 'recent' as const, label: 'Recently Created' },
  { id: 'oldest' as const, label: 'Oldest First' },
  { id: 'az' as const, label: 'Alphabetical (A–Z)' },
  { id: 'za' as const, label: 'Alphabetical (Z–A)' },
];

const PRODUCT_SORT_OPTIONS = [
  ...WEBSITE_SORT_OPTIONS,
  { id: 'price_high' as const, label: 'Highest Price' },
  { id: 'price_low' as const, label: 'Lowest Price' },
];

const SORT_OPTIONS_BY_TAB: Record<MonitoringTab, typeof WEBSITE_SORT_OPTIONS | typeof PRODUCT_SORT_OPTIONS> = {
  websites: WEBSITE_SORT_OPTIONS,
  products: PRODUCT_SORT_OPTIONS,
};

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

function industryIcon(label: string): React.ReactElement {
  const key = normalize(label);
  let Icon = Package;

  if (/computer|laptop|tech|electronic|phone|gadget/.test(key)) Icon = Monitor;
  else if (/cloth|fashion|apparel|wear|shirt/.test(key)) Icon = Shirt;
  else if (/beauty|cosmetic|skin|makeup|fragrance/.test(key)) Icon = Sparkles;
  else if (/home|furniture|decor|kitchen/.test(key)) Icon = Home;
  else if (/book|stationery|office/.test(key)) Icon = BookOpen;
  else if (/food|grocery|drink|snack|restaurant/.test(key)) Icon = UtensilsCrossed;
  else if (/health|medical|wellness/.test(key)) Icon = HeartPulse;
  else if (/sport|fitness|gym/.test(key)) Icon = Dumbbell;
  else if (/auto|car|motor/.test(key)) Icon = Car;
  else if (/jewel|luxury|watch/.test(key)) Icon = Gem;
  else if (/toy|kid|baby/.test(key)) Icon = ShoppingBag;

  return <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />;
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

function websiteAnalyticsKeys(website: WebsiteManagementRow): string[] {
  const keys = new Set<string>();

  if (website.id) keys.add(String(website.id).trim());
  if (website.projectId) keys.add(String(website.projectId).trim());

  const domainName = normalize(website.domainName);
  if (domainName.includes('.')) {
    const subdomain = subdomainFromDomain(domainName);
    if (subdomain) keys.add(subdomain);
  }

  return Array.from(keys).filter(Boolean);
}

function pickWebsiteAnalytics(
  website: WebsiteManagementRow,
  analyticsMap: Record<string, WebsiteAnalyticsData>
): WebsiteAnalyticsData | undefined {
  let best: WebsiteAnalyticsData | undefined;

  for (const key of websiteAnalyticsKeys(website)) {
    const candidate = analyticsMap[key];
    if (!candidate) continue;
    if (!best || (candidate.views || 0) > (best.views || 0)) {
      best = candidate;
    }
  }

  return best;
}

const PRODUCT_CARD_IMAGE = '/images/template-fashion.jpg';

/* ── Website Preview Thumbnail ──────────────────────────────── */
type WebsitePreviewThumbnailProps = {
  domainName: string;
  borderColor: string;
  bgColor: string;
  className?: string;
};

export function WebsitePreviewThumbnail({ domainName, borderColor, bgColor, className = '' }: WebsitePreviewThumbnailProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [frameError, setFrameError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domainName) return;
    const sub = subdomainFromDomain(domainName);
    if (!sub) return;
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setPreviewUrl(isLocal ? `http://${sub}.localhost:3000` : `https://${sub}.zhatwoo.com`);
    }
  }, [domainName]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const cssToInject = `
    .cart-drawer, .shopping-cart, #checkout-button, .checkout-btn, .add-to-cart, .cart-icon, .cart-node, [id*="cart"], [class*="cart"] { display: none !important; }
    header { padding-top: 5px !important; padding-bottom: 5px !important; }
    footer { display: none !important; }
    * { pointer-events: none !important; }
  `;

  const fallback = (
    <div className={`flex items-center justify-center text-[11px] font-medium ${className}`}
      style={{ background: bgColor, border: `1px solid ${borderColor}`, color: '#a090c8' }}>
      {frameError ? 'No preview available' : 'Loading preview…'}
    </div>
  );

  if (!previewUrl || frameError || !isInView) {
    return <div ref={containerRef} className={className}>{fallback}</div>;
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`} style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
      <iframe
        src={previewUrl}
        title={`Preview of ${domainName}`}
        className="absolute inset-0 h-[400%] w-[400%] origin-top-left border-none"
        style={{ transform: 'scale(0.25)', pointerEvents: 'none' }}
        sandbox="allow-same-origin allow-scripts"
        onError={() => setFrameError(true)}
        onLoad={(e) => {
          try {
            const ifr = e.currentTarget as HTMLIFrameElement;
            const doc = ifr.contentDocument || ifr.contentWindow?.document;
            if (doc) {
              const styleTag = doc.createElement('style');
              styleTag.textContent = cssToInject;
              doc.head.appendChild(styleTag);
            }
          } catch { 
            // Silent catch for cross-origin. We expected this.
          }
        }}
      />
    </div>
  );
}

const MemoizedWebsitePreviewThumbnail = React.memo(WebsitePreviewThumbnail);

/* ── Card Components ────────────────────────────────────────── */
type WebsiteCardProps = {
  w: WebsiteManagementRow;
  viewUrl: string;
  industry: string;
  workingWebsiteKey: string | null;
  openWebsiteActionModal: (w: WebsiteManagementRow) => void;
  analytics?: WebsiteAnalyticsData;
};

const WebsiteCard = React.memo(({ w, viewUrl, industry, workingWebsiteKey, openWebsiteActionModal, analytics }: WebsiteCardProps) => {
  const statusMeta = getWebsiteStatusMeta(w.status);
  const domainLabel = w.domainName || '—';
  const ownerLabel = w.owner || 'Unknown';
  const isWorking = workingWebsiteKey === `${w.userId}::${w.id}`;
  const isPublished = normalize(w.status) === 'published';

  // Use real analytics or default to 0
  const stats = {
    views: w.views ?? analytics?.views ?? 0,
    errors: w.errors ?? analytics?.errors ?? 0,
    reports: w.reports ?? analytics?.reports ?? 0,
  };

  const statusColors = {
    published: { bg: 'rgba(16,185,129,0.08)', text: '#10B981', dot: '#10B981' },
    flagged: { bg: 'rgba(255,67,67,0.08)', text: '#FF4343', dot: '#FF4343' },
    draft: { bg: 'rgba(255,204,0,0.08)', text: '#FFCC00', dot: '#FFCC00' },
  };

  const currentStatus = (normalize(w.status) in statusColors) 
    ? statusColors[normalize(w.status) as keyof typeof statusColors] 
    : statusColors.draft;

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="group relative overflow-hidden rounded-[28px] flex flex-col min-h-[340px]"
      style={{ 
        border: '1.5px solid rgba(166,61,255,0.12)', 
        boxShadow: '0 8px 30px rgba(103,2,191,0.06)', 
        background: 'linear-gradient(135deg, #ffffff 0%, #f9f8ff 100%)' 
      }}
    >
      {/* Thumbnail Area with Hover Actions */}
      <div className="relative h-44 overflow-hidden" style={{ background: '#f5f4ff' }}>
        {w.thumbnail ? (
          <img src={w.thumbnail} alt={w.domainName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
        ) : (
          <MemoizedWebsitePreviewThumbnail 
            domainName={w.domainName}
            borderColor="transparent" 
            bgColor="rgba(240,235,255,0.5)" 
            className="h-full w-full transition-transform duration-700 group-hover:scale-105" 
          />
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-[#4a1a8a]/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-center justify-center gap-3">
          <motion.a
            whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
            href={viewUrl} target="_blank" rel="noopener noreferrer"
            className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#4a1a8a] shadow-xl"
            title="View Site"
          >
            <Eye className="h-5 w-5" />
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
            onClick={() => openWebsiteActionModal(w)}
            className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#FF4343] shadow-xl"
            title="Suspend / Take Down"
          >
            <ShieldAlert className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
            className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#7b1de8] shadow-xl"
            title="Edit Settings"
          >
            <Edit3 className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Status Badge */}
        <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-md"
          style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(166,61,255,0.1)' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: currentStatus.dot }} />
          <span style={{ color: currentStatus.text }}>{statusMeta.label}</span>
        </div>

        {/* Industry Tag */}
        <div className="absolute bottom-4 left-4 z-10 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest"
          style={{ background: 'rgba(74, 26, 138, 0.8)', color: 'white', backdropFilter: 'blur(4px)' }}>
          {industry}
        </div>
      </div>

      {/* Info Area */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-base font-black tracking-tight truncate flex-1" style={{ color: '#2d1a50' }} title={domainLabel}>
              {domainLabel}
            </h4>
            <div className="shrink-0 h-2 w-2 rounded-full" style={{ background: 'rgba(166,61,255,0.3)' }} />
          </div>
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-1" style={{ color: '#7a6aa0' }}>
            {ownerLabel}
          </p>
        </div>

        {/* Stats Row - Only show for published websites */}
        {isPublished && (
          <div className="mt-auto grid grid-cols-3 gap-2 px-2 py-3 rounded-2xl bg-[rgba(166,61,255,0.03)] border border-[rgba(166,61,255,0.06)]">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-[#7b1de8] opacity-60">
                <Eye className="h-3 w-3" />
                <span className="text-[8px] font-black uppercase">Views</span>
              </div>
              <span className="text-xs font-black" style={{ color: '#4a1a8a' }}>{stats.views.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-x border-[rgba(166,61,255,0.1)]">
              <div className="flex items-center gap-1 text-[#FFCC00]">
                <AlertCircle className="h-3 w-3" />
                <span className="text-[8px] font-black uppercase">Errors</span>
              </div>
              <span className="text-xs font-black" style={{ color: '#4a1a8a' }}>{stats.errors}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-[#FF4343]">
                <FileText className="h-3 w-3" />
                <span className="text-[8px] font-black uppercase">Reports</span>
              </div>
              <span className="text-xs font-black" style={{ color: stats.reports > 0 ? '#FF4343' : '#4a1a8a' }}>{stats.reports}</span>
            </div>
          </div>
        )}

        {/* Footer Meta */}
        {w.createdAt && (
          <div className="mt-4 flex items-center justify-between text-[9px] font-bold opacity-40 uppercase tracking-wider" style={{ color: '#7a6aa0' }}>
            <span>Created {formatToPHTimeShort(w.createdAt).split(',')[0]}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </div>
        )}
      </div>
    </motion.article>
  );
});

type ProductCardProps = {
  p: ApiProduct;
  workingProductId: string | null;
  setSelectedProduct: (p: ApiProduct) => void;
  openDeleteProductModal: (p: ApiProduct) => void;
};

const ProductCard = React.memo(({ p, isSuspicious, suspiciousReasons, workingProductId, setSelectedProduct, openDeleteProductModal }: { 
  p: ApiProduct; 
  isSuspicious: boolean; 
  suspiciousReasons: string[];
  workingProductId: string | null;
  setSelectedProduct: (p: ApiProduct) => void;
  openDeleteProductModal: (p: ApiProduct) => void;
}) => {
  const isWorking = workingProductId === p.id;
  const status = normalize(p.status || 'draft');
  const isFlagged = status === 'flagged' || isSuspicious;
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`relative overflow-hidden rounded-[28px] flex flex-col group transition-all duration-300 ${isFlagged ? 'border-[#FF4343]/30' : 'border-[rgba(166,61,255,0.12)]'}`}
      style={{ 
        borderWidth: '1.5px',
        boxShadow: isFlagged ? '0 8px 30px rgba(255,67,67,0.06)' : '0 8px 30px rgba(103,2,191,0.06)', 
        background: isFlagged ? 'linear-gradient(135deg, #fffafa 0%, #fff 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f9f8ff 100%)' 
      }}
    >
      {/* Product Image Section */}
      <div className="relative h-56 overflow-hidden flex items-center justify-center" style={{ background: isFlagged ? '#fff5f5' : '#f5f4ff' }}>
        <Image src={(Array.isArray(p.images) && p.images[0]) ? p.images[0] : PRODUCT_CARD_IMAGE}
          alt={p.name || 'Product'} fill sizes="320px"
          className="object-contain p-4 transition-transform duration-700 group-hover:scale-110"
          unoptimized={Array.isArray(p.images) && !!p.images[0]} />
        
        {/* Status & Flag Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-md"
            style={{ background: '#FFCC00', color: '#1a1035' }}>
            {p.subdomain || 'example.com'}
          </span>
          {isFlagged && (
            <motion.span 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5"
              style={{ background: '#FF4343', color: 'white' }}>
              <ShieldAlert className="h-3 w-3" />
              Suspicious
            </motion.span>
          )}
        </div>

        {/* Hover Actions Overlay */}
        <div className="absolute inset-0 bg-[#4a1a8a]/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedProduct(p)}
            className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#4a1a8a] shadow-xl"
            title="View Details"
          >
            <Eye className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
            onClick={() => openDeleteProductModal(p)}
            className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#FF4343] shadow-xl"
            title="Delete / Take Down"
          >
            <ShieldAlert className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="absolute right-4 bottom-4 z-10 rounded-lg px-2 py-0.5 text-[9px] font-bold"
          style={{ background: 'rgba(255,255,255,0.92)', color: '#7a6aa0', border: '1px solid rgba(166,61,255,0.1)' }}>
          {productIndustry(p)}
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h4 className="text-sm font-black tracking-tight leading-tight truncate flex-1" style={{ color: '#2d1a50' }}>{p.name || 'Product Name'}</h4>
          <span className="text-xs font-black shrink-0" style={{ color: '#c89000' }}>
            {formatMoney(p.finalPrice ?? p.price)}
          </span>
        </div>
        
        <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-3" style={{ color: '#7a6aa0' }}>SKU: {p.sku || 'N/A'}</p>

        {isFlagged && suspiciousReasons.length > 0 && (
          <div className="mb-4 space-y-1">
            {suspiciousReasons.map((reason, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px] font-bold text-[#FF4343] uppercase tracking-tighter">
                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer Meta */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[rgba(166,61,255,0.06)]">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${status === 'published' ? 'bg-[#00C438]' : 'bg-[#B2AEBF]'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60" style={{ color: '#4a1a8a' }}>{status}</span>
          </div>
          {p.createdAt && (
            <span className="text-[9px] font-black opacity-30 tracking-wider">
              {formatToPHTimeShort(p.createdAt).split(',')[0]}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
});


WebsiteCard.displayName = 'WebsiteCard';
ProductCard.displayName = 'ProductCard';

/* ── Empty State ────────────────────────────────────────────── */
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

const overlayStyle: React.CSSProperties = {
  background: 'rgba(200,185,245,0.38)',
  backdropFilter: 'blur(4px)',
};

/* ── Empty State ────────────────────────────────────────────── */
function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="rounded-2xl px-6 py-14 text-center" style={panelStyle}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'rgba(166,61,255,0.08)' }}>
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#c4a8e8' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-medium" style={{ color: '#7a6aa0' }}>{message}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#a090c8' }}>{sub}</p>}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
function MonitoringPageContent() {
  const { startLoading, stopLoading } = useAdminLoading();
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
  const [websiteAnalytics, setWebsiteAnalytics] = useState<Record<string, WebsiteAnalyticsData>>({});
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [workingWebsiteKey, setWorkingWebsiteKey] = useState<string | null>(null);
  const [workingProductId, setWorkingProductId] = useState<string | null>(null);
  const hiddenWebsiteDomainsRef = useRef<Set<string>>(new Set());
  const hiddenProductIdsRef = useRef<Set<string>>(new Set());
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
      const nextWebsites = domainRes.success && Array.isArray(domainRes.data) ? domainRes.data : [];
      const nextProducts = productRes.success && Array.isArray(productRes.items) ? productRes.items : [];

      // Keep deleted items hidden even if a stale refresh response arrives right after moderation.
      const hiddenWebsiteDomains = hiddenWebsiteDomainsRef.current;
      const hiddenProductIds = hiddenProductIdsRef.current;

      const filteredWebsites = nextWebsites.filter((w) => !hiddenWebsiteDomains.has(normalize(w.domainName)));
      setWebsites(filteredWebsites);
      setProducts(nextProducts.filter((p) => !hiddenProductIds.has(p.id)));

      // Fetch analytics for all websites
      if (filteredWebsites.length > 0) {
        const domainIds = Array.from(new Set(filteredWebsites.flatMap((w) => websiteAnalyticsKeys(w))));
        const analyticsRes = await getWebsiteAnalytics(domainIds);
        if (analyticsRes.success && analyticsRes.analytics) {
          setWebsiteAnalytics(analyticsRes.analytics);
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh monitoring data every 30 seconds for real-time accuracy
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);

    const onDataChanged = () => loadData(true);
    const onFocus = () => loadData(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };
    window.addEventListener('admin:data_changed', onDataChanged);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('admin:data_changed', onDataChanged);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (loading) startLoading();
    else stopLoading();

    return () => {
      stopLoading();
    };
  }, [loading, startLoading, stopLoading]);

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

  const pendingWebsiteCount = useMemo(() => uniqueWebsites.filter((w) => isPendingWebsite(w.status)).length, [uniqueWebsites]);
  const pendingProductCount = useMemo(() => products.filter((p) => isPendingProduct(p.status || '')).length, [products]);
  const pendingTotal = pendingWebsiteCount + pendingProductCount;

  const filteredWebsites = useMemo(() => {
    const q = normalize(search);
    return uniqueWebsites.filter((w) => {
      const matchSearch = !q || normalize(w.domainName).includes(q) || normalize(w.owner).includes(q);
      const matchStatus = !statusFilter || normalize(w.status) === statusFilter;
      const matchIndustry = !industryFilter || normalizeIndustryKey(w.plan) === industryFilter;
      return matchSearch && matchStatus && matchIndustry;
    });
  }, [uniqueWebsites, search, statusFilter, industryFilter]);

  const uniqueFilteredWebsites = useMemo(() => {
    const seen = new Set<string>();
    const unique = filteredWebsites.filter((w) => {
      const key = `${w.userId}::${w.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (sortOption === 'az') unique.sort((a, b) => a.domainName.localeCompare(b.domainName));
    else if (sortOption === 'za') unique.sort((a, b) => b.domainName.localeCompare(a.domainName));
    else if (sortOption === 'recent') unique.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    else if (sortOption === 'oldest') unique.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    return unique;
  }, [filteredWebsites, sortOption]);

  const analyticsByWebsiteKey = useMemo(() => {
    const result = new Map<string, WebsiteAnalyticsData>();

    uniqueWebsites.forEach((website) => {
      const analytics = pickWebsiteAnalytics(website, websiteAnalytics);
      if (analytics) {
        result.set(`${website.userId}::${website.id}`, analytics);
      }
    });

    return result;
  }, [uniqueWebsites, websiteAnalytics]);

  const suspiciousProductData = useMemo(() => {
    const nameCounts = new Map<string, number>();
    products.forEach(p => {
      const n = (p.name || '').trim().toLowerCase();
      if (n) nameCounts.set(n, (nameCounts.get(n) || 0) + 1);
    });

    const result = new Map<string, { isSuspicious: boolean; reasons: string[] }>();
    products.forEach(p => {
      const reasons: string[] = [];
      const price = p.finalPrice ?? p.price ?? 0;
      const name = (p.name || '').trim().toLowerCase();

      if (price < 10) reasons.push('Low Price (<10 PHP)');
      if (!Array.isArray(p.images) || p.images.length === 0 || !p.images[0]) reasons.push('Missing Image');
      if (name && (nameCounts.get(name) || 0) > 1) reasons.push('Duplicate Name');

      result.set(p.id, { isSuspicious: reasons.length > 0, reasons });
    });
    return result;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = normalize(search);
    return products.filter((p) => {
      const matchFocused = !focusedProductId || p.id === focusedProductId;
      const matchSearch = !q || normalize(p.name).includes(q) || normalize(p.sku).includes(q) || normalize(p.subdomain).includes(q);
      
      const sData = suspiciousProductData.get(p.id);
      const isAutoFlagged = sData?.isSuspicious || false;
      const effectiveStatus = normalize(p.status || '');

      let matchStatus = true;
      if (statusFilter === 'flagged') {
        matchStatus = effectiveStatus === 'flagged' || isAutoFlagged;
      } else if (statusFilter === 'normal') {
        matchStatus = effectiveStatus === 'published' && !isAutoFlagged;
      } else if (statusFilter) {
        matchStatus = effectiveStatus === statusFilter;
      }

      const matchIndustry = !industryFilter || normalizeIndustryKey(productIndustry(p)) === industryFilter;
      return matchFocused && matchSearch && matchStatus && matchIndustry;
    });
  }, [products, focusedProductId, search, statusFilter, industryFilter, suspiciousProductData]);

  const sortedProducts = useMemo(() => {
    const copy = [...filteredProducts];
    if (sortOption === 'az') copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortOption === 'za') copy.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    else if (sortOption === 'recent') copy.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    else if (sortOption === 'oldest') copy.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    else if (sortOption === 'price_high') copy.sort((a, b) => (b.finalPrice ?? b.price ?? 0) - (a.finalPrice ?? a.price ?? 0));
    else if (sortOption === 'price_low') copy.sort((a, b) => (a.finalPrice ?? a.price ?? 0) - (b.finalPrice ?? b.price ?? 0));
    return copy;
  }, [filteredProducts, sortOption]);

  const industryOptions = useMemo(() => {
    const seenKeys = new Set<string>();

    const collectIndustryKeys = (raw?: string | null) => {
      const key = normalizeIndustryKey(raw);
      if (key) seenKeys.add(key);
    };

    products.forEach((p) => collectIndustryKeys(productIndustry(p)));
    uniqueWebsites.forEach((w) => collectIndustryKeys(w.plan));

    return INDUSTRY_OPTIONS.filter((option) => seenKeys.has(option.key)).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
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
    uniqueWebsites.forEach((website) => {
      const subdomain = subdomainFromDomain(website.domainName);
      const bucket = bySubdomain.get(subdomain);
      if (!bucket) { result.set(website.domainName, 'General'); return; }
      const best = Object.entries(bucket).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
      result.set(website.domainName, best);
    });
    return result;
  }, [products, uniqueWebsites]);

  const websiteBySubdomain = useMemo(() => {
    const map = new Map<string, WebsiteManagementRow>();
    websites.forEach((w) => {
      const sub = subdomainFromDomain(w.domainName);
      if (sub) map.set(sub, w);
    });
    return map;
  }, [websites]);

  const websiteChartData = useMemo(() => {
    const published = uniqueWebsites.filter((w) => normalize(w.status) === 'published').length;
    const offline = uniqueWebsites.filter((w) => ['offline', 'suspended'].includes(normalize(w.status))).length;
    const draft = uniqueWebsites.filter((w) => ['draft', 'pending'].includes(normalize(w.status))).length;
    return [{ label: 'Published', value: published }, { label: 'Offline', value: offline }, { label: 'Draft', value: draft }];
  }, [uniqueWebsites]);

  const productChartData = useMemo(() => {
    const counts = new Map<string, number>();

    products.forEach((product) => {
      const raw = productIndustry(product);
      const label = (raw || 'General').trim() || 'General';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        return a.label.localeCompare(b.label);
      });
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
      const s = normalize((item as any).status || '');
      if (s === 'published') day.p++;
      else if (['offline', 'suspended'].includes(s)) day.o++;
      else if (['draft', 'pending'].includes(s)) day.d++;
      daysMap.set(dateStr, day);
    });
    return Array.from(daysMap.entries())
      .sort((a, b) => b[1].rawDate.getTime() - a[1].rawDate.getTime())
      .slice(0, 3).reverse()
      .map(([date, counts]) => ({ date, ...counts }));
  }, [activeTab, uniqueWebsites, products]);

  const maxStatusVal = useMemo(() => {
    const ds = activeTab === 'websites' ? websiteChartData : productChartData;
    return Math.max(...ds.map(d => d.value), 1);
  }, [activeTab, websiteChartData, productChartData]);

  const maxFlaggedVal = useMemo(() => Math.max(...flaggedChartData.map(d => d.value), 1), [flaggedChartData]);
  const maxHistVal = useMemo(() => Math.max(...historicalChartData.flatMap(h => [h.p, h.o, h.d]), 1), [historicalChartData]);

  const handleTabChange = (tab: MonitoringTab) => {
    if (tab === activeTab) return;
    startLoading();
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('tab', tab);
    router.replace(`/admindashboard/monitoring?${nextParams.toString()}`, { scroll: false });
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
      const adminUser = getStoredUser();
      const adminName = adminUser ? (adminUser.name || adminUser.username || 'Admin') : 'Admin';
      await addNotification(
        `Website ${actionLabel}`,
        `${website.domainName} was ${actionLabel.toLowerCase()} by ${adminName}. Reason: ${reason}`,
        websiteActionModal.action === 'take_down' ? 'warning' : 'error',
        {
          details: `Website: ${website.domainName}\nPublisher: ${website.owner || 'Unknown'}\nAction: ${websiteActionModal.action === 'take_down' ? 'Take Down Website' : 'Delete Website'}\nReason: ${reason}`,
          metadata: { action: websiteActionModal.action, domain: website.domainName, publisher: website.owner || 'Unknown', reason },
        }
      );
      setToast({ open: true, message: res.message || 'Website updated.', tone: 'success' });
      hiddenWebsiteDomainsRef.current.add(normalize(website.domainName));
      setWebsites((prev) => prev.filter((w) => `${w.userId}::${w.id}` !== key && normalize(w.domainName) !== normalize(website.domainName)));
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
      const adminUser = getStoredUser();
      const adminName = adminUser ? (adminUser.name || adminUser.username || 'Admin') : 'Admin';
      await addNotification(
        'Product Deleted',
        `${product.name || 'Untitled Product'} was deleted by ${adminName}. Reason: ${reason}`,
        'error',
        {
          details: `Product: ${product.name || 'Untitled Product'}\nSKU: ${product.sku || 'N/A'}\nWebsite: ${product.subdomain || 'N/A'}\nReason: ${reason}`,
          metadata: { productId: product.id, sku: product.sku || 'N/A', website: product.subdomain || 'N/A', reason },
        }
      );
      hiddenProductIdsRef.current.add(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      if (selectedProduct?.id === product.id) setSelectedProduct(null);
      setProductDeleteModal({ open: false, target: null, reason: '' });
      setToast({ open: true, message: 'Product deleted and client notified.', tone: 'success' });
    } catch (error) {
      setToast({ open: true, message: error instanceof Error ? error.message : 'Failed to delete product', tone: 'error' });
    } finally { setWorkingProductId(null); }
  };

  /* ── Analytics Column ───────────────────────────────────── */
  const renderAnalyticsColumn = () => {
    const statusData = activeTab === 'websites' ? websiteChartData : productChartData;
    const title = activeTab === 'websites' ? 'Total Websites' : 'Products by Industry';
    const isProductsView = activeTab === 'products';
    const productAxisMax = Math.max(5, Math.ceil(maxStatusVal / 5) * 5);
    const yAxisLabels = isProductsView
      ? [productAxisMax, Math.round(productAxisMax * 0.8), Math.round(productAxisMax * 0.6), Math.round(productAxisMax * 0.4), Math.round(productAxisMax * 0.2), 0]
      : [40, 32, 24, 16, 8, 0];

    return (
      <div className="space-y-4">
        <section className="rounded-[24px] p-6 transition-all duration-300" style={panelStyle}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold" style={{ color: '#4a1a8a' }}>{title}</h3>
            <button type="button" onClick={() => setIsExpanded(!isWebsitesExpanded)}
              className="text-sm font-semibold transition-colors hover:opacity-80" style={{ color: '#a07ad0' }}>
              {isWebsitesExpanded ? 'View Less' : 'View More'}
            </button>
          </div>

          <div className={`rounded-2xl p-4 transition-all duration-300 ${isWebsitesExpanded ? 'h-52' : 'h-40'}`} style={insetStyle}>
            <div className="flex h-full items-end gap-4">
              {isWebsitesExpanded ? (
                <>
                  <div className="flex flex-col justify-between items-end h-[85%] text-[10px] font-bold w-5 pb-5" style={{ color: '#a090c8' }}>
                    {yAxisLabels.map((v) => <span key={String(v)}>{v}</span>)}
                  </div>
                  <div className={`flex-1 flex h-full items-end relative ${isProductsView ? 'justify-start gap-4 overflow-x-auto overflow-y-visible px-3' : 'justify-around gap-6'}`}
                    style={{ borderLeft: '1px solid rgba(160,144,200,0.15)', borderBottom: '1px solid rgba(160,144,200,0.15)' }}>
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-2">
                      {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full" style={{ borderTop: '1px solid rgba(160,144,200,0.08)' }} />)}
                    </div>
                    {statusData.map((d, idx) => (
                      <div
                        key={`${d.label}-${idx}`}
                        className={`flex h-full flex-col items-center justify-end gap-3 z-10 group relative ${isProductsView ? 'w-11 shrink-0' : 'w-full'}`}
                      >
                        <div className="absolute -top-10 px-2 py-1 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md whitespace-nowrap z-20" style={{ background: '#4a1a8a' }}>
                          {isProductsView ? `${d.label}: ${d.value}` : d.value}
                        </div>
                        <span className="text-[10px] font-bold leading-none" style={{ color: '#4a1a8a' }}>{d.value}</span>
                        <div
                          className={`w-full rounded-t-lg cursor-pointer ${isProductsView ? 'max-w-[14px]' : 'max-w-[36px]'}`}
                          style={{ height: getBarHeight(d.value, isProductsView ? productAxisMax : Math.max(maxStatusVal, 40)), background: 'linear-gradient(180deg, #a855f7, #7b1de8)' }}
                          title={isProductsView ? `${d.label}: ${d.value}` : String(d.value)}
                          aria-label={isProductsView ? `${d.label}: ${d.value}` : `${d.value}`}
                        />
                        {isProductsView ? (
                          <span
                            className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full"
                            style={{ color: '#7a6aa0', border: '1px solid rgba(166,61,255,0.2)', background: 'rgba(255,255,255,0.88)' }}
                            title={d.label}
                            aria-label={d.label}
                          >
                            {industryIcon(d.label)}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-center" style={{ color: '#7a6aa0' }}>
                            {d.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={`flex h-full w-full items-end ${isProductsView ? 'justify-start gap-4 overflow-x-auto overflow-y-visible px-3' : 'justify-between gap-3'}`}>
                  {statusData.map((d, idx) => (
                    <div
                      key={`${d.label}-${idx}`}
                      className={`flex h-full flex-col items-center justify-end gap-3 group relative ${isProductsView ? 'w-11 shrink-0' : 'w-full'}`}
                    >
                      <div className="absolute -top-10 px-2 py-1 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md whitespace-nowrap z-20" style={{ background: '#4a1a8a' }}>
                        {isProductsView ? `${d.label}: ${d.value}` : d.value}
                      </div>
                      <span className="text-[10px] font-bold leading-none" style={{ color: '#4a1a8a' }}>{d.value}</span>
                      <div
                        className={`w-full rounded-t-lg cursor-pointer ${isProductsView ? 'max-w-[14px]' : ''}`}
                        style={{ height: getBarHeight(d.value, maxStatusVal), background: 'linear-gradient(180deg, #a855f7, #7b1de8)' }}
                        title={isProductsView ? `${d.label}: ${d.value}` : String(d.value)}
                        aria-label={isProductsView ? `${d.label}: ${d.value}` : `${d.value}`}
                      />
                      {isProductsView ? (
                        <span
                          className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full"
                          style={{ color: '#7a6aa0', border: '1px solid rgba(166,61,255,0.2)', background: 'rgba(255,255,255,0.88)' }}
                          title={d.label}
                          aria-label={d.label}
                        >
                          {industryIcon(d.label)}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-center" style={{ color: '#7a6aa0' }}>
                          {d.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isWebsitesExpanded && (
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(166,61,255,0.1)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#a090c8' }}>Previous Month</h4>
              <div className="h-40 relative mb-3">
                <div className="absolute left-0 bottom-5 top-0 w-5 flex flex-col justify-between text-[10px] font-bold items-end pr-1.5" style={{ color: '#a090c8' }}>
                  {['100', '80', '60', '40', '20', '0'].map(v => <span key={v}>{v}</span>)}
                </div>
                <div className="ml-7 h-full flex items-end justify-around relative"
                  style={{ borderBottom: '1px solid rgba(160,144,200,0.15)', borderLeft: '1px solid rgba(160,144,200,0.15)' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="absolute left-0 right-0" style={{ borderTop: '1px solid rgba(160,144,200,0.08)', bottom: `${i * 20}%` }} />
                  ))}
                  {historicalChartData.length === 0 ? (
                    <p className="text-[10px] absolute inset-0 flex items-center justify-center" style={{ color: '#a090c8' }}>No historical data</p>
                  ) : historicalChartData.map((hist, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 w-full h-full justify-end">
                      <div className="flex items-end gap-0.5 h-[85%] mb-1">
                        {[{ val: hist.p, bg: '#a855f7' }, { val: hist.o, bg: '#f87171' }, { val: hist.d, bg: '#34d399' }].map(({ val, bg }, ci) => (
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
                    style={{ height: getBarHeight(d.value, maxFlaggedVal), background: 'linear-gradient(180deg, #fb923c, #ef4444)' }} />
                  <span className="text-[11px] font-medium" style={{ color: '#7a6aa0' }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  };

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
              <AdminSidebar mobile onClose={() => setSidebarOpen(false)}
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

              <AdminPageHero
                title="Website & Product Monitoring"
                subtitle="Track performance and status for all active digital entities."
              />

              {/* Toolbar */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
                className="mb-6 flex flex-wrap items-center gap-3">

                <div className="relative w-full max-w-[280px]">
                  <input type="text" placeholder="Search name or domain…" value={search}
                    onChange={(e) => setSearch(e.target.value)} suppressHydrationWarning
                    className="h-11 w-full rounded-2xl pl-12 pr-4 text-sm font-medium outline-none"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(166,61,255,0.18)', color: '#2d1a50', boxShadow: '0 1px 4px rgba(103,2,191,0.05)' }}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB800] flex items-center justify-center pointer-events-none">
                    <SearchIcon className="h-4 w-4" strokeWidth={2.3} />
                  </div>
                </div>

                <div className="relative">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter by status" suppressHydrationWarning className={selectCls} style={selectStyle}>
                    <option value="">All Status</option>
                    <option value="normal">Normal Only</option>
                    <option value="flagged">Flagged / Suspicious</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="offline">Offline</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#a07ad0' }}>
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                </div>

                <div className="relative">
                  <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}
                    aria-label="Filter by industry" suppressHydrationWarning className={`${selectCls} min-w-[130px]`} style={selectStyle}>
                    <option value="">Industry</option>
                    {industryOptions.map((industry) => (
                      <option key={industry.key} value={industry.key}>{industry.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#a07ad0' }}>
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.94 }}
                  type="button" onClick={() => router.push('/admindashboard/moderationCompliance')}
                  suppressHydrationWarning
                  className="relative h-11 w-11 rounded-full flex items-center justify-center transition hover:brightness-95"
                  style={{ background: 'rgba(166,61,255,0.08)', border: '1.5px solid rgba(166,61,255,0.18)', color: '#8b1fe8' }}
                  aria-label="Approval requests">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5a2.121 2.121 0 013 3L8 18l-4 1 1-4 11.5-11.5z" />
                  </svg>
                  {pendingTotal > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {pendingTotal}
                    </span>
                  )}
                </motion.button>

                {/* Sort */}
                <div className="relative">
                  <motion.button 
                    whileTap={{ scale: 0.94 }}
                    type="button" onClick={() => setSortMenuOpen(!sortMenuOpen)}
                    className="h-11 w-11 rounded-full flex items-center justify-center transition hover:brightness-95 shadow-sm"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(166,61,255,0.18)', color: '#8b1fe8' }}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </motion.button>
                  <AnimatePresence>
                    {sortMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setSortMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-12 z-30 w-48 rounded-2xl p-1.5 shadow-xl origin-top-right"
                          style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(166,61,255,0.15)', backdropFilter: 'blur(10px)' }}>
                          {SORT_OPTIONS_BY_TAB[activeTab].map((option) => (
                            <button key={option.id} type="button"
                              onClick={() => { setSortOption(option.id); setSortMenuOpen(false); }}
                              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                              style={{ color: sortOption === option.id ? '#7b1de8' : '#7a6aa0', background: sortOption === option.id ? 'rgba(123,29,232,0.08)' : 'transparent' }}>
                              {option.label}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tab switcher */}
                 <div className="ml-auto flex gap-1 rounded-xl p-1 relative" style={{ border: '1px solid rgba(166,61,255,0.18)', background: 'rgba(255,255,255,0.7)' }}>
                   {(['websites', 'products'] as const).map((t) => (
                     <motion.button 
                       key={t}
                       whileTap={{ scale: 0.94 }}
                       onClick={() => handleTabChange(t)} suppressHydrationWarning
                       className={`relative px-6 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 capitalize ${
                         activeTab === t ? 'text-[#1a1035]' : 'text-[#7a6aa0] hover:text-[#1a1035]'
                       }`}>
                       {activeTab === t && (
                         <motion.div
                           layoutId="monitoringTabBackground"
                           className="absolute inset-0 rounded-lg bg-[#FFCC00] shadow-sm"
                           transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                         />
                       )}
                       <span className="relative z-10">{t}</span>
                     </motion.button>
                   ))}
                 </div>
              </motion.div>

              {/* Websites tab */}
              {activeTab === 'websites' && (
                <motion.div key="websites-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 gap-4 items-start">
                  <div className="hidden" aria-hidden="true">{renderAnalyticsColumn()}</div>
                  <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                    {loading ? (
                      <p className="text-sm" style={{ color: '#a090c8' }}>Loading websites…</p>
                    ) : uniqueFilteredWebsites.length === 0 ? (
                      <EmptyState message="No websites found." sub="Try adjusting your filters." />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {uniqueFilteredWebsites.map((w) => (
                          <WebsiteCard 
                            key={`${w.userId}::${w.id}`}
                            w={w}
                            viewUrl={websiteViewUrl(w.domainName)}
                            industry={websiteIndustryByDomain.get(w.domainName) || 'General'}
                            workingWebsiteKey={workingWebsiteKey}
                            openWebsiteActionModal={openWebsiteActionModal}
                            analytics={analyticsByWebsiteKey.get(`${w.userId}::${w.id}`)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Products tab */}
              {activeTab === 'products' && (
                <motion.div key="products-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 gap-4 items-start">
                  <div className="hidden" aria-hidden="true">{renderAnalyticsColumn()}</div>
                  <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                    {loading ? (
                      <p className="text-sm" style={{ color: '#a090c8' }}>Loading products…</p>
                    ) : sortedProducts.length === 0 ? (
                      <EmptyState message="No products found." sub="Try adjusting your filters." />
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                        {sortedProducts.map((p) => (
                          <ProductCard 
                            key={`${p.id}-${p.subdomain || 'site'}`}
                            p={p}
                            isSuspicious={suspiciousProductData.get(p.id)?.isSuspicious || false}
                            suspiciousReasons={suspiciousProductData.get(p.id)?.reasons || []}
                            workingProductId={workingProductId}
                            setSelectedProduct={setSelectedProduct}
                            openDeleteProductModal={openDeleteProductModal}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Product details modal */}
              <AnimatePresence>
                {selectedProduct && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={overlayStyle} onClick={() => setSelectedProduct(null)}>
                    <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.97, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="w-full max-w-2xl rounded-[24px] p-6 pointer-events-auto"
                      style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(166,61,255,0.16)', boxShadow: '0 24px 56px rgba(103,2,191,0.14)' }}
                      onClick={(e) => e.stopPropagation()}>
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-xl font-bold" style={{ color: '#4a1a8a' }}>Product Details</h3>
                        <motion.button 
                          whileTap={{ scale: 0.94 }}
                          type="button" onClick={() => setSelectedProduct(null)}
                          className="rounded-xl px-3 py-1.5 text-sm font-medium transition hover:brightness-95 flex items-center justify-center"
                          style={{ background: 'rgba(166,61,255,0.07)', color: '#7a6aa0', border: '1px solid rgba(166,61,255,0.12)' }}>
                          Close
                        </motion.button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                      <div className="mt-3 rounded-xl p-3" style={insetStyle}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#a090c8' }}>Description</p>
                        <p className="text-sm" style={{ color: '#4a1a8a' }}>{selectedProduct.description || 'No description'}</p>
                      </div>
                      <div className="mt-5 flex justify-end">
                        <motion.button 
                          whileTap={{ scale: 0.94 }}
                          type="button" onClick={() => openDeleteProductModal(selectedProduct)}
                          className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:brightness-95 flex items-center justify-center"
                          style={{ background: '#ef4444' }}>
                          Delete Product
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Website action modal */}
              <AnimatePresence>
                {websiteActionModal.open && websiteActionModal.target && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={overlayStyle}>
                    <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.97, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="w-full max-w-xl rounded-[24px] p-6"
                      style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(166,61,255,0.16)', boxShadow: '0 24px 56px rgba(103,2,191,0.14)' }}>
                      <h3 className="text-xl font-bold mb-1" style={{ color: '#4a1a8a' }}>Moderate Website</h3>
                      <p className="text-sm mb-4" style={{ color: '#7a6aa0' }}>
                        Choose a moderation action for{' '}
                        <span className="font-semibold" style={{ color: '#4a1a8a' }}>{websiteActionModal.target.domainName}</span>.
                      </p>
                      <div className="grid gap-2 mb-4">
                        {[
                          { action: 'take_down' as const, label: 'Take Down Website (Keep data)' },
                          { action: 'delete' as const, label: 'Delete Website (Move to trash)' },
                        ].map(({ action, label }) => (
                          <motion.button 
                            key={action} 
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setWebsiteActionModal((prev) => ({ ...prev, action }))}
                            className="rounded-xl px-4 py-2.5 text-left text-sm font-medium transition"
                            style={websiteActionModal.action === action
                              ? action === 'delete'
                                ? { background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.3)', color: '#b91c1c' }
                                : { background: 'rgba(166,61,255,0.08)', border: '1.5px solid rgba(166,61,255,0.3)', color: '#4a1a8a' }
                              : { background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(166,61,255,0.12)', color: '#7a6aa0' }}>
                            {label}
                          </motion.button>
                        ))}
                      </div>
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a090c8' }}>Reason (required)</label>
                      <textarea value={websiteActionModal.reason}
                        onChange={(e) => setWebsiteActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                        className="mt-1.5 w-full rounded-xl p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-[rgba(166,61,255,0.2)]"
                        style={{ background: 'rgba(248,245,255,0.9)', border: '1.5px solid rgba(166,61,255,0.16)', color: '#2d1a50' }}
                        rows={4} placeholder="State the moderation reason…" />
                      <div className="mt-4 flex justify-end gap-2">
                        <motion.button 
                          whileTap={{ scale: 0.94 }}
                          type="button" onClick={() => setWebsiteActionModal({ open: false, target: null, action: 'take_down', reason: '' })}
                          className="rounded-xl px-4 py-2 text-sm font-semibold transition flex items-center justify-center"
                          style={{ background: 'rgba(166,61,255,0.07)', color: '#7a6aa0', border: '1px solid rgba(166,61,255,0.12)' }}>
                          Cancel
                        </motion.button>
                        <motion.button 
                          whileTap={{ scale: 0.94 }}
                          type="button" onClick={submitWebsiteAction}
                          disabled={Boolean(websiteActionModal.target) && workingWebsiteKey === `${websiteActionModal.target.userId}::${websiteActionModal.target.id}`}
                          className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60 flex items-center justify-center"
                          style={{ background: '#7b1de8' }}>
                          {Boolean(websiteActionModal.target) && workingWebsiteKey === `${websiteActionModal.target.userId}::${websiteActionModal.target.id}` ? 'Saving…' : 'Confirm Moderation'}
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Product delete modal */}
              <AnimatePresence>
                {productDeleteModal.open && productDeleteModal.target && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={overlayStyle}>
                    <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.97, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="w-full max-w-xl rounded-[24px] p-6"
                      style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(166,61,255,0.16)', boxShadow: '0 24px 56px rgba(103,2,191,0.14)' }}>
                      <h3 className="text-xl font-bold mb-1" style={{ color: '#4a1a8a' }}>Delete Product</h3>
                      <p className="text-sm mb-4" style={{ color: '#7a6aa0' }}>
                        Deleting{' '}
                        <span className="font-semibold" style={{ color: '#4a1a8a' }}>{productDeleteModal.target.name || 'this product'}</span>{' '}
                        will notify the client.
                      </p>
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a090c8' }}>Reason (required)</label>
                      <textarea value={productDeleteModal.reason}
                        onChange={(e) => setProductDeleteModal((prev) => ({ ...prev, reason: e.target.value }))}
                        className="mt-1.5 w-full rounded-xl p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-[rgba(166,61,255,0.2)]"
                        style={{ background: 'rgba(248,245,255,0.9)', border: '1.5px solid rgba(166,61,255,0.16)', color: '#2d1a50' }}
                        rows={4} placeholder="State why this product is being deleted…" />
                      <div className="mt-4 flex justify-end gap-2">
                        <motion.button 
                          whileTap={{ scale: 0.94 }}
                          type="button" onClick={() => setProductDeleteModal({ open: false, target: null, reason: '' })}
                          className="rounded-xl px-4 py-2 text-sm font-semibold transition flex items-center justify-center"
                          style={{ background: 'rgba(166,61,255,0.07)', color: '#7a6aa0', border: '1px solid rgba(166,61,255,0.12)' }}>
                          Cancel
                        </motion.button>
                        <motion.button 
                          whileTap={{ scale: 0.94 }}
                          type="button" onClick={submitDeleteProduct}
                          disabled={Boolean(productDeleteModal.target) && workingProductId === productDeleteModal.target.id}
                          className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60 flex items-center justify-center"
                          style={{ background: '#ef4444' }}>
                          {Boolean(productDeleteModal.target) && workingProductId === productDeleteModal.target.id ? 'Deleting…' : 'Delete and Notify'}
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Toast */}
              <AnimatePresence>
                {toast.open && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
                    className="fixed bottom-6 right-6 z-[70] rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg"
                    style={{ background: toast.tone === 'error' ? '#dc2626' : '#16a34a' }}>
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