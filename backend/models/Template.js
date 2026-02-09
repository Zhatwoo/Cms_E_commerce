const { supabaseAdmin } = require('../config/supabase');
const { keysToCamel, keysToSnake } = require('../utils/caseHelper');

const TABLE = 'templates';
function isNotFound(e) { return e && e.code === 'PGRST116'; }

async function create(data) {
  const doc = {
    title: data.title || '',
    description: data.description || '',
    slug: data.slug || '',
    preview_image: data.previewImage || null,
    coming_soon: data.comingSoon === true,
    sort_order: typeof data.sortOrder === 'number' ? data.sortOrder : parseInt(data.sortOrder, 10) || 0
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

async function findAll() {
  const { data, error } = await supabaseAdmin.from(TABLE).select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(keysToCamel);
}

async function update(id, data) {
  const updates = keysToSnake(data);
  const { error } = await supabaseAdmin.from(TABLE).update(updates).eq('id', id);
  if (error) throw error;
  return findById(id);
}

async function deleteById(id) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

async function count() {
  const { count: c, error } = await supabaseAdmin.from(TABLE).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return c || 0;
}

module.exports = { create, findById, findAll, update, delete: deleteById, count };
