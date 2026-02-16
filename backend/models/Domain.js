const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

const COLLECTION = 'domains';

/** Path: user/roles/client/{userId}/domains */
function getDomainsRef(userId) {
  return db.collection('user').doc('roles').collection('client').doc(userId).collection('domains');
}

/** Root collection for public lookup: subdomain (doc id) -> { userId, projectId, domainId, status }. */
const PUBLISHED_SUBDOMAINS = 'published_subdomains';
function getPublishedSubdomainsRef() {
  return db.collection(PUBLISHED_SUBDOMAINS);
}

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

/** Write public lookup and ensure client domains path is up to date. */
async function setSubdomainLookup(subdomain, { userId, projectId, domainId, status, projectTitle }) {
  const normalized = (subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!normalized) return;

  // 1. Write to published_subdomains (fallback / fast lookup)
  await getPublishedSubdomainsRef().doc(normalized).set({
    user_id: userId,
    project_id: projectId,
    domain_id: domainId,
    status: status || 'published',
    project_title: projectTitle || null,
    updated_at: new Date(),
  }, { merge: true });

  // 2. Ensure user/roles/client/{userId}/domains has this entry too
  if (userId) {
    try {
      const existing = await findByProjectId(userId, projectId);
      if (existing) {
        await updateForClient(userId, existing.id, {
          subdomain: normalized,
          projectId,
          projectTitle: projectTitle || null,
          status: status || 'published',
        });
      } else {
        await createForClient(userId, {
          projectId,
          projectTitle: projectTitle || null,
          subdomain: normalized,
          status: status || 'published',
        });
      }
    } catch (e) {
      console.warn('setSubdomainLookup: failed to sync client domains path:', e.message);
    }
  }
}

/**
 * Resolve published site by subdomain.
 * Primary: collection group query on "domains" subcollections under user/roles/client/{userId}/domains.
 * Fallback: published_subdomains/{subdomain} for backward compat.
 * Returns { id, projectId, userId, subdomain, projectTitle, status } or null.
 */
async function findBySubdomain(subdomain) {
  const normalized = (subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!normalized) return null;

  // Primary: collection group query on client domains
  try {
    const groupSnap = await db.collectionGroup('domains')
      .where('subdomain', '==', normalized)
      .where('status', '==', 'published')
      .limit(1)
      .get();
    if (!groupSnap.empty) {
      const doc = groupSnap.docs[0];
      const data = docToObject(doc);
      // Extract userId from path: user/roles/client/{userId}/domains/{domainId}
      const pathParts = doc.ref.path.split('/');
      const clientIdx = pathParts.indexOf('client');
      const userId = clientIdx >= 0 && clientIdx + 1 < pathParts.length ? pathParts[clientIdx + 1] : data.userId;
      return {
        id: data.id || doc.id,
        projectId: data.projectId,
        userId: userId,
        subdomain: normalized,
        projectTitle: data.projectTitle,
        status: data.status,
      };
    }
  } catch (e) {
    console.warn('findBySubdomain collectionGroup query failed, falling back:', e.message);
  }

  // Fallback: published_subdomains
  const snap = await getPublishedSubdomainsRef().doc(normalized).get();
  if (!snap.exists) return null;
  const data = docToObject(snap);
  if ((data.status || 'published') !== 'published') return null;
  return {
    id: data.domainId,
    projectId: data.projectId,
    userId: data.userId,
    subdomain: normalized,
    projectTitle: data.projectTitle,
    status: data.status,
  };
}

/** List domains for a client at user/roles/client/{userId}/domains (for sync/publish). */
async function listByClient(userId) {
  const ref = getDomainsRef(userId).orderBy('updated_at', 'desc');
  const snap = await ref.get();
  return snap.docs.map(d => docToObject(d));
}

/** Get one domain by userId and domainId (path: user/roles/client/{userId}/domains/{domainId}). */
async function get(userId, domainId) {
  const snap = await getDomainsRef(userId).doc(domainId).get();
  return docToObject(snap);
}

/** Create a domain doc at user/roles/client/{userId}/domains (published site). */
async function createForClient(userId, data) {
  const ref = getDomainsRef(userId);
  const subdomain = (data.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || null;
  const doc = {
    project_id: data.projectId || null,
    project_title: data.projectTitle || null,
    subdomain: subdomain || null,
    domain: data.domain || null,
    status: data.status || 'published',
    created_at: new Date(),
    updated_at: new Date(),
  };
  const newRef = await ref.add(doc);
  const snap = await newRef.get();
  return docToObject(snap);
}

/** Find domain by project_id in user/roles/client/{userId}/domains. */
async function findByProjectId(userId, projectId) {
  const snap = await getDomainsRef(userId).where('project_id', '==', projectId).limit(1).get();
  if (snap.empty) return null;
  return docToObject(snap.docs[0]);
}

/** Update domain at user/roles/client/{userId}/domains/{domainId}. */
async function updateForClient(userId, domainId, data) {
  const ref = getDomainsRef(userId).doc(domainId);
  const updates = {};
  if (data.projectId !== undefined) updates.project_id = data.projectId;
  if (data.projectTitle !== undefined) updates.project_title = data.projectTitle;
  if (data.subdomain !== undefined) updates.subdomain = (data.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || null;
  if (data.status !== undefined) updates.status = data.status;
  if (Object.keys(updates).length === 0) return get(userId, domainId);
  updates.updated_at = new Date();
  await ref.update(updates);
  const snap = await ref.get();
  return docToObject(snap);
}

module.exports = {
  create,
  findById,
  findByUserId,
  findAll,
  update,
  delete: deleteById,
  setSubdomainLookup,
  findBySubdomain,
  listByClient,
  get,
  getDomainsRef,
  createForClient,
  findByProjectId,
  updateForClient,
};
