const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

const ROOT_COLLECTION = 'published_subdomains';
const PRODUCT_COLLECTION = 'products';

function normalizeSubdomain(subdomain) {
  return (subdomain || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

function getSubdomainProductsRef(subdomain) {
  const normalized = normalizeSubdomain(subdomain);
  if (!normalized) throw new Error('subdomain is required');
  return db.collection(ROOT_COLLECTION).doc(normalized).collection(PRODUCT_COLLECTION);
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sanitizeVariants(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((variant, variantIndex) => {
      const rawOptions = Array.isArray(variant?.options) ? variant.options : [];
      const options = rawOptions
        .map((option, optionIndex) => ({
          id: (option?.id || `opt-${variantIndex + 1}-${optionIndex + 1}`).toString(),
          name: (option?.name || '').toString().trim(),
          priceAdjustment: toNumber(option?.priceAdjustment, 0),
        }))
        .filter((option) => option.name || option.priceAdjustment !== 0);

      return {
        id: (variant?.id || `var-${variantIndex + 1}`).toString(),
        name: (variant?.name || '').toString().trim(),
        pricingMode: variant?.pricingMode === 'override' ? 'override' : 'modifier',
        options,
      };
    })
    .filter((variant) => variant.name || variant.options.length > 0);
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

async function createForSubdomain({ subdomain, userId, projectId, domainId, data }) {
  const normalized = normalizeSubdomain(subdomain);
  if (!normalized) throw new Error('subdomain is required');
  if (!userId) throw new Error('userId is required');
  const variants = sanitizeVariants(data.variants);
  const hasVariants = !!data.hasVariants && variants.length > 0;

  const doc = {
    name: data.name || '',
    sku: data.sku || '',
    category: data.category || '',
    slug: data.slug || '',
    description: data.description || '',
    price: toNumber(data.price, 0),
    base_price: toNullableNumber(data.basePrice),
    final_price: toNullableNumber(data.finalPrice),
    compare_at_price: data.compareAtPrice != null ? parseFloat(data.compareAtPrice) : null,
    discount: toNumber(data.discount, 0),
    discount_type: data.discountType === 'fixed' ? 'fixed' : 'percentage',
    has_variants: hasVariants,
    variants: hasVariants ? variants : [],
    price_range_min: toNullableNumber(data.priceRangeMin),
    price_range_max: toNullableNumber(data.priceRangeMax),
    images: Array.isArray(data.images) ? data.images : [],
    status: data.status || 'draft',
    stock: data.stock != null ? parseInt(data.stock, 10) : null,
    user_id: userId,
    subdomain: normalized,
    project_id: projectId || null,
    domain_id: domainId || null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const ref = await getSubdomainProductsRef(normalized).add(doc);
  const snap = await ref.get();
  return docToObject(snap);
}

function sortByCreatedAtDesc(items) {
  return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function applySearch(items, search) {
  if (!search) return items;
  const s = String(search).toLowerCase();
  return items.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.slug && p.slug.toLowerCase().includes(s))
  );
}

function paginate(items, pagination = {}) {
  const limit = Math.max(1, parseInt(pagination.limit, 10) || 20);
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const total = items.length;
  const start = (page - 1) * limit;
  const slice = items.slice(start, start + limit);
  return { items: slice, total, page, totalPages: Math.ceil(total / limit) };
}

async function findAllForUser(filters = {}, pagination = {}) {
  const subdomains = await getOwnedSubdomains(filters.userId, filters.subdomain);
  if (!subdomains.length) return paginate([], pagination);

  const snaps = await Promise.all(
    subdomains.map((sub) => getSubdomainProductsRef(sub).get())
  );

  let items = snaps.flatMap((snap) => snap.docs.map((d) => docToObject(d)));
  if (filters.subdomain) {
    const normalized = normalizeSubdomain(filters.subdomain);
    items = items.filter((p) => normalizeSubdomain(p.subdomain) === normalized);
  }
  if (filters.status) {
    const statusFilter = String(filters.status).toLowerCase();
    items = items.filter((p) => String(p.status || '').toLowerCase() === statusFilter);
  }
  items = sortByCreatedAtDesc(items);
  items = applySearch(items, filters.search);
  return paginate(items, pagination);
}

async function findByIdForUser(id, userId) {
  if (!id || !userId) return null;
  const subdomains = await getOwnedSubdomains(userId);
  if (!subdomains.length) return null;

  const snaps = await Promise.all(
    subdomains.map((sub) => getSubdomainProductsRef(sub).doc(id).get())
  );
  const ownedDoc = snaps.find((s) => s.exists);
  if (!ownedDoc) return null;
  return docToObject(ownedDoc);
}

async function findBySlugForUser(slug, userId, subdomain) {
  if (!slug || !userId) return null;
  const subdomains = await getOwnedSubdomains(userId, subdomain);
  if (!subdomains.length) return null;

  const snaps = await Promise.all(
    subdomains.map((sub) =>
      getSubdomainProductsRef(sub).where('slug', '==', slug).limit(1).get()
    )
  );
  const matchGroup = snaps.find((s) => !s.empty);
  if (!matchGroup) return null;
  return docToObject(matchGroup.docs[0]);
}

async function updateForUser(id, userId, data) {
  const existing = await findByIdForUser(id, userId);
  if (!existing) return null;

  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.sku !== undefined) updates.sku = data.sku;
  if (data.category !== undefined) updates.category = data.category;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.description !== undefined) updates.description = data.description;
  if (data.price !== undefined) updates.price = toNumber(data.price, 0);
  if (data.basePrice !== undefined) updates.base_price = toNullableNumber(data.basePrice);
  if (data.finalPrice !== undefined) updates.final_price = toNullableNumber(data.finalPrice);
  if (data.compareAtPrice !== undefined) {
    updates.compare_at_price = data.compareAtPrice != null ? parseFloat(data.compareAtPrice) : null;
  }
  if (data.discount !== undefined) updates.discount = toNumber(data.discount, 0);
  if (data.discountType !== undefined) updates.discount_type = data.discountType === 'fixed' ? 'fixed' : 'percentage';
  if (data.hasVariants !== undefined) {
    updates.has_variants = !!data.hasVariants;
    if (!updates.has_variants && data.variants === undefined) updates.variants = [];
  }
  if (data.variants !== undefined) {
    const variants = sanitizeVariants(data.variants);
    const hasVariants = data.hasVariants === undefined ? variants.length > 0 : !!data.hasVariants;
    updates.has_variants = hasVariants;
    updates.variants = hasVariants ? variants : [];
  }
  if (data.priceRangeMin !== undefined) updates.price_range_min = toNullableNumber(data.priceRangeMin);
  if (data.priceRangeMax !== undefined) updates.price_range_max = toNullableNumber(data.priceRangeMax);
  if (data.images !== undefined) updates.images = Array.isArray(data.images) ? data.images : [];
  if (data.status !== undefined) updates.status = data.status;
  if (data.stock !== undefined) updates.stock = data.stock != null ? parseInt(data.stock, 10) : null;

  if (Object.keys(updates).length === 0) return existing;

  updates.updated_at = new Date();

  await db
    .collection(ROOT_COLLECTION)
    .doc(existing.subdomain)
    .collection(PRODUCT_COLLECTION)
    .doc(existing.id)
    .update(updates);

  return findByIdForUser(id, userId);
}

async function deleteByIdForUser(id, userId) {
  const existing = await findByIdForUser(id, userId);
  if (!existing) return false;

  await db
    .collection(ROOT_COLLECTION)
    .doc(existing.subdomain)
    .collection(PRODUCT_COLLECTION)
    .doc(existing.id)
    .delete();

  return true;
}

async function findPublicBySubdomain(subdomain, { limit = 100 } = {}) {
  const normalized = normalizeSubdomain(subdomain);
  if (!normalized) return [];

  const ref = getSubdomainProductsRef(normalized).limit(Math.max(1, parseInt(limit, 10) || 100));
  const snap = await ref.get();
  let items = snap.docs.map((d) => docToObject(d));
  items = sortByCreatedAtDesc(items);
  return items.filter((p) => {
    const status = (p.status || '').toString().toLowerCase();
    return status === 'active' || status === 'published';
  });
}

module.exports = {
  createForSubdomain,
  findAllForUser,
  findByIdForUser,
  findBySlugForUser,
  updateForUser,
  deleteByIdForUser,
  findPublicBySubdomain,
  normalizeSubdomain,
};
