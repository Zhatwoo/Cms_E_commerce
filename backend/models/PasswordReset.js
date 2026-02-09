const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'password_resets';
const EXPIRY_HOURS = 1;

function isNotFound(e) { return e && e.code === 'PGRST116'; }

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function create(userId, email) {
  const token = generateToken();
  const expires_at = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
  const doc = {
    user_id: userId,
    email: email.toLowerCase(),
    token,
    expires_at
  };
  const { data: row, error } = await supabaseAdmin.from(TABLE).insert(doc).select('*').single();
  if (error) throw error;
  return { token, docId: row.id };
}

async function findByToken(token) {
  const { data, error } = await supabaseAdmin
    .from(TABLE).select('*')
    .eq('token', token).limit(1).single();
  if (isNotFound(error)) return null;
  if (error) throw error;
  // Return with camelCase keys for controller compat
  return {
    id: data.id,
    userId: data.user_id,
    email: data.email,
    token: data.token,
    expiresAt: data.expires_at,
    createdAt: data.created_at
  };
}

async function deleteByDocId(docId) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', docId);
  if (error) throw error;
}

module.exports = { create, findByToken, deleteByDocId, EXPIRY_HOURS };
