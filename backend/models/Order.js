const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

const COLLECTION = 'orders';

async function create(data) {
  const doc = {
    user_id: data.userId || null,
    items: Array.isArray(data.items) ? data.items : [],
    total: typeof data.total === 'number' ? data.total : parseFloat(data.total) || 0,
    status: data.status || 'Pending',
    shipping_address: data.shippingAddress || null,
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

async function findByUserId(userId, pagination = {}) {
  const limit = Math.max(1, parseInt(pagination.limit) || 20);
  const page = Math.max(1, parseInt(pagination.page) || 1);

  const snap = await db.collection(COLLECTION).where('user_id', '==', userId).get();
  const all = snap.docs.map(d => docToObject(d)).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const total = all.length;
  const start = (page - 1) * limit;
  const items = all.slice(start, start + limit);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

async function findAll(filters = {}, pagination = {}) {
  const limit = Math.max(1, parseInt(pagination.limit) || 20);
  const page = Math.max(1, parseInt(pagination.page) || 1);

  let ref = db.collection(COLLECTION).orderBy('created_at', 'desc');
  if (filters.status) ref = ref.where('status', '==', filters.status);
  if (filters.userId) ref = ref.where('user_id', '==', filters.userId);

  const snap = await ref.get();
  let items = snap.docs.map(d => docToObject(d));
  const total = items.length;
  const start = (page - 1) * limit;
  items = items.slice(start, start + limit);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

async function update(id, data) {
  const updates = {};
  if (data.status !== undefined) updates.status = data.status;
  if (data.items !== undefined) updates.items = data.items;
  if (data.total !== undefined) updates.total = data.total;
  if (data.shippingAddress !== undefined) updates.shipping_address = data.shippingAddress;
  if (Object.keys(updates).length === 0) return findById(id);
  updates.updated_at = new Date();
  await db.collection(COLLECTION).doc(id).update(updates);
  return findById(id);
}

async function deleteById(id) {
  await db.collection(COLLECTION).doc(id).delete();
}

module.exports = { create, findById, findByUserId, findAll, update, delete: deleteById };
