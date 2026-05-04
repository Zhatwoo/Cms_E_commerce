const Product = require('../models/Product');
const Domain = require('../models/Domain');
const Project = require('../models/Project');
const User = require('../models/User');
const { uploadProductImage, deleteStorageFilesByUrls } = require('../utils/storageHelpers');
const { sendAdminActionEmail } = require('../utils/emailService');
const Notification = require('../models/Notification');
const log = require('../utils/logger')('productController');

async function resolveClientContact(userId) {
  let displayName = 'Client';
  let email = '';

  if (!userId) return { email, displayName };

  const user = await User.findById(userId);
  if (user) {
    displayName = user.displayName || user.fullName || user.email || displayName;
    email = user.email || '';
  }

  if (!email) {
    try {
      const authUser = await auth.getUser(userId);
      email = authUser.email || '';
      if (authUser.displayName && (!user || !user.displayName)) {
        displayName = authUser.displayName;
      }
    } catch {
      // keep best-effort values
    }
  }

  return { email: String(email || '').trim(), displayName };
}

function getAllowedProductImagePrefixes(userId) {
  // Keep previous path for backwards compatibility and cleanup of older uploads.
  return [
    `Products_img/${userId}/products/`,
    `Clients/${userId}/products/`,
  ];
}

async function resolveOwnedDomain(userId, subdomainInput) {
  const subdomain = Product.normalizeSubdomain(subdomainInput);
  if (!subdomain) return { error: 'subdomain is required' };

  const project = await Project.getBySubdomain(userId, subdomain);
  const domain = await Domain.findBySubdomain(subdomain);
  if (domain && domain.userId && domain.userId !== userId) {
    return { error: 'Access denied for this domain' };
  }

  // Allow products for owned projects even when site is draft/unpublished.
  if (project) {
    return {
      subdomain,
      domain: {
        id: domain?.id || null,
        domainId: domain?.domainId || null,
        projectId: project.id,
      },
    };
  }

  if (domain && domain.userId === userId) {
    return { subdomain, domain };
  }

  return { error: 'Project/domain not found for this subdomain' };
}

function sortProductsNewestFirst(items) {
  return (Array.isArray(items) ? items : [])
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
      const bTime = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
      return bTime - aTime;
    });
}

function mergeUniqueProducts(...lists) {
  const byId = new Map();
  for (const list of lists) {
    const items = Array.isArray(list) ? list : [];
    for (const item of items) {
      if (!item || !item.id) continue;
      if (!byId.has(item.id)) byId.set(item.id, item);
    }
  }
  return Array.from(byId.values());
}

function paginateItems(items, pagination = {}) {
  const limitNum = Math.max(1, parseInt(pagination.limit, 10) || 20);
  const pageNum = Math.max(1, parseInt(pagination.page, 10) || 1);
  const total = items.length;
  const start = (pageNum - 1) * limitNum;
  const slice = items.slice(start, start + limitNum);
  return {
    items: slice,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  };
}

