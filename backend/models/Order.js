const { supabaseAdmin } = require('../config/supabase');
const { keysToCamel } = require('../utils/caseHelper');

const TABLE = 'orders';
function isNotFound(e) { return e && e.code === 'PGRST116'; }

async function create(data) {
  const doc = {
    user_id: data.userId || null,
    items: Array.isArray(data.items) ? data.items : [],
    total: typeof data.total === 'number' ? data.total : parseFloat(data.total) || 0,
    status: data.status || 'Pending',
    shipping_address: data.shippingAddress || null
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

async function findByUserId(userId, pagination = {}) {
  const limit = Math.max(1, parseInt(pagination.limit) || 20);
  const page = Math.max(1, parseInt(pagination.page) || 1);
  const start = (page - 1) * limit;

  const { data, error, count: total } = await supabaseAdmin
    .from(TABLE).select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(start, start + limit - 1);
  if (error) throw error;
  return { items: (data || []).map(keysToCamel), total: total || 0, page, totalPages: Math.ceil((total || 0) / limit) };
}

async function findAll(filters = {}, pagination = {}) {
  const limit = Math.max(1, parseInt(pagination.limit) || 20);
  const page = Math.max(1, parseInt(pagination.page) || 1);
  const start = (page - 1) * limit;

  let query = supabaseAdmin.from(TABLE).select('*', { count: 'exact' });
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.userId) query = query.eq('user_id', filters.userId);
  query = query.order('created_at', { ascending: false }).range(start, start + limit - 1);

  const { data, error, count: total } = await query;
  if (error) throw error;
  return { items: (data || []).map(keysToCamel), total: total || 0, page, totalPages: Math.ceil((total || 0) / limit) };
}

async function update(id, data) {
  const updates = {};
  if (data.status !== undefined) updates.status = data.status;
  if (data.items !== undefined) updates.items = data.items;
  if (data.total !== undefined) updates.total = data.total;
  if (data.shippingAddress !== undefined) updates.shipping_address = data.shippingAddress;
  const { error } = await supabaseAdmin.from(TABLE).update(updates).eq('id', id);
  if (error) throw error;
  return findById(id);
}

async function deleteById(id) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

async function count(filters = {}) {
  const { total } = await findAll(filters, { limit: 1, page: 1 });
  return total;
}

module.exports = { create, findById, findByUserId, findAll, update, delete: deleteById, count };
