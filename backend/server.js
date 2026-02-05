// server.js
require('dotenv').config();
const { validateEnv } = require('./config/env');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initializeFirebase } = require('./config/firebase');

const app = express();

// Initialize Firebase
initializeFirebase();

// Security & logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limit for auth (10 requests per 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again later' }
});
app.use('/api/auth', authLimiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pageRoutes = require('./routes/pageRoutes');
const postRoutes = require('./routes/postRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const templateRoutes = require('./routes/templateRoutes');
const domainRoutes = require('./routes/domainRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/domains', domainRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CMS E-commerce API with Firebase',
    database: 'Firebase Firestore',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password',
        getMe: 'GET /api/auth/me (protected)',
        updateProfile: 'PUT /api/auth/profile (protected)',
        changePassword: 'PUT /api/auth/change-password (protected)'
      },
      users: {
        getAll: 'GET /api/users (admin)',
        getById: 'GET /api/users/:id (admin)',
        create: 'POST /api/users (admin)',
        update: 'PUT /api/users/:id (admin)',
        delete: 'DELETE /api/users/:id (admin)',
        updateRole: 'PUT /api/users/:id/role (admin)',
        updateStatus: 'PUT /api/users/:id/status (admin)',
        getStats: 'GET /api/users/stats (admin)'
      },
      pages: {
        getAll: 'GET /api/pages',
        getOne: 'GET /api/pages/:idOrSlug',
        create: 'POST /api/pages (protected)',
        update: 'PUT /api/pages/:id (protected)',
        delete: 'DELETE /api/pages/:id (protected)'
      },
      posts: {
        getAll: 'GET /api/posts',
        getOne: 'GET /api/posts/:idOrSlug',
        create: 'POST /api/posts (protected)',
        update: 'PUT /api/posts/:id (protected)',
        delete: 'DELETE /api/posts/:id (protected)'
      },
      dashboard: {
        getStats: 'GET /api/dashboard/stats (admin)'
      },
      products: {
        getAll: 'GET /api/products',
        getOne: 'GET /api/products/:idOrSlug',
        create: 'POST /api/products (admin)',
        update: 'PUT /api/products/:id (admin)',
        delete: 'DELETE /api/products/:id (admin)'
      },
      orders: {
        create: 'POST /api/orders (protected)',
        getMy: 'GET /api/orders/my (protected)',
        getAll: 'GET /api/orders (admin)',
        getOne: 'GET /api/orders/:id (protected)',
        updateStatus: 'PUT /api/orders/:id/status (admin)'
      },
      templates: {
        getAll: 'GET /api/templates',
        getOne: 'GET /api/templates/:id',
        create: 'POST /api/templates (admin)',
        update: 'PUT /api/templates/:id (admin)',
        delete: 'DELETE /api/templates/:id (admin)'
      },
      domains: {
        getMy: 'GET /api/domains/my (protected)',
        getAll: 'GET /api/domains (admin)',
        getOne: 'GET /api/domains/:id (protected)',
        create: 'POST /api/domains (protected)',
        delete: 'DELETE /api/domains/:id (protected)',
        updateStatus: 'PUT /api/domains/:id/status (admin)'
      }
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 CMS E-commerce API with Firebase');
  console.log('========================================');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Server: http://localhost:${PORT}`);
  console.log(`🔥 Database: Firebase Firestore`);
  console.log('========================================');
  console.log('📝 API: /api/auth | /api/users | /api/pages | /api/posts');
  console.log('       /api/dashboard | /api/products | /api/orders');
  console.log('       /api/templates | /api/domains');
  console.log('========================================');
});

module.exports = app;