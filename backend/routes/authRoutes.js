// routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const {
  register,
  registerAdmin,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// GET /api/auth – list auth endpoints (avoids 404 when hitting base path)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API',
    endpoints: {
      register: 'POST /api/auth/register',
      registerAdmin: 'POST /api/auth/register-admin',
      login: 'POST /api/auth/login',
      forgotPassword: 'POST /api/auth/forgot-password',
      resetPassword: 'POST /api/auth/reset-password',
      getMe: 'GET /api/auth/me (Authorization: Bearer <token>)',
      updateProfile: 'PUT /api/auth/profile',
      changePassword: 'PUT /api/auth/change-password'
    }
  });
});

// Public routes
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, register);

// Register Super Admin (no auth; used from /admindashboard/register). Saves to Firestore user/roles/super_admin
router.post('/register-admin', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, registerAdmin);

// Login: either idToken (from Firebase client) or email + password (backend REST)
router.post('/login', [
  body('idToken').optional().isString().trim(),
  body('email').optional().trim().isEmail().withMessage('Valid email is required'),
  body('password').optional().notEmpty().withMessage('Password is required')
], validate, login);

router.post('/forgot-password', [
  body('email').trim().isEmail().withMessage('Valid email is required')
], validate, forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, resetPassword);

router.post('/logout', logout);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], validate, changePassword);

module.exports = router;