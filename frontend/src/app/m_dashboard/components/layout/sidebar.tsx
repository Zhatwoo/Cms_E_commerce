// eto yung main navigation ni user

'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/theme-context';
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const WebBuilderIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);
const DomainsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const ProductsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const OrdersIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const MessagesIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const InventoryIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
  { id: 'web-builder', label: 'Web Builder', icon: <WebBuilderIcon />, href: '/m_dashboard/projects' },
  { id: 'products', label: 'Products', icon: <ProductsIcon />, href: '/m_dashboard/products' },
  { id: 'inventory', label: 'Inventory', icon: <InventoryIcon />, href: '/m_dashboard/inventory' },
  { id: 'orders', label: 'Orders', icon: <OrdersIcon />, href: '/m_dashboard/orders' },
  { id: 'domains', label: 'Domains', icon: <DomainsIcon />, href: '/m_dashboard/domains' },
  { id: 'subscription', label: 'Subscription', icon: <SubscriptionIcon />, href: '/m_dashboard/subscription' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, href: '/m_dashboard/settings' },
];

type DashboardSidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
  onNavigateStart?: () => void;
};

export function DashboardSidebar({ mobile = false, onClose, onNavigateStart }: DashboardSidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { colors, theme } = useTheme();

  useEffect(() => {
    navItems.forEach((item) => {
      if (!item.href) return;
      router.prefetch(item.href);
    });
  }, [router]);

  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/m_dashboard') {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onClose?.();
      return;
    }

    event.preventDefault();
    onNavigateStart?.();
    router.push('/m_dashboard', { scroll: true });
    onClose?.();
  };

  const handleNavClick = (href?: string) => {
    if (!href) return;
    if (href === pathname) {
      onClose?.();
      return;
    }
    onNavigateStart?.();
    onClose?.();
  };

  // Widths — adjust to your taste
  const COLLAPSED_WIDTH = 72;   // icon-only
  const EXPANDED_WIDTH = 280;  // full labels

  const isLightTheme = theme === 'light';
  
  // Specific colors requested by user
  const sidebarBg = theme === 'dark' ? '#09002C' : '#EEEEFF';
  const sidebarPrimaryText = theme === 'dark' ? '#A78BFA' : '#14034A';
  const sidebarMutedText = theme === 'dark' ? '#A78BFA' : '#14034A';
  const sidebarSecondaryText = theme === 'dark' ? '#A78BFA' : '#14034A';
  
  const sidebarBorderColor = isLightTheme ? 'rgba(20, 3, 74, 0.1)' : 'rgba(167, 139, 250, 0.1)';
  const accentYellow = (colors as { accent?: { yellow?: string } }).accent?.yellow ?? '#FFCE00';
  const inactiveIconOpacity = isLightTheme ? 0.6 : 0.6;
  const activeIconOpacity = 1;
  const sidebarStyle = {
    backgroundColor: sidebarBg,
    borderColor: sidebarBorderColor,
    color: sidebarMutedText,
  };

  const itemActiveStyle = {
    backgroundColor: 'transparent',
    color: sidebarPrimaryText,
  };

  const itemInactiveStyle = {
    color: sidebarPrimaryText,
    opacity: 0.6,
  };

  const itemHoverStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(20, 3, 74, 0.05)',
    color: sidebarPrimaryText,
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
            style={{ borderColor: sidebarBorderColor, height: '85px', paddingTop: '4px' }}
        >
          <div className="flex items-center gap-3">
            <Link href="/m_dashboard" onClick={handleHomeClick} aria-label="Go to dashboard home">
              <img src="/images/logo.svg" alt="Logo" className="h-9 w-auto" />
            </Link>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:opacity-80"
            style={{ color: sidebarSecondaryText }}
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          {/* Full labels for mobile */}
          {navItems
            .map((item) => {
              const isActive =
                item.id === 'home'
                  ? pathname === '/m_dashboard'
                  : item.id === 'web-builder'
                    ? pathname.startsWith('/design') || pathname.startsWith('/m_dashboard/projects')
                    : item.id === 'inventory'
                      ? pathname.startsWith('/m_dashboard/inventory')
                      : item.href
                        ? pathname === item.href
                        : false;

            const content = (
              <div
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors`}
                style={isActive ? { ...itemActiveStyle, color: sidebarPrimaryText } : itemInactiveStyle}
              >
                <span className="flex h-6 w-6 items-center justify-center" style={{ opacity: isActive ? activeIconOpacity : inactiveIconOpacity }}>
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
                  onClick={item.id === 'home' ? handleHomeClick : () => handleNavClick(item.href)}
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
      </aside>
    );
  }

  // Desktop: hover-expand version
  return (
    <motion.aside
      className="hidden lg:flex lg:flex-col lg:h-screen lg:sticky lg:top-0 overflow-hidden z-20 backdrop-blur-xl border-r transition-colors duration-300"
      style={{
        backgroundColor: sidebarBg,
        borderColor: sidebarBorderColor,
        color: sidebarMutedText
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
        style={{ borderColor: sidebarBorderColor, height: '85px', paddingTop: '4px' }}
      >
        <Link href="/m_dashboard" onClick={handleHomeClick} aria-label="Go to dashboard home">
          <img src="/images/logo.svg" alt="Logo" className="h-9 w-auto max-w-[48px]" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 flex flex-col">
        {navItems
          .map((item) => {
            const isActive =
              item.id === 'home'
                ? pathname === '/m_dashboard'
                : item.id === 'web-builder'
                  ? pathname.startsWith('/design') || pathname.startsWith('/m_dashboard/projects')
                  : item.id === 'inventory'
                    ? pathname.startsWith('/m_dashboard/inventory')
                    : item.href
                      ? pathname === item.href
                      : false;

            return (
              <Link
                key={item.id}
                href={item.href ?? '#'}
                onClick={item.id === 'home' ? handleHomeClick : () => handleNavClick(item.href)}
                className={`
                group relative flex items-center rounded-lg transition-all duration-200
                w-full px-4 py-3
              `}
              style={isActive ? { ...itemActiveStyle, color: sidebarPrimaryText } : undefined}
            >
              {/* Hover effect overlay */}
              {!isActive && (
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: itemHoverStyle.backgroundColor }}
                />
              )}

              {/* Fixed icon position */}
              <div className="relative z-10 w-12 flex items-center justify-center shrink-0">
                <span
                  className="flex h-6 w-6 items-center justify-center transition-colors"
                  style={{ opacity: isActive ? activeIconOpacity : inactiveIconOpacity }}
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
                      style={{ 
                        fontFamily: 'var(--font-outfit), sans-serif', 
                        color: sidebarPrimaryText,
                        opacity: isActive ? 1 : 0.6
                      }}
                    >
                      {item.label}
                    </motion.span>
                )}
              </AnimatePresence>

              {/* Active indicator when collapsed or expanded */}
              {isActive && (
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full transition-all duration-300 ${!isHovered ? 'opacity-100' : 'opacity-0'}`}
                  style={{ backgroundColor: theme === 'light' ? '#14034A' : accentYellow }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className="border-t py-4 text-xs shrink-0 flex justify-center transition-colors duration-300"
        style={{ borderColor: sidebarBorderColor, color: sidebarMutedText }}
      >
        v1.0
      </div>
    </motion.aside>
  );
}