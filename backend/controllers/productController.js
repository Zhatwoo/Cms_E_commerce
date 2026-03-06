const Product = require('../models/Product');
const Domain = require('../models/Domain');
const Project = require('../models/Project');
const { uploadProductImage, deleteStorageFilesByUrls } = require('../utils/storageHelpers');

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

exports.getAll = async (req, res) => {
  try {
    const { status, search, page, limit, subdomain } = req.query;
    const headerProjectId = String(req.headers['x-project-id'] || '').trim();
    const filters = { userId: req.user.id };
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (!subdomain && headerProjectId) {
      const selectedProject = await Project.get(req.user.id, headerProjectId);
      const selectedProjectSubdomain = Product.normalizeSubdomain(selectedProject?.subdomain || '');
      if (selectedProjectSubdomain) {
        const owned = await resolveOwnedDomain(req.user.id, selectedProjectSubdomain);
        if (!owned.error) {
          filters.subdomain = owned.subdomain;
        }
      }
    }
    if (subdomain) {
      const owned = await resolveOwnedDomain(req.user.id, subdomain);
      if (owned.error) {
        return res.status(400).json({ success: false, message: owned.error });
      }
      filters.subdomain = owned.subdomain;
    }
    const result = await Product.findAllForUser(filters, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isId = idOrSlug.length >= 20 && !idOrSlug.includes('-');
    const product = isId
      ? await Product.findByIdForUser(idOrSlug, req.user.id)
      : await Product.findBySlugForUser(idOrSlug, req.user.id, req.query.subdomain);

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
      priceRangeMin,
      priceRangeMax,
      images,
      status,
      stock,
      onHandStock,
      reservedStock,
      lowStockThreshold,
      subdomain,
    } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const owned = await resolveOwnedDomain(req.user.id, subdomain);
    if (owned.error) {
      return res.status(400).json({ success: false, message: owned.error });
    }

    const data = await Product.createForSubdomain({
      subdomain: owned.subdomain,
      userId: req.user.id,
      projectId: owned.domain.projectId || null,
      domainId: owned.domain.id || owned.domain.domainId || null,
      data: {
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
        priceRangeMin: priceRangeMin ?? null,
        priceRangeMax: priceRangeMax ?? null,
        images: Array.isArray(images) ? images : [],
        status: status || 'draft',
        stock: stock ?? null,
        onHandStock: onHandStock ?? undefined,
        reservedStock: reservedStock ?? undefined,
        lowStockThreshold: lowStockThreshold ?? undefined,
      },
    });

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
      priceRangeMin,
      priceRangeMax,
      images,
      status,
      stock,
      onHandStock,
      reservedStock,
      lowStockThreshold,
    } = req.body;
    const existing = await Product.findByIdForUser(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (sku !== undefined) updates.sku = sku;
    if (category !== undefined) updates.category = category;
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
    if (priceRangeMin !== undefined) updates.priceRangeMin = priceRangeMin;
    if (priceRangeMax !== undefined) updates.priceRangeMax = priceRangeMax;
    if (images !== undefined) updates.images = Array.isArray(images) ? images : [];
    if (status !== undefined) updates.status = status;
    if (stock !== undefined) updates.stock = stock;
    if (onHandStock !== undefined) updates.onHandStock = onHandStock;
    if (reservedStock !== undefined) updates.reservedStock = reservedStock;
    if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;

    const data = await Product.updateForUser(req.params.id, req.user.id, updates);
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
          console.warn('[productController.update] image cleanup failed:', err.message);
        }
      }
    }

    res.status(200).json({ success: true, message: 'Product updated', data });
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
    const existing = await Product.findByIdForUser(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const deleted = await Product.deleteByIdForUser(req.params.id, req.user.id);
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
        console.warn('[productController.delete] image cleanup failed:', err.message);
      }
    }

    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};
