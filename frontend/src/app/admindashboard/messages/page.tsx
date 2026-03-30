'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import { getMessages, sendMessage, markMessageRead, type ApiMessage, getMe } from '@/lib/api';
import { addNotification } from '@/lib/notifications';
import { format } from 'date-fns';

/* ── Icons ──────────────────────────────────────────────────────── */
const SearchIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const FilterIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4.5h18M6.75 9.5h10.5M10.5 14.5h3M12 19.5h0" />
    </svg>
);

const SendIcon = () => (
    <svg className="h-5 w-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

/* ── Styles ─────────────────────────────────────────────────────── */
const glassPanel = {
    background: 'rgba(255, 255, 255, 0.78)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(177, 59, 255, 0.16)',
    boxShadow: '0 8px 40px rgba(103, 2, 191, 0.07)',
};

const messageBubbleAdmin = {
    background: 'linear-gradient(135deg, #B13BFF 0%, #7B1DE8 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(123, 29, 232, 0.2)',
};

const messageBubbleClient = {
    background: 'rgba(240, 235, 255, 0.85)',
    border: '1px solid rgba(177, 59, 255, 0.12)',
    color: '#3B1278',
};

/* ── Components ─────────────────────────────────────────────────── */

export default function MessageHubPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeType, setActiveType] = useState<'all' | 'support' | 'internal' | 'request'>('all');
    const [messages, setMessages] = useState<ApiMessage[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<ApiMessage | null>(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMessages = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const filter = activeType === 'all' ? {} : { type: activeType };
            const res = await getMessages(filter);
            if (res.success) {
                setMessages(res.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [activeType]);

    useEffect(() => {
        fetchMessages();
        getMe().then(res => res.user && setCurrentUser(res.user));
    }, [fetchMessages]);

    // Polling for new messages every 15s
    useEffect(() => {
        const interval = setInterval(() => fetchMessages(true), 15000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    const filteredMessages = useMemo(() => {
        return (messages || []).filter(m => 
            m.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.message.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [messages, searchQuery]);

    const handleSendMessage = async () => {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            const res = await sendMessage({
                message: replyText,
                type: activeType === 'all' ? 'internal' : activeType,
                senderName: currentUser?.name || 'Administrator',
                websiteId: selectedMessage?.websiteId || undefined
            });
            if (res.success) {
                setReplyText('');
                fetchMessages(true);
                addNotification("Message Sent", "Message successfully broadcasted.", "success");
            }
        } catch (error) {
            addNotification("Error", "Message delivery failed.", "error");
        } finally {
            setSending(false);
        }
    };

    const handleSelectMessage = async (msg: ApiMessage) => {
        setSelectedMessage(msg);
        if (msg.status === 'unread') {
            await markMessageRead(msg.id);
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' as const } : m));
        }
    };

    return (
        <div className="admin-dashboard-shell flex h-screen w-full overflow-hidden bg-[#FBF9FF] text-[#471396]">
            <AdminSidebar forcedActiveItemId="messaging" />

            <AnimatePresence>
                {sidebarOpen && (
                    <div className="lg:hidden">
                        <AdminSidebar mobile onClose={() => setSidebarOpen(false)} forcedActiveItemId="messaging" />
                    </div>
                )}
            </AnimatePresence>

            <div className="flex min-h-0 flex-1 flex-col min-w-0">
                <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                
                <main className="flex-1 flex overflow-hidden p-6 lg:p-8">
                    <div className="flex h-full w-full gap-6 overflow-hidden">
                        
                        {/* 1. Filter Sidebar */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden lg:flex w-72 flex-col gap-6"
                        >
                            <div className="p-4 rounded-[32px]" style={glassPanel}>
                                <h2 className="text-xl font-bold mb-4 px-3 py-2 text-[#7B1DE8]">Messaging Hub</h2>
                                <div className="space-y-1.5 px-1">
                                    {[
                                        { id: 'all', label: 'All Feed', icon: '📩' },
                                        { id: 'support', label: 'Client Inquiries', icon: '🎧' },
                                        { id: 'internal', label: 'Admin Chat', icon: '👥' },
                                        { id: 'request', label: 'Requests', icon: '⚡' },
                                    ].map((type) => (
                                        <motion.button
                                            key={type.id}
                                            whileTap={{ scale: 0.94 }}
                                            onClick={() => setActiveType(type.id as any)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                                                activeType === type.id 
                                                    ? 'bg-[#B13BFF] text-white shadow-lg shadow-purple-200/50' 
                                                    : 'hover:bg-purple-50 text-[#6F4796]/80 hover:text-[#471396]'
                                            }`}
                                        >
                                            <span className="text-lg">{type.icon}</span>
                                            <span className="text-sm">{type.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 rounded-[32px]" style={glassPanel}>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#B13BFF] mb-3 px-3">Quick Actions</h3>
                                <div className="space-y-1 px-1">
                                    <motion.button whileTap={{ scale: 0.94 }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold hover:bg-purple-50 text-[#6F4796]/80 transition-all">
                                        <span className="grayscale opacity-70">⚙️</span>
                                        <span className="text-sm">Notification Filters</span>
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.94 }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold hover:bg-red-50 text-red-400 transition-all">
                                        <span className="grayscale opacity-70">🗑️</span>
                                        <span className="text-sm">Clear Archive</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>

                        {/* 2. Conversations List */}
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 }}
                            className="flex flex-1 flex-col rounded-[32px] overflow-hidden" 
                            style={glassPanel}
                        >
                            <div className="p-6 border-b border-purple-100/50 flex items-center justify-between gap-4">
                                <div className="relative flex-1">
                                    <input 
                                        type="text" 
                                        placeholder="Filter by sender or content..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-purple-50/40 rounded-2xl text-sm font-semibold placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/10 transition-shadow"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B13BFF]/60">
                                        <SearchIcon />
                                    </div>
                                </div>
                                <motion.button 
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => fetchMessages()}
                                    className="p-3 rounded-2xl bg-purple-100/40 text-[#B13BFF] hover:bg-purple-100/60 transition-colors"
                                >
                                    <RefreshIcon />
                                </motion.button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center flex-col gap-4">
                                        <div className="w-12 h-12 border-[5px] border-[#B13BFF]/10 border-t-[#B13BFF] rounded-full animate-spin" />
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-[#B13BFF] animate-pulse">Syncing Cloud</span>
                                    </div>
                                ) : filteredMessages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center flex-col gap-3 p-12 text-center">
                                        <div className="text-5xl mb-2 grayscale opacity-40">📬</div>
                                        <h3 className="text-lg font-black text-[#471396]/80 tracking-tight">Zero Conversations</h3>
                                        <p className="text-sm font-semibold text-[#8A66C0] max-w-[260px]">The hub is currently empty. Incoming inquiries will appear here automatically.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {filteredMessages.map((msg) => (
                                            <motion.button
                                                key={msg.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleSelectMessage(msg)}
                                                className={`w-full flex items-start gap-4 p-4 rounded-[24px] transition-all ${
                                                    selectedMessage?.id === msg.id 
                                                        ? 'bg-white shadow-lg shadow-purple-200/20 border border-purple-100/80' 
                                                        : 'hover:bg-white/40 border border-transparent'
                                                }`}
                                            >
                                                <div className="relative shrink-0">
                                                    {msg.senderAvatar ? (
                                                        <img src={msg.senderAvatar} alt="" className="h-13 w-13 rounded-2xl object-cover shadow-sm border-2 border-white" />
                                                    ) : (
                                                        <div className="h-13 w-13 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-[#B13BFF] shadow-inner font-black text-xl border-2 border-white">
                                                            {msg.senderName.charAt(0)}
                                                        </div>
                                                    )}
                                                    {msg.status === 'unread' && (
                                                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-[#FFCC00] border-[3px] border-white rounded-full shadow-sm" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 text-left">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h4 className={`text-[15px] font-black truncate tracking-tight ${msg.status === 'unread' ? 'text-[#471396]' : 'text-[#8A66C0]'}`}>
                                                            {msg.senderName}
                                                        </h4>
                                                        <span className="text-[10px] font-black text-[#B13BFF]/60 uppercase tracking-tighter">
                                                            {format(new Date(msg.createdAt), 'h:mm a')}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs line-clamp-2 leading-relaxed ${msg.status === 'unread' ? 'font-bold text-[#6F4796]' : 'text-[#8A66C0]'}`}>
                                                        {msg.message}
                                                    </p>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                            msg.type === 'support' ? 'bg-green-100 text-green-600' :
                                                            msg.type === 'internal' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-orange-100 text-orange-600'
                                                        }`}>
                                                            {msg.type}
                                                        </span>
                                                        {msg.websiteId && (
                                                            <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-[9px] font-black text-[#B13BFF]/70 truncate max-w-[120px]">
                                                                ID: {msg.websiteId.slice(-8)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* 3. Message Display */}
                        <motion.div 
                            initial={{ opacity: 0, x: 25 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="hidden lg:flex w-[520px] flex-col rounded-[32px] overflow-hidden" 
                            style={glassPanel}
                        >
                            {selectedMessage ? (
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={selectedMessage.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex flex-col h-full"
                                    >
                                        {/* Header */}
                                        <div className="p-7 border-b border-purple-100/50 bg-white/40">
                                            <div className="flex items-center gap-5 mb-5">
                                                {selectedMessage.senderAvatar ? (
                                                    <img src={selectedMessage.senderAvatar} alt="" className="h-16 w-16 rounded-[22px] object-cover shadow-xl border-2 border-white" />
                                                ) : (
                                                    <div className="h-16 w-16 rounded-[22px] bg-gradient-to-br from-[#B13BFF] to-[#7B1DE8] flex items-center justify-center text-white shadow-xl font-black text-2xl border-2 border-white">
                                                        {selectedMessage.senderName.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <h3 className="text-xl font-black tracking-tight mb-1">{selectedMessage.senderName}</h3>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200 animate-pulse" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#B13BFF]">Authorized Session</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 rounded-2xl bg-white/60 border border-purple-100 items-start flex flex-col justify-center">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#B13BFF] mb-1">Inquiry Type</p>
                                                    <p className="text-xs font-black truncate">{selectedMessage.type === 'internal' ? 'Internal Discussion' : 'Priority Client Hub'}</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/60 border border-purple-100 items-start flex flex-col justify-center">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#B13BFF] mb-1">Receipt Date</p>
                                                    <p className="text-xs font-black truncate">{format(new Date(selectedMessage.createdAt), 'MMM dd, HH:mm')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Viewport */}
                                        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                                            <div className="flex flex-col gap-6">
                                                {/* Incoming */}
                                                <div className="flex items-start gap-4 max-w-[92%]">
                                                    <div className="h-10 w-10 shrink-0 rounded-xl bg-purple-100/60 flex items-center justify-center text-[#B13BFF] text-sm font-black border border-purple-200/50 shadow-inner">
                                                        {selectedMessage.senderName.charAt(0)}
                                                    </div>
                                                    <div className="p-5 rounded-[28px] rounded-tl-none text-sm font-bold leading-relaxed shadow-sm" style={messageBubbleClient}>
                                                        {selectedMessage.message}
                                                        <div className="mt-3 text-[9px] font-black uppercase tracking-widest opacity-40">
                                                            {format(new Date(selectedMessage.createdAt), 'EEEE, h:mm a')}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center py-6">
                                                    <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-100/60 to-transparent" />
                                                    <span className="text-[9px] font-black text-[#B13BFF]/30 uppercase tracking-[0.4em] -mt-2 bg-[#FBF9FF] px-6">Timeline Anchor</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Input */}
                                        <div className="p-7 bg-white/60 border-t border-purple-100/50">
                                            <div className="relative group">
                                                <textarea 
                                                    rows={4}
                                                    placeholder={`Write a premium reply to ${selectedMessage.senderName.split(' ')[0]}...`}
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    className="w-full p-5 pb-14 bg-white rounded-[24px] text-sm font-bold border border-purple-100/60 focus:outline-none focus:border-[#B13BFF]/40 focus:ring-8 focus:ring-[#B13BFF]/5 transition-all resize-none shadow-inner"
                                                />
                                                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                                                    <motion.button 
                                                        whileTap={{ scale: 0.94 }}
                                                        onClick={handleSendMessage}
                                                        disabled={sending || !replyText.trim()}
                                                        className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                            !replyText.trim() 
                                                                ? 'bg-purple-50 text-purple-200' 
                                                                : 'bg-gradient-to-r from-[#B13BFF] to-[#7B1DE8] text-white shadow-xl shadow-purple-300/40 hover:translate-y-[-2px]'
                                                        }`}
                                                    >
                                                        {sending ? (
                                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                <span>Broadcast Reply</span>
                                                                <SendIcon />
                                                            </>
                                                        )}
                                                    </motion.button>
                                                </div>
                                                <div className="absolute bottom-4 left-5 flex gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                                                    <button className="p-2 rounded-xl text-[#B13BFF] hover:bg-purple-50 transition-colors" title="Attach Evidence">📎</button>
                                                    <button className="p-2 rounded-xl text-[#B13BFF] hover:bg-purple-50 transition-colors" title="Canned Responses">📋</button>
                                                    <button className="p-2 rounded-xl text-[#B13BFF] hover:bg-purple-50 transition-colors" title="AI Tone Polish">🧠</button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <div className="h-full flex items-center justify-center flex-col gap-6 p-12 text-center">
                                    <div className="w-40 h-40 rounded-[40px] bg-gradient-to-br from-[#F5F1FF] to-[#FAF8FF] flex items-center justify-center text-7xl shadow-inner border border-purple-100/40 animate-pulse">
                                        🗯️
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black mb-3 text-[#471396]">Select Active Feed</h3>
                                        <p className="text-sm font-semibold text-[#8A66C0] max-w-[280px] mx-auto leading-relaxed italic">Click on a conversation to load the encrypted dialogue channel.</p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        <span className="px-4 py-1.5 bg-purple-100/20 rounded-xl text-[9px] font-black text-[#B13BFF] uppercase tracking-[0.2em] border border-purple-100/30">E2E Sync</span>
                                        <span className="px-4 py-1.5 bg-purple-100/20 rounded-xl text-[9px] font-black text-[#B13BFF] uppercase tracking-[0.2em] border border-purple-100/30">High Priority</span>
                                        <span className="px-4 py-1.5 bg-purple-100/20 rounded-xl text-[9px] font-black text-[#B13BFF] uppercase tracking-[0.2em] border border-purple-100/30">Audit Logged</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}
