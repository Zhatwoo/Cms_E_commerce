
const { auth } = require('../config/firebase');
const PasswordReset = require('../models/PasswordReset');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { uploadAvatar, slugPathSegment, deleteAvatarByUrlForUser, getStoragePathFromUrl } = require('../utils/storageHelpers');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Audit = require('../models/Audit');
const stripeService = require('../services/stripeService');
const Notification = require('../models/Notification');

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

/** No user cookie: confidential data (email, name) must not appear in cookies or localStorage. */
const userToResponse = (user, firebaseUser = null) => {
  if (!user) return null;
  // Use Firestore value as primary, fall back to Firebase Auth if provided
  const emailVerified = firebaseUser ? firebaseUser.emailVerified : (user.emailVerified || false);
  
  return {
    id: user.id,
    uid: user.uid || user.id,
    email: user.email,
    name: user.displayName || user.fullName || user.email || '',
    avatar: user.avatar || null,
    username: user.username || '',
    website: user.website || '',
    bio: user.bio || '',
    role: user.role,
    subscriptionPlan: user.subscriptionPlan,
    createdAt: user.createdAt,
    lastSeen: user.lastSeen || null,
    paymentMethods: user.paymentMethods || [],
    emailVerified,
    phone: user.phone || '',
    notificationPreferences: user.notificationPreferences || { securityAlerts: true, sessionNotifications: true, accountUpdates: true },
    lastPasswordChange: firebaseUser?.metadata?.lastPasswordUpdatedAt ? new Date(firebaseUser.metadata.lastPasswordUpdatedAt).toISOString() : user.createdAt
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

// @desc    Register: create user in Firebase (emailVerified: false), send verification email. User can't login until email confirmed.
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

    const normEmail = email.toLowerCase().trim();
    const existingUser = await User.findByEmail(normEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Create user in Firebase immediately (emailVerified: false - can't login until confirmed)
    const user = await User.register({ name: name.trim(), email: normEmail, password });
    
    // Broadcast to Admins: New User Signed Up
    try {
      if (req.app.get('io')) {
        const notif = await Notification.create({
          title: 'New User Registered',
          message: `${name.trim()} (${normEmail}) just created an account.`,
          type: 'info',
          adminId: 'system',
          adminName: name.trim()
        });
        req.app.get('io').emit('notification:added', notif);
      }
    } catch (e) {
      console.warn('Register notification failed:', e.message);
    }

    // Generate verification token (JWT with user ID and email)
    const verificationToken = jwt.sign(
      { userId: user.id, email: normEmail, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send confirmation email to user's email address
    const { sent, confirmUrl } = await sendVerificationEmail(normEmail, verificationToken, name.trim() || normEmail.split('@')[0]);

    if (confirmUrl) {
      console.log('📬 [register] Confirmation link (copy if email not received):', confirmUrl);
    }

    const payload = {
      success: true,
      message: sent
        ? 'Welcome to Mercato! Please check your email to confirm your account. After confirming, you can log in.'
        : 'Account created. Check your email to confirm (or see server console for the link).',
      requiresVerification: true
    };
    if (confirmUrl && process.env.NODE_ENV !== 'production') {
      payload.confirmUrl = confirmUrl;
    }
    res.status(201).json(payload);
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

// @desc    Resend verification email (for unverified user by email)
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const email = (req.body?.email || '').toString().trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists for this email, we sent a new confirmation link.'
      });
    }

    const verificationToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const name = user.displayName || user.fullName || (user.email || '').split('@')[0];
    await sendVerificationEmail(user.email, verificationToken, name);

    res.status(200).json({
      success: true,
      message: 'A new confirmation link was sent to your email.'
    });
  } catch (error) {
    const msg = error.message || 'Server error';
    if (process.env.NODE_ENV !== 'production') console.error('Resend verification error:', msg, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Register first Super Admin (public, no auth required) — data saved to Firestore user/roles/super_admin
// @route   POST /api/auth/register-admin
// @access  Public (for first-time setup only when no super_admin exists)
exports.registerAdmin = async (req, res) => {
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

    const existingUser = await User.findByEmail(email.trim().toLowerCase());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'super_admin',
      status: 'Published',
    });

    const token = generateToken(user.id);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Super Admin registered successfully',
      user: userToResponse(user)
    });
  } catch (error) {
    const msg = error.message || 'Server error';
    if (process.env.NODE_ENV !== 'production') console.error('Register admin error:', msg, error);
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
    let firebaseAuthUser = null;

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
        } else if (m.includes('EMAIL_NOT_FOUND')) {
          msg = 'No account with this email. Please sign up first.';
        } else if (m.includes('INVALID_PASSWORD')) {
          msg = 'Incorrect password. Please try again.';
        } else if (m.includes('INVALID_LOGIN_CREDENTIALS') || m.includes('INVALID_CREDENTIALS')) {
          const existingUser = await User.findByEmail(normEmail);
          msg = existingUser
            ? 'Incorrect password. Please try again.'
            : 'No account with this email. Please sign up first.';
        }
        return res.status(401).json({ success: false, message: msg });
      }
      uid = restUid;
    }

    let user = await User.findById(uid);
    try {
      firebaseAuthUser = await auth.getUser(uid);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Login getUser error:', err.message);
    }

    const providerIds = Array.isArray(firebaseAuthUser?.providerData)
      ? firebaseAuthUser.providerData.map((provider) => provider?.providerId).filter(Boolean)
      : [];
    const isGoogleUser = providerIds.includes('google.com');
    const authEmail = (firebaseAuthUser?.email || '').toLowerCase().trim();

    if (isGoogleUser && firebaseAuthUser?.emailVerified && authEmail) {
      const existingUserWithEmail = await User.findByEmail(authEmail);
      if (existingUserWithEmail && existingUserWithEmail.id !== uid) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please use your existing login method or contact support.'
        });
      }

      user = await User.createFromFirebaseUser(firebaseAuthUser, {
        role: user?.role || 'client',
        status: user?.status || 'active',
        subscriptionPlan: user?.subscriptionPlan || 'free',
        username: user?.username || '',
        website: user?.website || '',
        bio: user?.bio || '',
        avatar: user?.avatar || firebaseAuthUser?.photoURL || null,
        isActive: user?.isActive !== false,
      });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Profile not found. Please try signing up again or contact support.' });
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

    if (!firebaseAuthUser) {
      return res.status(401).json({ success: false, message: 'Could not load authentication profile. Please try logging in again.' });
    }

    if (!firebaseAuthUser.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please confirm your email first. Check your inbox (and spam) for the confirmation link.'
      });
    }

    const token = generateToken(uid);
    setAuthCookie(res, token);

    // Update lastSeen immediately on login
    await User.update(uid, { lastSeen: new Date().toISOString() }).catch(() => {});

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