exports.getAll = async (req, res) => {
  try {
    const { status, search, page, limit, subdomain, scope } = req.query;
    const headerProjectId = String(req.headers['x-project-id'] || '').trim();
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const wantsGlobalScope = String(scope || '').toLowerCase() === 'all';

    if (isAdmin && wantsGlobalScope) {
      const filters = {};
      if (status) filters.status = status;
      if (search) filters.search = search;
      if (subdomain) filters.subdomain = Product.normalizeSubdomain(subdomain);
      const result = await Product.findAllGlobal(filters, { page, limit });
      return res.status(200).json({ success: true, ...result });
    }

    // Explicit subdomain query always wins (legacy behavior).
    if (subdomain) {
      const owned = await resolveOwnedDomain(req.user.id, subdomain);
      if (owned.error) {
        return res.status(400).json({ success: false, message: owned.error });
      }
      // Controller already verified ownership; read directly from the subdomain bucket
      // (published_subdomains/{subdomain}/products) even if the published_subdomains lookup doc is missing.
      const subdomainResult = await Product.findAllForSubdomain(
        { subdomain: owned.subdomain, status, search },
        { page, limit }
      );

      // Back-compat: if UI sends a project scope header too, include any project-scoped
      // products for the same project (some older flows could create under project scope
      // even after a subdomain was assigned).
      if (headerProjectId) {
        const selectedProject = await Project.get(req.user.id, headerProjectId);
        const selectedProjectSubdomain = Product.normalizeSubdomain(selectedProject?.subdomain || '');
        if (selectedProject && selectedProjectSubdomain && selectedProjectSubdomain === owned.subdomain) {
          const projectResult = await Product.findAllForProject(
            { userId: req.user.id, projectId: headerProjectId, status, search },
            // Fetch full set (model paginates in-memory). We'll paginate after merging.
            { page: 1, limit: 10000 }
          );
          const merged = sortProductsNewestFirst(
            mergeUniqueProducts(subdomainResult.items, projectResult.items)
          );
          const paged = paginateItems(merged, { page, limit });
          return res.status(200).json({ success: true, ...paged });
        }
      }

      return res.status(200).json({ success: true, ...subdomainResult });
    }

    // If dashboard sent an active project scope header, prefer that project's storage:
    // - if project has a subdomain, keep using subdomain-scoped products (back-compat)
    // - if no subdomain yet, use project-scoped products so clients can add products pre-publish
    if (headerProjectId) {
      const selectedProject = await Project.get(req.user.id, headerProjectId);
      if (!selectedProject) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const selectedProjectSubdomain = Product.normalizeSubdomain(selectedProject?.subdomain || '');
      if (selectedProjectSubdomain) {
        const owned = await resolveOwnedDomain(req.user.id, selectedProjectSubdomain);
        if (owned.error) {
          return res.status(400).json({ success: false, message: owned.error });
        }
        const subdomainResult = await Product.findAllForSubdomain(
          { subdomain: owned.subdomain, status, search },
          { page, limit }
        );

        // Include project-scoped products too (see note above).
        const projectResult = await Product.findAllForProject(
          { userId: req.user.id, projectId: headerProjectId, status, search },
          { page: 1, limit: 10000 }
        );
        const merged = sortProductsNewestFirst(
          mergeUniqueProducts(subdomainResult.items, projectResult.items)
        );
        const paged = paginateItems(merged, { page, limit });
        return res.status(200).json({ success: true, ...paged });
      }

      const result = await Product.findAllForProject(
        { userId: req.user.id, projectId: headerProjectId, status, search },
        { page, limit }
      );
      return res.status(200).json({ success: true, ...result });
    }

    // Fallback: list across all owned subdomains (legacy behavior).
    const result = await Product.findAllForUser({ userId: req.user.id, status, search }, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const headerProjectId = String(req.headers['x-project-id'] || '').trim();
    const isId = idOrSlug.length >= 20 && !idOrSlug.includes('-');

    let product = null;
    if (headerProjectId) {
      product = isId
        ? await Product.findByIdForProject(idOrSlug, req.user.id, headerProjectId)
        : await Product.findBySlugForProject(idOrSlug, req.user.id, headerProjectId);
    }

    // If caller is scoped to a project that has a subdomain, also try the subdomain bucket.
    if (!product && headerProjectId && isId) {
      const project = await Project.get(req.user.id, headerProjectId);
      const projectSubdomain = Product.normalizeSubdomain(project?.subdomain || '');
      if (projectSubdomain) {
        product = await Product.findByIdForSubdomain(idOrSlug, projectSubdomain);
      }
    }

    if (!product) {
      product = isId
        ? await Product.findByIdForUser(idOrSlug, req.user.id)
        : await Product.findBySlugForUser(idOrSlug, req.user.id, req.query.subdomain);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      slug,
      description,
      price,
      basePrice,
      costPrice,
      finalPrice,
      compareAtPrice,
      discount,
      discountType,
      hasVariants,
      variants,
      variantStocks,
      variantPrices,
      priceRangeMin,
      priceRangeMax,
      images,
      status,
      stock,
      onHandStock,
      reservedStock,
      lowStockThreshold,
      subcategory,
      subCategory,
      sub_category,
      subdomain,
      projectId,
    } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const baseData = {
      name,
      sku: sku || '',
      category: category || '',
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || '',
      price: price ?? 0,
      basePrice: basePrice ?? null,
      costPrice: costPrice ?? null,
      finalPrice: finalPrice ?? null,
      compareAtPrice: compareAtPrice ?? null,
      discount: discount ?? 0,
      discountType: discountType || 'percentage',
      hasVariants: hasVariants !== undefined ? !!hasVariants : (Array.isArray(variants) && variants.length > 0),
      variants: Array.isArray(variants) ? variants : [],
      variantStocks: variantStocks && typeof variantStocks === 'object' ? variantStocks : {},
      variantPrices: variantPrices && typeof variantPrices === 'object' ? variantPrices : {},
      priceRangeMin: priceRangeMin ?? null,
      priceRangeMax: priceRangeMax ?? null,
      images: Array.isArray(images) ? images : [],
      status: status || 'draft',
      subcategory: String(subcategory ?? subCategory ?? sub_category ?? '').trim(),
      stock: stock ?? null,
      onHandStock: onHandStock ?? undefined,
      reservedStock: reservedStock ?? undefined,
      lowStockThreshold: lowStockThreshold ?? undefined,
    };

    let data = null;

    // Legacy path: subdomain-scoped products.
    if (subdomain) {
      const owned = await resolveOwnedDomain(req.user.id, subdomain);
      if (owned.error) {
        return res.status(400).json({ success: false, message: owned.error });
      }

      data = await Product.createForSubdomain({
        subdomain: owned.subdomain,
        userId: req.user.id,
        projectId: owned.domain.projectId || null,
        domainId: owned.domain.id || owned.domain.domainId || null,
        data: baseData,
      });
    } else {
      // New path: project-scoped products (for draft projects without subdomain).
      const headerProjectId = String(req.headers['x-project-id'] || '').trim();
      const effectiveProjectId = String(projectId || headerProjectId || '').trim();
      if (!effectiveProjectId) {
        return res.status(400).json({ success: false, message: 'subdomain or projectId is required' });
      }
      const project = await Project.get(req.user.id, effectiveProjectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // If the project already has a subdomain, keep products in the subdomain bucket
      // so reads (which prefer subdomain for published sites) see the newly created product.
      const projectSubdomain = Product.normalizeSubdomain(project?.subdomain || '');
      if (projectSubdomain) {
        const owned = await resolveOwnedDomain(req.user.id, projectSubdomain);
        if (owned.error) {
          return res.status(400).json({ success: false, message: owned.error });
        }
        data = await Product.createForSubdomain({
          subdomain: owned.subdomain,
          userId: req.user.id,
          projectId: owned.domain.projectId || effectiveProjectId || null,
          domainId: owned.domain.id || owned.domain.domainId || null,
          data: baseData,
        });
      } else {
        data = await Product.createForProject({
          userId: req.user.id,
          projectId: effectiveProjectId,
          data: baseData,
        });
      }
    }

    try {
      const notif = await Notification.create({
        title: 'Product Created',
        message: `${req.user.name} created product: ${name}`,
        type: 'success',
        adminId: req.user.id,
        adminName: req.user.name
      });
      if (req.app.get('io')) req.app.get('io').emit('notification:added', notif);
    } catch (e) {
      log.warn('Product creation notification failed:', e.message);
    }

    res.status(201).json({ success: true, message: 'Product created', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      slug,
      description,
      price,
      basePrice,
      costPrice,
      finalPrice,
      compareAtPrice,
      discount,
      discountType,
      hasVariants,
      variants,
      variantStocks,
      variantPrices,
      priceRangeMin,
      priceRangeMax,
      images,
      status,
      stock,
      onHandStock,
      reservedStock,
      lowStockThreshold,
      subcategory,
      subCategory,
      sub_category,
    } = req.body;
    const headerProjectId = String(req.headers['x-project-id'] || '').trim();
    const existingInProject = headerProjectId
      ? await Product.findByIdForProject(req.params.id, req.user.id, headerProjectId)
      : null;

    let existingInSubdomain = null;
    if (!existingInProject && headerProjectId) {
      const project = await Project.get(req.user.id, headerProjectId);
      const projectSubdomain = Product.normalizeSubdomain(project?.subdomain || '');
      if (projectSubdomain) {
        existingInSubdomain = await Product.findByIdForSubdomain(req.params.id, projectSubdomain);
      }
    }

    const existing =
      existingInProject ||
      existingInSubdomain ||
      await Product.findByIdForUser(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (sku !== undefined) updates.sku = sku;
    if (category !== undefined) updates.category = category;
    if (
      subcategory !== undefined ||
      subCategory !== undefined ||
      sub_category !== undefined
    ) {
      updates.subcategory = String(subcategory ?? subCategory ?? sub_category ?? '').trim();
    }
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = price;
    if (basePrice !== undefined) updates.basePrice = basePrice;
    if (costPrice !== undefined) updates.costPrice = costPrice;
    if (finalPrice !== undefined) updates.finalPrice = finalPrice;
    if (compareAtPrice !== undefined) updates.compareAtPrice = compareAtPrice;
    if (discount !== undefined) updates.discount = discount;
    if (discountType !== undefined) updates.discountType = discountType;
    if (hasVariants !== undefined) updates.hasVariants = hasVariants;
    if (variants !== undefined) updates.variants = variants;
    if (variantStocks !== undefined) updates.variantStocks = variantStocks && typeof variantStocks === 'object' ? variantStocks : {};
    if (variantPrices !== undefined) updates.variantPrices = variantPrices && typeof variantPrices === 'object' ? variantPrices : {};
    if (priceRangeMin !== undefined) updates.priceRangeMin = priceRangeMin;
    if (priceRangeMax !== undefined) updates.priceRangeMax = priceRangeMax;
    if (images !== undefined) updates.images = Array.isArray(images) ? images : [];
    if (status !== undefined) updates.status = status;
    if (stock !== undefined) updates.stock = stock;
    if (onHandStock !== undefined) updates.onHandStock = onHandStock;
    if (reservedStock !== undefined) updates.reservedStock = reservedStock;
    if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;

    const data = existingInProject
      ? await Product.updateForProject(req.params.id, req.user.id, headerProjectId, updates)
      : existingInSubdomain
        ? await Product.updateForSubdomain(req.params.id, existingInSubdomain.subdomain, updates)
        : await Product.updateForUser(req.params.id, req.user.id, updates);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (images !== undefined) {
      const previousImages = Array.isArray(existing.images) ? existing.images.filter((img) => typeof img === 'string') : [];
      const nextImages = Array.isArray(updates.images) ? updates.images : [];
      const nextSet = new Set(nextImages);
      const removedImages = previousImages.filter((img) => !nextSet.has(img));

      if (removedImages.length > 0) {
        try {
          await deleteStorageFilesByUrls(removedImages, {
            allowedPrefixes: getAllowedProductImagePrefixes(req.user.id),
          });
        } catch (err) {
          log.warn('[productController.update] image cleanup failed:', err.message);
        }
      }
    }

    res.status(200).json({ success: true, message: 'Product updated', data });

    try {
      const notif = await Notification.create({
        title: 'Product Updated',
        message: `${req.user.name} updated product: ${data.name || req.params.id}`,
        type: 'info',
        adminId: req.user.id,
        adminName: req.user.name
      });
      if (req.app.get('io')) req.app.get('io').emit('notification:added', notif);
    } catch (e) {
      log.warn('Product update notification failed:', e.message);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No image uploaded. Use field name "image".' });
    }

    const mimeType = req.file.mimetype || '';
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'Only image files are allowed.' });
    }

    let normalizedSubdomain = '';
    if (req.body?.subdomain !== undefined) {
      const rawSubdomain = String(req.body.subdomain || '');
      const owned = await resolveOwnedDomain(req.user.id, rawSubdomain);
      if (owned.error) {
        return res.status(400).json({ success: false, message: owned.error });
      }
      normalizedSubdomain = owned.subdomain;
    }

    const url = await uploadProductImage({
      buffer: req.file.buffer,
      userId: req.user.id,
      mimeType,
      originalName: req.file.originalname || 'product-image',
      subdomain: normalizedSubdomain,
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded',
      url,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Image upload failed', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const headerProjectId = String(req.headers['x-project-id'] || '').trim();
    const existingInProject = headerProjectId
      ? await Product.findByIdForProject(req.params.id, req.user.id, headerProjectId)
      : null;

    let existingInSubdomain = null;
    if (!existingInProject && headerProjectId) {
      const project = await Project.get(req.user.id, headerProjectId);
      const projectSubdomain = Product.normalizeSubdomain(project?.subdomain || '');
      if (projectSubdomain) {
        existingInSubdomain = await Product.findByIdForSubdomain(req.params.id, projectSubdomain);
      }
    }

    const existing =
      existingInProject ||
      existingInSubdomain ||
      await Product.findByIdForUser(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const deleted = existingInProject
      ? await Product.deleteByIdForProject(req.params.id, req.user.id, headerProjectId)
      : existingInSubdomain
        ? await Product.deleteByIdForSubdomain(req.params.id, existingInSubdomain.subdomain)
        : await Product.deleteByIdForUser(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existingImages = Array.isArray(existing.images) ? existing.images.filter((img) => typeof img === 'string') : [];
    if (existingImages.length > 0) {
      try {
        await deleteStorageFilesByUrls(existingImages, {
          allowedPrefixes: getAllowedProductImagePrefixes(req.user.id),
        });
      } catch (err) {
        log.warn('[productController.delete] image cleanup failed:', err.message);
      }
    }

    res.status(200).json({ success: true, message: 'Product deleted' });

    try {
      const notif = await Notification.create({
        title: 'Product Deleted',
        message: `${req.user.name} deleted product: ${existing.name || req.params.id}`,
        type: 'warning',
        adminId: req.user.id,
        adminName: req.user.name
      });
      if (req.app.get('io')) req.app.get('io').emit('notification:added', notif);
    } catch (e) {
      log.warn('Product deletion notification failed:', e.message);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};

exports.adminDelete = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const deleteReason = String(reason || '').trim();
    if (!deleteReason) {
      return res.status(400).json({ success: false, message: 'Deletion reason is required' });
    }

    const existing = await Product.findByIdGlobal(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const deleted = await Product.deleteByIdGlobal(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const owner = existing.userId ? await User.findById(existing.userId) : null;
    const ownerEmail = owner?.email || '';
    let emailSent = false;
    let emailError = '';

    if (ownerEmail) {
      const mail = await sendAdminActionEmail({
        to: ownerEmail,
        name: owner?.displayName || owner?.fullName || owner?.email || 'Client',
        subject: 'Product removed by admin',
        title: 'Your product was removed',
        intro: `Product \"${existing.name || 'Untitled Product'}\" was removed by an administrator.`,
        reason: deleteReason,
      });
      emailSent = !!mail?.sent;
      emailError = mail?.error || '';
    } else {
      emailError = 'Recipient email not found';
    }

    // Real-time notification
    try {
      const notif = await Notification.create({
        title: 'Product Removed',
        message: `Admin removed product: ${existing.name || req.params.id}`,
        type: 'error',
        adminId: req.user?.id || 'admin',
        adminName: req.user.name || req.user.email || 'Administrator'
      });
      if (req.app.get('io')) req.app.get('io').emit('notification:added', notif);
    } catch (e) {
      log.warn('Product removal notification failed:', e.message);
    }

    res.status(200).json({ success: true, message: 'Product deleted', data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};
