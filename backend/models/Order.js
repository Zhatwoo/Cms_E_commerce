// models/Order.js - Firestore collection 'orders'
const { getFirestore } = require('../config/firebase');

function getCollection() {
  return getFirestore().collection('orders');
}

async function create(data) {
  const doc = {
    userId: data.userId || null,
    items: Array.isArray(data.items) ? data.items : [],
    total: typeof data.total === 'number' ? data.total : parseFloat(data.total) || 0,
    status: data.status || 'Pending',
    shippingAddress: data.shippingAddress || null,
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

async function findByUserId(userId, pagination = {}) {
  const snapshot = await getCollection().get();
  let items = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(o => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = items.length;
  const limit = Math.max(1, parseInt(pagination.limit) || 20);
  const page = Math.max(1, parseInt(pagination.page) || 1);
  const start = (page - 1) * limit;
  items = items.slice(start, start + limit);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

async function findAll(filters = {}, pagination = {}) {
  const snapshot = await getCollection().get();
  let items = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (filters.status) items = items.filter(o => o.status === filters.status);
  if (filters.userId) items = items.filter(o => o.userId === filters.userId);
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
  findByUserId,
  findAll,
  update,
  delete: deleteById,
  count
};