// @desc    Verify email: verify JWT token from email link, set emailVerified: true, auto-login user.
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token: verificationToken } = req.body;
    if (!verificationToken || typeof verificationToken !== 'string') {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    // Verify JWT token (no database lookup needed - token contains user info)
    let decoded;
    try {
      decoded = jwt.verify(verificationToken.trim(), process.env.JWT_SECRET);
      if (decoded.type !== 'email_verification' || !decoded.userId || !decoded.email) {
        return res.status(400).json({ success: false, message: 'Invalid verification token' });
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ success: false, message: 'Verification link has expired' });
      }
      return res.status(400).json({ success: false, message: 'Invalid verification link' });
    }

    // Find user by ID from token
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }
    if (user.email.toLowerCase() !== decoded.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Email mismatch' });
    }

    // Verify email in Firebase Auth
    await User.setEmailVerified(user.id);

    // Fetch updated firebase user to include verified status in response
    let firebaseUser = null;
    try {
      firebaseUser = await auth.getUser(user.id);
    } catch (e) {
      console.warn('verifyEmail: could not fetch updated firebase user:', e.message);
    }

    // Auto-login: create session token
    const authToken = generateToken(user.id);
    setAuthCookie(res, authToken);

    res.status(200).json({
      success: true,
      message: 'Email confirmed! You are now logged in.',
      user: userToResponse(user, firebaseUser),
      token: authToken
    });
  } catch (error) {
    const msg = error.message || 'Server error';
    if (process.env.NODE_ENV !== 'production') console.error('Verify email error:', msg, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Firebase custom token so frontend can sign in to Firebase Auth (e.g. for Storage uploads)
// @route   GET /api/auth/firebase-custom-token
// @access  Private
exports.getFirebaseCustomToken = async (req, res) => {
  try {
    const uid = req.user.id;
    const customToken = await auth.createCustomToken(uid);
    res.status(200).json({ success: true, customToken });
  } catch (error) {
    console.error('getFirebaseCustomToken error:', error);
    res.status(500).json({ success: false, message: 'Failed to create Firebase token', error: error.message });
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
    let firebaseUser = null;
    try {
      firebaseUser = await auth.getUser(req.user.id);
      
      // Auto-sync: If Firebase says verified but Firestore doesn't know yet, update Firestore
      if (firebaseUser?.emailVerified && !user.emailVerified) {
        await User.update(user.id, { emailVerified: true }).catch(() => {});
        user.emailVerified = true;
      }
    } catch (e) {
      console.warn('getMe: could not fetch firebase user:', e.message);
    }
    res.status(200).json({
      success: true,
      user: userToResponse(user, firebaseUser)
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
    const { name, avatar, username, website, bio, paymentMethods, notificationPreferences, phone } = req.body;
    if (avatar !== undefined && typeof avatar === 'string' && avatar.trim().startsWith('data:')) {
      return res.status(400).json({
        success: false,
        message: 'Avatar must be a Storage URL. Upload the image first; do not send base64.'
      });
    }
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (username !== undefined) updates.username = username;
    if (website !== undefined) updates.website = website;
    if (bio !== undefined) updates.bio = bio;
    if (phone !== undefined) updates.phone = phone;
    if (paymentMethods !== undefined) updates.paymentMethods = paymentMethods;
    if (notificationPreferences !== undefined) updates.notificationPreferences = notificationPreferences;

    if (Object.keys(updates).length > 0) {
      if (phone !== undefined) {
        Audit.log('profile_security_update', `Changed recovery phone to: ${phone}`, req.user.id, req.user?.name || req.user?.displayName);
      }
      const updatedUser = await User.update(req.user.id, updates);
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: userToResponse(updatedUser)
      });
    }

    // If no updates were provided, return the current user object
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: userToResponse(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Upload avatar: multipart file -> Storage at
 * Clients/profile_picture/{username}/profile-{uid} -> save URL in Firestore.
 * Replacing avatar keeps only one stored profile image per user.
 * @route POST /api/auth/avatar
 * @access Private
 */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Use field name "avatar".' });
    }
    const uid = req.user.id;
    const mimeType = req.file.mimetype || 'image/png';
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'File must be an image.' });
    }
    const user = await User.get(uid);
    const fallbackUsername = typeof user?.email === 'string' ? user.email.split('@')[0] : '';
    const usernameSegment = slugPathSegment(user?.username || fallbackUsername || user?.displayName || uid);
    const previousAvatarUrl = typeof user?.avatar === 'string' ? user.avatar : '';
    const url = await uploadAvatar(req.file.buffer, uid, mimeType, usernameSegment);
    await User.update(uid, { avatar: url });
    if (previousAvatarUrl && previousAvatarUrl !== url) {
      // Deterministic avatar path means old/new URLs can differ only by token while pointing to same object.
      // Skip delete when both URLs resolve to the same storage object to avoid deleting the freshly uploaded file.
      const newAvatarPath = getStoragePathFromUrl(url);
      await deleteAvatarByUrlForUser(previousAvatarUrl, uid, { skipObjectPath: newAvatarPath || '' });
    }
    const updatedUser = await User.get(uid);
    res.status(200).json({
      success: true,
      message: 'Avatar uploaded',
      url,
      user: userToResponse(updatedUser)
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('uploadAvatar error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed'
    });
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

    const normEmail = email.toLowerCase().trim();
    let user = await User.findByEmail(normEmail);

    // Fallback: user might exist in Firebase Auth but not in Firestore (legacy/edge case)
    if (!user) {
      try {
        const authUser = await auth.getUserByEmail(normEmail);
        user = { id: authUser.uid, email: authUser.email, displayName: authUser.displayName || '' };
        if (process.env.NODE_ENV !== 'production') {
          console.log('[forgotPassword] User found via Firebase Auth (not Firestore):', normEmail);
        }
      } catch (_) {
        // No user found in Firebase Auth either
      }
    }

    let resetUrl = null;
    if (user) {
      const { token } = await PasswordReset.create(user.id, user.email);
      resetUrl = `${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '')}/auth/reset-password?token=${encodeURIComponent(token)}`;

      const { sent, error: sendError } = await sendPasswordResetEmail(
        user.email,
        token,
        user.displayName || user.email?.split('@')[0] || ''
      );

      if (process.env.NODE_ENV !== 'production') {
        console.log('[forgotPassword] Email sent:', sent, '| To:', user.email, sendError ? `| Error: ${sendError}` : '');
        if (!sent) console.log('[forgotPassword] Reset link (copy if email failed):', resetUrl);
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('[forgotPassword] No user found for email:', normEmail);
    }

    const payload = {
      success: true,
      message: 'If an account exists with that email, you will receive instructions to reset your password.'
    };
    // In development: include reset link so user can click even if email doesn't arrive
    if (resetUrl && process.env.NODE_ENV !== 'production') {
      payload.resetUrl = resetUrl;
    }
    res.status(200).json(payload);
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
exports.createStripeSetupIntent = async (req, res) => {
  try {
    const setupIntent = await stripeService.createSetupIntent({
      userId: req.user.id
    });
    res.json({
      success: true,
      clientSecret: setupIntent.client_secret
    });
  } catch (error) {
    console.error('Setup Intent Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create setup intent' 
    });
  }
};

exports.getStripePublicKey = async (req, res) => {
  try {
    const publicKey = process.env.STRIPE_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(400).json({ success: false, message: 'Stripe Public Key is not configured' });
    }
    res.json({ success: true, publicKey });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
