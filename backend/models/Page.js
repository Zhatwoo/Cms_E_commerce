const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

const COLLECTION = 'pages';

async function create(data) {
  const doc = {
    title: data.title || '',
    slug: data.slug || '',
    content: data.content ?? '',
    status: data.status || 'Draft',
    created_by: data.createdBy || null,
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

async function findBySlug(slug) {
  const snap = await db.collection(COLLECTION).where('slug', '==', slug).limit(1).get();
  if (snap.empty) return null;
  return docToObject(snap.docs[0]);
}

async function findAll(filters = {}, pagination = {}) {
  const limit = Math.max(1, parseInt(pagination.limit) || 20);
  const page = Math.max(1, parseInt(pagination.page) || 1);

  let ref = db.collection(COLLECTION).orderBy('created_at', 'desc');
  if (filters.status) ref = ref.where('status', '==', filters.status);

  const snap = await ref.get();
  let items = snap.docs.map(d => docToObject(d));
  if (filters.search) {
    const s = String(filters.search).toLowerCase();
    items = items.filter(p => (p.title && p.title.toLowerCase().includes(s)) || (p.slug && p.slug.toLowerCase().includes(s)));
  }
  const total = items.length;
  const start = (page - 1) * limit;
  items = items.slice(start, start + limit);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

async function update(id, data) {
  const updates = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.content !== undefined) updates.content = data.content;
  if (data.status !== undefined) updates.status = data.status;
  if (data.createdBy !== undefined) updates.created_by = data.createdBy;
  if (Object.keys(updates).length === 0) return findById(id);
  updates.updated_at = new Date();
  await db.collection(COLLECTION).doc(id).update(updates);
  return findById(id);
}

async function deleteById(id) {
  await db.collection(COLLECTION).doc(id).delete();
}

async function count(filters = {}) {
  const { total } = await findAll(filters, { limit: 1, page: 1 });
  return total;
}

// Helper to get user's projects collection
function getUserProjectsRef(userId) {
  return db.collection('user').doc('roles').collection('client').doc(userId).collection('projects');
}

async function getDraftByUserId(userId) {
  const draftSlug = `__autosave_draft_${userId}__`;
  // Check user-specific collection first
  const snapshot = await getUserProjectsRef(userId).where('slug', '==', draftSlug).limit(1).get();

  if (!snapshot.empty) {
    return docToObject(snapshot.docs[0]);
  }

  // Fallback to global collection (legacy support)
  return findBySlug(draftSlug);
}

// Save draft to user-specific collection
async function saveDraft(userId, data) {
  const draftSlug = `__autosave_draft_${userId}__`;
  const projectsRef = getUserProjectsRef(userId);

  // Check if draft exists
  const snapshot = await projectsRef.where('slug', '==', draftSlug).limit(1).get();

  let docData = {
    title: 'Auto-save Draft',
    slug: draftSlug,
    content: data.content ?? '',
    status: 'Draft',
    updated_at: new Date()
  };

  if (snapshot.empty) {
    // Create new
    docData.created_by = userId;
    docData.created_at = new Date();
    const ref = await projectsRef.add(docData);
    const newSnap = await ref.get();
    return docToObject(newSnap);
  } else {
    // Update existing
    const docId = snapshot.docs[0].id;
    await projectsRef.doc(docId).update(docData);
    const updatedSnap = await projectsRef.doc(docId).get();
    return docToObject(updatedSnap);
  }
}

module.exports = {
  create,
  findById,
  findBySlug,
  findAll,
  update,
  delete: deleteById,
  count,
  getDraftByUserId,
  saveDraft,
  savePageData,
  getPageData,
  deletePageData,
  getAllPageData
};

// --- New Path Logic for User/Project/Page ---

// Helper to get specific page reference
function getProjectPageRef(userId, projectId, pageId) {
  // Path: /user/roles/client/{userId}/projects/{projectId}/pages/{pageId}
  return db.collection('user').doc('roles').collection('client').doc(userId)
    .collection('projects').doc(projectId)
    .collection('pages').doc(pageId);
}

async function savePageData(userId, projectId, pageId, content) {
  const ref = getProjectPageRef(userId, projectId, pageId);
  let dataToSave;
  // Ensure content is stringified to avoid Firestore Map depth limits (20 levels).
  // Craft.js data is often deeper than 20 levels.
  if (typeof content !== 'string') {
    dataToSave = JSON.stringify(content);
  } else {
    dataToSave = content;
  }

  const docData = {
    page: dataToSave, 
    updated_at: new Date()
  };

  // Remove { merge: true } to ensure the 'page' Map is completely replaced
  // rather than merged, which allows deletions to be reflected in Firestore.
  await ref.set(docData);

  const snap = await ref.get();
  return docToObject(snap);
}

async function getPageData(userId, projectId, pageId) {
  const ref = getProjectPageRef(userId, projectId, pageId);
  const snap = await ref.get();

  if (!snap.exists) return null;

  const data = docToObject(snap);

  // Normalize for frontend: handle both 'page' and 'content' keys
  const content = data.page || data.content;
  return {
    ...data,
    content: content // Frontend expects 'content' in result for Craft.js
  };
}

async function deletePageData(userId, projectId, pageId) {
  const ref = getProjectPageRef(userId, projectId, pageId);
  await ref.delete();
}

// Get all pages for a project
async function getAllPageData(userId, projectId) {
  const pagesRef = db.collection('user').doc('roles').collection('client').doc(userId)
    .collection('projects').doc(projectId)
    .collection('pages');
  
  const snap = await pagesRef.get();
  
  if (snap.empty) return [];
  
  const pages = snap.docs.map(doc => {
    const data = docToObject(doc);
    const content = data.page || data.content;
    return {
      id: doc.id,
      ...data,
      content: content
    };
  });
  
  return pages;
}
