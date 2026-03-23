
export type NotificationItem = {
    id: string;
    title: string;
    message: string;
    time: string;
    date: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
};

const STORAGE_KEY = 'mercato_admin_notifications';

export function getNotifications(): NotificationItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function saveNotifications(notifications: NotificationItem[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        window.dispatchEvent(new Event('notificationsUpdate'));
    } catch (error) {
        console.error('Failed to save notifications', error);
    }
}

export function addNotification(title: string, message: string = '', type: NotificationItem['type'] = 'info') {
    const notifications = getNotifications();
    const now = new Date();
    const newNotification: NotificationItem = {
        id: `n-${Date.now()}`,
        title,
        message,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        type,
        read: false
    };
    
    // Keep only last 50 notifications
    const updated = [newNotification, ...notifications].slice(0, 50);
    saveNotifications(updated);
}

export function markAsRead(id: string) {
    const notifications = getNotifications();
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
}

export function deleteNotification(id: string) {
    const notifications = getNotifications();
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
}
