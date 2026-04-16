"use client";

import React, { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Bell, 
  Search, 
  Shield, 
  Clock, 
  Trash2, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  CheckCheck,
  Settings,
  Inbox,
  Trash,
  X
} from "lucide-react";
import dynamic from 'next/dynamic';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotificationItem, 
  fetchSharedNotifications,
  type NotificationItem 
} from "@/lib/notifications";
import { formatToPHTime } from "@/lib/dateUtils";
import { useAdminLoading } from "../../components/LoadingProvider";

const AdminSidebar = dynamic(() => import('../../components/sidebar'), { ssr: false }) as any;
const AdminHeader = dynamic(() => import('../../components/header'), { ssr: false }) as any;


const ITEMS_PER_PAGE = 6;

function ScrollbarStyles() {
  return (
    <style jsx global>{`
      .notifications-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .notifications-scrollbar::-webkit-scrollbar-track {
        background: rgba(177, 59, 255, 0.03);
        border-radius: 10px;
      }
      .notifications-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(177, 59, 255, 0.15);
        border-radius: 10px;
      }
      .notifications-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(177, 59, 255, 0.25);
      }
    `}</style>
  );
}

export default function NotificationsPageContent() {
  const { startLoading } = useAdminLoading();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read' | 'trash'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchSharedNotifications();
    setNotifications(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('notificationsUpdate', (e: any) => {
      if (e.detail) setNotifications(e.detail);
    });
    return () => window.removeEventListener('notificationsUpdate', loadData);
  }, []);

  const filteredList = useMemo(() => {
    return notifications.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeFilter === 'unread') return matchesSearch && !item.read;
      if (activeFilter === 'read') return matchesSearch && item.read;
      if (activeFilter === 'trash') return false; // Trash logic would need a separate list or flag
      return matchesSearch;
    });
  }, [notifications, searchQuery, activeFilter]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    if (confirm("Mark all notifications as read?")) {
      await markAllAsRead();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      await deleteNotificationItem(id);
    }
  };

  const getIcon = (type: string, read: boolean) => {
    const color = read ? 'text-[#A48ABF]' : 'text-[#b13bff]';
    switch (type) {
      case 'success': return <CheckCircle size={20} className={color} />;
      case 'warning': return <AlertTriangle size={20} className={color} />;
      case 'error': return <Shield size={20} className={color} />;
      default: return <Bell size={20} className={color} />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-white/40 opacity-80';
    switch (type) {
      case 'success': return 'bg-[#10b981]/5 border-[#10b981]/20';
      case 'warning': return 'bg-[#f5c000]/5 border-[#f5c000]/20';
      case 'error': return 'bg-[#ef4444]/5 border-[#ef4444]/20';
      default: return 'bg-white';
    }
  };

  return (
    <div className="admin-dashboard-shell flex h-screen overflow-hidden" suppressHydrationWarning>
      <AdminSidebar />
      <ScrollbarStyles />

      <AnimatePresence>
        {sidebarOpen && (
          <div className="lg:hidden">
            <AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-h-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-8 p-8 max-w-7xl mx-auto">
            
            <div>
              <h1 className="text-3xl font-bold text-[#4a1a8a] mb-2">Notification Center</h1>
              <p className="text-[#7a6aa0] font-medium text-sm">Keep track of your system alerts and administrative messages.</p>
            </div>

            <div className="grid grid-cols-12 gap-8">
              
              <div className="col-span-12 lg:col-span-3">
                <div className="admin-dashboard-panel space-y-2 rounded-[28px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-5 shadow-[0_8px_20px_rgba(123,78,192,0.1)]">
                  {[
                    { label: "Inbox", icon: Inbox, filter: "all" as const },
                    { label: "Unread", icon: Bell, filter: "unread" as const },
                    { label: "Read", icon: CheckCheck, filter: "read" as const },
                    { label: "Trash", icon: Trash, filter: "trash" as const },
                  ].map((tab) => (
                    <button
                      key={tab.label}
                      onClick={() => {
                        setActiveFilter(tab.filter);
                        setCurrentPage(1);
                      }}
                      className={`relative flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-base font-bold leading-none transition-all duration-300 ${
                        activeFilter === tab.filter 
                        ? "text-[#471396] bg-white shadow-md shadow-purple-500/5" 
                        : "text-[#471396]/60 hover:text-[#471396] hover:bg-white/40"
                      }`}
                    >
                      <tab.icon size={18} className={activeFilter === tab.filter ? "text-[#b13bff]" : "text-[#471396]/40"} />
                      <span>{tab.label}</span>
                      {tab.filter === "unread" && notifications.filter(n => !n.read).length > 0 && (
                        <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#f5c000] text-[10px] font-black text-[#471396] shadow-sm">
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </button>
                  ))}
                  
                  <div className="pt-4 mt-4 border-t border-[rgba(177,59,255,0.1)]">
                    <button
                      onClick={handleMarkAllRead}
                      className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-xs font-bold text-[#b13bff] transition-all hover:bg-[#b13bff]/5"
                    >
                      <CheckCheck size={16} />
                      <span>Mark all as read</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-9">
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="admin-dashboard-panel relative space-y-8 rounded-[36px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-8 shadow-[0_12px_36px_rgba(123,78,192,0.15)] overflow-hidden"
                >
                  <Bell className="absolute -right-8 -top-8 text-[#471396] opacity-[0.03]" size={180} />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-[rgba(177,59,255,0.1)] pb-8">
                    <div className="relative w-full sm:max-w-md">
                      <input
                        type="text"
                        placeholder="Search notifications..."
                        className="admin-dashboard-input h-14 w-full rounded-[30px] border-2 border-[rgba(177,59,255,0.12)] bg-white/80 pl-14 pr-4 text-sm font-bold text-[#471396] shadow-lg transition-all outline-none placeholder:text-[#8A86A4]/40 focus:border-[#471396]/30 focus:bg-white"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#f5c000]">
                        <Search size={22} strokeWidth={3} />
                      </div>
                    </div>
                    
                    <div className="flex items-center p-1.5 rounded-2xl bg-[rgba(177,59,255,0.06)] border border-[rgba(177,59,255,0.08)] shadow-inner">
                      {(['all', 'unread', 'read'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setActiveFilter(t);
                            setCurrentPage(1);
                          }}
                          className={`relative z-10 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeFilter === t 
                            ? 'text-white' 
                            : 'text-[#471396] hover:text-[#b13bff]'
                          }`}
                        >
                          {activeFilter === t && (
                            <motion.div
                              layoutId="activeFilterTab"
                              className="absolute inset-0 z-[-1] rounded-xl bg-[#471396]"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 notifications-scrollbar">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#b13bff] border-t-transparent" />
                        <p className="text-[10px] font-black text-[#471396] uppercase tracking-[0.2em]">Syncing messages...</p>
                      </div>
                    ) : paginatedList.length > 0 ? (
                      <AnimatePresence mode="popLayout">
                        {paginatedList.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: index * 0.05 }}
                            className={`group relative overflow-hidden rounded-[24px] border border-[rgba(166,61,255,0.12)] px-6 py-5 transition-all duration-300 hover:shadow-lg ${getBgColor(item.type, item.read)}`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(0,0,0,0.05)] bg-white shadow-inner`}>
                                {getIcon(item.type, item.read)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4">
                                  <p className={`text-lg font-black tracking-tight ${item.read ? 'text-[#4a1a8a]/60' : 'text-[#4a1a8a]'}`}>{item.title}</p>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest whitespace-nowrap">
                                    <Clock size={12} />
                                    {formatToPHTime(item.time)}
                                  </div>
                                </div>
                                <p className={`mt-1 text-sm font-bold leading-relaxed ${item.read ? 'text-[#7a6aa0]/60' : 'text-[#7a6aa0]'}`}>
                                  {item.message}
                                </p>
                                
                                <div className="mt-4 flex items-center justify-between border-t border-[rgba(177,59,255,0.06)] pt-3">
                                  <div className="flex gap-4">
                                    {!item.read && (
                                      <button 
                                        onClick={() => handleMarkRead(item.id)}
                                        className="text-[10px] font-black text-[#b13bff] uppercase tracking-widest hover:underline"
                                      >
                                        Mark as read
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => handleDelete(item.id)}
                                      className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:underline"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest opacity-40">#{item.id.slice(-6)}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 rounded-[32px] border-2 border-dashed border-[rgba(166,61,255,0.1)] bg-white/20">
                        <Inbox size={48} className="text-[#9CA3AF] mb-4 opacity-30" />
                        <p className="text-xs font-black text-[#9CA3AF] uppercase tracking-[0.3em]">No notifications found</p>
                      </div>
                    )}
                  </div>

                  {!isLoading && filteredList.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between border-t border-[rgba(177,59,255,0.1)] pt-8">
                      <p className="text-[10px] font-black text-[#8A86A4] uppercase tracking-widest">
                        Page {currentPage} of {totalPages}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white text-[#4a1a8a] disabled:opacity-30 hover:bg-white/80 transition-all shadow-sm border border-purple-100"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white text-[#4a1a8a] disabled:opacity-30 hover:bg-white/80 transition-all shadow-sm border border-purple-100"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
