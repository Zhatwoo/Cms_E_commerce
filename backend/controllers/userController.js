// controllers/userController.js
const User = require('../models/User');
const { auth } = require('../config/firebase');
const { sendAdminActionEmail } = require('../utils/emailService');

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

    // Real-time notification
    try {
      const notif = await Notification.create({
        title: 'New User Created',
        message: `Admin created user: ${name} (${email})`,
        type: 'info',
        adminId: req.user?.id || 'admin',
        adminName: req.user?.name || 'Admin'
      });
      if (req.app.get('io')) req.app.get('io').emit('notification:added', notif);
    } catch (e) { console.warn('User creation notification failed:', e.message); }

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

    // Handle password update via Firebase Auth
    if (req.body.password && req.body.password.trim().length >= 6) {
      await auth.updateUser(req.params.id, { password: req.body.password.trim() });
    }

    const updated = await User.update(req.params.id, updates);

    // Real-time notification
    try {
      const notif = await Notification.create({
        title: 'User Updated',
        message: `Admin updated profile for: ${updated.name || updated.email}`,
        type: 'info',
        adminId: req.user?.id || 'admin',
        adminName: req.user?.name || 'Admin'
      });
      if (req.app.get('io')) req.app.get('io').emit('notification:added', notif);
    } catch (e) { console.warn('User update notification failed:', e.message); }

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

    // Real-time notification
    try {
      const notif = await Notification.create({
        title: 'User Deleted',
        message: `Admin removed user: ${user.name || user.email}`,
        type: 'error',
        adminId: req.user?.id || 'admin',
        adminName: req.user?.name || 'Admin'
      });
      if (req.app.get('io')) req.app.get('io').emit('notification:added', notif);
    } catch (e) { console.warn('User deletion notification failed:', e.message); }

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

    // Real-time notification
    try {
      const notif = await Notification.create({
        title: 'Role Updated',
        message: `User ${updated.name || updated.email} role changed to ${role}`,
        type: 'info',
        adminId: req.user?.id || 'admin',
        adminName: req.user?.name || 'Admin'
      });
      if (req.app.get('io')) req.app.get('io').emit('notification:added', notif);
    } catch (e) { console.warn('Role update notification failed:', e.message); }

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
