// controllers/pageController.js
const Page = require('../models/Page');
const { db } = require('../config/firebase');
const { resolveProjectOwner } = require('../utils/resolveProjectOwner');
const log = require('../utils/logger')('pageController');

const COLLAB_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

/**
 * Template library projects are intentionally shareable across accounts.
 * When normal ownership/collaboration checks fail, allow read-only access
 * for projects explicitly marked as status=template.
 */
async function resolveTemplateLibraryAccess(projectId) {
  try {
    const projectSnap = await db.collectionGroup('projects').get();
    const templateDoc = projectSnap.docs.find((doc) => {
      if (doc.id !== projectId) return false;
      const data = doc.data() || {};
      const status = String(data.status || '').trim().toLowerCase();
      return status === 'template';
    });

    if (!templateDoc) return null;
    const ownerId = templateDoc.ref.parent?.parent?.id;
    if (!ownerId) return null;

    return { ownerId, permission: 'viewer', isTemplateLibrary: true };
  } catch (err) {
    log.warn('[PageController] resolveTemplateLibraryAccess failed:', err.message);
    return null;
  }
}

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
    log.debug(`[PageController] Auto-registered public user ${userId} (${userEmail}) as ${role} in project ${projectId}`);
  } catch (err) {
    log.warn('[PageController] ensurePublicCollaborator failed:', err.message);
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
        log.warn('[pageController.getDraft] template library fallback failed:', err.message);
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

    // Guard: prevent overwriting real content with empty/starter canvas payloads
    const isEffectivelyEmptyContent = (value) => {
      if (!value || typeof value !== 'object') return true;

      // Craft.js shape: { ROOT, ...nodes }
      if (value.ROOT && typeof value.ROOT === 'object') {
        const rootNodes = Array.isArray(value.ROOT.nodes) ? value.ROOT.nodes : [];
        if (rootNodes.length === 0) return true;

        const hasMeaningfulPageChild = rootNodes.some((pageId) => {
          const page = value[pageId];
          if (!page || typeof page !== 'object') return false;
          const pageChildren = Array.isArray(page.nodes) ? page.nodes : [];
          if (pageChildren.length === 0) return false;
          if (pageChildren.length > 1) return true;

          const onlyChild = value[pageChildren[0]];
          if (!onlyChild || typeof onlyChild !== 'object') return false;
          const onlyChildChildren = Array.isArray(onlyChild.nodes) ? onlyChild.nodes : [];
          if (onlyChildChildren.length > 0) return true;

          const childName = String(
            onlyChild.displayName ||
            (onlyChild.type && (onlyChild.type.resolvedName || onlyChild.type)) ||
            ''
          ).trim().toLowerCase();

          return childName && !['container', 'section', 'page', 'viewport'].includes(childName);
        });

        return !hasMeaningfulPageChild;
      }

      // Clean document shape: { version, pages, nodes }
      if (value.nodes && typeof value.nodes === 'object') {
        const nodeEntries = Object.entries(value.nodes);
        if (nodeEntries.length === 0) return true;

        const meaningfulNodeExists = nodeEntries.some(([, node]) => {
          if (!node || typeof node !== 'object') return false;
          const typeName = String(node.type || '').trim().toLowerCase();
          const children = Array.isArray(node.children) ? node.children : [];
          if (children.length > 0) return true;
          return typeName && !['container', 'section', 'page', 'viewport'].includes(typeName);
        });

        return !meaningfulNodeExists;
      }

      return false;
    };

    let parsedContent;
    try {
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    } catch { parsedContent = null; }

    const isIncomingEmpty = isEffectivelyEmptyContent(parsedContent);

    if (isIncomingEmpty) {
      const existing = await Page.getPageData(ownerId, projectId, ownerId);
      if (existing && existing.content) {
        let existingParsed;
        try {
          existingParsed = typeof existing.content === 'string'
            ? JSON.parse(existing.content) : existing.content;
        } catch { existingParsed = null; }
        if (!isEffectivelyEmptyContent(existingParsed)) {
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
    log.error('❌ Auto-save controller error:', error);
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

    if (!resolved) {
      resolved = await resolveTemplateLibraryAccess(projectId);
    }

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
        log.warn('[pageController.getDraft] admin project lookup failed:', err.message);
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
    log.error('❌ Get draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all pages for a project (used for templates)
// @route   GET /api/pages/draft/all
// @access  Private
exports.getAllDrafts = async (req, res) => {
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

    if (!resolved) {
      resolved = await resolveTemplateLibraryAccess(projectId);
    }

    // Admin moderation views may request previews for projects they do not directly own/collaborate on.
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
        log.warn('[pageController.getAllDrafts] admin project lookup failed:', err.message);
      }
    }

    if (!resolved) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }

    // Auto-register public-link users as collaborators
    if (resolved.isPublic) {
      await ensurePublicCollaborator(resolved.ownerId, projectId, userId, userEmail, resolved.permission);
    }

    const { ownerId } = resolved;
    const allPages = await Page.getAllPageData(ownerId, projectId);

    res.status(200).json({
      success: true,
      data: allPages
    });
  } catch (error) {
    log.error('❌ Get all drafts error:', error);
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
    log.error('❌ Delete draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

