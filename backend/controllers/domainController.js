// controllers/domainController.js
const Domain = require('../models/Domain');

// List for current user (protect)
exports.getMyDomains = async (req, res) => {
  try {
    const items = await Domain.findByUserId(req.user.id);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get one by id (owner or admin)
exports.getOne = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }
    if (req.user.role !== 'Admin' && domain.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.status(200).json({ success: true, data: domain });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create (protect)
exports.create = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || !String(domain).trim()) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    const data = await Domain.create({
      userId: req.user.id,
      domain: String(domain).trim().toLowerCase(),
      status: 'Pending'
    });
    res.status(201).json({ success: true, message: 'Domain added', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete (protect, owner only - or admin)
exports.delete = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }
    if (req.user.role !== 'Admin' && domain.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Domain.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Domain deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin: list all domains
exports.getAll = async (req, res) => {
  try {
    const { userId, status } = req.query;
    const filters = {};
    if (userId) filters.userId = userId;
    if (status) filters.status = status;
    const items = await Domain.findAll(filters);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin: update domain status
exports.updateStatus = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }
    const { status } = req.body;
    const allowed = ['Pending', 'Active', 'Error'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status required: ' + allowed.join(', ') });
    }
    const updates = { status };
    if (status === 'Active') updates.verifiedAt = new Date().toISOString();
    const data = await Domain.update(req.params.id, updates);
    res.status(200).json({ success: true, message: 'Domain updated', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
