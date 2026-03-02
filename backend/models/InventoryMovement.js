const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

const COLLECTION = 'inventory_movements';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function create(data) {
  const quantity = toNumber(data.quantity, 0);
  const doc = {
    user_id: data.userId || null,
    project_id: data.projectId || null,
    subdomain: data.subdomain || null,
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

  const ref = await db.collection(COLLECTION).add(doc);
  const snap = await ref.get();
  return docToObject(snap);
}

async function listForUser(userId, filters = {}) {
  if (!userId) return [];
  const limit = Math.max(1, parseInt(filters.limit, 10) || 50);

  let ref = db.collection(COLLECTION).where('user_id', '==', userId);
  if (filters.projectId) ref = ref.where('project_id', '==', filters.projectId);
  if (filters.subdomain) ref = ref.where('subdomain', '==', filters.subdomain);
  if (filters.productId) ref = ref.where('product_id', '==', filters.productId);
  if (filters.type) ref = ref.where('type', '==', filters.type);

  const snap = await ref.get();
  const items = snap.docs.map((d) => docToObject(d));
  return items
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, limit);
}

module.exports = {
  create,
  listForUser,
};
