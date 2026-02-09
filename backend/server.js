// server.js
const path = require('path');
const fs = require('fs');

// Load backend/.env manually (works even when dotenv fails with encoding/special chars)
const envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at:', envPath);
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf8');
if (!envContent || envContent.trim().length === 0) {
  console.error('❌ .env file is empty. Add JWT_SECRET, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY and save the file (e.g. backend/.env).');
  process.exit(1);
}
// Parse .env with support for multi-line quoted values (e.g. FIREBASE_PRIVATE_KEY)
const lines = envContent.split(/\r?\n/);
let i = 0;
while (i < lines.length) {
  const line = lines[i];
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) { i++; continue; }
  const eq = trimmed.indexOf('=');
  if (eq <= 0) { i++; continue; }
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  const quote = value.startsWith('"') ? '"' : value.startsWith("'") ? "'" : null;
  if (quote && (value.length === 1 || !value.endsWith(quote))) {
    // Multi-line: collect lines until closing quote
    value = value.slice(1);
    while (i < lines.length) {
      i++;
      const next = i < lines.length ? lines[i] : '';
      const endQuote = next.indexOf(quote);
      if (endQuote >= 0) {
        value += '\n' + next.slice(0, endQuote);
        i++;
        break;
      }
      value += '\n' + next;
    }
  } else if (quote && value.endsWith(quote)) {
    value = value.slice(1, -1);
    i++;
  } else {
    i++;
  }
  if (quote) value = value.replace(/\\n/g, '\n');
  process.env[key] = value;
}
const { validateEnv } = require('./config/env');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { initializeFirebase } = require('./config/firebase');

const app = express();

// Initialize Firebase
initializeFirebase();

// Security & logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Middleware – CORS with credentials so browser sends cookies (frontend port may differ)
const frontendOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limit for auth (10 requests per 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again later' }
});
app.use('/api/auth', authLimiter);

// Health check – para malaman kung naka-integrate / tumatakbo ang backend
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend running', timestamp: new Date().toISOString() });
});

// Firebase client config (from backend .env) – para iisa ang source, frontend dito kumukuha
app.get('/api/config/firebase', (req, res) => {
  res.json({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_CLIENT_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || ''
  });
});

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
        logout: 'POST /api/auth/logout',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password',
        getMe: 'GET /api/auth/me (protected, cookie or Bearer)',
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
    message: 'Route not found',
    requested: req.method + ' ' + req.originalUrl,
    try: 'GET / or GET /api/health for API info'
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