// controllers/pageController.js
const Page = require('../models/Page');
const { db } = require('../config/firebase');
const { resolveProjectOwner } = require('../utils/resolveProjectOwner');

const COLLAB_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

/**
 * Auto-registers a public-link user as a collaborator if not already present.
 */
async function ensurePublicCollaborator(ownerId, projectId, userId, userEmail, role) {
  try {
    const collabRef = db
      .collection('user').doc('roles')
      .collection('client').doc(ownerId)
      .collection('projects').doc(projectId)
      .collection('collaborators');

    // Check if already exists
    let existing = await collabRef.where('userId', '==', userId).limit(1).get();
    if (existing.empty && userEmail) {
      existing = await collabRef.where('email', '==', userEmail).limit(1).get();
    }
    if (!existing.empty) return; // Already registered

    // Fetch user details
    let displayName = userEmail?.split('@')[0] || 'User';
    let avatar = null;
    try {
      const userSnap = await db.collection('user').doc('roles').collection('client').doc(userId).get();
      if (userSnap.exists) {
        const d = userSnap.data();
        displayName = d.displayName || d.username || d.name || displayName;
        avatar = d.avatar || null;
      }
    } catch { /* ignore */ }

    // Assign color
    const existingSnap = await collabRef.get();
    const usedColors = existingSnap.docs.map(d => d.data().color).filter(Boolean);
    const color = COLLAB_COLORS.find(c => !usedColors.includes(c)) || COLLAB_COLORS[existingSnap.size % COLLAB_COLORS.length];

    await collabRef.add({
      userId,
      email: userEmail || '',
      displayName,
      name: displayName,
      avatar,
      color,
      role: role || 'viewer',
      status: 'active',
      joinedViaLink: true,
      createdAt: new Date().toISOString(),
    });
    console.log(`[PageController] Auto-registered public user ${userId} (${userEmail}) as ${role} in project ${projectId}`);
  } catch (err) {
    console.warn('[PageController] ensurePublicCollaborator failed:', err.message);
  }
}

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
  try {
    const { content, projectId } = req.body;
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();

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

    const resolved = await resolveProjectOwner(userId, projectId, userEmail);
    if (!resolved) {
      // Template library projects are intentionally shareable across accounts.
      // If the requested project is a template, allow read-only draft access.
      try {
        const projectSnap = await db.collectionGroup('projects').get();
        const templateDoc = projectSnap.docs.find((doc) => {
          if (doc.id !== projectId) return false;
          const data = doc.data() || {};
          const status = String(data.status || '').trim().toLowerCase();
          return status === 'template';
        });

        if (templateDoc) {
          const ownerId = templateDoc.ref.parent?.parent?.id;
          if (ownerId) {
            resolved = { ownerId, permission: 'viewer', isTemplateLibrary: true };
          }
        }
      } catch (err) {
        console.warn('[pageController.getDraft] template library fallback failed:', err.message);
      }
    }

    if (!resolved) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }

    if (resolved.permission === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'Viewers cannot edit this project'
      });
    }

    const { ownerId } = resolved;

    // Guard: prevent overwriting real content with empty canvas
    let parsedContent;
    try {
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    } catch { parsedContent = null; }

    const incomingNodes = parsedContent?.nodes ? Object.keys(parsedContent.nodes) : [];
    const isIncomingEmpty = parsedContent && incomingNodes.length === 0;

    if (isIncomingEmpty) {
      const existing = await Page.getPageData(ownerId, projectId, ownerId);
      if (existing && existing.content) {
        let existingParsed;
        try {
          existingParsed = typeof existing.content === 'string'
            ? JSON.parse(existing.content) : existing.content;
        } catch { existingParsed = null; }
        const existingNodes = existingParsed?.nodes ? Object.keys(existingParsed.nodes) : [];
        if (existingNodes.length > 0) {
          return res.status(200).json({
            success: true,
            message: 'Skipped: not overwriting existing content with empty canvas',
            data: existing
          });
        }
      }
    }

    const updated = await Page.savePageData(ownerId, projectId, ownerId, content);

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
    const userRole = String(req.user.role || '').toLowerCase();
    const userEmail = (req.user.email || '').toLowerCase();
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    let resolved = await resolveProjectOwner(userId, projectId, userEmail);

    // Admin moderation views may request previews for projects they do not directly own/collaborate on.
    // In that case, resolve owner directly by querying all projects and finding a match.
    if (!resolved && (userRole === 'admin' || userRole === 'super_admin')) {
      try {
        const projectSnap = await db
          .collectionGroup('projects')
          .limit(100)
          .get();

        const projectDoc = projectSnap.docs.find((doc) => doc.id === projectId);
        if (projectDoc) {
          const ownerId = projectDoc.ref.parent?.parent?.id;
          if (ownerId) {
            resolved = { ownerId, permission: 'admin' };
          }
        }
      } catch (err) {
        console.warn('[pageController.getDraft] admin project lookup failed:', err.message);
      }
    }

    if (!resolved) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }

    // Auto-register public-link users as collaborators so they appear in People with Access
    if (resolved.isPublic) {
      await ensurePublicCollaborator(resolved.ownerId, projectId, userId, userEmail, resolved.permission);
    }

    const { ownerId } = resolved;
    let draft = await Page.getPageData(ownerId, projectId, ownerId);
    if (!draft) {
      draft = await Page.getPageData(ownerId, projectId, 'draft');
    }

    if (!draft) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

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
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    const userEmail = (req.user.email || '').toLowerCase();
    const resolved = await resolveProjectOwner(userId, projectId, userEmail);
    if (!resolved) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }

    if (resolved.permission === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'Viewers cannot modify this project'
      });
    }

    const { ownerId } = resolved;
    await Page.deletePageData(ownerId, projectId, ownerId);

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

