const { db, admin } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');
const FieldValue = admin.firestore.FieldValue;

const COLLECTION = 'domains';

/** Path: user/roles/client/{userId}/domains */
function getDomainsRef(userId) {
  return db.collection('user').doc('roles').collection('client').doc(userId).collection('domains');
}

/** Path: user/roles/client/{userId}/domain_trash (domain docs moved here when project is trashed) */
function getDomainTrashRef(userId) {
  return db.collection('user').doc('roles').collection('client').doc(userId).collection('domain_trash');
}

/** Root collection for public lookup: subdomain (doc id) -> { userId, projectId, domainId, status }. */
const PUBLISHED_SUBDOMAINS = 'published_subdomains';
function getPublishedSubdomainsRef() {
  return db.collection(PUBLISHED_SUBDOMAINS);
}

function normalizeOwnerSnapshot(ownerProfile) {
  if (!ownerProfile || typeof ownerProfile !== 'object') return {};

  const ownerId = ownerProfile.id || ownerProfile.userId || ownerProfile.uid || null;
  const ownerEmail = ownerProfile.email || null;
  const ownerName =
    ownerProfile.displayName ||
    ownerProfile.fullName ||
    ownerProfile.name ||
    ownerProfile.email ||
    null;

  return {
    owner_user_id: ownerId || null,
    owner_email: ownerEmail || null,
    owner_name: ownerName || null,
    owner_avatar: ownerProfile.avatar || null,
    owner_username: ownerProfile.username || null,
    owner_subscription_plan: ownerProfile.subscriptionPlan || null,
  };
}

/** List all published sites from Firestore collection published_subdomains. */
async function listAllFromPublishedSubdomains() {
  const snap = await getPublishedSubdomainsRef().get();
  return snap.docs.map((d) => docToObject(d));
}

