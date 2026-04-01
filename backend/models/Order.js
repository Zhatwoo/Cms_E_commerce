const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

const COLLECTION = 'orders';

async function create(data) {
  const doc = {
    user_id: data.userId || null,
    project_id: data.projectId || null,
    items: Array.isArray(data.items) ? data.items : [],
    total: typeof data.total === 'number' ? data.total : parseFloat(data.total) || 0,
    status: data.status || 'Pending',
    shipping_address: data.shippingAddress || null,
    inventory_state: data.inventoryState || { reserved_applied: false, deducted_applied: false },
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
  let all = snap.docs.map(d => docToObject(d));
  if (pagination.projectId) {
    const targetProjectId = String(pagination.projectId).trim();
    all = all.filter((item) => String(item.projectId || '') === targetProjectId);
  }
  all = all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
  if (data.inventoryState !== undefined) {
    updates.inventory_state = {
      reserved_applied: !!data.inventoryState?.reservedApplied,
      deducted_applied: !!data.inventoryState?.deductedApplied,
    };
  }
  if (Object.keys(updates).length === 0) return findById(id);
  updates.updated_at = new Date();
  await db.collection(COLLECTION).doc(id).update(updates);
  return findById(id);
}

async function deleteById(id) {
  await db.collection(COLLECTION).doc(id).delete();
}

async function count(filters = {}) {
  let ref = db.collection(COLLECTION);
  if (filters.status) ref = ref.where('status', '==', filters.status);
  const snap = await ref.get();
  return snap.size;
}

async function getTotalRevenue() {
  const snap = await db.collection(COLLECTION).get();
  let total = 0;
  snap.docs.forEach((d) => {
    const data = d.data();
    const t = typeof data.total === 'number' ? data.total : parseFloat(data.total);
    if (!Number.isNaN(t)) total += t;
  });
  return total;
}

function getStartDate(period) {
  const now = new Date();
  const d = new Date(now);
  if (period === '7days') d.setDate(d.getDate() - 7);
  else if (period === '30days') d.setDate(d.getDate() - 30);
  else if (period === '3months') d.setMonth(d.getMonth() - 3);
  else d.setDate(d.getDate() - 7);
  return d;
}

async function getRevenueByPeriod(period) {
  const start = getStartDate(period);
  const snap = await db.collection(COLLECTION)
    .where('status', '==', 'Paid') // Optimized: only count paid revenue
    .where('created_at', '>=', start)
    .orderBy('created_at', 'asc')
    .get();
  const buckets = period === '7days' ? 7 : period === '30days' ? 4 : 3;
  const bucketMs = (Date.now() - start.getTime()) / buckets;
  const sums = new Array(buckets).fill(0);
  const labels = [];
  for (let i = 0; i < buckets; i++) {
    const t = new Date(start.getTime() + (i + 1) * bucketMs);
    labels.push(period === '7days' ? t.toLocaleDateString('en-US', { weekday: 'short' }) : period === '30days' ? `Week ${i + 1}` : t.toLocaleDateString('en-US', { month: 'short' }));
  }
  snap.docs.forEach((d) => {
    const data = d.data();
    const created = data.created_at?.toDate?.() || new Date(data.created_at);
    if (created < start) return;
    const t = typeof data.total === 'number' ? data.total : parseFloat(data.total);
    if (Number.isNaN(t)) return;
    const idx = Math.min(Math.floor((created - start) / bucketMs), buckets - 1);
    if (idx >= 0) sums[idx] += t;
  });
  return { labels, data: sums };
}


module.exports = { create, findById, findByUserId, findAll, update, delete: deleteById, count, getTotalRevenue, getRevenueByPeriod };
