// models/User.js — Firebase Auth + Firestore users collection
const { auth, db } = require('../config/firebase');
const { deleteRecursive } = require('../utils/firestoreHelper');
const log = require('../utils/logger')('User');

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
    suspensionReason: d.suspension_reason || '',
    isActive: d.is_active !== false,
    isOnline: d.is_online === true,
    paymentMethods: d.payment_methods || [],
    createdAt: d.created_at?.toDate?.()?.toISOString?.() || d.created_at,
    updatedAt: d.updated_at?.toDate?.()?.toISOString?.() || d.updated_at,
    lastSeen: d.last_seen?.toDate?.()?.toISOString?.() || d.last_seen || null,
    emailVerified: d.email_verified || false,
    notificationPreferences: d.notification_preferences || { securityAlerts: true, sessionNotifications: true, accountUpdates: true }
  };
}

function toFirestore(data) {
  const map = {
    name: 'full_name', displayName: 'full_name',
    avatar: 'avatar_url', email: 'email', phone: 'phone', bio: 'bio',
    username: 'username', website: 'website', status: 'status', role: 'role',
    isActive: 'is_active', subscriptionPlan: 'subscription_plan',
    isOnline: 'is_online',
    suspensionReason: 'suspension_reason',
    paymentMethods: 'payment_methods',
    lastSeen: 'last_seen',
    emailVerified: 'email_verified',
    notificationPreferences: 'notification_preferences'
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
  static async createFromFirebaseUser(userRecord, options = {}) {
    if (!userRecord?.uid) throw new Error('Missing Firebase user record');

    const normalizedRole = (options.role && typeof options.role === 'string')
      ? options.role.toLowerCase().replace(/\s+/g, '_')
      : 'client';
    const now = new Date();
    const profile = {
      avatar_url: options.avatar ?? userRecord.photoURL ?? null,
      bio: options.bio ?? '',
      created_at: now,
      email: (userRecord.email || '').toLowerCase().trim(),
      full_name:
        (options.name && String(options.name).trim()) ||
        (userRecord.displayName || '').trim() ||
        ((userRecord.email || '').split('@')[0] || 'User'),
      is_active: options.isActive !== false,
      is_online: options.isOnline === true,
      phone: options.phone ?? userRecord.phoneNumber ?? null,
      role: normalizedRole,
      status: options.status || 'active',
      subscription_plan: options.subscriptionPlan || 'free',
      updated_at: now,
      username: options.username || '',
      website: options.website || '',
    };

    const rolePath = `user/roles/${normalizedRole}/${userRecord.uid}`;
    await db.doc(rolePath).set(profile, { merge: true });
    await db.collection('user').doc(userRecord.uid).delete().catch(() => {});
    return this.findById(userRecord.uid);
  }

  /** Public signup: create auth user + Firestore profile (role client) */
  /** Public signup: create auth user + Firestore profile (role client) */
  static async register({ name, email, password }) {
    log.debug('---------------------------------------------------------');
    log.debug(`🚀 [User.register] STRICT NESTED PATH ONLY for: ${email}`);
    try {
      // 1. Create Firebase Auth User
      log.debug('   Step 1: Creating Firebase Auth user...');
      const userRecord = await auth.createUser({
        email: email.toLowerCase().trim(),
        password,
        displayName: (name || '').trim(),
        emailVerified: false, // User must confirm email via link before they can login
      });
      const uid = userRecord.uid;
      log.debug(`   ✅ Step 1 Success: UID created -> ${uid}`);

      const now = new Date();
      const roleName = 'client';
      const profile = {
        avatar_url: null,
        bio: '',
        created_at: now,
        email: userRecord.email,
        full_name: (name || '').trim() || (userRecord.email || '').split('@')[0],
        is_active: true,
        is_online: false,
        phone: null,
        role: roleName,
        status: 'active',
        subscription_plan: 'free',
        updated_at: now,
        username: '',
        website: '',
        email_verified: false,
      };

      // 2. Save profile ONLY to: user/roles/client/{uid}
      const rolePath = `user/roles/${roleName}/${uid}`;
      log.debug(`   Step 2: Saving profile to STRICT path: ${rolePath}...`);
      await db.doc(rolePath).set(profile);
      log.debug(`   ✅ Step 2 Success: Profile created.`);

      // 3. Ensure root user/{uid} DOES NOT EXIST
      log.debug(`   Step 3: Ensuring root "user/${uid}" is empty...`);
      await db.collection('user').doc(uid).delete();
      log.debug(`   ✅ Step 3 Success: Root shadow confirmed empty.`);

      log.debug(`✨ [User.register] FINISHED SUCCESSFULLY for UID: ${uid}`);
      log.debug('---------------------------------------------------------');
      return this.findById(uid);
    } catch (error) {
      log.error('❌ [User.register] CRITICAL FAILURE:', error);
      log.debug('---------------------------------------------------------');
      throw error;
    }
  }

  /** Admin create user with role */
  static async create({ name, email, password, role, status, phone, bio, avatar }) {
    log.debug('---------------------------------------------------------');
    log.debug(`🚀 [User.create] Admin creating user: ${email}`);
    try {
      const normalizedRole = (role && typeof role === 'string') ? role.toLowerCase().replace(/\s+/g, '_') : 'client';

      // 1. Create Auth User
      log.debug('   Step 1: Creating Auth user...');
      const userRecord = await auth.createUser({
        email: email.toLowerCase().trim(),
        password,
        displayName: (name || '').trim(),
        emailVerified: true,
      });
      const uid = userRecord.uid;
      log.debug(`   ✅ Step 1 Success: UID -> ${uid}`);

      const now = new Date();
      const profile = {
        avatar_url: avatar || null,
        bio: bio || '',
        created_at: now,
        email: userRecord.email,
        full_name: (name || '').trim() || (userRecord.email || '').split('@')[0],
        is_active: true,
        is_online: false,
        phone: phone || null,
        role: normalizedRole,
        status: status || 'active',
        subscription_plan: 'free',
        updated_at: now,
        username: '',
        website: '',
        email_verified: true,
      };

      // 2. Save profile to user/roles/{role}/{uid}. Super Admin goes to user/roles/admin per requirement.
      const collectionRole = normalizedRole === 'super_admin' ? 'admin' : normalizedRole;
      const rolePath = `user/roles/${collectionRole}/${uid}`;
      log.debug(`   Step 2: Saving profile to STRICT path: ${rolePath}...`);
      await db.doc(rolePath).set(profile);
      log.debug(`   ✅ Step 2 Success: Role document created in "${normalizedRole}".`);

      // 3. STRICT ENFORCEMENT: Delete root document if it somehow exists
      log.debug(`   Step 3: Ensuring root path "user/${uid}" is empty...`);
      await db.collection('user').doc(uid).delete();
      log.debug(`   ✅ Step 3 Success: Root shadow cleaned.`);

      log.debug(`✨ [User.create] FINISHED SUCCESSFULLY for UID: ${uid}`);
      log.debug('---------------------------------------------------------');
      return this.findById(uid);
    } catch (error) {
      log.error('❌ [User.create] CRITICAL FAILURE:', error);
      log.debug('---------------------------------------------------------');
      throw error;
    }
  }

  static async findByEmail(email) {
    if (!email) return null;
    const norm = email.toLowerCase().trim();
    const roles = ['client', 'admin', 'support', 'super_admin'];

    // Parallel search across role collections
    const results = await Promise.all(roles.map(role => 
      db.collection('user').doc('roles').collection(role === 'super_admin' ? 'admin' : role)
        .where('email', '==', norm).limit(1).get()
    ));

    for (const snap of results) {
      if (!snap.empty) {
        const user = fromDoc(snap.docs[0]);
        if (user) return user;
      }
    }
    return null;
  }

  static async findById(id) {
    if (!id) return null;
    const roles = ['client', 'admin', 'support', 'super_admin'];

    // Parallel fetch from all possible role paths
    const results = await Promise.all(roles.map(role => 
      db.collection('user').doc('roles').collection(role === 'super_admin' ? 'admin' : role).doc(id).get()
    ));

    const found = results.find(doc => doc.exists);
    return found ? fromDoc(found) : null;
  }

  static async get(id) {
    return this.findById(id);
  }

  static async findAll(filters = {}) {
    const roles = filters.role ? [filters.role.toLowerCase()] : ['client', 'admin', 'support', 'super_admin'];
    
    // Parallel fetch from role collections
    const snaps = await Promise.all(roles.map(role => {
      const collectionRole = role === 'super_admin' ? 'admin' : role;
      let ref = db.collection('user').doc('roles').collection(collectionRole);
      if (role === 'super_admin') ref = ref.where('role', '==', 'super_admin');
      if (filters.status) ref = ref.where('status', '==', filters.status);
      return ref.get();
    }));

    let allUsers = [];
    for (const snap of snaps) {
      allUsers = allUsers.concat(snap.docs.map(d => fromDoc(d)));
    }

    allUsers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (filters.search) {
      const s = String(filters.search).toLowerCase();
      allUsers = allUsers.filter(u => (u.displayName && u.displayName.toLowerCase().includes(s)) || (u.email && u.email.toLowerCase().includes(s)));
    }
    return allUsers;
  }

  /** Paged fetch: uses Firestore limit/offset for efficiency */
  static async findPaged({ search, role, status, page = 1, limit = 10 }) {
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const pageNum = Math.max(1, parseInt(page) || 1);
    const skip = (pageNum - 1) * limitNum;

    // Use aggregate count for total across all relevant collections
    const roles = role ? [role.toLowerCase()] : ['client', 'admin', 'support', 'super_admin'];
    
    // For large scale, we should maintain a global counter or use separate aggregate queries
    // Here we fetch minimal data first to determine totals if not cached
    const countsSnaps = await Promise.all(roles.map(r => {
      const collectionRole = r === 'super_admin' ? 'admin' : r;
      let ref = db.collection('user').doc('roles').collection(collectionRole);
      if (r === 'super_admin') ref = ref.where('role', '==', 'super_admin');
      if (status) ref = ref.where('status', '==', status);
      return ref.count().get();
    }));
    
    const total = countsSnaps.reduce((acc, s) => acc + s.data().count, 0);

    // Fetch the specific page
    // Note: Firestore offset is still billed for skipped docs. 
    // For extreme scale, use startAfter(doc) cursors.
    const dataSnaps = await Promise.all(roles.map(r => {
      const collectionRole = r === 'super_admin' ? 'admin' : r;
      let ref = db.collection('user').doc('roles').collection(collectionRole);
      if (r === 'super_admin') ref = ref.where('role', '==', 'super_admin');
      if (status) ref = ref.where('status', '==', status);
      
      // We can't easily skip across collections without fetching all, 
      // so for multi-role search without role filter, we still need some aggregation.
      // But with role filter, this is 100% efficient.
      return ref.orderBy('created_at', 'desc').limit(skip + limitNum).get();
    }));

    let all = [];
    for (const snap of dataSnaps) {
      all = all.concat(snap.docs.map(d => fromDoc(d)));
    }

    // Sort global result set
    all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Client-side search (Firestore doesn't support partial string search well without external indexes)
    if (search) {
      const s = search.toLowerCase();
      all = all.filter(u => u.displayName?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
    }

    const paginated = all.slice(skip, skip + limitNum);

    return {
      users: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  static async update(id, data) {
    if (!id) throw new Error('Missing id');

    // Find where the user is first
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');

    const updates = toFirestore(data);
    if (Object.keys(updates).length === 0) return user;
    updates.updated_at = new Date();

    // Update in the specific role collection (super_admin stored under admin path)
    const collectionRole = user.role === 'super_admin' ? 'admin' : user.role;
    await db.collection('user').doc('roles').collection(collectionRole).doc(id).update(updates);

    return this.findById(id);
  }

  static async updatePassword(id, newPassword) {
    if (!id) throw new Error('Missing id');
    await auth.updateUser(id, { password: newPassword });
  }

  /** Mark Firebase Auth user as email verified (after confirmation link). */
  static async setEmailVerified(id) {
    if (!id) throw new Error('Missing id');
    await auth.updateUser(id, { emailVerified: true });
    // Also update in Firestore
    await this.update(id, { emailVerified: true });
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
    log.debug(`🧹 [User.delete] Purging user: ${id}`);

    // 1. Find user to get their role (so we know where their data is)
    const user = await this.findById(id);

    // 2. Delete from Firebase Auth
    try {
      await auth.deleteUser(id);
      log.debug('   ✅ Auth account removed.');
    } catch (e) {
      if (e.code !== 'auth/user-not-found') log.error('   ⚠️ Auth deletion error:', e.message);
    }

    // 3. Delete Firestore Data Recursively (super_admin stored under admin path)
    if (user) {
      const collectionRole = user.role === 'super_admin' ? 'admin' : user.role;
      const rolePath = `user/roles/${collectionRole}/${id}`;
      log.debug(`   Step: Purging Firestore recursively: ${rolePath}...`);
      await deleteRecursive(db.doc(rolePath));
      log.debug('   ✅ Firestore nested path purged.');
    }

    // 4. Deep strict delete from root too (just in case)
    await db.collection('user').doc(id).delete();
    log.debug(`✨ [User.delete] User ${id} completely removed.`);
  }

  static async getStats() {
    const rolesToCheck = ['admin', 'support', 'client'];
    const threeMinsAgo = new Date(Date.now() - 3 * 60 * 1000);
    
    // 1. Parallel collection of data/counts
    const results = await Promise.all(rolesToCheck.map(async (coll) => {
      const collRef = db.collection('user').doc('roles').collection(coll);
      
      // Get all users in this role (still needed for byStatus/byPlan unless we do many more parallel counts)
      // For large datasets, this should be replaced entirely with aggregate queries.
      const snap = await collRef.get();
      const docs = snap.docs.map(d => {
        const data = d.data();
        let lastSeenDate = null;
        if (data.last_seen) {
          lastSeenDate = data.last_seen.toDate ? data.last_seen.toDate() : new Date(data.last_seen);
        }
        return { ...data, id: d.id, last_seen_date: lastSeenDate };
      });

      const onlineCountInColl = docs.filter(u => u.last_seen_date && u.last_seen_date > threeMinsAgo).length;

      return { docs, onlineCount: onlineCountInColl };
    }));

    let all = [];
    let onlineCount = 0;
    for (const res of results) {
      all = all.concat(res.docs);
      onlineCount += res.onlineCount;
    }

    const byRole = {
      admin: all.filter(u => u.role === 'admin' || u.role === 'super_admin' || u.role === 'super admin').length,
      support: all.filter(u => u.role === 'support').length,
      client: all.filter(u => u.role === 'client' || u.role === 'user').length
    };

    const byStatus = {
      active: all.filter(u => !u.status || u.status === 'Active' || u.status === 'Published').length,
      suspended: all.filter(u => u.status === 'Suspended' || u.status === 'Banned').length
    };

    const byPlan = {
      free: all.filter(u => (u.subscription_plan || u.subscriptionPlan || 'free') === 'free').length,
      basic: all.filter(u => (u.subscription_plan || u.subscriptionPlan) === 'basic').length,
      pro: all.filter(u => (u.subscription_plan || u.subscriptionPlan) === 'pro').length
    };

    // If no real data, provide some mock distribution for visual clarity in dashboard
    if (all.length === 0) {
      byPlan.free = 0; byPlan.basic = 0; byPlan.pro = 0;
    }

    return {
      total: all.length,
      online: onlineCount,
      byRole,
      byStatus,
      byPlan,
      lastUpdated: new Date().toISOString()
    };

  }

  /** Get active clients statistics only (for analytics dashboard). */
  static async getActiveClientsStats() {
    const threeMinsAgo = new Date(Date.now() - 3 * 60 * 1000);
    
    try {
      const collRef = db.collection('user').doc('roles').collection('client');
      const snap = await collRef.get();
      
      const docs = snap.docs.map(d => {
        const data = d.data();
        let lastSeenDate = null;
        if (data.last_seen) {
          lastSeenDate = data.last_seen.toDate ? data.last_seen.toDate() : new Date(data.last_seen);
        }
        return { 
          ...data, 
          id: d.id, 
          last_seen_date: lastSeenDate,
          status_lower: (data.status || '').toLowerCase(),
          is_active: data.is_active
        };
      });

      // isClientActive logic: status is 'published' or 'active' (case-insensitive) OR isActive === true
      const activeClients = docs.filter(u => {
        const statusMatch = u.status_lower === 'published' || u.status_lower === 'active';
        return statusMatch || u.is_active === true;
      });

      // isUserOnline logic: (isOnline === true) OR (lastSeen within 3 minutes)
      const onlineClients = activeClients.filter(u => {
        if (u.is_online === true) return true;
        if (u.is_online === false) return false;
        // Check if last_seen is within 3 minutes
        return u.last_seen_date && u.last_seen_date > threeMinsAgo;
      });

      const byPlan = {
        free: docs.filter(u => (u.subscription_plan || u.subscriptionPlan || 'free') === 'free').length,
        basic: docs.filter(u => (u.subscription_plan || u.subscriptionPlan) === 'basic').length,
        pro: docs.filter(u => (u.subscription_plan || u.subscriptionPlan) === 'pro').length
      };

      return {
        total: docs.length,
        active: activeClients.length,
        online: onlineClients.length,
        byPlan,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      log.error('Error in getActiveClientsStats:', error);
      return { total: 0, active: 0, online: 0, byPlan: { free: 0, basic: 0, pro: 0 } };
    }
  }

  /** Signups trend across all roles. Returns { signups: counts, labels, period }. */
  static async getSignupsOverTime(period = '7days') {
    const now = new Date();
    let start = new Date(now);
    let buckets = 7;

    if (period === '7days') {
      start.setDate(now.getDate() - 7);
      buckets = 7;
    } else if (period === '30days') {
      start.setDate(now.getDate() - 30);
      buckets = 4;
    } else {
      start.setMonth(now.getMonth() - 3);
      buckets = 3;
    }

    const bucketMs = (now.getTime() - start.getTime()) / buckets;
    const counts = new Array(buckets).fill(0);
    const labels = [];

    for (let i = 0; i < buckets; i++) {
      const t = new Date(start.getTime() + (i + 1) * bucketMs);
      labels.push(
        period === '7days'
          ? t.toLocaleDateString('en-US', { weekday: 'short' })
          : period === '30days'
          ? `Week ${i + 1}`
          : t.toLocaleDateString('en-US', { month: 'short' })
      );
    }

    const rolesToCheck = ['admin', 'support', 'client'];
    const snaps = await Promise.all(rolesToCheck.map(coll => 
      db.collection('user').doc('roles').collection(coll)
        .where('created_at', '>=', start)
        .get()
    ));

    for (const snap of snaps) {
      snap.docs.forEach(d => {
        const data = d.data();
        const created = data.created_at?.toDate?.() || (data.created_at ? new Date(data.created_at) : null);
        if (created) {
          const idx = Math.min(Math.floor((created.getTime() - start.getTime()) / bucketMs), buckets - 1);
          if (idx >= 0) counts[idx]++;
        }
      });
    }

    return { signups: counts, labels, period };
  }

}

module.exports = User;
