const { db } = require('../config/firebase');
const { keysToSnake } = require('../utils/caseHelper');
const { docToObject } = require('../utils/firestoreHelper');

const COLLECTION = 'templates';

async function create(data) {
  const doc = {
    title: data.title || '',
    description: data.description || '',
    slug: data.slug || '',
    preview_image: data.previewImage || null,
    coming_soon: data.comingSoon === true,
    sort_order: typeof data.sortOrder === 'number' ? data.sortOrder : parseInt(data.sortOrder, 10) || 0,
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

async function findAll() {
  const snap = await db.collection(COLLECTION).orderBy('sort_order', 'asc').get();
  return snap.docs.map(d => docToObject(d));
}

async function update(id, data) {
  const updates = keysToSnake(data);
  delete updates.id;
  delete updates.created_at;
  if (Object.keys(updates).length === 0) return findById(id);
  updates.updated_at = new Date();
  await db.collection(COLLECTION).doc(id).update(updates);
  return findById(id);
}

async function deleteById(id) {
  await db.collection(COLLECTION).doc(id).delete();
}

async function count() {
  const snap = await db.collection(COLLECTION).get();
  return snap.size;
}

module.exports = { create, findById, findAll, update, delete: deleteById, count };
