const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

const ROOT_COLLECTION = 'published_subdomains';
const ORDER_COLLECTION = 'orders';

function normalizeSubdomain(subdomain) {
  return (subdomain || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

function stripUndefinedDeep(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefinedDeep(entry));
  }
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) continue;
    output[key] = stripUndefinedDeep(entry);
  }
  return output;
}

function getOrderRef(subdomain, orderId) {
  const normalized = normalizeSubdomain(subdomain);
  if (!normalized) throw new Error('subdomain is required');
  if (!orderId) throw new Error('orderId is required');
  return db.collection(ROOT_COLLECTION).doc(normalized).collection(ORDER_COLLECTION).doc(orderId);
}

function getOrdersRef(subdomain) {
  const normalized = normalizeSubdomain(subdomain);
  if (!normalized) throw new Error('subdomain is required');
  return db.collection(ROOT_COLLECTION).doc(normalized).collection(ORDER_COLLECTION);
}

function toStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  const map = {
    pending: 'Pending',
    processing: 'Processing',
    paid: 'Paid',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
  };
  return map[value] || '';
}

function parsePagination(pagination = {}) {
  const limit = Math.max(1, parseInt(pagination.limit, 10) || 20);
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  return { limit, page };
}

function paginate(items, pagination = {}) {
  const { limit, page } = parsePagination(pagination);
  const total = items.length;
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function sortByCreatedAtDesc(items) {
  return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

function applySearch(items, search) {
  const query = String(search || '').trim().toLowerCase();
  if (!query) return items;
  return items.filter((item) => {
    const idText = String(item.id || '').toLowerCase();
    const subdomainText = String(item.subdomain || '').toLowerCase();
    const buyerText = [
      item.shippingAddress?.fullName,
      item.shippingAddress?.name,
      item.shippingAddress?.email,
      item.shippingAddress?.phone,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const itemText = Array.isArray(item.items)
      ? item.items
          .map((line) => `${line?.name || ''} ${line?.sku || ''}`)
          .join(' ')
          .toLowerCase()
      : '';
    return (
      idText.includes(query) ||
      subdomainText.includes(query) ||
      buyerText.includes(query) ||
      itemText.includes(query)
    );
  });
}

async function createForSubdomain({
  subdomain,
  ownerUserId,
  projectId,
  domainId,
  items,
  total,
  status = 'Pending',
  shippingAddress = null,
  currency = 'PHP',
}) {
  const normalized = normalizeSubdomain(subdomain);
  if (!normalized) throw new Error('subdomain is required');
  if (!ownerUserId) throw new Error('ownerUserId is required');

  const ref = getOrdersRef(normalized);
  const now = new Date();
  const canonicalStatus = toStatus(status) || 'Pending';
  const safeItems = Array.isArray(items) ? items : [];
  const safeTotal = Number.isFinite(Number(total)) ? Number(total) : 0;

  const doc = {
    subdomain: normalized,
    owner_user_id: ownerUserId,
    project_id: projectId || null,
    domain_id: domainId || null,
    source: 'public_storefront',
    items: safeItems,
    total: safeTotal,
    status: canonicalStatus,
    shipping_address: shippingAddress || null,
    currency: String(currency || 'PHP').trim().toUpperCase() || 'PHP',
    created_at: now,
    updated_at: now,
  };

  const createdRef = await ref.add(stripUndefinedDeep(doc));
  const created = await createdRef.get();
  return docToObject(created);
}

async function listByOwner({
  ownerUserId,
  subdomains,
  status,
  search,
  page,
  limit,
}) {
  const ownedSubdomains = Array.isArray(subdomains)
    ? subdomains.map((sub) => normalizeSubdomain(sub)).filter(Boolean)
    : [];
  if (!ownerUserId || ownedSubdomains.length === 0) {
    return paginate([], { page, limit });
  }

  const snapshots = await Promise.all(
    ownedSubdomains.map((subdomain) => getOrdersRef(subdomain).get())
  );

  let items = snapshots.flatMap((snap) => snap.docs.map((doc) => docToObject(doc)));
  items = items.filter((item) => String(item.ownerUserId || '') === String(ownerUserId));

  const normalizedStatus = toStatus(status);
  if (normalizedStatus) {
    items = items.filter((item) => String(item.status || '') === normalizedStatus);
  }

  items = applySearch(items, search);
  items = sortByCreatedAtDesc(items);
  return paginate(items, { page, limit });
}

async function findById(subdomain, orderId) {
  const normalizedSubdomain = normalizeSubdomain(subdomain);
  if (!normalizedSubdomain || !orderId) return null;
  const ref = getOrderRef(normalizedSubdomain, orderId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return docToObject(snap);
}

async function updatePaymentFields(subdomain, orderId, fields) {
  const normalizedSubdomain = normalizeSubdomain(subdomain);
  if (!normalizedSubdomain || !orderId) throw new Error('subdomain and orderId are required');

  const ref = getOrderRef(normalizedSubdomain, orderId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const updates = { updated_at: new Date() };
  if (fields.paymentIntentId != null) updates.payment_intent_id = String(fields.paymentIntentId);
  if (fields.paymentStatus != null) updates.payment_status = String(fields.paymentStatus);
  if (fields.sourceId != null) updates.payment_source_id = String(fields.sourceId);
  if (fields.invoiceId != null) updates.xendit_invoice_id = String(fields.invoiceId);
  if (fields.paypalOrderId != null) updates.paypal_order_id = String(fields.paypalOrderId);
  if (fields.paymentMethod != null) updates.payment_method = String(fields.paymentMethod);


  await ref.update(updates);
  const updated = await ref.get();
  return docToObject(updated);
}

async function updateStatusBySubdomainAndId(subdomain, orderId, status) {
  const normalizedSubdomain = normalizeSubdomain(subdomain);
  if (!normalizedSubdomain) throw new Error('subdomain is required');
  const canonicalStatus = toStatus(status);
  if (!canonicalStatus) throw new Error('Invalid status');

  const ref = getOrderRef(normalizedSubdomain, orderId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  await ref.update({
    status: canonicalStatus,
    updated_at: new Date(),
  });

  const updated = await ref.get();
  return docToObject(updated);
}

async function updateStatusForOwner({
  ownerUserId,
  subdomain,
  orderId,
  status,
}) {
  const normalizedSubdomain = normalizeSubdomain(subdomain);
  if (!normalizedSubdomain) throw new Error('subdomain is required');
  const canonicalStatus = toStatus(status);
  if (!canonicalStatus) throw new Error('Invalid status');

  const ref = getOrderRef(normalizedSubdomain, orderId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const existing = docToObject(snap);
  if (String(existing.ownerUserId || '') !== String(ownerUserId || '')) return null;

  await ref.update({
    status: canonicalStatus,
    updated_at: new Date(),
  });

  const updated = await ref.get();
  return docToObject(updated);
}

module.exports = {
  normalizeSubdomain,
  toStatus,
  createForSubdomain,
  listByOwner,
  updateStatusForOwner,
  findById,
  updatePaymentFields,
  updateStatusBySubdomainAndId,
};
