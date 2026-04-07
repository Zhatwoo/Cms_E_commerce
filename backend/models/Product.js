const { db, admin } = require('../config/firebase');
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

function toNullableInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function toNonNegativeInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, n);
}

function clampReservedToOnHand(onHandStock, reservedStock) {
  if (onHandStock === null || onHandStock === undefined) return 0;
  return Math.min(Math.max(0, reservedStock), Math.max(0, onHandStock));
}

function computeAvailable(onHandStock, reservedStock) {
  if (onHandStock === null || onHandStock === undefined) return null;
  return Math.max(0, onHandStock - reservedStock);
}

function resolveInventorySnapshot(raw) {
  const onHandCandidate =
    raw?.onHandStock !== undefined ? raw.onHandStock : raw?.stock;
  const onHandStock = toNullableInt(onHandCandidate);
  const reservedStock = clampReservedToOnHand(
    onHandStock,
    toNonNegativeInt(raw?.reservedStock, 0)
  );
  const availableStock = computeAvailable(onHandStock, reservedStock);
  const lowStockThreshold = toNonNegativeInt(raw?.lowStockThreshold, 5);
  return { onHandStock, reservedStock, availableStock, lowStockThreshold };
}

function sanitizeVariants(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((variant, variantIndex) => {
      const rawOptions = Array.isArray(variant?.options) ? variant.options : [];
      const options = rawOptions
        .map((option, optionIndex) => {
          const image = [
            option?.image,
            option?.imageUrl,
            option?.image_url,
            option?.imgUrl,
            option?.img_url,
          ].find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0) || '';

          return {
            id: (option?.id || `opt-${variantIndex + 1}-${optionIndex + 1}`).toString(),
            name: (option?.name || '').toString().trim(),
            priceAdjustment: toNumber(option?.priceAdjustment, 0),
            image,
          };
        })
        .filter((option) => option.name || option.priceAdjustment !== 0 || option.image);

      return {
        id: (variant?.id || `var-${variantIndex + 1}`).toString(),
        name: (variant?.name || '').toString().trim(),
        pricingMode: variant?.pricingMode === 'override' ? 'override' : 'modifier',
        options,
      };
    })
    .filter((variant) => variant.name || variant.options.length > 0);
}

function sanitizeVariantStocks(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value).reduce((acc, [key, rawAmount]) => {
    const normalizedKey = String(key || '').trim();
    if (!normalizedKey) return acc;
    const amount = toNonNegativeInt(rawAmount, 0);
    acc[normalizedKey] = amount;
    return acc;
  }, {});
}

