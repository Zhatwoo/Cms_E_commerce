// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token (id is Supabase Auth user id)
// Token from HttpOnly cookie (preferred) or Authorization header
exports.protect = async (req, res, next) => {
  let token =
    req.cookies?.mercato_token ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.get(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }
    if (user.status === 'disabled' || !user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.displayName || user.email,
      role: user.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

// Check if user is admin (role stored in profiles table)
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
};
