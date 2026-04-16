const fs = require('fs');
const Project = require('../models/Project');
const User = require('../models/User');
const Domain = require('../models/Domain');
const { deleteProjectStorageFolder, uploadClientMedia, getProjectStorageUsage, deleteStorageFilesByUrls, slugPathSegment, STORAGE_PREFIX } = require('../utils/storageHelpers');
const { getLimits } = require('../utils/subscriptionLimits');
const { getTrashRetentionDays } = require('../utils/trashConfig');
const { resolveProjectOwner } = require('../utils/resolveProjectOwner');
const Notification = require('../models/Notification');

// @desc    List current user's projects
// @route   GET /api/projects
// @access  Private
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const t0 = Date.now();
    console.log('[READ] projects.list start', { userId });
    const owned = await Project.list(userId);
    console.log('[READ] projects.list owned', { count: owned?.length || 0, ms: Date.now() - t0 });

    const t1 = Date.now();
    const shared = await Project.listShared(userId, userEmail);
    console.log('[READ] projects.listShared', { count: shared?.length || 0, ms: Date.now() - t1 });
    console.log('[READ] projects.list total', { owned: owned?.length, shared: shared?.length, totalMs: Date.now() - t0 });

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

// @desc    List shared template library projects (status=template across users)
// @route   GET /api/projects/templates/library
// @access  Private
exports.listTemplateLibrary = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(String(req.query.limit || ''), 10);
    const items = await Project.listTemplateLibrary(Number.isFinite(requestedLimit) ? requestedLimit : 60);

    res.status(200).json({
      success: true,
      templates: items,
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

    // Fetch owned projects to check limits
    const ownedProjects = await Project.list(userId);
    
    const plan = req.user.subscriptionPlan || 'free';
    const limits = getLimits(plan);
    const ownedCount = ownedProjects.length;

    if (ownedCount >= limits.projects) {
      return res.status(403).json({
        success: false,
        message: `Limit reached: Your plan has reached its limit. Please upgrade your subscription to add more domains or projects. Your current ${plan} plan allows up to ${limits.projects} projects.`,
      });
    }

    // If providing a subdomain during creation, check domain limits too
    if (subdomain) {
      const currentDomains = ownedProjects.filter((p) => p.subdomain != null && String(p.subdomain).trim() !== '').length;
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
    try {
      const io = req.app.get('io');
      if (io) {
        const actorName = req.user?.name || req.user?.email || 'Client';
        const notif = await Notification.create({
          title: 'Website Updated',
          message: `${actorName} updated website project: ${project?.title || req.params.id}.`,
          type: 'info',
          adminId: req.user?.id || 'system',
          adminName: actorName,
        });
        io.emit('notification:added', notif);
      }
    } catch (e) {
      console.warn('Project update notification failed:', e.message);
    }
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

    try {
      const io = req.app.get('io');
      if (io) {
        const actorName = req.user?.name || req.user?.email || 'Client';
        const notif = await Notification.create({
          title: 'Website Deleted',
          message: `${actorName} moved website project to trash: ${existing?.title || req.params.id}.`,
          type: 'warning',
          adminId: req.user?.id || 'system',
          adminName: actorName,
        });
        io.emit('notification:added', notif);
      }
    } catch (e) {
      console.warn('Project delete notification failed:', e.message);
    }

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
  const tempPath = req.file?.path;
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();
    const projectId = req.params.id;

    if (!req.file || !req.file.path) {
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
      filePath: req.file.path,
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
  } finally {
    if (tempPath) {
      try {
        fs.unlinkSync(tempPath);
      } catch (unlinkErr) {
        console.warn('[uploadMedia] Failed to remove temp file:', unlinkErr?.message);
      }
    }
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

    try {
      const io = req.app.get('io');
      if (io) {
        const actorName = req.user?.name || req.user?.email || 'Client';
        const notif = await Notification.create({
          title: 'Website Permanently Deleted',
          message: `${actorName} permanently deleted website project: ${projectId}.`,
          type: 'error',
          adminId: req.user?.id || 'system',
          adminName: actorName,
        });
        io.emit('notification:added', notif);
      }
    } catch (e) {
      console.warn('Project permanent-delete notification failed:', e.message);
    }

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

// @desc    Get project storage usage
// @route   GET /api/projects/:id/storage
// @access  Private
exports.getStorageUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();
    const projectId = req.params.id;

    const resolved = await resolveProjectOwner(userId, projectId, userEmail);
    if (!resolved) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const project = await Project.get(resolved.ownerId, projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const owner = await User.get(resolved.ownerId);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
      });
    }
    const clientName = (owner.displayName || owner.username || owner.email || 'client').trim();

    const storageBytes = await getProjectStorageUsage({
      clientName,
      websiteName: project.title,
      userId: resolved.ownerId,
      subdomain: project.subdomain,
      projectId: project.id,
    });

    res.status(200).json({
      success: true,
      storageBytes,
      storageReadable: formatBytes(storageBytes),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete media files
// @route   DELETE /api/projects/:id/media
// @access  Private (owner or editor)
exports.deleteMedia = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();
    const projectId = req.params.id;
    const { urls } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'URLs array is required.',
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
        message: 'Viewers cannot delete media from this project.',
      });
    }

    const project = await Project.get(resolved.ownerId, projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const owner = await User.get(resolved.ownerId);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
      });
    }

    const clientName = (owner.displayName || owner.username || owner.email || 'client').trim();
    const websiteName = project.title;
    const client = slugPathSegment(clientName);
    const website = slugPathSegment(websiteName);
    const prefix = `${STORAGE_PREFIX}${client}/${website}/`;

    const summary = await deleteStorageFilesByUrls(urls, { allowedPrefixes: [prefix] });

    res.status(200).json({
      success: true,
      message: 'Media deleted',
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Delete failed',
      error: error.message,
    });
  }
};

function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = {
  list: exports.list,
  create: exports.create,
  getOne: exports.getOne,
  getBySubdomain: exports.getBySubdomain,
  listTemplateLibrary: exports.listTemplateLibrary,
  update: exports.update,
  delete: exports.delete,
  listTrash: exports.listTrash,
  restore: exports.restore,
  permanentDelete: exports.permanentDelete,
  uploadMedia: exports.uploadMedia,
  deleteMedia: exports.deleteMedia,
  getStorageUsage: exports.getStorageUsage,
};
