const { db } = require('../config/firebase');

class Notification {
  static async create(data) {
    const docRef = db.collection('notifications').doc();
    const notification = {
      id: docRef.id,
      title: data.title || '',
      message: data.message || '',
      type: data.type || 'info',
      read: false,
      createdAt: new Date().toISOString(),
      adminId: data.adminId || null,
      adminName: data.adminName || 'Admin',
    };
    await docRef.set(notification);
    return notification;
  }

  static async findAll() {
    const snapshot = await db.collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  }

  static async markRead(id) {
    await db.collection('notifications').doc(id).update({ read: true });
    return true;
  }

  static async delete(id) {
    await db.collection('notifications').doc(id).delete();
    return true;
  }
}

module.exports = Notification;
