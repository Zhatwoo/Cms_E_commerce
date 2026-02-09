// models/Client.js
const { getFirestore, FieldValue } = require('../config/firebase');

class Client {
  static collection() {
    return getFirestore().collection('clients');
  }

  static async upsert(uid, data) {
    if (!uid) throw new Error('Missing uid');

    const cleanData = {
      uid,
      username: typeof data.username === 'string' ? data.username.trim() : '',
      bio: typeof data.bio === 'string' ? data.bio.trim() : '',
      website: typeof data.website === 'string' ? data.website.trim() : '',
      updatedAt: FieldValue.serverTimestamp()
    };

    await this.collection().doc(uid).set(cleanData, { merge: true });
  }

  static async get(uid) {
    if (!uid) throw new Error('Missing uid');
    const doc = await this.collection().doc(uid).get();
    return doc.exists ? doc.data() : null;
  }

  static async delete(uid) {
    if (!uid) throw new Error('Missing uid');
    await this.collection().doc(uid).delete();
  }
}

module.exports = Client;
