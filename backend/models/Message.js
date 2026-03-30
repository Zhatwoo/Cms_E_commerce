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
    message: d.message || '',
    type: d.type || 'internal', // support | internal | request
    status: d.status || 'unread',
    websiteId: d.website_id || null,
    createdAt: d.created_at?.toDate?.()?.toISOString?.() || d.created_at || new Date().toISOString()
  };
}

class Message {
  static async create(data) {
    const docRef = await db.collection('messages').add({
      sender_id: data.senderId,
      sender_name: data.senderName,
      sender_avatar: data.senderAvatar || null,
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

  static async markAsRead(id) {
    await db.collection('messages').doc(id).update({ status: 'read' });
    const doc = await db.collection('messages').doc(id).get();
    return fromDoc(doc);
  }
}

module.exports = Message;
