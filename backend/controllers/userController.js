// controllers/userController.js
const User = require('../models/User');

// @desc    Get all users with filters
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by role
    if (role) {
      query.role = role;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
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
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
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
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create user
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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar
      }
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
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar,
        isActive: user.isActive
      }
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
    
    // Prevent deleting own account
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    await user.deleteOne();
    
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
    
    if (!['Admin', 'Support', 'Client'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be Admin, Support, or Client'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.role = role;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
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
    
    user.status = status;
    user.isActive = status === 'Published';
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        isActive: user.isActive
      }
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
    const totalUsers = await User.countDocuments();
    const publishedUsers = await User.countDocuments({ status: 'Published' });
    const restrictedUsers = await User.countDocuments({ status: 'Restricted' });
    const suspendedUsers = await User.countDocuments({ status: 'Suspended' });
    
    const adminCount = await User.countDocuments({ role: 'Admin' });
    const supportCount = await User.countDocuments({ role: 'Support' });
    const clientCount = await User.countDocuments({ role: 'Client' });
    
    res.status(200).json({
      success: true,
      stats: {
        total: totalUsers,
        byStatus: {
          published: publishedUsers,
          restricted: restrictedUsers,
          suspended: suspendedUsers
        },
        byRole: {
          admin: adminCount,
          support: supportCount,
          client: clientCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};