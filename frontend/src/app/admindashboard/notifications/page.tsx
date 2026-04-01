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

type NotificationTab = "list" | "configure" | "trash";

type NotificationItem = LibNotificationItem;

type NotificationSetting = {
	id: string;
	label: string;
	email: boolean;
	push: boolean;
};

function ModalShell({
	children,
	isOpen,
	onClose,
}: {
	children: React.ReactNode;
	isOpen: boolean;
	onClose: () => void;
}) {
	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(215,204,245,0.66)] p-4 backdrop-blur-[4px]"
				onClick={onClose}
			>
				<motion.div
					initial={{ scale: 0.97, opacity: 0, y: 12 }}
					animate={{ scale: 1, opacity: 1, y: 0 }}
					exit={{ scale: 0.97, opacity: 0, y: 8 }}
					transition={{ duration: 0.22 }}
					className="admin-dashboard-panel w-full max-w-[520px] rounded-[28px] border border-[rgba(177,59,255,0.24)] bg-[#F5F4FF] p-8 shadow-[0_16px_40px_rgba(123,78,192,0.16)]"
					onClick={(event) => event.stopPropagation()}
				>
					{children}
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}

function NotificationCheckbox({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
}) {
	return (
		<label className="inline-flex cursor-pointer items-center justify-center">
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
				className="peer sr-only"
				aria-label={label}
			/>
			<span className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-[#A148FF] bg-white text-white transition peer-checked:bg-[#A148FF] peer-checked:text-white">
				<CheckIcon />
			</span>
		</label>
	);
}

function ActionButton({
	children,
	onClick,
	disabled,
	icon,
}: {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
	icon?: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="inline-flex items-center gap-3 rounded-[18px] border border-[rgba(177,59,255,0.16)] bg-white px-6 py-3 text-[1.05rem] font-semibold text-[#857E9F] shadow-[0_5px_0_rgba(208,168,255,0.55)] transition hover:-translate-y-[1px] hover:text-[#471396] disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#F2F0F7] disabled:shadow-none"
		>
			{icon}
			<span>{children}</span>
		</button>
	);
}

function NotificationsPageContent() {
	const { startLoading } = useAdminLoading();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<NotificationTab>("list");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [trashSelectedIds, setTrashSelectedIds] = useState<string[]>([]);
	const [showRestoreModal, setShowRestoreModal] = useState(false);
	const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [trash, setTrash] = useState<NotificationItem[]>([]);
	const [detailItem, setDetailItem] = useState<NotificationItem | null>(null);

	useEffect(() => {
		const load = () => {
			setNotifications(getNotifications());
		};
		load();
		window.addEventListener('notificationsUpdate', load);
		return () => window.removeEventListener('notificationsUpdate', load);
	}, []);

	const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
		{ id: "evt-site-publish", label: "Takedown Website", email: true, push: true },
		{ id: "evt-template-update", label: "Delete Website", email: true, push: true },
		{ id: "evt-custom-domain", label: "Delete Product", email: true, push: true },
		{ id: "evt-user-modified", label: "Modified User", email: true, push: true },
	]);

	const unreadCount = notifications.filter((item) => !item.read).length;
	const allSelected = notifications.length > 0 && selectedIds.length === notifications.length;
	const trashAllSelected = trash.length > 0 && trashSelectedIds.length === trash.length;

	const setUniqueSelection = (ids: string[]) => Array.from(new Set(ids));

	const toggleSelectAll = (checked: boolean) => {
		setSelectedIds(checked ? notifications.map((item) => item.id) : []);
	};

	const toggleSelectOne = (id: string, checked: boolean) => {
		setSelectedIds((prev) =>
			checked ? setUniqueSelection([...prev, id]) : prev.filter((item) => item !== id)
		);
	};

	const toggleTrashSelectAll = (checked: boolean) => {
		setTrashSelectedIds(checked ? trash.map((item) => item.id) : []);
	};

	const toggleTrashSelectOne = (id: string, checked: boolean) => {
		setTrashSelectedIds((prev) =>
			checked ? setUniqueSelection([...prev, id]) : prev.filter((item) => item !== id)
		);
	};

	const handleMarkAsRead = () => {
		if (selectedIds.length === 0) return;
		markAsRead(selectedIds[0]); // Actually markAsRead should probably support multiple or I use a loop
		// Wait, lib/notifications.ts markAsRead only takes one ID.
		// But I should use the one I added: markAllAsRead or loop markAsRead.
		selectedIds.forEach(id => markAsRead(id));
		setSelectedIds([]);
	};

	const handleMarkAllAsRead = async () => {
		await markAllAsRead();
		setSelectedIds([]);
	};

	const handleDelete = () => {
		if (selectedIds.length === 0) return;
		const toTrash = notifications.filter((item) => selectedIds.includes(item.id));
		setTrash((current) => [...toTrash.filter((item) => !current.some((entry) => entry.id === item.id)), ...current]);
		const updated = notifications.filter((item) => !selectedIds.includes(item.id));
		saveNotifications(updated);
		setSelectedIds([]);
	};

	const handleRestore = (id: string) => {
		const restored = trash.find((item) => item.id === id);
		if (!restored) return;
		setTrash((prev) => prev.filter((item) => item.id !== id));
		setNotifications((current) => (current.some((item) => item.id === restored.id) ? current : [restored, ...current]));
	};

	const handlePermanentDelete = (id: string) => {
		setTrash((prev) => prev.filter((item) => item.id !== id));
	};

	const handleBulkRestore = () => {
		trashSelectedIds.forEach((id) => handleRestore(id));
		setTrashSelectedIds([]);
		setShowRestoreModal(false);
	};

	const handleBulkPermanentDelete = () => {
		trashSelectedIds.forEach((id) => handlePermanentDelete(id));
		setTrashSelectedIds([]);
		setShowPermanentDeleteModal(false);
	};

	const handleSettingToggle = (id: string, channel: "email" | "push") => {
		setNotificationSettings((prev) => prev.map((item) => (item.id === id ? { ...item, [channel]: !item[channel] } : item)));
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
