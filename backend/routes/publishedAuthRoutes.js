const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, logout } = require('../controllers/publishedAuthController');
const { protectPublishedSiteUser } = require('../middleware/publishedSiteAuth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Published site auth API',
    endpoints: {
      register: 'POST /api/published-auth/register',
      login: 'POST /api/published-auth/login',
      getMe: 'GET /api/published-auth/me',
      logout: 'POST /api/published-auth/logout',
    },
  });
});

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, register);

router.post('/login', [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, login);

router.get('/me', protectPublishedSiteUser, getMe);
router.post('/logout', logout);

module.exports = router;
