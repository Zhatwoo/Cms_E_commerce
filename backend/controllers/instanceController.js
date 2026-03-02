const Instance = require('../models/Instance');
const Project = require('../models/Project');

exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    let instances = await Instance.list(userId);

    // Legacy recovery:
    // Before instance model existed, each website lived directly as a project.
    // If projects have no instanceId, recreate instances from those legacy projects.
    const legacyProjects = await Project.list(userId);
    const unassigned = legacyProjects.filter((project) => !project.instanceId);

    if (instances.length === 0 && unassigned.length > 0) {
      for (const project of unassigned) {
        const created = await Instance.create(userId, {
          title: project.title || 'Recovered Instance',
          subdomain: project.subdomain || null,
        });
        await Project.update(userId, project.id, { instanceId: created.id });
      }
      instances = await Instance.list(userId);
    }

    res.status(200).json({
      success: true,
      instances,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, subdomain } = req.body;
    const instance = await Instance.create(userId, {
      title: title || 'Untitled Instance',
      subdomain: subdomain || null,
    });

    res.status(201).json({
      success: true,
      message: 'Instance created',
      instance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user.id;
    const existing = await Instance.get(userId, req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found',
      });
    }

    const { title, subdomain } = req.body;
    const instance = await Instance.update(userId, req.params.id, {
      ...(title !== undefined && { title }),
      ...(subdomain !== undefined && { subdomain }),
    });

    res.status(200).json({
      success: true,
      message: 'Instance updated',
      instance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const userId = req.user.id;
    const instanceId = req.params.id;
    const existing = await Instance.get(userId, instanceId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found',
      });
    }

    const attachedProjects = await Project.list(userId, { instanceId });
    if (attachedProjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete instance with existing projects. Move or delete its projects first.',
      });
    }

    await Instance.delete(userId, instanceId);
    res.status(200).json({
      success: true,
      message: 'Instance deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
