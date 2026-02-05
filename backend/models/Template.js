// models/Template.js - Firestore collection 'templates'
const { getFirestore } = require('../config/firebase');

function getCollection() {
  return getFirestore().collection('templates');
}

async function create(data) {
  const doc = {
    title: data.title || '',
    description: data.description || '',
    slug: data.slug || '',
    previewImage: data.previewImage || null,
    comingSoon: data.comingSoon === true,
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : parseInt(data.sortOrder, 10) || 0,
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

async function findAll() {
  const snapshot = await getCollection().get();
  const items = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
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

async function count() {
  const snapshot = await getCollection().get();
  return snapshot.size;
}

module.exports = {
  getCollection,
  create,
  findById,
  findAll,
  update,
  delete: deleteById,
  count
};
