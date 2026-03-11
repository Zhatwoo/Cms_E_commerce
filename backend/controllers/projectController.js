const Project = require('../models/Project');
const User = require('../models/User');
const Domain = require('../models/Domain');
const { deleteProjectStorageFolder, uploadClientMedia } = require('../utils/storageHelpers');
const { getLimits } = require('../utils/subscriptionLimits');
const { getTrashRetentionDays } = require('../utils/trashConfig');
const { resolveProjectOwner } = require('../utils/resolveProjectOwner');

// @desc    List current user's projects
// @route   GET /api/projects
// @access  Private
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const owned = await Project.list(userId);
    const shared = await Project.listShared(userId, userEmail);

    // Merge and sort by updatedAt desc
    const projects = [...owned, ...shared].sort((a, b) => {
      const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tB - tA;
    });

    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, templateId, subdomain, industry } = req.body || {};

    const normalizedIndustry = (industry || '').toString().trim();
    if (!normalizedIndustry) {
      return res.status(400).json({
        success: false,
        message: 'Industry is required when creating a project.',
      });
    }

    // Check subscription limits
    const user = await User.findById(userId);
    const limits = getLimits(user?.subscriptionPlan);
    const currentProjects = await Project.list(userId);

    if (currentProjects.length >= limits.projects) {
      return res.status(403).json({
        success: false,
        message: `Limit reached: Your plan has reached its limit. Please upgrade your subscription to add more domains or projects. Your current ${user?.subscriptionPlan || 'free'} plan allows up to ${limits.projects} projects.`,
      });
    }

    // If providing a subdomain during creation, check domain limits too
    if (subdomain) {
      const currentDomains = await Project.countWithSubdomain(userId);
      if (currentDomains >= limits.domains) {
        return res.status(403).json({
          success: false,
          message: `Limit reached: Your plan has reached its limit. Please upgrade your subscription to add more domains or projects. Your current ${user?.subscriptionPlan || 'free'} plan allows up to ${limits.domains} domains.`,
        });
      }
    }

    const project = await Project.create(userId, {
      title: title || 'Untitled Project',
      industry: normalizedIndustry,
      templateId: templateId || null,
      subdomain: subdomain || null,
    });
    res.status(201).json({
      success: true,
      message: 'Project created',
      project,
    });
  } catch (error) {
    console.error('[projectController.create]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get one project by subdomain (current user)
// @route   GET /api/projects/by-subdomain?subdomain=boom
// @access  Private
exports.getBySubdomain = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subdomain } = req.query;
    const project = await Project.getBySubdomain(userId, subdomain);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found for this subdomain',
      });
    }
    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get one project by id
// @route   GET /api/projects/:id
// @access  Private
exports.getOne = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();
    const projectId = req.params.id;

    // Try direct ownership first (fast)
    let project = await Project.get(userId, projectId);

    // If not owned, check if user is a collaborator
    if (!project) {
      const resolved = await resolveProjectOwner(userId, projectId, userEmail);
      if (resolved) {
        project = await Project.get(resolved.ownerId, projectId);
        if (project) {
          project.collaboratorPermission = resolved.permission;
          project.isShared = true;
          project.ownerId = resolved.ownerId;
        }
      }
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update project
// @route   PATCH /api/projects/:id
// @access  Private
exports.update = async (req, res) => {
  try {
    const userId = req.user.id;
    const existing = await Project.get(userId, req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    const { title, status, thumbnail, subdomain, industry, general_access, general_access_role } = req.body;
    const project = await Project.update(userId, req.params.id, {
      ...(title !== undefined && { title }),
      ...(status !== undefined && { status }),
      ...(industry !== undefined && { industry }),
      ...(subdomain !== undefined && { subdomain }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(general_access !== undefined && { general_access }),
      ...(general_access_role !== undefined && { general_access_role }),
    });
    res.status(200).json({
      success: true,
      message: 'Project updated',
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    List trashed projects
// @route   GET /api/projects/trash
// @access  Private
exports.listTrash = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.listTrash(userId);
    const retentionDays = getTrashRetentionDays();
    res.status(200).json({
      success: true,
      projects,
      retentionDays,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Restore project from trash
// @route   POST /api/projects/:id/restore
// @access  Private
exports.restore = async (req, res) => {
  try {
    const userId = req.user.id;
    const project = await Project.restore(userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Project restored as draft. Publish again to make the website live.',
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete project (moves to trash)
// @route   DELETE /api/projects/:id
// @access  Private
exports.delete = async (req, res) => {
  try {
    const userId = req.user.id;
    const retentionDays = getTrashRetentionDays();
    const existing = await Project.get(userId, req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    // Delete only the project (website) document — client/user is preserved
    await Project.delete(userId, req.params.id);

    // Delete only this project's folder in Firebase Storage: clients/{client}/{website}/ (not the client folder)
    // Requires backend .env: FIREBASE_STORAGE_BUCKET=cms-e-commerce-75653.firebasestorage.app
    const clientName = req.user.name || 'client';
    let clientNameForStorage = clientName;
    try {
      const user = await User.get(userId);
      if (user) {
        clientNameForStorage = (user.displayName || user.username || user.email || clientName).trim() || clientName;
      }
    } catch {
      // keep clientNameForStorage as req.user.name
    }
    await deleteProjectStorageFolder(clientNameForStorage, existing.title);

    res.status(200).json({
      success: true,
      message: `Project moved to trash. ${retentionDays} day(s) left before auto-delete.`,
      daysLeft: retentionDays,
      retentionDays,
    });
  } catch (error) {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('cannot be deleted') || msg.includes('unpublish')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Upload media for web builder
// @route   POST /api/projects/:id/media
// @access  Private (owner or editor)
exports.uploadMedia = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();
    const projectId = req.params.id;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Use field name "media".',
      });
    }

    const resolved = await resolveProjectOwner(userId, projectId, userEmail);
    if (!resolved) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    if (resolved.permission === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'Viewers cannot upload media to this project.',
      });
    }

    const project = await Project.get(resolved.ownerId, projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    let clientName = req.user.name || 'client';
    try {
      const user = await User.get(userId);
      if (user) {
        clientName = (user.displayName || user.username || user.email || clientName).trim() || clientName;
      }
    } catch {
      // keep clientName from req.user.name
    }

    const websiteName = (project.title || 'project').trim() || 'project';
    const mimeType = req.file.mimetype || 'application/octet-stream';
    const originalName = req.file.originalname || 'file';

    const url = await uploadClientMedia({
      buffer: req.file.buffer,
      mimeType,
      originalName,
      clientName,
      websiteName,
      folder: req.body?.folder || undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Media uploaded',
      url,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed',
      error: error.message,
    });
  }
};

// @desc    Permanently delete project (purges from trash and projects)
// @route   DELETE /api/projects/:id/permanent
// @access  Private
exports.permanentDelete = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    // Verify it exists in trash or projects before deleting
    const inTrash = await Project.getTrashRef(userId).doc(projectId).get();
    const inProjects = await Project.get(userId, projectId);

    if (!inTrash.exists && !inProjects) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in trash or active projects.',
      });
    }

    await Project.permanentDelete(userId, projectId);

    res.status(200).json({
      success: true,
      message: 'Project permanently deleted.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
