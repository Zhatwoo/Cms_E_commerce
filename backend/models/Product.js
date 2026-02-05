// models/Product.js - Firestore collection 'products'
const { getFirestore } = require('../config/firebase');

function getCollection() {
  return getFirestore().collection('products');
}

async function create(data) {
  const doc = {
    name: data.name || '',
    slug: data.slug || '',
    description: data.description || '',
    price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
    compareAtPrice: data.compareAtPrice != null ? (typeof data.compareAtPrice === 'number' ? data.compareAtPrice : parseFloat(data.compareAtPrice)) : null,
    images: Array.isArray(data.images) ? data.images : [],
    status: data.status || 'Draft',
    stock: data.stock != null ? (typeof data.stock === 'number' ? data.stock : parseInt(data.stock, 10)) : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const docRef = await getCollection().add(doc);
  return { id: docRef.id, ...doc };
}

async function findById(id) {
  const doc = await getCollection().doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function findBySlug(slug) {
  const snapshot = await getCollection().where('slug', '==', slug).limit(1).get();
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() };
}

async function findAll(filters = {}, pagination = {}) {
  const snapshot = await getCollection().orderBy('createdAt', 'desc').get();
  let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  if (filters.status) {
    items = items.filter(p => p.status === filters.status);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    items = items.filter(p => (p.name || '').toLowerCase().includes(s) || (p.slug || '').toLowerCase().includes(s));
  }
  const total = items.length;
  const limit = Math.max(1, parseInt(pagination.limit) || 20);
  const page = Math.max(1, parseInt(pagination.page) || 1);
  const start = (page - 1) * limit;
  items = items.slice(start, start + limit);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

async function update(id, data) {
  const updates = { ...data, updatedAt: new Date().toISOString() };
  await getCollection().doc(id).update(updates);
  return findById(id);
}

async function deleteById(id) {
  await getCollection().doc(id).delete();
}

async function count(filters = {}) {
  const { items } = await findAll(filters, { limit: 9999 });
  return items.length;
}

module.exports = {
  getCollection,
  create,
  findById,
  findBySlug,
  findAll,
  update,
  delete: deleteById,
  count
};
