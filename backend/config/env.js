P// config/env.js - Validate required environment variables at startup
const required = [
  'JWT_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const optional = ['FIREBASE_DATABASE_URL', 'PORT', 'NODE_ENV'];

const validateEnv = () => {
  const missing = required.filter(key => !process.env[key] || (key === 'FIREBASE_PRIVATE_KEY' && process.env[key].trim() === ''));
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
  return true;
};

module.exports = { validateEnv };
