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

module.exports = {
  create,
  listForUser,
};
