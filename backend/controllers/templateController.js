// controllers/templateController.js
const Template = require('../models/Template');

exports.getAll = async (req, res) => {
  try {
    const items = await Template.findAll();
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, slug, previewImage, comingSoon, sortOrder } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    const data = await Template.create({
      title,
      description: description || '',
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      previewImage: previewImage || null,
      comingSoon: comingSoon === true,
      sortOrder: sortOrder ?? 0
    });
    res.status(201).json({ success: true, message: 'Template created', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    const { title, description, slug, previewImage, comingSoon, sortOrder } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (slug !== undefined) updates.slug = slug;
    if (previewImage !== undefined) updates.previewImage = previewImage;
    if (comingSoon !== undefined) updates.comingSoon = comingSoon;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    const data = await Template.update(req.params.id, updates);
    res.status(200).json({ success: true, message: 'Template updated', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    await Template.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
