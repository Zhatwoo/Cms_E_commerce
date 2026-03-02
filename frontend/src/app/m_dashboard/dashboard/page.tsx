// Eto yung mismong dashboard page

'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '../components/context/theme-context';
import { RecentProjects } from '../components/dashboard/RecentProjects';
import { TopSellingProducts } from '../components/dashboard/TopSellingProducts';

type HeroTab = 'designs' | 'templates' | 'mercato-ai';

const quickActions = [
  { label: 'Presentation' },
  { label: 'Social' },
  { label: 'Video' },
  { label: 'Print' },
  { label: 'Website' },
  { label: 'Email' },
  { label: 'Upload' },
];

const templateCards = [
  { title: 'Presentation', subtitle: 'Pitch, report, proposal' },
  { title: 'Poster', subtitle: 'Promo and campaign' },
  { title: 'Resume', subtitle: 'Professional profile' },
  { title: 'Email', subtitle: 'Newsletter and updates' },
  { title: 'Logo', subtitle: 'Brand starter kits' },
  { title: 'Flyer', subtitle: 'Events and promotions' },
  { title: 'Brochure', subtitle: 'Products and services' },
  { title: 'Menu', subtitle: 'Cafe and restaurant' },
  { title: 'Whiteboard', subtitle: 'Team collaboration' },
  { title: 'Website', subtitle: 'Landing and business sites' },
];

const inspiredCards = [
  { title: 'Modern Storefront', cta: 'Edit project' },
  { title: 'Agency Landing', cta: 'Open builder' },
  { title: 'Portfolio Homepage', cta: 'Continue design' },
  { title: 'Product Showcase', cta: 'Customize now' },
];

// ── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardContent({ userName = 'User' }: { userName?: string }) {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [activeHeroTab, setActiveHeroTab] = useState<HeroTab>('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const tabNavigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredQuickActions = quickActions.filter((item) =>
    item.label.toLowerCase().includes(normalizedSearch)
  );
  const filteredTemplateCards = templateCards.filter((item) =>
    `${item.title} ${item.subtitle}`.toLowerCase().includes(normalizedSearch)
  );
  const filteredInspiredCards = inspiredCards.filter((item) =>
    `${item.title} ${item.cta}`.toLowerCase().includes(normalizedSearch)
  );

  useEffect(() => {
    return () => {
      if (tabNavigateTimeoutRef.current) {
        clearTimeout(tabNavigateTimeoutRef.current);
      }
    };
  }, []);

  const handleHeroTabSwitch = (tab: HeroTab, href: string) => {
    setActiveHeroTab(tab);
    if (tabNavigateTimeoutRef.current) {
      clearTimeout(tabNavigateTimeoutRef.current);
    }
    tabNavigateTimeoutRef.current = setTimeout(() => {
      router.push(href);
    }, 170);
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-full overflow-x-hidden">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-3xl border p-5 md:p-8"
        style={{
          backgroundColor: colors.bg.card,
          borderColor: 'transparent',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl p-px"
          style={{
            backgroundImage:
              theme === 'dark'
                ? 'linear-gradient(110deg, rgba(255,255,255,0.30) 0%, rgba(209,213,219,0.22) 35%, rgba(156,163,175,0.16) 65%, rgba(107,114,128,0.24) 100%)'
                : 'linear-gradient(110deg, rgba(148,163,184,0.50) 0%, rgba(148,163,184,0.30) 35%, rgba(100,116,139,0.24) 65%, rgba(71,85,105,0.34) 100%)',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4 md:gap-5 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight bg-clip-text text-transparent"
            style={{
              backgroundImage:
                theme === 'dark'
                  ? 'linear-gradient(180deg, #ffffff 25%, #9ca3af 100%)'
                  : 'linear-gradient(180deg, #111827 25%, #4b5563 100%)',
              textShadow:
                theme === 'dark'
                  ? '0 6px 18px rgba(2,6,23,0.45)'
                  : '0 6px 16px rgba(15,23,42,0.16)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            What website will you build?
          </motion.h1>

          <div
            className="inline-flex items-center gap-2 rounded-full border px-2 py-1"
            style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}
          >
            <button
              type="button"
              className="relative rounded-full px-3 py-1 text-xs font-medium"
              onClick={() => handleHeroTabSwitch('designs', '/m_dashboard/web-builder#projects-section')}
              style={{ color: activeHeroTab === 'designs' ? colors.text.primary : colors.text.muted }}
            >
              {activeHeroTab === 'designs' ? (
                <motion.span
                  layoutId="hero-tab-active-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: colors.bg.card }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.6 }}
                />
              ) : null}
              <span className="relative z-10">Your designs</span>
            </button>
            <button
              type="button"
              className="relative rounded-full px-3 py-1 text-xs font-medium"
              onClick={() => handleHeroTabSwitch('templates', '/m_dashboard/web-builder')}
              style={{ color: activeHeroTab === 'templates' ? colors.text.primary : colors.text.muted }}
            >
              {activeHeroTab === 'templates' ? (
                <motion.span
                  layoutId="hero-tab-active-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: colors.bg.card }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.6 }}
                />
              ) : null}
              <span className="relative z-10">Templates</span>
            </button>
            <button
              type="button"
              className="relative rounded-full px-3 py-1 text-xs font-medium"
              onClick={() => handleHeroTabSwitch('mercato-ai', '/m_dashboard/web-builder')}
              style={{ color: activeHeroTab === 'mercato-ai' ? colors.text.primary : colors.text.muted }}
            >
              {activeHeroTab === 'mercato-ai' ? (
                <motion.span
                  layoutId="hero-tab-active-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: colors.bg.card }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.6 }}
                />
              ) : null}
              <span className="relative z-10">Mercato AI</span>
            </button>
          </div>

          <div
            className="w-full max-w-2xl rounded-xl border px-4 py-3 flex items-center gap-3"
            style={{ borderColor: colors.border.default, backgroundColor: colors.bg.elevated }}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" style={{ color: colors.text.muted }}>
              <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search templates, designs, or actions"
              className="w-full bg-transparent text-sm focus:outline-none"
              style={{ color: colors.text.secondary }}
            />
          </div>

          <div className="w-full overflow-x-auto flex justify-center">
            <div className="inline-flex min-w-max items-start gap-5 px-1 py-1">
              {filteredQuickActions.map((item, idx) => (
                <button
                  key={item.label}
                  type="button"
                  className="flex items-center"
                  onClick={() => router.push('/m_dashboard/web-builder')}
                >
                  <span
                    className="h-10 px-4 rounded-full border flex items-center justify-center text-xs font-semibold whitespace-nowrap"
                    style={{
                      borderColor: colors.border.default,
                      backgroundColor: idx % 2 === 0 ? colors.bg.elevated : colors.bg.card,
                      color: colors.text.primary,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Projects — show first */}
      <RecentProjects />

      {/* Explore Templates */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
          Explore templates
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredTemplateCards.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => router.push('/m_dashboard/web-builder')}
              className="rounded-xl border p-3 text-left transition-transform hover:-translate-y-0.5"
              style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}
            >
              <div className="h-12 rounded-lg mb-2" style={{ backgroundColor: colors.bg.card }} />
              <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>{item.title}</p>
              <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>{item.subtitle}</p>
            </button>
          ))}
        </div>
        {normalizedSearch && filteredTemplateCards.length === 0 ? (
          <p className="text-sm" style={{ color: colors.text.muted }}>
            No template results found.
          </p>
        ) : null}
      </section>

      {/* Inspired by your designs */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
          Inspired by your designs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredInspiredCards.map((item, idx) => (
            <button
              key={item.title}
              type="button"
              onClick={() => router.push('/m_dashboard/web-builder#projects-section')}
              className="rounded-2xl border p-4 min-h-[140px] flex flex-col justify-between text-left"
              style={{
                borderColor: colors.border.default,
                backgroundColor: colors.bg.card,
              }}
            >
              <span
                className="w-8 h-1.5 rounded-full"
                style={{ backgroundColor: idx % 2 === 0 ? colors.status.good : colors.text.subtle }}
              />
              <div>
                <p className="text-base font-semibold" style={{ color: colors.text.primary }}>{item.title}</p>
                <p className="text-xs mt-1" style={{ color: colors.text.muted }}>{item.cta}</p>
              </div>
            </button>
          ))}
        </div>
        {normalizedSearch && filteredInspiredCards.length === 0 ? (
          <p className="text-sm" style={{ color: colors.text.muted }}>
            No inspired design results found.
          </p>
        ) : null}
      </section>

      {/* Projects & Commerce Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full overflow-x-hidden">
        <TopSellingProducts />
        
        {/* Usage summary */}
        <motion.a
          href="/m_dashboard/analytics#overview-section"
          className="rounded-2xl p-4 md:p-6 border flex flex-col gap-4 md:gap-5 col-span-1 lg:col-span-1 cursor-pointer group"
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.default,
            boxShadow: theme === 'dark' ? '0 18px 60px rgba(0,0,0,0.6)' : '0 10px 40px rgba(0,0,0,0.08)',
          }}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h3 className="text-base md:text-lg font-semibold tracking-tight" style={{ color: colors.text.primary }}>
                Usage summary
              </h3>
              <p className="text-xs mt-0.5 group-hover:underline" style={{ color: colors.text.muted }}>
                Click to view full analytics →
              </p>
            </div>
            <span className="rounded-full border px-2 py-0.5 md:px-2.5 md:py-1 text-[9px] md:text-[11px] font-medium" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
              30 days
            </span>
          </div>

          <div className="flex items-center justify-center py-3 md:py-4 overflow-x-auto md:overflow-x-visible">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 flex-shrink-0">
              <svg className="-rotate-90" width="100%" height="100%" viewBox="0 0 176 176">
                <circle cx="88" cy="88" r="78" fill="none" stroke={colors.border.faint} strokeWidth="14" />
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="14"
                  strokeDasharray={`0 ${2 * Math.PI * 78}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.status.good} />           {/* #A3E635 */}
                    <stop offset="50%" stopColor={theme === 'dark' ? "#D1D1D6" : "#9CA3AF"} />
                    <stop offset="100%" stopColor={colors.text.muted} />          {/* #9999A1 */}
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[10px] md:text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>
                  Plan capacity
                </p>
                <p className="mt-0.5 md:mt-1 text-2xl md:text-3xl font-semibold" style={{ color: colors.text.primary }}>0</p>
                <p className="text-xs md:text-sm mt-0.5 md:mt-1" style={{ color: colors.status.good }}>-</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs">
            <div className="rounded-xl border px-3 py-2 md:px-4 md:py-3" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.elevated }}>
              <p className="text-[10px] md:text-[11px] font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Bandwidth</p>
              <p className="mt-0.5 md:mt-1 text-sm md:text-base font-semibold" style={{ color: colors.text.primary }}>0</p>
              <p className="text-[9px] md:text-[11px] mt-0.5 md:mt-1" style={{ color: colors.text.subtle }}>-</p>
            </div>
            <div className="rounded-xl border px-3 py-2 md:px-4 md:py-3" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.elevated }}>
              <p className="text-[10px] md:text-[11px] font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Builds</p>
              <p className="mt-0.5 md:mt-1 text-sm md:text-base font-semibold" style={{ color: colors.text.primary }}>0</p>
              <p className="text-[9px] md:text-[11px] mt-0.5 md:mt-1" style={{ color: colors.status.good }}>-</p>
            </div>
          </div>
        </motion.a>
      </div>
    </div>
  );
}

// Default page export for Next.js app router
export default function Page() {
  return <DashboardContent />;
}

/*
Gud Luck guyss
Kaya nyo yan
Fighting!!
*/