const { supabaseAdmin } = require('../config/supabase');
const { keysToCamel } = require('../utils/caseHelper');

const TABLE = 'domains';
function isNotFound(e) { return e && e.code === 'PGRST116'; }

async function create(data) {
  const doc = {
    user_id: data.userId || null,
    domain: (data.domain || '').toLowerCase().trim(),
    status: data.status || 'Pending',
    verified_at: data.verifiedAt || null
  };
  const { data: row, error } = await supabaseAdmin.from(TABLE).insert(doc).select('*').single();
  if (error) throw error;
  return keysToCamel(row);
}

async function findById(id) {
  const { data, error } = await supabaseAdmin.from(TABLE).select('*').eq('id', id).single();
  if (isNotFound(error)) return null;
  if (error) throw error;
  return keysToCamel(data);
}

async function findByUserId(userId) {
  const { data, error } = await supabaseAdmin.from(TABLE).select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(keysToCamel);
}

async function findAll(filters = {}) {
  let query = supabaseAdmin.from(TABLE).select('*');
  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.status) query = query.eq('status', filters.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(keysToCamel);
}

async function update(id, data) {
  const updates = {};
  if (data.domain !== undefined) updates.domain = data.domain;
  if (data.status !== undefined) updates.status = data.status;
  if (data.verifiedAt !== undefined) updates.verified_at = data.verifiedAt;
  const { error } = await supabaseAdmin.from(TABLE).update(updates).eq('id', id);
  if (error) throw error;
  return findById(id);
}

async function deleteById(id) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

module.exports = { create, findById, findByUserId, findAll, update, delete: deleteById };
