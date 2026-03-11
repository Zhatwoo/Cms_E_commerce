const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

const ROOT_COLLECTION = 'published_subdomains';
const MOVEMENT_COLLECTION = 'inventory_movements';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSubdomain(subdomain) {
  return (subdomain || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

function getSubdomainMovementsRef(subdomain) {
  const normalized = normalizeSubdomain(subdomain);
  if (!normalized) throw new Error('subdomain is required');
  return db.collection(ROOT_COLLECTION).doc(normalized).collection(MOVEMENT_COLLECTION);
}

async function getOwnedSubdomains(userId, subdomain) {
  if (!userId) return [];
  const normalized = normalizeSubdomain(subdomain);
  if (normalized) {
    const snap = await db.collection(ROOT_COLLECTION).doc(normalized).get();
    if (!snap.exists) return [];
    const ownerId = snap.get('user_id');
    return ownerId === userId ? [normalized] : [];
  }

  const snap = await db.collection(ROOT_COLLECTION).where('user_id', '==', userId).get();
  return snap.docs.map((d) => d.id);
}

async function create(data) {
  const normalizedSubdomain = normalizeSubdomain(data.subdomain);
  if (!normalizedSubdomain) {
    throw new Error('subdomain is required for inventory movements');
  }

  const quantity = toNumber(data.quantity, 0);
  const doc = {
    user_id: data.userId || null,
    project_id: data.projectId || null,
    subdomain: normalizedSubdomain,
    product_id: data.productId || null,
    product_name: data.productName || null,
    product_sku: data.productSku || null,
    type: data.type || 'ADJUST',
    quantity,
    before_on_hand: data.beforeOnHand ?? null,
    after_on_hand: data.afterOnHand ?? null,
    before_reserved: data.beforeReserved ?? null,
    after_reserved: data.afterReserved ?? null,
    reference_type: data.referenceType || 'manual',
    reference_id: data.referenceId || null,
    actor: data.actor || null,
    notes: data.notes || null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const ref = await getSubdomainMovementsRef(normalizedSubdomain).add(doc);
  const snap = await ref.get();
  return docToObject(snap);
}

async function listForUser(userId, filters = {}) {
  if (!userId) return [];
  const limit = Math.max(1, parseInt(filters.limit, 10) || 50);
  const scopedSubdomain = normalizeSubdomain(filters.subdomain);

  const subdomains = await getOwnedSubdomains(userId, scopedSubdomain);
  if (!subdomains.length) return [];

  const snaps = await Promise.all(
    subdomains.map((subdomain) => getSubdomainMovementsRef(subdomain).where('user_id', '==', userId).get())
  );
  let items = snaps.flatMap((snap) => snap.docs.map((d) => docToObject(d)));

  if (filters.projectId) {
    const projectId = String(filters.projectId).trim();
    items = items.filter((item) => String(item.projectId || '').trim() === projectId);
  }
  if (filters.productId) {
    const productId = String(filters.productId).trim();
    items = items.filter((item) => String(item.productId || '').trim() === productId);
  }
  if (filters.type) {
    const movementType = String(filters.type).trim().toUpperCase();
    items = items.filter((item) => String(item.type || '').trim().toUpperCase() === movementType);
  }

  return items
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, limit);
}

async function deleteForUser(userId, movementId, filters = {}) {
  const normalizedMovementId = String(movementId || '').trim();
  if (!userId || !normalizedMovementId) return { deleted: false };

  const scopedSubdomain = normalizeSubdomain(filters.subdomain);
  const scopedProjectId = String(filters.projectId || '').trim();
  const subdomains = await getOwnedSubdomains(userId, scopedSubdomain);
  if (!subdomains.length) return { deleted: false };

  for (const subdomain of subdomains) {
    const ref = getSubdomainMovementsRef(subdomain).doc(normalizedMovementId);
    const snap = await ref.get();
    if (!snap.exists) continue;

    if (snap.get('user_id') !== userId) continue;
    if (scopedProjectId) {
      const movementProjectId = String(snap.get('project_id') || '').trim();
      if (movementProjectId !== scopedProjectId) continue;
    }

    const item = docToObject(snap);
    await ref.delete();
    return { deleted: true, item };
  }

  return { deleted: false };
}

async function commitBatches(batches) {
  for (const batch of batches) {
    // Firestore batches are committed in order; caller ensures size constraints.
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
  }
}

async function deleteManyForUser(userId, movementIds, filters = {}) {
  const ids = Array.isArray(movementIds)
    ? Array.from(new Set(movementIds.map((id) => String(id || '').trim()).filter(Boolean)))
    : [];
  if (!userId || ids.length === 0) return { deleted: 0, missing: ids };

  const scopedSubdomain = normalizeSubdomain(filters.subdomain);
  const scopedProjectId = String(filters.projectId || '').trim();
  const subdomains = await getOwnedSubdomains(userId, scopedSubdomain);
  if (!subdomains.length) return { deleted: 0, missing: ids };

  const found = new Set();
  let deleted = 0;
  const batches = [];
  let batch = db.batch();
  let opCount = 0;

  const flushBatch = async () => {
    if (opCount === 0) return;
    batches.push(batch);
    batch = db.batch();
    opCount = 0;
  };

  for (const subdomain of subdomains) {
    const ref = getSubdomainMovementsRef(subdomain);
    for (const movementId of ids) {
      const docRef = ref.doc(movementId);
      // eslint-disable-next-line no-await-in-loop
      const snap = await docRef.get();
      if (!snap.exists) continue;

      if (snap.get('user_id') !== userId) continue;
      if (scopedProjectId) {
        const movementProjectId = String(snap.get('project_id') || '').trim();
        if (movementProjectId !== scopedProjectId) continue;
      }

      batch.delete(docRef);
      opCount += 1;
      found.add(movementId);
      deleted += 1;

      // Keep batch size well under Firestore's 500 operations per batch cap
      if (opCount >= 400) {
        // eslint-disable-next-line no-await-in-loop
        await flushBatch();
      }
    }
  }

  await flushBatch();
  await commitBatches(batches);

  const missing = ids.filter((id) => !found.has(id));
  return { deleted, missing };
}

async function deleteAllForUser(userId, filters = {}) {
  if (!userId) return { deleted: 0 };

  const scopedSubdomain = normalizeSubdomain(filters.subdomain);
  const scopedProjectId = String(filters.projectId || '').trim();
  const subdomains = await getOwnedSubdomains(userId, scopedSubdomain);
  if (!subdomains.length) return { deleted: 0 };

  let deleted = 0;

  for (const subdomain of subdomains) {
    let query = getSubdomainMovementsRef(subdomain).where('user_id', '==', userId);
    if (scopedProjectId) {
      query = query.where('project_id', '==', scopedProjectId);
    }

    // eslint-disable-next-line no-await-in-loop
    const snap = await query.get();
    if (snap.empty) continue;

    let batch = db.batch();
    let opCount = 0;

    for (const doc of snap.docs) {
      batch.delete(doc.ref);
      opCount += 1;
      deleted += 1;

      if (opCount >= 400) {
        // eslint-disable-next-line no-await-in-loop
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
    }

    if (opCount > 0) {
      // eslint-disable-next-line no-await-in-loop
      await batch.commit();
    }
  }

  return { deleted };
}

module.exports = {
  create,
  listForUser,
  deleteForUser,
  deleteManyForUser,
  deleteAllForUser,
};
