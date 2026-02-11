
const { auth } = require('../config/firebase');
const PasswordReset = require('../models/PasswordReset');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

const userToResponse = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.displayName || user.email || '',
    avatar: user.avatar || null,
    role: user.role,
    subscriptionPlan: user.subscriptionPlan
  };
};

async function firebaseSignIn(email, password) {
  const rawKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const apiKey = (typeof rawKey === 'string' ? rawKey : '').trim();
  if (!apiKey) return { error: new Error('MISSING_API_KEY'), rawError: { message: 'Backend .env: set FIREBASE_API_KEY (Web API key from Firebase Console)' } };

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
        returnSecureToken: true,
      }),
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('Login fetch error:', err.message);
    return { error: new Error('NETWORK_ERROR'), rawError: { message: err.message } };
  }

  const data = await res.json().catch(() => ({}));
  if (data.error) {
    const message = (data.error.message || '').trim() || 'Invalid credentials';
    return { error: new Error(message), rawError: data.error };
  }
  if (!res.ok) {
    return { error: new Error('INVALID_RESPONSE'), rawError: { message: `HTTP ${res.status}`, status: res.status } };
  }
  if (!data.localId) {
    return { error: new Error('INVALID_RESPONSE'), rawError: { message: 'No localId in response' } };
  }
  return { uid: data.localId };
}

// @desc    Register new user (Firebase Auth + Firestore)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  console.log('📬 [authController.register] Incoming request body:', { email: req.body?.email, name: req.body?.name });
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await User.register({ name: name.trim(), email, password });
    const token = generateToken(user.id);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userToResponse(user)
    });
  } catch (error) {
    const msg = error.message || 'Server error';
    if (process.env.NODE_ENV !== 'production') console.error('Register error:', msg, error);
    if (error.code === 'auth/email-already-exists' || msg.toLowerCase().includes('already')) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? undefined : msg
    });
  }
};

// @desc    Login (accepts idToken from client OR email+password via REST)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, idToken } = req.body;

    let uid = null;

    // Path 1: Frontend sent Firebase idToken (works even when API key is restricted)
    if (idToken && typeof idToken === 'string' && idToken.trim()) {
      try {
        const decoded = await auth.verifyIdToken(idToken.trim());
        uid = decoded.uid;
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('Login idToken verify error:', err.message);
        return res.status(401).json({ success: false, message: 'Invalid or expired token. Try logging in again.' });
      }
    }

    // Path 2: Email + password (backend calls Firebase REST API)
    if (!uid) {
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password, or idToken from Firebase'
        });
      }
      const normEmail = email.toLowerCase().trim();
      const { uid: restUid, error: signInError, rawError } = await firebaseSignIn(normEmail, password);

      if (signInError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Login Firebase error:', rawError || signInError.message);
        }
        const m = (signInError.message || '').toUpperCase();
        let msg = 'Invalid email or password.';
        if (signInError.message === 'MISSING_API_KEY' || (rawError && (rawError.message || '').includes('FIREBASE_API_KEY'))) {
          msg = 'Login not configured. Ask admin to set FIREBASE_API_KEY in backend .env.';
        } else if (signInError.message === 'NETWORK_ERROR') {
          msg = 'Cannot reach login service. Try again later.';
        } else if (m.includes('API KEY') || m.includes('KEY_NOT_VALID') || m.includes('INVALID_KEY')) {
          msg = 'Login service misconfigured. Set FIREBASE_API_KEY in backend .env and ensure the key has no HTTP referrer restriction.';
        } else if (signInError.message.includes('EMAIL_NOT_VERIFIED')) {
          msg = 'Please confirm your email first. Check your inbox (and spam).';
        } else if (m.includes('EMAIL_NOT_FOUND') || m.includes('INVALID_LOGIN_CREDENTIALS') || m.includes('INVALID_PASSWORD') || m.includes('INVALID_CREDENTIALS')) {
          msg = 'No account with this email. Please Sign up first, then log in.';
        }
        return res.status(401).json({ success: false, message: msg });
      }
      uid = restUid;
    }

    let user = await User.findById(uid);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Profile not found. Please try signing up again or contact support.' });
    }
    if (user.status === 'disabled' || !user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    const token = generateToken(uid);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userToResponse(user)
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Login error:', error.message);
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
};

// @desc    Get current user (Firestore)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        ...userToResponse(user),
        username: user.username || '',
        website: user.website || '',
        bio: user.bio || ''
      }
    });
  } catch (error) {
    res.status(404).json({ success: false, message: 'User not found' });
  }
};

exports.logout = (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: 'Logged out' });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, username, website, bio } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (username !== undefined) updates.username = username;
    if (website !== undefined) updates.website = website;
    if (bio !== undefined) updates.bio = bio;

    if (Object.keys(updates).length > 0) {
      await User.update(req.user.id, updates);
    }

    const user = await User.get(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userToResponse(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.get(req.user.id);
    const valid = await User.verifyPassword(user.email, currentPassword);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    await User.updatePassword(req.user.id, newPassword);
    const token = generateToken(req.user.id);
    setAuthCookie(res, token);
    res.status(200).json({ success: true, message: 'Password changed successfully', token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    const user = await User.findByEmail(email);
    if (user) {
      await PasswordReset.create(user.id, user.email);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Password reset token created for', user.email);
      }
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, you will receive instructions to reset your password.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide token and new password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const record = await PasswordReset.findByToken(token);
    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    if (new Date(record.expiresAt) < new Date()) {
      await PasswordReset.deleteByDocId(record.id);
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }

    await User.updatePassword(record.userId, newPassword);
    await PasswordReset.deleteByDocId(record.id);

    res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
