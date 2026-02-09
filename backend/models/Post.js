const { supabaseAdmin } = require('../config/supabase');
const { keysToCamel } = require('../utils/caseHelper');

const TABLE = 'posts';
function isNotFound(e) { return e && e.code === 'PGRST116'; }

async function create(data) {
  const doc = {
    title: data.title || '',
    slug: data.slug || '',
    excerpt: data.excerpt || '',
    content: data.content ?? '',
    status: data.status || 'Draft',
    featured_image: data.featuredImage || null,
    author_id: data.authorId || null,
    published_at: data.publishedAt || null
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

async function findBySlug(slug) {
  const { data, error } = await supabaseAdmin.from(TABLE).select('*').eq('slug', slug).limit(1).single();
  if (isNotFound(error)) return null;
  if (error) throw error;
  return keysToCamel(data);
}

async function findAll(filters = {}, pagination = {}) {
  const limit = Math.max(1, parseInt(pagination.limit) || 20);
  const page = Math.max(1, parseInt(pagination.page) || 1);
  const start = (page - 1) * limit;

  let query = supabaseAdmin.from(TABLE).select('*', { count: 'exact' });
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) {
    const s = String(filters.search).toLowerCase();
    query = query.or(`title.ilike.%${s}%,slug.ilike.%${s}%`);
  }
  query = query.order('created_at', { ascending: false }).range(start, start + limit - 1);

  const { data, error, count: total } = await query;
  if (error) throw error;
  return { items: (data || []).map(keysToCamel), total: total || 0, page, totalPages: Math.ceil((total || 0) / limit) };
}

async function update(id, data) {
  const updates = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.excerpt !== undefined) updates.excerpt = data.excerpt;
  if (data.content !== undefined) updates.content = data.content;
  if (data.status !== undefined) updates.status = data.status;
  if (data.featuredImage !== undefined) updates.featured_image = data.featuredImage;
  if (data.authorId !== undefined) updates.author_id = data.authorId;
  if (data.publishedAt !== undefined) updates.published_at = data.publishedAt;
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

module.exports = { create, findById, findBySlug, findAll, update, delete: deleteById, count };
