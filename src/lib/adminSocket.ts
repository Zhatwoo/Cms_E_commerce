import { io, Socket } from 'socket.io-client';
import { fetchSharedNotifications } from './notifications';
import { getApiBase } from "./apiBase";

let socket: Socket | null = null;

function dispatchAdminDataChanged(detail?: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('admin:data_changed', { detail }));
}

export function getAdminSocket(): Socket {
  if (socket) return socket;

  const BACKEND = getApiBase(process.env.NEXT_PUBLIC_API_URL).replace(/\/api$/, '');
  
  socket = io(BACKEND, {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    withCredentials: true,
    reconnection: true,
  });

  socket.on('connect', () => {
    console.log('[AdminSocket] Connected for real-time notifications');
  });

  socket.on('notification:added', (newNotification) => {
    console.log('[AdminSocket] New shared notification received:', newNotification);
    fetchSharedNotifications();
    window.dispatchEvent(new CustomEvent('notification:new_received', { detail: newNotification }));
    dispatchAdminDataChanged(newNotification);
  });

  socket.on('notification:updated', (payload) => {
    fetchSharedNotifications();
    dispatchAdminDataChanged(payload);
  });

  socket.on('notification:deleted', (payload) => {
    fetchSharedNotifications();
    dispatchAdminDataChanged(payload);
  });

  socket.on('notification:all_read', (payload) => {
    console.log('[AdminSocket] All notifications marked as read by another admin');
    fetchSharedNotifications();
    dispatchAdminDataChanged(payload);
  });

  return socket;
}

export function disconnectAdminSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
