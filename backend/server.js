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
  console.error('❌ .env file is empty. Add JWT_SECRET, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (e.g. backend/.env).');
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
const { auth } = require('./config/firebase');

const app = express();

// Initialize Firebase (import ensures env is valid)
void auth;
const hasLoginKey = !!((process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '').trim());
if (!hasLoginKey) console.warn('⚠️ Login API key missing. Set FIREBASE_API_KEY in backend .env for /api/auth/login.');

// Security & logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Middleware – CORS with credentials so browser sends cookies (frontend port may differ)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limit for auth (stricter in production; relaxed in dev so you can retry)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: { success: false, message: 'Too many attempts, please try again later' }
});
app.use('/api/auth', authLimiter);

// Health check – para malaman kung naka-integrate / tumatakbo ang backend
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend running', timestamp: new Date().toISOString() });
});

// Debug: Firebase connectivity
app.get('/api/debug/db-state', async (req, res) => {
  try {
    const list = await require('./config/firebase').db.collection('users').limit(1).get();
    res.json({ ok: true, checks: { firebase: 'connected', usersCount: list.size } });
  } catch (e) {
    res.json({ ok: true, checks: { firebase: 'error', error: e.message } });
  }
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
    database: 'Firebase (Auth + Firestore)',
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
  console.log('🔥 Database: Firebase (Auth + Firestore)');
  console.log(`🔑 Login API key: ${hasLoginKey ? 'set' : 'MISSING — set FIREBASE_API_KEY in .env'}`);
  console.log('========================================');
  console.log('📝 API: /api/auth | /api/users | /api/pages | /api/posts');
  console.log('       /api/dashboard | /api/products | /api/orders');
  console.log('       /api/templates | /api/domains');
  console.log('========================================');
});

module.exports = app;