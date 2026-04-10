'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Inbox,
  Clock,
  Archive,
  Settings,
} from 'lucide-react';
import { useTheme } from '../components/context/theme-context';
import { useAuth } from '../components/context/auth-context';
import { SearchBar } from '../components/ui/searchbar';
import {
  markAsRead,
  markAllAsRead,
  deleteNotificationItem,
  fetchSharedNotifications,
  type NotificationItem,
} from '@/lib/notifications';
import { formatToPHTime } from '@/lib/dateUtils';
import { TabBar } from '../components/ui/tabbar';

const ITEMS_PER_PAGE = 6;

function ScrollbarStyles() {
  return (
    <style jsx global>{`
      .client-notifications-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .client-notifications-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 206, 0, 0.03);
        border-radius: 10px;
      }
      .client-notifications-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 206, 0, 0.15);
        border-radius: 10px;
      }
      .client-notifications-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 206, 0, 0.25);
      }
    `}</style>
  );
}

export default function NotificationsPage() {
  const { theme, colors } = useTheme();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSharedNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
    setIsLoading(false);
  };

  // useEffect(() => {
  //   loadData();
  //   window.addEventListener('notificationsUpdate', loadData);
  //   return () => window.removeEventListener('notificationsUpdate', loadData);
  // }, []);

  const filteredList = useMemo(() => {
    return notifications.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message.toLowerCase().includes(searchQuery.toLowerCase());

      const isArchived = archivedIds.has(item.id);

      if (activeFilter === 'unread') return matchesSearch && !item.read && !isArchived;
      if (activeFilter === 'read') return matchesSearch && item.read && !isArchived;
      if (activeFilter === 'archived') return matchesSearch && isArchived;
      if (activeFilter === 'all') return matchesSearch && !isArchived;
      return matchesSearch && !isArchived;
    });
  }, [notifications, searchQuery, activeFilter, archivedIds]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    if (confirm('Mark all notifications as read?')) {
      await markAllAsRead();
    }
  };

  const handleArchive = (id: string) => {
    setArchivedIds(prev => new Set(prev).add(id));
  };

  const handleUnarchive = (id: string) => {
    setArchivedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const getIcon = (type: string, read: boolean) => {
    const iconColor = read
      ? theme === 'dark'
        ? colors.text.secondary
        : colors.text.secondary
      : colors.accent.yellow;

    switch (type) {
      case 'success':
        return <CheckCircle size={20} style={{ color: iconColor }} />;
      case 'warning':
        return <AlertTriangle size={20} style={{ color: iconColor }} />;
      case 'error':
        return <AlertTriangle size={20} style={{ color: iconColor }} />;
      default:
        return <Bell size={20} style={{ color: iconColor }} />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    if (read) {
      return theme === 'dark'
        ? 'rgba(135, 153, 192, 0.05)'
        : 'rgba(15, 23, 42, 0.05)';
    }

    switch (type) {
      case 'success':
        return theme === 'dark'
          ? 'rgba(163, 230, 53, 0.08)'
          : 'rgba(163, 230, 53, 0.08)';
      case 'warning':
        return theme === 'dark'
          ? 'rgba(255, 206, 0, 0.08)'
          : 'rgba(255, 206, 0, 0.08)';
      case 'error':
        return theme === 'dark'
          ? 'rgba(253, 164, 175, 0.08)'
          : 'rgba(253, 164, 175, 0.08)';
      default:
        return theme === 'dark'
          ? 'rgba(166, 76, 217, 0.06)'
          : 'rgba(166, 76, 217, 0.06)';
    }
  };

  const getBorderColor = (type: string, read: boolean) => {
    if (read) {
      return theme === 'dark'
        ? 'rgba(135, 153, 192, 0.1)'
        : 'rgba(15, 23, 42, 0.1)';
    }

    switch (type) {
      case 'success':
        return 'rgba(163, 230, 53, 0.2)';
      case 'warning':
        return 'rgba(255, 206, 0, 0.2)';
      case 'error':
        return 'rgba(253, 164, 175, 0.2)';
      default:
        return 'rgba(166, 76, 217, 0.12)';
    }
  };

  return (
    <div
      className="dashboard-landing-light relative min-h-[calc(100vh-176px)] px-3 py-3 sm:px-5 sm:py-4 lg:px-40 [font-family:var(--font-outfit),sans-serif] overflow-y-auto"
      suppressHydrationWarning
    >
      <ScrollbarStyles />

      <section className="w-full">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Title */}
          <h1
            className="text-4xl sm:text-6xl lg:text-[76px] font-black tracking-[-1.8px] leading-[1.2] [font-family:var(--font-outfit),sans-serif]"
            style={{ color: colors.text.primary }}
          >
            All{' '}
            <span
              className={`inline-block bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
              style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}
            >
              Notifications
            </span>
          </h1>
          {/* Subtitle */}
          <p className={`text-base sm:text-lg mt-2 ${theme === 'dark' ? 'text-[#8A8FC4]' : 'text-[#120533]/70'}`}>
            Keep track of your store updates and messages.
          </p>
        </div>

        {/* TabBar Filters */}
        <div className="mb-8 flex items-center justify-center border-b pb-4" style={{ borderColor: colors.border.faint }}>
          <TabBar
            tabs={[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'read', label: 'Read' },
              { id: 'archived', label: 'Archive' },
            ]}
            activeTab={activeFilter}
            onTabChange={(tab) => {
              setActiveFilter(tab as 'all' | 'unread' | 'read' | 'archived');
              setCurrentPage(1);
            }}
            theme={theme as 'dark' | 'light'}
          />
        </div>

        {/* Search and Mark All Read */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-center">
            <SearchBar
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
              placeholder="Search notifications..."
              theme={theme as 'dark' | 'light'}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleMarkAllRead}
              className="inline-flex h-10 items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:-translate-y-1 hover:brightness-110 active:scale-95 disabled:opacity-70"
              style={{
                background: theme === 'dark' ? '#FACC15' : 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
                color: theme === 'dark' ? '#120533' : '#FFFFFF',
                boxShadow: theme === 'dark' ? '0 8px 24px rgba(255, 206, 0, 0.42)' : '0 8px 24px rgba(217,70,239,0.4)',
              }}
            >
              <CheckCheck size={16} />
              <span>Mark all as read</span>
            </button>

            <Link
              href="/m_dashboard/settings?tab=notifications"
              className="inline-flex h-10 items-center justify-center p-2.5 rounded-xl transition-all hover:-translate-y-1 hover:brightness-110 active:scale-95"
              style={{
                background: theme === 'dark' ? 'rgba(255, 206, 0, 0.1)' : 'rgba(166, 76, 217, 0.1)',
                color: colors.accent.yellow,
                boxShadow: theme === 'dark' ? '0 4px 12px rgba(255, 206, 0, 0.2)' : '0 4px 12px rgba(166, 76, 217, 0.15)',
              }}
              title="Notification Settings"
            >
              <Settings size={20} />
            </Link>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 client-notifications-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 rounded-[32px] border" style={{ borderColor: colors.border.faint, backgroundColor: theme === 'dark' ? colors.bg.card : colors.bg.primary }}>
              <div
                className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
                style={{
                  borderColor: colors.accent.yellow,
                  borderTopColor: 'transparent',
                }}
              />
              <p
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: colors.text.secondary }}
              >
                Loading notifications...
              </p>
            </div>
          ) : paginatedList.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {paginatedList.map((item, index) => {
                const isArchived = archivedIds.has(item.id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-[20px] border px-5 py-4 transition-all duration-300 hover:shadow-lg"
                    style={{
                      backgroundColor: theme === 'dark' ? '#2A2560' : '#ffffff',
                      borderColor: getBorderColor(item.type, item.read),
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border shadow-inner"
                        style={{
                          backgroundColor:
                            theme === 'dark'
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(166, 76, 217, 0.05)',
                          borderColor:
                            theme === 'dark'
                              ? 'rgba(255, 206, 0, 0.1)'
                              : 'rgba(166, 76, 217, 0.1)',
                        }}
                      >
                        {getIcon(item.type, item.read)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <p
                            className="text-base font-bold tracking-tight"
                            style={{
                              color: item.read
                                ? colors.text.secondary
                                : colors.text.primary,
                            }}
                          >
                            {item.title}
                          </p>
                          <div
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                            style={{ color: colors.text.secondary }}
                          >
                            <Clock size={12} />
                            {formatToPHTime(item.time)}
                          </div>
                        </div>
                        <p
                          className="mt-1 text-sm font-medium leading-relaxed"
                          style={{
                            color: item.read
                              ? colors.text.secondary
                              : colors.text.primary,
                          }}
                        >
                          {item.message}
                        </p>

                        <div
                          className="mt-3 flex items-center justify-between border-t pt-3"
                          style={{ borderColor: theme === 'dark' ? colors.border.faint : 'rgba(166, 76, 217, 0.1)' }}
                        >
                          <div className="flex gap-4">
                            {!item.read && (
                              <button
                                onClick={() => handleMarkRead(item.id)}
                                className="text-[10px] font-bold uppercase tracking-widest hover:underline transition-all"
                                style={{ color: colors.accent.yellow }}
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => isArchived ? handleUnarchive(item.id) : handleArchive(item.id)}
                              className="text-[10px] font-bold uppercase tracking-widest hover:underline transition-all flex items-center gap-1"
                              style={{ color: '#FDA4AF' }}
                            >
                              <Archive size={14} />
                              {isArchived ? 'Unarchive' : 'Archive'}
                            </button>
                          </div>
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest opacity-40"
                            style={{ color: colors.text.secondary }}
                          >
                            #{item.id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-20 rounded-[28px] border-2 border-dashed"
              style={{
                borderColor: colors.border.faint,
                backgroundColor:
                  theme === 'dark'
                    ? 'rgba(255, 206, 0, 0.02)'
                    : 'rgba(166, 76, 217, 0.02)',
              }}
            >
              <Inbox
                size={48}
                className="mb-4 opacity-30"
                style={{ color: colors.text.secondary }}
              />
              <p
                className="text-xs font-bold uppercase tracking-[0.3em]"
                style={{ color: colors.text.secondary }}
              >
                No notifications found
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredList.length > ITEMS_PER_PAGE && (
          <div
            className="flex items-center justify-between border-t pt-8 mt-8"
            style={{ borderColor: colors.border.faint }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: colors.text.secondary }}
            >
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 flex items-center justify-center rounded-lg transition-all shadow-sm border disabled:opacity-30 hover:opacity-80"
                style={{
                  backgroundColor:
                    theme === 'dark'
                      ? 'rgba(255, 206, 0, 0.1)'
                      : 'rgba(166, 76, 217, 0.1)',
                  borderColor:
                    theme === 'dark'
                      ? 'rgba(255, 206, 0, 0.2)'
                      : 'rgba(166, 76, 217, 0.2)',
                  color: colors.accent.yellow,
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-9 w-9 flex items-center justify-center rounded-lg transition-all shadow-sm border disabled:opacity-30 hover:opacity-80"
                style={{
                  backgroundColor:
                    theme === 'dark'
                      ? 'rgba(255, 206, 0, 0.1)'
                      : 'rgba(166, 76, 217, 0.1)',
                  borderColor:
                    theme === 'dark'
                      ? 'rgba(255, 206, 0, 0.2)'
                      : 'rgba(166, 76, 217, 0.2)',
                  color: colors.accent.yellow,
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
