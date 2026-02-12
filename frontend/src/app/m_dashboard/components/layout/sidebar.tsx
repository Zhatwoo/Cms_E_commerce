// eto yung main navigation ni user

'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/theme-context';
const HomeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const WebBuilderIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const DomainsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
  </svg>
);

const ProjectsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="7" width="18" height="13" rx="2" ry="2" />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
  </svg>
);

const ProductsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const OrdersIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
  { id: 'projects', label: 'Projects', icon: <ProjectsIcon />, href: '/m_dashboard/projects' },
  { id: 'products', label: 'Products', icon: <ProductsIcon />, href: '/m_dashboard/products' },
  { id: 'orders', label: 'Orders', icon: <OrdersIcon />, href: '/m_dashboard/orders' },
  { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon />, href: '/m_dashboard/analytics' },
  { id: 'domains', label: 'Domains', icon: <DomainsIcon />, href: '/m_dashboard/domains' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, href: '/m_dashboard/settings' },
];

type DashboardSidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
};

export function DashboardSidebar({ mobile = false, onClose }: DashboardSidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const { colors, theme } = useTheme();

  // Widths — adjust to your taste
  const COLLAPSED_WIDTH = 72;   // icon-only
  const EXPANDED_WIDTH = 280;  // full labels

  const sidebarStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : colors.bg.card,
    borderColor: colors.border.faint,
    color: colors.text.primary,
  };

  const itemActiveStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.7)' : colors.bg.primary, // gray-800/70 or primary
    color: colors.text.primary,
  };

  const itemInactiveStyle = {
    color: colors.text.secondary,
  };

  const itemHoverStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.4)' : colors.bg.primary,
    color: colors.text.primary,
  };

  // For mobile → keep full drawer (no hover behavior)
  if (mobile) {
    return (
      <aside
        className="fixed inset-y-0 left-0 z-50 w-72 shadow-2xl h-full flex flex-col transition-colors duration-300"
        style={{
          ...sidebarStyle,
          backgroundColor: colors.bg.card, // Ensure solid bg for mobile
          borderRightWidth: '1px',
        }}
      >

        {/* Mobile header with close */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0 border-b transition-colors duration-300"
          style={{ borderColor: colors.border.faint }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center font-bold shadow-sm"
              style={{ backgroundColor: colors.bg.elevated, color: colors.text.primary }}
            >
              L
            </div>
            <span className="text-xl font-semibold" style={{ color: colors.text.primary }}>Lumapak</span>
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
          {navItems.map((item) => {
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
                style={isActive ? itemActiveStyle : { ...itemInactiveStyle, ...{ ':hover': itemHoverStyle } }}
              >
                <span className="flex h-6 w-6 items-center justify-center" style={{ color: isActive ? colors.text.primary : colors.text.muted }}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            );

            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="block"
                onClick={onClose}
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
        backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
        borderColor: colors.border.faint,
        color: colors.text.primary
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
      {/* Brand header – centered always */}
      <div
        className="flex items-center justify-center py-5 shrink-0 border-b transition-colors duration-300"
        style={{ borderColor: colors.border.faint }}
      >
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center font-bold shadow-sm transition-colors duration-300"
          style={{ backgroundColor: colors.bg.elevated, color: colors.text.primary }}
        >
          L
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 flex flex-col">
        {navItems.map((item) => {
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
              className={`
                group relative flex items-center rounded-lg transition-all duration-200
                w-full px-4 py-3
              `}
              style={isActive ? itemActiveStyle : undefined}
            >
              {/* Hover effect overlay */}
              {!isActive && (
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: colors.bg.elevated }}
                />
              )}

              {/* Fixed icon position */}
              <div className="relative z-10 w-12 flex items-center justify-center shrink-0">
                <span
                  className="flex h-6 w-6 items-center justify-center transition-colors"
                  style={{ color: isActive ? colors.text.primary : colors.text.muted }} // Use muted for inactive icons
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
                    style={{ color: isActive ? colors.text.primary : colors.text.secondary }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active indicator when collapsed */}
              {isActive && !isHovered && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: colors.status.info }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className="border-t py-4 text-xs shrink-0 flex justify-center transition-colors duration-300"
        style={{ borderColor: colors.border.faint, color: colors.text.muted }}
      >
        v1.0
      </div>
    </motion.aside>
  );
}