export type AdminNavChild = {
  id: string;
  label: string;
  href: string;
  matchIncludes: string;
};

export type AdminNavItem = {
  id: string;
  label: string;
  href: string;
  iconSrc: string;
  iconAlt: string;
  iconComponent?: string; // Support for custom SVG components
  matchExact?: string;
  matchIncludes?: string;
  children?: AdminNavChild[];
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/admindashboard',
    iconSrc: '/admin-dashboard/icons/home-icon.png',
    iconAlt: 'Home',
    matchExact: '/admindashboard',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/admindashboard/monitorAnalytics',
    iconSrc: '/admin-dashboard/icons/analytic-icon.png',
    iconAlt: 'Analytics',
    matchIncludes: '/monitorAnalytics',
  },
  {
    id: 'management',
    label: 'Management',
    href: '/admindashboard/usernweb',
    iconSrc: '/admin-dashboard/icons/management-icon.png',
    iconAlt: 'Management',
    matchIncludes: '/usernweb',
    children: [
      {
        id: 'user-management',
        label: 'User Management',
        href: '/admindashboard/usernweb?tab=clients',
        matchIncludes: '/usernweb',
      },
      {
        id: 'website-management',
        label: 'Website Management',
        href: '/admindashboard/usernweb?tab=domains',
        matchIncludes: '/usernweb',
      },
    ],
  },
  {
    id: 'templates',
    label: 'Templates',
    href: '/admindashboard/templatesnassets',
    iconSrc: '/admin-dashboard/icons/templates-icon.svg',
    iconAlt: 'Templates',
    matchIncludes: '/templatesnassets',
    children: [
      {
        id: 'builtin-templates',
        label: 'Built-In Templates',
        href: '/admindashboard/templatesnassets?tab=builtin',
        matchIncludes: '/templatesnassets',
      },
      {
        id: 'user-templates',
        label: 'User Templates',
        href: '/admindashboard/templatesnassets?tab=user',
        matchIncludes: '/templatesnassets',
      },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    href: '/admindashboard/monitoring?tab=websites',
    iconSrc: '/admin-dashboard/icons/monitoring-icon.png',
    iconAlt: 'Monitoring',
    matchIncludes: '/monitoring',
    children: [
      {
        id: 'website-monitoring',
        label: 'Website Monitoring',
        href: '/admindashboard/monitoring?tab=websites',
        matchIncludes: '/monitoring',
      },
      {
        id: 'product-monitoring',
        label: 'Product Monitoring',
        href: '/admindashboard/monitoring?tab=products',
        matchIncludes: '/monitoring',
      },
    ],
  },
  {
    id: 'moderation',
    label: 'Moderation',
    href: '/admindashboard/moderationCompliance',
    iconSrc: '/admin-dashboard/icons/moderation-icon.png',
    iconAlt: 'Moderation',
    matchIncludes: '/moderationCompliance',
  },
];

export function isAdminNavItemMatch(pathname: string, item: AdminNavItem): boolean {
  if (item.matchExact && pathname === item.matchExact) return true;
  if (item.matchIncludes && pathname.includes(item.matchIncludes)) return true;
  return Boolean(item.children?.some((child) => pathname.includes(child.matchIncludes)));
}
