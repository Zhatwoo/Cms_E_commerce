// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token (id is Firebase Auth uid)
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
    const t = Date.now();
    const user = await User.get(decoded.id);
    console.log('[READ] auth User.get', { id: decoded.id, ms: Date.now() - t });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }
    const normalizedStatus = String(user.status || '').toLowerCase();
    if (normalizedStatus === 'suspended' || normalizedStatus === 'restricted' || normalizedStatus === 'disabled' || !user.isActive) {
      const reason = typeof user.suspensionReason === 'string' ? user.suspensionReason.trim() : '';
      return res.status(403).json({
        success: false,
        message: reason
          ? `Your account is currently suspended. Reason: ${reason}. Please contact admin for assistance.`
          : 'Your account is currently suspended. Please contact admin for assistance.'
      });
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.displayName || user.email || 'Administrator',
      role: user.role
    };

    // Update presence - at most once every minute for lastSeen, but immediately recover isOnline when needed.
    const now = Date.now();
    const lastSeenMs = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
    if (now - lastSeenMs > 60000 || user.isOnline !== true) {
      User.update(user.id, { lastSeen: new Date().toISOString(), isOnline: true }).catch(() => {});
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};


exports.admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
};
