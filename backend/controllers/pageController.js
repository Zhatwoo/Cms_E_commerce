// controllers/pageController.js
const Page = require('../models/Page');

// @desc    Get all pages
// @route   GET /api/pages
// @access  Private (or Public for published only - use query)
exports.getAll = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    const result = await Page.findAll(filters, { page, limit });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get one page by id or slug
// @route   GET /api/pages/:idOrSlug
// @access  Public
exports.getOne = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isId = idOrSlug.length >= 20 && !idOrSlug.includes('-');
    const page = isId ? await Page.findById(idOrSlug) : await Page.findBySlug(idOrSlug);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    res.status(200).json({
      success: true,
      data: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create page
// @route   POST /api/pages
// @access  Private
exports.create = async (req, res) => {
  try {
    const { title, slug, content, status } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    const data = await Page.create({
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      content: content || '',
      status: status || 'Draft',
      createdBy: req.user.id
    });
    res.status(201).json({
      success: true,
      message: 'Page created',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update page
// @route   PUT /api/pages/:id
// @access  Private
exports.update = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    const { title, slug, content, status } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (slug !== undefined) updates.slug = slug;
    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;
    const data = await Page.update(req.params.id, updates);
    res.status(200).json({
      success: true,
      message: 'Page updated',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete page
// @route   DELETE /api/pages/:id
// @access  Private
exports.delete = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    await Page.delete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Page deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
