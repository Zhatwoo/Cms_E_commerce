// models/Audit.js
const { db } = require('../config/firebase');

class Audit {
  static async log(action, details, userId, userName) {
    await db.collection('audit_logs').add({
      action,
      details,
      user_id: userId,
      user_name: userName || 'Administrator',
      timestamp: new Date()
    });
  }

  static async getRecent(limit = 100) {
    const snap = await db.collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = Audit;
