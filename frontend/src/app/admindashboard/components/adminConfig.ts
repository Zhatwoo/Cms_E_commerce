export type AdminNavChild = {
    id: string;
    label: string;
    href: string;
    match: (pathname: string) => boolean;
};

export type AdminNavItem = {
    id: string;
    label: string;
    href: string;
    iconSrc: string;
    iconAlt: string;
    match: (pathname: string) => boolean;
    children?: AdminNavChild[];
};

export const adminNavItems: AdminNavItem[] = [
    {
        id: 'home',
        label: 'Home',
        href: '/admindashboard',
        iconSrc: '/admin-dashboard/icons/home-icon.png',
        iconAlt: 'Home',
        match: (pathname) => pathname === '/admindashboard',
    },
    {
        id: 'analytics',
        label: 'Analytics',
        href: '/admindashboard/monitorAnalytics',
        iconSrc: '/admin-dashboard/icons/analytic-icon.png',
        iconAlt: 'Analytics',
        match: (pathname) => pathname.includes('/monitorAnalytics'),
    },
    {
        id: 'management',
        label: 'Management',
        href: '/admindashboard/usernweb',
        iconSrc: '/admin-dashboard/icons/management-icon.png',
        iconAlt: 'Management',
        match: (pathname) => pathname.includes('/usernweb'),
        children: [
            {
                id: 'user-management',
                label: 'User Management',
                href: '/admindashboard/usernweb/user-management',
                match: (pathname) => pathname.includes('/user-management'),
            },
            {
                id: 'website-management',
                label: 'Website Management',
                href: '/admindashboard/usernweb/website-management',
                match: (pathname) => pathname.includes('/website-management'),
            },
        ],
    },
    {
        id: 'templates',
        label: 'Templates',
        href: '/admindashboard/templatesnassets',
        iconSrc: '/admin-dashboard/icons/templates-icon.svg',
        iconAlt: 'Templates',
        match: (pathname) => pathname.includes('/templatesnassets'),
        children: [
            {
                id: 'builtin-templates',
                label: 'Built-In Templates',
                href: '/admindashboard/templatesnassets/builtin',
                match: (pathname) => pathname.includes('/templatesnassets/builtin'),
            },
            {
                id: 'user-management-templates',
                label: 'User Management',
                href: '/admindashboard/templatesnassets/user',
                match: (pathname) => pathname.includes('/templatesnassets/user'),
            },
        ],
    },
    {
        id: 'monitoring',
        label: 'Monitoring',
        href: '/admindashboard/notifications',
        iconSrc: '/admin-dashboard/icons/monitoring-icon.png',
        iconAlt: 'Monitoring',
        match: (pathname) => pathname.includes('/notifications'),
        children: [
            {
                id: 'website-monitoring',
                label: 'Website Monitoring',
                href: '/admindashboard/notifications/website',
                match: (pathname) => pathname.includes('/notifications/website'),
            },
            {
                id: 'product-monitoring',
                label: 'Product Monitoring',
                href: '/admindashboard/notifications/product',
                match: (pathname) => pathname.includes('/notifications/product'),
            },
        ],
    },
    {
        id: 'moderation',
        label: 'Moderation',
        href: '/admindashboard/moderationCompliance',
        iconSrc: '/admin-dashboard/icons/moderation-icon.png',
        iconAlt: 'Moderation',
        match: (pathname) => pathname.includes('/moderationCompliance'),
    },
];

export const adminStats = [
    { title: 'ACTIVE USERS', value: '56', liveLabel: 'Live' },
    { title: 'PUBLISHED WEBSITES', value: '56', liveLabel: 'Live' },
    { title: 'ACTIVE DOMAINS', value: '56', liveLabel: 'Live' },
    { title: 'PENDING WEBSITES', value: '56', liveLabel: 'Live' },
] as const;

export const chartSeries = [
    {
        label: '2020',
        color: '#8A78FF',
        points: [36, 62],
    },
    {
        label: '2021',
        color: '#FF9A8B',
        points: [76, 28],
    },
    {
        label: '2022',
        color: '#69D7F7',
        points: [74, 40],
    },
] as const;

export const recentUserActions = [
    {
        title: 'example-site.com',
        action: 'Action: Removed',
        meta: 'By: Admin user on 2026-01-28',
    },
] as const;

export const adminNotifications = [
    {
        title: 'User Notification',
        date: 'January 01, 2026',
    },
] as const;
