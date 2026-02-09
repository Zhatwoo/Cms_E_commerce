// controllers/userController.js
const User = require('../models/User');

// No password in profiles, but strip passwordHash if present
const stripPassword = (user) => {
  if (!user) return user;
  const { password, passwordHash, ...rest } = user;
  return rest;
};

// @desc    Get all users with filters
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    const filters = {};
    if (role) filters.role = role;
    if (status) filters.status = status;
    if (search) filters.search = search;

    const allUsers = await User.findAll(filters);
    const total = allUsers.length;
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const pageNum = Math.max(1, parseInt(page) || 1);
    const skip = (pageNum - 1) * limitNum;
    const users = allUsers.slice(skip, skip + limitNum).map(stripPassword);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      user: stripPassword(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, status, phone, bio, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Client',
      status: status || 'Published',
      phone,
      bio,
      avatar
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: stripPassword(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, status, phone, bio, avatar, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email.toLowerCase();
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await User.update(req.params.id, updates);
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: stripPassword(updated)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await User.delete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const normalized = role.toLowerCase();
    if (!['admin', 'support', 'client'].includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, support, or client'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updated = await User.update(req.params.id, { role });
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: stripPassword(updated)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Published', 'Restricted', 'Suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Published, Restricted, or Suspended'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updated = await User.update(req.params.id, {
      status,
      isActive: status === 'Published'
    });
    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      user: stripPassword(updated)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res) => {
  try {
    const stats = await User.getStats();
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
