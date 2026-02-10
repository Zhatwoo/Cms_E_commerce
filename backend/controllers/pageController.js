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

// @desc    Auto-save page content (upsert user's draft at specific path)
// @route   POST /api/pages/autosave
// @access  Private
exports.autoSave = async (req, res) => {
  console.log('👉 Controller: autoSave called for user:', req.user ? req.user.id : 'unknown');
  try {
    const { content, projectId } = req.body;
    const userId = req.user.id;

    if (content === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Save to specific path: /user/roles/client/{userId}/projects/{projectId}/pages/{userId}
    // Using userId as pageId as per requirement
    const updated = await Page.savePageData(userId, projectId, userId, content);

    console.log(`✅ Auto-saved to project ${projectId} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Auto-saved',
      data: updated
    });
  } catch (error) {
    console.error('❌ Auto-save controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Auto-save failed',
      error: error.message
    });
  }
};

// @desc    Get user's draft page from specific path
// @route   GET /api/pages/draft
// @access  Private
exports.getDraft = async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const userId = req.user.id;
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    const draft = await Page.getPageData(userId, projectId, userId);

    if (!draft) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    // Ensure content is returned as string if it's an object,
    // to match what frontend likely expects for JSON.parse, 
    // OR send object and update frontend. 
    // Plan says "Sanitization: Ensure content in Firestore is a nested Map... Frontend needs to handle this".
    // I will return it as is (Object) and update frontend to handle it.

    res.status(200).json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('❌ Get draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user's draft page
// @route   DELETE /api/pages/draft
// @access  Private
exports.deleteDraft = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.query; // or body

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    await Page.deletePageData(userId, projectId, userId);
    console.log(`🗑️ Deleted draft for project ${projectId} user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Draft deleted'
    });
  } catch (error) {
    console.error('❌ Delete draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

