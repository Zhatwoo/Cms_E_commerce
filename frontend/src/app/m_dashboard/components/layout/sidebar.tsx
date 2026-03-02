// eto yung main navigation ni user

'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/theme-context';
import { useProject } from '../context/project-context';
const HomeIcon = () => <img src="/icons/home.png" alt="Home" className="h-5 w-5 object-contain" />;
const WebBuilderIcon = () => <img src="/icons/monitor.png" alt="Web Builder" className="h-5 w-5 object-contain" />;
const DomainsIcon = () => <img src="/icons/globe.png" alt="Domains" className="h-5 w-5 object-contain" />;
const SettingsIcon = () => <img src="/icons/settings.png" alt="Settings" className="h-5 w-5 object-contain" />;
const ProductsIcon = () => <img src="/icons/shopping-bag.png" alt="Products" className="h-5 w-5 object-contain" />;
const OrdersIcon = () => <img src="/icons/shopping-cart.png" alt="Orders" className="h-5 w-5 object-contain" />;
const AnalyticsIcon = () => <img src="/icons/bar-chart.png" alt="Analytics" className="h-5 w-5 object-contain" />;

const CloseIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SubscriptionIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
};

const navItems: SidebarItem[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon />, href: '/m_dashboard' },
  { id: 'web-builder', label: 'Web Builder', icon: <WebBuilderIcon />, href: '/m_dashboard/web-builder' },
  { id: 'products', label: 'Products', icon: <ProductsIcon />, href: '/m_dashboard/products' },
  { id: 'orders', label: 'Orders', icon: <OrdersIcon />, href: '/m_dashboard/orders' },
  { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon />, href: '/m_dashboard/analytics' },
  { id: 'domains', label: 'Domains', icon: <DomainsIcon />, href: '/m_dashboard/domains' },
  { id: 'subscription', label: 'Subscription', icon: <SubscriptionIcon />, href: '/m_dashboard/subscription' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, href: '/m_dashboard/settings' },
];

type DashboardSidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
};

