import {
  getSharedNotifications,
  addSharedNotification,
  markSharedNotificationRead,
  deleteSharedNotification
} from './api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
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
    console.error('Failed to fetch shared notifications:', e);
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
  message: string,
  type: 'success' | 'warning' | 'error' | 'info' = 'info'
) {
  try {
    await addSharedNotification({ title, message, type });
    await fetchSharedNotifications();
  } catch (e) {
    console.error('Failed to add shared notification:', e);
    const list = getNotifications();
    const newItem: NotificationItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
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
    console.error('Failed to mark read:', e);
  }
}

export async function deleteNotificationItem(id: string) {
  try {
    await deleteSharedNotification(id);
    const list = getNotifications().filter(n => n.id !== id);
    saveNotifications(list);
  } catch (e) {
    console.error('Failed to delete notification:', e);
  }
}
