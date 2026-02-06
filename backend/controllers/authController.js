// controllers/authController.js
// Users are stored in Firebase Authentication only (not Firestore users collection)
const { getAuth } = require('../config/firebase');
const PasswordReset = require('../models/PasswordReset');
const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'mercato_token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/'
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, { path: '/', httpOnly: true });
};

const authUserToResponse = (userRecord) => {
  if (!userRecord) return null;
  return {
    id: userRecord.uid,
    email: userRecord.email,
    name: userRecord.displayName || userRecord.email || '',
    avatar: userRecord.photoURL || null
  };
};

// @desc    Register new user (saves to Firebase Authentication only)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const auth = getAuth();
    try {
      await auth.getUserByEmail(email.toLowerCase());
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    } catch (e) {
      if (e.code !== 'auth/user-not-found') throw e;
    }

    const userRecord = await auth.createUser({
      email: email.toLowerCase(),
      password,
      displayName: name.trim()
    });

    const token = generateToken(userRecord.uid);
    const user = authUserToResponse(userRecord);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    const code = error.code || (error.errorInfo && error.errorInfo.code);
    const msg = error.message || (error.errorInfo && error.errorInfo.message) || 'Server error';
    if (process.env.NODE_ENV !== 'production') {
      console.error('Register error:', code || msg, error);
    }
    if (code === 'auth/email-already-exists') {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    if (code === 'auth/invalid-email') {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }
    if (code === 'auth/weak-password') {
      return res.status(400).json({ success: false, message: 'Password should be at least 6 characters' });
    }
    if (code === 'auth/operation-not-allowed') {
      return res.status(500).json({ success: false, message: 'Email/password sign-in is not enabled in Firebase Console' });
    }
    // 403: service account missing Service Usage Consumer (or Identity Toolkit API not enabled)
    if (code === 'auth/internal-error' && (String(msg).includes('PERMISSION_DENIED') || String(msg).includes('serviceusage.serviceUsageConsumer'))) {
      return res.status(503).json({
        success: false,
        message: 'Firebase Auth is not fully set up. Grant the service account the "Service Usage Consumer" role in Google Cloud IAM, enable the Identity Toolkit API, then retry in a few minutes.',
        link: 'https://console.developers.google.com/iam-admin/iam?project=cms-e-commerce-75653'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? undefined : msg
    });
  }
};

// @desc    Login user (expects Firebase idToken from frontend)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide idToken (from Firebase sign-in)'
      });
    }

    const auth = getAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const userRecord = await auth.getUser(decoded.uid);

    const token = generateToken(userRecord.uid);
    const user = authUserToResponse(userRecord);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user
    });
  } catch (error) {
    const code = error.code || (error.errorInfo && error.errorInfo.code);
    if (process.env.NODE_ENV !== 'production') {
      console.error('Login error:', code || error.message, error.message);
    }
    const message = code === 'auth/id-token-expired' ? 'Session expired' : code === 'auth/argument-error' ? 'Invalid idToken' : 'Invalid credentials';
    res.status(401).json({ success: false, message });
  }
};

// @desc    Get current logged in user (from Firebase Auth)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const auth = getAuth();
    const userRecord = await auth.getUser(req.user.id);
    res.status(200).json({
      success: true,
      user: authUserToResponse(userRecord)
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
};

// @desc    Logout – clear auth cookie (token stored in HttpOnly cookie)
// @route   POST /api/auth/logout
// @access  Public
exports.logout = (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: 'Logged out' });
};

// @desc    Update user profile (Firebase Auth)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name !== undefined) updates.displayName = name;
    if (avatar !== undefined) updates.photoURL = avatar;

    const auth = getAuth();
    await auth.updateUser(req.user.id, updates);
    const userRecord = await auth.getUser(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: authUserToResponse(userRecord)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Change password (Firebase Auth)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const auth = getAuth();
    await auth.updateUser(req.user.id, { password: newPassword });
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      token: generateToken(req.user.id)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Forgot password (user looked up in Firebase Auth, reset token in Firestore)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const auth = getAuth();
    try {
      const userRecord = await auth.getUserByEmail(email.toLowerCase());
      await PasswordReset.create(userRecord.uid, userRecord.email);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Password reset token created for', userRecord.email);
      }
    } catch (e) {
      if (e.code !== 'auth/user-not-found') throw e;
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, you will receive instructions to reset your password.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Reset password with token (updates Firebase Auth)
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and new password'
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const record = await PasswordReset.findByToken(token);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    if (new Date(record.expiresAt) < new Date()) {
      await PasswordReset.deleteByDocId(record.id);
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired'
      });
    }

    const auth = getAuth();
    await auth.updateUser(record.userId, { password: newPassword });
    await PasswordReset.deleteByDocId(record.id);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
