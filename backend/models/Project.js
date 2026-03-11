const { db, getRealtimeDb } = require('../config/firebase');
const { docToObject, deleteRecursive } = require('../utils/firestoreHelper');
const Domain = require('./Domain');
const { getTrashRetentionMs } = require('../utils/trashConfig');

function getProjectsRef(userId) {
  return db.collection('user').doc('roles').collection('client').doc(userId).collection('projects');
}

/** Reference to the trash collection for a specific user */
function getTrashRef(userId) {
  return db.collection('user').doc('roles').collection('client').doc(userId).collection('trash');
}

function sanitizeProject(project) {
  if (!project || typeof project !== 'object') return project;
  if (Object.prototype.hasOwnProperty.call(project, 'instanceId')) {
    delete project.instanceId;
  }
  return project;
}

async function create(userId, data) {
  const ref = getProjectsRef(userId);
  const subdomain = (data.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || null;
  const industry = (data.industry || '').toString().trim() || null;
  const doc = {
    title: data.title || 'Untitled Project',
    status: 'draft',
    industry,
    template_id: data.templateId || null,
    subdomain: subdomain || null,
    thumbnail: data.thumbnail || null,
    created_at: new Date(),
    updated_at: new Date(),
  };
  const newRef = await ref.add(doc);
  const snap = await newRef.get();
  return sanitizeProject(docToObject(snap));
}

async function list(userId) {
  const ref = getProjectsRef(userId);
  const snap = await ref.get();
  const items = snap.docs.map(d => sanitizeProject(docToObject(d))).filter(x => x);
  // Sort in JS instead of Firestore to avoid filtering out docs missing 'updated_at'
  return items.sort((a, b) => {
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tB - tA;
  });
}

async function get(userId, projectId) {
  const snap = await getProjectsRef(userId).doc(projectId).get();
  return sanitizeProject(docToObject(snap));
}

async function update(userId, projectId, data) {
  const ref = getProjectsRef(userId).doc(projectId);
  const updates = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.status !== undefined) updates.status = data.status;
  if (data.industry !== undefined) updates.industry = (data.industry || '').toString().trim() || null;
  if (data.subdomain !== undefined) updates.subdomain = (data.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || null;
  if (data.thumbnail !== undefined) updates.thumbnail = data.thumbnail || null;
  if (Object.keys(updates).length === 0) return get(userId, projectId);
  updates.updated_at = new Date();
  await ref.update(updates);
  const snap = await ref.get();
  return sanitizeProject(docToObject(snap));
}

/** Move project to trash instead of deleting it permanently */
async function moveToTrash(userId, projectId) {
  const projectRef = getProjectsRef(userId).doc(projectId);
  const trashRef = getTrashRef(userId).doc(projectId);

  const snap = await projectRef.get();
  if (!snap.exists) throw new Error('Project not found');

  const data = snap.data();

  // Published/live sites must be taken down first before moving project to trash
  const normalizedStatus = String(data.status || '').trim().toLowerCase();
  if (normalizedStatus === 'published' || normalizedStatus === 'live') {
    throw new Error('Published projects cannot be deleted. Please take down (unpublish) the website first.');
  }

  // Mark with deletion timestamp and store in trash
  await trashRef.set({
    ...data,
    deleted_at: new Date(),
    original_id: projectId
  });

  // Remove from active projects
  await projectRef.delete();

  // Cleanup Realtime DB
  const rtdb = getRealtimeDb();
  if (rtdb) {
    try {
      await rtdb.ref(`user/roles/client/${userId}/projects/${projectId}`).remove();
    } catch (e) {
      console.warn('moveToTrash: RTDB cleanup failed:', e.message);
    }
  }

  // Move domain to trash (preserves for restore) instead of hard-delete
  await Domain.moveToTrashByProjectId(userId, projectId);

  return sanitizeProject({ id: projectId, ...data });
}

/** List projects currently in the trash for a user (only those <= 30 days old) */
async function listTrash(userId) {
  const ref = getTrashRef(userId);
  const snap = await ref.get();

  const now = new Date();
  const retentionMs = getTrashRetentionMs();

  const items = snap.docs.map(d => sanitizeProject(docToObject(d))).filter(x => {
    if (!x || !x.deletedAt) return false;
    const deletedDate = new Date(x.deletedAt);
    const ageMs = now.getTime() - deletedDate.getTime();

    // Auto-purge older than retention threshold if found during listing
    if (ageMs > retentionMs) {
      // Trigger background purge (don't await to keep response fast)
      permanentDelete(userId, x.id).catch(err => console.error('Auto-purge failed:', err));
      return false;
    }

    // Calculate fractional days left
    const msLeft = retentionMs - ageMs;
    x.daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    return true;
  });

  return items.sort((a, b) => {
    const tA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
    const tB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
    return tB - tA;
  });
}

/** Restore a project from the trash back to the active list */
async function restore(userId, projectId) {
  const trashRef = getTrashRef(userId).doc(projectId);
  const projectRef = getProjectsRef(userId).doc(projectId);

  const snap = await trashRef.get();
  if (!snap.exists) throw new Error('Project not found in trash');

  const data = snap.data();
  // Remove trash-specific fields
  delete data.deleted_at;
  delete data.original_id;

  // Restored projects should always come back as draft/offline.
  data.status = 'draft';

  // Restore to active projects
  await projectRef.set(data);
  // Remove from trash
  await trashRef.delete();

  // Restore domain from domain_trash if any (domain stays draft)
  await Domain.restoreFromTrashByProjectId(userId, projectId);

  // Sync RTDB so frontend subscribeUserProjectSubdomains stays in sync
  const rtdb = getRealtimeDb();
  if (rtdb) {
    try {
      await rtdb.ref(`user/roles/client/${userId}/projects/${projectId}`).set({
        subdomain: data.subdomain ?? null,
        status: 'draft',
      });
    } catch (e) {
      console.warn('restore: RTDB sync failed:', e.message);
    }
  }

  return sanitizeProject({ id: projectId, ...data });
}

/** Public delete function now moves to trash by default */
async function deleteProject(userId, projectId) {
  return moveToTrash(userId, projectId);
}

/** Permanently purge a project from both active and trash collections */
async function permanentDelete(userId, projectId) {
  const docRef = getProjectsRef(userId).doc(projectId);
  const trashRef = getTrashRef(userId).doc(projectId);

  // 1. Delete domain records
  await Domain.deleteByProjectId(userId, projectId);

  // 2. Recursively delete all documents and sub-collections
  await deleteRecursive(docRef);
  await deleteRecursive(trashRef);

  // 3. RTDB cleanup
  const rtdb = getRealtimeDb();
  if (rtdb) {
    try {
      await rtdb.ref(`user/roles/client/${userId}/projects/${projectId}`).remove();
    } catch (e) {
      console.warn('permanentDelete: RTDB cleanup failed:', e.message);
    }
  }
}

async function getBySubdomain(userId, subdomain) {
  const normalized = (subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || null;
  if (!normalized) return null;

  // 1) Try Firestore first (subdomain stored when creating/updating project via API)
  const ref = getProjectsRef(userId).where('subdomain', '==', normalized);
  const snap = await ref.limit(1).get();
  if (!snap.empty) return sanitizeProject(docToObject(snap.docs[0]));

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
          return sanitizeProject(project);
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
  const projects = await list(userId);
  return projects.filter((p) => p.subdomain != null && String(p.subdomain).trim() !== '').length;
}

async function listShared(userId, userEmail) {
  const normalizedEmail = (userEmail || '').toLowerCase();
  const roles = ['client', 'admin', 'support'];
  const sharedProjects = [];

  for (const role of roles) {
    const roleCollSnap = await db.collection('user').doc('roles').collection(role).get();

    for (const ownerDoc of roleCollSnap.docs) {
      const ownerId = ownerDoc.id;
      if (ownerId === userId) continue;

      const projectsSnap = await ownerDoc.ref.collection('projects').get();
      for (const projectDoc of projectsSnap.docs) {
        const collabSnap = await projectDoc.ref.collection('collaborators').get();
        for (const collabDoc of collabSnap.docs) {
          const data = collabDoc.data();
          const matchEmail = (data.email || '').toLowerCase() === normalizedEmail;
          const matchId = data.userId === userId;

          if (matchEmail || matchId) {
            const ownerData = ownerDoc.data();
            sharedProjects.push({
              ...sanitizeProject(docToObject(projectDoc)),
              ownerId,
              ownerName: ownerData.full_name || ownerData.displayName || ownerData.username || 'Unknown',
              collaboratorPermission: data.permission,
              isShared: true,
            });
          }
        }
      }
    }
  }
  return sharedProjects;
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
  moveToTrash,
  listTrash,
  listShared,
  restore,
  permanentDelete,
  getTrashRef, // Exported for controller usage
  countAll,
  countWithSubdomain,
};
