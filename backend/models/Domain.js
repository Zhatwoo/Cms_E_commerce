const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

const COLLECTION = 'domains';

async function create(data) {
  const doc = {
    user_id: data.userId || null,
    domain: (data.domain || '').toLowerCase().trim(),
    status: data.status || 'Pending',
    verified_at: data.verifiedAt || null,
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

async function findByUserId(userId) {
  const snap = await db.collection(COLLECTION).where('user_id', '==', userId).get();
  return snap.docs.map(d => docToObject(d));
}

async function findAll(filters = {}) {
  let ref = db.collection(COLLECTION);
  if (filters.userId) ref = ref.where('user_id', '==', filters.userId);
  if (filters.status) ref = ref.where('status', '==', filters.status);
  const snap = await ref.get();
  return snap.docs.map(d => docToObject(d));
}

async function update(id, data) {
  const updates = {};
  if (data.domain !== undefined) updates.domain = data.domain;
  if (data.status !== undefined) updates.status = data.status;
  if (data.verifiedAt !== undefined) updates.verified_at = data.verifiedAt;
  if (Object.keys(updates).length === 0) return findById(id);
  updates.updated_at = new Date();
  await db.collection(COLLECTION).doc(id).update(updates);
  return findById(id);
}

async function deleteById(id) {
  await db.collection(COLLECTION).doc(id).delete();
}

module.exports = { create, findById, findByUserId, findAll, update, delete: deleteById };
