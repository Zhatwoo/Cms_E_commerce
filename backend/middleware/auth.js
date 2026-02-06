// middleware/auth.js
const jwt = require('jsonwebtoken');
const { getAuth } = require('../config/firebase');

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
    const auth = getAuth();
    const userRecord = await auth.getUser(decoded.id);
    if (userRecord.disabled) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }
    req.user = {
      id: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || userRecord.email
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid token'
    });
  }
};

// Check if user is admin (requires custom claim in Firebase Auth if you use roles)
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
};