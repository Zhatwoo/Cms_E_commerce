const { db } = require('../config/firebase');
const { keysToCamel } = require('../utils/caseHelper');
const { docToObject } = require('../utils/firestoreHelper');

const COLLECTION = 'products';

async function create(data) {
  const doc = {
    name: data.name || '',
    slug: data.slug || '',
    description: data.description || '',
    price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
    compare_at_price: data.compareAtPrice != null ? parseFloat(data.compareAtPrice) : null,
    images: Array.isArray(data.images) ? data.images : [],
    status: data.status || 'Draft',
    stock: data.stock != null ? parseInt(data.stock, 10) : null,
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

  let ref = db.collection(COLLECTION);
  if (filters.status) ref = ref.where('status', '==', filters.status);
  const snap = await ref.get();
  let items = snap.docs.map(d => docToObject(d));
  items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  if (filters.search) {
    const s = String(filters.search).toLowerCase();
    items = items.filter(p => (p.name && p.name.toLowerCase().includes(s)) || (p.slug && p.slug.toLowerCase().includes(s)));
  }
  const total = items.length;
  const start = (page - 1) * limit;
  items = items.slice(start, start + limit);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

async function update(id, data) {
  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.description !== undefined) updates.description = data.description;
  if (data.price !== undefined) updates.price = parseFloat(data.price) || 0;
  if (data.compareAtPrice !== undefined) updates.compare_at_price = data.compareAtPrice != null ? parseFloat(data.compareAtPrice) : null;
  if (data.images !== undefined) updates.images = data.images;
  if (data.status !== undefined) updates.status = data.status;
  if (data.stock !== undefined) updates.stock = data.stock != null ? parseInt(data.stock, 10) : null;
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
