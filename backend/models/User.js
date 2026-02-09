// models/User.js  —  Supabase Auth + profiles table
const { supabase, supabaseAdmin } = require('../config/supabase');

function isNotFound(err) {
  return err && err.code === 'PGRST116';
}

/** Map DB row (snake_case) → app object (camelCase) */
function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.full_name,
    avatar: row.avatar_url,
    phone: row.phone,
    bio: row.bio,
    username: row.username,
    website: row.website,
    role: row.role,
    subscriptionPlan: row.subscription_plan,
    status: row.status,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

class User {
  // ── Create (via Supabase Auth → trigger creates profile) ──
  static async create({ name, email, password, role, status, phone, bio, avatar }) {
    // 1. Create auth user (trigger auto-inserts profile row)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: (name || '').trim(),
        role: role || 'client'
      }
    });
    if (authErr) {
      const err = new Error(authErr.message);
      if (authErr.message.includes('already')) err.code = 'auth/email-already-exists';
      throw err;
    }
    const uid = authData.user.id;

    // 2. Update profile with extra fields the trigger didn't set
    const extras = {};
    if (status) extras.status = status;
    if (phone) extras.phone = phone;
    if (bio) extras.bio = bio;
    if (avatar) extras.avatar_url = avatar;
    if (Object.keys(extras).length) {
      await supabaseAdmin.from('profiles').update(extras).eq('id', uid);
    }

    return this.findById(uid);
  }

  // ── Finders ───────────────────────────────────────────────
  static async findByEmail(email) {
    if (!email) return null;
    const { data, error } = await supabaseAdmin
      .from('profiles').select('*')
      .eq('email', email.toLowerCase().trim())
      .limit(1).single();
    if (isNotFound(error)) return null;
    if (error) throw error;
    return fromRow(data);
  }

  static async findById(id) {
    if (!id) return null;
    const { data, error } = await supabaseAdmin
      .from('profiles').select('*')
      .eq('id', id).single();
    if (isNotFound(error)) return null;
    if (error) throw error;
    return fromRow(data);
  }

  /** Alias for auth middleware */
  static async get(id) {
    return this.findById(id);
  }

  static async findAll(filters = {}) {
    let query = supabaseAdmin.from('profiles').select('*');
    if (filters.role) query = query.eq('role', filters.role.toLowerCase());
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) {
      const s = String(filters.search).toLowerCase();
      query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(fromRow);
  }

  // ── Update profile fields ────────────────────────────────
  static async update(id, data) {
    if (!id) throw new Error('Missing id');
    const map = {
      name: 'full_name', displayName: 'full_name',
      avatar: 'avatar_url',
      email: 'email', phone: 'phone', bio: 'bio',
      username: 'username', website: 'website',
      status: 'status', role: 'role',
      isActive: 'is_active',
      subscriptionPlan: 'subscription_plan'
    };
    const updates = {};
    for (const [appKey, dbCol] of Object.entries(map)) {
      if (data[appKey] !== undefined) {
        updates[dbCol] = appKey === 'role' ? data[appKey].toLowerCase() : data[appKey];
      }
    }
    if (Object.keys(updates).length === 0) return this.findById(id);
    const { error } = await supabaseAdmin.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
    return this.findById(id);
  }

  // ── Password (delegates to Supabase Auth) ────────────────
  static async updatePassword(id, newPassword) {
    if (!id) throw new Error('Missing id');
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: newPassword });
    if (error) throw error;
  }

  /** Verify current password by attempting a sign-in */
  static async verifyPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }

  // ── Delete (removes auth user → cascade deletes profile) ─
  static async delete(id) {
    if (!id) throw new Error('Missing id');
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
  }

  // ── Stats (dashboard) ───────────────────────────────────
  static async getStats() {
    const { data, error } = await supabaseAdmin.from('profiles').select('status, role');
    if (error) throw error;
    const all = data || [];
    return {
      total: all.length,
      byStatus: {
        active: all.filter(u => u.status === 'active').length,
        published: all.filter(u => u.status === 'Published').length,
        restricted: all.filter(u => u.status === 'Restricted').length,
        suspended: all.filter(u => u.status === 'Suspended').length
      },
      byRole: {
        admin: all.filter(u => u.role === 'admin').length,
        support: all.filter(u => u.role === 'support').length,
        client: all.filter(u => u.role === 'client').length
      }
    };
  }
}

module.exports = User;