function sanitizeVariantPrices(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value).reduce((acc, [key, rawAmount]) => {
    const normalizedKey = String(key || '').trim();
    if (!normalizedKey) return acc;
    const amount = Number(rawAmount);
    acc[normalizedKey] = Number.isFinite(amount) && amount >= 0 ? amount : 0;
    return acc;
  }, {});
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
  const variantStocks = hasVariants ? sanitizeVariantStocks(data.variantStocks) : {};
  const variantPrices = hasVariants ? sanitizeVariantPrices(data.variantPrices) : {};

  const normalizedSubcategory = String(
    data.subcategory ?? data.subCategory ?? data.sub_category ?? ''
  ).trim();

  const initialInventory = resolveInventorySnapshot({
    onHandStock: data.onHandStock,
    stock: data.stock,
    reservedStock: data.reservedStock,
    lowStockThreshold: data.lowStockThreshold,
  });

  const doc = {
    name: data.name || '',
    sku: data.sku || '',
    category: data.category || '',
    subcategory: normalizedSubcategory,
    slug: data.slug || '',
    description: data.description || '',
    price: toNumber(data.price, 0),
    base_price: toNullableNumber(data.basePrice),
    cost_price: toNullableNumber(data.costPrice),
    final_price: toNullableNumber(data.finalPrice),
    compare_at_price: data.compareAtPrice != null ? parseFloat(data.compareAtPrice) : null,
    discount: toNumber(data.discount, 0),
    discount_type: data.discountType === 'fixed' ? 'fixed' : 'percentage',
    has_variants: hasVariants,
    variants: hasVariants ? variants : [],
    variant_stocks: variantStocks,
    variant_prices: variantPrices,
    price_range_min: toNullableNumber(data.priceRangeMin),
    price_range_max: toNullableNumber(data.priceRangeMax),
    images: Array.isArray(data.images) ? data.images : [],
    status: data.status || 'draft',
    // Backward-compatible legacy stock mirror (same as on_hand_stock)
    stock: initialInventory.onHandStock,
    on_hand_stock: initialInventory.onHandStock,
    reserved_stock: initialInventory.reservedStock,
    available_stock: initialInventory.availableStock,
    low_stock_threshold: initialInventory.lowStockThreshold,
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

async function findAllGlobal(filters = {}, pagination = {}) {
  const snap = await db.collectionGroup(PRODUCT_COLLECTION).get();
  let items = snap.docs.map((d) => docToObject(d));

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

async function getAllSubdomains() {
  try {
    const snap = await db.collection(ROOT_COLLECTION).get();
    return snap.docs.map((d) => d.id);
  } catch (e) {
    console.warn('[Product.getAllSubdomains] query failed:', e.message);
    return [];
  }
}

async function findByIdGlobal(id) {
  if (!id) return null;
  const trimmedId = String(id).trim();
  const subdomains = await getAllSubdomains();
  if (!subdomains.length) return null;

  const snaps = await Promise.all(
    subdomains.map((sub) => getSubdomainProductsRef(sub).doc(trimmedId).get())
  );
  
  const foundDoc = snaps.find((s) => s.exists);
  if (!foundDoc) return null;
  return docToObject(foundDoc);
}

async function deleteByIdGlobal(id) {
  if (!id) return null;
  const trimmedId = String(id).trim();
  const subdomains = await getAllSubdomains();
  if (!subdomains.length) return null;

  const snaps = await Promise.all(
    subdomains.map((sub) => getSubdomainProductsRef(sub).doc(trimmedId).get())
  );
  
  const foundSnap = snaps.find((s) => s.exists);
  if (!foundSnap) return null;
  
  const existing = docToObject(foundSnap);
  await foundSnap.ref.delete();
  return existing;
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

async function findBySkuForUser(sku, userId, subdomain) {
  if (!sku || !userId) return null;
  const normalizedSku = String(sku).trim();
  if (!normalizedSku) return null;
  const subdomains = await getOwnedSubdomains(userId, subdomain);
  if (!subdomains.length) return null;

  const snaps = await Promise.all(
    subdomains.map((sub) =>
      getSubdomainProductsRef(sub).where('sku', '==', normalizedSku).limit(1).get()
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
  if (
    data.subcategory !== undefined ||
    data.subCategory !== undefined ||
    data.sub_category !== undefined
  ) {
    updates.subcategory = String(
      data.subcategory ?? data.subCategory ?? data.sub_category ?? ''
    ).trim();
  }
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.description !== undefined) updates.description = data.description;
  if (data.price !== undefined) updates.price = toNumber(data.price, 0);
  if (data.basePrice !== undefined) updates.base_price = toNullableNumber(data.basePrice);
  if (data.costPrice !== undefined) updates.cost_price = toNullableNumber(data.costPrice);
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
    if (!hasVariants && data.variantStocks === undefined) updates.variant_stocks = {};
    if (!hasVariants && data.variantPrices === undefined) updates.variant_prices = {};
  }
  if (data.variantStocks !== undefined) {
    const hasVariants =
      updates.has_variants !== undefined
        ? !!updates.has_variants
        : (existing.hasVariants !== undefined ? !!existing.hasVariants : Array.isArray(existing.variants) && existing.variants.length > 0);
    updates.variant_stocks = hasVariants ? sanitizeVariantStocks(data.variantStocks) : {};
  }
  if (data.variantPrices !== undefined) {
    const hasVariants =
      updates.has_variants !== undefined
        ? !!updates.has_variants
        : (existing.hasVariants !== undefined ? !!existing.hasVariants : Array.isArray(existing.variants) && existing.variants.length > 0);
    updates.variant_prices = hasVariants ? sanitizeVariantPrices(data.variantPrices) : {};
  }
  if (data.priceRangeMin !== undefined) updates.price_range_min = toNullableNumber(data.priceRangeMin);
  if (data.priceRangeMax !== undefined) updates.price_range_max = toNullableNumber(data.priceRangeMax);
  if (data.images !== undefined) updates.images = Array.isArray(data.images) ? data.images : [];
  if (data.status !== undefined) updates.status = data.status;

  const existingInventory = resolveInventorySnapshot({
    onHandStock: existing.onHandStock,
    stock: existing.stock,
    reservedStock: existing.reservedStock,
    lowStockThreshold: existing.lowStockThreshold,
  });
  const inventoryInputPresent =
    data.stock !== undefined ||
    data.onHandStock !== undefined ||
    data.reservedStock !== undefined ||
    data.lowStockThreshold !== undefined;
  if (inventoryInputPresent) {
    const nextOnHand =
      data.onHandStock !== undefined
        ? toNullableInt(data.onHandStock)
        : data.stock !== undefined
          ? toNullableInt(data.stock)
          : existingInventory.onHandStock;
    const requestedReserved =
      data.reservedStock !== undefined
        ? toNonNegativeInt(data.reservedStock, 0)
        : existingInventory.reservedStock;
    const nextReserved = clampReservedToOnHand(nextOnHand, requestedReserved);
    const nextAvailable = computeAvailable(nextOnHand, nextReserved);
    const nextThreshold =
      data.lowStockThreshold !== undefined
        ? toNonNegativeInt(data.lowStockThreshold, 0)
        : existingInventory.lowStockThreshold;

    updates.stock = nextOnHand;
    updates.on_hand_stock = nextOnHand;
    updates.reserved_stock = nextReserved;
    updates.available_stock = nextAvailable;
    updates.low_stock_threshold = nextThreshold;
  }

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

async function applyInventoryDeltaForUser({
  id,
  userId,
  onHandDelta = 0,
  reservedDelta = 0,
  setOnHandStock,
  setReservedStock,
  lowStockThreshold,
  allowNegativeOnHand = false,
}) {
  const existing = await findByIdForUser(id, userId);
  if (!existing) return null;

  const productRef = db
    .collection(ROOT_COLLECTION)
    .doc(existing.subdomain)
    .collection(PRODUCT_COLLECTION)
    .doc(existing.id);

  let beforeSnapshot = null;
  let afterSnapshot = null;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists) throw new Error('Product not found');

    const raw = docToObject(snap);
    const current = resolveInventorySnapshot({
      onHandStock: raw.onHandStock,
      stock: raw.stock,
      reservedStock: raw.reservedStock,
      lowStockThreshold: raw.lowStockThreshold,
    });
    beforeSnapshot = current;

    const baseOnHand = current.onHandStock ?? 0;
    const baseReserved = current.reservedStock ?? 0;
    let nextOnHand =
      setOnHandStock !== undefined
        ? toNullableInt(setOnHandStock)
        : baseOnHand + toNumber(onHandDelta, 0);
    let nextReserved =
      setReservedStock !== undefined
        ? toNonNegativeInt(setReservedStock, 0)
        : baseReserved + toNumber(reservedDelta, 0);

    if (!allowNegativeOnHand && nextOnHand !== null && nextOnHand < 0) {
      throw new Error('Insufficient on-hand stock');
    }
    if (nextOnHand !== null && nextOnHand < 0) nextOnHand = 0;
    nextReserved = clampReservedToOnHand(nextOnHand, Math.max(0, nextReserved));
    const nextAvailable = computeAvailable(nextOnHand, nextReserved);
    const nextThreshold =
      lowStockThreshold !== undefined
        ? toNonNegativeInt(lowStockThreshold, 0)
        : current.lowStockThreshold;

    afterSnapshot = {
      onHandStock: nextOnHand,
      reservedStock: nextReserved,
      availableStock: nextAvailable,
      lowStockThreshold: nextThreshold,
    };

    tx.update(productRef, {
      stock: nextOnHand,
      on_hand_stock: nextOnHand,
      reserved_stock: nextReserved,
      available_stock: nextAvailable,
      low_stock_threshold: nextThreshold,
      updated_at: new Date(),
    });
  });

  const updated = await findByIdForUser(id, userId);
  return {
    product: updated,
    before: beforeSnapshot,
    after: afterSnapshot,
  };
}

/**
 * Adjust stock for a specific variant key while keeping totals in sync.
 * Falls back to applyInventoryDeltaForUser if variantKey is not provided.
 */
async function applyVariantInventoryDeltaForUser({
  id,
  userId,
  variantKey,
  variantDelta = 0,
  setVariantStock,
  lowStockThreshold,
  allowNegativeOnHand = false,
}) {
  if (!variantKey) {
    // No variant supplied; treat as base product adjustment
    return applyInventoryDeltaForUser({
      id,
      userId,
      onHandDelta: variantDelta,
      lowStockThreshold,
      allowNegativeOnHand,
    });
  }

  const existing = await findByIdForUser(id, userId);
  if (!existing) return null;

  const key = String(variantKey).trim();
  if (!key) throw new Error('variantKey is required');

  const productRef = db
    .collection(ROOT_COLLECTION)
    .doc(existing.subdomain)
    .collection(PRODUCT_COLLECTION)
    .doc(existing.id);

  let beforeSnapshot = null;
  let afterSnapshot = null;
  let beforeVariantStock = 0;
  let afterVariantStock = 0;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists) throw new Error('Product not found');

    const raw = docToObject(snap);
    const current = resolveInventorySnapshot({
      onHandStock: raw.onHandStock,
      stock: raw.stock,
      reservedStock: raw.reservedStock,
      lowStockThreshold: raw.lowStockThreshold,
    });

    const variantStocks = sanitizeVariantStocks(raw.variantStocks || {});
    const currentVariant = toNonNegativeInt(variantStocks[key] ?? 0, 0);
    beforeVariantStock = currentVariant;

    let nextVariant =
      setVariantStock !== undefined
        ? toNonNegativeInt(setVariantStock, currentVariant)
        : currentVariant + toNumber(variantDelta, 0);
    if (!allowNegativeOnHand && nextVariant < 0) {
      throw new Error('Insufficient variant stock');
    }
    nextVariant = Math.max(0, nextVariant);
    variantStocks[key] = nextVariant;
    afterVariantStock = nextVariant;

    // Recompute totals based on variant stocks
    const nextOnHand = Object.values(variantStocks).reduce(
      (sum, value) => sum + toNonNegativeInt(value, 0),
      0
    );
    const nextReserved = clampReservedToOnHand(
      nextOnHand,
      toNonNegativeInt(current.reservedStock, 0)
    );
    const nextAvailable = computeAvailable(nextOnHand, nextReserved);
    const nextThreshold =
      lowStockThreshold !== undefined
        ? toNonNegativeInt(lowStockThreshold, 0)
        : current.lowStockThreshold;

    beforeSnapshot = current;
    afterSnapshot = {
      onHandStock: nextOnHand,
      reservedStock: nextReserved,
      availableStock: nextAvailable,
      lowStockThreshold: nextThreshold,
      variantStocks,
      variantKey: key,
      beforeVariantStock: currentVariant,
      afterVariantStock: nextVariant,
    };

    tx.update(productRef, {
      variant_stocks: variantStocks,
      stock: nextOnHand,
      on_hand_stock: nextOnHand,
      reserved_stock: nextReserved,
      available_stock: nextAvailable,
      low_stock_threshold: nextThreshold,
      updated_at: new Date(),
    });
  });

  const updated = await findByIdForUser(id, userId);
  return {
    product: updated,
    before: beforeSnapshot,
    after: afterSnapshot,
    beforeVariantStock,
    afterVariantStock,
    variantKey: key,
  };
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
  findAllGlobal,
  findByIdGlobal,
  findByIdForUser,
  findBySlugForUser,
  findBySkuForUser,
  updateForUser,
  applyInventoryDeltaForUser,
  applyVariantInventoryDeltaForUser,
  deleteByIdGlobal,
  deleteByIdForUser,
  findPublicBySubdomain,
  normalizeSubdomain,
  resolveInventorySnapshot,
};
