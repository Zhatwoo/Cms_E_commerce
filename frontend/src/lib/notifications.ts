import {
  getSharedNotifications,
  addSharedNotification,
  markSharedNotificationRead,
  deleteSharedNotification
} from './api';

function isMissingNotificationsRoute(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  const normalized = message.toLowerCase();
  return normalized.includes('route not found') || normalized.includes('not found');
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  details?: string;
  metadata?: Record<string, string>;
  time: string; // ISO string for consistency
  read: boolean;
  type: 'success' | 'warning' | 'error' | 'info';
}

/**
 * Returns latest cached notifications.
 * Use fetchSharedNotifications() to sync with backend.
 */
export function getNotifications(): NotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem('mercato_admin_notifications');
    const list = s ? JSON.parse(s) : [];
    // Sort by time descending
    return list.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
  } catch {
    return [];
  }
}

/** Syncs local state with latest shared notifications from Firestore. */
export async function fetchSharedNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await getSharedNotifications();
    if (res.success && res.notifications) {
      const mapped: NotificationItem[] = res.notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: n.createdAt,
        read: n.read || false,
        type: n.type
      }));
      saveNotifications(mapped);
      return mapped;
    }
  } catch (e) {
    if (!isMissingNotificationsRoute(e)) {
      console.warn('Failed to fetch shared notifications, using local cache.');
    }
  }
  return getNotifications();
}

export function saveNotifications(notifications: NotificationItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mercato_admin_notifications', JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent('notificationsUpdate', { detail: notifications }));
}

/**
 * Adds a notification globally (persisted in Firestore) and broadcasts to all admins.
 */
export async function addNotification(
  title: string,
  message: string = '',
  type: NotificationItem['type'] = 'info',
  options?: { details?: string; metadata?: Record<string, string> }
) {
  try {
    // Try backend first
    await addSharedNotification({ title, message, type, ...options });
    await fetchSharedNotifications();
  } catch (e) {
    if (!isMissingNotificationsRoute(e)) {
      console.warn('Failed to add shared notification, falling back to local cache.');
    }
    const list = getNotifications();
    const newItem: NotificationItem = {
      id: `local-${Date.now()}`,
      title,
      message,
      details: options?.details,
      metadata: options?.metadata,
      time: new Date().toISOString(),
      read: false,
      type,
    };
    saveNotifications([newItem, ...list]);
  }
}

export async function markAsRead(id: string) {
  try {
    await markSharedNotificationRead(id);
    const list = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(list);
  } catch (e) {
    const list = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(list);
    if (!isMissingNotificationsRoute(e)) {
      console.warn('Failed to sync mark-as-read remotely; updated local cache only.');
    }
  }
}

export async function deleteNotificationItem(id: string) {
  try {
    await deleteSharedNotification(id);
    const list = getNotifications().filter(n => n.id !== id);
    saveNotifications(list);
  } catch (e) {
    const list = getNotifications().filter(n => n.id !== id);
    saveNotifications(list);
    if (!isMissingNotificationsRoute(e)) {
      console.warn('Failed to sync deletion remotely; updated local cache only.');
    }
  }
}
