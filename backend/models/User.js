// models/User.js — Firebase Auth + Firestore users collection
const { auth, db } = require('../config/firebase');

// USERS_COLLECTION moved to explicit strings to be 100% clear about the 'user' (singular) path.

function fromDoc(doc) {
  if (!doc || !doc.exists) return null;
  const d = doc.data();
  return {
    id: doc.id,
    uid: d.uid || doc.id,
    email: d.email || '',
    displayName: d.full_name || d.displayName || '',
    fullName: d.full_name || d.displayName || '',
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

/**
 * Helper to recursively delete a document and ALL its sub-collections.
 * Firestore doesn't do this automatically.
 */
async function deleteRecursive(docRef) {
  const collections = await docRef.listCollections();
  for (const collection of collections) {
    const documents = await collection.get();
    for (const doc of documents.docs) {
      await deleteRecursive(doc.ref);
    }
  }
  await docRef.delete();
}

class User {
  /** Public signup: create auth user + Firestore profile (role client) */
  /** Public signup: create auth user + Firestore profile (role client) */
  static async register({ name, email, password }) {
    console.log('---------------------------------------------------------');
    console.log(`🚀 [User.register] STRICT NESTED PATH ONLY for: ${email}`);
    try {
      // 1. Create Firebase Auth User
      console.log('   Step 1: Creating Firebase Auth user...');
      const userRecord = await auth.createUser({
        email: email.toLowerCase().trim(),
        password,
        displayName: (name || '').trim(),
        emailVerified: true,
      });
      const uid = userRecord.uid;
      console.log(`   ✅ Step 1 Success: UID created -> ${uid}`);

      const now = new Date();
      const roleName = 'client';
      const profile = {
        avatar_url: null,
        bio: '',
        created_at: now,
        email: userRecord.email,
        full_name: (name || '').trim() || (userRecord.email || '').split('@')[0],
        is_active: true,
        phone: null,
        role: roleName,
        status: 'active',
        subscription_plan: 'free',
        updated_at: now,
        username: '',
        website: '',
      };

      // 2. Save profile ONLY to: user/roles/client/{uid}
      const rolePath = `user/roles/${roleName}/${uid}`;
      console.log(`   Step 2: Saving profile to STRICT path: ${rolePath}...`);
      await db.doc(rolePath).set(profile);
      console.log(`   ✅ Step 2 Success: Profile created.`);

      // 3. Ensure root user/{uid} DOES NOT EXIST
      console.log(`   Step 3: Ensuring root "user/${uid}" is empty...`);
      await db.collection('user').doc(uid).delete();
      console.log(`   ✅ Step 3 Success: Root shadow confirmed empty.`);

      console.log(`✨ [User.register] FINISHED SUCCESSFULLY for UID: ${uid}`);
      console.log('---------------------------------------------------------');
      return this.findById(uid);
    } catch (error) {
      console.error('❌ [User.register] CRITICAL FAILURE:', error);
      console.log('---------------------------------------------------------');
      throw error;
    }
  }

  /** Admin create user with role */
  static async create({ name, email, password, role, status, phone, bio, avatar }) {
    console.log('---------------------------------------------------------');
    console.log(`🚀 [User.create] Admin creating user: ${email}`);
    try {
      const normalizedRole = (role && typeof role === 'string') ? role.toLowerCase().replace(/\s+/g, '_') : 'client';

      // 1. Create Auth User
      console.log('   Step 1: Creating Auth user...');
      const userRecord = await auth.createUser({
        email: email.toLowerCase().trim(),
        password,
        displayName: (name || '').trim(),
        emailVerified: true,
      });
      const uid = userRecord.uid;
      console.log(`   ✅ Step 1 Success: UID -> ${uid}`);

      const now = new Date();
      const profile = {
        avatar_url: avatar || null,
        bio: bio || '',
        created_at: now,
        email: userRecord.email,
        full_name: (name || '').trim() || (userRecord.email || '').split('@')[0],
        is_active: true,
        phone: phone || null,
        role: normalizedRole,
        status: status || 'active',
        subscription_plan: 'free',
        updated_at: now,
        username: '',
        website: '',
      };

      // 2. Save profile ONLY to nested role document: user/roles/{role}/{uid}
      const rolePath = `user/roles/${normalizedRole}/${uid}`;
      console.log(`   Step 2: Saving profile to STRICT path: ${rolePath}...`);
      await db.doc(rolePath).set(profile);
      console.log(`   ✅ Step 2 Success: Role document created in "${normalizedRole}".`);

      // 3. STRICT ENFORCEMENT: Delete root document if it somehow exists
      console.log(`   Step 3: Ensuring root path "user/${uid}" is empty...`);
      await db.collection('user').doc(uid).delete();
      console.log(`   ✅ Step 3 Success: Root shadow cleaned.`);

      console.log(`✨ [User.create] FINISHED SUCCESSFULLY for UID: ${uid}`);
      console.log('---------------------------------------------------------');
      return this.findById(uid);
    } catch (error) {
      console.error('❌ [User.create] CRITICAL FAILURE:', error);
      console.log('---------------------------------------------------------');
      throw error;
    }
  }

  static async findByEmail(email) {
    if (!email) return null;
    const norm = email.toLowerCase().trim();
    const roles = ['client', 'admin', 'support', 'super_admin'];

    // STRICT: Search ONLY in nested role collections
    for (const role of roles) {
      const snap = await db.collection('user').doc('roles').collection(role).where('email', '==', norm).limit(1).get();
      if (!snap.empty) return fromDoc(snap.docs[0]);
    }

    return null;
  }

  static async findById(id) {
    if (!id) return null;
    const roles = ['client', 'admin', 'support', 'super_admin'];

    // STRICT: Search ONLY in nested role collections
    for (const role of roles) {
      const doc = await db.collection('user').doc('roles').collection(role).doc(id).get();
      if (doc.exists) return fromDoc(doc);
    }

    return null;
  }

  static async get(id) {
    return this.findById(id);
  }

  static async findAll(filters = {}) {
    const roles = filters.role ? [filters.role.toLowerCase()] : ['client', 'admin', 'support', 'super_admin'];
    let allUsers = [];

    for (const role of roles) {
      let ref = db.collection('user').doc('roles').collection(role);
      if (filters.status) ref = ref.where('status', '==', filters.status);
      const snap = await ref.get();
      allUsers = allUsers.concat(snap.docs.map(d => fromDoc(d)));
    }

    allUsers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (filters.search) {
      const s = String(filters.search).toLowerCase();
      allUsers = allUsers.filter(u => (u.displayName && u.displayName.toLowerCase().includes(s)) || (u.email && u.email.toLowerCase().includes(s)));
    }
    return allUsers;
  }

  static async update(id, data) {
    if (!id) throw new Error('Missing id');

    // Find where the user is first
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');

    const updates = toFirestore(data);
    if (Object.keys(updates).length === 0) return user;
    updates.updated_at = new Date();

    // Update in the specific role collection
    await db.collection('user').doc('roles').collection(user.role).doc(id).update(updates);

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
    console.log(`🧹 [User.delete] Purging user: ${id}`);

    // 1. Find user to get their role (so we know where their data is)
    const user = await this.findById(id);

    // 2. Delete from Firebase Auth
    try {
      await auth.deleteUser(id);
      console.log('   ✅ Auth account removed.');
    } catch (e) {
      if (e.code !== 'auth/user-not-found') console.error('   ⚠️ Auth deletion error:', e.message);
    }

    // 3. Delete Firestore Data Recursively (Profile + Projects + Pages)
    if (user) {
      const rolePath = `user/roles/${user.role}/${id}`;
      console.log(`   Step: Purging Firestore recursively: ${rolePath}...`);
      await deleteRecursive(db.doc(rolePath));
      console.log('   ✅ Firestore nested path purged.');
    }

    // 4. Deep strict delete from root too (just in case)
    await db.collection('user').doc(id).delete();
    console.log(`✨ [User.delete] User ${id} completely removed.`);
  }

  static async getStats() {
    const roles = ['admin', 'support', 'client', 'super_admin'];
    let all = [];
    for (const role of roles) {
      const snap = await db.collection('user').doc('roles').collection(role).get();
      all = all.concat(snap.docs.map(d => d.data()));
    }

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
        super_admin: all.filter(u => (u.role === 'super_admin' || u.role === 'super admin')).length,
      },
    };
  }
}

module.exports = User;
