export const ADMIN_STATS = [
  { title: 'ACTIVE USERS', value: '56', liveLabel: 'Live' },
  { title: 'PUBLISHED WEBSITES', value: '56', liveLabel: 'Live' },
  { title: 'ACTIVE DOMAINS', value: '56', liveLabel: 'Live' },
  { title: 'PENDING WEBSITES', value: '56', liveLabel: 'Live' },
] as const;

export const ADMIN_CHART_SERIES = [
  { label: '2020', color: '#8A78FF', points: [36, 62] },
  { label: '2021', color: '#FF9A8B', points: [76, 28] },
  { label: '2022', color: '#69D7F7', points: [74, 40] },
] as const;

export const ADMIN_RECENT_USER_ACTIONS = [
  {
    title: 'example-site.com',
    action: 'Action: Removed',
    meta: 'By: Admin user on 2026-01-28',
  },
] as const;

export const ADMIN_NOTIFICATIONS = [
  { title: 'User Notification', date: 'January 01, 2026' },
] as const;
