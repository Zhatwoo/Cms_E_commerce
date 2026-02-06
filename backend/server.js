// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeFirebase } = require('./config/firebase');

const app = express();

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'User/Admin API with Firebase',
    database: 'Firebase Firestore',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        getMe: 'GET /api/auth/me (requires token)',
        updateProfile: 'PUT /api/auth/profile (requires token)',
        changePassword: 'PUT /api/auth/change-password (requires token)'
      },
      users: {
        getAll: 'GET /api/users (admin only)',
        getById: 'GET /api/users/:id (admin only)',
        create: 'POST /api/users (admin only)',
        update: 'PUT /api/users/:id (admin only)',
        delete: 'DELETE /api/users/:id (admin only)',
        updateRole: 'PUT /api/users/:id/role (admin only)',
        updateStatus: 'PUT /api/users/:id/status (admin only)',
        getStats: 'GET /api/users/stats (admin only)'
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
  console.log('🚀 User/Admin API Server with Firebase');
  console.log('========================================');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Server: http://localhost:${PORT}`);
  console.log(`🔥 Database: Firebase Firestore`);
  console.log('========================================');
  console.log('📝 API Endpoints:');
  console.log('   POST   /api/auth/register');
  console.log('   POST   /api/auth/login');
  console.log('   GET    /api/auth/me (protected)');
  console.log('   PUT    /api/auth/profile (protected)');
  console.log('   PUT    /api/auth/change-password (protected)');
  console.log('   GET    /api/users (admin)');
  console.log('   POST   /api/users (admin)');
  console.log('   GET    /api/users/:id (admin)');
  console.log('   PUT    /api/users/:id (admin)');
  console.log('   DELETE /api/users/:id (admin)');
  console.log('   PUT    /api/users/:id/role (admin)');
  console.log('   PUT    /api/users/:id/status (admin)');
  console.log('   GET    /api/users/stats (admin)');
  console.log('========================================');
});

module.exports = app;