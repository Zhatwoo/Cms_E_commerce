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
  Trash
} from "lucide-react";
import { AdminSidebar } from "../components/sidebar";
import { AdminHeader } from "../components/header";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotificationItem, 
  type NotificationItem 
} from "@/lib/notifications";
import { formatToPHTime } from "@/lib/dateUtils";
import { useAdminLoading } from "../components/LoadingProvider";

// Custom styles for the scrollable area
const ScrollbarStyles = () => (
  <style jsx global>{`
    .notifications-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .notifications-scrollbar::-webkit-scrollbar-track {
      background: rgba(177, 59, 255, 0.05);
      border-radius: 10px;
    }
    .notifications-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(177, 59, 255, 0.15);
      border-radius: 10px;
    }
    .notifications-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(177, 59, 255, 0.25);
      border-radius: 10px;
    }
  `}</style>
);

type FilterType = "all" | "unread" | "read" | "trash";

export default function NotificationsPage() {
  const { startLoading, stopLoading } = useAdminLoading();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [trash, setTrash] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  const loadNotifications = () => {
    const list = getNotifications();
    setNotifications(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadNotifications();
    window.addEventListener('notificationsUpdate', loadNotifications);
    return () => window.removeEventListener('notificationsUpdate', loadNotifications);
  }, []);

  // Sync loading state with provider
  useEffect(() => {
    if (isLoading) startLoading();
    else stopLoading();
  }, [isLoading, startLoading, stopLoading]);

  // Derived Data
  const filteredList = useMemo(() => {
    let base = activeFilter === "trash" ? trash : notifications;
    
    return base.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           n.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === "all" || 
                           activeFilter === "trash" || 
                           (activeFilter === "unread" && !n.read) || 
                           (activeFilter === "read" && n.read);
      return matchesSearch && matchesFilter;
    });
  }, [notifications, trash, searchQuery, activeFilter]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  const getIcon = (type: string, read: boolean) => {
    switch (type) {
      case "success":
        return <CheckCircle className={read ? "text-emerald-400" : "text-emerald-500"} size={20} />;
      case "warning":
        return <AlertTriangle className={read ? "text-orange-400" : "text-orange-500"} size={20} />;
      case "error":
        return <Trash2 className={read ? "text-red-400" : "text-red-500"} size={20} />;
      default:
        return <Info className={read ? "text-blue-400" : "text-blue-500"} size={20} />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    if (read) return "bg-gray-50 border-gray-100 opacity-60";
    switch (type) {
      case "success":
        return "bg-emerald-50 border-emerald-100";
      case "warning":
        return "bg-orange-50 border-orange-100";
      case "error":
        return "bg-red-50 border-red-100";
      default:
        return "bg-blue-50 border-blue-100";
    }
  };

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (id: string) => {
    const item = notifications.find(n => n.id === id);
    if (item) {
      setTrash(prev => [item, ...prev]);
      await deleteNotificationItem(id);
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
            
            {/* Custom Header Section */}
            <div>
              <h1 className="text-3xl font-bold text-[#4a1a8a] mb-2">Notification Center</h1>
              <p className="text-[#7a6aa0] font-medium">Keep track of your system alerts and administrative messages.</p>
            </div>

            <div className="grid grid-cols-12 gap-8">
              
              {/* Internal Sidebar mimicking Image 2 */}
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
                      onClick={() => setActiveFilter(tab.filter)}
                      className={`relative flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-lg font-bold leading-none transition-all duration-300 ${
                        activeFilter === tab.filter 
                        ? "text-[#471396] bg-white shadow-md shadow-purple-500/5 rotate-1" 
                        : "text-[#471396]/60 hover:text-[#471396] hover:bg-white/40"
                      }`}
                    >
                      <tab.icon size={20} className={activeFilter === tab.filter ? "text-[#b13bff]" : "text-[#471396]/40"} />
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
                      className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-sm font-bold text-[#b13bff] transition-all hover:bg-[#b13bff]/5"
                    >
                      <CheckCheck size={18} />
                      <span>Mark all as read</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content Area mimicking Image 2 */}
              <div className="col-span-12 lg:col-span-9">
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="admin-dashboard-panel relative space-y-8 rounded-[36px] border border-[rgba(177,59,255,0.22)] bg-[#F5F4FF] p-8 shadow-[0_12px_36px_rgba(123,78,192,0.15)] overflow-hidden"
                >
                  {/* Decorative Background Icon */}
                  <Bell className="absolute -right-8 -top-8 text-[#471396] opacity-[0.03]" size={180} />

                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black text-[#471396] tracking-tight">System Notifications</h2>
                      <div className="mt-1 flex items-center gap-2 text-sm font-bold text-[#8A86A4]">
                        <Shield size={14} className="text-[#b13bff]" />
                        <span className="uppercase tracking-widest text-[10px]">Real-time system health and administrative alerts</span>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filters mirroring Image 2 */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-[rgba(177,59,255,0.1)] pb-8">
                    <div className="relative w-full sm:max-w-md">
                      <input
                        type="text"
                        placeholder="Search notifications, events..."
                        className="admin-dashboard-input h-14 w-full rounded-[30px] border-2 border-[rgba(177,59,255,0.12)] bg-white/80 pl-14 pr-4 text-base font-bold text-[#471396] shadow-lg transition-all outline-none placeholder:text-[#8A86A4]/40 focus:border-[#471396]/30 focus:bg-white focus:ring-8 focus:ring-[#471396]/5"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#f5c000]">
                        <Search size={24} strokeWidth={3} />
                      </div>
                    </div>
                    
                    <div className="flex items-center p-1.5 rounded-2xl bg-[rgba(177,59,255,0.06)] border border-[rgba(177,59,255,0.08)] shadow-inner overflow-x-auto max-w-full">
                      {(['all', 'unread', 'read', 'trash'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setActiveFilter(t)}
                          className={`relative z-10 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-300 whitespace-nowrap ${
                            activeFilter === t 
                            ? 'text-white' 
                            : 'text-[#471396] hover:text-[#b13bff]'
                          }`}
                        >
                          {activeFilter === t && (
                            <motion.div
                              layoutId="activeFilterTab"
                              className="absolute inset-0 z-[-1] rounded-xl bg-[#471396] shadow-lg"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notifications List Card style mirroring Image 2 */}
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 notifications-scrollbar">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#b13bff] border-t-transparent" />
                        <p className="text-xs font-black text-[#471396] uppercase tracking-[0.2em]">Synchronizing messages...</p>
                      </div>
                    ) : paginatedList.length > 0 ? (
                      <AnimatePresence mode="popLayout">
                        {paginatedList.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`group relative overflow-hidden rounded-[24px] border border-[rgba(166,61,255,0.12)] px-6 py-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${getBgColor(item.type, item.read)}`}
                          >
                            <div className="flex items-start gap-5">
                              <div className={`mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${getBgColor(item.type, false)} shadow-inner group-hover:scale-110 transition-transform`}>
                                {getIcon(item.type, item.read)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4">
                                  <p className={`text-xl font-black tracking-tight ${item.read ? 'text-[#4a1a8a]/60' : 'text-[#4a1a8a]'}`}>{item.title}</p>
                                  <div className="flex items-center gap-2 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest whitespace-nowrap">
                                    <Clock size={14} />
                                    {formatToPHTime(item.time)}
                                  </div>
                                </div>
                                <p className={`mt-2 text-base font-bold leading-relaxed ${item.read ? 'text-[#7a6aa0]/60' : 'text-[#7a6aa0]'}`}>
                                  {item.message}
                                </p>
                                
                                <div className="mt-4 flex items-center justify-between border-t border-[rgba(0,0,0,0.03)] pt-4">
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
                                      {activeFilter === 'trash' ? 'Delete Permanently' : 'Move to trash'}
                                    </button>
                                  </div>
                                  <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">ID: #{item.id.slice(-6)}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 rounded-[32px] border-4 border-dashed border-[rgba(166,61,255,0.1)] bg-white/20">
                        <Inbox size={60} className="text-[#9CA3AF] mb-6 opacity-30" />
                        <p className="text-sm font-black text-[#9CA3AF] uppercase tracking-[0.3em]">Your inbox is clear</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination Footer */}
                  {!isLoading && filteredList.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between border-t border-[rgba(177,59,255,0.1)] pt-8">
                      <p className="text-[10px] font-black text-[#8A86A4] uppercase tracking-widest">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)} of {filteredList.length} alerts
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-[#4a1a8a] disabled:opacity-30 hover:bg-white/80 transition-all shadow-sm border border-purple-100"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (totalPages > 5 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                            if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-1 text-[#8A86A4]">...</span>;
                            return null;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`h-10 w-10 rounded-xl text-xs font-black transition-all ${
                                currentPage === pageNum
                                ? 'bg-[#f5c000] text-[#471396] shadow-md scale-110 rotate-3'
                                : 'bg-white text-[#471396] hover:bg-white/80 shadow-sm border border-purple-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-[#4a1a8a] disabled:opacity-30 hover:bg-white/80 transition-all shadow-sm border border-purple-100"
                        >
                          <ChevronRight size={20} />
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
