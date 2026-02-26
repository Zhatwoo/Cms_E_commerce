const Product = require('../models/Product');
const Domain = require('../models/Domain');

async function resolveOwnedDomain(userId, subdomainInput) {
  const subdomain = Product.normalizeSubdomain(subdomainInput);
  if (!subdomain) return { error: 'subdomain is required' };

  const domain = await Domain.findBySubdomain(subdomain);
  if (!domain) return { error: 'Published domain not found' };
  if (domain.userId !== userId) return { error: 'Access denied for this published domain' };
  return { subdomain, domain };
}

exports.getAll = async (req, res) => {
  try {
    const { status, search, page, limit, subdomain } = req.query;
    const filters = { userId: req.user.id };
    if (status) filters.status = status;
    if (search) filters.search = search;
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
      finalPrice,
      compareAtPrice,
      discount,
      discountType,
      hasVariants,
      variants,
      priceRangeMin,
      priceRangeMax,
      images,
      status,
      stock,
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
        finalPrice: finalPrice ?? null,
        compareAtPrice: compareAtPrice ?? null,
        discount: discount ?? 0,
        discountType: discountType || 'percentage',
        hasVariants: hasVariants !== undefined ? !!hasVariants : (Array.isArray(variants) && variants.length > 0),
        variants: Array.isArray(variants) ? variants : [],
        priceRangeMin: priceRangeMin ?? null,
        priceRangeMax: priceRangeMax ?? null,
        images: Array.isArray(images) ? images : [],
        status: status || 'draft',
        stock: stock ?? null,
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
      finalPrice,
      compareAtPrice,
      discount,
      discountType,
      hasVariants,
      variants,
      priceRangeMin,
      priceRangeMax,
      images,
      status,
      stock,
    } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (sku !== undefined) updates.sku = sku;
    if (category !== undefined) updates.category = category;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = price;
    if (basePrice !== undefined) updates.basePrice = basePrice;
    if (finalPrice !== undefined) updates.finalPrice = finalPrice;
    if (compareAtPrice !== undefined) updates.compareAtPrice = compareAtPrice;
    if (discount !== undefined) updates.discount = discount;
    if (discountType !== undefined) updates.discountType = discountType;
    if (hasVariants !== undefined) updates.hasVariants = hasVariants;
    if (variants !== undefined) updates.variants = variants;
    if (priceRangeMin !== undefined) updates.priceRangeMin = priceRangeMin;
    if (priceRangeMax !== undefined) updates.priceRangeMax = priceRangeMax;
    if (images !== undefined) updates.images = Array.isArray(images) ? images : [];
    if (status !== undefined) updates.status = status;
    if (stock !== undefined) updates.stock = stock;

    const data = await Product.updateForUser(req.params.id, req.user.id, updates);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product updated', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await Product.deleteByIdForUser(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};
