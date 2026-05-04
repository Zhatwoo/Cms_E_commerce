'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConversations, getConversationMessages, sendDirectMessage, getAdmins, getClients, getMe, type Conversation, type ChatMessage, type AdminUser, type ClientRow } from '@/lib/api';
import { useTheme } from '../components/context/theme-context';
import { format } from 'date-fns';

/* ── Icons ──────────────────────────────────────────────────────── */
const SearchIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const SendIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

const BackIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const PlusIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

/* ── Components ─────────────────────────────────────────────────── */

export default function SupportTicketPage() {
    const { theme, colors } = useTheme();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [adminList, setAdminList] = useState<AdminUser[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [ticketSubject, setTicketSubject] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedTicket?.conversationId]);

    // Load current user
    useEffect(() => {
        getMe().then(res => {
            if (res.user) setCurrentUser(res.user);
        });
    }, []);

    // Load support history (conversations with admins)
    const fetchSupportHistory = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await getConversations();
            if (res.success) {
                // Filter only conversations with admins
                const adminConvs = (res.data || []).filter((c: Conversation) =>
                    c.otherUserRole === 'admin' || c.otherUserRole === 'super_admin'
                );
                setConversations(adminConvs);
            }
        } catch (error) {
            console.error('Failed to fetch support history:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSupportHistory();
        const interval = setInterval(() => fetchSupportHistory(true), 10000);
        return () => clearInterval(interval);
    }, [fetchSupportHistory]);

    const fetchMessages = useCallback(async (ticket: Conversation) => {
        try {
            const res = await getConversationMessages(ticket.otherUserId);
            if (res.success) {
                setMessages(res.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch ticket messages:', error);
        }
    }, []);

    useEffect(() => {
        if (selectedTicket) {
            fetchMessages(selectedTicket);
            const interval = setInterval(() => fetchMessages(selectedTicket), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedTicket, fetchMessages]);

    const handleSendReply = async () => {
        if (!messageText.trim() || !selectedTicket) return;
        setSending(true);
        try {
            const res = await sendDirectMessage(selectedTicket.otherUserId, messageText);
            if (res.success) {
                setMessageText('');
                fetchMessages(selectedTicket);
                fetchSupportHistory(true);
            }
        } catch (error) {
            console.error('Failed to reply:', error);
        } finally {
            setSending(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketSubject.trim() || !messageText.trim() || sending) return;
        
        setSending(true);
        try {
            // Fetch admins to send to the first available admin if no conversation exists
            let targetAdminId = '';
            const resAdmins = await getAdmins();
            if (resAdmins.success && resAdmins.data.length > 0) {
                targetAdminId = resAdmins.data[0].id;
            }

            if (!targetAdminId) {
                alert('No support staff available at the moment. Please try again later.');
                return;
            }

            const res = await sendDirectMessage(targetAdminId, `[SUBJECT: ${ticketSubject}] ${messageText}`);
            if (res.success) {
                setTicketSubject('');
                setMessageText('');
                setShowForm(false);
                fetchSupportHistory();
            }
        } catch (error) {
            console.error('Failed to create ticket:', error);
        } finally {
            setSending(false);
        }
    };

    const glassStyle = {
        background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: '24px',
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] p-4 lg:p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Contact Support</h1>
                    <p className="text-sm opacity-60" style={{ color: colors.text.primary }}>Submit a ticket or view your support history</p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => { setShowForm(true); setSelectedTicket(null); }}
                        className="px-6 py-2.5 bg-[#5C1D8F] text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2"
                    >
                        <PlusIcon /> Submit New Ticket
                    </button>
                )}
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Support History List */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex flex-col w-full lg:w-80 overflow-hidden ${selectedTicket || showForm ? 'hidden lg:flex' : 'flex'}`}
                    style={glassStyle}
                >
                    <div className="p-4 border-b font-bold text-sm uppercase tracking-wider opacity-50" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: colors.text.primary }}>
                        Ticket History
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading ? (
                            <div className="p-8 text-center opacity-40"><div className="w-6 h-6 border-2 border-[#5C1D8F] border-t-transparent rounded-full animate-spin mx-auto" /></div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center opacity-40">
                                <p className="text-sm">No support tickets found</p>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.conversationId}
                                    onClick={() => { setSelectedTicket(conv); setShowForm(false); }}
                                    className={`w-full flex flex-col gap-1 p-4 rounded-xl transition-colors text-left ${
                                        selectedTicket?.conversationId === conv.conversationId ? 'bg-black/5 dark:bg-white/5 border border-[#5C1D8F]/30' : 'hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold truncate pr-2" style={{ color: colors.text.primary }}>
                                            {conv.lastMessage.startsWith('[SUBJECT:') ? conv.lastMessage.split(']')[0].replace('[SUBJECT:', '').trim() : 'Inquiry'}
                                        </p>
                                        <span className="text-[10px] opacity-40 shrink-0">{format(new Date(conv.lastMessageTime), 'MMM d')}</span>
                                    </div>
                                    <p className="text-xs truncate opacity-50" style={{ color: colors.text.primary }}>{conv.lastMessage.split(']').slice(1).join(']').trim() || conv.lastMessage}</p>
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Right Side Board: Form or Chat */}
                <div className="flex-1 flex flex-col overflow-hidden h-full">
                    <AnimatePresence mode="wait">
                        {showForm ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex-1 flex flex-col p-8 overflow-y-auto"
                                style={glassStyle}
                            >
                                <div className="max-w-2xl mx-auto w-full">
                                    <h2 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>Submit a Support Ticket</h2>
                                    <form onSubmit={handleCreateTicket} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold opacity-70" style={{ color: colors.text.primary }}>Subject</label>
                                            <input 
                                                required
                                                type="text"
                                                placeholder="What do you need help with?"
                                                value={ticketSubject}
                                                onChange={(e) => setTicketSubject(e.target.value)}
                                                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl border border-transparent focus:border-[#5C1D8F]/50 outline-none transition-all"
                                                style={{ color: colors.text.primary }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold opacity-70" style={{ color: colors.text.primary }}>Message Detail</label>
                                            <textarea 
                                                required
                                                rows={6}
                                                placeholder="Provide as much detail as possible..."
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl border border-transparent focus:border-[#5C1D8F]/50 outline-none transition-all resize-none"
                                                style={{ color: colors.text.primary }}
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <button 
                                                type="submit"
                                                disabled={sending}
                                                className="flex-1 py-3 bg-[#5C1D8F] text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
                                            >
                                                {sending ? 'Submitting...' : 'Submit Ticket'}
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setShowForm(false)}
                                                className="px-6 py-3 bg-black/5 dark:bg-white/5 rounded-xl font-bold hover:bg-black/10 transition-all"
                                                style={{ color: colors.text.primary }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        ) : selectedTicket ? (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex-1 flex flex-col overflow-hidden" 
                                style={glassStyle}
                            >
                                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2"><BackIcon /></button>
                                        <div className="h-10 w-10 rounded-full bg-[#5C1D8F] flex items-center justify-center text-white font-bold">
                                            SR
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm" style={{ color: colors.text.primary }}>Support Team</p>
                                            <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest text-[#B13BFF]">Active Ticket</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedTicket(null)} className="p-2 opacity-50 hover:opacity-100 transition-opacity"><BackIcon /></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {messages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex flex-col ${msg.senderId === currentUser?.id ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                                <div 
                                                    className={`p-4 rounded-2xl text-sm ${
                                                        msg.senderId === currentUser?.id 
                                                            ? 'bg-[#5C1D8F] text-white rounded-tr-none shadow-lg' 
                                                            : 'bg-black/10 dark:bg-white/10 rounded-tl-none'
                                                    }`}
                                                >
                                                    {msg.message}
                                                </div>
                                                <span className="text-[10px] opacity-40 mt-1 px-1">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 border-t" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Write a reply..."
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                            className="flex-1 py-3 px-5 bg-black/5 dark:bg-white/5 rounded-2xl focus:outline-none text-sm transition-all border border-transparent focus:border-[#5C1D8F]/30"
                                            style={{ color: colors.text.primary }}
                                        />
                                        <button
                                            onClick={handleSendReply}
                                            disabled={!messageText.trim() || sending}
                                            className="p-3 rounded-2xl bg-[#5C1D8F] text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
                                        >
                                            <SendIcon />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hidden lg:flex flex-1 items-center justify-center flex-col text-center p-12" 
                                style={glassStyle}
                            >
                                <div className="w-20 h-20 bg-[#5C1D8F]/10 rounded-full flex items-center justify-center text-4xl mb-6">🎫</div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>Your Support Hub</h3>
                                <p className="text-sm opacity-50 max-w-xs mx-auto" style={{ color: colors.text.primary }}>
                                    Select a previous ticket to view the conversation or submit a new one if you need assistance.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
