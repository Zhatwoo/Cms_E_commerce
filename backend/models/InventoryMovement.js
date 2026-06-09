const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');
const log = require('../utils/logger')('InventoryMovement');

const ROOT_COLLECTION = 'published_subdomains';
const MOVEMENT_COLLECTION = 'inventory_movements';
const PRODUCT_COLLECTION = 'products';

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
    if (snap.exists) {
      const ownerId = snap.get('user_id');
      if (ownerId === userId) return [normalized];
      if (ownerId && ownerId !== userId) return [];
    }
    // Parent doc missing user_id (drafted project or pre-publish state). Fall back
    // to checking whether the user has at least one product under this subdomain;
    // if so, they own it for inventory purposes.
    const productOwned = await db
      .collection(ROOT_COLLECTION)
      .doc(normalized)
      .collection(PRODUCT_COLLECTION)
      .where('user_id', '==', userId)
      .limit(1)
      .get();
    if (!productOwned.empty) return [normalized];

    // Final fallback: a movement was previously recorded under this subdomain
    // for this user, even if no product is currently tagged with user_id.
    const movementOwned = await db
      .collection(ROOT_COLLECTION)
      .doc(normalized)
      .collection(MOVEMENT_COLLECTION)
      .where('user_id', '==', userId)
      .limit(1)
      .get();
    return movementOwned.empty ? [] : [normalized];
  }

  const ownedDocs = await db.collection(ROOT_COLLECTION).where('user_id', '==', userId).get();
  const owned = new Set(ownedDocs.docs.map((d) => d.id));

  // Also union in subdomains that have movements for this user but whose parent
  // doc still lacks user_id — otherwise pre-existing movements stay invisible.
  const movementOwned = await db
    .collectionGroup(MOVEMENT_COLLECTION)
    .where('user_id', '==', userId)
    .get();
  for (const doc of movementOwned.docs) {
    const subdomainId = doc.ref.parent.parent && doc.ref.parent.parent.id;
    if (subdomainId) owned.add(subdomainId);
  }
  return Array.from(owned);
}

// Look the subdomain up from the product doc when the caller couldn't supply one.
// Otherwise the movement silently fails to persist and the user sees an empty
// list after refresh even though the product stock did update.
async function lookupSubdomainFromProduct(userId, productId) {
  if (!userId || !productId) return '';
  const ownerSnap = await db
    .collection(ROOT_COLLECTION)
    .where('user_id', '==', userId)
    .get();
  for (const ownerDoc of ownerSnap.docs) {
    const subdomain = ownerDoc.id;
    const productSnap = await db
      .collection(ROOT_COLLECTION)
      .doc(subdomain)
      .collection(PRODUCT_COLLECTION)
      .doc(productId)
      .get();
    if (productSnap.exists) return subdomain;
  }
  return '';
}

// Make sure the parent published_subdomains/{subdomain} doc has a user_id so
// listForUser's `where('user_id', '==', userId)` query and getOwnedSubdomains
// lookup can find the movements we're about to write.
async function ensureSubdomainOwner(subdomain, userId) {
  if (!subdomain || !userId) return;
  const ref = db.collection(ROOT_COLLECTION).doc(subdomain);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set(
      { subdomain, user_id: userId, created_at: new Date(), updated_at: new Date() },
      { merge: true }
    );
    return;
  }
  if (!snap.get('user_id')) {
    await ref.set({ user_id: userId, updated_at: new Date() }, { merge: true });
  }
}

async function create(data) {
  let normalizedSubdomain = normalizeSubdomain(data.subdomain);
  if (!normalizedSubdomain && data.userId && data.productId) {
    normalizedSubdomain = await lookupSubdomainFromProduct(data.userId, data.productId);
    if (normalizedSubdomain) {
      log.warn('movement create fell back to product-derived subdomain', {
        userId: data.userId,
        productId: data.productId,
        subdomain: normalizedSubdomain,
      });
    }
  }
  if (!normalizedSubdomain) {
    log.error('movement create failed: no subdomain resolvable', {
      userId: data.userId,
      productId: data.productId,
    });
    throw new Error('subdomain is required for inventory movements');
  }

  // listForUser scans by getOwnedSubdomains() which only returns subdomains
  // where the parent doc carries user_id. If the project was never published,
  // products live under the subdomain's product subcollection but the parent
  // doc may be missing user_id — so list-side queries return nothing.
  if (data.userId) {
    await ensureSubdomainOwner(normalizedSubdomain, data.userId);
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
