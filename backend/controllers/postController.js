// controllers/postController.js
const Post = require('../models/Post');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public (filter by status for public published)
exports.getAll = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    const result = await Post.findAll(filters, { page, limit });
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

// @desc    Get one post by id or slug
// @route   GET /api/posts/:idOrSlug
// @access  Public
exports.getOne = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isId = idOrSlug.length >= 20 && !idOrSlug.includes('-');
    const post = isId ? await Post.findById(idOrSlug) : await Post.findBySlug(idOrSlug);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create post
// @route   POST /api/posts
// @access  Private
exports.create = async (req, res) => {
  try {
    const { title, slug, excerpt, content, status, featuredImage } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    const data = await Post.create({
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      excerpt: excerpt || '',
      content: content || '',
      status: status || 'Draft',
      featuredImage: featuredImage || null,
      authorId: req.user.id
    });
    res.status(201).json({
      success: true,
      message: 'Post created',
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

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.update = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    const { title, slug, excerpt, content, status, featuredImage, publishedAt } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (slug !== undefined) updates.slug = slug;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;
    if (featuredImage !== undefined) updates.featuredImage = featuredImage;
    if (publishedAt !== undefined) updates.publishedAt = publishedAt;
    const data = await Post.update(req.params.id, updates);
    res.status(200).json({
      success: true,
      message: 'Post updated',
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

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.delete = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    await Post.delete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Post deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
