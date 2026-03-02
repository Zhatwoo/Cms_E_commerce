const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

function getInstancesRef(userId) {
  return db.collection('user').doc('roles').collection('client').doc(userId).collection('instances');
}

async function create(userId, data) {
  const ref = getInstancesRef(userId);
  const subdomain = (data.subdomain || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '') || null;

  const doc = {
    title: data.title || 'Untitled Instance',
    status: 'active',
    subdomain,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const newRef = await ref.add(doc);
  const snap = await newRef.get();
  return docToObject(snap);
}

async function list(userId) {
  const snap = await getInstancesRef(userId).orderBy('updated_at', 'desc').get();
  return snap.docs.map((doc) => docToObject(doc));
}

async function get(userId, instanceId) {
  const snap = await getInstancesRef(userId).doc(instanceId).get();
  return docToObject(snap);
}

async function update(userId, instanceId, data) {
  const ref = getInstancesRef(userId).doc(instanceId);
  const updates = {};

  if (data.title !== undefined) updates.title = data.title || 'Untitled Instance';
  if (data.subdomain !== undefined) {
    updates.subdomain = (data.subdomain || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') || null;
  }

  if (Object.keys(updates).length === 0) return get(userId, instanceId);

  updates.updated_at = new Date();
  await ref.update(updates);
  const snap = await ref.get();
  return docToObject(snap);
}

async function deleteInstance(userId, instanceId) {
  await getInstancesRef(userId).doc(instanceId).delete();
}

module.exports = {
  create,
  list,
  get,
  update,
  delete: deleteInstance,
};
