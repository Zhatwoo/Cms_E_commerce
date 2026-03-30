'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import { getConversations, getConversationMessages, sendDirectMessage, getAdmins, getMe, type Conversation, type ChatMessage, type AdminUser } from '@/lib/api';
import { addNotification } from '@/lib/notifications';
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

const RefreshIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

/* ── Styles ─────────────────────────────────────────────────────── */
const glassPanel = {
    background: 'rgba(255, 255, 255, 0.78)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(177, 59, 255, 0.16)',
    boxShadow: '0 8px 40px rgba(103, 2, 191, 0.07)',
};

const messageBubbleOwn = {
    background: 'linear-gradient(135deg, #B13BFF 0%, #7B1DE8 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(123, 29, 232, 0.2)',
};

const messageBubbleOther = {
    background: 'rgba(240, 235, 255, 0.85)',
    border: '1px solid rgba(177, 59, 255, 0.12)',
    color: '#3B1278',
};

/* ── Components ─────────────────────────────────────────────────── */

export default function ChatPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [adminList, setAdminList] = useState<AdminUser[]>([]);
    const [adminSearchQuery, setAdminSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const sortedMessages = useMemo(() => {
        const toMs = (value?: string) => {
            const ms = new Date(value || '').getTime();
            return Number.isFinite(ms) ? ms : 0;
        };

        return [...(messages || [])].sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt));
    }, [messages]);

    const resolvedOtherAvatar = useMemo(() => {
        if (!selectedConversation) return null;

        const fromSelected = selectedConversation.otherUserAvatar || null;
        if (fromSelected) return fromSelected;

        const fromConversations = conversations.find(
            c => c.otherUserId === selectedConversation.otherUserId && c.otherUserAvatar
        )?.otherUserAvatar || null;
        if (fromConversations) return fromConversations;

        const fromAdmins = adminList.find(
            a => a.id === selectedConversation.otherUserId && a.avatar
        )?.avatar || null;

        return fromAdmins;
    }, [selectedConversation, conversations, adminList]);

    const getMinuteKey = (value?: string) => {
        const date = new Date(value || '');
        if (Number.isNaN(date.getTime())) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d} ${hh}:${mm}`;
    };

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [sortedMessages, selectedConversation?.conversationId]);

    // Load current user
    useEffect(() => {
        getMe().then(res => {
            if (res.user) {
                setCurrentUser(res.user);
            }
        });
    }, []);

    // Load conversations
    const fetchConversations = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await getConversations();
            if (res.success) {
                setConversations(res.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Auto-select first conversation if none is selected
    useEffect(() => {
        if (!selectedConversation && conversations.length > 0) {
            setSelectedConversation(conversations[0]);
        }
    }, [conversations, selectedConversation]);

    // Load messages for selected conversation
    const fetchMessages = useCallback(async (conversation: Conversation) => {
        try {
            const res = await getConversationMessages(conversation.otherUserId);
            if (res.success) {
                setMessages(res.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation);
        }
    }, [selectedConversation, fetchMessages]);

    // Polling for new conversations every 3s for faster chat list updates
    useEffect(() => {
        const interval = setInterval(() => fetchConversations(true), 3000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    // Polling for new messages every 2s when conversation is open
    useEffect(() => {
        if (!selectedConversation) return;
        const interval = setInterval(() => {
            fetchMessages(selectedConversation);
        }, 2000);
        return () => clearInterval(interval);
    }, [selectedConversation, fetchMessages]);

    // Load admins when modal opens
    const openNewChat = async () => {
        setShowNewChatModal(true);
        try {
            const res = await getAdmins();
            console.log('getAdmins response:', res);
            if (res.success) {
                console.log('Admin list loaded:', res.data);
                setAdminList(res.data || []);
            } else {
                console.error('getAdmins returned success=false', res);
                addNotification('Error', 'Failed to load admin list', 'error');
            }
        } catch (error) {
            console.error('Failed to load admins:', error);
            addNotification('Error', `Failed to load admins: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    // Filter admins
    const filteredAdmins = useMemo(() => {
        return (adminList || []).filter(a => {
            const name = (a.name || '').toLowerCase();
            const username = (a.username || '').toLowerCase();
            const email = (a.email || '').toLowerCase();
            const query = adminSearchQuery.toLowerCase();
            return name.includes(query) || username.includes(query) || email.includes(query);
        });
    }, [adminList, adminSearchQuery]);

    // Send message
    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedConversation) return;
        setSending(true);
        const messageContent = messageText;
        const recipientId = selectedConversation.otherUserId;
        setMessageText('');
        
        try {
            // Optimistic update - add message immediately
            const optimisticMessage: ChatMessage = {
                id: `temp-${Date.now()}`,
                senderId: currentUser?.id || 'unknown',
                senderName: currentUser?.displayName || currentUser?.email || 'You',
                senderAvatar: currentUser?.avatar || null,
                recipientId,
                conversationId: selectedConversation.conversationId,
                message: messageContent,
                type: 'direct',
                status: 'sending',
                createdAt: new Date().toISOString()
            };
            
            // Show message immediately
            setMessages(prev => [...prev, optimisticMessage]);
            
            const res = await sendDirectMessage(recipientId, messageContent);
            if (res.success) {
                // Fetch conversations to get the updated conversation list
                const conversationsRes = await getConversations();
                if (conversationsRes.success) {
                    const updatedConversations = conversationsRes.data || [];
                    setConversations(updatedConversations);
                    
                    // Find and select the updated conversation
                    const updatedConversation = updatedConversations.find(c => c.otherUserId === recipientId);
                    if (updatedConversation) {
                        setSelectedConversation(updatedConversation);
                        // Fetch messages for the conversation
                        const messagesRes = await getConversationMessages(recipientId);
                        if (messagesRes.success) {
                            setMessages(messagesRes.data || []);
                        }
                    }
                }
                // No success toast: keep chat sending silent like messenger apps.
            } else {
                // Remove optimistic message on failure
                setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
                addNotification('Error', 'Failed to send message', 'error');
            }
        } catch (error) {
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== `temp-${Date.now()}`));
            addNotification('Error', 'Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    // Select admin and create/open conversation
    const handleSelectAdmin = (admin: AdminUser) => {
        const existingConversation = conversations.find(c => c.otherUserId === admin.id);
        if (existingConversation) {
            setSelectedConversation(existingConversation);
        } else {
            // Create new conversation with sorted ID matching backend format
            const ids = [currentUser?.id, admin.id].sort();
            const conversationId = `${ids[0]}__${ids[1]}`;
            const newConversation: Conversation = {
                conversationId,
                otherUserId: admin.id,
                otherUserName: admin.name,
                otherUserAvatar: admin.avatar,
                lastMessage: 'No messages yet',
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0
            };
            setSelectedConversation(newConversation);
        }
        setShowNewChatModal(false);
    };

    // Filter conversations by search
    const filteredConversations = useMemo(() => {
        return (conversations || []).filter(c =>
            (c.otherUserName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.otherUserId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.otherUserUsername || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.otherUserEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [conversations, searchQuery]);

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

            <div className="flex min-h-0 flex-1 flex-col">
                <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                
                <main className="flex-1 flex overflow-hidden p-4 lg:p-6">
                    {/* Conversations List */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex flex-col rounded-[24px] overflow-hidden w-full lg:w-80 lg:mb-0 mb-4 ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}
                        style={glassPanel}
                    >
                        <div className="p-4 border-b border-purple-100/50">
                            <div className="flex items-center justify-between gap-2 mb-4">
                                <h2 className="text-lg font-bold text-[#7B1DE8]">Conversations</h2>
                                <motion.button
                                    whileTap={{ scale: 0.92 }}
                                    onClick={openNewChat}
                                    className="p-2 rounded-xl bg-[#B13BFF] text-white hover:bg-purple-700 transition-colors"
                                    title="Start new conversation"
                                >
                                    <PlusIcon />
                                </motion.button>
                            </div>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search conversations..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-purple-50/40 rounded-lg text-sm font-medium placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/20 transition-shadow"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B13BFF]/60">
                                    <SearchIcon />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-10 h-10 border-4 border-[#B13BFF]/20 border-t-[#B13BFF] rounded-full animate-spin" />
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="h-full flex items-center justify-center flex-col p-6 text-center">
                                    <div className="text-4xl mb-2 opacity-40">💬</div>
                                    <p className="text-sm font-semibold text-[#8A66C0]">No conversations yet</p>
                                    <p className="text-xs text-[#B13BFF]/60 mt-1">Start chatting with admins</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {filteredConversations.map((conversation) => (
                                        <motion.button
                                            key={conversation.conversationId}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedConversation(conversation)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                                selectedConversation?.conversationId === conversation.conversationId
                                                    ? 'bg-[#B13BFF]/10 border border-[#B13BFF]/30'
                                                    : 'hover:bg-purple-50 border border-transparent'
                                            }`}
                                        >
                                            <div className="relative">
                                                {conversation.otherUserAvatar ? (
                                                    <img src={conversation.otherUserAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-sm font-bold text-[#B13BFF]">
                                                        {(conversation.otherUserName || '?').charAt(0)}
                                                    </div>
                                                )}
                                                {conversation.unreadCount > 0 && (
                                                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                        {conversation.unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="text-sm font-bold text-[#471396] truncate">{conversation.otherUserName || 'Unknown'}</p>
                                                <p className="text-xs text-[#8A66C0] truncate">{conversation.lastMessage}</p>
                                            </div>
                                            <span className="text-xs text-[#B13BFF]/60 flex-shrink-0">
                                                {format(new Date(conversation.lastMessageTime), 'h:mm a')}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Chat Window */}
                    <AnimatePresence mode="wait">
                        {selectedConversation ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex flex-1 flex-col rounded-[24px] overflow-hidden"
                                style={glassPanel}
                            >
                                {/* Chat Header */}
                                <div className="p-4 border-b border-purple-100/50 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <motion.button
                                            whileTap={{ scale: 0.92 }}
                                            onClick={() => setSelectedConversation(null)}
                                            className="lg:hidden p-2 rounded-lg hover:bg-purple-50 transition-colors"
                                        >
                                            <BackIcon />
                                        </motion.button>
                                        {resolvedOtherAvatar ? (
                                            <img src={resolvedOtherAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center font-bold text-[#B13BFF]">
                                                {(selectedConversation.otherUserName || '?').charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[#471396] truncate">{selectedConversation.otherUserName || 'Unknown'}</p>
                                            <p className="text-xs text-[#8A66C0]">online</p>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => fetchMessages(selectedConversation)}
                                        className="p-2 rounded-lg text-[#B13BFF] hover:bg-purple-50 transition-colors"
                                    >
                                        <RefreshIcon />
                                    </motion.button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                                    {sortedMessages.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <p className="text-sm text-[#8A66C0]">No messages yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        <>
                                            {sortedMessages.map((msg, index) => {
                                                const prev = sortedMessages[index - 1];
                                                const next = sortedMessages[index + 1];
                                                const isOwn = msg.senderId === currentUser?.id;
                                                const sameAsPrev =
                                                    !!prev &&
                                                    prev.senderId === msg.senderId &&
                                                    getMinuteKey(prev.createdAt) === getMinuteKey(msg.createdAt);
                                                const sameAsNext =
                                                    !!next &&
                                                    next.senderId === msg.senderId &&
                                                    getMinuteKey(next.createdAt) === getMinuteKey(msg.createdAt);

                                                const incomingAvatar =
                                                    msg.senderAvatar ||
                                                    (msg.senderId === selectedConversation?.otherUserId
                                                        ? resolvedOtherAvatar
                                                        : null);

                                                return (
                                                    <motion.div
                                                        key={msg.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${sameAsPrev ? 'mt-1' : 'mt-3'}`}
                                                    >
                                                        {!isOwn && (
                                                            <div className="mr-2 mt-1 flex-shrink-0 w-8 h-8">
                                                                {!sameAsNext ? (
                                                                    incomingAvatar ? (
                                                                        <img src={incomingAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                                    ) : (
                                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-xs font-bold text-[#B13BFF]">
                                                                            {(msg.senderName || selectedConversation?.otherUserName || '?').charAt(0)}
                                                                        </div>
                                                                    )
                                                                ) : null}
                                                            </div>
                                                        )}
                                                        <div
                                                            className="px-4 py-2.5 rounded-2xl max-w-xs break-words"
                                                            style={isOwn ? messageBubbleOwn : messageBubbleOther}
                                                        >
                                                            <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                                                            {!sameAsNext && (
                                                                <p className={`text-xs mt-1.5 ${isOwn ? 'text-purple-100' : 'text-[#B13BFF]/60'}`}>
                                                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-purple-100/50">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            disabled={sending}
                                            className="flex-1 px-4 py-3 bg-purple-50/40 rounded-2xl text-sm font-medium placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/20 disabled:opacity-50 transition-shadow"
                                        />
                                        <motion.button
                                            whileTap={{ scale: 0.92 }}
                                            onClick={handleSendMessage}
                                            disabled={sending || !messageText.trim()}
                                            className="p-3 rounded-2xl bg-[#B13BFF] text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {sending ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <SendIcon />
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="hidden lg:flex flex-1 rounded-[24px] items-center justify-center flex-col gap-4"
                                style={glassPanel}
                            >
                                <div className="text-6xl opacity-20">💬</div>
                                <h3 className="text-2xl font-bold text-[#471396]">Select a Conversation</h3>
                                <p className="text-[#8A66C0] max-w-xs text-center">Choose a conversation to start chatting with other admins</p>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={openNewChat}
                                    className="mt-4 px-6 py-3 rounded-2xl bg-[#B13BFF] text-white font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
                                >
                                    <PlusIcon />
                                    Start New Chat
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Start New Chat Modal */}
            <AnimatePresence>
                {showNewChatModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowNewChatModal(false)}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md rounded-[32px] overflow-hidden"
                            style={glassPanel}
                        >
                            <div className="p-6 border-b border-purple-100/50">
                                <h2 className="text-xl font-bold text-[#7B1DE8]">Start a Conversation</h2>
                                <p className="text-sm text-[#8A66C0] mt-1">Select an admin to chat with</p>
                            </div>

                            <div className="p-4 border-b border-purple-100/50">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search admins..."
                                        value={adminSearchQuery}
                                        onChange={(e) => setAdminSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-purple-50/40 rounded-lg text-sm font-medium placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-[#B13BFF]/20 transition-shadow"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B13BFF]/60">
                                        <SearchIcon />
                                    </div>
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto scrollbar-hide">
                                {filteredAdmins.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <p className="text-sm text-[#8A66C0]">No admins found</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-purple-100/30">
                                        {filteredAdmins.map((admin) => (
                                            <motion.button
                                                key={admin.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleSelectAdmin(admin)}
                                                className="w-full flex items-center gap-3 p-4 hover:bg-purple-50/40 transition-colors"
                                            >
                                                {admin.avatar ? (
                                                    <img src={admin.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center font-bold text-[#B13BFF]">
                                                        {(admin.name || '?').charAt(0)}
                                                    </div>
                                                )}
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="font-bold text-[#471396] truncate">{admin.name || 'Unknown'}</p>
                                                    <p className="text-xs text-[#8A66C0] truncate">{admin.username || admin.email || 'no-email'}</p>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-purple-100/50">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowNewChatModal(false)}
                                    className="w-full px-4 py-2.5 rounded-lg bg-purple-100/20 text-[#B13BFF] font-bold hover:bg-purple-100/40 transition-colors"
                                >
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
