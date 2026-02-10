// models/User.js — Firebase Auth + Firestore users collection
const { auth, db } = require('../config/firebase');

const USERS_COLLECTION = 'users';

function fromDoc(doc) {
  if (!doc || !doc.exists) return null;
  const d = doc.data();
  return {
    id: doc.id,
    email: d.email || '',
    displayName: d.full_name || d.displayName || '',
    avatar: d.avatar_url || d.avatar || null,
    phone: d.phone || null,
    bio: d.bio || '',
    username: d.username || '',
    website: d.website || '',
    role: d.role || 'client',
    subscriptionPlan: d.subscription_plan || 'free',
    status: d.status || 'active',
    isActive: d.is_active !== false,
    createdAt: d.created_at?.toDate?.()?.toISOString?.() || d.created_at,
    updatedAt: d.updated_at?.toDate?.()?.toISOString?.() || d.updated_at,
  };
}

function toFirestore(data) {
  const map = {
    name: 'full_name', displayName: 'full_name',
    avatar: 'avatar_url', email: 'email', phone: 'phone', bio: 'bio',
    username: 'username', website: 'website', status: 'status', role: 'role',
    isActive: 'is_active', subscriptionPlan: 'subscription_plan',
  };
  const out = {};
  for (const [appKey, dbKey] of Object.entries(map)) {
    if (data[appKey] !== undefined) {
      out[dbKey] = appKey === 'role' && typeof data[appKey] === 'string'
        ? data[appKey].toLowerCase().replace(/\s+/g, '_')
        : data[appKey];
    }
  }
  return out;
}

class User {
  /** Public signup: create auth user + Firestore profile (role client) */
  static async register({ name, email, password }) {
    const userRecord = await auth.createUser({
      email: email.toLowerCase().trim(),
      password,
      displayName: (name || '').trim(),
      emailVerified: true,
    });
    const uid = userRecord.uid;
    const now = new Date();
    await db.collection(USERS_COLLECTION).doc(uid).set({
      email: userRecord.email,
      full_name: (name || '').trim() || (userRecord.email || '').split('@')[0],
      avatar_url: null,
      phone: null,
      bio: '',
      username: '',
      website: '',
      role: 'client',
      subscription_plan: 'free',
      status: 'active',
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    return this.findById(uid);
  }

  /** Admin create user with role */
  static async create({ name, email, password, role, status, phone, bio, avatar }) {
    const normalizedRole = (role && typeof role === 'string') ? role.toLowerCase().replace(/\s+/g, '_') : 'client';
    const userRecord = await auth.createUser({
      email: email.toLowerCase().trim(),
      password,
      displayName: (name || '').trim(),
      emailVerified: true,
    });
    const uid = userRecord.uid;
    const now = new Date();
    const profile = {
      email: userRecord.email,
      full_name: (name || '').trim() || (userRecord.email || '').split('@')[0],
      avatar_url: avatar || null,
      phone: phone || null,
      bio: bio || '',
      username: '',
      website: '',
      role: normalizedRole,
      subscription_plan: 'free',
      status: status || 'active',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    await db.collection(USERS_COLLECTION).doc(uid).set(profile);
    return this.findById(uid);
  }

  static async findByEmail(email) {
    if (!email) return null;
    const norm = email.toLowerCase().trim();
    const snap = await db.collection(USERS_COLLECTION).where('email', '==', norm).limit(1).get();
    if (snap.empty) return null;
    return fromDoc(snap.docs[0]);
  }

  static async findById(id) {
    if (!id) return null;
    const doc = await db.collection(USERS_COLLECTION).doc(id).get();
    return fromDoc(doc);
  }

  static async get(id) {
    return this.findById(id);
  }

  static async findAll(filters = {}) {
    let ref = db.collection(USERS_COLLECTION);
    if (filters.role) ref = ref.where('role', '==', filters.role.toLowerCase());
    if (filters.status) ref = ref.where('status', '==', filters.status);
    const snap = await ref.get();
    let list = snap.docs.map(d => fromDoc(d));
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (filters.search) {
      const s = String(filters.search).toLowerCase();
      list = list.filter(u => (u.displayName && u.displayName.toLowerCase().includes(s)) || (u.email && u.email.toLowerCase().includes(s)));
    }
    return list;
  }

  static async update(id, data) {
    if (!id) throw new Error('Missing id');
    const updates = toFirestore(data);
    if (Object.keys(updates).length === 0) return this.findById(id);
    updates.updated_at = new Date();
    await db.collection(USERS_COLLECTION).doc(id).update(updates);
    return this.findById(id);
  }

  static async updatePassword(id, newPassword) {
    if (!id) throw new Error('Missing id');
    await auth.updateUser(id, { password: newPassword });
  }

  static async verifyPassword(email, password) {
    const apiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) return false;
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          returnSecureToken: true,
        }),
      }
    );
    const data = await res.json().catch(() => ({}));
    return !!data.localId;
  }

  static async delete(id) {
    if (!id) throw new Error('Missing id');
    await auth.deleteUser(id);
    await db.collection(USERS_COLLECTION).doc(id).delete();
  }

  static async getStats() {
    const snap = await db.collection(USERS_COLLECTION).get();
    const all = snap.docs.map(d => d.data());
    return {
      total: all.length,
      byStatus: {
        active: all.filter(u => u.status === 'active').length,
        published: all.filter(u => u.status === 'Published').length,
        restricted: all.filter(u => u.status === 'Restricted').length,
        suspended: all.filter(u => u.status === 'Suspended').length,
      },
      byRole: {
        admin: all.filter(u => u.role === 'admin').length,
        support: all.filter(u => u.role === 'support').length,
        client: all.filter(u => u.role === 'client').length,
        super_admin: all.filter(u => u.role === 'super_admin').length,
      },
    };
  }
}

module.exports = User;
