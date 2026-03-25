import { io, Socket } from 'socket.io-client';
import { fetchSharedNotifications } from './notifications';

let socket: Socket | null = null;

export function getAdminSocket(): Socket {
  if (socket) return socket;

  const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
  
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
  });

  socket.on('notification:updated', () => {
    fetchSharedNotifications();
  });

  socket.on('notification:deleted', () => {
    fetchSharedNotifications();
  });

  socket.on('notification:all_read', () => {
    console.log('[AdminSocket] All notifications marked as read by another admin');
    fetchSharedNotifications();
  });

  return socket;
}

export function disconnectAdminSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
