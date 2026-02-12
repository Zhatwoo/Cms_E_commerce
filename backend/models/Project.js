const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

function getProjectsRef(userId) {
  return db.collection('user').doc('roles').collection('client').doc(userId).collection('projects');
}

async function create(userId, data) {
  const ref = getProjectsRef(userId);
  const subdomain = (data.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || null;
  const doc = {
    title: data.title || 'Untitled Project',
    status: 'draft',
    template_id: data.templateId || null,
    subdomain: subdomain || null,
    created_at: new Date(),
    updated_at: new Date(),
  };
  const newRef = await ref.add(doc);
  const snap = await newRef.get();
  return docToObject(snap);
}

async function list(userId) {
  const ref = getProjectsRef(userId).orderBy('updated_at', 'desc');
  const snap = await ref.get();
  return snap.docs.map(d => docToObject(d));
}

async function get(userId, projectId) {
  const snap = await getProjectsRef(userId).doc(projectId).get();
  return docToObject(snap);
}

async function update(userId, projectId, data) {
  const ref = getProjectsRef(userId).doc(projectId);
  const updates = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.status !== undefined) updates.status = data.status;
  if (data.subdomain !== undefined) updates.subdomain = (data.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || null;
  if (Object.keys(updates).length === 0) return get(userId, projectId);
  updates.updated_at = new Date();
  await ref.update(updates);
  const snap = await ref.get();
  return docToObject(snap);
}

async function deleteProject(userId, projectId) {
  await getProjectsRef(userId).doc(projectId).delete();
}

module.exports = {
  create,
  list,
  get,
  update,
  delete: deleteProject,
};
