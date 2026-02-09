const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

const COLLECTION = 'posts';

async function create(data) {
  const doc = {
    title: data.title || '',
    slug: data.slug || '',
    excerpt: data.excerpt || '',
    content: data.content ?? '',
    status: data.status || 'Draft',
    featured_image: data.featuredImage || null,
    author_id: data.authorId || null,
    published_at: data.publishedAt || null,
    created_at: new Date(),
    updated_at: new Date(),
  };
  const ref = await db.collection(COLLECTION).add(doc);
  const snap = await ref.get();
  return docToObject(snap);
}

async function findById(id) {
  const snap = await db.collection(COLLECTION).doc(id).get();
  return docToObject(snap);
}

async function findBySlug(slug) {
  const snap = await db.collection(COLLECTION).where('slug', '==', slug).limit(1).get();
  if (snap.empty) return null;
  return docToObject(snap.docs[0]);
}

async function findAll(filters = {}, pagination = {}) {
  const limit = Math.max(1, parseInt(pagination.limit) || 20);
  const page = Math.max(1, parseInt(pagination.page) || 1);

  let ref = db.collection(COLLECTION).orderBy('created_at', 'desc');
  if (filters.status) ref = ref.where('status', '==', filters.status);

  const snap = await ref.get();
  let items = snap.docs.map(d => docToObject(d));
  if (filters.search) {
    const s = String(filters.search).toLowerCase();
    items = items.filter(p => (p.title && p.title.toLowerCase().includes(s)) || (p.slug && p.slug.toLowerCase().includes(s)));
  }
  const total = items.length;
  const start = (page - 1) * limit;
  items = items.slice(start, start + limit);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
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
  if (Object.keys(updates).length === 0) return findById(id);
  updates.updated_at = new Date();
  await db.collection(COLLECTION).doc(id).update(updates);
  return findById(id);
}

async function deleteById(id) {
  await db.collection(COLLECTION).doc(id).delete();
}

async function count(filters = {}) {
  const { total } = await findAll(filters, { limit: 1, page: 1 });
  return total;
}

module.exports = { create, findById, findBySlug, findAll, update, delete: deleteById, count };
