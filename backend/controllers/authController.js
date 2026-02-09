// controllers/authController.js
// Auth via Supabase Auth — profile data in profiles table
const { supabase, supabaseAdmin } = require('../config/supabase');
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

// @desc    Register new user (Supabase Auth → trigger creates profile)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7252/ingest/54096819-82ad-4e94-be52-c4b24bc3f513',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authController.js:register',message:'register entry',data:{hasName:!!req.body?.name,hasEmail:!!req.body?.email,hasPassword:!!req.body?.password},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Frontend base URL for confirmation email redirect (user lands on /auth/confirm after clicking link)
    const frontendOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
    const confirmRedirectUrl = `${frontendOrigin.replace(/\/$/, '')}/auth/confirm`;

    // Sign up via Supabase Auth (trigger auto-creates profile)
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: confirmRedirectUrl
      }
    });

    // #region agent log
    fetch('http://127.0.0.1:7252/ingest/54096819-82ad-4e94-be52-c4b24bc3f513',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authController.js:after signUp',message:'signUp result',data:{hasError:!!authErr,errorMessage:authErr?.message,errorCode:authErr?.code,errorStatus:authErr?.status,authUserId:authData?.user?.id,errorKeys:authErr?Object.keys(authErr):[]},timestamp:Date.now(),hypothesisId:'B,E'})}).catch(()=>{});
    // #endregion

    if (authErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Register error:', authErr.message, authErr.status, JSON.stringify(authErr));
      }
      // #region agent log
      fetch('http://127.0.0.1:7252/ingest/54096819-82ad-4e94-be52-c4b24bc3f513',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authController.js:authErr branch',message:'error branch',data:{msgIncludesAlready:authErr.message.includes('already'),msgIncludesDbError:authErr.message.includes('Database error')},timestamp:Date.now(),hypothesisId:'A,E'})}).catch(()=>{});
      // #endregion
      if (authErr.message.includes('already')) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }
      if (authErr.message.includes('Database error')) {
        return res.status(500).json({
          success: false,
          message: 'Database trigger error. In Supabase SQL Editor run: backend/supabase/drop-auth-trigger.sql (then try registering again).',
          error: process.env.NODE_ENV === 'production' ? undefined : authErr.message
        });
      }
      return res.status(400).json({ success: false, message: authErr.message });
    }

    const uid = authData.user.id;

    // #region agent log
    fetch('http://127.0.0.1:7252/ingest/54096819-82ad-4e94-be52-c4b24bc3f513',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authController.js:before profile fetch',message:'no authErr',data:{uid},timestamp:Date.now(),hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion

    // Small delay for trigger to complete, then fetch profile
    await new Promise(r => setTimeout(r, 300));
    let user = await User.findById(uid);

    // If trigger didn't create profile (e.g. trigger disabled or failed), create it from backend
    if (!user) {
      const meta = authData.user.user_metadata || {};
      const { error: insertErr } = await supabaseAdmin.from('profiles').insert({
        id: uid,
        email: authData.user.email || '',
        full_name: (meta.full_name || name || '').trim() || '',
        avatar_url: meta.avatar_url || null,
        role: 'client',
        subscription_plan: 'free'
      });
      if (insertErr && process.env.NODE_ENV !== 'production') {
        console.error('Register: fallback profile insert failed', insertErr.message, insertErr);
      }
      user = insertErr ? null : await User.findById(uid);
    }

    // #region agent log
    fetch('http://127.0.0.1:7252/ingest/54096819-82ad-4e94-be52-c4b24bc3f513',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authController.js:after User.findById',message:'profile fetch',data:{uid,profileFound:!!user},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    const token = generateToken(uid);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userToResponse(user)
    });
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7252/ingest/54096819-82ad-4e94-be52-c4b24bc3f513',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authController.js:register catch',message:'register exception',data:{message:error?.message,name:error?.name},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const msg = error.message || 'Server error';
    if (process.env.NODE_ENV !== 'production') console.error('Register error:', msg, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? undefined : msg
    });
  }
};

// @desc    Login user (Supabase Auth email + password)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const normEmail = email.toLowerCase().trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normEmail,
      password
    });

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Login Supabase error:', error.message, error.status);
      }
      const msg = error.message && error.message.includes('Email not confirmed')
        ? 'Please confirm your email first. Check your inbox (and spam).'
        : 'Invalid email or password.';
      return res.status(401).json({ success: false, message: msg });
    }

    const uid = data.user.id;
    let user = await User.findById(uid);
    if (!user) {
      // Profile missing (e.g. trigger was disabled at signup) — create it now
      const meta = data.user.user_metadata || {};
      const { error: insertErr } = await supabaseAdmin.from('profiles').insert({
        id: uid,
        email: data.user.email || normEmail,
        full_name: (meta.full_name || '').trim() || data.user.email?.split('@')[0] || '',
        avatar_url: meta.avatar_url || null,
        role: 'client',
        subscription_plan: 'free'
      });
      if (!insertErr) user = await User.findById(uid);
    }
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

// @desc    Get current logged in user (from Supabase profiles)
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

// @desc    Logout – clear auth cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logout = (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: 'Logged out' });
};

// @desc    Update user profile (Supabase profiles)
// @route   PUT /api/auth/profile
// @access  Private
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

// @desc    Change password (via Supabase Auth)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    // Verify current password by attempting a sign-in
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

// @desc    Forgot password (creates token in password_resets)
// @route   POST /api/auth/forgot-password
// @access  Public
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

// @desc    Reset password with token (updates via Supabase Auth)
// @route   POST /api/auth/reset-password
// @access  Public
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
