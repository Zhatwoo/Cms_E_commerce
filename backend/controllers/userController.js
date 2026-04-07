// controllers/userController.js
const User = require('../models/User');
const { auth } = require('../config/firebase');
const { sendAdminActionEmail } = require('../utils/emailService');

const cache = require('../utils/cache');

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
    const cacheKey = `users_${search || ''}_${role || ''}_${status || ''}_${page}_${limit}`;
    
    // Attempt cache retrieval
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({ ...cachedData, fromCache: true });
    }

    const { users, total, totalPages } = await User.findPaged({
      search,
      role,
      status,
      page,
      limit
    });

    const responseData = {
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages,
      users: users.map(stripPassword)
    };

    // Cache for 2 minutes to handle bursts
    cache.set(cacheKey, responseData, 120);

    res.status(200).json(responseData);
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

    const normalizedRole = (role && typeof role === 'string') ? role.toLowerCase().replace(/\s+/g, '_') : 'client';
    if (!['admin', 'support', 'client', 'super_admin'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be admin, support, client, or super_admin' });
    }
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: normalizedRole,
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
    const { name, email, role, status, phone, bio, avatar, isActive, subscriptionPlan } = req.body;
    const nextPassword = typeof req.body.password === 'string' ? req.body.password.trim() : '';
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
    if (subscriptionPlan !== undefined) updates.subscriptionPlan = subscriptionPlan;

    if (nextPassword && nextPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const authUpdates = {};
    if (email !== undefined) authUpdates.email = email.toLowerCase();
    if (nextPassword) authUpdates.password = nextPassword;
    if (Object.keys(authUpdates).length > 0) {
      await auth.updateUser(req.params.id, authUpdates);
    }

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

// @desc    Update client subscription plan
// @route   PUT /api/users/:id/plan
// @access  Private/Admin
exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const allowed = ['free', 'basic', 'pro'];
    const normalized = (plan || '').toString().trim().toLowerCase();
    if (!allowed.includes(normalized)) {
      return res.status(400).json({ success: false, message: `Invalid plan. Must be: ${allowed.join(', ')}` });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const updated = await User.update(req.params.id, { subscriptionPlan: normalized });
    res.status(200).json({ success: true, message: 'Subscription plan updated', user: stripPassword(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
    const normalized = role.toLowerCase().replace(/\s+/g, '_');
    if (!['admin', 'support', 'client', 'super_admin'].includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, support, client, or super_admin'
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
    const { status, suspensionReason } = req.body;
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

    const reason = typeof suspensionReason === 'string' ? suspensionReason.trim() : '';
    const updated = await User.update(req.params.id, {
      status,
      isActive: status === 'Published',
      suspensionReason: status === 'Suspended' ? reason : ''
    });

    let emailSent = false;
    let emailError = '';
    if (status === 'Suspended') {
      let recipientEmail = String(user.email || '').trim();
      if (!recipientEmail) {
        try {
          const authUser = await auth.getUser(req.params.id);
          recipientEmail = String(authUser.email || '').trim();
        } catch {
          // keep as empty
        }
      }

      if (recipientEmail) {
        const mail = await sendAdminActionEmail({
          to: recipientEmail,
          name: user.displayName || user.fullName || recipientEmail,
          subject: 'Your account has been suspended',
          title: 'Account Suspension Notice',
          intro: 'Your account was suspended by an administrator.',
          reason: reason || 'No reason provided.',
        });
        emailSent = !!mail?.sent;
        emailError = mail?.error || '';
      } else {
        emailError = 'Recipient email not found';
      }
    }

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

// @desc    Get all admins for chat
// @route   GET /api/users/admins/list
// @access  Private/Admin
exports.getAdmins = async (req, res) => {
  try {
    const { search } = req.query;
    // Get both admin and super_admin types
    const adminsList = await User.findAll({ role: 'admin' });
    const superAdminsList = await User.findAll({ role: 'super_admin' });
    const allUsers = [...adminsList, ...superAdminsList];
    
    let admins = allUsers.map(u => ({
      id: u.id,
      name: u.displayName || u.username || u.email || 'Unknown',
      username: u.username || '',
      email: u.email || '',
      avatar: u.avatar || null
    }));

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      admins = admins.filter(a => {
        const name = (a.name || '').toLowerCase();
        const username = (a.username || '').toLowerCase();
        const email = (a.email || '').toLowerCase();
        return name.includes(searchLower) || username.includes(searchLower) || email.includes(searchLower);
      });
    }

    // Optionally exclude current user
    const currentUserId = req.user?.id;
    if (currentUserId) {
      admins = admins.filter(a => a.id !== currentUserId);
    }

    res.status(200).json({
      success: true,
      data: admins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
