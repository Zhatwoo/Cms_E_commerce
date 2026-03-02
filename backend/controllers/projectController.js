const Project = require('../models/Project');
const User = require('../models/User');
const { deleteProjectStorageFolder } = require('../utils/storageHelpers');

// @desc    List current user's projects
// @route   GET /api/projects
// @access  Private
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    const instanceId = (req.query.instanceId || '').toString().trim() || null;
    const projects = await Project.list(userId, { instanceId });
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
    const { title, templateId, subdomain, instanceId } = req.body;
    const project = await Project.create(userId, {
      title: title || 'Untitled Project',
      templateId: templateId || null,
      instanceId: instanceId || null,
      subdomain: subdomain || null,
    });
    res.status(201).json({
      success: true,
      message: 'Project created',
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
    const project = await Project.get(userId, req.params.id);
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
    const { title, status, thumbnail, instanceId } = req.body;
    const project = await Project.update(userId, req.params.id, {
      ...(title !== undefined && { title }),
      ...(status !== undefined && { status }),
      ...(instanceId !== undefined && { instanceId }),
      ...(thumbnail !== undefined && { thumbnail }),
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

// @desc    Delete project (website only — client/user account is never deleted)
// @route   DELETE /api/projects/:id
// @access  Private
exports.delete = async (req, res) => {
  try {
    const userId = req.user.id;
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
      message: 'Website deleted (client account preserved)',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
