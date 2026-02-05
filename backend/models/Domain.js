// models/Domain.js - Firestore collection 'domains'
const { getFirestore } = require('../config/firebase');

function getCollection() {
  return getFirestore().collection('domains');
}

async function create(data) {
  const doc = {
    userId: data.userId || null,
    domain: (data.domain || '').toLowerCase().trim(),
    status: data.status || 'Pending',
    verifiedAt: data.verifiedAt || null,
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

async function findByUserId(userId) {
  const snapshot = await getCollection().get();
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => d.userId === userId);
}

async function findAll(filters = {}) {
  const snapshot = await getCollection().get();
  let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  if (filters.userId) items = items.filter(d => d.userId === filters.userId);
  if (filters.status) items = items.filter(d => d.status === filters.status);
  return items;
}

async function update(id, data) {
  const updates = { ...data, updatedAt: new Date().toISOString() };
  await getCollection().doc(id).update(updates);
  return findById(id);
}

async function deleteById(id) {
  await getCollection().doc(id).delete();
}

module.exports = {
  getCollection,
  create,
  findById,
  findByUserId,
  findAll,
  update,
  delete: deleteById
};
