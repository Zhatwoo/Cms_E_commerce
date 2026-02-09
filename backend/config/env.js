// config/env.js - Validate required environment variables at startup
const required = [
  'JWT_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const optional = ['PORT', 'NODE_ENV', 'NEXT_PUBLIC_FIREBASE_API_KEY', 'FIREBASE_API_KEY', 'CORS_ORIGIN', 'FRONTEND_URL'];

const validateEnv = () => {
  const missing = required.filter(key => {
    const val = process.env[key];
    return val === undefined || val === '';
  });
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    required.forEach(key => {
      const val = process.env[key];
      const status = val === undefined ? 'undefined' : (val === '' ? 'empty' : `set (length ${String(val).length})`);
      console.error(`   ${key}: ${status}`);
    });
    process.exit(1);
  }
  return true;
};

module.exports = { validateEnv };