export function DashboardSidebar({ mobile = false, onClose }: DashboardSidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { selectedProject, setSelectedProjectId } = useProject();
  const hasSelectedWebsite = !!selectedProject;

  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/m_dashboard') {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onClose?.();
      return;
    }

    router.push('/m_dashboard', { scroll: true });
    onClose?.();
  };

  // Widths — adjust to your taste
  const COLLAPSED_WIDTH = 72;   // icon-only
  const EXPANDED_WIDTH = 280;  // full labels

  const sidebarBg = '#000036';
  const accentYellow = (colors as { accent?: { yellow?: string } }).accent?.yellow ?? '#FFCE00';
  const sidebarStyle = {
    backgroundColor: sidebarBg,
    borderColor: colors.border.faint,
    color: colors.text.muted,
  };

  const itemActiveStyle = {
    backgroundColor: 'transparent',
    color: colors.text.primary,
  };

  const itemInactiveStyle = {
    color: colors.text.muted,
  };

  const itemHoverStyle = {
    backgroundColor: 'rgba(92, 29, 143, 0.2)',
    color: colors.text.primary,
  };

  // For mobile → keep full drawer (no hover behavior)
  if (mobile) {
    return (
      <aside
        className="fixed inset-y-0 left-0 z-50 w-72 shadow-2xl h-full flex flex-col transition-colors duration-300"
        style={{
          ...sidebarStyle,
          borderRightWidth: '1px',
        }}
      >

        {/* Mobile header with close */}
        <div
          className="flex items-center justify-between px-6 shrink-0 transition-colors duration-300"
          style={{ borderColor: colors.border.faint, height: '85px', paddingTop: '4px' }}
        >
          <div className="flex items-center gap-3">
            <img src="/images/logo.svg" alt="Logo" className="h-9 w-auto" />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:opacity-80"
            style={{ color: colors.text.secondary }}
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          {/* Full labels for mobile */}
          {navItems
            .filter((item) => {
              // Before a website/instance is selected, hide builder & commerce-specific items
              if (
                !hasSelectedWebsite &&
                ['web-builder', 'products', 'orders', 'analytics', 'domains', 'subscription', 'settings'].includes(item.id)
              ) {
                return false;
              }
              return true;
            })
            .map((item) => {
              const isActive =
                item.id === 'home'
                  ? pathname === '/m_dashboard'
                  : item.id === 'web-builder'
                    ? pathname.startsWith('/m_dashboard/web-builder')
                    : item.href
                      ? pathname === item.href
                      : false;

            const content = (
              <div
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors`}
                style={isActive ? { ...itemActiveStyle, color: '#FFFFFF' } : itemInactiveStyle}
              >
                <span className="flex h-6 w-6 items-center justify-center" style={{ opacity: isActive ? 1 : 0.5 }}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>{item.label}</span>
              </div>
            );

              return item.href ? (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block"
                  onClick={item.id === 'home' ? handleHomeClick : onClose}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left"
                >
                  {content}
                </button>
              );
            })}
        </nav>

        {selectedProject && (
          <div className="px-3 pb-4 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedProjectId(null);
                router.push('/m_dashboard/instances');
                onClose?.();
              }}
              className="w-full rounded-xl border px-3 py-2 text-left transition-colors hover:opacity-95"
              style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: colors.bg.elevated }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm" style={{ color: colors.text.primary }}>{selectedProject.title || 'Untitled website'}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: sidebarBg, color: colors.text.muted }}>
                  Switch
                </span>
              </div>
            </button>
          </div>
        )}
      </aside>
    );
  }

  // Desktop: hover-expand version
  return (
    <motion.aside
      className="hidden lg:flex lg:flex-col lg:h-screen lg:sticky lg:top-0 overflow-hidden z-20 backdrop-blur-xl border-r transition-colors duration-300"
      style={{
        backgroundColor: sidebarBg,
        borderColor: colors.border.faint,
        color: colors.text.muted
      }}
      initial={false}
      animate={{ width: isHovered ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 28,
        mass: 0.8,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Brand header – logo */}
      <div
        className="flex items-center justify-center shrink-0 transition-colors duration-300"
        style={{ borderColor: colors.border.faint, height: '85px', paddingTop: '4px' }}
      >
        <img src="/images/logo.svg" alt="Logo" className="h-9 w-auto max-w-[48px]" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 flex flex-col">
        {navItems
          .filter((item) => {
            if (
              !hasSelectedWebsite &&
              ['web-builder', 'products', 'orders', 'analytics', 'domains', 'subscription', 'settings'].includes(item.id)
            ) {
              return false;
            }
            return true;
          })
          .map((item) => {
            const isActive =
              item.id === 'home'
                ? pathname === '/m_dashboard'
                : item.id === 'web-builder'
                  ? pathname.startsWith('/m_dashboard/web-builder')
                  : item.href
                    ? pathname === item.href
                    : false;

            return (
              <Link
                key={item.id}
                href={item.href ?? '#'}
                onClick={item.id === 'home' ? handleHomeClick : undefined}
                className={`
                group relative flex items-center rounded-lg transition-all duration-200
                w-full px-4 py-3
              `}
              style={isActive ? { ...itemActiveStyle, color: '#F4F4F6' } : undefined}
            >
              {/* Hover effect overlay */}
              {!isActive && (
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(92, 29, 143, 0.2)' }}
                />
              )}

              {/* Fixed icon position */}
              <div className="relative z-10 w-12 flex items-center justify-center shrink-0">
                <span
                  className="flex h-6 w-6 items-center justify-center transition-colors"
                  style={{ opacity: isActive ? 1 : 0.5 }}
                >
                  {item.icon}
                </span>
              </div>

              {/* Label slide-in */}
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="relative z-10 ml-3 text-sm font-medium whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-outfit), sans-serif', color: isActive ? '#FFFFFF' : colors.text.muted }}
                  >
                    {item.label}
                  </motion.span>
                )}

              {/* Active indicator when collapsed */}
              {isActive && !isHovered && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: accentYellow }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {selectedProject && (
        <div className="px-3 pb-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedProjectId(null);
              router.push('/m_dashboard/instances');
            }}
            className="w-full rounded-xl border px-3 py-2 text-left transition-colors hover:opacity-95"
            style={{ borderColor: colors.border.faint, color: colors.text.secondary, backgroundColor: colors.bg.elevated }}
          >
            <AnimatePresence>
              {isHovered ? (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate text-sm" style={{ color: colors.text.primary }}>{selectedProject.title || 'Untitled website'}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: sidebarBg, color: colors.text.muted }}>
                    Switch
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accentYellow }} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      )}

      <div
        className="border-t py-4 text-xs shrink-0 flex justify-center transition-colors duration-300"
        style={{ borderColor: colors.border.faint, color: colors.text.muted }}
      >
        v1.0
      </div>
    </motion.aside>
  );
}