// models/Admin.js
const { getFirestore, FieldValue } = require('../config/firebase');

class Admin {
  static collection() {
    return getFirestore().collection('admins');
  }

  /**
   * Create or update an admin profile in Firestore
   * Only uid is stored (plus updatedAt)
   */
  static async upsert(uid) {
    if (!uid) throw new Error('Missing uid');

    const data = {
      uid,
      updatedAt: FieldValue.serverTimestamp()
    };

    await this.collection().doc(uid).set(data, { merge: true });
  }

  /**
   * Get an admin profile from Firestore
   */
  static async get(uid) {
    if (!uid) throw new Error('Missing uid');
    const doc = await this.collection().doc(uid).get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * Delete an admin profile from Firestore
   */
  static async delete(uid) {
    if (!uid) throw new Error('Missing uid');
    await this.collection().doc(uid).delete();
  }
}

module.exports = Admin;
