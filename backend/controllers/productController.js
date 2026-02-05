// controllers/productController.js
const Product = require('../models/Product');

exports.getAll = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    const result = await Product.findAll(filters, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isId = idOrSlug.length >= 20 && !idOrSlug.includes('-');
    const product = isId ? await Product.findById(idOrSlug) : await Product.findBySlug(idOrSlug);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, slug, description, price, compareAtPrice, images, status, stock } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const data = await Product.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || '',
      price: price ?? 0,
      compareAtPrice: compareAtPrice ?? null,
      images: Array.isArray(images) ? images : [],
      status: status || 'Draft',
      stock: stock ?? null
    });
    res.status(201).json({ success: true, message: 'Product created', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const { name, slug, description, price, compareAtPrice, images, status, stock } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = price;
    if (compareAtPrice !== undefined) updates.compareAtPrice = compareAtPrice;
    if (images !== undefined) updates.images = Array.isArray(images) ? images : [];
    if (status !== undefined) updates.status = status;
    if (stock !== undefined) updates.stock = stock;
    const data = await Product.update(req.params.id, updates);
    res.status(200).json({ success: true, message: 'Product updated', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await Product.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
