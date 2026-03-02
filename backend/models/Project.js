const { db, getRealtimeDb } = require('../config/firebase');
const { docToObject, deleteRecursive } = require('../utils/firestoreHelper');
const Domain = require('./Domain');

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
    thumbnail: data.thumbnail || null,
    created_at: new Date(),
    updated_at: new Date(),
  };
  const newRef = await ref.add(doc);
  const snap = await newRef.get();
  return docToObject(snap);
}

async function list(userId) {
  const ref = getProjectsRef(userId);
  const snap = await ref.get();
  const items = snap.docs.map(d => docToObject(d)).filter(x => x);
  // Sort in JS instead of Firestore to avoid filtering out docs missing 'updated_at'
  return items.sort((a, b) => {
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tB - tA;
  });
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
  if (data.thumbnail !== undefined) updates.thumbnail = data.thumbnail || null;
  if (Object.keys(updates).length === 0) return get(userId, projectId);
  updates.updated_at = new Date();
  await ref.update(updates);
  const snap = await ref.get();
  return docToObject(snap);
}

async function deleteProject(userId, projectId) {
  const docRef = getProjectsRef(userId).doc(projectId);

  // 1. Delete domain and public subdomain records
  await Domain.deleteByProjectId(userId, projectId);

  // 2. Delete project doc and all sub-collections (e.g. pages) recursively
  await deleteRecursive(docRef);

  // 3. Delete from Realtime Database if configured
  const rtdb = getRealtimeDb();
  if (rtdb) {
    try {
      await rtdb.ref(`user/roles/client/${userId}/projects/${projectId}`).remove();
    } catch (e) {
      console.warn('deleteProject: RTDB cleanup failed:', e.message);
    }
  }
}

async function getBySubdomain(userId, subdomain) {
  const normalized = (subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || null;
  if (!normalized) return null;

  // 1) Try Firestore first (subdomain stored when creating/updating project via API)
  const ref = getProjectsRef(userId).where('subdomain', '==', normalized);
  const snap = await ref.limit(1).get();
  if (!snap.empty) return docToObject(snap.docs[0]);

  // 2) Fallback: read from Firebase Realtime DB (path used by frontend: user/roles/client/{uid}/projects)
  const rtdb = getRealtimeDb();
  if (!rtdb) return null;
  try {
    const rtdbRef = rtdb.ref(`user/roles/client/${userId}/projects`);
    const snapshot = await rtdbRef.once('value');
    const val = snapshot.val();
    if (!val || typeof val !== 'object') return null;
    for (const [projectId, data] of Object.entries(val)) {
      const sub = (data && data.subdomain) ? String(data.subdomain).trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : '';
      if (sub === normalized) {
        const project = await get(userId, projectId);
        if (project) {
          project.subdomain = normalized;
          return project;
        }
        return null;
      }
    }
  } catch (err) {
    console.warn('getBySubdomain RTDB fallback error:', err.message);
  }
  return null;
}

async function countWithSubdomain(userId) {
  const snap = await getProjectsRef(userId).where('subdomain', '!=', null).get();
  return snap.size;
}

async function countAll() {
  const clientSnap = await db.collection('user').doc('roles').collection('client').get();
  let total = 0;
  for (const doc of clientSnap.docs) {
    const projSnap = await doc.ref.collection('projects').get();
    total += projSnap.size;
  }
  return total;
}

module.exports = {
  create,
  list,
  get,
  getBySubdomain,
  update,
  delete: deleteProject,
  countAll,
  countWithSubdomain,
};
