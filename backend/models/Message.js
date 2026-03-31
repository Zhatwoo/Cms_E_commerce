// models/Message.js
const { db } = require('../config/firebase');

function fromDoc(doc) {
  if (!doc || !doc.exists) return null;
  const d = doc.data();
  return {
    id: doc.id,
    senderId: d.sender_id || '',
    senderName: d.sender_name || 'Anonymous',
    senderAvatar: d.sender_avatar || null,
    recipientId: d.recipient_id || null,
    recipientName: d.recipient_name || null,
    recipientAvatar: d.recipient_avatar || null,
    conversationId: d.conversation_id || null,
    message: d.message || '',
    type: d.type || 'internal', // support | internal | request | direct
    status: d.status || 'unread',
    websiteId: d.website_id || null,
    createdAt: d.created_at?.toDate?.()?.toISOString?.() || d.created_at || new Date().toISOString()
  };
}

/**
 * Generate a conversation ID from two user IDs
 * Ensures consistent ordering: smaller ID first
 */
function generateConversationId(userId1, userId2) {
  const ids = [userId1, userId2].sort();
  return `${ids[0]}__${ids[1]}`;
}

class Message {
  static async create(data) {
    const isDirectMessage = data.type === 'direct' && data.recipientId;
    const conversationId = isDirectMessage 
      ? generateConversationId(data.senderId, data.recipientId)
      : null;

    const docRef = await db.collection('messages').add({
      sender_id: data.senderId,
      sender_name: data.senderName,
      sender_avatar: data.senderAvatar || null,
      recipient_id: data.recipientId || null,
      recipient_name: data.recipientName || null,
      recipient_avatar: data.recipientAvatar || null,
      conversation_id: conversationId,
      message: data.message,
      type: data.type || 'internal',
      status: 'unread',
      website_id: data.websiteId || null,
      created_at: new Date()
    });
    const doc = await docRef.get();
    return fromDoc(doc);
  }

  static async find(filters = {}) {
    let query = db.collection('messages').orderBy('created_at', 'desc');
    
    if (filters.type) {
      query = query.where('type', '==', filters.type);
    }
    
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    const snap = await query.limit(filters.limit || 50).get();
    return snap.docs.map(fromDoc);
  }

  /**
   * Get all conversations for a user (direct messages only)
   */
  static async getConversations(userId, limit = 100) {
    // Get messages where user is sender or recipient, grouped by conversation
    // Note: We don't use orderBy in the query because Firestore would need a composite index
    // Instead we sort in memory after fetching
    const query = db.collection('messages')
      .where('type', '==', 'direct');

    const snap = await query.get();
    const conversationMap = new Map();

    const toMs = (value) => {
      const ms = new Date(value).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };

    snap.docs.forEach(doc => {
      const d = doc.data();
      const senderId = d.sender_id;
      const recipientId = d.recipient_id;
      
      // Include if user is sender or recipient
      if (senderId === userId || recipientId === userId) {
        const otherUserId = senderId === userId ? recipientId : senderId;
        const conversationId = d.conversation_id;
        
        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            conversationId,
            otherUserId,
            otherUserName: senderId === userId ? d.recipient_name : d.sender_name,
            otherUserAvatar: senderId === userId ? d.recipient_avatar : d.sender_avatar,
            lastMessage: d.message,
            lastMessageTime: d.created_at?.toDate?.()?.toISOString?.() || d.created_at,
            unreadCount: d.status === 'unread' && recipientId === userId ? 1 : 0
          });
        } else {
          const conv = conversationMap.get(conversationId);
          const currentMsgTime = d.created_at?.toDate?.()?.toISOString?.() || d.created_at;

          // Always keep the latest message as conversation preview source.
          if (toMs(currentMsgTime) > toMs(conv.lastMessageTime)) {
            conv.lastMessage = d.message;
            conv.lastMessageTime = currentMsgTime;
            conv.otherUserName = conv.otherUserName || (senderId === userId ? d.recipient_name : d.sender_name);
            conv.otherUserAvatar = conv.otherUserAvatar || (senderId === userId ? d.recipient_avatar : d.sender_avatar);
          }

          if (d.status === 'unread' && recipientId === userId) {
            conv.unreadCount += 1;
          }
        }
      }
    });

    // Sort by date DESC and limit
    return Array.from(conversationMap.values())
      .sort((a, b) => {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        return timeB - timeA;
      })
      .slice(0, limit);
  }

  /**
   * Get all messages in a conversation between two users
   */
  static async getConversationMessages(userId1, userId2, limit = 50) {
    const conversationId = generateConversationId(userId1, userId2);
    
    const snap = await db.collection('messages')
      .where('conversation_id', '==', conversationId)
      .where('type', '==', 'direct')
      .get();

    // Sort in memory instead of using orderBy to avoid composite index requirement.
    // Keep ascending order for display and return only the most recent `limit` messages.
    const messagesAsc = snap.docs
      .map(fromDoc)
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeA - timeB;
      });

    if (!limit || messagesAsc.length <= limit) {
      return messagesAsc;
    }

    return messagesAsc.slice(messagesAsc.length - limit);
  }

  static async markAsRead(id) {
    await db.collection('messages').doc(id).update({ status: 'read' });
    const doc = await db.collection('messages').doc(id).get();
    return fromDoc(doc);
  }

  /**
   * Mark all unread messages in conversation as read
   */
  static async markConversationAsRead(userId, otherUserId) {
    const conversationId = generateConversationId(userId, otherUserId);
    
    const snap = await db.collection('messages')
      .where('conversation_id', '==', conversationId)
      .where('recipient_id', '==', userId)
      .where('status', '==', 'unread')
      .get();

    const batch = db.batch();
    snap.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'read' });
    });
    await batch.commit();
  }
}

module.exports = Message;