/** Resolve published site directly from published_subdomains/{subdomain} without collectionGroup indexes. */
async function findByPublishedSubdomain(subdomain) {
  const normalized = (subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!normalized) return null;

  const snap = await getPublishedSubdomainsRef().doc(normalized).get();
  if (!snap.exists) return null;
  const data = docToObject(snap);
  if ((data.status || 'published') !== 'published') return null;

  // publishedContent may be stored as a Firestore map (object) or a JSON string.
  // Normalize to a plain JS value so the controller can handle it uniformly.
  let publishedContent = data.publishedContent ?? data.published_content ?? null;
  if (publishedContent && typeof publishedContent === 'object') {
    // Re-serialize and parse to strip any Firestore-specific types (Timestamps, etc.)
    try { publishedContent = JSON.parse(JSON.stringify(publishedContent)); } catch { publishedContent = null; }
  }

  return {
    // Keep ID consistent with admin management list fallback logic.
    id: data.domainId || data.domain_id || data.id || normalized,
    projectId: data.projectId,
    userId: data.userId,
    subdomain: normalized,
    projectTitle: data.projectTitle,
    status: data.status,
    publishedContent,
    owner: data.ownerUserId || data.ownerName || data.ownerEmail ? {
      userId: data.ownerUserId || null,
      email: data.ownerEmail || null,
      name: data.ownerName || null,
      avatar: data.ownerAvatar || null,
      username: data.ownerUsername || null,
      subscriptionPlan: data.ownerSubscriptionPlan || null,
    } : null,
  };
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

/** Delete domain record and public subdomain lookup for a project. Also purges domain_trash for permanent delete. */
async function deleteByProjectId(userId, projectId) {
  const domain = await findByProjectId(userId, projectId);
  if (domain) {
    const batch = db.batch();

    // 1. Delete client domain doc: user/roles/client/{userId}/domains/{domainId}
    const domainRef = getDomainsRef(userId).doc(domain.id);
    batch.delete(domainRef);

    // 2. Delete public subdomain lookup: published_subdomains/{subdomain}
    if (domain.subdomain) {
      const publishedRef = getPublishedSubdomainsRef().doc(domain.subdomain);
      batch.delete(publishedRef);
    }

    await batch.commit();
  }
  // Also purge domain_trash for this project (permanent delete / cleanup)
  await deleteTrashByProjectId(userId, projectId);
}

/**
 * Move domain to trash instead of hard-deleting. Used when project is trashed.
 * Preserves domain record for restore. Removes from published_subdomains so site is offline.
 */
async function moveToTrashByProjectId(userId, projectId) {
  const domain = await findByProjectId(userId, projectId);
  if (!domain) return;

  const domainId = domain.id;
  const subdomain = (domain.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const batch = db.batch();

  // 1. Copy to domain_trash with deleted_at, project_id, original_id
  const trashRef = getDomainTrashRef(userId).doc(domainId);
  const rawData = (await getDomainsRef(userId).doc(domainId).get()).data();
  batch.set(trashRef, {
    ...rawData,
    deleted_at: new Date(),
    project_id: projectId,
    original_id: domainId,
  });

  // 2. Delete from active domains
  batch.delete(getDomainsRef(userId).doc(domainId));

  // 3. Delete from published_subdomains (site goes offline)
  if (subdomain) {
    batch.delete(getPublishedSubdomainsRef().doc(subdomain));
  }

  await batch.commit();
}

/**
 * Restore domain from trash when project is restored.
 * Moves domain back to domains collection (stays draft, not re-added to published_subdomains).
 */
async function restoreFromTrashByProjectId(userId, projectId) {
  const trashRef = getDomainTrashRef(userId);
  const snap = await trashRef.where('project_id', '==', projectId).limit(1).get();
  if (snap.empty) return;

  const doc = snap.docs[0];
  const data = doc.data();
  const domainId = data.original_id || doc.id;

  // Remove trash-specific fields (keep project_id - it links domain to project)
  delete data.deleted_at;
  delete data.original_id;

  // Restored projects must come back offline; user should explicitly publish again.
  data.status = 'draft';

  const domainsRef = getDomainsRef(userId).doc(domainId);
  const subdomain = (data.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

  const batch = db.batch();
  batch.set(domainsRef, data);
  // Safety: remove stale public lookup if any exists.
  if (subdomain) {
    batch.delete(getPublishedSubdomainsRef().doc(subdomain));
  }
  batch.delete(doc.ref);
  await batch.commit();
}

/** Delete domain_trash entries for a project (for permanentDelete / cleanup). */
async function deleteTrashByProjectId(userId, projectId) {
  const trashRef = getDomainTrashRef(userId);
  const snap = await trashRef.where('project_id', '==', projectId).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  if (!snap.empty) await batch.commit();
}

/**
 * Publish for a client: write to BOTH paths in one batch so both always stay in sync for any client UID.
 * Saves a snapshot of content so the public site shows only what was published, not the live draft.
 * - user/roles/client/{userId}/domains/{domainId}
 * - published_subdomains/{subdomain}
 */
async function publishForClientBatch(userId, { projectId, projectTitle, subdomain, publishedContent, ownerProfile }) {
  const normalized = (subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!normalized) throw new Error('subdomain is required');
  if (!userId || !projectId) throw new Error('userId and projectId are required');

  const clientRef = getDomainsRef(userId);
  const publishedRef = getPublishedSubdomainsRef();
  const now = new Date();

  const existing = await findByProjectId(userId, projectId);
  const batch = db.batch();

  let domainId;
  const clientDoc = {
    project_id: projectId,
    project_title: projectTitle || null,
    subdomain: normalized,
    domain: null,
    status: 'published',
    updated_at: now,
    published_content: publishedContent ?? null,
  };

  if (existing) {
    domainId = existing.id;
    const ref = clientRef.doc(domainId);
    const prevHistory = Array.isArray(existing.publishHistory) ? existing.publishHistory : (Array.isArray(existing.publish_history) ? existing.publish_history : []);
    const publish_history = prevHistory
      .concat({ at: now.toISOString(), type: 'published' })
      .slice(-50);
    batch.update(ref, {
      project_title: clientDoc.project_title,
      subdomain: clientDoc.subdomain,
      status: clientDoc.status,
      updated_at: clientDoc.updated_at,
      published_content: clientDoc.published_content,
      publish_history,
    });
  } else {
    clientDoc.created_at = now;
    clientDoc.publish_history = [{ at: now.toISOString(), type: 'published' }];
    const newRef = clientRef.doc(); // auto-generated id
    domainId = newRef.id;
    batch.set(newRef, clientDoc);
  }

  // When subdomain changes, delete old lookup to avoid stale/conflicting entries
  if (existing && existing.subdomain && String(existing.subdomain).trim().toLowerCase() !== normalized) {
    batch.delete(publishedRef.doc(String(existing.subdomain).trim().toLowerCase().replace(/[^a-z0-9-]/g, '')));
  }

  const publishedDoc = {
    user_id: userId,
    project_id: projectId,
    domain_id: domainId,
    status: 'published',
    project_title: projectTitle || null,
    updated_at: now,
    published_content: publishedContent ?? null,
    ...normalizeOwnerSnapshot(ownerProfile),
  };
  batch.set(publishedRef.doc(normalized), publishedDoc, { merge: true });

  await batch.commit();

  return {
    id: domainId,
    subdomain: normalized,
    projectId,
    projectTitle: projectTitle || null,
    status: 'published',
  };
}

/** Write public lookup and ensure client domains path is up to date. */
async function setSubdomainLookup(subdomain, { userId, projectId, domainId, status, projectTitle, ownerProfile }) {
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
    ...normalizeOwnerSnapshot(ownerProfile),
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

  // Fast path: published lookup (no composite index required)
  const published = await findByPublishedSubdomain(normalized);
  if (published) return published;

  // Fallback: collection group query on client domains
  try {
    // Avoid composite-index requirement by querying only on subdomain then filtering in memory.
    // (subdomain == X AND status == published) would otherwise require a composite index.
    const groupSnap = await db.collectionGroup('domains')
      .where('subdomain', '==', normalized)
      .limit(10)
      .get();

    if (!groupSnap.empty) {
      const publishedDoc = groupSnap.docs.find((doc) => {
        try {
          const status = String(doc.get('status') || '').toLowerCase();
          return status === 'published';
        } catch {
          return false;
        }
      });

      if (publishedDoc) {
        const data = docToObject(publishedDoc);
        // Extract userId from path: user/roles/client/{userId}/domains/{domainId}
        const pathParts = publishedDoc.ref.path.split('/');
        const clientIdx = pathParts.indexOf('client');
        const userId = clientIdx >= 0 && clientIdx + 1 < pathParts.length ? pathParts[clientIdx + 1] : data.userId;
        let publishedContent = data.publishedContent ?? data.published_content ?? null;
        if (publishedContent && typeof publishedContent === 'object') {
          try { publishedContent = JSON.parse(JSON.stringify(publishedContent)); } catch { publishedContent = null; }
        }
        return {
          id: data.id || publishedDoc.id,
          projectId: data.projectId,
          userId: userId,
          subdomain: normalized,
          projectTitle: data.projectTitle,
          status: data.status,
          publishedContent,
          owner: data.ownerUserId || data.ownerName || data.ownerEmail ? {
            userId: data.ownerUserId || null,
            email: data.ownerEmail || null,
            name: data.ownerName || null,
            avatar: data.ownerAvatar || null,
            username: data.ownerUsername || null,
            subscriptionPlan: data.ownerSubscriptionPlan || null,
          } : null,
        };
      }
    }
  } catch (e) {
    console.warn('findBySubdomain collectionGroup query failed, falling back:', e.message);
  }

  return null;
}

/** Resolve published site by custom domain using collectionGroup query for efficiency. */
async function findByCustomDomain(domain) {
  const normalized = (domain || '').toString().trim().toLowerCase();
  if (!normalized) return null;

  try {
    const groupSnap = await db.collectionGroup('domains')
      .where('domain', '==', normalized)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (!groupSnap.empty) {
      const doc = groupSnap.docs[0];
      const data = docToObject(doc);
      // Extract userId from the document path
      const pathParts = doc.ref.path.split('/');
      const clientIdx = pathParts.indexOf('client');
      const userId = clientIdx >= 0 && clientIdx + 1 < pathParts.length ? pathParts[clientIdx + 1] : data.userId;
      let publishedContent = data.publishedContent ?? data.published_content ?? null;
      if (publishedContent && typeof publishedContent === 'object') {
        try { publishedContent = JSON.parse(JSON.stringify(publishedContent)); } catch { publishedContent = null; }
      }
      return {
        id: data.id || doc.id,
        projectId: data.projectId,
        userId: userId,
        subdomain: data.subdomain,
        projectTitle: data.projectTitle,
        status: data.status,
        publishedContent,
        owner: data.ownerUserId || data.ownerName || data.ownerEmail ? {
          userId: data.ownerUserId || null,
          email: data.ownerEmail || null,
          name: data.ownerName || null,
          avatar: data.ownerAvatar || null,
          username: data.ownerUsername || null,
          subscriptionPlan: data.ownerSubscriptionPlan || null,
        } : null,
      };
    }
  } catch (e) {
    console.warn('findByCustomDomain failed:', e.message);
  }
  return null;
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

/** Find domain by project_id in user/roles/client/{userId}/domains. */
async function findByProjectId(userId, projectId) {
  const snap = await getDomainsRef(userId).where('project_id', '==', projectId).limit(1).get();
  if (snap.empty) return null;
  return docToObject(snap.docs[0]);
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
  if (data.domain !== undefined) updates.domain = data.domain;
  if (data.domainStatus !== undefined) updates.domain_status = data.domainStatus;
  if (data.verifiedAt !== undefined) updates.verified_at = data.verifiedAt;
  if (data.publishedContent !== undefined) updates.published_content = data.publishedContent;
  if (data.scheduledPublishAt !== undefined) updates.scheduled_publish_at = data.scheduledPublishAt;
  if (data.scheduledPublishedContent !== undefined) updates.scheduled_published_content = data.scheduledPublishedContent;
  if (Object.keys(updates).length === 0) return get(userId, domainId);
  updates.updated_at = new Date();
  await ref.update(updates);
  const snap = await ref.get();
  return docToObject(snap);
}

async function deleteForClient(userId, domainId) {
  const existing = await get(userId, domainId);
  if (!existing) return false;
  const subdomain = (existing.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

  const batch = db.batch();
  batch.delete(getDomainsRef(userId).doc(domainId));
  if (subdomain) {
    batch.delete(getPublishedSubdomainsRef().doc(subdomain));
  }
  await batch.commit();
  return true;
}

/**
 * Schedule a publish at a future date. Saves current draft snapshot; at that date it will go live.
 * Domain must already exist (site published at least once).
 */
async function schedulePublish(userId, { projectId, projectTitle, subdomain, scheduledAt, scheduledContent }) {
  const normalized = (subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!normalized) throw new Error('subdomain is required');
  if (!userId || !projectId) throw new Error('userId and projectId are required');
  const at = scheduledAt ? new Date(scheduledAt) : null;
  if (!at || isNaN(at.getTime())) throw new Error('valid scheduledAt date is required');

  const existing = await findByProjectId(userId, projectId);
  if (!existing) throw new Error('Publish the site at least once before scheduling. Use Publish now first.');

  const domainId = existing.id;
  const clientRef = getDomainsRef(userId).doc(domainId);
  const publishedRef = getPublishedSubdomainsRef().doc(normalized);

  const batch = db.batch();
  const now = new Date();
  batch.update(clientRef, {
    scheduled_publish_at: at,
    scheduled_published_content: scheduledContent ?? null,
    updated_at: now,
  });
  batch.set(publishedRef, {
    user_id: userId,
    project_id: projectId,
    domain_id: domainId,
    status: 'published',
    project_title: projectTitle || null,
    updated_at: now,
    scheduled_publish_at: at,
    scheduled_published_content: scheduledContent ?? null,
  }, { merge: true });

  await batch.commit();
  return { subdomain: normalized, scheduledAt: at.toISOString() };
}

/** Get scheduled publish for a project (if any). */
async function getScheduleByProject(userId, projectId) {
  const existing = await findByProjectId(userId, projectId);
  if (!existing) return null;
  const at = existing.scheduled_publish_at ?? existing.scheduledPublishAt;
  if (!at) return null;
  const date = at && typeof at.toDate === 'function' ? at.toDate() : new Date(at);
  if (isNaN(date.getTime())) return null;
  return { scheduledAt: date.toISOString(), subdomain: existing.subdomain || null };
}

/**
 * Unpublish a project: set status to draft in both user/roles/client/{userId}/domains and published_subdomains.
 * Site will no longer be served at the subdomain until published again.
 */
async function unpublishForClient(userId, projectId) {
  const existing = await findByProjectId(userId, projectId);
  if (!existing) return null;
  const status = (existing.status || 'published').toString().toLowerCase();
  if (status === 'draft') return existing;

  const subdomain = (existing.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!subdomain) return null;

  const domainId = existing.id;
  const clientRef = getDomainsRef(userId).doc(domainId);
  const publishedRef = getPublishedSubdomainsRef().doc(subdomain);
  const now = new Date();

  const prevHistory = Array.isArray(existing.publishHistory) ? existing.publishHistory : (Array.isArray(existing.publish_history) ? existing.publish_history : []);
  const publish_history = prevHistory
    .concat({ at: now.toISOString(), type: 'unpublished' })
    .slice(-50);

  const batch = db.batch();
  batch.update(clientRef, {
    status: 'draft',
    updated_at: now,
    publish_history,
  });
  batch.set(publishedRef, {
    status: 'draft',
    updated_at: now,
  }, { merge: true });

  await batch.commit();
  return { id: domainId, subdomain, projectId, status: 'draft' };
}

/**
 * Update subdomain for an existing published project.
 * Deletes old published_subdomains lookup and creates new one.
 */
async function updateSubdomainForClient(userId, projectId, newSubdomain, ownerProfile) {
  const normalized = (newSubdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!normalized) throw new Error('subdomain is required');
  if (!userId || !projectId) throw new Error('userId and projectId are required');

  const existing = await findByProjectId(userId, projectId);
  if (!existing) return null;
  const oldSubdomain = (existing.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (oldSubdomain === normalized) return { id: existing.id, subdomain: normalized, projectId };

  const domainId = existing.id;
  const clientRef = getDomainsRef(userId).doc(domainId);
  const publishedRef = getPublishedSubdomainsRef();
  const now = new Date();

  const prevHistory = Array.isArray(existing.publishHistory) ? existing.publishHistory : (Array.isArray(existing.publish_history) ? existing.publish_history : []);
  const publish_history = prevHistory
    .concat({ at: now.toISOString(), type: 'subdomain_changed' })
    .slice(-50);

  const batch = db.batch();
  if (oldSubdomain) batch.delete(publishedRef.doc(oldSubdomain));
  batch.update(clientRef, {
    subdomain: normalized,
    updated_at: now,
    publish_history,
  });
  batch.set(publishedRef.doc(normalized), {
    user_id: userId,
    project_id: projectId,
    domain_id: domainId,
    status: existing.status || 'published',
    project_title: existing.projectTitle ?? existing.project_title ?? null,
    updated_at: now,
    published_content: existing.publishedContent ?? existing.published_content ?? null,
    ...normalizeOwnerSnapshot(ownerProfile),
  }, { merge: true });

  await batch.commit();
  return { id: domainId, subdomain: normalized, projectId };
}

/** Get publish history for a project (stack of { at, type }), newest first. Backfills from updatedAt/createdAt if no history. Returns at most 10 most recent. */
async function getPublishHistoryByProject(userId, projectId) {
  const existing = await findByProjectId(userId, projectId);
  if (!existing) return [];
  const raw = existing.publishHistory ?? existing.publish_history;
  let list = Array.isArray(raw) ? raw : [];

  const toIso = (v) => {
    if (!v) return '';
    if (typeof v.toDate === 'function') return v.toDate().toISOString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object' && v.seconds != null) return new Date(v.seconds * 1000).toISOString();
    return String(v);
  };

  list = list
    .map((entry) => {
      let at = toIso(entry?.at);
      return at ? { at, type: entry?.type || 'published' } : null;
    })
    .filter(Boolean);

  const updatedAt = existing.updatedAt ?? existing.updated_at;
  const createdAt = existing.createdAt ?? existing.created_at;
  if (list.length === 0 && (updatedAt || createdAt)) {
    const entries = [];
    if (createdAt) entries.push({ at: toIso(createdAt), type: 'published' });
    if (updatedAt) entries.push({ at: toIso(updatedAt), type: 'published' });
    list = entries
      .filter((e) => e.at)
      .sort((a, b) => (b.at < a.at ? -1 : b.at > a.at ? 1 : 0));
    const seen = new Set();
    list = list.filter((e) => {
      if (seen.has(e.at)) return false;
      seen.add(e.at);
      return true;
    });
  }

  const sorted = list.sort((a, b) => (b.at < a.at ? -1 : b.at > a.at ? 1 : 0));
  return sorted.slice(0, 10);
}

/**
 * Apply due scheduled publishes: copy scheduled_published_content to published_content and clear schedule.
 * Call periodically (e.g. every minute) from server.
 */
async function applyScheduledPublishes() {
  const snap = await getPublishedSubdomainsRef().get();
  const now = new Date();
  const toApply = [];
  snap.docs.forEach((doc) => {
    const d = doc.data();
    const at = d.scheduled_publish_at;
    if (!at) return;
    const date = at && typeof at.toDate === 'function' ? at.toDate() : new Date(at);
    if (isNaN(date.getTime()) || date > now) return;
    toApply.push({
      subdomain: doc.id,
      userId: d.user_id,
      projectId: d.project_id,
      domainId: d.domain_id,
      scheduledContent: d.scheduled_published_content,
    });
  });

  for (const item of toApply) {
    try {
      const clientRef = getDomainsRef(item.userId).doc(item.domainId);
      const publishedRef = getPublishedSubdomainsRef().doc(item.subdomain);
      const batch = db.batch();
      batch.update(clientRef, {
        published_content: item.scheduledContent ?? null,
        scheduled_publish_at: FieldValue.delete(),
        scheduled_published_content: FieldValue.delete(),
        updated_at: now,
      });
      batch.update(publishedRef, {
        published_content: item.scheduledContent ?? null,
        scheduled_publish_at: FieldValue.delete(),
        scheduled_published_content: FieldValue.delete(),
        updated_at: now,
      });
      await batch.commit();
    } catch (e) {
      console.warn('applyScheduledPublishes failed for', item.subdomain, e.message);
    }
  }
  return toApply.length;
}

async function getTrendOverTime(period = '7days') {
  const now = new Date();
  let start;
  let buckets;
  if (period === '7days') {
    start = new Date(now);
    start.setDate(start.getDate() - 7);
    buckets = 7;
  } else if (period === '30days') {
    start = new Date(now);
    start.setDate(start.getDate() - 30);
    buckets = 4;
  } else {
    start = new Date(now);
    start.setMonth(start.getMonth() - 3);
    buckets = 3;
  }

  // Optimize: query only recent updates instead of listAllFromPublishedSubdomains()
  const snap = await getPublishedSubdomainsRef().where('updated_at', '>=', start).get();
  const list = snap.docs.map(d => {
    const data = d.data();
    const date = data.updated_at?.toDate?.() || new Date(data.updated_at || data.created_at);
    return { date };
  });

  const bucketMs = (now.getTime() - start.getTime()) / buckets;
  const counts = new Array(buckets).fill(0);
  const labels = [];
  for (let i = 0; i < buckets; i++) {
    const t = new Date(start.getTime() + (i + 1) * bucketMs);
    labels.push(period === '7days' ? t.toLocaleDateString('en-US', { weekday: 'short' }) : period === '30days' ? `Week ${i + 1}` : t.toLocaleDateString('en-US', { month: 'short' }));
  }

  list.forEach(({ date }) => {
    if (date < start) return;
    const idx = Math.min(Math.floor((date - start) / bucketMs), buckets - 1);
    if (idx >= 0) counts[idx]++;
  });

  return { labels, data: counts };
}


module.exports = {
  create,
  findById,
  findByUserId,
  findAll,
  update: updateForClient,
  delete: deleteById,
  deleteByProjectId,
  moveToTrashByProjectId,
  restoreFromTrashByProjectId,
  deleteTrashByProjectId,
  publishForClientBatch,
  unpublishForClient,
  updateSubdomainForClient,
  setSubdomainLookup,
  findBySubdomain,
  findByPublishedSubdomain,
  findByCustomDomain,
  listAllFromPublishedSubdomains,
  listByClient,
  get,
  getDomainsRef,
  createForClient,
  findByProjectId,
  updateForClient,
  deleteForClient,
  schedulePublish,
  getScheduleByProject,
  getPublishHistoryByProject,
  applyScheduledPublishes,
  getTrendOverTime,
};
